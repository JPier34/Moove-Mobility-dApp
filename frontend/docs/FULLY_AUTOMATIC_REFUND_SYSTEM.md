# 🚀 Sistema di Rimborsi Completamente Automatico - Moove Mobility dApp

## Panoramica

Il sistema di rimborsi nel Moove Mobility dApp è ora **completamente automatico**. Quando gli utenti partecipano a un'asta, inviano ETH al contratto, e quando l'asta termina, il sistema gestisce automaticamente:

1. **Determinazione del vincitore**
2. **Trasferimento dell'NFT al vincitore**
3. **Rimborso automatico di tutti i perdenti**

## 🎯 Come Funziona il Sistema Completamente Automatico

### **Flusso Completo:**

```
1. Utente fa un'offerta → ETH va al contratto
2. Asta termina → useAutomaticAuctionMonitor() rileva l'asta scaduta
3. Sistema chiama settleAuction() → Contratto determina vincitore
4. Sistema chiama refundRemainingBidders() → Contratto rimborsa perdenti
5. Contratto trasferisce NFT al vincitore
6. Eventi AuctionSettled + BidRefunded emessi → Frontend aggiorna UI
```

### **Processo Completamente Automatico**

Una volta che l'asta è terminata, il sistema:

- ✅ **Chiama automaticamente** `settleAuction()`
- ✅ **Chiama automaticamente** `refundRemainingBidders()`
- ✅ **Rimborsa automaticamente** tutti i perdenti
- ✅ **Trasferisce automaticamente** l'NFT al vincitore
- ✅ **Emette eventi** per aggiornare la UI

## 🔧 Implementazione Tecnica

### **Hook Principale: `useAutomaticAuctionMonitor`**

```typescript
import { useAutomaticAuctionMonitor } from "@/hooks/useAutomaticAuctionMonitor";

// Il sistema monitora automaticamente tutte le aste
// e chiama sia settleAuction() che refundRemainingBidders()
useAutomaticAuctionMonitor();
```

### **Processo Automatico Completo**

Il sistema esegue automaticamente **due passaggi sequenziali**:

1. **`settleAuction()`** → Determina vincitore + trasferisce NFT
2. **`refundRemainingBidders()`** → Rimborsa tutti i perdenti (tranne Dutch)

### **Funzioni del Contratto**

#### `settleAuction(uint256 auctionId)`

- **Scopo**: Determina il vincitore e trasferisce l'NFT
- **Parametri**:
  - `auctionId`: ID dell'asta
- **Processo**:
  1. Determina il vincitore dell'asta
  2. Trasferisce l'NFT al vincitore
  3. Emette evento `AuctionSettled`

#### `refundRemainingBidders(uint256 auctionId, uint256 startIndex, uint256 batchSize)`

- **Scopo**: Rimborsa tutti i partecipanti perdenti
- **Parametri**:
  - `auctionId`: ID dell'asta
  - `startIndex`: Indice di partenza (0)
  - `batchSize`: Dimensione batch (50)
- **Processo**: Processa i rimborsi in batch per efficienza

### **Eventi del Sistema**

#### `AuctionSettled`

```solidity
event AuctionSettled(
    uint256 indexed auctionId,
    address indexed winner,
    uint256 finalPrice,
    uint256 platformFee,
    uint256 royaltyFee
);
```

#### `BidRefunded`

```solidity
event BidRefunded(
    uint256 indexed auctionId,
    address indexed bidder,
    uint256 refundAmount
);
```

## 📋 Processo Automatico per Ogni Tipo di Asta

### **1. English Auction (ID: 0)**

- ✅ **Rimborsi Automatici**: SÌ
- **Processo**:
  1. Asta termina → `settleAuction()` chiamata automaticamente
  2. Vincitore riceve NFT
  3. `refundRemainingBidders()` chiamata automaticamente
  4. Tutti i perdenti rimborsati automaticamente

### **2. Dutch Auction (ID: 1)**

