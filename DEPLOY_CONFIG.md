# 🚀 Deploy Configuration - Moove dApp

## 📋 Configurazione Pre-Deploy

### **1. Environment Variables (.env)**

```bash
# Network Configuration
ALCHEMY_API_KEY=your_alchemy_api_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Deployer Account
PRIVATE_KEY=your_private_key_here

# Gas Configuration
REPORT_GAS=true
```

### **2. Verifiche Pre-Deploy**

#### **2.1 Saldo Account**

- [ ] Verificare saldo Sepolia > 0.1 ETH
- [ ] Verificare private key corretta
- [ ] Verificare API keys valide

#### **2.2 Configurazione Network**

- [ ] Sepolia network configurata
- [ ] Gas settings ottimizzati
- [ ] Etherscan verification abilitata

### **3. Ordine di Deploy**

```bash
# 1. Deploy AccessControl (Core)
npx hardhat deploy --network sepolia --tags core

# 2. Deploy NFT
npx hardhat deploy --network sepolia --tags nft

# 3. Deploy Customization
npx hardhat deploy --network sepolia --tags customization

# 4. Deploy RentalPass
npx hardhat deploy --network sepolia --tags rental-pass

# 5. Deploy TradingManager
npx hardhat deploy --network sepolia --tags trading-manager

# 6. Deploy Auction
npx hardhat deploy --network sepolia --tags auction

# 7. Post-Deploy Setup
npx hardhat deploy --network sepolia --tags setup
```

### **4. Deploy Completo**

```bash
# Deploy tutti i contratti in una volta
npx hardhat deploy --network sepolia
```

## 📊 Costi Stimati

### **Gas per Contratto**

- **MooveAccessControl**: 2,444,012 gas
- **MooveNFT**: 3,827,568 gas
- **MooveCustomization**: 2,924,767 gas
- **MooveRentalPass**: 2,961,442 gas
- **MooveTradingManager**: 1,932,804 gas
- **MooveAuction**: 3,861,063 gas

### **Totale**

- **Gas totale**: 17,951,656 gas
- **Costo (3.5 gwei)**: ~0.0628 ETH (~$126 USD)
- **Buffer di sicurezza**: 20% = ~0.075 ETH (~$150 USD)

## 🔧 Post-Deploy Configuration

### **1. Ruoli e Permessi**

- [ ] Grant MINTER_ROLE
- [ ] Grant AUCTION_MANAGER_ROLE
- [ ] Grant CUSTOMIZATION_ADMIN_ROLE
- [ ] Grant PRICE_MANAGER_ROLE
- [ ] Grant PAUSER_ROLE
- [ ] Grant WITHDRAWER_ROLE
- [ ] Grant TRADER_ROLE
- [ ] Grant MARKETPLACE_MANAGER_ROLE

### **2. Autorizzazione Contratti**

- [ ] Authorize MooveNFT
- [ ] Authorize MooveCustomization
- [ ] Authorize MooveRentalPass
- [ ] Authorize MooveTradingManager
- [ ] Authorize MooveAuction

### **3. Configurazione TradingManager**

- [ ] Authorize NFT contract
- [ ] Set treasury address
- [ ] Configure fee percentages

## 📄 Output Files

### **1. Deployment Addresses**

- File: `deployments/sepolia-addresses.json`
- Contiene tutti gli indirizzi dei contratti deployati

### **2. Etherscan Verification**

- Tutti i contratti verificati automaticamente
- Links diretti ai contratti su Etherscan

## 🎯 Comandi Utili

### **Verifiche Post-Deploy**

```bash
# Verificare deployment
npx hardhat deploy --network sepolia --tags setup

# Verificare contratti specifici
npx hardhat deploy --network sepolia --tags nft

# Lista deployment
npx hardhat deploy:list --network sepolia
```

### **Verifiche Manuali**

```bash
# Verificare saldo
npx hardhat run scripts/check-balance.js --network sepolia

# Verificare contratti
npx hardhat run scripts/verify-contracts.js --network sepolia
```

## ⚠️ Note Importanti

### **1. Sicurezza**

- Private key mai committata
- Backup sicuro delle chiavi
- Verificare tutti gli indirizzi

### **2. Gas Management**

- Monitorare gas price
- Usare buffer di sicurezza
- Verificare gas limit

### **3. Network**

- Verificare network Sepolia
- Test su testnet prima
- Backup configurazioni

## 🚀 Status

### **✅ PRONTO PER DEPLOY**

- [x] Script di deploy creati
- [x] Configurazione completata
- [x] Test passano (313/313)
- [x] Ottimizzazioni completate
- [x] Sicurezza verificata

### **🔄 PROSSIMI PASSI**

1. Configurare .env file
2. Verificare saldo Sepolia
3. Eseguire deploy
4. Verificare post-deploy
5. Testare funzionalità

---

**Status: PRONTO PER DEPLOY** 🚀
