# 🔄 Sistema di Rimborsi Automatici - Moove Mobility dApp

## Panoramica

Il sistema di rimborsi nel Moove Mobility dApp è **completamente automatico**. Quando gli utenti partecipano a un'asta, inviano ETH al contratto, e quando l'asta termina, il contratto gestisce automaticamente:

1. **Determinazione del vincitore**
2. **Trasferimento dell'NFT al vincitore**
3. **Rimborso automatico di tutti i perdenti**

## 🎯 Come Funziona il Sistema Automatico

### **Flusso Completo:**

```
1. Utente fa un'offerta → ETH va al contratto
2. Asta termina → useAutomaticAuctionMonitor() rileva l'asta scaduta
3. Sistema chiama settleAuction() → Contratto determina vincitore
4. Contratto trasferisce NFT al vincitore
5. Contratto rimborsa automaticamente tutti i perdenti
6. Evento AuctionSettled emesso → Frontend aggiorna UI
```

### **Nessuna Conferma MetaMask Necessaria per Rimborsi**

Una volta che l'asta è terminata, il sistema:

- ✅ **Chiama automaticamente** `settleAuction()`
- ✅ **Rimborsa automaticamente** tutti i perdenti
- ✅ **Trasferisce automaticamente** l'NFT al vincitore
- ✅ **Emette eventi** per aggiornare la UI

## 🔧 Implementazione Tecnica

### Sistema Completamente Automatico: `useAutomaticAuctionMonitor`

Il sistema di rimborsi è ora **completamente automatico**:

```typescript
import { useAutomaticAuctionMonitor } from "@/hooks/useAutomaticAuctionMonitor";

// Il sistema monitora automaticamente tutte le aste
// e chiama sia settleAuction() che refundRemainingBidders()
useAutomaticAuctionMonitor();
```

### Processo Automatico Completo

Il sistema esegue automaticamente **due passaggi sequenziali**:

1. **`settleAuction()`** → Determina vincitore + trasferisce NFT
2. **`refundRemainingBidders()`** → Rimborsa tutti i perdenti (tranne Dutch)

### Funzioni del Contratto

#### `settleAuction(uint256 auctionId)`

- **Scopo**: Determina il vincitore e trasferisce l'NFT
- **Parametri**:
  - `auctionId`: ID dell'asta
- **Processo**:
  1. Determina il vincitore dell'asta
  2. Trasferisce l'NFT al vincitore
  3. Emette evento `AuctionSettled`
  4. **✅ Rimborsa automaticamente tutti i perdenti**

#### `refundRemainingBidders(uint256 auctionId, uint256 startIndex, uint256 batchSize)`

- **Scopo**: Rimborsa tutti i partecipanti perdenti
- **Parametri**:
  - `auctionId`: ID dell'asta
  - `startIndex`: Indice di partenza (0)
  - `batchSize`: Dimensione batch (es. 50)
- **Processo**: Processa i rimborsi in batch per efficienza

### **Evento `AuctionSettled`**

```solidity
event AuctionSettled(
    uint256 indexed auctionId,
    address indexed winner,
    uint256 finalPrice,
    uint256 platformFee,
    uint256 royaltyFee
);
```

## 📋 Processo Automatico per Ogni Tipo di Asta

### **1. English Auction (ID: 0)**

- ✅ **Rimborsi Automatici**: SÌ
- **Processo**:
  1. Asta termina → `settleAuction()` chiamata automaticamente
  2. Vincitore riceve NFT
  3. Tutti i perdenti rimborsati automaticamente

### **2. Dutch Auction (ID: 1)**

- ✅ **Rimborsi Automatici**: SÌ (nessun rimborso necessario)
- **Processo**:
  1. Acquisto immediato
  2. Nessun fondo bloccato
  3. Pagamento diretto

### **3. Sealed Bid Auction (ID: 2)**

- ✅ **Rimborsi Automatici**: SÌ
- **Processo**:
  1. Fase Commit → Offerte segrete
  2. Fase Reveal → Offerte rivelate
  3. `settleAuction()` chiamata automaticamente
  4. Vincitore riceve NFT
  5. Tutti i perdenti rimborsati automaticamente

### **4. Reserve Auction (ID: 3)**

- ✅ **Rimborsi Automatici**: SÌ
- **Processo**:
  1. Asta termina → `settleAuction()` chiamata automaticamente
  2. Se prezzo di riserva raggiunto: vincitore riceve NFT
  3. Se prezzo di riserva non raggiunto: tutti rimborsati automaticamente

## 🚀 Vantaggi del Sistema Automatico

### **Per gli Utenti:**

