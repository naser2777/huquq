// غيّر رقم الإصدار مع كل تحديث للتطبيق حتى تصل التحديثات للجوال
var CACHE = 'huquq-old-v9';
var FONTS = 'huquq-fonts'; // الخطوط تُحفظ أول مرة وتبقى عبر التحديثات
var FILES = ['./', './index.html', './app.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }));
  self.skipWaiting();
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE && k !== FONTS; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  // خطوط Google: من الذاكرة إن وُجدت، وإلا تُجلب وتُحفظ
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(function (c) {
      return c.match(e.request).then(function (r) {
        return r || fetch(e.request).then(function (res) { if (res.ok || res.type === 'opaque') c.put(e.request, res.clone()); return res; });
      });
    }));
    return;
  }
  // ملفات التطبيق فقط من الذاكرة؛ أي طلب خارجي آخر (مثل Google Drive) يذهب للشبكة مباشرة
  if (url.origin !== self.location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (r) {
    return r || fetch(e.request);
  }));
});
