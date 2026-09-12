// Network first, cache as fallback: updates show up as soon as the iPad is online,
// and the last loaded version keeps working offline. No version bumps needed.
const CACHE = 'lernwiese';
const PRECACHE = [
  './',
  'manifest.json',
  'icon.png',
  'https://cdn.tailwindcss.com/3.4.17',
  'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@600;700;800&display=swap',
];
// ponytail: font files (gstatic) are not precached, they get cached on the second online start

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(cache => Promise.all(PRECACHE.map(url =>
    // no-cors: the Tailwind CDN sends no CORS header, so addAll() would reject its opaque response
    fetch(new Request(url, { mode: 'no-cors' })).then(res => cache.put(url, res))
  ))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // don't let an error page (e.g. a 404 mid-deploy) replace the working offline copy
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: e.request.mode === 'navigate' }))
  );
});