- ✅ **Nessuna azione richiesta** per ricevere rimborsi
- ✅ **Rimborsi istantanei** quando l'asta termina
- ✅ **Nessuna transazione MetaMask** per i rimborsi
- ✅ **Processo completamente trasparente**

### **Per gli Sviluppatori:**

- ✅ **Codice più semplice** - nessuna gestione manuale
- ✅ **Meno errori** - tutto gestito dal contratto
- ✅ **Migliore UX** - utenti non devono fare nulla
- ✅ **Sistema più sicuro** - logica centralizzata nel contratto

## 🔍 Monitoraggio e Debug

### **Log di Debug**

```typescript
// Il sistema logga automaticamente:
console.log(`⏰ Auction ${auctionId} expired, calling settleAuction()...`);
console.log(`📝 Settle auction transaction submitted: ${tx.hash}`);
console.log(`✅ Auction ${auctionId} settled automatically`);
```

### **Eventi Tracciati**

- `AuctionSettled`: Asta completata e rimborsata
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
- Il sistema mantiene traccia dello stato

## 💡 Best Practices

### **Per gli Utenti**

1. **Partecipa** alle aste normalmente
2. **Aspetta** che l'asta termini
3. **Ricevi automaticamente** il rimborso se perdi
4. **Ricevi automaticamente** l'NFT se vinci

### **Per gli Sviluppatori**

1. **Usa sempre** `useAutomaticAuctionMonitor`
2. **Ascolta** gli eventi `AuctionSettled`
3. **Non implementare** logica di rimborso manuale
4. **Fidati** del contratto per gestire tutto

## 🔮 Future Enhancements

### **Miglioramenti Possibili**

- **Notifiche Push**: Avvisi quando i rimborsi sono completati
- **Dashboard Rimborsi**: Visualizzazione cronologia rimborsi
- **Stima Tempi**: Indicatori di quando l'asta terminerà
- **Analytics**: Statistiche sui rimborsi automatici

## 📊 Metriche del Sistema

### **Statistiche Automatiche**

- Tempo medio di settlement
- Tasso di successo dei rimborsi automatici
- Volume totale rimborsato automaticamente
- Numero di aste gestite automaticamente

---

**Nota Importante**: Il sistema è progettato per essere completamente automatico e sicuro. Gli utenti non devono mai richiedere manualmente i rimborsi - tutto viene gestito dal contratto intelligente quando l'asta termina.

## Panoramica

Il sistema di rimborsi nel Moove Mobility dApp è **completamente automatico**. Quando gli utenti partecipano a un'asta, inviano ETH al contratto, e quando l'asta termina, il contratto gestisce automaticamente:

1. **Determinazione del vincitore**
2. **Trasferimento dell'NFT al vincitore**
3. **Rimborso automatico di tutti i perdenti**

## 🎯 Come Funziona il Sistema Automatico

### **Flusso Completo:**

```
1. Utente fa un'offerta → ETH va al contratto
2. Asta termina → useAutomaticAuctionMonitor() rileva l'asta scaduta
3. Sistema chiama settleAuction() → Contratto determina vincitore
4. Contratto trasferisce NFT al vincitore
5. Contratto rimborsa automaticamente tutti i perdenti
6. Evento AuctionSettled emesso → Frontend aggiorna UI
```

### **Nessuna Conferma MetaMask Necessaria per Rimborsi**

Una volta che l'asta è terminata, il sistema:

- ✅ **Chiama automaticamente** `settleAuction()`
- ✅ **Rimborsa automaticamente** tutti i perdenti
- ✅ **Trasferisce automaticamente** l'NFT al vincitore
- ✅ **Emette eventi** per aggiornare la UI

## 🔧 Implementazione Tecnica

### Sistema Completamente Automatico: `useAutomaticAuctionMonitor`

Il sistema di rimborsi è ora **completamente automatico**:

```typescript
import { useAutomaticAuctionMonitor } from "@/hooks/useAutomaticAuctionMonitor";

// Il sistema monitora automaticamente tutte le aste
// e chiama sia settleAuction() che refundRemainingBidders()
useAutomaticAuctionMonitor();
```

### Processo Automatico Completo

Il sistema esegue automaticamente **due passaggi sequenziali**:

1. **`settleAuction()`** → Determina vincitore + trasferisce NFT
2. **`refundRemainingBidders()`** → Rimborsa tutti i perdenti (tranne Dutch)

### Funzioni del Contratto

#### `settleAuction(uint256 auctionId)`

- **Scopo**: Determina il vincitore e trasferisce l'NFT
- **Parametri**:
  - `auctionId`: ID dell'asta
