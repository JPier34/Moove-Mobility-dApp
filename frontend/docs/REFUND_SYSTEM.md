# 💰 Sistema di Rimborsi - Moove Mobility dApp

## Panoramica

Il sistema di rimborsi nel Moove Mobility dApp gestisce automaticamente e manualmente i rimborsi per le diverse tipologie di aste. I rimborsi sono necessari quando gli utenti partecipano a un'asta ma non vincono, e devono recuperare i fondi bloccati.

## 🎯 Tipologie di Aste e Gestione Rimborsi

### 1. **English Auction (Asta Inglese)**

**Tipo ID:** 0

#### Come Funziona:

- Gli utenti fanno offerte incrementali
- Solo l'offerta più alta vince
- Tutte le altre offerte devono essere rimborsate

#### Gestione Rimborsi:

- **Automatici**: ✅ SÌ (gestiti dal contratto)
- **Manuali**: ❌ NO necessari
- **Processo**:
  1. L'asta termina
  2. `settleAuction()` viene chiamata automaticamente
  3. Il contratto determina il vincitore
  4. Il vincitore riceve l'NFT
  5. **Tutti i perdenti vengono rimborsati automaticamente**

```typescript
// English Auction - rimborsi automatici
// Il sistema chiama automaticamente settleAuction() quando l'asta termina
// Non è necessario alcun intervento manuale per i rimborsi
```

### 2. **Dutch Auction (Asta Olandese)**

**Tipo ID:** 1

#### Come Funziona:

- Il prezzo scende nel tempo
- Il primo acquirente che compra vince
- Non ci sono offerte multiple

#### Gestione Rimborsi:

- **Automatici**: ✅ SÌ
- **Manuali**: ❌ NO necessari
- **Processo**:
  1. L'asta termina quando qualcuno compra
  2. Non ci sono fondi bloccati da rimborsare
  3. Il pagamento avviene immediatamente

```typescript
// Dutch Auction - nessun rimborso necessario
const { handleDutchAuction } = useDutchAuction();

// Acquisto immediato, nessun rimborso
await handleDutchAuction(auctionId, currentPrice);
```

### 3. **Sealed Bid Auction (Asta a Offerta Segreta)**

**Tipo ID:** 2

#### Come Funziona:

- Gli utenti inviano offerte segrete
- Dopo la fase di commit, c'è la fase di reveal
- Solo l'offerta più alta vince

#### Gestione Rimborsi:

- **Automatici**: ✅ SÌ (gestiti dal contratto)
- **Manuali**: ❌ NO necessari
- **Processo**:
  1. Fase Commit: gli utenti inviano offerte segrete
  2. Fase Reveal: gli utenti rivelano le loro offerte
  3. `settleAuction()` viene chiamata automaticamente
  4. Il vincitore riceve l'NFT
  5. **Tutti i perdenti vengono rimborsati automaticamente**

```typescript
// Sealed Bid Auction - rimborsi automatici
// Il sistema chiama automaticamente settleAuction() dopo la fase di reveal
// Non è necessario alcun intervento manuale per i rimborsi
```

### 4. **Reserve Auction (Asta con Prezzo di Riserva)**

**Tipo ID:** 3

#### Come Funziona:

- Simile all'English Auction
- Ha un prezzo minimo di riserva
- Se il prezzo di riserva non viene raggiunto, l'asta può essere cancellata

#### Gestione Rimborsi:

- **Automatici**: ✅ SÌ (gestiti dal contratto)
- **Manuali**: ❌ NO necessari
- **Processo**:
  1. Se l'asta raggiunge il prezzo di riserva: normale processo automatico
  2. Se l'asta non raggiunge il prezzo di riserva: tutti vengono rimborsati automaticamente
  3. `settleAuction()` viene chiamata automaticamente
  4. Il vincitore riceve l'NFT (se c'è)
  5. **Tutti i perdenti vengono rimborsati automaticamente**

```typescript
// Reserve Auction - rimborsi automatici
// Il sistema chiama automaticamente settleAuction() quando l'asta termina
// Non è necessario alcun intervento manuale per i rimborsi
```

## 🔧 Implementazione Tecnica

### Sistema Automatico: `useAutomaticAuctionMonitor`

Il sistema di rimborsi è completamente automatico grazie al monitoraggio delle aste:

```typescript
import { useAutomaticAuctionMonitor } from "@/hooks/useAutomaticAuctionMonitor";

// Il hook monitora automaticamente tutte le aste
// e chiama settleAuction() quando necessario
useAutomaticAuctionMonitor();
```

### Funzione del Contratto: `settleAuction()`

#### `settleAuction(uint256 auctionId)`

- **Scopo**: Determina il vincitore e gestisce tutti i rimborsi automaticamente
- **Parametri**:
  - `auctionId`: ID dell'asta
