// registerSW.ts
// Call this once at app startup (e.g., in index.tsx)

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service Workers not supported in this browser.');
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      // Listen for new SW versions becoming available
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW] New version available. Refresh to update.');
            // You can dispatch a custom event here to show an "Update available" toast
            window.dispatchEvent(new CustomEvent('sw-update-available'));
          }
        });
      });

      // Listen for TRIGGER_SYNC messages from the SW (background sync)
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'TRIGGER_SYNC') {
          window.dispatchEvent(new CustomEvent('sw-trigger-sync'));
        }
      });

      // Register a Background Sync tag when going offline so the SW can
      // nudge the app to replay its queue when connectivity returns
      window.addEventListener('offline', async () => {
        try {

          if ('sync' in registration) {
            // @ts-expect-error
            await registration.sync.register('sync-pending-actions');
            console.log('[SW] Background sync registered.');
          }
        } catch (err) {
          console.warn('[SW] Background sync registration failed:', err);
        }
      });

      console.log('[SW] Registered successfully:', registration.scope);
    } catch (error) {
      console.error('[SW] Registration failed:', error);
    }
  });
}