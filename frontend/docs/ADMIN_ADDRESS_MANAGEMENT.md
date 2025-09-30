# Admin Address Management

## 🚨 **IMPORTANTE: Gestione Indirizzo Admin**

L'indirizzo admin è attualmente **hardcodato in molti file**. Per cambiarlo, segui questa procedura:

## 📍 **Dove è Hardcodato**

L'indirizzo admin `0x777382955f33Bb8540602E914D9b650C962EF6Cc` è presente in:

### ✅ **File Aggiornati (Usano Config Centralizzata)**
- `config/admin.ts` - **File principale di configurazione**
- `components/admin/AdminGuard.tsx`
- `hooks/useFailedAuctionHandler.ts`
- `components/layout/Header.tsx`

### ⚠️ **File Ancora da Aggiornare**
- `components/debug/AdminAccessDebugger.tsx`
- `components/debug/RoleDebugger.tsx`
- `components/admin/AdminNFTCreatorUltraSimple.tsx`
- `components/admin/AdminNFTCreator.tsx`
- `app/success/[transactionId]/page.tsx`

## 🔧 **Come Cambiare l'Indirizzo Admin**

### **Metodo 1: Script Automatico**
```bash
# Cambia l'indirizzo admin in tutti i file
node scripts/update-admin-address.js 0x[NEW_ADMIN_ADDRESS]
```

### **Metodo 2: Manuale**
1. **Aggiorna il file principale:**
   ```typescript
   // config/admin.ts
   export const ADMIN_CONFIG = {
     MASTER_ADMIN_ADDRESS: "0x[NEW_ADMIN_ADDRESS]", // ← Cambia qui
     // ... resto della configurazione
   };
   ```

2. **Aggiorna i file rimanenti:**
   - Sostituisci `0x777382955f33Bb8540602E914D9b650C962EF6Cc` con il nuovo indirizzo
   - Usa `getAdminAddress()` da `@/config/admin` invece di hardcodare

## 🏗️ **Smart Contract**

### **Contratto MooveAccessControl**
L'indirizzo admin è anche **hardcodato nel contratto** come `MASTER_ADMIN_ROLE` holder.

**Per cambiarlo nel contratto:**
1. Chiama `grantRole(MASTER_ADMIN_ROLE, newAdminAddress)` 
2. Chiama `revokeRole(MASTER_ADMIN_ROLE, oldAdminAddress)`

### **Script per Aggiornare il Contratto**
```javascript
// scripts/update-contract-admin.js
const { ethers } = require("hardhat");

async function updateContractAdmin(newAdminAddress) {
  const accessControl = await ethers.getContractAt(
    "MooveAccessControl", 
    "0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42"
  );
  
  const MASTER_ADMIN_ROLE = "0xf83591f6d256ac9a12084d6de9c89a3e1fd09d594aa1184c76eef05bae103fc3";
  
  // Grant role to new admin
  await accessControl.grantRole(MASTER_ADMIN_ROLE, newAdminAddress);
  
  // Revoke role from old admin
  await accessControl.revokeRole(MASTER_ADMIN_ROLE, "0x777382955f33Bb8540602E914D9b650C962EF6Cc");
  
  console.log("✅ Contract admin updated successfully");
}
```

## 🔍 **Verifica Cambio**

### **1. Verifica Frontend**
```typescript
import { getAdminAddress, isAdminAddress } from "@/config/admin";

console.log("Current admin:", getAdminAddress());
console.log("Is admin?", isAdminAddress("0x[ADDRESS]"));
```

### **2. Verifica Contratto**
```javascript
// Verifica che il nuovo indirizzo abbia il ruolo MASTER_ADMIN_ROLE
const hasRole = await accessControl.hasRole(MASTER_ADMIN_ROLE, newAdminAddress);
console.log("Has admin role:", hasRole);
```

## 📋 **Checklist per Cambio Admin**

- [ ] Aggiorna `config/admin.ts`
- [ ] Esegui `node scripts/update-admin-address.js [NEW_ADDRESS]`
- [ ] Aggiorna il contratto con `grantRole`/`revokeRole`
- [ ] Testa l'accesso admin nel frontend
- [ ] Verifica che tutte le funzioni admin funzionino
- [ ] Aggiorna la documentazione
- [ ] Notifica il team del cambio

## ⚠️ **Note Importanti**

1. **Backup**: Fai sempre backup prima di cambiare l'indirizzo admin
2. **Test**: Testa sempre in ambiente di sviluppo prima della produzione
3. **Coordinamento**: Coordina il cambio con il team per evitare interruzioni
4. **Rollback**: Mantieni l'indirizzo vecchio attivo fino a quando non sei sicuro che tutto funzioni

## 🚀 **Miglioramenti Futuri**

Per evitare questo problema in futuro:
1. Usa sempre `getAdminAddress()` invece di hardcodare
2. Considera l'uso di variabili d'ambiente per l'indirizzo admin
3. Implementa un sistema di gestione ruoli più flessibile
4. Aggiungi test automatici per verificare la configurazione admin

