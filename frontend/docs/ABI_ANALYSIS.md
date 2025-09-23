# Analisi delle Differenze ABI - MooveAuction Contract

## Problema Identificato

Il contratto `MooveAuction` restituisce una struttura complessa dalla funzione `getAuction()` che non corrispondeva all'interfaccia `AuctionData` originale nel codice frontend.

## Differenze Principali

### Struttura Originale (Semplificata)

```typescript
interface AuctionData {
  auctionId: number;
  tokenId: number;
  startingPrice: bigint;
  currentPrice: bigint;
  highestBid: bigint;
  endTime: number;
  status: number;
  seller: string;
  highestBidder: string;
  bidCount?: number;
}
```

### Struttura Reale del Contratto (Completa)

```typescript
interface AuctionData {
  auctionId: number;
  nftContract: string; // ✅ NUOVO
  tokenId: number;
  seller: string;
  auctionType: number; // ✅ NUOVO
  startingPrice: bigint;
  reservePrice: bigint; // ✅ NUOVO
  buyNowPrice: bigint; // ✅ NUOVO
  currentPrice: bigint;
  startTime: number; // ✅ NUOVO
  endTime: number;
  bidIncrement: bigint; // ✅ NUOVO
  highestBidder: string;
  highestBid: bigint;
  status: number;
  allowPartialFulfillment: boolean; // ✅ NUOVO
  minBidders: number; // ✅ NUOVO
  totalBidders: number; // ✅ NUOVO
  isSettled: boolean; // ✅ NUOVO
  extensionThreshold: bigint; // ✅ NUOVO
  extensionDuration: bigint; // ✅ NUOVO
  lastBidTime: number; // ✅ NUOVO
  bidCount: number;
  hasReservePrice: boolean; // ✅ NUOVO
  isDutchAuction: boolean; // ✅ NUOVO
  dutchStartPrice: bigint; // ✅ NUOVO
  dutchEndPrice: bigint; // ✅ NUOVO
  dutchPriceDecrement: bigint; // ✅ NUOVO
  dutchTimeInterval: bigint; // ✅ NUOVO
  isSealedBid: boolean; // ✅ NUOVO
  sealedBidDeadline: number; // ✅ NUOVO
  isRevealPhase: boolean; // ✅ NUOVO
  revealDeadline: number; // ✅ NUOVO
}
```

## Tipi di Asta Supportati

Dal contratto emergono diversi tipi di asta:

1. **English Auction** (`auctionType: 0`) - Asta inglese tradizionale
2. **Dutch Auction** (`auctionType: 1`) - Asta olandese con prezzo decrescente
3. **Sealed Bid Auction** (`auctionType: 2`) - Asta a busta chiusa
4. **Reserve Auction** (`auctionType: 3`) - Asta con prezzo di riserva

## Stati dell'Asta

Gli stati possibili dell'asta sono:

- `0`: Non iniziata
- `1`: Attiva
- `2`: In fase di rivelazione (per sealed bid)
- `3`: Estesa
- `4`: Conclusa/Settled

## Funzioni di Creazione Asta

Il contratto supporta solo la funzione `createAuction()` con 10 parametri:

```solidity
function createAuction(
  address nftContract,
  uint256 tokenId,
  uint8 auctionType,
  uint256 startingPrice,
  uint256 reservePrice,
  uint256 buyNowPrice,
  uint256 startTime,
  uint256 endTime,
  uint256 bidIncrement,
  uint256 minBidders
) external returns (uint256 auctionId)
```

## Correzioni Implementate

1. **Aggiornamento Interface**: Estesa `AuctionData` per includere tutti i campi del contratto
2. **Decoding Corretto**: Modificato il codice per gestire la struttura complessa restituita da `getAuction()`
3. **Debug Migliorato**: Aggiunto logging dettagliato per tutti i campi dell'asta
4. **Gestione Tipi**: Aggiunta gestione per diversi tipi di asta (English, Dutch, Sealed Bid)

## Test di Verifica

Creato script di test (`test-auction-fixes.js`) per verificare:

- ✅ `totalAuctions()` funziona correttamente
- ✅ `getAuction(id)` decodifica correttamente tutti i campi
- ✅ Analisi distribuzione tipi di asta
- ✅ Analisi distribuzione stati delle aste

## Prossimi Passi

1. Testare le funzioni aggiornate nel frontend
2. Verificare compatibilità con componenti esistenti
3. Aggiornare UI per gestire diversi tipi di asta
4. Implementare logica specifica per Dutch e Sealed Bid auctions
