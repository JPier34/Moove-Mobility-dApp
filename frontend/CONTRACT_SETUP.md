# Configurazione Smart Contract - Risoluzione Problemi

## 🚨 Problemi Attuali

### 1. **MetaMask: "Transaction is likely to fail"**

Questo errore indica che i parametri della transazione non sono corretti o il contratto non è configurato propriamente.

### 2. **Errore nella pagina di successo**

`Cannot read properties of undefined (reading 'icon')` - questo è stato risolto con le correzioni al codice.

## 🔧 Soluzioni

### **Passo 1: Verifica Configurazione Contratto**

Assicurati che nel file `.env.local` sia presente:

```bash
NEXT_PUBLIC_MOOVE_RENTAL_PASS_ADDRESS=0x...your-actual-contract-address
```

### **Passo 2: Verifica Indirizzo Contratto**

L'indirizzo del contratto deve essere:

- ✅ Un indirizzo Ethereum valido (0x...)
- ✅ Deployato sulla rete Sepolia
- ✅ Con l'ABI corretto

### **Passo 3: Verifica Parametri Transazione**

Il contratto si aspetta questi parametri:

- `vehicleType`: uint8 (0 = BIKE, 1 = SCOOTER, 2 = MONOPATTINO)
- `cityId`: string (es. "rome", "milan")
- `duration`: uint256 (in giorni, default 30)

### **Passo 4: Test Transazione**

1. **Connetti il wallet** (MetaMask)
2. **Assicurati di essere su Sepolia**
3. **Verifica che hai ETH sufficienti** per gas + prezzo NFT
4. **Prova a fare l'acquisto**

## 🧪 Debug

### **Controlla Console Browser**

Cerca errori come:

- "Contract address not configured"
- "Mint function not available"
- Errori di ABI

### **Controlla MetaMask**

- Network: Sepolia
- Gas limit sufficiente
- Prezzo gas ragionevole

### **Verifica Contratto**

Usa Sepolia Etherscan per verificare che l'indirizzo del contratto sia corretto e attivo.

## 🚀 Test Rapido

Se il contratto non è ancora configurato, puoi testare la UI:

1. **Commenta temporaneamente** la chiamata al contratto
2. **Simula la transazione** con dati mock
3. **Verifica che la navigazione** alla pagina di successo funzioni

## 📝 Esempio Configurazione Corretta

```bash
# .env.local
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-walletconnect-project-id
NEXT_PUBLIC_MOOVE_RENTAL_PASS_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
```

## 🔍 Prossimi Passi

1. **Configura l'indirizzo del contratto** nel `.env.local`
2. **Riavvia il server** Next.js
3. **Testa la transazione** con un wallet connesso
4. **Verifica i parametri** passati al contratto

## 📞 Supporto

Se i problemi persistono:

1. Controlla i log della console
2. Verifica la configurazione del contratto
3. Controlla che il contratto sia deployato correttamente
4. Verifica che l'ABI sia compatibile
