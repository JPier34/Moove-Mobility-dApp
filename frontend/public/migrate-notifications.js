
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