- ✅ **Rimborsi Automatici**: SÌ (nessun rimborso necessario)
- **Processo**:
  1. Acquisto immediato
  2. Nessun fondo bloccato
  3. Pagamento diretto
  4. Solo `settleAuction()` chiamata (nessun refund necessario)

### **3. Sealed Bid Auction (ID: 2)**

- ✅ **Rimborsi Automatici**: SÌ
- **Processo**:
  1. Fase Commit → Offerte segrete
  2. Fase Reveal → Offerte rivelate
  3. `settleAuction()` chiamata automaticamente
  4. `refundRemainingBidders()` chiamata automaticamente
  5. Vincitore riceve NFT
  6. Tutti i perdenti rimborsati automaticamente

### **4. Reserve Auction (ID: 3)**

- ✅ **Rimborsi Automatici**: SÌ
- **Processo**:
  1. Asta termina → `settleAuction()` chiamata automaticamente
  2. Se prezzo di riserva raggiunto: vincitore riceve NFT
  3. Se prezzo di riserva non raggiunto: tutti rimborsati automaticamente
  4. `refundRemainingBidders()` chiamata automaticamente

## 🚀 Vantaggi del Sistema Completamente Automatico

### **Per gli Utenti:**

- ✅ **Nessuna azione richiesta** per ricevere rimborsi
- ✅ **Rimborsi istantanei** quando l'asta termina
- ✅ **Nessuna transazione MetaMask** per i rimborsi
- ✅ **Processo completamente trasparente**
- ✅ **Zero intervento manuale** necessario

### **Per gli Sviluppatori:**

- ✅ **Codice più semplice** - tutto gestito automaticamente
- ✅ **Meno errori** - tutto gestito dal contratto
- ✅ **Migliore UX** - utenti non devono fare nulla
- ✅ **Sistema più sicuro** - logica centralizzata nel contratto
- ✅ **Manutenzione ridotta** - sistema completamente autonomo

## 🔍 Monitoraggio e Debug

### **Log di Debug**

```typescript
// Il sistema logga automaticamente:
console.log(
  `⏰ Auction ${auctionId} expired, starting automatic settlement...`
);
console.log(`🔄 Step 1: Calling settleAuction() for auction ${auctionId}...`);
console.log(`📝 Settle auction transaction submitted: ${settleTx.hash}`);
console.log(`✅ Auction ${auctionId} settled successfully`);
console.log(`💰 Step 2: Processing refunds for auction ${auctionId}...`);
console.log(`📝 Refund transaction submitted: ${refundTx.hash}`);
console.log(`✅ Refunds processed successfully for auction ${auctionId}`);
console.log(`🎉 Auction ${auctionId} fully processed (settlement + refunds)`);
```

### **Eventi Tracciati**

- `AuctionSettled`: Asta completata e vincitore determinato
- `BidRefunded`: Rimborso individuale completato
- `Transfer`: NFT trasferito al vincitore

## 🚨 Casi Speciali Gestiti Automaticamente

### **Aste senza Vincitore**

- Se nessuno vince (es. prezzo di riserva non raggiunto)
- Tutti i partecipanti vengono rimborsati automaticamente

### **Aste Cancellate**

- Se un'asta viene cancellata
- Tutti i partecipanti vengono rimborsati automaticamente

### **Errori di Transazione**

- Se `settleAuction()` fallisce, può essere riprovata
- Se `refundRemainingBidders()` fallisce, viene loggato ma non blocca il processo
- Il sistema mantiene traccia dello stato

### **Dutch Auctions**

- Non richiedono rimborsi (acquisto immediato)
- Solo `settleAuction()` viene chiamata
- Nessuna chiamata a `refundRemainingBidders()`

## 💡 Best Practices

### **Per gli Utenti**

1. **Partecipa** alle aste normalmente
2. **Aspetta** che l'asta termini
3. **Ricevi automaticamente** il rimborso se perdi
4. **Ricevi automaticamente** l'NFT se vinci
5. **Non fare nulla** - tutto è automatico

### **Per gli Sviluppatori**

