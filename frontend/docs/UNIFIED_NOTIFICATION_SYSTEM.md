# Sistema di Notifiche Unificato per le Aste

## 🎯 **Obiettivo**

Eliminare le doppie notifiche e creare un sistema coerente e centralizzato per tutte le tipologie di asta.

## 🔧 **Componenti Principali**

### 1. **useUnifiedAuctionNotifications**

Hook principale che gestisce tutte le notifiche delle aste in modo centralizzato.

**Caratteristiche:**

- ✅ Prevenzione duplicazioni tramite tracking delle aste processate
- ✅ Gestione stato unificato per tutte le tipologie di asta
- ✅ Toast automatici solo per notifiche immediate
- ✅ Pulizia automatica delle notifiche vecchie (24h)
- ✅ Reset automatico quando cambia utente

**Tipi di notifica supportati:**

- `dutch_purchase` - Acquisto Dutch Auction
- `sealed_bid_win` - Vincita Sealed Bid
- `english_win` - Vincita English Auction
- `reserve_win` - Vincita Reserve Auction
- `auction_failed` - Asta fallita
- `claim_ready` - NFT pronto al claim

### 2. **useAuctionNotificationTriggers**

Hook per triggerare notifiche specifiche dalle aste.

**Funzioni disponibili:**

- `notifyDutchPurchase(auctionId, price, nftName?)`
- `notifySealedBidWin(auctionId, price, nftName?)`
- `notifyEnglishWin(auctionId, price, nftName?)`
- `notifyReserveWin(auctionId, price, nftName?)`
- `notifyAuctionFailed(auctionId, reason?)`
- `notifyClaimReady(auctionId, nftName?)`

### 3. **UnifiedAuctionNotificationsPanel**

Componente UI per visualizzare le notifiche unificate.

**Caratteristiche:**

- 🎨 Design coerente con icone specifiche per tipo
- 📱 Responsive e accessibile
- ⏰ Timestamp relativi (es. "2h ago")
- 🔄 Azioni: mark as read, remove, view collection
- 🎯 Navigazione diretta alla collezione

## 🚀 **Integrazione**

### Dutch Auction

```typescript
// Prima (con doppie notifiche)
toast.success(`Successfully purchased Dutch auction for ${price} ETH!`);

// Dopo (sistema unificato)
notifyDutchPurchase(auctionId.toString(), price);
```

### Sealed Bid Auction

```typescript
// Prima (con doppie notifiche)
toast.success(
  `🏆 Congratulations! You won auction #${auctionId} for ${price} ETH!`
);

// Dopo (sistema unificato)
notifySealedBidWin(
  auctionId.toString(),
  parseFloat(ethers.formatEther(highestBid))
);
```

### useAuctionNotifications (Collection Check)

```typescript
// Prima (toast duplicati)
toast.success(
  `🏆 Congratulations! You won auction #${auctionId} - ${auction.nftName}`
);

// Dopo (sistema unificato)
addNotification(notificationType, auctionId, {
  nftName: auction.nftName,
  price: auction.winningBid,
  source: "collection_check", // Evita toast duplicati
});
```

## 🔄 **Flusso delle Notifiche**

### 1. **Notifica Immediata**

- Triggerata direttamente dall'azione dell'utente
- Mostra toast immediato
- Salva nel sistema unificato

### 2. **Notifica da Collezione**

- Triggerata dal controllo periodico della collezione
- NON mostra toast (evita duplicazioni)
- Salva nel sistema unificato con `source: "collection_check"`

### 3. **Visualizzazione**

- Badge unificato mostra conteggio totale
- Priorità alle notifiche unificate (più recenti)
- Pannello dedicato per gestire tutte le notifiche

## 🛡️ **Prevenzione Duplicazioni**

### Tracking delle Aste Processate

```typescript
const notificationKey = `${type}_${auctionId}`;
if (state.lastProcessedAuctions.has(notificationKey)) {
  console.log(`🔔 Notification already processed for ${notificationKey}`);
  return;
}
```

### Distinzione Source

- `immediate` - Notifica immediata (mostra toast)
- `collection_check` - Notifica da collezione (no toast)

## 📊 **Stato delle Notifiche**

```typescript
interface NotificationState {
  notifications: AuctionNotification[];
  lastProcessedAuctions: Set<string>;
  isEnabled: boolean;
}

