# 🧠 Smart Notification System

## 📋 Panoramica

Il **Smart Notification System** è una soluzione ibrida che combina:

- **Queue Intelligente**: Una notifica alla volta nel pannello
- **Toast Raggruppati**: Batching intelligente per notifiche simili
- **Sistema di Priorità**: Le notifiche urgenti bypassano la queue

## 🎯 Problemi Risolti

### **Prima (Problemi)**

- ❌ **Toast Spam**: 5 aste vinte = 5 toast consecutivi
- ❌ **UX Confusa**: Notifiche multiple simultanee
- ❌ **Nessuna Priorità**: Tutte le notifiche trattate ugualmente
- ❌ **Overwhelming UI**: Pannello pieno di notifiche simili

### **Dopo (Soluzioni)**

- ✅ **Toast Intelligenti**: "You won 3 sealed bid auctions!" invece di 3 toast
- ✅ **Queue Controllata**: Una notifica alla volta nel pannello
- ✅ **Priorità Intelligente**: Le notifiche "claim_ready" sono sempre immediate
- ✅ **UX Pulita**: Controllo completo dell'utente

## 🏗️ Architettura

### **Componenti Principali**

```
useUnifiedAuctionNotifications
├── notificationQueue: AuctionNotification[]     // Queue per notifiche in attesa
├── currentNotification: AuctionNotification     // Notifica attualmente mostrata
├── pendingBatches: Map<string, AuctionNotification[]>  // Batch per tipo
└── Sistema di Priorità (1-5)
```

### **Sistema di Priorità**

| Priorità | Tipo             | Comportamento                    |
| -------- | ---------------- | -------------------------------- |
| **1**    | `claim_ready`    | 🚨 **Immediata** - Bypassa queue |
| **2**    | `sealed_bid_win` | 📋 Queue + Toast raggruppato     |
| **3**    | `dutch_purchase` | 📋 Queue + Toast raggruppato     |
| **3**    | `english_win`    | 📋 Queue + Toast raggruppato     |
| **3**    | `reserve_win`    | 📋 Queue + Toast raggruppato     |
| **4**    | `auction_failed` | 📋 Queue + Toast raggruppato     |

## 🔄 Flusso di Funzionamento

### **1. Nuova Notifica Arriva**

```typescript
addNotification("sealed_bid_win", "123", { price: 1.5 });
```

### **2. Sistema Determina Priorità**

```typescript
const priority = getNotificationPriority("sealed_bid_win"); // = 2
```

### **3. Gestione Basata su Priorità**

#### **Priorità 1 (claim_ready)**

```typescript
// Mostra immediatamente
setState((prev) => ({
  ...prev,
  notifications: [notification, ...prev.notifications],
}));
showToastForNotification(notification);
```

#### **Priorità 2-4 (altre notifiche)**

```typescript
// Aggiungi al batch
const existingBatch = newBatches.get(type) || [];
newBatches.set(type, [...existingBatch, notification]);

// Se è il primo del batch, mostra toast raggruppato dopo 1 secondo
if (existingBatch.length === 0) {
  setTimeout(() => batchSimilarNotifications(type), 1000);
}
```

### **4. Toast Raggruppato**

```typescript
// Invece di:
"🏆 You won sealed bid auction #123!";
"🏆 You won sealed bid auction #124!";
"🏆 You won sealed bid auction #125!";

// Mostra:
"🏆 Congratulations! You won 3 sealed bid auctions!";
```

### **5. Queue Management**

```typescript
// L'utente clicca sul badge
onClick={() => {
  if (unifiedQueueCount > 0) {
    showNextNotification(); // Mostra la prossima dalla queue
  }
  setShowUnifiedPanel(true);
}}
```

## 🎨 Interfaccia Utente

### **Badge Intelligente**

```typescript
// Conteggio totale include queue
const totalNotifications =
  auctionCount + transferCount + unifiedAuctionCount + unifiedQueueCount;

// Priorità visiva
if (hasUnifiedNotifications) {
  return { icon: Bell, gradient: "from-purple-500 to-pink-600" };
}
```

### **Pannello con Queue**

```typescript
// Header con indicatori
{
  unreadCount > 0 && (
    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
      {unreadCount}
    </span>
  );
}
{
  queueCount > 0 && (
    <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full ml-2">
      {queueCount} in queue
    </span>
  );
}

// Pulsante per mostrare la prossima notifica
{
  queueCount > 0 && (
    <button onClick={() => showNextNotification()}>Next ({queueCount})</button>
  );
}
```

## 🚀 Vantaggi

### **Per l'Utente**

- 🎯 **Nessuna Confusione**: Una notifica chiara alla volta
- ⚡ **Performance**: Meno toast = UI più fluida
- 🎨 **Controllo**: Decide quando vedere la prossima notifica
- 🚨 **Urgenza Preservata**: Le notifiche importanti sono sempre visibili

### **Per lo Sviluppatore**

- 🧹 **Codice Pulito**: Logica centralizzata e intelligente
- 🔧 **Manutenibilità**: Facile aggiungere nuovi tipi di notifica
- 🐛 **Debug**: Tracking completo degli eventi
- 📊 **Monitoraggio**: Statistiche unificate delle notifiche

## 🔧 Implementazione Tecnica

### **Hook Principale**

