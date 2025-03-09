const CACHE_NAME = 'silvi-game-cache-v1';

// *file da mettere in cache
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/joinare.css',
  '/joystick-controls.css',
  '/src/main.js',
  '/src/joinare.js',
  '/src/joystick.js',
  '/assets/player_sprites.png',
  '/assets/player2_sprites.png',
  '/assets/door.png',
  '/assets/door-locked.png',
  '/assets/chest.png',
  '/assets/floor.png',
  '/assets/floor1.png',
  '/assets/floor2.png',
  '/assets/floor3.png',
  '/assets/font/slkscr.ttf',
  '/assets/font/slkscrb.ttf',
  '/assets/font/slkscre.ttf',
  '/assets/font/slkscreb.ttf',
  '/socket.io/socket.io.js',
  '/manifest.json',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-144.png',
  '/icons/icon-152.png',
  '/icons/icon-192.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aperta');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Errore durante il caching delle risorse:', error);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('/socket.io/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.log('Errore nel fetch:', error);
          });
      })
  );
});

self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});