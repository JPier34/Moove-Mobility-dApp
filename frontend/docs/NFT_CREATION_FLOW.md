# 🎨 NFT Creation Flow Analysis

## 📋 Overview

Il sistema di creazione NFT in Moove Mobility segue un flusso complesso che coinvolge:

1. **Creazione NFT** tramite smart contract
2. **Upload metadati** su IPFS
3. **Creazione asta** automatica
4. **Tracking eventi** blockchain

## 🔄 Complete Flow

### 1. **Admin NFT Creator Components**

- `AdminNFTCreator.tsx` - Componente principale
- `AdminNFTCreatorUltraSimple.tsx` - Versione semplificata
- Entrambi utilizzano `useSecureNFTAuctionFlow()`

### 2. **Secure NFT Auction Hook**

```typescript
// hooks/useSecureNFTAuction.ts
export function useSecureNFTAuctionFlow() {
  // Gestisce il flusso completo: Mint → Approve → Create Auction
}
```

### 3. **Flusso Completo (completeNFTAuctionFlow)**

#### **Phase 1: NFT Minting**

```typescript
// Funzione: secureNFTMint()
const tx = await nftContract.mintNFT(
  mintParams[0], // to: indirizzo del chiamante
  mintParams[1] // metadataURI: URL dei metadati IPFS
);
```

**ABI Function:**

```json
{
  "name": "mintNFT",
  "inputs": [
    { "name": "to", "type": "address" },
    { "name": "metadataURI", "type": "string" }
  ],
  "outputs": [{ "name": "tokenId", "type": "uint256" }]
}
```

**Eventi Emessi:**

- `Transfer(from: 0x0000..., to: address, tokenId: uint256)` - Mint event
- `NFTMinted(tokenId, creator, owner)` - Evento personalizzato
- `StickerMinted(tokenId, creator, ...)` - Per sticker NFT

#### **Phase 2: NFT Approval**

```typescript
// Funzione: secureNFTApproval()
const tx = await nftContract.approve(
  auctionContract.target, // Spender: contratto asta
  tokenId // Token ID da approvare
);
```

#### **Phase 3: Auction Creation**

```typescript
// Funzione: secureAuctionCreation()
const tx = await auctionContract.createAuction(
  params.nftContract, // Indirizzo contratto NFT
  params.tokenId, // ID del token
  params.auctionType, // Tipo asta (English, Dutch, etc.)
  params.startPrice, // Prezzo iniziale
  params.reservePrice, // Prezzo di riserva
  params.buyNowPrice, // Prezzo buy now
  params.duration, // Durata in secondi
  params.bidIncrement, // Incremento offerte
  params.extensionThreshold, // Soglia estensione
  params.extensionDuration // Durata estensione
);
```

**ABI Function:**

```json
{
  "name": "createAuction",
  "inputs": [
    { "name": "nftContract", "type": "address" },
    { "name": "tokenId", "type": "uint256" },
    { "name": "auctionType", "type": "uint8" },
    { "name": "startingPrice", "type": "uint256" },
    { "name": "reservePrice", "type": "uint256" },
    { "name": "buyNowPrice", "type": "uint256" },
    { "name": "duration", "type": "uint256" },
    { "name": "bidIncrement", "type": "uint256" },
    { "name": "extensionThreshold", "type": "uint256" },
    { "name": "extensionDuration", "type": "uint256" }
  ],
  "outputs": [{ "name": "auctionId", "type": "uint256" }]
}
```

**Eventi Emessi:**

- `AuctionCreated(auctionId, seller, nftContract, tokenId, auctionType, startingPrice, duration)`

## 🔍 Event Tracking & Parsing

### **NFT Minting Events**

```typescript
// Parsing Transfer events per mint
const transferEvents = receipt.logs
  .map((log) => nftContract.interface.parseLog(log))
  .filter(
    (event) =>
      event?.name === "Transfer" && event.args.from === ethers.ZeroAddress // Mint event
  );

const tokenId = transferEvents[0].args.tokenId;
const owner = transferEvents[0].args.to;
```

### **Auction Creation Events**

```typescript
// Parsing AuctionCreated events
const auctionCreatedEvents = receipt.logs
  .map((log) => auctionContract.interface.parseLog(log))
  .filter((event) => event?.name === "AuctionCreated");

const auctionId = auctionCreatedEvents[0].args.auctionId;
```

