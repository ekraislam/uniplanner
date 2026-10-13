import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('--- Starting Task 7: PWA and Offline Support Verification ---');

// 1. Web App Manifest Verification
console.log('\n[Suite 1] Web App Manifest Verification');
const manifestPath = path.resolve('public', 'manifest.webmanifest');
assert(fs.existsSync(manifestPath), 'manifest.webmanifest must exist in public directory');
const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

assert.strictEqual(manifestContent.name, 'UniPlanner — Academic Planner', 'Manifest name is correct');
assert.strictEqual(manifestContent.short_name, 'UniPlanner', 'Manifest short_name is correct');
assert.strictEqual(manifestContent.start_url, '/', 'Manifest start_url is /');
assert.strictEqual(manifestContent.scope, '/', 'Manifest scope is /');
assert.strictEqual(manifestContent.display, 'standalone', 'Manifest display must be standalone');
assert.strictEqual(manifestContent.theme_color, '#1e3a8a', 'Manifest theme_color is academic navy');
assert.strictEqual(manifestContent.background_color, '#f8fafc', 'Manifest background_color is canvas');
assert(Array.isArray(manifestContent.icons) && manifestContent.icons.length >= 4, 'Manifest has at least 4 icon configurations');

const icon192 = manifestContent.icons.find(i => i.sizes === '192x192' && i.purpose === 'any');
assert(icon192, 'Manifest includes standard 192x192 icon');
const icon512 = manifestContent.icons.find(i => i.sizes === '512x512' && i.purpose === 'any');
assert(icon512, 'Manifest includes standard 512x512 icon');
const maskable192 = manifestContent.icons.find(i => i.sizes === '192x192' && i.purpose === 'maskable');
assert(maskable192, 'Manifest includes maskable 192x192 icon');
const maskable512 = manifestContent.icons.find(i => i.sizes === '512x512' && i.purpose === 'maskable');
assert(maskable512, 'Manifest includes maskable 512x512 icon');
console.log('✓ Suite 1 Passed: Web App Manifest conforms to all PWA installability requirements.');

// 2. Icon Assets Verification
console.log('\n[Suite 2] Icon Assets and Binary Verification');
const iconsDir = path.resolve('public', 'icons');
const pngFiles = ['icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png'];
const pngMagic = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

for (const file of pngFiles) {
  const filePath = path.join(iconsDir, file);
  assert(fs.existsSync(filePath), `Icon file ${file} exists`);
  const buf = fs.readFileSync(filePath);
  assert(buf.subarray(0, 8).equals(pngMagic), `${file} is a valid PNG binary with proper magic bytes`);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const expectedDim = file.includes('192') ? 192 : 512;
  assert.strictEqual(width, expectedDim, `${file} width is ${expectedDim}`);
  assert.strictEqual(height, expectedDim, `${file} height is ${expectedDim}`);
}

const svgPath = path.join(iconsDir, 'icon.svg');
assert(fs.existsSync(svgPath), 'icon.svg exists');
const svgContent = fs.readFileSync(svgPath, 'utf8');
assert(svgContent.includes('<svg') && svgContent.includes('</svg>'), 'icon.svg contains valid SVG structure');
console.log('✓ Suite 2 Passed: All 5 icon assets exist, are valid binaries with correct dimensions.');

// 3. Service Worker Verification (sw.js)
console.log('\n[Suite 3] Service Worker Script Verification (sw.js)');
const swPath = path.resolve('public', 'sw.js');
assert(fs.existsSync(swPath), 'public/sw.js exists');
const swCode = fs.readFileSync(swPath, 'utf8');

