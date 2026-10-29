// Service Worker pour Noor Médecin (PWA & Offline First)
// Conforme CNDP Maroc : isolation et sécurité des données de santé

const CACHE_NAME = 'noor-medecin-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/brand/icon-192.svg',
  '/brand/icon-512.svg',
  '/brand/icon-maskable.svg',
  '/brand/apple-touch-icon.svg',
  '/index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Noor SW] Pre-caching partial failure, will cache on demand:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Network-first avec fallback cache pour les pages et requêtes GET
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignorer les requêtes d'extensions ou analytics externes
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Fallback pour la navigation HTML en cas de déconnexion totale
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
        }
        return new Response('Contenu temporairement indisponible hors-ligne', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
  );
});

// Gestion des Notifications Push Cliniques
self.addEventListener('push', (event) => {
  let data = {
    title: 'Noor Médecin (نُور)',
    body: 'Nouvelle alerte clinique pour votre cabinet.',
    icon: '/brand/icon-192.svg',
    badge: '/brand/icon-192.svg',
    tag: 'clinical-alert',
  };

  try {
    if (event.data) {
      data = Object.assign(data, event.data.json());
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/brand/icon-192.svg',
    badge: data.badge || '/brand/icon-192.svg',
    vibrate: [200, 100, 200],
    data: data.data || { url: '/agenda' },
    actions: [
      { action: 'open', title: 'Ouvrir le dossier' },
      { action: 'dismiss', title: 'Ignorer' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/agenda';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
