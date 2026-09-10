// Kill-switch service worker - 2026-09-10.
// An earlier build registered a caching service worker that is no longer shipped.
// Browsers still holding it keep serving a stale copy of the app, which is why some
// machines showed an old login screen and an empty dashboard. This replacement clears
// every cache, unregisters itself, and reloads open tabs onto the current build.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map((n) => caches.delete(n)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      try { client.navigate(client.url); } catch (e) { /* ignore */ }
    }
  })());
});
