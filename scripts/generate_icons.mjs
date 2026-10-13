import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// CRC32 table & calculation
const crcTable = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(w, h, rgbaCallback) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // 8 bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  const raw = Buffer.alloc(h * (1 + w * 4));
  let pos = 0;
  for (let y = 0; y < h; y++) {
    raw[pos++] = 0; // Filter 0 (None)
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = rgbaCallback(x, y, w, h);
      raw[pos++] = r;
      raw[pos++] = g;
      raw[pos++] = b;
      raw[pos++] = a;
    }
  }
  const idatData = zlib.deflateSync(raw, { level: 9 });
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Academic Brand Colors
// Royal Blue #1e3a8a = (30, 58, 138)
// Accent Cobalt #2563eb = (37, 99, 235)
// White #ffffff = (255, 255, 255)
// Gold/Amber accent #f59e0b = (245, 158, 11)

function renderIconPixel(x, y, w, h, isMaskable) {
  const u = (x + 0.5) / w; // 0..1
  const v = (y + 0.5) / h; // 0..1

  // Rounded squircle check for standard icon
  let alpha = 255;
  if (!isMaskable) {
    const radius = 0.22; // corner radius in normalized units
    let dx = 0, dy = 0;
    if (u < radius) dx = radius - u;
    else if (u > 1 - radius) dx = u - (1 - radius);
    if (v < radius) dy = radius - v;
    else if (v > 1 - radius) dy = v - (1 - radius);

    if (dx > 0 && dy > 0) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) {
        // antialiasing at the edge
        const edge = (dist - radius) * w;
        if (edge >= 1.0) return [0, 0, 0, 0];
        alpha = Math.round((1.0 - edge) * 255);
      }
    }
  }

  // Smooth background gradient from #1e3a8a (top) to #2563eb (bottom)
  const gradT = Math.min(Math.max((u * 0.4 + v * 0.8), 0), 1);
  let bgR = Math.round(30 * (1 - gradT) + 37 * gradT);
  let bgG = Math.round(58 * (1 - gradT) + 99 * gradT);
  let bgB = Math.round(138 * (1 - gradT) + 235 * gradT);

  // Subtle inner border highlight
  const marginU = Math.min(u, 1 - u);
  const marginV = Math.min(v, 1 - v);
  if (Math.min(marginU, marginV) < 0.02) {
    bgR = Math.min(255, bgR + 25);
    bgG = Math.min(255, bgG + 35);
    bgB = Math.min(255, bgB + 50);
  }

  // Center coordinate mapping for mortarboard cap icon
  // For maskable icon: scale to 68% to stay comfortably inside the 80% circular safe zone
  const scale = isMaskable ? 0.65 : 0.72;
  const cx = 0.5;
  const cy = 0.5;
  const nx = (u - cx) / scale; // -0.5 .. 0.5 corresponds to cap width
  const ny = (v - cy) / scale; // -0.5 .. 0.5 corresponds to cap height

  // Draw Academic Mortarboard Cap + Degree Scroll
  // 1. Cap Rhombus (top diamond):
  // Diamond centered at ny = -0.12, width = 0.8, height = 0.36
  const diamondX = Math.abs(nx) / 0.40;
  const diamondY = Math.abs(ny + 0.12) / 0.18;
  const inDiamond = (diamondX + diamondY) <= 1.0;

  // 2. Cap Skull Base (under the diamond):
  // Arc/Polygon between nx in [-0.22, 0.22], ny in [-0.02, 0.16]
  const inSkull = (Math.abs(nx) <= 0.22) && (ny >= -0.02) && (ny <= 0.16) &&
                  (Math.abs(nx) <= 0.22 - (ny - (-0.02)) * 0.3);

  // 3. Tassel (hanging from center to right side):
  // Center button at (0, -0.12)
  const distCenter = Math.sqrt(nx * nx + (ny + 0.12) * (ny + 0.12));
  const inButton = distCenter <= 0.04;

  // Tassel string to right tip (0.36, -0.02) and hanging down to (0.36, 0.18)
  const inTasselString = (nx >= 0 && nx <= 0.36 && Math.abs(ny - (-0.12 + 0.10 * (nx / 0.36))) < 0.025);
  const inTasselFringe = (Math.abs(nx - 0.36) <= 0.035 && ny >= 0.04 && ny <= 0.22);

  // 4. Academic Open Book or Honor Scroll below cap
  // In ny range [0.24, 0.38], nx range [-0.28, 0.28]
  const bookU = Math.abs(nx);
  const inBookPages = (bookU >= 0.02 && bookU <= 0.26 && ny >= 0.26 && ny <= 0.36 && (ny - 0.26) <= (0.10 - (bookU - 0.02) * 0.15));

  if (inButton || inTasselFringe) {
    // Gold/amber tassel accent
    return [245, 158, 11, alpha];
  }

  if (inDiamond || inSkull || inTasselString || inBookPages) {
    // Pure crisp white symbol
    return [255, 255, 255, alpha];
  }

  return [bgR, bgG, bgB, alpha];
}

// Generate icons directory
const iconsDir = path.resolve('public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Standard 192x192
console.log('Generating icon-192.png...');
const icon192 = encodePng(192, 192, (x, y, w, h) => renderIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), icon192);

// 2. Standard 512x512
console.log('Generating icon-512.png...');
const icon512 = encodePng(512, 512, (x, y, w, h) => renderIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), icon512);

// 3. Maskable 192x192
console.log('Generating icon-maskable-192.png...');
const maskable192 = encodePng(192, 192, (x, y, w, h) => renderIconPixel(x, y, w, h, true));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-192.png'), maskable192);

// 4. Maskable 512x512
console.log('Generating icon-maskable-512.png...');
const maskable512 = encodePng(512, 512, (x, y, w, h) => renderIconPixel(x, y, w, h, true));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512.png'), maskable512);

// 5. Scalable vector SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a" />
      <stop offset="100%" stop-color="#2563eb" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.25" />
    </filter>
  </defs>
  <rect width="512" height="512" rx="115" fill="url(#bgGrad)" />
  <rect x="12" y="12" width="488" height="488" rx="103" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="4" />
  <g filter="url(#shadow)" transform="translate(0, 8)">
    <!-- Mortarboard cap diamond -->
    <path d="M256 120 L432 208 L256 296 L80 208 Z" fill="#ffffff" stroke="#ffffff" stroke-width="6" stroke-linejoin="round" />
    <!-- Cap skull base -->
    <path d="M168 252 V320 C168 356, 344 356, 344 320 V252" fill="#ffffff" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
    <!-- Tassel string and fringe -->
    <path d="M256 208 Q380 220, 396 264" fill="none" stroke="#f59e0b" stroke-width="8" stroke-linecap="round" />
    <circle cx="396" cy="272" r="10" fill="#f59e0b" />
    <path d="M388 280 L404 280 L400 324 L392 324 Z" fill="#f59e0b" />
    <!-- Open academic book base -->
    <path d="M152 384 C192 372, 240 376, 256 392 C272 376, 320 372, 360 384 V420 C320 408, 272 412, 256 426 C240 412, 192 408, 152 420 Z" fill="#ffffff" opacity="0.95" />
  </g>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent);
console.log('All icons generated successfully in public/icons/');
