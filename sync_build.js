// sync_build.js - Build script for Render and local builds
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;

console.log('[BUILD] Starting sync & build process...');

// 1. Strip BOM from all JSON files
function cleanBOM(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const list = fs.readdirSync(dirPath);
  for (const f of list) {
    const full = path.join(dirPath, f);
    if (fs.statSync(full).isDirectory()) {
      cleanBOM(full);
    } else if (f.endsWith('.json')) {
      const buf = fs.readFileSync(full);
      let str = buf.toString('utf8');
      if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF || str.charCodeAt(0) === 0xFEFF) {
        str = str.replace(/^\uFEFF/, '');
        fs.writeFileSync(full, str, 'utf8');
        console.log(`[BUILD] Stripped BOM from: ${f}`);
      }
    }
  }
}

cleanBOM(path.join(rootDir, 'data'));
cleanBOM(path.join(rootDir, 'docs', 'data'));

// 2. Ensure docs directory matches root files for GitHub Pages
const docsDir = path.join(rootDir, 'docs');
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

const filesToSync = ['index.html', 'manifest.json', 'sw.js', 'favicon.ico', 'favicon.png', 'icon-192.png', 'icon-512.png', 'icon.png', 'icon.svg', 'apple-touch-icon.png'];
for (const file of filesToSync) {
  const src = path.join(rootDir, file);
  const dest = path.join(docsDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

console.log('[BUILD] Build & sync completed successfully!');