interface AuctionNotification {
  id: string;
  type: AuctionNotificationType;
  auctionId: string;
  nftName?: string;
  price?: number;
  timestamp: number;
  isRead: boolean;
  source: "immediate" | "collection_check";
}
```

## 🎨 **UI/UX**

### Badge Unificato

- **Colore**: Gradiente purple-pink per notifiche unificate
- **Icona**: Bell per priorità alle notifiche unificate
- **Conteggio**: Totale di tutte le notifiche (aste + trasferimenti + unificate)

### Pannello Notifiche

- **Layout**: Card-based con icone specifiche per tipo
- **Azioni**: Mark as read, Remove, View Collection
- **Timestamp**: Formato relativo (es. "2h ago", "Just now")
- **Stati**: Read/Unread con styling differenziato

## 🔧 **Configurazione**

### Abilitazione/Disabilitazione

```typescript
const { setNotificationsEnabled } = useUnifiedAuctionNotifications();
setNotificationsEnabled(false); // Disabilita tutte le notifiche
```

### Pulizia Automatica

- Notifiche più vecchie di 24 ore vengono rimosse automaticamente
- Controllo ogni ora per ottimizzare le performance

## 🧪 **Testing**

### Scenari di Test

1. **Dutch Auction Purchase**

   - ✅ Notifica immediata
   - ✅ Nessuna notifica duplicata da collezione
   - ✅ Badge aggiornato correttamente

2. **Sealed Bid Win**

   - ✅ Notifica immediata
   - ✅ Nessuna notifica duplicata da collezione
   - ✅ Eventi custom mantenuti per compatibilità

3. **Collection Check**
   - ✅ Notifiche da collezione senza toast
   - ✅ Tracking corretto delle aste processate
   - ✅ Reset quando cambia utente

## 📈 **Benefici**

### Per l'Utente

- 🎯 **Nessuna confusione**: Una sola notifica per evento
- 🎨 **Esperienza coerente**: Design unificato per tutte le aste
- ⚡ **Performance**: Meno toast = UI più fluida
- 🔍 **Controllo**: Gestione centralizzata delle notifiche

### Per lo Sviluppatore

- 🧹 **Codice pulito**: Logica centralizzata
- 🔧 **Manutenibilità**: Facile aggiungere nuovi tipi di asta
- 🐛 **Debug**: Tracking centralizzato degli eventi
- 📊 **Monitoraggio**: Statistiche unificate delle notifiche

## 🔮 **Estensioni Future**

### Nuove Tipologie di Asta

```typescript
// Aggiungere nuovo tipo
export type AuctionNotificationType =
  | "dutch_purchase"
  | "sealed_bid_win"
  | "english_win"
  | "reserve_win"
  | "blind_auction_win" // Nuovo tipo
  | "auction_failed"
  | "claim_ready";
```

### Notifiche Push

- Integrazione con service worker
- Notifiche browser native
- Persistenza offline

### Analytics

- Tracking delle interazioni
- Metriche di engagement
- A/B testing delle notifiche

## 🚨 **Note Importanti**

1. **Compatibilità**: Il sistema mantiene la compatibilità con i provider esistenti
2. **Performance**: Le notifiche vengono pulite automaticamente per evitare accumulo
3. **UX**: Priorità alle notifiche unificate nel badge per evidenziare le azioni più recenti
4. **Debug**: Logging dettagliato per facilitare il debugging

---

**Data Creazione**: ${new Date().toISOString().split('T')[0]}
**Versione**: 1.0.0
**Stato**: ✅ Implementato e Testato
