// generate_icons.js
// Generates standard AI PWA and Desktop application icons (PNG, SVG, ICO)
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
      <stop offset="0%" stop-color="#070a12"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f2fe"/>
      <stop offset="35%" stop-color="#38bdf8"/>
      <stop offset="70%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <linearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#67e8f9"/>
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="20" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  
  <!-- Base App Tile -->
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)"/>
  <rect x="12" y="12" width="488" height="488" rx="120" fill="none" stroke="url(#aiGrad)" stroke-width="6" opacity="0.75"/>
  
  <!-- Glowing Background Nebula -->
  <circle cx="256" cy="256" r="140" fill="url(#aiGrad)" filter="url(#glow)" opacity="0.35"/>
  
  <!-- AI Neural Orbit Ring -->
  <circle cx="256" cy="256" r="170" fill="none" stroke="url(#aiGrad)" stroke-width="3" stroke-dasharray="16 12" opacity="0.45"/>
  
  <!-- Central Gemini AI 4-Point Star -->
  <g transform="translate(256, 256)">
    <!-- Outer Star Glow -->
    <path d="M0,-150 Q0,0 -150,0 Q0,0 0,150 Q0,0 150,0 Q0,0 0,-150 Z" fill="url(#aiGrad)" filter="url(#glow)" opacity="0.9"/>
    <!-- Inner Core Star -->
    <path d="M0,-120 Q0,0 -120,0 Q0,0 0,120 Q0,0 120,0 Q0,0 0,-120 Z" fill="url(#coreGrad)"/>
    <!-- Secondary AI Sparkles -->
    <path d="M75,-85 Q75,-45 35,-45 Q75,-45 75,-5 Q75,-45 115,-45 Q75,-45 75,-85 Z" fill="#ffffff" opacity="0.95"/>
    <path d="M-80,75 Q-80,45 -50,45 Q-80,45 -80,15 Q-80,45 -110,45 Q-80,45 -80,75 Z" fill="#38bdf8" opacity="0.9"/>
  </g>
</svg>`;
}

function createIcoFromPng(pngBuffer) {
  // Simple single-image ICO wrapper for 256x256 / PNG
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(1, 4); // 1 image

  const entry = Buffer.alloc(16);
  entry.writeUInt8(0, 0); // 0 = 256px
  entry.writeUInt8(0, 1); // 0 = 256px
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(pngBuffer.length, 8); // size
  entry.writeUInt32LE(22, 12); // offset

  return Buffer.concat([header, entry, pngBuffer]);
}

function generateIcons(targetDirs) {
  const svg = getSvgContent();
  
  // AI Sparkle Star Pixel Shader for High-Res PNG
  const iconPixelFn = (x, y, w, h) => {
    const cx = w / 2, cy = h / 2;
    const dx = x - cx;
    const dy = y - cy;

    // Rounded rectangle corner check
    const cornerR = w * 0.24;
    const qx = Math.abs(dx) - (w / 2 - cornerR);
    const qy = Math.abs(dy) - (h / 2 - cornerR);
    let inCard = true;
    if (qx > 0 && qy > 0) {
      if (Math.hypot(qx, qy) > cornerR) inCard = false;
    }

    if (!inCard) {
      return [0, 0, 0, 0];
    }

    const dist = Math.hypot(dx, dy);
    const maxR = w * 0.35;

    // AI Star 4-point shape math: |dx|^0.5 + |dy|^0.5 < threshold
    const normX = Math.abs(dx) / maxR;
    const normY = Math.abs(dy) / maxR;
    const starDist = Math.sqrt(normX) + Math.sqrt(normY);

    if (starDist <= 1.0) {
      // Inside AI Star
      const factor = 1.0 - starDist;
      const r = Math.floor(180 + 75 * factor);
      const g = Math.floor(220 + 35 * factor);
      const b = 255;
      return [r, g, b, 255];
    }

    if (starDist <= 1.35) {
      // Glowing aura around AI Star
      const glowFactor = (1.35 - starDist) / 0.35;
      const r = Math.floor(139 * glowFactor);
      const g = Math.floor(92 * glowFactor);
      const b = Math.floor(246 * glowFactor + 40);
      return [r, g, b, 255];
    }

    // Border glowing stroke
    const isBorder = (x < w * 0.04 || x > w * 0.96 || y < h * 0.04 || y > h * 0.96);
    if (isBorder) {
      const u = x / w;
      return [Math.floor(0 + 236 * u), Math.floor(242 - 170 * u), 254, 255];
    }

    // Deep AI Cyber background
    const bgFactor = 1.0 - (dist / (w * 0.7));
    const r = Math.floor(11 + 20 * bgFactor);
    const g = Math.floor(15 + 25 * bgFactor);
    const b = Math.floor(26 + 60 * bgFactor);
    return [r, g, b, 255];
  };

  const png192 = createPng(192, 192, iconPixelFn);
  const png256 = createPng(256, 256, iconPixelFn);
  const png512 = createPng(512, 512, iconPixelFn);
  const icoData = createIcoFromPng(png256);

  targetDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'icon.svg'), svg, 'utf8');
    fs.writeFileSync(path.join(dir, 'icon-192.png'), png192);
    fs.writeFileSync(path.join(dir, 'icon-512.png'), png512);
    fs.writeFileSync(path.join(dir, 'apple-touch-icon.png'), png192);
    fs.writeFileSync(path.join(dir, 'icon.ico'), icoData);
    fs.writeFileSync(path.join(dir, 'icon.png'), png256);
    console.log(`[ICONS] Generated AI icons in ${dir}`);
  });
}

module.exports = {
  generateIcons,
  getSvgContent
};

if (require.main === module) {
  const rootDir = path.join(__dirname, '..');
  generateIcons([
    rootDir,
    path.join(rootDir, 'electron_tool'),
    path.join(rootDir, 'icons'),
    path.join(rootDir, 'docs', 'icons')
  ]);
}
