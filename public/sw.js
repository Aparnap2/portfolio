// Service Worker for Portfolio Performance Optimization
const CACHE_NAME = 'portfolio-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/_next/static/css/',
  '/_next/static/js/'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - cache strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache static assets
  if (url.pathname.startsWith('/_next/static/') || 
      url.pathname.includes('.js') || 
      url.pathname.includes('.css') ||
      url.pathname.includes('.woff')) {
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request))
        .then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, responseClone));
          }
          return response;
        })
    );
  }

  // Cache GitHub API responses with shorter cache time
  else if (url.hostname === 'api.github.com') {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            const cacheDate = new Date(response.headers.get('date'));
            const now = new Date();
            // Cache for 5 minutes
            if (now - cacheDate < 300000) {
              return response;
            }
          }
          
          return fetch(request)
            .then(response => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(request, responseClone));
              }
              return response;
            })
            .catch(() => response || new Response('Offline', { status: 503 }));
        })
    );
  }
});