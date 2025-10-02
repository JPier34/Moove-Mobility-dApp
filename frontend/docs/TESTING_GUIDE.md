# Guida ai Test di Congruenza Dati e Tipi

## 🧪 **TEST DISPONIBILI**

### **1. Test Auction Creator** (`/test-auction-creator`)

**Scopo**: Verificare la creazione di aste e la congruenza dei dati

#### **Cosa Testa**:

- ✅ Creazione NFT e minting
- ✅ Approvazione NFT per contratto asta
- ✅ Creazione asta con parametri specifici
- ✅ **ANALISI DETTAGLIATA DEI TIPI**: Verifica struttura dati contratto
- ✅ **MAPPING DATI**: Conversione da formato contratto a frontend
- ✅ **INTEGRITÀ DATI**: Verifica coerenza tra input e output

#### **Logs Dettagliati**:

```javascript
🔍 DETAILED AUCTION DATA ANALYSIS:
📊 Raw contract data structure: {
  totalFields: 23,
  fieldTypes: [...] // Analisi tipo per tipo
}

🎯 MAPPED DATA (Frontend Format): {
  auctionId: "string",
  tokenId: "string",
  prices: "string (ETH format)",
  timestamps: "number",
  // ... tutti i campi mappati
}

✅ Type compatibility check: {
  auctionIdType: "string",
  tokenIdType: "string",
  pricesType: "string",
  timestampsType: "number",
  numbersType: "number"
}

🔍 DATA INTEGRITY CHECK: {
  auctionIdMatches: true,
  tokenIdMatches: true,
  sellerMatches: true,
  auctionTypeValid: true,
  pricesValid: true,
  timestampsValid: true
}
```

### **2. Test Bidding** (`/test-bidding`)

**Scopo**: Verificare il processo di offerta e la congruenza dei dati

#### **Cosa Testa**:

- ✅ Caricamento aste esistenti
- ✅ Selezione asta e analisi dati
- ✅ **ANALISI PRE-BID**: Verifica tipi e validazione
- ✅ **PROCESSO BID**: Place bid con logging dettagliato
- ✅ **POST-BID VERIFICATION**: Controllo dati dopo offerta

#### **Logs Dettagliati**:

```javascript
🔍 PRE-BID ANALYSIS:
📊 Selected auction data: {
  auctionId: "string",
  auctionIdType: "string",
  currentBid: "string",
  currentBidType: "string",
  bidIncrement: "string",
  bidIncrementType: "string",
  // ... tutti i campi con tipi
}

💰 Bid parameters: {
  bidAmount: "string",
  bidAmountType: "string",
  parsedBidAmount: "number",
  auctionIdForBid: "number",
  auctionIdType: "number"
}

🔍 BID VALIDATION: {
  bidAmountValid: true,
  bidAmountSufficient: true,
  auctionActive: true,
  auctionNotEnded: true,
  bidderNotHighest: true
}
```

## 🔍 **COSA VERIFICARE NEI LOGS**

### **1. Struttura Dati Contratto**

- **23 campi** totali nella struttura Auction
- **Tipi corretti**: bigint per prezzi/timestamps, string per indirizzi, boolean per flags
- **Ordine corretto** dei campi secondo ABI

### **2. Mapping Frontend**

- **Conversione tipi**: bigint → string per prezzi, bigint → number per timestamps
- **Formato prezzi**: wei → ETH con ethers.formatEther()
- **Formato date**: timestamp → Date objects
- **Validazione**: tutti i campi mappati correttamente

### **3. Integrità Dati**

- **AuctionId**: corrisponde tra creazione e verifica
- **TokenId**: corrisponde tra NFT e asta
- **Seller**: corrisponde all'indirizzo creatore
- **Prezzi**: validi e coerenti
- **Timestamps**: startTime < endTime

### **4. Compatibilità Tipi**

- **Frontend**: string per ID, string per prezzi ETH, number per timestamps
- **Contratto**: bigint per valori numerici, address per indirizzi
- **Conversioni**: automatiche e corrette

## 📋 **PROCEDURA DI TEST**

### **Test 1: Creazione Asta**

1. Vai su `/test-auction-creator`
2. Connetti wallet
3. Clicca "Create Test Auction"
4. **Apri Console** e verifica logs:
   - ✅ Struttura dati contratto (23 campi)
   - ✅ Mapping frontend corretto
   - ✅ Verifica integrità dati
   - ✅ Tutti i controlli passano

### **Test 2: Offerta Asta**

1. Vai su `/test-bidding`
2. Seleziona l'asta creata nel Test 1
3. Verifica dati asta mostrati
4. Clicca "Place Bid"
5. **Apri Console** e verifica logs:
   - ✅ Analisi pre-bid completa
   - ✅ Validazione bid corretta
   - ✅ Processo bid riuscito
6. Clicca "Refresh & Verify Data" per controllo post-bid

## 🎯 **RISULTATI ATTESI**

### **Successo Completo**:

- ✅ Tutti i logs mostrano dati coerenti
- ✅ Tipi convertiti correttamente
- ✅ Integrità dati verificata
- ✅ Nessun errore di tipo
- ✅ Transazioni confermate su blockchain

### **Problemi da Identificare**:

- ❌ Campi mancanti o in ordine sbagliato
- ❌ Conversioni tipo fallite
- ❌ Dati non coerenti tra contratto e frontend
- ❌ Errori di validazione
- ❌ Transazioni fallite

## 🔧 **DEBUGGING**

Se i test falliscono:

1. **Controlla Console**: Logs dettagliati mostrano esattamente dove fallisce
2. **Verifica Wallet**: Deve essere connesso e avere Sepolia ETH
3. **Controlla Network**: Deve essere su Sepolia testnet
4. **Verifica Contratti**: Indirizzi devono essere corretti
5. **Analizza Errori**: Stack trace completo nei logs

## 📊 **METRICHE DI SUCCESSO**

- **100%** dei campi mappati correttamente
- **0 errori** di tipo TypeScript
- **Tutti i controlli** di integrità passano
- **Transazioni** confermate su blockchain
- **Dati coerenti** tra contratto e frontend

I test sono ora pronti per verificare completamente la congruenza dei tipi e dei dati! 🎉