## 📊 Data Flow

### **Input Parameters**

```typescript
// Mint Parameters
const mintParams = [
  address, // to: indirizzo del chiamante
  metadataUrl, // metadataURI: URL IPFS
  editionSize, // editionSize: dimensione edizione (se limited)
];

// Auction Parameters
const auctionParams = {
  auctionType: AuctionType.ENGLISH,
  startPrice: ethers.parseEther("0.001"),
  reservePrice: ethers.parseEther("0.01"),
  buyNowPrice: ethers.parseEther("1.0"),
  duration: 3600, // 1 ora
  bidIncrement: ethers.parseEther("0.001"),
  extensionThreshold: ethers.parseEther("0.01"),
  extensionDuration: 600, // 10 minuti
};
```

### **Output Results**

```typescript
interface FlowResult {
  nft: {
    tokenId: bigint;
    transactionHash: string;
    owner: string;
  };
  auction: {
    auctionId: bigint;
    transactionHash: string;
  };
}
```

## 🎯 Key Functions in ABI

### **MooveNFT Contract**

1. `mintNFT(address to, string metadataURI)` - Crea NFT
2. `mintStickerNFT(...)` - Crea sticker NFT con parametri estesi
3. `approve(address to, uint256 tokenId)` - Approva trasferimento
4. `ownerOf(uint256 tokenId)` - Verifica ownership

### **MooveAuction Contract**

1. `createAuction(...)` - Crea asta
2. `placeBid(uint256 auctionId)` - Pubblica offerta
3. `endAuction(uint256 auctionId)` - Termina asta
4. `settleAuction(uint256 auctionId)` - Regola asta

## 🔧 Error Handling

### **Common Issues**

1. **Mint Failure**: Metadati IPFS non validi
2. **Approval Failure**: NFT non posseduto
3. **Auction Creation Failure**: Parametri non validi
4. **Event Parsing Failure**: Log malformati

### **Validation Steps**

1. **Pre-mint**: Validazione metadati IPFS
2. **Post-mint**: Verifica ownership
3. **Pre-auction**: Validazione parametri asta
4. **Post-auction**: Verifica creazione asta

## 📈 Performance Considerations

### **Gas Optimization**

- Batch operations quando possibile
- Stima gas prima dell'esecuzione
- Retry logic per transazioni fallite

### **Event Monitoring**

- Real-time event listening
- Cache invalidation automatica
- State synchronization

## 🚀 Usage Example

```typescript
// In AdminNFTCreator component
const handleSecureCreation = async () => {
  // 1. Upload metadata to IPFS
  const metadataUrl = await uploadToIPFS(nftMetadata);

  // 2. Prepare parameters
  const mintParams = [address, metadataUrl, editionSize];
  const auctionParams = {
    /* auction config */
  };

  // 3. Execute complete flow
  await executeSecureFlow(mintParams, auctionParams);

  // 4. Handle results
  if (secureResult) {
    console.log("NFT created:", secureResult.nft.tokenId);
    console.log("Auction created:", secureResult.auction.auctionId);
  }
};
```

## 🔍 Debugging Tips

### **Console Logs**

- `🎨 Starting secure NFT mint...`
- `📡 Mint transaction sent: 0x...`
- `✅ Transaction confirmed in block: 12345`
- `🆔 Real token ID from blockchain: 123`
- `🏆 Phase 3: Creating auction...`
- `🎉 Complete flow finished successfully!`

### **Event Monitoring**

```typescript
// Monitor Transfer events
nftContract.on("Transfer", (from, to, tokenId) => {
  console.log(`NFT #${tokenId} transferred from ${from} to ${to}`);
});

// Monitor AuctionCreated events
auctionContract.on(
  "AuctionCreated",
  (auctionId, seller, nftContract, tokenId) => {
    console.log(`Auction #${auctionId} created for NFT #${tokenId}`);
  }
);
```

## 📝 Summary

Il sistema di creazione NFT è progettato per essere:

- **Sicuro**: Validazione completa ad ogni step
- **Trasparente**: Eventi blockchain per tracking
- **Robusto**: Gestione errori e retry logic
- **Efficiente**: Operazioni batch e gas optimization

Ogni NFT creato passa attraverso questo flusso completo, garantendo che sia correttamente mintato, approvato per l'asta, e inserito in un'asta valida.