```typescript
export function useUnifiedAuctionNotifications() {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    notificationQueue: [],
    currentNotification: null,
    lastProcessedAuctions: new Set(),
    isEnabled: true,
    pendingBatches: new Map(),
  });

  // Funzioni principali
  const addNotification = useCallback(/* logica intelligente */);
  const showNextNotification = useCallback(/* gestione queue */);
  const batchSimilarNotifications = useCallback(/* toast raggruppati */);

  return {
    notifications: state.notifications,
    notificationQueue: state.notificationQueue,
    currentNotification: state.currentNotification,
    unreadCount: state.notifications.filter((n) => !n.isRead).length,
    queueCount: state.notificationQueue.length,
    addNotification,
    showNextNotification,
    // ... altre funzioni
  };
}
```

### **Batching Intelligente**

```typescript
const batchSimilarNotifications = useCallback(
  (type: AuctionNotificationType) => {
    const batch = state.pendingBatches.get(type) || [];

    let message = "";
    switch (type) {
      case "sealed_bid_win":
        message = `🏆 Congratulations! You won ${
          batch.length
        } sealed bid auction${batch.length > 1 ? "s" : ""}!`;
        break;
      // ... altri tipi
    }

    toast.success(message, { duration: 6000 });

    // Pulisci il batch
    setState((prev) => {
      const newBatches = new Map(prev.pendingBatches);
      newBatches.delete(type);
      return { ...prev, pendingBatches: newBatches };
    });
  },
  [state.pendingBatches]
);
```

## 📊 Esempi di Utilizzo

### **Scenario 1: Multiple Sealed Bid Wins**

```typescript
// Utente vince 3 sealed bid auctions simultaneamente
notifySealedBidWin("123", 1.5);
notifySealedBidWin("124", 2.0);
notifySealedBidWin("125", 1.8);

// Risultato:
// 1. Toast: "🏆 Congratulations! You won 3 sealed bid auctions!"
// 2. Queue: 3 notifiche in attesa nel pannello
// 3. Badge: Mostra "3" con indicatore queue
```

### **Scenario 2: Mix di Notifiche**

```typescript
// Utente vince 2 sealed bid + 1 dutch + 1 claim ready
notifySealedBidWin("123", 1.5);
notifySealedBidWin("124", 2.0);
notifyDutchPurchase("125", 3.0);
notifyClaimReady("126");

// Risultato:
// 1. Toast immediato: "🎁 NFT from auction #126 is ready to claim!"
// 2. Toast raggruppato: "🏆 Congratulations! You won 2 sealed bid auctions!"
// 3. Toast raggruppato: "✅ You successfully purchased 1 Dutch auction!"
// 4. Queue: 3 notifiche in attesa nel pannello
```

### **Scenario 3: Interazione Utente**

```typescript
// Utente clicca sul badge
onClick={() => {
  if (unifiedQueueCount > 0) {
    showNextNotification(); // Mostra la prossima dalla queue
  }
  setShowUnifiedPanel(true);
}}

// Risultato:
// 1. Pannello si apre
// 2. Una notifica viene mostrata dalla queue
// 3. Contatore queue diminuisce
// 4. Pulsante "Next (2)" disponibile per la prossima
```

## 🎯 Configurazione

### **Personalizzazione Priorità**

```typescript
const getNotificationPriority = (type: AuctionNotificationType): number => {
  const priority = {
    claim_ready: 1, // Massima priorità
    sealed_bid_win: 2, // Alta priorità
    dutch_purchase: 3, // Media priorità
    english_win: 3, // Media priorità
    reserve_win: 3, // Media priorità
    auction_failed: 4, // Bassa priorità
  };
  return priority[type] || 5;
};
```

### **Personalizzazione Toast**

```typescript
const batchSimilarNotifications = useCallback(
  (type: AuctionNotificationType) => {
    const batch = state.pendingBatches.get(type) || [];

    let message = "";
    let icon = "🏆";

    switch (type) {
      case "sealed_bid_win":
        message = `🏆 Congratulations! You won ${
          batch.length
        } sealed bid auction${batch.length > 1 ? "s" : ""}!`;
        break;
      // ... personalizza per ogni tipo
    }

    toast.success(message, {
      duration: 6000,
      position: "top-right",
      style: {
        background: type === "auction_failed" ? "#EF4444" : "#10B981",
        color: "white",
        fontWeight: "bold",
      },
    });
  },
  [state.pendingBatches]
);
```

## 🔮 Estensioni Future

### **Possibili Miglioramenti**

1. **Smart Grouping**: Raggruppa notifiche per NFT o prezzo
2. **Time-based Batching**: Raggruppa notifiche entro un timeframe
3. **User Preferences**: Permetti all'utente di configurare priorità
4. **Analytics**: Tracking delle interazioni con le notifiche
5. **Push Notifications**: Integrazione con notifiche browser

### **Nuovi Tipi di Notifica**

```typescript
// Facile aggiungere nuovi tipi
export type AuctionNotificationType =
  | "dutch_purchase"
  | "sealed_bid_win"
  | "english_win"
  | "reserve_win"
  | "auction_failed"
  | "claim_ready"
  | "new_auction_created" // 🆕 Nuovo tipo
  | "auction_ending_soon" // 🆕 Nuovo tipo
  | "bid_outbid"; // 🆕 Nuovo tipo
```

## 🎉 Conclusione

Il **Smart Notification System** risolve elegantemente i problemi di UX delle notifiche multiple, fornendo:

- ✅ **Controllo Utente**: Una notifica alla volta
- ✅ **Intelligenza**: Toast raggruppati e priorità
- ✅ **Flessibilità**: Facile estensione e personalizzazione
- ✅ **Performance**: UI fluida e responsiva

**Il sistema è ora pronto per gestire qualsiasi scenario di notifiche multiple con eleganza e efficienza!** 🚀
