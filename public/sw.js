// AdeGloba Starlink System - Service Worker
// Version 1.0.0 - PWA Support with Push Notifications

const CACHE_NAME = 'adegloba-starlink-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
  // Static assets will be cached dynamically
];

// Install event - Cache essential resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching essential resources');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️  Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - Network first with cache fallback strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external domains
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Don't cache API responses or non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response for caching
        const responseToCache = response.clone();

        // Cache static assets
        if (event.request.url.includes('.js') || 
            event.request.url.includes('.css') || 
            event.request.url.includes('.png') || 
            event.request.url.includes('.ico') ||
            event.request.url.includes('.json')) {
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((response) => {
          if (response) {
            console.log('📱 Service Worker: Serving from cache:', event.request.url);
            return response;
          }

          // Show offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/').then((response) => {
              return response || new Response('Çevrimdışı - AdeGloba Starlink sistemine bağlanılamıyor', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/html; charset=utf-8'
                })
              });
            });
          }

          return new Response('Çevrimdışı', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('📢 Service Worker: Push notification received');

  let notificationData = {
    title: 'AdeGloba Starlink',
    body: 'Yeni bir bildiriminiz var',
    icon: '/pwa-icon-192.png',
    badge: '/pwa-icon-192.png',
    data: { url: '/' },
    actions: [
      {
        action: 'open',
        title: 'Aç',
        icon: '/pwa-icon-192.png'
      },
      {
        action: 'close',
        title: 'Kapat'
      }
    ],
    requireInteraction: false,
    silent: false,
    tag: 'adegloba-notification'
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        ...notificationData,
        ...payload
      };
    } catch (error) {
      console.error('🚨 Service Worker: Error parsing push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
      .then(() => {
        console.log('✅ Service Worker: Notification shown successfully');
      })
      .catch((error) => {
        console.error('🚨 Service Worker: Error showing notification:', error);
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            if (urlToOpen !== '/') {
              client.navigate(urlToOpen);
            }
            return;
          }
        }

        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .catch((error) => {
        console.error('🚨 Service Worker: Error handling notification click:', error);
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered:', event.tag);

  if (event.tag === 'offline-orders') {
    event.waitUntil(syncOfflineOrders());
  }
});

// Sync offline orders when connection is restored
async function syncOfflineOrders() {
  try {
    console.log('🌐 Service Worker: Syncing offline orders...');
    
    // Get offline orders from IndexedDB or localStorage
    const offlineOrders = JSON.parse(localStorage.getItem('offlineOrders') || '[]');
    
    if (offlineOrders.length > 0) {
      console.log(`📦 Service Worker: Found ${offlineOrders.length} offline orders to sync`);
      
      for (const order of offlineOrders) {
        try {
          const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(order)
          });

          if (response.ok) {
            console.log('✅ Service Worker: Offline order synced successfully');
            // Remove synced order from storage
            const updatedOrders = offlineOrders.filter(o => o.id !== order.id);
            localStorage.setItem('offlineOrders', JSON.stringify(updatedOrders));
          }
        } catch (error) {
          console.error('🚨 Service Worker: Error syncing offline order:', error);
        }
      }
    }
  } catch (error) {
    console.error('🚨 Service Worker: Background sync failed:', error);
  }
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('💬 Service Worker: Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('🚀 AdeGloba Starlink Service Worker loaded successfully');