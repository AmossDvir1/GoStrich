#!/usr/bin/env node
/**
 * Generates solid-color placeholder PNG files for all assets referenced in app.json.
 * Run once with: node scripts/create-placeholder-assets.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// --- CRC32 ---
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const d = data || Buffer.alloc(0);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(d.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, d])));
  return Buffer.concat([len, t, d, crcBuf]);
}

function createPNG(width, height, hexColor) {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // IHDR: width(4) + height(4) + bitDepth(1) + colorType(1=RGB) + 3x0
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 2; // RGB

  // Raw scanlines: each row = 1 filter byte (0=None) + RGB per pixel
  const rowWidth = 1 + width * 3;
  const row = Buffer.alloc(rowWidth); // filter byte stays 0
  for (let x = 0; x < width; x++) {
    row[1 + x * 3]     = r;
    row[1 + x * 3 + 1] = g;
    row[1 + x * 3 + 2] = b;
  }

  const rows = [];
  for (let y = 0; y < height; y++) rows.push(row);
  const raw = Buffer.concat(rows);
  const compressed = zlib.deflateSync(raw);

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND'),
  ]);
}

// --- Asset definitions ---
const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'images');
fs.mkdirSync(ASSETS_DIR, { recursive: true });

const assets = [
  ['icon.png',                     1024, 1024, '#FF6B35'],
  ['android-icon-foreground.png',  1024, 1024, '#FF6B35'],
  ['android-icon-background.png',  1024, 1024, '#FFFFFF'],
  ['android-icon-monochrome.png',  1024, 1024, '#000000'],
  ['favicon.png',                    32,   32, '#FF6B35'],
  ['splash-icon.png',               200,  200, '#FF6B35'],
];

for (const [name, w, h, color] of assets) {
  const dest = path.join(ASSETS_DIR, name);
  if (fs.existsSync(dest)) {
    console.log(`skip  ${name} (already exists)`);
    continue;
  }
  process.stdout.write(`creating ${name} (${w}x${h})...`);
  fs.writeFileSync(dest, createPNG(w, h, color));
  console.log(' done');
}

console.log('\nAll assets ready in assets/images/');
