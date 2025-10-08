# 🛡️ Soluzioni Frontend per Bug Reserve Auction

## 📋 Strategie senza modificare il contratto

### **1. 🚫 PREVENZIONE: Bloccare settleAuction sotto riserva**

```typescript
// In hooks/useAuctionClaim.ts
export function useAuctionClaim() {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();

  const claimAuction = useCallback(
    async (auctionId: number) => {
      try {
        // ✅ CONTROLLO PREVENTIVO: Verifica se è Reserve Auction sotto riserva
        const auction = await getAuction(auctionId);

        if (auction.auctionType === AuctionType.RESERVE) {
          const winningBid = BigInt(auction.highestBid);
          const reservePrice = BigInt(auction.reservePrice);

          if (winningBid < reservePrice) {
            // ❌ BLOCCA il claim se sotto riserva
            throw new Error(
              `🚫 Cannot claim Reserve Auction #${auctionId}: ` +
                `Winning bid (${ethers.formatEther(winningBid)} ETH) ` +
                `is below reserve price (${ethers.formatEther(
                  reservePrice
                )} ETH)`
            );
          }
        }

        // ✅ Procedi solo se sopra riserva o non è Reserve Auction
        writeContract({
          address: contracts.MooveAuction.address,
          abi: contracts.MooveAuction.abi,
          functionName: "settleAuction",
          args: [auctionId],
        });
      } catch (error) {
        console.error("❌ Claim blocked:", error);
        throw error;
      }
    },
    [address, writeContract]
  );

  return { claimAuction };
}
```

### **2. 🔍 MONITORAGGIO: Rilevamento automatico**

```typescript
// In providers/AuctionNotificationsProvider.tsx
const checkReserveAuctionViolations = useCallback(async () => {
  if (!address || !isConnected) return;

  try {
    // Trova tutte le Reserve Auction ENDED ma non SETTLED
    const endedAuctions = await getEndedAuctions();

    for (const auction of endedAuctions) {
      if (auction.auctionType === AuctionType.RESERVE) {
        const winningBid = BigInt(auction.highestBid);
        const reservePrice = BigInt(auction.reservePrice);

        if (winningBid < reservePrice) {
          // 🚨 ASTA SOTTO RISERVA RILEVATA
          console.warn(
            `🚨 Reserve Auction #${auction.auctionId} ended below reserve!`
          );

          // Notifica al seller
          if (auction.seller.toLowerCase() === address.toLowerCase()) {
            addNotification({
              id: `reserve-violation-${auction.auctionId}`,
              type: "error",
              message: `🚨 CRITICAL: Auction #${auction.auctionId} ended below reserve price!`,
              description: `Winning bid: ${ethers.formatEther(
                winningBid
              )} ETH < Reserve: ${ethers.formatEther(reservePrice)} ETH`,
              auctionId: auction.auctionId,
              timestamp: Date.now(),
              priority: "high",
              action: "contact-admin",
            });
          }

          // Notifica al vincitore (che non dovrebbe claimare)
          if (auction.highestBidder.toLowerCase() === address.toLowerCase()) {
            addNotification({
              id: `reserve-warning-${auction.auctionId}`,
              type: "warning",
              message: `⚠️ Auction #${auction.auctionId} ended below reserve price`,
              description: `Your bid will be refunded. Do not claim this auction.`,
              auctionId: auction.auctionId,
              timestamp: Date.now(),
              priority: "medium",
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Error checking reserve violations:", error);
  }
}, [address, isConnected, addNotification]);

// Esegui controllo ogni 30 secondi
useEffect(() => {
  const interval = setInterval(checkReserveAuctionViolations, 30000);
  return () => clearInterval(interval);
}, [checkReserveAuctionViolations]);
```

### **3. 🎯 UI PROTETTA: Interfaccia intelligente**

```typescript
// In components/auctions/AuctionModal.tsx
const ReserveAuctionWarning = ({ auction }: { auction: Auction }) => {
  const isReserveAuction = auction.auctionType === AuctionType.RESERVE;
  const isEnded = auction.status === AuctionStatus.ENDED;
  const isBelowReserve =
    isReserveAuction &&
    BigInt(auction.highestBid) < BigInt(auction.reservePrice);

  if (!isReserveAuction || !isEnded) return null;

  return (
    <div
      className={`p-4 rounded-lg mb-4 ${
        isBelowReserve
          ? "bg-red-50 border border-red-200"
          : "bg-green-50 border border-green-200"
      }`}
    >
      <div className="flex items-center">
        {isBelowReserve ? (
          <>
            <span className="text-red-600 text-xl mr-2">🚨</span>
            <div>
              <h3 className="text-red-800 font-semibold">
                Reserve Price Not Met
              </h3>
              <p className="text-red-700 text-sm">
                This auction ended below the reserve price of{" "}
                {auction.reservePrice} ETH. The NFT should be returned to the
                seller.
              </p>
              <p className="text-red-600 text-xs mt-1">
                ⚠️ Do not claim this auction - contact admin immediately.
              </p>
            </div>
          </>
        ) : (
          <>
            <span className="text-green-600 text-xl mr-2">✅</span>
            <div>
              <h3 className="text-green-800 font-semibold">
                Reserve Price Met
              </h3>
              <p className="text-green-700 text-sm">
                This auction successfully met the reserve price of{" "}
                {auction.reservePrice} ETH. Safe to claim.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Nel componente principale
export default function AuctionModal({ auction, isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Warning per Reserve Auction */}
      <ReserveAuctionWarning auction={auction} />

      {/* Resto del contenuto */}
      {/* ... */}
    </Modal>
  );
}
```

### **4. 🔒 HOOK PROTETTO: useReserveAuctionClaim**

```typescript
// hooks/useReserveAuctionClaim.ts
export function useReserveAuctionClaim() {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const [isChecking, setIsChecking] = useState(false);
  const [canClaim, setCanClaim] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkClaimEligibility = useCallback(async (auctionId: number) => {
    setIsChecking(true);
    setError(null);

    try {
      const auction = await getAuction(auctionId);

      if (auction.auctionType !== AuctionType.RESERVE) {
        setCanClaim(true);
        return;
      }

      const winningBid = BigInt(auction.highestBid);
      const reservePrice = BigInt(auction.reservePrice);

      if (winningBid < reservePrice) {
        setCanClaim(false);
        setError(
          `Reserve price not met: ${ethers.formatEther(
            winningBid
          )} ETH < ${ethers.formatEther(reservePrice)} ETH`
        );
        return;
      }

      setCanClaim(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setCanClaim(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const claimAuction = useCallback(
    async (auctionId: number) => {
      if (canClaim === false) {
        throw new Error("Cannot claim: Reserve price not met");
      }

      if (canClaim === null) {
        await checkClaimEligibility(auctionId);
        if (canClaim === false) {
          throw new Error("Cannot claim: Reserve price not met");
        }
      }

      writeContract({
        address: contracts.MooveAuction.address,
        abi: contracts.MooveAuction.abi,
        functionName: "settleAuction",
        args: [auctionId],
      });
    },
    [canClaim, checkClaimEligibility, writeContract]
  );

  return {
    claimAuction,
    checkClaimEligibility,
    canClaim,
    isChecking,
    error,
  };
}
```

### **5. 📊 ADMIN DASHBOARD: Monitoraggio centralizzato**

```typescript
// components/admin/ReserveAuctionMonitor.tsx
export default function ReserveAuctionMonitor() {
  const [violations, setViolations] = useState<ReserveViolation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const checkViolations = useCallback(async () => {
    setIsLoading(true);
    try {
      const auctions = await getAllAuctions();
      const violations = auctions
        .filter(
          (auction) =>
            auction.auctionType === AuctionType.RESERVE &&
            auction.status === AuctionStatus.ENDED &&
            BigInt(auction.highestBid) < BigInt(auction.reservePrice)
        )
        .map((auction) => ({
          auctionId: auction.auctionId,
          seller: auction.seller,
          highestBidder: auction.highestBidder,
          highestBid: auction.highestBid,
          reservePrice: auction.reservePrice,
          endTime: auction.endTime,
          nftId: auction.tokenId,
        }));

      setViolations(violations);
    } catch (error) {
      console.error("Error checking violations:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkViolations();
    const interval = setInterval(checkViolations, 60000); // Ogni minuto
    return () => clearInterval(interval);
  }, [checkViolations]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">🚨 Reserve Auction Violations</h2>

      {isLoading ? (
        <div>Loading...</div>
      ) : violations.length === 0 ? (
        <div className="text-green-600">✅ No violations found</div>
      ) : (
        <div className="space-y-4">
          {violations.map((violation) => (
            <div
              key={violation.auctionId}
              className="bg-red-50 border border-red-200 p-4 rounded"
            >
              <h3 className="font-semibold text-red-800">
                Auction #{violation.auctionId} - NFT #{violation.nftId}
              </h3>
              <div className="text-sm text-red-700 mt-2">
                <p>Seller: {violation.seller}</p>
                <p>Winner: {violation.highestBidder}</p>
                <p>
                  Winning Bid: {ethers.formatEther(violation.highestBid)} ETH
                </p>
                <p>
                  Reserve Price: {ethers.formatEther(violation.reservePrice)}{" "}
                  ETH
                </p>
                <p>
                  Ended:{" "}
                  {new Date(Number(violation.endTime) * 1000).toLocaleString()}
                </p>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => handleViolation(violation.auctionId)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Handle Violation
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 **STRATEGIA COMPLETA:**

### **Fase 1: Prevenzione Immediata** ⚡

1. ✅ Bloccare `settleAuction` per Reserve Auction sotto riserva
2. ✅ Aggiungere controlli in `useAuctionClaim`
3. ✅ Mostrare warning nell'UI

### **Fase 2: Monitoraggio** 🔍

1. ✅ Rilevamento automatico delle violazioni
2. ✅ Notifiche immediate a seller e bidders
3. ✅ Dashboard admin per monitoraggio

### **Fase 3: Recupero** 🔄

1. ✅ Sistema di gestione manuale per admin
2. ✅ Procedure per restituire NFT al seller
3. ✅ Rimborsi automatici per tutti i bidders

---

## 📊 **VANTAGGI DELLA SOLUZIONE FRONTEND:**

### **✅ Pro:**

- 🚀 **Implementazione immediata** (no deploy contratto)
- 🛡️ **Protezione completa** degli utenti
- 📊 **Monitoraggio in tempo reale**
- 🔄 **Facilmente aggiornabile**
- 💰 **Costo zero** (no gas per deploy)

### **⚠️ Limitazioni:**

- 🎯 **Solo protezione frontend** (smart contract rimane vulnerabile)
- 🔧 **Richiede disciplina** degli sviluppatori
- 📱 **Dipende dall'UI** (utenti tecnici potrebbero bypassare)

---

## 🎯 **CONCLUSIONE:**

**La soluzione frontend è la migliore strategia immediata** per proteggere gli utenti dal bug critico, mentre si pianifica una correzione del contratto in futuro.

**Implementando tutte e 5 le strategie**, avremo:

- ✅ **Protezione completa** degli utenti
- ✅ **Monitoraggio automatico** delle violazioni
- ✅ **UI intelligente** che previene errori
- ✅ **Dashboard admin** per gestione centralizzata
- ✅ **Sistema di recupero** per casi esistenti

**Vuoi che implementi una di queste soluzioni?** 🚀

