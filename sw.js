'use strict';

/* ══════════════════════════════════════════════
   TACTICAL FITNESS — Service Worker v14
   แก้บัคจาก audit v12:
   - CACHE_NAME ตรงเวอร์ชัน (fix #2)
   - ใช้ relative path ทั้งหมด (fix #4)
   - แยก Google Fonts ออกจาก addAll (fix #3)
   - มี error handling ใน install (fix #5)
   - Offline fallback ครอบคลุม HTML + asset (fix #6)
   - ไม่มี console.log ใน production (fix #7)
   - ลบ cache เก่าทุกตัว ไม่ใช่แค่ key เดียว (fix #9)
══════════════════════════════════════════════ */

const CACHE_VERSION   = 'v14';
const CACHE_NAME      = `tactical-fitness-${CACHE_VERSION}`;
const CACHE_FONTS     = `tactical-fitness-fonts-${CACHE_VERSION}`;
const CACHE_RUNTIME   = `tactical-fitness-runtime-${CACHE_VERSION}`;

// ── Static assets (relative paths — ทำงานได้ทุก deploy path) ──
const STATIC_ASSETS = [
  './',
  './manifest.json',

  // CSS
  './css/base.css',
  './css/accessibility.css',
  './css/responsive.css',

  // Core JS
  './js/i18n.js',
  './js/core.js',
  './js/sidebar.js',
  './js/utils.js',
  './js/game-state.js',
  './js/event-bus.js',
  './js/more-nav.js',
  './js/engines-common.js',
  './js/phase1-notifications.js',
  './js/phase1-training.js',
  './js/phase2-engine.js',
  './js/phase3-engine.js',
  './js/phase4-engine.js',

  // Engines
  './js/engines/planner.js',
  './js/engines/rank.js',
  './js/engines/mission.js',
  './js/engines/fatigue.js',
  './js/engines/ultimate-engine.js',
  './js/engines/exercise-science-rules.js',

  // Pages
  './pages/dashboard.html',
  './pages/training.html',
  './pages/planner.html',
  './pages/performance.html',
  './pages/intel-center.html',
  './pages/ops-hub.html',
  './pages/ultimate-coach.html',
  './pages/science-planner.html',
  './pages/rank.html',
  './pages/missions.html',
  './pages/skill-tree.html',
  './pages/goals.html',
  './pages/profile.html',
  './pages/settings.html',
  './pages/import-export.html',
  './pages/onboarding.html',
  './pages/rankup.html',
  './index.html',
  './js/schema.js',
  './js/storage.js',
  './js/profile-sync.js',
  './pages/_nav.html',
];

// ── Google Fonts URLs — ไม่ใส่ใน addAll เพราะ CORS
//    จัดการผ่าน runtime caching แทน (fix #3)
const FONT_ORIGINS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// ════════════════════════════════════════════
// INSTALL — cache static assets พร้อม error
// handling รายไฟล์ ไม่ให้ fail ทั้งก้อน (fix #5)
// ════════════════════════════════════════════
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);

        // Cache ทีละไฟล์ เพื่อให้ไฟล์ที่ fail ไม่กระทบไฟล์อื่น
        const results = await Promise.allSettled(
          STATIC_ASSETS.map(url =>
            cache.add(url).catch(err => {
              return null; // ไม่ throw — install ยังดำเนินต่อได้
            })
          )
        );

        const failed = results.filter(r => r.status === 'rejected').length;

        // Skip waiting เพื่อให้ SW ใหม่เริ่มทันที
        await self.skipWaiting();
      } catch (err) {
        console.warn('[SW] install error:', err);
      }
    })()
  );
});

// ════════════════════════════════════════════
// ACTIVATE — ลบ cache เก่าทุกตัว ไม่ใช่แค่ key
// เดียว (fix #9) ป้องกัน cache หลายเวอร์ชันสะสม
// ════════════════════════════════════════════
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const allKeys = await caches.keys();
        const validCaches = new Set([CACHE_NAME, CACHE_FONTS, CACHE_RUNTIME]);

        await Promise.all(
          allKeys
            .filter(key => !validCaches.has(key))
            .map(key => caches.delete(key))
        );

        // ให้ SW ควบคุม client ทุกตัวทันที
        await self.clients.claim();
      } catch (err) {
        console.warn('[SW] activate error:', err);
      }
    })()
  );
});

// ════════════════════════════════════════════
// FETCH — Strategy:
//   Fonts  → Cache-first (CACHE_FONTS, runtime cache)
//   Pages  → Network-first + HTML offline fallback
//   Assets → Cache-first (JS/CSS/images)
//   API    → Network-only (ไม่ cache)
// ════════════════════════════════════════════
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ── ข้ามการ cache non-GET ──
  if (request.method !== 'GET') return;

  // ── Google Fonts → Runtime cache (fix #3) ──
  if (FONT_ORIGINS.some(origin => url.hostname.includes(origin))) {
    event.respondWith(cacheFirst(request, CACHE_FONTS));
    return;
  }

  // ── External API / CDN → Network only ──
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // ── HTML document → Network-first + offline fallback (fix #6) ──
  if (request.destination === 'document' || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // ── JS / CSS / Images → Cache-first ──
  event.respondWith(cacheFirst(request, CACHE_RUNTIME));
});

// ════════════════════════════════════════════
// STRATEGIES
// ════════════════════════════════════════════

/** Cache-first: ใช้ cache ถ้ามี ถ้าไม่มีค่อย fetch แล้ว cache */
async function cacheFirst(request, cacheName = CACHE_NAME) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone()); // async, ไม่ block response
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

/** Network-first: ลอง network ก่อน ถ้าไม่ได้ fallback ไป cache แล้วค่อย offline page */
async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // ลอง cache ของ URL นั้นก่อน
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fallback: คืน dashboard ถ้าไม่มีทั้งคู่ (fix #6 — ไม่ใช้ absolute path)
    const fallback = await caches.match('./pages/dashboard.html')
      || await caches.match('./');
    if (fallback) return fallback;

    // Last resort — offline page แบบ inline (ไม่ต้องพึ่ง file)
    return new Response(OFFLINE_HTML, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

// ── Inline offline fallback page ──
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TACTICAL FITNESS — Offline</title>
<style>
  body { background:#080808; color:#f0f0f0; font-family:'IBM Plex Mono',monospace;
    display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
  .box { text-align:center; padding:40px; }
  .logo { color:#00ff88; font-size:24px; letter-spacing:4px; margin-bottom:16px; }
  .msg  { color:#888; font-size:12px; letter-spacing:2px; margin-bottom:24px; }
  .sub  { color:#555; font-size:10px; }
  button { background:#00ff88; color:#000; border:none; padding:12px 24px;
    font-family:inherit; font-size:11px; letter-spacing:2px; cursor:pointer;
    border-radius:3px; margin-top:20px; }
</style>
</head>
<body>
<div class="box">
  <div class="logo">⬡ TACTICAL FITNESS</div>
  <div class="msg">// NO SIGNAL — OFFLINE MODE</div>
  <div class="sub">ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้<br>ข้อมูลที่บันทึกไว้ยังใช้งานได้ตามปกติ</div>
  <button onclick="location.reload()">↺ ลองใหม่</button>
</div>
</body>
</html>`;
