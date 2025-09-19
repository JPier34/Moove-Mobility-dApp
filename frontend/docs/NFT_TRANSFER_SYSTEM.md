# Sistema di Trasferimento NFT Completo

## Panoramica

È stato implementato un sistema completo per il trasferimento di NFT con:

1. **Blocco del tasto transfer** durante la transazione
2. **Modal di conferma** per il mittente
3. **Notifica di ricevuta** per il destinatario
4. **Sistema di notifiche** integrato

## Componenti Principali

### 1. Provider di Notifiche (`NFTTransferNotificationsProvider`)

**File**: `providers/NFTTransferNotificationsProvider.tsx`

- Gestisce lo stato globale dei trasferimenti NFT
- Fornisce modali di conferma e successo
- Gestisce le notifiche di ricevuta
- Include badge di notifica e indicatore di stato

**Stati gestiti**:

- `isTransferring`: Se un trasferimento è in corso
- `transferTokenId`: ID dell'NFT in trasferimento
- `transferRecipient`: Indirizzo del destinatario
- `notifications`: Array delle notifiche
- `unreadCount`: Numero di notifiche non lette

### 2. Hook di Trasferimento (`useNFTTransfer`)

**File**: `hooks/useNFTTransfer.ts`

- Integrato con il sistema di notifiche
- Gestisce la validazione e l'esecuzione dei trasferimenti
- Emette eventi per notificare altri componenti
- Gestisce errori e successi delle transazioni

**Funzioni principali**:

- `transferNFT()`: Avvia il processo di trasferimento
- `validateRecipientAddress()`: Valida l'indirizzo destinatario
- `verifyNFTOwnership()`: Verifica la proprietà dell'NFT

### 3. Modal di Trasferimento (`TransferNFTModalV2`)

**File**: `components/TransferNFTModalV2.tsx`

- Interfaccia utente per il trasferimento NFT
- Blocca i controlli durante l'elaborazione
- Mostra stati di caricamento e validazione
- Integrato con il sistema di notifiche

**Caratteristiche**:

- Validazione real-time dell'indirizzo
- Conferma prima dell'esecuzione
- Stati di caricamento visivi
- Gestione errori integrata

### 4. Sistema di Notifiche

#### Notifica di Ricevuta (`NFTReceivedNotification`)

**File**: `components/notifications/NFTReceivedNotification.tsx`

- Mostra notifiche quando si riceve un NFT
- Include pulsanti per visualizzare la collezione
- Animazioni fluide con Framer Motion

#### Badge di Notifica (`NFTTransferNotificationBadge`)

- Badge animato per notifiche non lette
- Posizionato in alto a destra
- Mostra il numero di notifiche pendenti

#### Indicatore di Stato (`TransferStatusIndicator`)

**File**: `components/TransferStatusIndicator.tsx`

- Mostra lo stato del trasferimento in corso
- Posizionato in alto al centro
- Include spinner e dettagli del trasferimento

### 5. Gestione Eventi

#### Listener di Trasferimento (`useNFTTransferListener`)

**File**: `hooks/useNFTTransferListener.ts`

- Ascolta eventi di trasferimento NFT
- Notifica automaticamente i destinatari
- Gestisce la logica di ricevuta

#### Handler di Conferma (`TransferConfirmationHandler`)

**File**: `components/TransferConfirmationHandler.tsx`

- Gestisce l'esecuzione effettiva del trasferimento
- Integrato con Wagmi per le transazioni blockchain
- Gestisce successi ed errori delle transazioni

## Flusso del Trasferimento

### 1. Inizio Trasferimento

1. L'utente inserisce l'indirizzo destinatario
2. Il sistema valida l'indirizzo
3. L'utente conferma il trasferimento
4. Viene mostrato il modal di conferma

### 2. Conferma e Esecuzione

1. L'utente conferma nel modal
2. Il sistema avvia la transazione blockchain
3. Viene mostrato l'indicatore di stato
4. I controlli vengono bloccati durante l'elaborazione

### 3. Completamento

1. La transazione viene confermata sulla blockchain
2. Viene mostrato il modal di successo
3. Le notifiche vengono aggiornate
4. La cache viene invalidata per aggiornare i dati

### 4. Notifica Destinatario

1. Il destinatario riceve una notifica
2. Viene mostrato il modal di ricevuta
3. Il badge di notifica viene aggiornato
4. L'utente può visualizzare la collezione

## Integrazione con Wagmi

Il sistema è completamente integrato con Wagmi:

- **`useWriteMooveNFT`**: Per eseguire le transazioni
- **`useWaitForTransactionReceipt`**: Per attendere la conferma
- **`useAccount`**: Per gestire l'account dell'utente
- **`useQueryClient`**: Per invalidare la cache

## Eventi Personalizzati

Il sistema emette eventi personalizzati per la comunicazione tra componenti:

- **`nftTransfer`**: Evento globale di trasferimento
- **`nftTransferReceived`**: Evento specifico per ricevuta
- **`nftTransferSent`**: Evento specifico per invio

## Caratteristiche di Sicurezza

1. **Validazione Completa**: Indirizzi, proprietà NFT, formato
2. **Simulazione**: Test della transazione prima dell'esecuzione
3. **Gestione Errori**: Cattura e gestione di tutti gli errori possibili
4. **Conferma Utente**: Richiesta di conferma esplicita
5. **Blocco Controlli**: Prevenzione di azioni multiple durante l'elaborazione

## Personalizzazione

Il sistema è completamente personalizzabile:

- **Temi**: Supporto per modalità chiara/scura
- **Animazioni**: Framer Motion per transizioni fluide
- **Stili**: Tailwind CSS per design responsive
- **Messaggi**: Toast notifications personalizzabili
- **Timeout**: Configurabili per diverse operazioni

## Utilizzo

### Per gli Sviluppatori

```typescript
// Usa il hook per gestire i trasferimenti
const { transferNFT, isPending, error } = useNFTTransfer();

// Usa il sistema di notifiche
const { notifications, unreadCount } = useNFTTransferNotifications();

// Ascolta eventi di trasferimento
useEffect(() => {
  const handleTransfer = (event) => {
    console.log("NFT transferred:", event.detail);
  };

  window.addEventListener("nftTransfer", handleTransfer);
  return () => window.removeEventListener("nftTransfer", handleTransfer);
}, []);
```

### Per gli Utenti

1. **Trasferire NFT**: Clicca su "Transfer" nella collezione
2. **Inserire Indirizzo**: Incolla o digita l'indirizzo destinatario
3. **Confermare**: Clicca "Confirm Transfer" nel modal
4. **Attendere**: Il sistema gestisce automaticamente il resto
5. **Ricevere Notifiche**: I destinatari ricevono notifiche automatiche

## Manutenzione

Il sistema è progettato per essere facilmente manutenibile:

- **Modularità**: Ogni componente ha una responsabilità specifica
- **Separazione**: Logica di business separata dall'UI
- **Testabilità**: Hook e componenti facilmente testabili
- **Estensibilità**: Facile aggiungere nuove funzionalità
- **Documentazione**: Codice ben documentato e commentato
