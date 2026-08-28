// server.js - Fast, lightweight HTTP & Static Server for Render / Cloud deployments
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.zip': 'application/zip',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse URL pathname safely
  let reqUrl = req.url.split('?')[0];
  if (reqUrl === '/' || reqUrl === '') {
    reqUrl = '/index.html';
  }

  // Prevent directory traversal
  const safePath = path.normalize(decodeURIComponent(reqUrl)).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(ROOT_DIR, safePath);

  // Check if file exists
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    // If not found, try index.html for SPA fallback
    filePath = path.join(ROOT_DIR, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const stat = fs.statSync(filePath);

  // Headers
  const headers = {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Cache-Control': ext === '.json' || ext === '.html' ? 'no-cache' : 'public, max-age=86400'
  };

  res.writeHead(200, headers);
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] Flashcard App is running on port ${PORT}`);
  console.log(`[SERVER] Local access: http://localhost:${PORT}`);
});
