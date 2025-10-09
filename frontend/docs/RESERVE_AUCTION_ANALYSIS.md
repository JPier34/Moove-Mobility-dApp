# 🔍 Reserve Auction - Analisi Completa

## 📋 Indice

1. [Logica del Contratto Smart](#logica-del-contratto-smart)
2. [Problema Critico Identificato](#problema-critico-identificato)
3. [Comportamento Attuale](#comportamento-attuale)
4. [Gestione Frontend](#gestione-frontend)
5. [Sistema di Notifiche](#sistema-di-notifiche)
6. [Raccomandazioni](#raccomandazioni)

---

## 🔧 Logica del Contratto Smart

### **Parametri Reserve Auction:**

```solidity
struct Auction {
    uint128 startingPrice;    // Prezzo di partenza (es. 0.00001 ETH)
    uint128 reservePrice;     // Prezzo di riserva (es. 0.0001 ETH)
    uint128 highestBid;       // Offerta più alta corrente
    address highestBidder;    // Offerente più alto
    AuctionStatus status;     // ACTIVE → ENDED → SETTLED
}
```

### **Validazione Parametri (Creazione Asta):**

```solidity
function _validateAuctionParameters() {
    if (auctionType == AuctionType.RESERVE) {
        require(
            reservePrice > startingPrice,
            "Reserve price must be > starting price for Reserve auctions"
        );
        require(buyNowPrice == 0, "Reserve auctions don't support buy now price");
    }
}
```

✅ **Validazione OK**: Il contratto richiede che `reservePrice > startingPrice`

### **Evento Reserve Reached:**

```solidity
event ReserveReached(uint256 indexed auctionId, uint256 reservePrice);

// In placeBid():
if (auction.auctionType == AuctionType.RESERVE &&
    auction.reservePrice > 0 &&
    msg.value >= auction.reservePrice) {
    emit ReserveReached(auctionId, auction.reservePrice);
    // L'asta NON termina, continua fino a endTime
}
```

✅ **Comportamento OK**: Quando la riserva è raggiunta, viene emesso un evento ma l'asta continua

---

## 🚨 PROBLEMA CRITICO IDENTIFICATO

### **❌ BUG nel contratto: `settleAuction()` NON controlla il prezzo di riserva!**

```solidity
function settleAuction(uint256 auctionId) external {
    Auction storage auction = auctions[auctionId];

    address winner = auction.highestBidder;
    uint256 winningBid = auction.highestBid;

    require(winner != address(0), "No winner found");

    // ❌ MANCA QUESTO CONTROLLO:
    // if (auction.auctionType == AuctionType.RESERVE) {
    //     require(
    //         winningBid >= auction.reservePrice,
    //         "Winning bid below reserve price"
    //     );
    // }

    // Trasferisce l'NFT anche se winningBid < reservePrice ❌
    IERC721(auction.nftContract).transferFrom(
        address(this),
        winner,
        auction.tokenId
    );

    // ... trasferisce i fondi al seller ...
}
```

### **Conseguenze del Bug:**

1. ❌ **L'NFT viene venduto sotto il prezzo di riserva**
2. ❌ **Il seller riceve meno del minimo accettabile**
3. ❌ **Non c'è protezione per il seller**
4. ❌ **L'NFT NON viene restituito all'admin**

---

## 🔍 Comportamento Attuale

### **Scenario 1: Offerta vincente >= Prezzo di Riserva** ✅

```
Reserve Auction #X
├─ Start Price: 0.00001 ETH
├─ Reserve Price: 0.0001 ETH
├─ Highest Bid: 0.00015 ETH (> reserve) ✅
├─ End Time: Expired
└─ Result:
    ├─ endAuction() → Status: ENDED
    ├─ settleAuction() → Transfers NFT to winner
    ├─ Winner receives NFT ✅
    ├─ Seller receives 0.00015 ETH (minus fees) ✅
    └─ Losing bidders refunded automatically ✅
```

### **Scenario 2: Offerta vincente < Prezzo di Riserva** ❌

```
Reserve Auction #Y
├─ Start Price: 0.00001 ETH
├─ Reserve Price: 0.0001 ETH
├─ Highest Bid: 0.00005 ETH (< reserve) ❌
├─ End Time: Expired
└─ Result ATTUALE (BUG):
    ├─ endAuction() → Status: ENDED
    ├─ settleAuction() → Transfers NFT to winner ❌
    ├─ Winner receives NFT (nonostante sotto riserva) ❌
    ├─ Seller receives 0.00005 ETH (meno del minimo) ❌
    └─ Losing bidders refunded automatically ✅

└─ Result ATTESO (CORRETTO):
    ├─ endAuction() → Status: ENDED
    ├─ settleAuction() → SHOULD FAIL ✅
    ├─ NFT returns to seller or admin ✅
    ├─ ALL bidders refunded (including highest) ✅
    └─ Auction marked as FAILED/CANCELLED ✅
```

### **Scenario 3: Nessuna Offerta** ✅

```
Reserve Auction #Z
├─ Start Price: 0.00001 ETH
├─ Reserve Price: 0.0001 ETH
├─ Highest Bid: 0 ETH (no bids)
├─ End Time: Expired
└─ Result:
    ├─ endAuction() → Status: ENDED
    ├─ settleAuction() → FAILS (require winner != address(0)) ✅
    ├─ NFT remains with contract
    └─ Admin must handle with cancelAuction() ✅
```

---

## 💻 Gestione Frontend

### **Hook `useReserveAuction.ts`:**

```typescript
const placeBidWithValidation = async (
  auctionId: number,
  bidAmount: string,
  auctionData: {
    startPrice: string;
    currentBid: string;
    bidIncrement: string;
    reservePrice: string;
  }
): Promise<boolean> => {
  const bidAmountWei = parseEther(bidAmount);
  const reservePriceWei = parseEther(auctionData.reservePrice);

  // ✅ Frontend tracking (non bloccante)
  const isUnderReservePrice = bidAmountWei < reservePriceWei;
  setIsUnderReserve(isUnderReservePrice);

  // ⚠️ Il frontend NON blocca offerte sotto riserva
  // (questo è corretto - le offerte sotto riserva sono permesse)
  placeBid(auctionId, bidAmountWei);

  return true;
};
```

✅ **Comportamento Frontend**: Il frontend permette offerte sotto la riserva (corretto), ma traccia lo stato con `isUnderReserve`

### **Validazione Creazione Asta:**

```typescript
// In useAuctionValidation.ts
[AuctionType.RESERVE]: {
  priceRules: {
    startPrice: { min: 0.000001, max: 1000, required: true },
    reservePrice: {
      min: 0.000001,
      max: 1000,
      required: true, // ✅ Reserve price obbligatorio
      mustBeGreaterThanOrEqual: "startPrice", // ✅ >= start price
    },
  },
}
```

✅ **Validazione Frontend**: Corretta, richiede che `reservePrice >= startPrice`

### **Display Prezzo di Riserva:**

```typescript
// In AuctionCard.tsx
{
  auction.auctionType === AuctionType.RESERVE && (
    <span className="text-purple-600">Reserve: {auction.reservePrice} ETH</span>
  );
}
```

✅ **UI**: Il prezzo di riserva viene mostrato all'utente

---

## 🔔 Sistema di Notifiche

### **Notifiche Attuali:**

1. **Durante l'asta:**

   - ✅ `BidPlaced` - Quando viene piazzata un'offerta
   - ✅ `ReserveReached` - Quando la riserva viene raggiunta (evento custom)
   - ✅ `BidRefunded` - Quando un'offerta precedente viene rimborsata

2. **Fine asta:**

   - ✅ `AuctionEnded` - Quando l'asta termina
   - ✅ `AuctionSettled` - Quando l'NFT viene trasferito
   - ✅ Claim notification - Al vincitore

3. **❌ Notifiche MANCANTI per Reserve sotto riserva:**
   - ❌ Nessuna notifica al seller che l'asta è fallita
   - ❌ Nessuna notifica che l'NFT è stato venduto sotto riserva
   - ❌ Nessun sistema di gestione automatica

### **Sistema di Notifiche `useUnifiedAuctionNotifications`:**

```typescript
export interface NotificationTrigger {
  notifyReserveWin: (auctionId: string, amount: number) => void;
  notifyAuctionFailed: (auctionId: string, reason: string) => void;
  notifyClaimReady: (auctionId: string) => void;
  notifyAuctionDeserted: (auctionId: string) => void;
  notifyBidRefunded: (auctionId: string, amount: number) => void;
}
```

⚠️ **Problema**: Le notifiche sono definite ma non implementate per il caso "Reserve sotto riserva"

---

## 📝 Raccomandazioni

### **1. ✅ CORREZIONE IMMEDIATA NEL CONTRATTO (Priorità ALTA):**

```solidity
function settleAuction(uint256 auctionId) external nonReentrant notSettled(auctionId) {
    Auction storage auction = auctions[auctionId];

    // ... validazioni esistenti ...

    address winner = auction.highestBidder;
    uint256 winningBid = auction.highestBid;

    require(winner != address(0), "No winner found");

    // ✅ AGGIUNGERE QUESTO CONTROLLO:
    if (auction.auctionType == AuctionType.RESERVE && auction.reservePrice > 0) {
        if (winningBid < auction.reservePrice) {
            // Offerta sotto riserva - rimborsa tutti e restituisci NFT
            _refundAllBidders(auctionId);

            // Restituisci NFT al seller
            IERC721(auction.nftContract).transferFrom(
                address(this),
                auction.seller,
                auction.tokenId
            );

            // Marca come CANCELLED
            auction.status = AuctionStatus.CANCELLED;
            auction.isSettled = true;

            emit AuctionCancelled(auctionId, "Reserve price not met");
            return;
        }
    }

    // ... resto della logica di settlement normale ...
}
```

### **2. ✅ AGGIORNAMENTO FRONTEND (Priorità MEDIA):**

```typescript
// In AuctionNotificationsProvider.tsx
const checkReserveAuctionStatus = async (auctionId: string) => {
  const auction = await getAuction(auctionId);

  if (auction.auctionType === AuctionType.RESERVE) {
    const isEnded = auction.status === AuctionStatus.ENDED;
    const isBelowReserve =
      BigInt(auction.highestBid) < BigInt(auction.reservePrice);

    if (isEnded && isBelowReserve) {
      // Notifica al seller che l'asta è fallita
      if (auction.seller.toLowerCase() === address.toLowerCase()) {
        addNotification({
          id: `reserve-failed-${auctionId}`,
          type: "warning",
          message: `⚠️ Reserve auction #${auctionId} ended below reserve price`,
          auctionId,
          timestamp: Date.now(),
        });
      }

      // Notifica agli offerenti che saranno rimborsati
      if (auction.highestBidder.toLowerCase() === address.toLowerCase()) {
        addNotification({
          id: `reserve-refund-${auctionId}`,
          type: "info",
          message: `💰 Your bid for auction #${auctionId} will be refunded (reserve not met)`,
          auctionId,
          timestamp: Date.now(),
        });
      }
    }
  }
};
```

### **3. ✅ UI MIGLIORATA (Priorità BASSA):**

```typescript
// In AuctionCard.tsx
{
  auction.auctionType === AuctionType.RESERVE && (
    <div>
      <span className="text-purple-600">
        Reserve: {auction.reservePrice} ETH
      </span>

      {/* Indicatore visivo se sotto riserva */}
      {parseFloat(auction.currentBid) < parseFloat(auction.reservePrice) && (
        <span className="text-yellow-600 text-xs ml-2">⚠️ Below reserve</span>
      )}

      {/* Indicatore visivo se sopra riserva */}
      {parseFloat(auction.currentBid) >= parseFloat(auction.reservePrice) && (
        <span className="text-green-600 text-xs ml-2">✅ Reserve met</span>
      )}
    </div>
  );
}
```

---

## 🎯 Riepilogo

### **✅ Funziona Correttamente:**

1. Validazione parametri in creazione asta (frontend + contratto)
2. Sistema di offerte (anche sotto riserva - corretto)
3. Evento `ReserveReached` quando la riserva viene raggiunta
4. Sistema di rimborsi automatici per perdenti
5. Settlement quando offerta >= riserva

### **❌ Problemi Critici:**

1. **BUG CONTRATTO**: `settleAuction()` non controlla il prezzo di riserva
2. **NFT venduto sotto riserva**: Seller riceve meno del minimo accettabile
3. **Nessun sistema di recupero**: NFT non torna all'admin/seller
4. **Notifiche mancanti**: Nessun alert per asta fallita sotto riserva

### **🔧 Azioni Richieste:**

1. **IMMEDIATA**: Modificare `settleAuction()` nel contratto per controllare la riserva
2. **MEDIA**: Aggiungere notifiche per aste sotto riserva nel frontend
3. **BASSA**: Migliorare UI per mostrare chiaramente lo stato della riserva

---

## 📊 Differenze con English Auction

| Aspetto                    | English Auction            | Reserve Auction                         |
| -------------------------- | -------------------------- | --------------------------------------- |
| **Prezzo Minimo**          | `startPrice`               | `reservePrice` (> startPrice)           |
| **Validazione Settlement** | ❌ Nessuna                 | ❌ Dovrebbe verificare riserva          |
| **Offerte sotto minimo**   | ❌ Bloccate dal contratto  | ✅ Permesse (fino a `startPrice`)       |
| **NFT sotto minimo**       | N/A (startPrice è minimo)  | ❌ **BUG**: Venduto anche sotto riserva |
| **Trasparenza prezzo**     | ✅ Visibile (`startPrice`) | ✅ Visibile (`reservePrice`)            |
| **Extension System**       | ✅ Supportato              | ❌ Non supportato                       |
| **Buy Now**                | ✅ Opzionale               | ❌ Non supportato                       |

---

## 📌 Conclusione

La **Reserve Auction** è fondamentalmente un'**English Auction con un prezzo minimo garantito** (`reservePrice`).

**Il contratto attualmente permette offerte sotto la riserva** (corretto), **ma NON impedisce il settlement sotto la riserva** (BUG CRITICO).

**Soluzione**: Aggiungere il controllo del `reservePrice` in `settleAuction()` per:

- ✅ Rimborsare tutti se sotto riserva
- ✅ Restituire NFT al seller
- ✅ Emettere evento `AuctionCancelled`

**Il sistema di notifiche deve essere aggiornato** per gestire questo caso edge e informare correttamente seller e bidders.

---

_Documento creato il: 07/10/2025_
_Versione: 1.0_



