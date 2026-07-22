self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        groupId: data.groupId || null,
        channelId: data.channelId || null
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var notifData = event.notification.data || {};
  var params = '';
  if (notifData.groupId) {
    params = '?groupId=' + encodeURIComponent(notifData.groupId);
    if (notifData.channelId) {
      params += '&channelId=' + encodeURIComponent(notifData.channelId);
    }
  }
  var targetUrl = self.location.origin + '/' + params;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            groupId: notifData.groupId,
            channelId: notifData.channelId
          });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

const CACHE_NAME = 'notrace-cache-v1';
const OFFLINE_URLS = ['/', '/favicon.ico'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((response) => {
        if (response) return response;
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        return new Response('', { status: 408, statusText: 'Request Timeout' });
      });
    })
  );
});