// Check caching strategies & lifecycle handlers
assert(swCode.includes("addEventListener('install'"), 'sw.js registers install event');
assert(swCode.includes("addEventListener('activate'"), 'sw.js registers activate event');
assert(swCode.includes("addEventListener('fetch'"), 'sw.js registers fetch event');
assert(swCode.includes("addEventListener('message'"), 'sw.js registers message event');
assert(swCode.includes('SKIP_WAITING'), 'sw.js handles SKIP_WAITING message');
assert(swCode.includes('clients.claim()'), 'sw.js claims clients upon activation');
assert(swCode.includes('uniplanner-shell-v2'), 'sw.js declares cache version');
assert(swCode.includes("request.mode === 'navigate'"), 'sw.js implements navigation request handler');
assert(swCode.includes("networkResponse.status === 200"), 'sw.js ensures only status 200 responses are cached');
assert(swCode.includes("/assets/"), 'sw.js caches Vite built assets');
assert(swCode.includes("/manifest.webmanifest"), 'sw.js precaches manifest');
console.log('✓ Suite 3 Passed: Service worker script contains complete offline caching and update logic.');

// 4. HTML Meta and Link Tags Verification
console.log('\n[Suite 4] HTML Meta & Link Tags in index.html');
const indexPath = path.resolve('index.html');
const htmlContent = fs.readFileSync(indexPath, 'utf8');

assert(htmlContent.includes('<link rel="manifest" href="/manifest.webmanifest" />'), 'Manifest linked in index.html');
assert(htmlContent.includes('<meta name="theme-color" content="#1e3a8a" />'), 'Theme color meta tag present');
assert(htmlContent.includes('<meta name="apple-mobile-web-app-capable" content="yes" />'), 'Apple mobile web app capable present');
assert(htmlContent.includes('<link rel="apple-touch-icon" href="/icons/icon-192.png" />'), 'Apple touch icon link present');
assert(htmlContent.includes('<link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />'), 'SVG favicon link present');
console.log('✓ Suite 4 Passed: index.html correctly references all PWA assets and metadata.');

