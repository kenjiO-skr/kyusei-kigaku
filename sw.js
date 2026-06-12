// sw.js — service worker（アプリシェルのキャッシュ）。
// パスはすべて相対：cache.addAll は sw.js の位置（=サブパス scope）を基準に解決される。
// 出荷物を増やしたらバージョンを上げてキャッシュを更新する。
const CACHE = 'kyusei-v6';

const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './src/ui/app.js',
  './src/ui/engine.js',
  './src/ui/board-view.js',
  './src/ui/glossary.js',
  './src/ui/format.js',
  './src/calc/constants.js',
  './src/calc/calendar-data.js',
  './src/calc/calendar.js',
  './src/calc/honmei.js',
  './src/calc/board.js',
  './src/calc/direction.js',
  './src/calc/fortune.js',
  './src/calc/compatibility.js',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png',
  './assets/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  // cache: 'reload' で HTTP キャッシュをバイパスする（GitHub Pages の max-age=600 により
  // デプロイ直後の再訪で旧アセットが新キャッシュへ封入されるのを防ぐ）。
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// キャッシュ優先＋ネットワークフォールバック。ナビゲーションは index.html を返す。
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).catch(() => {
        if (request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
