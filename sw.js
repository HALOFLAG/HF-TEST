// Service Worker - 讓手機網頁離線也能用
const CACHE_NAME = 'defect-logger-mobile-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
];

// 安裝時預先快取核心檔案
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 啟用時清掉舊快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      );
    }).then(() => self.clients.claim())
  );
});

// 攔截請求：優先從快取取，失敗再走網路（適合離線優先）
self.addEventListener('fetch', (event) => {
  const req = event.request;
  // 只處理 GET
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        // 把成功的回應存起來（限定同源）
        if (resp && resp.status === 200 && req.url.startsWith(self.location.origin)) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return resp;
      }).catch(() => {
        // 離線時如果是 html 請求，回傳主頁
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