1. **Usa sempre** `useAutomaticAuctionMonitor`
2. **Ascolta** gli eventi `AuctionSettled` e `BidRefunded`
3. **Non implementare** logica di rimborso manuale
4. **Fidati** del sistema automatico per gestire tutto
5. **Monitora** i log per debug

## 🔮 Future Enhancements

### **Miglioramenti Possibili**

- **Notifiche Push**: Avvisi quando i rimborsi sono completati
- **Dashboard Rimborsi**: Visualizzazione cronologia rimborsi
- **Stima Tempi**: Indicatori di quando l'asta terminerà
- **Analytics**: Statistiche sui rimborsi automatici
- **Batch Processing**: Ottimizzazione per aste con molti partecipanti

## 📊 Metriche del Sistema

### **Statistiche Automatiche**

- Tempo medio di settlement completo
- Tasso di successo dei rimborsi automatici
- Volume totale rimborsato automaticamente
- Numero di aste gestite automaticamente
- Tempo medio tra settlement e refund

## 🔧 Configurazione

### **Parametri Configurabili**

```typescript
// Batch size per i rimborsi (default: 50)
const BATCH_SIZE = 50;

// Intervallo di monitoraggio (default: 30 secondi)
const MONITOR_INTERVAL = 30000;

// Timeout per le transazioni (default: 5 minuti)
const TRANSACTION_TIMEOUT = 300000;
```

## 🚨 Troubleshooting

### **Problemi Comuni**

1. **"Transaction failed"**: Controlla il gas e riprova
2. **"Refund processing failed"**: Viene loggato ma non blocca il processo
3. **"Auction not settled"**: Il sistema riproverà automaticamente
4. **"No refunds needed"**: Normale per Dutch auctions

### **Debug**

```typescript
// Abilita debug completo
console.log("Debug automatic refund system:", {
  auctionId,
  auctionType,
  settlementStatus: "completed",
  refundStatus: "processing",
  events: ["AuctionSettled", "BidRefunded"],
});
```

---

**Nota Importante**: Il sistema è ora progettato per essere completamente automatico e sicuro. Gli utenti non devono mai richiedere manualmente i rimborsi - tutto viene gestito dal sistema automatico quando l'asta termina. Il sistema esegue sia il settlement che i rimborsi in sequenza automatica.



## Panoramica

Il sistema di rimborsi nel Moove Mobility dApp è ora **completamente automatico**. Quando gli utenti partecipano a un'asta, inviano ETH al contratto, e quando l'asta termina, il sistema gestisce automaticamente:

1. **Determinazione del vincitore**
2. **Trasferimento dell'NFT al vincitore**
3. **Rimborso automatico di tutti i perdenti**

## 🎯 Come Funziona il Sistema Completamente Automatico

### **Flusso Completo:**

```
1. Utente fa un'offerta → ETH va al contratto
2. Asta termina → useAutomaticAuctionMonitor() rileva l'asta scaduta
3. Sistema chiama settleAuction() → Contratto determina vincitore
4. Sistema chiama refundRemainingBidders() → Contratto rimborsa perdenti
5. Contratto trasferisce NFT al vincitore
6. Eventi AuctionSettled + BidRefunded emessi → Frontend aggiorna UI
```

### **Processo Completamente Automatico**

Una volta che l'asta è terminata, il sistema:

- ✅ **Chiama automaticamente** `settleAuction()`
- ✅ **Chiama automaticamente** `refundRemainingBidders()`
- ✅ **Rimborsa automaticamente** tutti i perdenti
- ✅ **Trasferisce automaticamente** l'NFT al vincitore
- ✅ **Emette eventi** per aggiornare la UI

## 🔧 Implementazione Tecnica

### **Hook Principale: `useAutomaticAuctionMonitor`**

```typescript
import { useAutomaticAuctionMonitor } from "@/hooks/useAutomaticAuctionMonitor";

// Il sistema monitora automaticamente tutte le aste
// e chiama sia settleAuction() che refundRemainingBidders()
useAutomaticAuctionMonitor();
```

### **Processo Automatico Completo**

Il sistema esegue automaticamente **due passaggi sequenziali**:

1. **`settleAuction()`** → Determina vincitore + trasferisce NFT
2. **`refundRemainingBidders()`** → Rimborsa tutti i perdenti (tranne Dutch)

### **Funzioni del Contratto**

#### `settleAuction(uint256 auctionId)`

- **Scopo**: Determina il vincitore e trasferisce l'NFT
- **Parametri**:
  - `auctionId`: ID dell'asta
- **Processo**:
  1. Determina il vincitore dell'asta
  2. Trasferisce l'NFT al vincitore
  3. Emette evento `AuctionSettled`

#### `refundRemainingBidders(uint256 auctionId, uint256 startIndex, uint256 batchSize)`

- **Scopo**: Rimborsa tutti i partecipanti perdenti
- **Parametri**:
  - `auctionId`: ID dell'asta
  - `startIndex`: Indice di partenza (0)
  - `batchSize`: Dimensione batch (50)
- **Processo**: Processa i rimborsi in batch per efficienza

### **Eventi del Sistema**

#### `AuctionSettled`

```solidity
event AuctionSettled(
    uint256 indexed auctionId,
    address indexed winner,
    uint256 finalPrice,
    uint256 platformFee,
    uint256 royaltyFee
);
```

#### `BidRefunded`

```solidity
event BidRefunded(
    uint256 indexed auctionId,
    address indexed bidder,
    uint256 refundAmount
);
```

## 📋 Processo Automatico per Ogni Tipo di Asta

### **1. English Auction (ID: 0)**

- ✅ **Rimborsi Automatici**: SÌ
- **Processo**:
  1. Asta termina → `settleAuction()` chiamata automaticamente
  2. Vincitore riceve NFT
  3. `refundRemainingBidders()` chiamata automaticamente
  4. Tutti i perdenti rimborsati automaticamente

### **2. Dutch Auction (ID: 1)**

- ✅ **Rimborsi Automatici**: SÌ (nessun rimborso necessario)
- **Processo**:
  1. Acquisto immediato
  2. Nessun fondo bloccato
  3. Pagamento diretto
  4. Solo `settleAuction()` chiamata (nessun refund necessario)

### **3. Sealed Bid Auction (ID: 2)**

- ✅ **Rimborsi Automatici**: SÌ
- **Processo**:
  1. Fase Commit → Offerte segrete
  2. Fase Reveal → Offerte rivelate
  3. `settleAuction()` chiamata automaticamente
  4. `refundRemainingBidders()` chiamata automaticamente
  5. Vincitore riceve NFT
  6. Tutti i perdenti rimborsati automaticamente

### **4. Reserve Auction (ID: 3)**

- ✅ **Rimborsi Automatici**: SÌ
- **Processo**:
  1. Asta termina → `settleAuction()` chiamata automaticamente
  2. Se prezzo di riserva raggiunto: vincitore riceve NFT
  3. Se prezzo di riserva non raggiunto: tutti rimborsati automaticamente
  4. `refundRemainingBidders()` chiamata automaticamente

## 🚀 Vantaggi del Sistema Completamente Automatico

### **Per gli Utenti:**

- ✅ **Nessuna azione richiesta** per ricevere rimborsi
- ✅ **Rimborsi istantanei** quando l'asta termina
- ✅ **Nessuna transazione MetaMask** per i rimborsi
- ✅ **Processo completamente trasparente**
- ✅ **Zero intervento manuale** necessario

### **Per gli Sviluppatori:**

- ✅ **Codice più semplice** - tutto gestito automaticamente
- ✅ **Meno errori** - tutto gestito dal contratto
- ✅ **Migliore UX** - utenti non devono fare nulla
- ✅ **Sistema più sicuro** - logica centralizzata nel contratto
- ✅ **Manutenzione ridotta** - sistema completamente autonomo

## 🔍 Monitoraggio e Debug

### **Log di Debug**

