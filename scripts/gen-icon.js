'use strict';
// Generates images/icon.png using only Node.js built-in modules (no npm deps).

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── CRC32 (required for PNG chunks) ──────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// ── PNG encoder ───────────────────────────────────────────────────────────────
function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const lenBuf    = Buffer.allocUnsafe(4);  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput  = Buffer.concat([typeBytes, data]);
  const crcBuf    = Buffer.allocUnsafe(4);  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

function encodePng(w, h, rgba) {
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = ihdr[11] = ihdr[12] = 0; // 8-bit RGBA

  // Scanlines with filter byte 0 (None) prepended to each row
  const raw = Buffer.allocUnsafe(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0;
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4;
      const d = y * (1 + w * 4) + 1 + x * 4;
      raw[d] = rgba[s]; raw[d+1] = rgba[s+1]; raw[d+2] = rgba[s+2]; raw[d+3] = rgba[s+3];
    }
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Pixel buffer ──────────────────────────────────────────────────────────────
const W = 128, H = 128;
const rgba = new Uint8Array(W * H * 4);

function put(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 4;
  if (a >= 255) {
    rgba[i] = r; rgba[i+1] = g; rgba[i+2] = b; rgba[i+3] = 255;
    return;
  }
  const fa = a / 255, ba = rgba[i+3] / 255;
  const oa = fa + ba * (1 - fa);
  if (oa < 1e-6) return;
  rgba[i]   = Math.round((r * fa + rgba[i]   * ba * (1 - fa)) / oa);
  rgba[i+1] = Math.round((g * fa + rgba[i+1] * ba * (1 - fa)) / oa);
  rgba[i+2] = Math.round((b * fa + rgba[i+2] * ba * (1 - fa)) / oa);
  rgba[i+3] = Math.round(oa * 255);
}

// Antialiased filled circle
function fillCircle(cx, cy, r, R, G, B) {
  for (let y = Math.ceil(cy - r - 1); y <= Math.floor(cy + r + 1); y++)
    for (let x = Math.ceil(cx - r - 1); x <= Math.floor(cx + r + 1); x++) {
      const a = Math.min(255, Math.max(0, (r + 0.5 - Math.hypot(x - cx, y - cy)) * 255)) | 0;
      if (a > 0) put(x, y, R, G, B, a);
    }
}

// Antialiased ring (circle outline)
function drawRing(cx, cy, r, t, R, G, B) {
  const inner = r - t;
  for (let y = Math.ceil(cy - r - 2); y <= Math.floor(cy + r + 2); y++)
    for (let x = Math.ceil(cx - r - 2); x <= Math.floor(cx + r + 2); x++) {
      const d  = Math.hypot(x - cx, y - cy);
      const ao = Math.max(0, r + 0.5 - d);
      const ai = Math.max(0, d - inner + 0.5);
      const a  = Math.min(ao, ai, 1) * 255 | 0;
      if (a > 0) put(x, y, R, G, B, a);
    }
}

// Antialiased line with round caps
function drawLine(x1, y1, x2, y2, t, R, G, B) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  if (len === 0) return;
  const nx = dx / len, ny = dy / len;
  const pad = Math.ceil(t + 2);
  for (let y = Math.floor(Math.min(y1, y2)) - pad; y <= Math.ceil(Math.max(y1, y2)) + pad; y++)
    for (let x = Math.floor(Math.min(x1, x2)) - pad; x <= Math.ceil(Math.max(x1, x2)) + pad; x++) {
      const px = x - x1, py = y - y1;
      const proj = px * nx + py * ny;
      const dist = proj < 0   ? Math.hypot(px, py)
                 : proj > len ? Math.hypot(x - x2, y - y2)
                 : Math.abs(px * ny - py * nx);
      const a = Math.min(255, Math.max(0, (t + 0.5 - dist) * 255)) | 0;
      if (a > 0) put(x, y, R, G, B, a);
    }
}

// Pixel-font glyph renderer
function drawGlyph(bitmap, ox, oy, scale, R, G, B) {
  for (let row = 0; row < bitmap.length; row++)
    for (let col = 0; col < bitmap[row].length; col++)
      if (bitmap[row][col])
        for (let dy = 0; dy < scale; dy++)
          for (let dx = 0; dx < scale; dx++)
            put(ox + col * scale + dx, oy + row * scale + dy, R, G, B);
}

// ── Icon design ───────────────────────────────────────────────────────────────

// 1. Dark navy background #1A1A2E
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++)
    put(x, y, 26, 26, 46);

// 2. Lens body (slightly lighter fill inside glass)
const CX = 50, CY = 50, RADIUS = 38;
fillCircle(CX, CY, RADIUS, 36, 36, 65);

// 3. Amber ring — magnifying glass frame
drawRing(CX, CY, RADIUS, 6, 240, 165, 0);

// 4. Handle going to bottom-right
drawLine(80, 80, 114, 114, 7, 200, 135, 0);

// 5. "/**" pixel art inside lens (scale 3 → each char 15×21 px)
//    Total width: (5*3 + 2) * 3 = 51 px, centered around CX=50
const SLASH = [
  [0,0,0,0,1],
  [0,0,0,1,0],
  [0,0,0,1,0],
  [0,0,1,0,0],
  [0,0,1,0,0],
  [0,1,0,0,0],
  [0,1,0,0,0],
];
const STAR = [
  [0,0,0,0,0],
  [0,0,1,0,0],
  [1,0,1,0,1],
  [0,1,1,1,0],
  [1,0,1,0,1],
  [0,0,1,0,0],
  [0,0,0,0,0],
];

const SCALE = 3;
const GLYPH_W = 5 * SCALE + 2; // 17 px per glyph slot
const TOTAL_W = GLYPH_W * 3;   // 51 px for "/**"
const GLYPH_H = 7 * SCALE;     // 21 px

const startX = Math.round(CX - TOTAL_W / 2);
const startY = Math.round(CY - GLYPH_H / 2);

drawGlyph(SLASH, startX,              startY, SCALE, 220, 220, 255);
drawGlyph(STAR,  startX + GLYPH_W,   startY, SCALE, 240, 185,  80);
drawGlyph(STAR,  startX + GLYPH_W*2, startY, SCALE, 240, 185,  80);

// ── Write PNG ─────────────────────────────────────────────────────────────────
const outDir  = path.join(__dirname, '..', 'images');
const outPath = path.join(outDir, 'icon.png');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, encodePng(W, H, rgba));
console.log('Generated:', outPath);