- **Processo**:
  1. Determina il vincitore dell'asta
  2. Trasferisce l'NFT al vincitore
  3. **Rimborsa automaticamente tutti i perdenti**
  4. Emette l'evento `AuctionSettled`

#### Evento `BidRefunded`

```solidity
event BidRefunded(
  uint256 indexed auctionId,
  address indexed bidder,
  uint256 refundAmount
);
```

### Stato dei Rimborsi

```typescript
interface RefundStatus {
  canRefund: boolean; // Se l'utente può richiedere rimborso
  refundedAmount: string; // Importo già rimborsato (ETH)
  pendingRefunds: BidRefundInfo[]; // Offerte in attesa di rimborso
  totalPendingAmount: string; // Importo totale in attesa
}

interface BidRefundInfo {
  auctionId: number;
  bidder: string;
  amount: string; // Importo in ETH
  timestamp: number;
  isWinning: boolean; // Se l'offerta ha vinto
  isRefunded: boolean; // Se è già stata rimborsata
  refundTxHash?: string; // Hash della transazione di rimborso
}
```

## 📋 Processo di Rimborso

### 1. **Verifica Stato Rimborso**

```typescript
const refundStatus = await getRefundStatus(auctionId);

console.log("Stato rimborso:", {
  canRefund: refundStatus.canRefund,
  refundedAmount: refundStatus.refundedAmount,
  pendingRefunds: refundStatus.pendingRefunds.length,
  totalPendingAmount: refundStatus.totalPendingAmount,
});
```

### 2. **Richiesta Rimborso**

```typescript
if (refundStatus.canRefund) {
  const success = await requestRefund(auctionId);

  if (success) {
    console.log("Rimborso richiesto con successo");
  }
}
```

### 3. **Monitoraggio Eventi**

```typescript
// Ascolta eventi di rimborso
const cleanup = listenForRefunds(auctionId, (refundInfo) => {
  console.log("Rimborso ricevuto:", refundInfo);
  // Aggiorna UI
});

// Cleanup quando necessario
cleanup();
```

## 🚨 Casi Speciali

### **Aste Cancellate**

- Se un'asta viene cancellata, tutti i partecipanti devono richiedere il rimborso
- Il processo è identico alle aste normali

### **Aste senza Vincitore**

- Se nessuno vince un'asta (es. prezzo di riserva non raggiunto)
- Tutti i partecipanti devono richiedere il rimborso

### **Errori di Transazione**

- Se una transazione di rimborso fallisce, può essere riprovata
- Il sistema mantiene traccia dello stato per evitare doppi rimborsi

## 💡 Best Practices

### **Per gli Utenti**

1. **Verifica sempre** lo stato dell'asta prima di richiedere rimborsi
2. **Aspetta** che l'asta sia completamente terminata
3. **Monitora** gli eventi di rimborso per conferme
4. **Non richiedere** rimborsi multipli per la stessa asta

### **Per gli Sviluppatori**

1. **Usa sempre** `useAuctionRefunds` per gestire i rimborsi
2. **Implementa** listener per eventi di rimborso
3. **Gestisci** gli errori gracefully
4. **Mostra** feedback chiaro all'utente

## 🔍 Debugging

### **Log di Debug**

```typescript
// Abilita debug per rimborsi
console.log("Debug rimborsi:", {
  auctionId,
  userAddress: address,
  refundStatus: await getRefundStatus(auctionId),
  auctionBids: await getAuctionBids(auctionId),
});
```

### **Errori Comuni**

1. **"Wallet not connected"**: Assicurati che MetaMask sia connesso
2. **"Auction not ended"**: Aspetta che l'asta sia terminata
3. **"No pending refunds"**: L'utente non ha offerte da rimborsare
4. **"Transaction failed"**: Controlla il gas e riprova

## 📊 Metriche e Monitoraggio

### **Eventi Tracciati**

- `BidRefunded`: Rimborso completato
- `RefundRequested`: Richiesta rimborso
- `RefundFailed`: Rimborso fallito

### **Statistiche**

- Tempo medio di rimborso
- Tasso di successo dei rimborsi
- Volume totale rimborsato
- Numero di rimborsi per asta

## 🔮 Future Enhancements

### **Rimborsi Automatici**

- Implementazione di rimborsi automatici per aste semplici
- Batch processing più efficiente
- Notifiche push per rimborsi completati

### **UI Migliorata**

- Dashboard rimborsi dedicata
- Cronologia rimborsi completa
- Stima tempi di rimborso

### **Ottimizzazioni Gas**

- Batch processing più grandi
- Rimborsi aggregati
- Gas optimization per transazioni multiple

---

**Nota**: Il sistema di rimborsi è progettato per essere sicuro e efficiente, ma richiede sempre l'interazione dell'utente per evitare problemi di sicurezza e garantire il controllo sui fondi.