- **Processo**:
  1. Determina il vincitore dell'asta
  2. Trasferisce l'NFT al vincitore
  3. Emette evento `AuctionSettled`
  4. **✅ Rimborsa automaticamente tutti i perdenti**

#### `refundRemainingBidders(uint256 auctionId, uint256 startIndex, uint256 batchSize)`

- **Scopo**: Rimborsa tutti i partecipanti perdenti
- **Parametri**:
  - `auctionId`: ID dell'asta
  - `startIndex`: Indice di partenza (0)
  - `batchSize`: Dimensione batch (es. 50)
- **Processo**: Processa i rimborsi in batch per efficienza

### **Evento `AuctionSettled`**

```solidity
event AuctionSettled(
    uint256 indexed auctionId,
    address indexed winner,
    uint256 finalPrice,
    uint256 platformFee,
    uint256 royaltyFee
);
```

## 📋 Processo Automatico per Ogni Tipo di Asta

### **1. English Auction (ID: 0)**

- ✅ **Rimborsi Automatici**: SÌ
- **Processo**:
  1. Asta termina → `settleAuction()` chiamata automaticamente
  2. Vincitore riceve NFT
  3. Tutti i perdenti rimborsati automaticamente

### **2. Dutch Auction (ID: 1)**

- ✅ **Rimborsi Automatici**: SÌ (nessun rimborso necessario)
- **Processo**:
  1. Acquisto immediato
  2. Nessun fondo bloccato
  3. Pagamento diretto

### **3. Sealed Bid Auction (ID: 2)**

- ✅ **Rimborsi Automatici**: SÌ
- **Processo**:
  1. Fase Commit → Offerte segrete
  2. Fase Reveal → Offerte rivelate
  3. `settleAuction()` chiamata automaticamente
  4. Vincitore riceve NFT
  5. Tutti i perdenti rimborsati automaticamente

### **4. Reserve Auction (ID: 3)**

- ✅ **Rimborsi Automatici**: SÌ
- **Processo**:
  1. Asta termina → `settleAuction()` chiamata automaticamente
  2. Se prezzo di riserva raggiunto: vincitore riceve NFT
  3. Se prezzo di riserva non raggiunto: tutti rimborsati automaticamente

## 🚀 Vantaggi del Sistema Automatico

### **Per gli Utenti:**

- ✅ **Nessuna azione richiesta** per ricevere rimborsi
- ✅ **Rimborsi istantanei** quando l'asta termina
- ✅ **Nessuna transazione MetaMask** per i rimborsi
- ✅ **Processo completamente trasparente**

### **Per gli Sviluppatori:**

- ✅ **Codice più semplice** - nessuna gestione manuale
- ✅ **Meno errori** - tutto gestito dal contratto
- ✅ **Migliore UX** - utenti non devono fare nulla
- ✅ **Sistema più sicuro** - logica centralizzata nel contratto

## 🔍 Monitoraggio e Debug

### **Log di Debug**

```typescript
// Il sistema logga automaticamente:
console.log(`⏰ Auction ${auctionId} expired, calling settleAuction()...`);
console.log(`📝 Settle auction transaction submitted: ${tx.hash}`);
console.log(`✅ Auction ${auctionId} settled automatically`);
```

### **Eventi Tracciati**

- `AuctionSettled`: Asta completata e rimborsata
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
- Il sistema mantiene traccia dello stato

## 💡 Best Practices

### **Per gli Utenti**

1. **Partecipa** alle aste normalmente
2. **Aspetta** che l'asta termini
3. **Ricevi automaticamente** il rimborso se perdi
4. **Ricevi automaticamente** l'NFT se vinci

### **Per gli Sviluppatori**

1. **Usa sempre** `useAutomaticAuctionMonitor`
2. **Ascolta** gli eventi `AuctionSettled`
3. **Non implementare** logica di rimborso manuale
4. **Fidati** del contratto per gestire tutto

## 🔮 Future Enhancements

### **Miglioramenti Possibili**

- **Notifiche Push**: Avvisi quando i rimborsi sono completati
- **Dashboard Rimborsi**: Visualizzazione cronologia rimborsi
- **Stima Tempi**: Indicatori di quando l'asta terminerà
- **Analytics**: Statistiche sui rimborsi automatici

## 📊 Metriche del Sistema

### **Statistiche Automatiche**

- Tempo medio di settlement
- Tasso di successo dei rimborsi automatici
- Volume totale rimborsato automaticamente
- Numero di aste gestite automaticamente

---

**Nota Importante**: Il sistema è progettato per essere completamente automatico e sicuro. Gli utenti non devono mai richiedere manualmente i rimborsi - tutto viene gestito dal contratto intelligente quando l'asta termina.