```typescript
// Il sistema logga automaticamente:
console.log(
  `⏰ Auction ${auctionId} expired, starting automatic settlement...`
);
console.log(`🔄 Step 1: Calling settleAuction() for auction ${auctionId}...`);
console.log(`📝 Settle auction transaction submitted: ${settleTx.hash}`);
console.log(`✅ Auction ${auctionId} settled successfully`);
console.log(`💰 Step 2: Processing refunds for auction ${auctionId}...`);
console.log(`📝 Refund transaction submitted: ${refundTx.hash}`);
console.log(`✅ Refunds processed successfully for auction ${auctionId}`);
console.log(`🎉 Auction ${auctionId} fully processed (settlement + refunds)`);
```

### **Eventi Tracciati**

- `AuctionSettled`: Asta completata e vincitore determinato
- `BidRefunded`: Rimborso individuale completato
- `Transfer`: NFT trasferito al vincitore

## 🚨 Casi Speciali Gestiti Automaticamente

### **Aste senza Vincitore**

- Se nessuno vince (es. prezzo di riserva non raggiunto)
- Tutti i partecipanti vengono rimborsati automaticamente

### **Aste Cancellate**

- Se un'asta viene cancellata
- Tutti i partecipanti vengono rimborsati automaticamente

### **Errori di Transazione**

- Se `settleAuction()` fallisce, può essere riprovata
- Se `refundRemainingBidders()` fallisce, viene loggato ma non blocca il processo
- Il sistema mantiene traccia dello stato

### **Dutch Auctions**

- Non richiedono rimborsi (acquisto immediato)
- Solo `settleAuction()` viene chiamata
- Nessuna chiamata a `refundRemainingBidders()`

## 💡 Best Practices

### **Per gli Utenti**

1. **Partecipa** alle aste normalmente
2. **Aspetta** che l'asta termini
3. **Ricevi automaticamente** il rimborso se perdi
4. **Ricevi automaticamente** l'NFT se vinci
5. **Non fare nulla** - tutto è automatico

### **Per gli Sviluppatori**

1. **Usa sempre** `useAutomaticAuctionMonitor`
2. **Ascolta** gli eventi `AuctionSettled` e `BidRefunded`
3. **Non implementare** logica di rimborso manuale
4. **Fidati** del sistema automatico per gestire tutto
5. **Monitora** i log per debug

## 🔮 Future Enhancements

### **Miglioramenti Possibili**

- **Notifiche Push**: Avvisi quando i rimborsi sono completati
- **Dashboard Rimborsi**: Visualizzazione cronologia rimborsi
- **Stima Tempi**: Indicatori di quando l'asta terminerà
- **Analytics**: Statistiche sui rimborsi automatici
- **Batch Processing**: Ottimizzazione per aste con molti partecipanti

## 📊 Metriche del Sistema

### **Statistiche Automatiche**

- Tempo medio di settlement completo
- Tasso di successo dei rimborsi automatici
- Volume totale rimborsato automaticamente
- Numero di aste gestite automaticamente
- Tempo medio tra settlement e refund

## 🔧 Configurazione

### **Parametri Configurabili**

```typescript
// Batch size per i rimborsi (default: 50)
const BATCH_SIZE = 50;

// Intervallo di monitoraggio (default: 30 secondi)
const MONITOR_INTERVAL = 30000;

// Timeout per le transazioni (default: 5 minuti)
const TRANSACTION_TIMEOUT = 300000;
```

## 🚨 Troubleshooting

### **Problemi Comuni**

1. **"Transaction failed"**: Controlla il gas e riprova
2. **"Refund processing failed"**: Viene loggato ma non blocca il processo
3. **"Auction not settled"**: Il sistema riproverà automaticamente
4. **"No refunds needed"**: Normale per Dutch auctions

### **Debug**

```typescript
// Abilita debug completo
console.log("Debug automatic refund system:", {
  auctionId,
  auctionType,
  settlementStatus: "completed",
  refundStatus: "processing",
  events: ["AuctionSettled", "BidRefunded"],
});
```

---

**Nota Importante**: Il sistema è ora progettato per essere completamente automatico e sicuro. Gli utenti non devono mai richiedere manualmente i rimborsi - tutto viene gestito dal sistema automatico quando l'asta termina. Il sistema esegue sia il settlement che i rimborsi in sequenza automatica.