## Panoramica

Il sistema di rimborsi nel Moove Mobility dApp gestisce automaticamente e manualmente i rimborsi per le diverse tipologie di aste. I rimborsi sono necessari quando gli utenti partecipano a un'asta ma non vincono, e devono recuperare i fondi bloccati.

## 🎯 Tipologie di Aste e Gestione Rimborsi

### 1. **English Auction (Asta Inglese)**

**Tipo ID:** 0

#### Come Funziona:

- Gli utenti fanno offerte incrementali
- Solo l'offerta più alta vince
- Tutte le altre offerte devono essere rimborsate

#### Gestione Rimborsi:

- **Automatici**: ✅ SÌ (gestiti dal contratto)
- **Manuali**: ❌ NO necessari
- **Processo**:
  1. L'asta termina
  2. `settleAuction()` viene chiamata automaticamente
  3. Il contratto determina il vincitore
  4. Il vincitore riceve l'NFT
  5. **Tutti i perdenti vengono rimborsati automaticamente**

```typescript
// English Auction - rimborsi automatici
// Il sistema chiama automaticamente settleAuction() quando l'asta termina
// Non è necessario alcun intervento manuale per i rimborsi
```

### 2. **Dutch Auction (Asta Olandese)**

**Tipo ID:** 1

#### Come Funziona:

- Il prezzo scende nel tempo
- Il primo acquirente che compra vince
- Non ci sono offerte multiple

#### Gestione Rimborsi:

- **Automatici**: ✅ SÌ
- **Manuali**: ❌ NO necessari
- **Processo**:
  1. L'asta termina quando qualcuno compra
  2. Non ci sono fondi bloccati da rimborsare
  3. Il pagamento avviene immediatamente

```typescript
// Dutch Auction - nessun rimborso necessario
const { handleDutchAuction } = useDutchAuction();

// Acquisto immediato, nessun rimborso
await handleDutchAuction(auctionId, currentPrice);
```

### 3. **Sealed Bid Auction (Asta a Offerta Segreta)**

**Tipo ID:** 2

#### Come Funziona:

- Gli utenti inviano offerte segrete
- Dopo la fase di commit, c'è la fase di reveal
- Solo l'offerta più alta vince

#### Gestione Rimborsi:

- **Automatici**: ✅ SÌ (gestiti dal contratto)
- **Manuali**: ❌ NO necessari
- **Processo**:
  1. Fase Commit: gli utenti inviano offerte segrete
  2. Fase Reveal: gli utenti rivelano le loro offerte
  3. `settleAuction()` viene chiamata automaticamente
  4. Il vincitore riceve l'NFT
  5. **Tutti i perdenti vengono rimborsati automaticamente**

```typescript
// Sealed Bid Auction - rimborsi automatici
// Il sistema chiama automaticamente settleAuction() dopo la fase di reveal
// Non è necessario alcun intervento manuale per i rimborsi
```

### 4. **Reserve Auction (Asta con Prezzo di Riserva)**

**Tipo ID:** 3

#### Come Funziona:

- Simile all'English Auction
- Ha un prezzo minimo di riserva
- Se il prezzo di riserva non viene raggiunto, l'asta può essere cancellata

#### Gestione Rimborsi:

- **Automatici**: ✅ SÌ (gestiti dal contratto)
- **Manuali**: ❌ NO necessari
- **Processo**:
  1. Se l'asta raggiunge il prezzo di riserva: normale processo automatico
  2. Se l'asta non raggiunge il prezzo di riserva: tutti vengono rimborsati automaticamente
  3. `settleAuction()` viene chiamata automaticamente
  4. Il vincitore riceve l'NFT (se c'è)
  5. **Tutti i perdenti vengono rimborsati automaticamente**

```typescript
// Reserve Auction - rimborsi automatici
// Il sistema chiama automaticamente settleAuction() quando l'asta termina
// Non è necessario alcun intervento manuale per i rimborsi
```

## 🔧 Implementazione Tecnica

### Sistema Automatico: `useAutomaticAuctionMonitor`

Il sistema di rimborsi è completamente automatico grazie al monitoraggio delle aste:

```typescript
import { useAutomaticAuctionMonitor } from "@/hooks/useAutomaticAuctionMonitor";

// Il hook monitora automaticamente tutte le aste
// e chiama settleAuction() quando necessario
useAutomaticAuctionMonitor();
```

### Funzione del Contratto: `settleAuction()`

#### `settleAuction(uint256 auctionId)`

- **Scopo**: Determina il vincitore e gestisce tutti i rimborsi automaticamente
- **Parametri**:
  - `auctionId`: ID dell'asta