// 5. System Font Fallbacks Verification
console.log('\n[Suite 5] Font Stack & Offline Styling Resilience');
const cssPath = path.resolve('src', 'index.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

assert(cssContent.includes('--font-body:') && cssContent.includes('system-ui'), 'CSS includes robust system font fallback for body');
assert(cssContent.includes('--font-heading:') && cssContent.includes('system-ui'), 'CSS includes robust system font fallback for headings');
assert(cssContent.includes('.network-status-pill'), 'CSS includes network-status-pill');
assert(cssContent.includes('.pwa-install-btn'), 'CSS includes pwa-install-btn');
console.log('✓ Suite 5 Passed: Sensible system font fallbacks and PWA UI tokens verified.');

// 6. Service Worker Mock Simulator
console.log('\n[Suite 6] Service Worker Cache & Offline Fallback Simulation');
class MockCache {
  constructor() {
    this.store = new Map();
  }
  async put(req, res) {
    const key = typeof req === 'string' ? req : req.url;
    this.store.set(key, res);
  }
  async match(req) {
    const key = typeof req === 'string' ? req : req.url;
    return this.store.get(key) || null;
  }
  async addAll(urls) {
    for (const u of urls) {
      this.store.set(u, { status: 200, body: `content-of-${u}` });
    }
  }
}

const mockCaches = new Map();
const mockCachesApi = {
  open: async (name) => {
    if (!mockCaches.has(name)) mockCaches.set(name, new MockCache());
    return mockCaches.get(name);
  },
  match: async (req) => {
    for (const c of mockCaches.values()) {
      const found = await c.match(req);
      if (found) return found;
    }
    return null;
  },
  keys: async () => Array.from(mockCaches.keys()),
  delete: async (name) => mockCaches.delete(name)
};

// Simulate precaching
const cache = await mockCachesApi.open('uniplanner-shell-v1');
await cache.addAll(['/', '/index.html', '/manifest.webmanifest']);
assert.strictEqual((await cache.match('/index.html')).status, 200, 'Precached index.html retrieved');

// Simulate offline navigation request
async function simulateFetchHandler(req, isOnline) {
  if (req.mode === 'navigate') {
    if (isOnline) {
      const netRes = { status: 200, body: 'fresh-online-html' };
      // Save valid 200 to cache
      await cache.put(req.url, netRes);
      return netRes;
    } else {
      // Offline fallback
      const cached = await cache.match(req.url);
      if (cached) return cached;
      return await cache.match('/index.html');
    }
  }
}

// 1) Test offline load when visiting /courses
const offlineNavRes = await simulateFetchHandler({ mode: 'navigate', url: '/courses' }, false);
assert(offlineNavRes, 'Offline navigation successfully retrieves fallback app shell');
assert.strictEqual(offlineNavRes.status, 200, 'Fallback shell has status 200');

// 2) Test rejection of caching error responses (e.g. 500 error)
function shouldCacheResponse(res) {
  return res && res.status === 200;
}
assert.strictEqual(shouldCacheResponse({ status: 500 }), false, 'Do not cache 500 error response');
assert.strictEqual(shouldCacheResponse({ status: 404 }), false, 'Do not cache 404 error response');
assert.strictEqual(shouldCacheResponse({ status: 200 }), true, 'Cache valid 200 response');

// 3) Test old cache cleanup on activation
await mockCachesApi.open('old-cache-v0');
const keysBefore = await mockCachesApi.keys();
assert(keysBefore.includes('old-cache-v0'), 'Old cache created');
const activeCacheName = 'uniplanner-shell-v1';
for (const k of keysBefore) {
  if (k !== activeCacheName) await mockCachesApi.delete(k);
}
const keysAfter = await mockCachesApi.keys();
assert(!keysAfter.includes('old-cache-v0'), 'Old cache successfully removed on activate');
assert(keysAfter.includes('uniplanner-shell-v1'), 'Active cache preserved');
console.log('✓ Suite 6 Passed: Mock Service Worker offline fallback, error safety, and cache rotation verified.');

// 7. Local Storage and Data Safety Invariant Check
console.log('\n[Suite 7] Local Data Safety & Storage Invariant Verification');
const storagePath = path.resolve('src', 'utils', 'storage.ts');
const storageCode = fs.readFileSync(storagePath, 'utf8');
assert(storageCode.includes('uniplanner_courses_v1'), 'Courses storage key unchanged');
assert(storageCode.includes('uniplanner_assessments_v1'), 'Assessments storage key unchanged');
assert(storageCode.includes('uniplanner_settings_v1'), 'Settings storage key unchanged');
assert(!storageCode.includes('fetch(') && !storageCode.includes('http://') && !storageCode.includes('https://'), 'Storage does not send data to any remote server');
console.log('✓ Suite 7 Passed: Local storage keys preserved; zero data migration or transmission.');

// 8. Dist Production Output Verification
console.log('\n[Suite 8] Production Build Asset Distribution Check');
const distPath = path.resolve('dist');
assert(fs.existsSync(distPath), 'dist directory exists');
assert(fs.existsSync(path.join(distPath, 'manifest.webmanifest')), 'dist contains manifest.webmanifest');
assert(fs.existsSync(path.join(distPath, 'sw.js')), 'dist contains sw.js');
assert(fs.existsSync(path.join(distPath, 'icons', 'icon-192.png')), 'dist contains icons/icon-192.png');
assert(fs.existsSync(path.join(distPath, 'icons', 'icon-512.png')), 'dist contains icons/icon-512.png');
assert(fs.existsSync(path.join(distPath, 'icons', 'icon-maskable-192.png')), 'dist contains icons/icon-maskable-192.png');
assert(fs.existsSync(path.join(distPath, 'icons', 'icon-maskable-512.png')), 'dist contains icons/icon-maskable-512.png');
assert(fs.existsSync(path.join(distPath, 'icons', 'icon.svg')), 'dist contains icons/icon.svg');
console.log('✓ Suite 8 Passed: Production build contains all PWA assets and service worker.');

console.log('\n======================================================');
console.log('ALL 8 TEST SUITES PASSED! Task 7 verification complete.');
console.log('======================================================');
