const CACHE_NAME = 'todos-cache';
const API_URL = 'https://jsonplaceholder.typicode.com/todos';
const TTL =  60 * 1000; // Time-to-live in milliseconds (1 minute)

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installed');
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only intercept requests to the target API
  if (url.href === API_URL) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Check TTL
            return cachedResponse.json().then((data) => {
              const now = Date.now();
              if (now - data.timestamp < TTL) {
                console.log('[Service Worker] Returning valid cached data');
                return new Response(JSON.stringify(data.response), {
                  headers: { 'Content-Type': 'application/json' },
                });
              } else {
                console.log('[Service Worker] Cache expired, fetching new data');
                return fetchAndCache(event.request, cache);
              }
            });
          } else {
            console.log('[Service Worker] No cache found, fetching data');
            return fetchAndCache(event.request, cache);
          }
        });
      })
    );
  }
});

// Helper function to fetch and cache new data
function fetchAndCache(request, cache) {
  return fetch(request)
    .then((response) => {
      if (!response || response.status !== 200) {
        console.error('[Service Worker] Fetch failed or invalid response');
        return response;
      }

      const responseClone = response.clone();

      // Save the response with a timestamp in the cache
      responseClone.json().then((data) => {
        const cacheData = {
          response: data,
          timestamp: Date.now(),
        };
        cache.put(request, new Response(JSON.stringify(cacheData), {
          headers: { 'Content-Type': 'application/json' },
        }));
        console.log('[Service Worker] Updated cache with new data');
      });

      return response;
    })
    .catch((error) => {
      console.error('[Service Worker] Fetch failed:', error);
      return new Response('{"error": "Network error occurred"}', {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    });
}
