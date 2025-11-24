// Service Worker for Life Psychology Australia
// Optimized for Newcastle users with aggressive caching and performance

const CACHE_NAME = 'life-psychology-v1763566040177';
const OFFLINE_URL = '/offline.html';
const API_CACHE_NAME = 'life-psychology-api-v1763566040177';
const IMAGE_CACHE_NAME = 'life-psychology-images-v1763566040177';
const FONT_CACHE_NAME = 'life-psychology-fonts-v1763566040177';

// Cache strategies optimized for Australian latency
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only'
};

// Critical resources - preload these immediately for Newcastle users
const CRITICAL_RESOURCES = [
  '/', // Always cache the root page
  '/about',
  '/services',
  '/faq',
  '/privacy',
  '/offline.html',
  '/favicon.ico'
  // Removed '/static/manifest.json' and '/appointments' as they may not exist
];

// Static assets to cache (will be populated by build process)
const STATIC_ASSETS = [
  // CSS and JS bundles will be added here during build
];

// API endpoints to cache with short TTL for Australian users
const API_ENDPOINTS = [
  // Add API endpoints here when implemented
];

// Image domains - optimized for Australian content delivery
const IMAGE_DOMAINS = [
  'static1.squarespace.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'images.unsplash.com',
  'cdn.jsdelivr.net'
];

// Cache durations optimized for Newcastle latency (shortened for debugging)
const CACHE_DURATIONS = {
  CRITICAL: 1 * 60 * 60 * 1000, // 1 hour (was 24h)
  STATIC: 1 * 24 * 60 * 60 * 1000, // 1 day (was 7d)
  IMAGES: 7 * 24 * 60 * 60 * 1000, // 7 days (was 30d)
  FONTS: 30 * 24 * 60 * 60 * 1000, // 30 days (was 1y)
  API: 5 * 60 * 1000, // 5 minutes (unchanged)
};

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        // Cache critical resources individually to avoid failure if one doesn't exist
        const cachePromises = CRITICAL_RESOURCES.map(async (resource) => {
          try {
            await cache.add(resource);
            console.log('[SW] Cached:', resource);
          } catch (error) {
            console.warn('[SW] Failed to cache resource:', resource, error.message);
          }
        });

        await Promise.allSettled(cachePromises);
        console.log('[SW] Critical resources cache attempt completed');

        // Only cache static assets if they exist (skip in production where paths change)
        if (STATIC_ASSETS.length > 0) {
          const staticPromises = STATIC_ASSETS.map(async (asset) => {
            try {
              await cache.add(asset);
            } catch (error) {
              console.warn('[SW] Failed to cache static asset:', asset);
            }
          });
          await Promise.allSettled(staticPromises);
        }

      } catch (error) {
        console.error('[SW] Failed to cache resources:', error);
      }
    })()
  );

  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');

  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );

      // Take control of all clients
      await self.clients.claim();
      console.log('[SW] Service Worker activated and controlling clients');
    })()
  );
});

// Fetch event - serve from cache or network with different strategies
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip Service Worker completely for analytics/tracking domains
  const analyticsHosts = [
    'googletagmanager.com',
    'google-analytics.com',
    'analytics.google.com',
    'googleadservices.com',
    'doubleclick.net'
  ];

  if (analyticsHosts.some(host => url.hostname.includes(host))) {
    console.log('[SW] Skipping analytics request - letting browser handle:', url.hostname);
    return; // Critical: just return without event.respondWith()
  }

  console.log('[SW DEBUG] Fetching:', event.request.url); // Add debug logging

  // Choose caching strategy based on resource type
  let strategy = CACHE_STRATEGIES.NETWORK_FIRST;

  // Always use network-first for root index.html to ensure runtime injection works
  if (url.pathname === '/' || url.pathname === '/index.html') {
    strategy = CACHE_STRATEGIES.NETWORK_FIRST;
  } else if (event.request.url.includes('/api/') || API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
    strategy = CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
  } else if (IMAGE_DOMAINS.some(domain => url.hostname.includes(domain)) || event.request.destination === 'image') {
    strategy = CACHE_STRATEGIES.CACHE_FIRST;
  } else if (event.request.destination === 'font' || event.request.url.includes('font')) {
    strategy = CACHE_STRATEGIES.CACHE_FIRST;
  } else if (CRITICAL_RESOURCES.includes(url.pathname)) {
    strategy = CACHE_STRATEGIES.CACHE_FIRST;
  }

  event.respondWith(handleRequest(event.request, strategy));
});

// Handle requests with different caching strategies
async function handleRequest(request, strategy) {
  const url = new URL(request.url);

  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request);

    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request);

    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request);

    case CACHE_STRATEGIES.NETWORK_ONLY:
    default:
      return fetch(request);
  }
}

// Cache-first strategy (good for static assets)
async function cacheFirst(request) {
  const cacheName = getCacheNameForRequest(request);
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache-first failed:', request.url);
    return handleOfflineFallback(request);
  }
}

// Network-first strategy (good for dynamic content)
async function networkFirst(request) {
  const cacheName = getCacheNameForRequest(request);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return handleOfflineFallback(request);
  }
}

// Stale-while-revalidate strategy (good for API calls)
async function staleWhileRevalidate(request) {
  const cacheName = getCacheNameForRequest(request);
  const cache = await caches.open(cacheName);
  const cachedResponse = await caches.match(request);

  // Return cached version immediately if available
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse);
      }
    }).catch(() => {
      // Ignore background fetch errors
    });

    return cachedResponse;
  }

  // No cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return handleOfflineFallback(request);
  }
}

// Get appropriate cache name for request
function getCacheNameForRequest(request) {
  const url = new URL(request.url);

  if (request.url.includes('/api/') || API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
    return API_CACHE_NAME;
  } else if (IMAGE_DOMAINS.some(domain => url.hostname.includes(domain)) || request.destination === 'image') {
    return IMAGE_CACHE_NAME;
  } else {
    return CACHE_NAME;
  }
}

// Handle offline fallback
function handleOfflineFallback(request) {
  // If it's a navigation request, serve offline page
  if (request.mode === 'navigate') {
    return caches.match(OFFLINE_URL);
  }

  // For other requests, return a basic error response
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'Content not available offline'
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Background sync for form submissions (if implemented later)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'background-sync-forms') {
    event.waitUntil(syncForms());
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Helper function for background sync (placeholder for future form submissions)
async function syncForms() {
  console.log('[SW] Syncing forms in background');
  // Implementation for syncing form data when back online
  // This would be used for contact forms, appointment requests, etc.
}
