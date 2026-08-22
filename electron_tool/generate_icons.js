// generate_icons.js
// Generates standard PWA icons (PNG and SVG)
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, drawFn) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function crc32(buf) {
    let c;
    let table = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[n] = c;
    }
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const toCrc = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(toCrc), 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

function getSvgContent() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0d14"/>
      <stop offset="100%" stop-color="#181c2b"/>
    </linearGradient>
    <linearGradient id="tkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff0050"/>
      <stop offset="50%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#00f2fe"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)"/>
  <rect x="16" y="16" width="480" height="480" rx="116" fill="none" stroke="url(#tkGrad)" stroke-width="8" opacity="0.6"/>
  
  <!-- Outer glowing card -->
  <rect x="80" y="80" width="352" height="352" rx="60" fill="url(#tkGrad)" filter="url(#glow)" opacity="0.25"/>
  <rect x="96" y="96" width="320" height="320" rx="50" fill="#131722" stroke="url(#tkGrad)" stroke-width="4"/>
  
  <!-- TikTok note + Flashcard Symbol -->
  <g transform="translate(256, 230) scale(1.4)">
    <path d="M-10,-60 L15,-60 C25,-60 38,-45 42,-25 C45,-5 42,0 42,0 L42,15 C35,15 25,5 20,-5 L20,35 C20,60 -5,75 -30,65 C-50,55 -55,30 -45,10 C-35,-10 -10,-10 -10,15 L-10,-60 Z" fill="url(#tkGrad)"/>
    <circle cx="-25" cy="40" r="16" fill="#00f2fe"/>
  </g>
  
  <!-- Text Label -->
  <text x="256" y="380" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="4">FLASHCARD</text>
</svg>`;
}

function generateIcons(targetDirs) {
  const svg = getSvgContent();
  
  const iconPixelFn = (x, y, w, h) => {
    const cx = w / 2, cy = h / 2;
    const dx = x - cx;
    const dy = y - cy;

    // Rounded rectangle corner check
    const cornerR = w * 0.22;
    const qx = Math.abs(dx) - (w / 2 - cornerR);
    const qy = Math.abs(dy) - (h / 2 - cornerR);
    let inCard = true;
    if (qx > 0 && qy > 0) {
      if (Math.hypot(qx, qy) > cornerR) inCard = false;
    }

    if (!inCard) {
      return [0, 0, 0, 0];
    }

    const u = x / w, v = y / h;
    const isBorder = (x < w * 0.05 || x > w * 0.95 || y < h * 0.05 || y > h * 0.95);
    if (isBorder) {
      const r = Math.floor(255 * (1 - u));
      const g = Math.floor(242 * u);
      const b = 254;
      return [r, g, b, 255];
    }

    const r = Math.floor(15 + 40 * (1 - u) * (1 - v));
    const g = Math.floor(18 + 20 * v);
    const b = Math.floor(30 + 50 * u * v);
    return [r, g, b, 255];
  };

  const png192 = createPng(192, 192, iconPixelFn);
  const png512 = createPng(512, 512, iconPixelFn);

  targetDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'icon.svg'), svg, 'utf8');
    fs.writeFileSync(path.join(dir, 'icon-192.png'), png192);
    fs.writeFileSync(path.join(dir, 'icon-512.png'), png512);
    fs.writeFileSync(path.join(dir, 'apple-touch-icon.png'), png192);
    console.log(`[ICONS] Generated PWA icons in ${dir}`);
  });
}

module.exports = {
  generateIcons,
  getSvgContent
};

if (require.main === module) {
  const rootDir = path.join(__dirname, '..');
  generateIcons([
    path.join(rootDir, 'icons'),
    path.join(rootDir, 'docs', 'icons')
  ]);
}