- **Processo**:
  1. Determina il vincitore dell'asta
  2. Trasferisce l'NFT al vincitore
  3. **Rimborsa automaticamente tutti i perdenti**
  4. Emette l'evento `AuctionSettled`

#### Evento `BidRefunded`

```solidity
event BidRefunded(
  uint256 indexed auctionId,
  address indexed bidder,
  uint256 refundAmount
);
```

### Stato dei Rimborsi

```typescript
interface RefundStatus {
  canRefund: boolean; // Se l'utente può richiedere rimborso
  refundedAmount: string; // Importo già rimborsato (ETH)
  pendingRefunds: BidRefundInfo[]; // Offerte in attesa di rimborso
  totalPendingAmount: string; // Importo totale in attesa
}

interface BidRefundInfo {
  auctionId: number;
  bidder: string;
  amount: string; // Importo in ETH
  timestamp: number;
  isWinning: boolean; // Se l'offerta ha vinto
  isRefunded: boolean; // Se è già stata rimborsata
  refundTxHash?: string; // Hash della transazione di rimborso
}
```

## 📋 Processo di Rimborso

### 1. **Verifica Stato Rimborso**

```typescript
const refundStatus = await getRefundStatus(auctionId);

console.log("Stato rimborso:", {
  canRefund: refundStatus.canRefund,
  refundedAmount: refundStatus.refundedAmount,
  pendingRefunds: refundStatus.pendingRefunds.length,
  totalPendingAmount: refundStatus.totalPendingAmount,
});
```

### 2. **Richiesta Rimborso**

```typescript
if (refundStatus.canRefund) {
  const success = await requestRefund(auctionId);

  if (success) {
    console.log("Rimborso richiesto con successo");
  }
}
```

### 3. **Monitoraggio Eventi**

```typescript
// Ascolta eventi di rimborso
const cleanup = listenForRefunds(auctionId, (refundInfo) => {
  console.log("Rimborso ricevuto:", refundInfo);
  // Aggiorna UI
});

// Cleanup quando necessario
cleanup();
```

## 🚨 Casi Speciali

### **Aste Cancellate**

- Se un'asta viene cancellata, tutti i partecipanti devono richiedere il rimborso
- Il processo è identico alle aste normali

### **Aste senza Vincitore**

- Se nessuno vince un'asta (es. prezzo di riserva non raggiunto)
- Tutti i partecipanti devono richiedere il rimborso

### **Errori di Transazione**

- Se una transazione di rimborso fallisce, può essere riprovata
- Il sistema mantiene traccia dello stato per evitare doppi rimborsi

## 💡 Best Practices

### **Per gli Utenti**

1. **Verifica sempre** lo stato dell'asta prima di richiedere rimborsi
2. **Aspetta** che l'asta sia completamente terminata
3. **Monitora** gli eventi di rimborso per conferme
4. **Non richiedere** rimborsi multipli per la stessa asta

### **Per gli Sviluppatori**

1. **Usa sempre** `useAuctionRefunds` per gestire i rimborsi
2. **Implementa** listener per eventi di rimborso
3. **Gestisci** gli errori gracefully
4. **Mostra** feedback chiaro all'utente

## 🔍 Debugging

### **Log di Debug**

```typescript
// Abilita debug per rimborsi
console.log("Debug rimborsi:", {
  auctionId,
  userAddress: address,
  refundStatus: await getRefundStatus(auctionId),
  auctionBids: await getAuctionBids(auctionId),
});
```

### **Errori Comuni**

1. **"Wallet not connected"**: Assicurati che MetaMask sia connesso
2. **"Auction not ended"**: Aspetta che l'asta sia terminata
3. **"No pending refunds"**: L'utente non ha offerte da rimborsare
4. **"Transaction failed"**: Controlla il gas e riprova

## 📊 Metriche e Monitoraggio

### **Eventi Tracciati**

- `BidRefunded`: Rimborso completato
- `RefundRequested`: Richiesta rimborso
- `RefundFailed`: Rimborso fallito

### **Statistiche**

- Tempo medio di rimborso
- Tasso di successo dei rimborsi
- Volume totale rimborsato
- Numero di rimborsi per asta

## 🔮 Future Enhancements

### **Rimborsi Automatici**

- Implementazione di rimborsi automatici per aste semplici
- Batch processing più efficiente
- Notifiche push per rimborsi completati

### **UI Migliorata**

- Dashboard rimborsi dedicata
- Cronologia rimborsi completa
- Stima tempi di rimborso

### **Ottimizzazioni Gas**

- Batch processing più grandi
- Rimborsi aggregati
- Gas optimization per transazioni multiple

---

**Nota**: Il sistema di rimborsi è progettato per essere sicuro e efficiente, ma richiede sempre l'interazione dell'utente per evitare problemi di sicurezza e garantire il controllo sui fondi.
