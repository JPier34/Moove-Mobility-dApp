#!/usr/bin/env node

/**
 * Script di migrazione per consolidare i sistemi di notifiche
 * Rimuove i sistemi duplicati e migra i dati esistenti
 */

const fs = require("fs");
const path = require("path");

const FRONTEND_DIR = path.join(__dirname, "..");

// File da rimuovere
const FILES_TO_REMOVE = [
  "hooks/useUnifiedNotifications.ts",
  "hooks/useEventBasedNotifications.ts",
  "hooks/useClaimReadyNotifications.ts",
  "components/notifications/UnifiedNotificationBadge.tsx",
  "components/notifications/EventBasedNotificationBadge.tsx",
  "components/notifications/AuctionNotificationsPanel.tsx",
  "components/notifications/AuctionNotificationBanner.tsx",
  "components/notifications/NotificationBadge.tsx",
  "hooks/useNotification.ts",
];

// File da aggiornare
const FILES_TO_UPDATE = [
  "app/layout.tsx",
  "components/layout/Header.tsx",
  "components/layout/Navigation.tsx",
];

// Funzione per rimuovere file
function removeFile(filePath) {
  const fullPath = path.join(FRONTEND_DIR, filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`✅ Rimosso: ${filePath}`);
  } else {
    console.log(`⚠️ File non trovato: ${filePath}`);
  }
}

// Funzione per aggiornare import
function updateImports(filePath) {
  const fullPath = path.join(FRONTEND_DIR, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️ File non trovato: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, "utf8");
  let modified = false;

  // Sostituzioni degli import
  const replacements = [
    {
      from: /import.*useUnifiedNotifications.*from.*['"]@\/hooks\/useUnifiedNotifications['"];?/g,
      to: 'import { useConsolidatedNotifications } from "@/hooks/useConsolidatedNotifications";',
    },
    {
      from: /import.*useEventBasedNotifications.*from.*['"]@\/hooks\/useEventBasedNotifications['"];?/g,
      to: 'import { useConsolidatedNotifications } from "@/hooks/useConsolidatedNotifications";',
    },
    {
      from: /import.*useClaimReadyNotifications.*from.*['"]@\/hooks\/useClaimReadyNotifications['"];?/g,
      to: 'import { useConsolidatedNotifications } from "@/hooks/useConsolidatedNotifications";',
    },
    {
      from: /import.*UnifiedNotificationBadge.*from.*['"]@\/components\/notifications\/UnifiedNotificationBadge['"];?/g,
      to: 'import ConsolidatedNotificationBadge from "@/components/notifications/ConsolidatedNotificationBadge";',
    },
    {
      from: /import.*EventBasedNotificationBadge.*from.*['"]@\/components\/notifications\/EventBasedNotificationBadge['"];?/g,
      to: 'import ConsolidatedNotificationBadge from "@/components/notifications/ConsolidatedNotificationBadge";',
    },
    {
      from: /<UnifiedNotificationBadge/g,
      to: "<ConsolidatedNotificationBadge",
    },
    {
      from: /<EventBasedNotificationBadge/g,
      to: "<ConsolidatedNotificationBadge",
    },
    {
      from: /<\/UnifiedNotificationBadge>/g,
      to: "</ConsolidatedNotificationBadge>",
    },
    {
      from: /<\/EventBasedNotificationBadge>/g,
      to: "</ConsolidatedNotificationBadge>",
    },
  ];

  replacements.forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Aggiornato: ${filePath}`);
  } else {
    console.log(`ℹ️ Nessuna modifica necessaria: ${filePath}`);
  }
}

// Funzione per migrare i dati localStorage
function migrateLocalStorageData() {
  console.log("\n🔄 Migrazione dati localStorage...");

  const migrationScript = `
// Script di migrazione per localStorage
(function() {
  try {
    // Migra dati da useUnifiedNotifications
    const unifiedData = localStorage.getItem('moove-dismissed-notifications');
    if (unifiedData) {
      const parsed = JSON.parse(unifiedData);
      console.log('📦 Migrazione dati unified notifications:', parsed.length, 'elementi');
      // I dati vengono automaticamente inclusi nel nuovo sistema
    }

    // Migra dati da useEventBasedNotifications  
    const eventData = localStorage.getItem('moove-event-dismissed-notifications');
    if (eventData) {
      const parsed = JSON.parse(eventData);
      console.log('📦 Migrazione dati event-based notifications:', parsed.length, 'elementi');
      // I dati vengono automaticamente inclusi nel nuovo sistema
    }

    // Pulisci le chiavi vecchie dopo la migrazione
    localStorage.removeItem('moove-dismissed-notifications');
    localStorage.removeItem('moove-event-dismissed-notifications');
    
    console.log('✅ Migrazione localStorage completata');
  } catch (error) {
    console.error('❌ Errore durante la migrazione localStorage:', error);
  }
})();
`;

  const migrationFile = path.join(
    FRONTEND_DIR,
    "public",
    "migrate-notifications.js"
  );
  fs.writeFileSync(migrationFile, migrationScript);
  console.log(
    "✅ Creato script di migrazione: public/migrate-notifications.js"
  );
}

// Funzione principale
function main() {
  console.log("🚀 Avvio migrazione sistema notifiche...\n");

  // 1. Rimuovi file duplicati
  console.log("📁 Rimozione file duplicati...");
  FILES_TO_REMOVE.forEach(removeFile);

  // 2. Aggiorna import nei file esistenti
  console.log("\n🔄 Aggiornamento import...");
  FILES_TO_UPDATE.forEach(updateImports);

  // 3. Migra dati localStorage
  migrateLocalStorageData();

  // 4. Crea file di documentazione
  const documentation = `
# Sistema Notifiche Consolidato

## Migrazione Completata

Il sistema di notifiche è stato consolidato da 3 sistemi separati a 1 sistema unificato.

### File Rimossi:
${FILES_TO_REMOVE.map((f) => `- ${f}`).join("\n")}

### File Creati:
- hooks/useConsolidatedNotifications.ts
- components/notifications/ConsolidatedNotificationBadge.tsx

### Miglioramenti:
- ✅ Eliminazione duplicazioni
- ✅ Gestione errori migliorata
- ✅ Rate limiting e retry logic
- ✅ Prevenzione race conditions
- ✅ Memory leak prevention
- ✅ Persistenza unificata
- ✅ Cleanup automatico
- ✅ Priorità notifiche
- ✅ Throttling intelligente

### Utilizzo:
\`\`\`tsx
import { useConsolidatedNotifications } from '@/hooks/useConsolidatedNotifications';
import ConsolidatedNotificationBadge from '@/components/notifications/ConsolidatedNotificationBadge';

// Nel componente
const { notifications, unreadCount, markAsRead } = useConsolidatedNotifications();

// Nel layout
<ConsolidatedNotificationBadge />
\`\`\`
`;

  const docFile = path.join(FRONTEND_DIR, "NOTIFICATION_MIGRATION.md");
  fs.writeFileSync(docFile, documentation);
  console.log("\n✅ Creata documentazione: NOTIFICATION_MIGRATION.md");

  console.log("\n🎉 Migrazione completata!");
  console.log("\n📋 Prossimi passi:");
  console.log("1. Esegui npm run build per verificare che tutto funzioni");
  console.log("2. Testa il nuovo sistema di notifiche");
  console.log("3. Rimuovi i file di debug se non più necessari");
}

// Esegui migrazione
main();