## 🚨 **IMPORTANTE: Gestione Indirizzo Admin**

L'indirizzo admin è attualmente **hardcodato in molti file**. Per cambiarlo, segui questa procedura:

## 📍 **Dove è Hardcodato**

L'indirizzo admin `0x777382955f33Bb8540602E914D9b650C962EF6Cc` è presente in:

### ✅ **File Aggiornati (Usano Config Centralizzata)**
- `config/admin.ts` - **File principale di configurazione**
- `components/admin/AdminGuard.tsx`
- `hooks/useFailedAuctionHandler.ts`
- `components/layout/Header.tsx`

### ⚠️ **File Ancora da Aggiornare**
- `components/debug/AdminAccessDebugger.tsx`
- `components/debug/RoleDebugger.tsx`
- `components/admin/AdminNFTCreatorUltraSimple.tsx`
- `components/admin/AdminNFTCreator.tsx`
- `app/success/[transactionId]/page.tsx`

## 🔧 **Come Cambiare l'Indirizzo Admin**

### **Metodo 1: Script Automatico**
```bash
# Cambia l'indirizzo admin in tutti i file
node scripts/update-admin-address.js 0x[NEW_ADMIN_ADDRESS]
```

### **Metodo 2: Manuale**
1. **Aggiorna il file principale:**
   ```typescript
   // config/admin.ts
   export const ADMIN_CONFIG = {
     MASTER_ADMIN_ADDRESS: "0x[NEW_ADMIN_ADDRESS]", // ← Cambia qui
     // ... resto della configurazione
   };
   ```

2. **Aggiorna i file rimanenti:**
   - Sostituisci `0x777382955f33Bb8540602E914D9b650C962EF6Cc` con il nuovo indirizzo
   - Usa `getAdminAddress()` da `@/config/admin` invece di hardcodare

## 🏗️ **Smart Contract**

### **Contratto MooveAccessControl**
L'indirizzo admin è anche **hardcodato nel contratto** come `MASTER_ADMIN_ROLE` holder.

**Per cambiarlo nel contratto:**
1. Chiama `grantRole(MASTER_ADMIN_ROLE, newAdminAddress)` 
2. Chiama `revokeRole(MASTER_ADMIN_ROLE, oldAdminAddress)`

### **Script per Aggiornare il Contratto**
```javascript
// scripts/update-contract-admin.js
const { ethers } = require("hardhat");

async function updateContractAdmin(newAdminAddress) {
  const accessControl = await ethers.getContractAt(
    "MooveAccessControl", 
    "0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42"
  );
  
  const MASTER_ADMIN_ROLE = "0xf83591f6d256ac9a12084d6de9c89a3e1fd09d594aa1184c76eef05bae103fc3";
  
  // Grant role to new admin
  await accessControl.grantRole(MASTER_ADMIN_ROLE, newAdminAddress);
  
  // Revoke role from old admin
  await accessControl.revokeRole(MASTER_ADMIN_ROLE, "0x777382955f33Bb8540602E914D9b650C962EF6Cc");
  
  console.log("✅ Contract admin updated successfully");
}
```

## 🔍 **Verifica Cambio**

### **1. Verifica Frontend**
```typescript
import { getAdminAddress, isAdminAddress } from "@/config/admin";

console.log("Current admin:", getAdminAddress());
console.log("Is admin?", isAdminAddress("0x[ADDRESS]"));
```

### **2. Verifica Contratto**
```javascript
// Verifica che il nuovo indirizzo abbia il ruolo MASTER_ADMIN_ROLE
const hasRole = await accessControl.hasRole(MASTER_ADMIN_ROLE, newAdminAddress);
console.log("Has admin role:", hasRole);
```

## 📋 **Checklist per Cambio Admin**

- [ ] Aggiorna `config/admin.ts`
- [ ] Esegui `node scripts/update-admin-address.js [NEW_ADDRESS]`
- [ ] Aggiorna il contratto con `grantRole`/`revokeRole`
- [ ] Testa l'accesso admin nel frontend
- [ ] Verifica che tutte le funzioni admin funzionino
- [ ] Aggiorna la documentazione
- [ ] Notifica il team del cambio

## ⚠️ **Note Importanti**

1. **Backup**: Fai sempre backup prima di cambiare l'indirizzo admin
2. **Test**: Testa sempre in ambiente di sviluppo prima della produzione
3. **Coordinamento**: Coordina il cambio con il team per evitare interruzioni
4. **Rollback**: Mantieni l'indirizzo vecchio attivo fino a quando non sei sicuro che tutto funzioni

## 🚀 **Miglioramenti Futuri**

Per evitare questo problema in futuro:
1. Usa sempre `getAdminAddress()` invece di hardcodare
2. Considera l'uso di variabili d'ambiente per l'indirizzo admin
3. Implementa un sistema di gestione ruoli più flessibile
4. Aggiungi test automatici per verificare la configurazione admin


