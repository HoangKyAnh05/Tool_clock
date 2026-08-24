// generate_icons.js
// Generates crystal-clear, high-visibility AI Gemini icons for Web PWA, Favicon and Desktop App using Sharp
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function getSvgContent() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#311042"/>
    </linearGradient>

    <!-- Vibrant AI Rainbow Gradient -->
    <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f2fe"/>
      <stop offset="30%" stop-color="#38bdf8"/>
      <stop offset="65%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#ff007a"/>
    </linearGradient>

    <linearGradient id="starCore" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="60%" stop-color="#e0f2fe"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>

    <!-- Intense Radial Glow -->
    <radialGradient id="glowRadial" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#00f2fe" stop-opacity="0.8"/>
      <stop offset="45%" stop-color="#a855f7" stop-opacity="0.5"/>
      <stop offset="80%" stop-color="#ff007a" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <filter id="superGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- App Tile Background -->
  <rect width="512" height="512" rx="120" fill="url(#bgGrad)"/>
  <rect x="14" y="14" width="484" height="484" rx="110" fill="none" stroke="url(#aiGrad)" stroke-width="10" opacity="0.85"/>

  <!-- Radial Nebula Glow Behind Star -->
  <circle cx="256" cy="256" r="210" fill="url(#glowRadial)"/>

  <!-- AI Neural Orbit Rings -->
  <circle cx="256" cy="256" r="185" fill="none" stroke="#00f2fe" stroke-width="4" stroke-dasharray="14 10" opacity="0.6"/>
  <ellipse cx="256" cy="256" rx="200" ry="90" fill="none" stroke="#a855f7" stroke-width="3" stroke-dasharray="18 12" transform="rotate(-30 256 256)" opacity="0.5"/>
  <ellipse cx="256" cy="256" rx="200" ry="90" fill="none" stroke="#ff007a" stroke-width="3" stroke-dasharray="18 12" transform="rotate(30 256 256)" opacity="0.5"/>

  <!-- Orbiting Neural Nodes -->
  <circle cx="90" cy="180" r="10" fill="#00f2fe"/>
  <circle cx="420" cy="330" r="10" fill="#ff007a"/>
  <circle cx="360" cy="130" r="8" fill="#a855f7"/>
  <circle cx="150" cy="390" r="8" fill="#38bdf8"/>

  <!-- BIG GLOWING 4-POINT GEMINI AI STAR -->
  <g transform="translate(256, 256)" filter="url(#superGlow)">
    <!-- Outer Radiant Star Layer -->
    <path d="M0,-175 Q0,-10 -175,0 Q-10,0 0,175 Q0,10 175,0 Q10,0 0,-175 Z" fill="url(#aiGrad)"/>
    <!-- Inner Super-Bright White Core -->
    <path d="M0,-135 Q0,-5 -135,0 Q-5,0 0,135 Q0,5 135,0 Q5,0 0,-135 Z" fill="url(#starCore)"/>
    <!-- Center Sparkle Burst -->
    <circle cx="0" cy="0" r="28" fill="#ffffff"/>
  </g>

  <!-- Secondary Companion AI Sparkle -->
  <g transform="translate(370, 140)">
    <path d="M0,-48 Q0,0 -48,0 Q0,0 0,48 Q0,0 48,0 Q0,0 0,-48 Z" fill="#ffffff"/>
  </g>
  <g transform="translate(140, 360)">
    <path d="M0,-36 Q0,0 -36,0 Q0,0 0,36 Q0,0 36,0 Q0,0 0,-36 Z" fill="#00f2fe"/>
  </g>
</svg>`;
}

async function generateIcons(targetDirs) {
  const svg = getSvgContent();
  const svgBuffer = Buffer.from(svg, 'utf8');

  // Render high-res PNGs using Sharp
  const png16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const png48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();
  const png64 = await sharp(svgBuffer).resize(64, 64).png().toBuffer();
  const png192 = await sharp(svgBuffer).resize(192, 192).png().toBuffer();
  const png256 = await sharp(svgBuffer).resize(256, 256).png().toBuffer();
  const png512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();

  // Multi-resolution ICO (16, 32, 48, 64, 256)
  const icoBuffers = [png16, png32, png48, png64, png256];
  const icoData = createMultiIco(icoBuffers);

  targetDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'icon.svg'), svg, 'utf8');
    fs.writeFileSync(path.join(dir, 'icon-192.png'), png192);
    fs.writeFileSync(path.join(dir, 'icon-512.png'), png512);
    fs.writeFileSync(path.join(dir, 'apple-touch-icon.png'), png192);
    fs.writeFileSync(path.join(dir, 'favicon.ico'), icoData);
    fs.writeFileSync(path.join(dir, 'favicon.png'), png32);
    fs.writeFileSync(path.join(dir, 'icon.ico'), icoData);
    fs.writeFileSync(path.join(dir, 'icon.png'), png256);
    console.log(`[ICONS] Generated crystal-clear AI icons in ${dir}`);
  });
}

function createMultiIco(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  const entries = [];
  let currentOffset = 6 + count * 16;

  const sizes = [16, 32, 48, 64, 256];

  for (let i = 0; i < count; i++) {
    const buf = pngBuffers[i];
    const size = sizes[i] || 256;
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // image data size
    entry.writeUInt32LE(currentOffset, 12); // offset
    entries.push(entry);
    currentOffset += buf.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

module.exports = {
  generateIcons,
  getSvgContent
};

if (require.main === module) {
  (async () => {
    const rootDir = path.join(__dirname, '..');
    await generateIcons([
      rootDir,
      path.join(rootDir, 'electron_tool'),
      path.join(rootDir, 'icons'),
      path.join(rootDir, 'docs'),
      path.join(rootDir, 'docs', 'icons')
    ]);
  })();
}
