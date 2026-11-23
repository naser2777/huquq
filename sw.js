// غيّر رقم الإصدار مع كل تحديث للتطبيق
var CACHE = 'huquq-old-v10';
var FONTS = 'huquq-fonts'; // الخطوط تُحفظ أول مرة وتبقى عبر التحديثات
var FILES = ['./', './index.html', './app.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  // cache:'reload' يتجاوز ذاكرة المتصفح حتى لا تُحفظ نسخة قديمة
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(FILES.map(function (u) { return new Request(u, { cache: 'reload' }); }));
  }));
  self.skipWaiting();
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE && k !== FONTS; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
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
  if (url.origin !== self.location.origin) return; // Google Drive وغيره: من الشبكة مباشرة
  // صفحة التطبيق: من الإنترنت أولًا (أحدث نسخة دائمًا)، والنسخة المحفوظة عند انقطاع الإنترنت
  if (e.request.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname)) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }).then(function (res) {
      if (res.ok) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put('./index.html', cp); }); }
      return res;
    }).catch(function () { return caches.match('./index.html'); }));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (r) {
    return r || fetch(e.request);
  }));
});
