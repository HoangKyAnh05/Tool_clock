// main.js - Electron main process
const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const fs   = require('fs');

let mainWin = null;

function createWindow() {
  mainWin = new BrowserWindow({
    width: 980,
    height: 820,
    show: false,
    backgroundColor: '#0f172a',
    frame: false,
    resizable: true,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });

  mainWin.loadFile(path.join(__dirname, 'index.html'));

  // Show as soon as window is ready
  mainWin.once('ready-to-show', () => {
    mainWin.show();
    mainWin.focus();
  });

  mainWin.on('maximize', () => {
    if (mainWin) mainWin.webContents.send('window-maximized', true);
  });

  mainWin.on('unmaximize', () => {
    if (mainWin) mainWin.webContents.send('window-maximized', false);
  });

  mainWin.on('closed', () => { mainWin = null; });
}

// Window control IPC
ipcMain.on('win-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});
ipcMain.on('win-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});
ipcMain.on('win-close',    (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});
ipcMain.on('open-external', (event, url) => { if (url) shell.openExternal(url); });
ipcMain.on('relaunch-app', () => {
  app.relaunch();
  app.exit(0);
});

ipcMain.on('open-study-window', (event, id, type) => {
  createStudyWindow(id, type);
});

function createStudyWindow(id, type) {
  const studyWin = new BrowserWindow({
    width: 800,
    height: 700,
    show: false,
    frame: false,
    resizable: true,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });

  studyWin.loadFile(path.join(__dirname, 'study.html'), { query: { id, type } });

  studyWin.once('ready-to-show', () => {
    studyWin.show();
  });

  studyWin.on('maximize', () => {
    studyWin.webContents.send('window-maximized', true);
  });

  studyWin.on('unmaximize', () => {
    studyWin.webContents.send('window-maximized', false);
  });
}

const https = require('https');

function fetchHtmlWithCookies(targetUrl, cookieString) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(targetUrl);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cookie': cookieString || ''
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            html: data
          });
        });
      });
      
      req.on('error', (err) => { reject(err); });
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

ipcMain.handle('fetch-url', async (event, url, options = {}) => {
  let tempWin = null;
  let targetUrl = url;
  
  if (url.includes('ieltsonlinetests.com') && 
      !url.endsWith('/solution') && 
      !url.includes('/solution/') && 
      !url.includes('/score/') && 
      !url.includes('/user/') &&
      !url.includes('/collection/') &&
      url.split('/').filter(Boolean).length >= 3) {
    if (options.skill !== 'speaking') {
      targetUrl = url.replace(/\/?$/, '/solution');
      console.log(`[MAIN] Rewriting IELTS Online Tests URL to solution page: ${targetUrl}`);
    }
  }
  
  console.log(`[MAIN] fetch-url called for URL: ${targetUrl}`);

  // For speaking module test page, if it doesn't end with /solution or /score/, try fetching it natively using logged-in cookies first.
  // This avoids client-side JavaScript redirects (which force the user to instructions/waiting room / microphone checks).
  if (url.includes('ieltsonlinetests.com') && options.skill === 'speaking' && !targetUrl.includes('/solution') && !targetUrl.includes('/score/')) {
    try {
      const { session } = require('electron');
      const cookies = await session.defaultSession.cookies.get({ url: 'https://ieltsonlinetests.com' });
      const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
      
      console.log('[MAIN] Attempting native HTTPS fetch with session cookies...');
      const fetchResult = await fetchHtmlWithCookies(targetUrl, cookieString);
      
      console.log(`[MAIN] Native fetch finished with status: ${fetchResult.statusCode}`);
      if (fetchResult.statusCode === 200 && (fetchResult.html.includes('part1') || fetchResult.html.includes('part2') || fetchResult.html.includes('part3'))) {
        console.log('[MAIN] Native fetch successful. Extracted HTML contains speaking parts. Returning.');
        return { html: fetchResult.html, base64Images: [] };
      } else {
        console.log('[MAIN] Native fetch did not return expected content or returned redirect/error. Falling back to BrowserWindow.');
      }
    } catch (err) {
      console.error('[MAIN] Native fetch error:', err);
    }
  }
  
  const checkAccessDenied = (html) => {
    // Check if score page has no score details (guest view) or contains login text
    if (url.includes('/score/') && !html.includes('score-detail') && !html.includes('Explanation') && !html.includes('correct-answer')) {
      console.log('[MAIN] Detected guest page redirect on score URL');
      return true;
    }
    return html.includes('You do not have permission') || 
           html.includes('Access denied') || 
           html.includes('You are not permitted to see this') ||
           html.includes('Sign in to your account') ||
           html.includes('login-form') ||
           html.includes('Please log in');
  };

  const extractImages = async (win) => {
    console.log('[MAIN] Extracting images from page...');
    try {
      const base64Images = await win.webContents.executeJavaScript(`
        (async () => {
          const excludeKeywords = ['logo', 'avatar', 'facebook', 'twitter', 'instagram', 'youtube', 'linkedin', 'social', 'icon', 'share', 'banner', 'flag', 'user', 'profile', 'nav', 'header', 'footer', 'arrow', 'loading', 'sign-in', 'register', 'google'];
          
          const imgElements = Array.from(document.querySelectorAll('img')).filter(img => {
            const src = (img.src || '').toLowerCase();
            const alt = (img.alt || '').toLowerCase();
            const className = (img.className || '').toLowerCase();
            const id = (img.id || '').toLowerCase();
            
            for (const kw of excludeKeywords) {
              if (src.includes(kw) || alt.includes(kw) || className.includes(kw) || id.includes(kw)) {
                return false;
              }
            }
            return true;
          });
          
          const promises = imgElements.map(img => {
            const realSrc = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('lazy-src') || img.src;
            if (!realSrc || realSrc.startsWith('data:image/svg+xml') || realSrc.startsWith('data:image/gif')) {
              return Promise.resolve(null);
            }
            
            const lowerSrc = realSrc.toLowerCase();
            const isRelevant = lowerSrc.includes('ieltsonlinetests') || 
                               lowerSrc.includes('amazonaws') || 
                               lowerSrc.includes('/test/') || 
                               lowerSrc.includes('/score/') || 
                               lowerSrc.includes('/files/') ||
                               lowerSrc.includes('cdn.');
                               
            if (!isRelevant) return Promise.resolve(null);
            
            return new Promise((resolve) => {
              const tempImg = new Image();
              tempImg.onload = () => {
                try {
                  const width = tempImg.naturalWidth || tempImg.width || 0;
                  const height = tempImg.naturalHeight || tempImg.height || 0;
                  
                  if (width > 0 && width < 180) {
                    resolve(null);
                    return;
                  }
                  if (height > 0 && height < 120) {
                    resolve(null);
                    return;
                  }
                  
                  const canvas = document.createElement('canvas');
                  canvas.width = width || 500;
                  canvas.height = height || 400;
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(tempImg, 0, 0);
                  resolve(canvas.toDataURL('image/png'));
                } catch (e) {
                  resolve(null);
                }
              };
              tempImg.onerror = () => resolve(null);
              tempImg.src = realSrc;
            });
          });
          
          const results = await Promise.all(promises);
          return results.filter(x => x !== null && x.startsWith('data:image/'));
        })()
      `);
      console.log(`[MAIN] Extracted ${base64Images.length} images successfully.`);
      return base64Images;
    } catch (e) {
      console.error('[MAIN] Image extraction error:', e);
      return [];
    }
  };

  try {
    tempWin = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false // Necessary for Canvas-based cross-domain base64 conversion
      }
    });

    tempWin.webContents.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log('[MAIN] Loading URL in hidden BrowserWindow...');
    const loadPromise = tempWin.loadURL(targetUrl);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout loading page')), 20000)
    );

    await Promise.race([loadPromise, timeoutPromise]);
    await new Promise(resolve => setTimeout(resolve, 1500));

    let html = await tempWin.webContents.executeJavaScript("document.documentElement.outerHTML");
    
    if (checkAccessDenied(html)) {
      console.log('[MAIN] Access denied or Login required. Opening login popup...');
      tempWin.destroy();
      tempWin = null;

      // Open a login window
      const loginWin = new BrowserWindow({
        width: 1000,
        height: 750,
        show: true,
        title: 'Đăng nhập IELTS Online Tests (Hãy đăng nhập rồi ĐÓNG cửa sổ này lại)',
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          spellcheck: false
        }
      });
      
      loginWin.webContents.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await loginWin.loadURL('https://ieltsonlinetests.com/user/login');
      
      // Wait for the user to finish login and close the window
      await new Promise((resolve) => {
        loginWin.on('closed', resolve);
      });
      console.log('[MAIN] Login window closed. Retrying fetch...');

      // Retry fetching
      tempWin = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: false
        }
      });
      tempWin.webContents.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      await Promise.race([
        tempWin.loadURL(targetUrl),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout loading page')), 20000))
      ]);
      await new Promise(resolve => setTimeout(resolve, 1500));
      html = await tempWin.webContents.executeJavaScript("document.documentElement.outerHTML");
      
      if (checkAccessDenied(html)) {
        throw new Error('Access Denied: Bạn cần đăng nhập tài khoản chứa kết quả thi này.');
      }
    }

    const base64Images = await extractImages(tempWin);
    if (tempWin) tempWin.destroy();
    
    console.log('[MAIN] Fetch-url successful. Returning results.');
    return { html, base64Images };
  } catch (e) {
    console.error('[MAIN] Failed to fetch URL:', e);
    if (tempWin && !tempWin.isDestroyed()) {
      tempWin.destroy();
    }
    throw new Error(e.message);
  }
});

const baseDataDir = app.isPackaged 
  ? path.join(path.dirname(process.execPath), 'data')
  : path.join(__dirname, 'data');

const templateDataDir = path.join(__dirname, 'data');

function copyFolderRecursiveSync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  if (fs.existsSync(source) && fs.lstatSync(source).isDirectory()) {
    const files = fs.readdirSync(source);
    files.forEach((file) => {
      const curSource = path.join(source, file);
      const curTarget = path.join(target, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, curTarget);
      } else {
        if (!fs.existsSync(curTarget)) {
          fs.copyFileSync(curSource, curTarget);
        }
      }
    });
  }
}

if (!fs.existsSync(baseDataDir)) {
  fs.mkdirSync(baseDataDir, { recursive: true });
}

if (app.isPackaged && fs.existsSync(templateDataDir)) {
  const filesToCopy = ['ielts_vault.json', 'general_vault.json', 'speaking_vault.json', 'video_challenge.json', 'memorize_vault.json', 'tiktok_music.json', 'comments_vault.json'];
  filesToCopy.forEach(file => {
    const src = path.join(templateDataDir, file);
    const dest = path.join(baseDataDir, file);
    if (fs.existsSync(src) && !fs.existsSync(dest)) {
      try {
        fs.copyFileSync(src, dest);
        console.log(`[MAIN] Initialized portable file: ${file}`);
      } catch (e) {
        console.error(`[MAIN] Failed to copy portable file ${file}:`, e);
      }
    }
  });

  const srcImgDir = path.join(templateDataDir, 'ielts_images');
  const destImgDir = path.join(baseDataDir, 'ielts_images');
  if (fs.existsSync(srcImgDir) && !fs.existsSync(destImgDir)) {
    try {
      copyFolderRecursiveSync(srcImgDir, destImgDir);
      console.log(`[MAIN] Initialized portable ielts_images folder`);
    } catch (e) {
      console.error(`[MAIN] Failed to copy portable images:`, e);
    }
  }
}

const ieltsPath = path.join(baseDataDir, 'ielts_vault.json');
const generalPath = path.join(baseDataDir, 'general_vault.json');
const speakingPath = path.join(baseDataDir, 'speaking_vault.json');
const videoChallengePath = path.join(baseDataDir, 'video_challenge.json');
const memorizePath = path.join(baseDataDir, 'memorize_vault.json');
const tiktokMusicPath = path.join(baseDataDir, 'tiktok_music.json');
const commentsVaultPath = path.join(baseDataDir, 'comments_vault.json');
const brainChainPath = path.join(baseDataDir, 'brain_chain.json');
let cachedBrainChain = null;
const imagesDir = path.join(baseDataDir, 'ielts_images');

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const urlHelper = require('url');

function rewriteImageUrls(items, targetImagesDir) {
  if (!items || !Array.isArray(items)) return;
  const targetPrefix = urlHelper.pathToFileURL(targetImagesDir).href;
  
  items.forEach(item => {
    if (item.fields) {
      if (Array.isArray(item.fields.images)) {
        item.fields.images = item.fields.images.map(img => {
          if (img && typeof img === 'string' && img.startsWith('file:///')) {
            const parts = img.split('ielts_images/');
            if (parts.length > 1) {
              return targetPrefix + '/' + parts[parts.length - 1];
            }
          }
          return img;
        });
      }
      if (item.fields.image && typeof item.fields.image === 'string' && item.fields.image.startsWith('file:///')) {
        const parts = item.fields.image.split('ielts_images/');
        if (parts.length > 1) {
          item.fields.image = targetPrefix + '/' + parts[parts.length - 1];
        }
      }
    }
  });
}

// Vault Memory Caches for performance optimization
let cachedIeltsVault = null;
let cachedGeneralVault = null;
let cachedSpeakingVault = null;
let cachedVideoChallenge = null;
let cachedMemorizeVault = null;
let cachedTiktokMusic = null;
let cachedCommentsVault = null;

ipcMain.handle('load-ielts-vault', async () => {
  if (cachedIeltsVault) {
    return cachedIeltsVault;
  }
  try {
    if (fs.existsSync(ieltsPath)) {
      const data = await fs.promises.readFile(ieltsPath, 'utf8');
      cachedIeltsVault = JSON.parse(data);
      rewriteImageUrls(cachedIeltsVault.items, imagesDir);
      return cachedIeltsVault;
    }
  } catch (e) {
    console.error('Failed to load IELTS vault:', e);
  }
  cachedIeltsVault = { challengeStartDate: '', items: [] };
  return cachedIeltsVault;
});

function broadcastVaultUpdate(type, data) {
  BrowserWindow.getAllWindows().forEach(win => {
    if (!win.isDestroyed()) {
      win.webContents.send('vault-updated', { type, data });
    }
  });
}

async function saveBase64ImageAsync(base64Str, prefix) {
  if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith('data:image/')) {
    return base64Str;
  }
  try {
    const matches = base64Str.match(/^data:image\/([A-Za-z\-+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return base64Str;
    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
    const filePath = path.join(imagesDir, filename);
    await fs.promises.writeFile(filePath, buffer);
    return urlHelper.pathToFileURL(filePath).href;
  } catch (e) {
    console.error('[MAIN] Failed to save base64 image:', e);
    return base64Str;
  }
}

ipcMain.on('copy-image', (event, pathOrBase64) => {
  try {
    const { clipboard, nativeImage } = require('electron');
    if (pathOrBase64.startsWith('data:image/')) {
      const img = nativeImage.createFromDataURL(pathOrBase64);
      clipboard.writeImage(img);
      console.log('[MAIN] Copied image from base64 string to clipboard');
    } else {
      let cleanPath = pathOrBase64;
      if (pathOrBase64.startsWith('file:///')) {
        cleanPath = urlHelper.fileURLToPath(pathOrBase64);
      }
      const img = nativeImage.createFromPath(cleanPath);
      if (img.isEmpty()) {
        console.error('[MAIN] Loaded nativeImage is empty for path:', cleanPath);
      } else {
        clipboard.writeImage(img);
        console.log('[MAIN] Copied image from file to clipboard:', cleanPath);
      }
    }
  } catch (e) {
    console.error('[MAIN] Failed to copy image:', e);
  }
});

ipcMain.handle('copy-prompt-and-image', async (event, text, pathOrBase64) => {
  try {
    const { clipboard, nativeImage } = require('electron');
    let img = null;
    if (pathOrBase64) {
      if (pathOrBase64.startsWith('data:image/')) {
        img = nativeImage.createFromDataURL(pathOrBase64);
      } else {
        let cleanPath = pathOrBase64;
        if (pathOrBase64.startsWith('file:///')) {
          cleanPath = urlHelper.fileURLToPath(pathOrBase64);
        }
        img = nativeImage.createFromPath(cleanPath);
      }
    }
    
    if (img && !img.isEmpty()) {
      clipboard.write({
        text: text,
        image: img
      });
      console.log('[MAIN] Copied prompt text and image to clipboard');
    } else {
      clipboard.writeText(text);
      console.log('[MAIN] Copied prompt text only (no image) to clipboard');
    }
    return true;
  } catch (e) {
    console.error('[MAIN] Failed to copy prompt and image:', e);
    return false;
  }
});

ipcMain.on('relaunch-app', () => {
  app.relaunch();
  app.exit(0);
});

ipcMain.on('write-clipboard-text', (event, text) => {
  try {
    const { clipboard } = require('electron');
    clipboard.writeText(text);
    console.log('[MAIN] Wrote text to clipboard:', text.substring(0, 50));
  } catch (err) {
    console.error('[MAIN] Failed to write text to clipboard:', err);
  }
});

// Helper to decode HTML entities for mobile scraper fallback
function decodeHTMLEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
}

async function translateTextInternal(text, targetLang = 'vi') {
  try {
    if (!text) return [ [], null, '' ];

    // Robust chunking for long text to bypass API length limits
    const maxChunkSize = 2000;
    const lines = text.split('\n');
    const chunks = [];
    let currentChunk = '';

    for (const line of lines) {
      if ((currentChunk + '\n' + line).length > maxChunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = line;
        } else {
          // If a single line exceeds the limit, split by sentences
          let sentences = line.split(/(?<=[.?!])\s+/);
          for (const sentence of sentences) {
            if ((currentChunk + ' ' + sentence).length > maxChunkSize) {
              if (currentChunk) {
                chunks.push(currentChunk);
                currentChunk = sentence;
              } else {
                // Force split by character length if sentence is still too long
                let pos = 0;
                while (pos < sentence.length) {
                  chunks.push(sentence.substring(pos, pos + maxChunkSize));
                  pos += maxChunkSize;
                }
              }
            } else {
              currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
            }
          }
        }
      } else {
        currentChunk = currentChunk ? currentChunk + '\n' + line : line;
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk);
    }

    const combinedData = [ [], null, '' ];
    for (const chunk of chunks) {
      const url = `https://translate.googleapis.com/translate_a/single?client=at&sl=auto&tl=${targetLang}&dt=t`;
      let chunkData;
      let success = false;

      // Strategy 1: Original Google Translate Single (POST)
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'curl/7.81.0'
          },
          body: `q=${encodeURIComponent(chunk)}`
        });
        if (response.ok) {
          chunkData = await response.json();
          success = true;
        } else {
          console.warn(`[MAIN] Primary Google Translate API returned status ${response.status}`);
        }
      } catch (err) {
        console.warn('[MAIN] Primary Google Translate API failed:', err.message);
      }

      // Strategy 2: Google Translate Mobile Web Scraper
      if (!success) {
        try {
          const mobileUrl = `https://translate.google.com/m?tl=${targetLang}&sl=auto&q=${encodeURIComponent(chunk)}`;
          const response = await fetch(mobileUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Mobile Safari/537.36'
            }
          });
          if (response.ok) {
            const html = await response.text();
            const match = html.match(/class="result-container">([^<]+)</) || html.match(/class="t0">([^<]+)</);
            if (match) {
              const trans = decodeHTMLEntities(match[1]);
              chunkData = [ [ [ trans, chunk ] ], null, 'en' ];
              success = true;
              console.log('[MAIN] Mobile scraper translation succeeded');
            } else {
              console.warn('[MAIN] Mobile scraper could not find translation text in HTML');
            }
          } else {
            console.warn(`[MAIN] Mobile scraper returned status ${response.status}`);
          }
        } catch (err) {
          console.warn('[MAIN] Mobile scraper failed:', err.message);
        }
      }

      // Strategy 3: MyMemory API
      if (!success) {
        try {
          const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|${targetLang}`;
          const response = await fetch(myMemoryUrl);
          if (response.ok) {
            const data = await response.json();
            if (data && data.responseData && data.responseData.translatedText) {
              const trans = data.responseData.translatedText;
              chunkData = [ [ [ trans, chunk ] ], null, 'en' ];
              success = true;
              console.log('[MAIN] MyMemory translation succeeded');
            } else {
              console.warn('[MAIN] MyMemory API returned empty or invalid response');
            }
          } else {
            console.warn(`[MAIN] MyMemory API returned status ${response.status}`);
          }
        } catch (err) {
          console.warn('[MAIN] MyMemory API failed:', err.message);
        }
      }

      if (!success || !chunkData) {
        throw new Error('All translation strategies failed');
      }

      if (chunkData && chunkData[0]) {
        combinedData[0].push(...chunkData[0]);
      }
      if (chunkData && chunkData[2] && !combinedData[2]) {
        combinedData[2] = chunkData[2];
      }
      if (chunks.length > 1) {
        await new Promise(r => setTimeout(r, 150));
      }
    }
    return combinedData;
  } catch (err) {
    console.error('[MAIN] Translation error in main process:', err);
    throw err;
  }
}

ipcMain.handle('translate-text', async (event, text, targetLang = 'vi') => {
  return translateTextInternal(text, targetLang);
});

ipcMain.handle('save-ielts-vault', async (event, data) => {
  try {
    cachedIeltsVault = data;
    if (data && Array.isArray(data.items)) {
      for (const item of data.items) {
        if (item.fields) {
          if (Array.isArray(item.fields.images)) {
            let hasBase64 = false;
            for (const img of item.fields.images) {
              if (typeof img === 'string' && img.startsWith('data:image/')) {
                hasBase64 = true;
                break;
              }
            }
            if (hasBase64) {
              item.fields.images = await Promise.all(
                item.fields.images.map(img => saveBase64ImageAsync(img, `ielts_img_${item.id}`))
              );
            }
          }
          if (item.fields.image && typeof item.fields.image === 'string' && item.fields.image.startsWith('data:image/')) {
            item.fields.image = await saveBase64ImageAsync(item.fields.image, `ielts_img_${item.id}`);
          }
        }
      }
    }
    await fs.promises.writeFile(ieltsPath, JSON.stringify(data), 'utf8');
    broadcastVaultUpdate('ielts', data);
    return data;
  } catch (e) {
    console.error('Failed to save IELTS vault:', e);
    return null;
  }
});

// -------------------------------------------------------
// Mobile Study Page Exporter (PageDrop 3-Day Ephemeral Page)
// -------------------------------------------------------
async function getBase64FromLocalFile(fileUrlOrPath) {
  try {
    let cleanPath = fileUrlOrPath;
    if (fileUrlOrPath.startsWith('file:///')) {
      cleanPath = urlHelper.fileURLToPath(fileUrlOrPath);
    }
    if (fs.existsSync(cleanPath)) {
      const buffer = await fs.promises.readFile(cleanPath);
      const ext = path.extname(cleanPath).toLowerCase().replace('.', '');
      const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
      return `data:${mime};base64,${buffer.toString('base64')}`;
    }
  } catch (e) {
    console.error('[MAIN] getBase64FromLocalFile error:', e);
  }
  return null;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatBilingualSegments(seg, targetFlag = '🇻🇳', translationColor = 'var(--green-light)') {
  if (!seg || !seg[0] || !seg[1]) return '';
  const orig = seg[1].trim();
  const trans = seg[0].trim();
  if (!orig) return '';

  let alternatingHtml = '';
  if (orig.includes('\n')) {
    const origLines = orig.split('\n').map(l => l.trim());
    const transLines = trans.split('\n').map(l => l.trim());
    
    const origContent = origLines.filter(l => l.length > 0);
    const transContent = transLines.filter(l => l.length > 0);
    
    if (origContent.length === transContent.length) {
      for (let i = 0; i < origContent.length; i++) {
        alternatingHtml += '<span class="sentence-en">' + escapeHtml(origContent[i]) + '</span><br>' +
                           '<span class="sentence-vi" style="color: ' + translationColor + '; font-style: italic; display: block; margin-bottom: 8px; font-size: 0.95em;">' + targetFlag + ' ' + escapeHtml(transContent[i]) + '</span>';
      }
    } else {
      alternatingHtml += '<span class="sentence-en">' + escapeHtml(orig).replace(/\n/g, '<br>') + '</span><br>' +
                         '<span class="sentence-vi" style="color: ' + translationColor + '; font-style: italic; display: block; margin-bottom: 8px; font-size: 0.95em;">' + targetFlag + ' ' + escapeHtml(trans).replace(/\n/g, '<br>') + '</span>';
    }
  } else {
    alternatingHtml += '<span class="sentence-en">' + escapeHtml(orig) + '</span><br>' +
                       '<span class="sentence-vi" style="color: ' + translationColor + '; font-style: italic; display: block; margin-bottom: 8px; font-size: 0.95em;">' + targetFlag + ' ' + escapeHtml(trans) + '</span>';
  }
  return alternatingHtml;
}

function createVocabRow(term, def) {
  return `
    <div class="vocab-row" onclick="const d = this.querySelector('.vocab-def'); if (d) d.classList.toggle('blurred')">
      <span class="vocab-term">${escapeHtml(term)}</span>
      <span class="vocab-def blurred" title="Nhấp để hiện/ẩn nghĩa">${escapeHtml(def)}</span>
    </div>
  `;
}

function renderVocabRows(vocabText) {
  let html = '';
  const parsedLines = vocabText.split(/[\n\r]+/);

  parsedLines.forEach(line => {
    line = line.trim();
    if (!line) return;
    
    // Check Markdown table format: | word | translation |
    if (line.startsWith('|') && line.endsWith('|')) {
      const parts = line.split('|').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2 && !parts[0].includes('---') && !parts[0].includes('Từ khóa')) {
        html += createVocabRow(parts[0], parts[1]);
        return;
      }
    }
    
    // Check separator format: word: definition
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const term = line.substring(0, colonIndex).trim();
      const def = line.substring(colonIndex + 1).trim();
      html += createVocabRow(term, def);
      return;
    }
    
    // Check separator format: word - definition
    const dashIndex = line.indexOf(' - ');
    if (dashIndex > 0) {
      const term = line.substring(0, dashIndex).trim();
    const def = line.substring(dashIndex + 3).trim();
      html += createVocabRow(term, def);
      return;
    }
    
    html += `<div style="padding: 4px 0; font-size: 13px;">${escapeHtml(line)}</div>`;
  });
  return html;
}

async function generateMobileHTML(items) {
  const skillIcons = {
    writing: '✍️ Writing',
    speaking: '🗣️ Speaking',
    reading: '📖 Reading',
    listening: '🎧 Listening',
    math: '📐 Toán Học',
    korean: '🇰🇷 Tiếng Hàn',
    japanese: '🇯🇵 Tiếng Nhật',
    coding: '💻 Lập Trình',
    other: '📚 Môn học khác'
  };

  const skillFields = {
    writing: [
      ['Đề bài / Prompt', 'prompt'],
      ['Cấu trúc ngữ pháp hay dùng', 'grammar'],
      ['Từ vựng chủ đề (Band 8.0 - 9.0)', 'vocab'],
      ['Cách phân tích biểu đồ / Đề bài', 'analysis'],
      ['Các ý cần triển khai (Brainstorming)', 'ideas'],
      ['Bài mẫu Sample Band 9.0', 'sample'],
      ['Phân tích hướng giải & Nhận xét', 'solution']
    ],
    speaking: [
      ['Câu hỏi / Đề tài Speaking (Part 1/2/3)', 'question'],
      ['Từ vựng hay dùng (B2 - C2)', 'vocab'],
      ['Collocations & Idioms nổi bật', 'colloc'],
      ['Ý tưởng & Dàn bài nói', 'outline'],
      ['Bài nói mẫu (Sample Answer)', 'sample'],
      ['Ghi chú phát âm & Ngữ điệu', 'pron']
    ],
    reading: [
      ['Đoạn văn đọc / Tiêu đề bài đọc', 'passage'],
      ['Bảng Từ khóa & Paraphrase (Keyword Table)', 'keywords'],
      ['Phân tích câu phức tạp / Dịch nghĩa', 'sentence'],
      ['Mẹo làm bài & Bẫy đề cần tránh', 'tips'],
      ['Giải đề chi tiết (Đáp án & Câu chứa đáp án)', 'explanation']
    ],
    listening: [
      ['Nội dung câu hỏi nghe / Bối cảnh', 'context'],
      ['Từ vựng & Cạm bẫy phát âm (Luyện phát âm/Chính tả)', 'spelling'],
      ['Từ vựng trọng tâm bài nghe', 'vocab'],
      ['Phân tích Transcript / Lỗi sai của bản thân', 'transcript'],
      ['Giải đề chi tiết (Đáp án & Lời thoại chứa đáp án)', 'explanation']
    ],
    math: [
      ['Đề bài / Bài toán mẫu', 'mathProblem'],
      ['Công thức & Lý thuyết liên quan', 'mathTheory'],
      ['Phương pháp & Các bước giải quyết', 'mathSteps'],
      ['Lời giải chi tiết & Lưu ý quan trọng', 'mathSolution']
    ],
    korean: [
      ['Từ vựng & Ngữ pháp mới', 'koreanVocab'],
      ['Hội thoại mẫu & Ví dụ', 'koreanDialogue'],
      ['Ghi chú phát âm & Ngữ điệu', 'koreanPron'],
      ['Bản dịch nghĩa tiếng Việt & Văn hóa', 'koreanTranslation']
    ],
    japanese: [
      ['Kanji, Từ vựng & Ngữ pháp (N5 - N1)', 'japaneseVocab'],
      ['Hội thoại / Câu ví dụ thực tế', 'japaneseDialogue'],
      ['Dịch nghĩa & Giải thích chi tiết', 'japaneseTranslation']
    ],
    coding: [
      ['Yêu cầu thuật toán / Bài toán code', 'codingProblem'],
      ['Khái niệm cốt lõi & Cấu trúc dữ liệu', 'codingConcept'],
      ['Giải thích thuật toán & Độ phức tạp (Big O)', 'codingAnalysis']
    ],
    other: [
      ['Lý thuyết trọng tâm & Nội dung bài học', 'genTheory'],
      ['Bài tập tự luyện & Câu hỏi', 'genExercise'],
      ['Đáp án & Giải thích chi tiết', 'genSolution']
    ]
  };

  let menuItemsHtml = '';
  let cardsHtml = '';

  // Gather all sections across all items to translate them in parallel
  const allSections = [];
  items.forEach(item => {
    item.sections = [];
    const fieldsConfig = skillFields[item.skill] || skillFields['other'];
    const f = item.fields || {};
    fieldsConfig.forEach(([label, key]) => {
      const val = f[key];
      if (val && val.trim()) {
        const sec = {
          label,
          val: val.trim(),
          html: ''
        };
        item.sections.push(sec);
        allSections.push(sec);
      }
    });
  });

  function isPredominantlyVietnamese(text) {
    if (!text) return false;
    const viChars = text.match(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/ig) || [];
    return viChars.length > 15;
  }

  // Execute all translations in parallel to guarantee instant exports and avoid lag
  await Promise.all(allSections.map(async (sec) => {
    const isVocab = sec.label.toLowerCase().includes('từ vựng') || sec.label.toLowerCase().includes('vocab') || sec.label.toLowerCase().includes('từ khóa') || sec.label.toLowerCase().includes('keywords') || sec.label.toLowerCase().includes('colloc') || sec.label.toLowerCase().includes('spelling') || sec.label.toLowerCase().includes('chính tả') || sec.label.toLowerCase().includes('kanji');
    
    if (isVocab) {
      sec.html = `
        <div class="section vocab-section">
          <div class="section-lbl">${escapeHtml(sec.label)}</div>
          <div class="section-val" style="white-space: normal;">
            <p style="font-size: 11px; color: var(--muted); margin: 0 0 8px 0; font-style: italic;">💡 Nhấp vào mỗi hàng để ẩn/hiện nghĩa dịch bên phải.</p>
            ${renderVocabRows(sec.val)}
          </div>
        </div>
      `;
      return;
    }

    let translatedHtml = '';
    let hasTranslation = false;

    // Translate English/foreign texts
    if (!isPredominantlyVietnamese(sec.val)) {
      try {
        const combinedData = await translateTextInternal(sec.val, 'vi');
        if (combinedData && combinedData[0] && combinedData[0].length > 0) {
          combinedData[0].forEach(seg => {
            const segmentHtml = formatBilingualSegments(seg, '🇻🇳', 'var(--green-light)');
            if (segmentHtml) {
              translatedHtml += segmentHtml;
            }
          });
          if (translatedHtml) {
            hasTranslation = true;
          }
        }
      } catch (err) {
        console.error(`[MAIN] Parallel translation failed for "${sec.label}":`, err);
      }
    }

    if (hasTranslation) {
      sec.html = `
        <div class="section translatable-section">
          <div class="section-lbl" style="display: flex; justify-content: space-between; align-items: center;">
            <span>${escapeHtml(sec.label)}</span>
            <button class="speak-btn" onclick="speakText(this)" title="Đọc đoạn này">🔊 Đọc</button>
          </div>
          <div class="section-val" data-raw-text="${escapeHtml(sec.val)}" data-original-html="${escapeHtml(sec.val)}" data-translated-html="${escapeHtml(translatedHtml)}">${translatedHtml}</div>
        </div>
      `;
    } else {
      sec.html = `
        <div class="section translatable-section">
          <div class="section-lbl" style="display: flex; justify-content: space-between; align-items: center;">
            <span>${escapeHtml(sec.label)}</span>
            <button class="speak-btn" onclick="speakText(this)" title="Đọc đoạn này">🔊 Đọc</button>
          </div>
          <div class="section-val" data-raw-text="${escapeHtml(sec.val)}">${escapeHtml(sec.val)}</div>
        </div>
      `;
    }
    sec.hasTranslation = hasTranslation;
  }));


  items.forEach((item, index) => {
    const formattedDate = item.date.split('-').reverse().join('/');
    const skillEmoji = item.skill === 'writing' ? '✍️' : 
                        item.skill === 'speaking' ? '🗣️' : 
                        item.skill === 'reading' ? '📖' : 
                        item.skill === 'listening' ? '🎧' : '📚';

    // Menu list item (Quick anchor navigation)
    menuItemsHtml += `
      <a href="#card-${item.id}" class="menu-item" style="padding: 10px 14px; border-radius: 8px;">
        <div class="menu-item-info" style="gap: 2px;">
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 2px;">
            <span class="badge ${item.skill}" style="font-size: 8px; padding: 1px 4px;">${skillEmoji} ${skillIcons[item.skill] || item.skill}</span>
          </div>
          <span class="menu-item-title" style="font-size: 13px;">${escapeHtml(item.title)}</span>
        </div>
        <div class="menu-item-chevron" style="font-size: 12px;">↓</div>
      </a>
    `;

    let sectionsHtml = '';
    
    // Images
    const f = item.fields || {};
    const images = f.images || (f.image ? [f.image] : []);
    if (images && images.length > 0) {
      images.forEach(img => {
        sectionsHtml += `
          <div class="img-box">
            <img src="${img}" alt="Biểu đồ" onclick="zoomImage(this)" />
            <p style="font-size: 10px; color: var(--muted); margin: 4px 0 0 0;">(Nhấp vào ảnh để phóng to)</p>
          </div>
        `;
      });
    }
    
    // Append pre-translated sections
    item.sections.forEach(sec => {
      sectionsHtml += sec.html;
    });

    // Coding solution
    if (item.skill === 'coding' && f.codingSolution) {
      sectionsHtml += `
        <div class="section">
          <div class="section-lbl">Mã nguồn mẫu / Snippet Code</div>
          <div class="section-val" style="font-family: monospace; font-size: 13px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; border: 1px solid var(--border); overflow-x: auto; white-space: pre;">${escapeHtml(f.codingSolution)}</div>
        </div>
      `;
    }

    cardsHtml += `
      <div id="card-${item.id}" class="card" style="scroll-margin-top: 20px;">
        <div class="card-header">
          <span class="badge ${item.skill}">${skillIcons[item.skill] || item.skill}</span>
          <span class="card-date">📅 Ngày lưu: ${formattedDate}</span>
        </div>
        <h2 class="card-title" style="margin-top: 10px;">${escapeHtml(item.title)}</h2>
        
        <div class="actions-bar">
          <button class="action-btn" style="background: rgba(139, 92, 246, 0.1); width: 100%;" onclick="speakWholePane('card-${item.id}')">🔊 Đọc bài viết này</button>
        </div>
        
        <div class="pane-content">
          ${sectionsHtml}
        </div>
      </div>
    `;
  });

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IELTS Mobile Study Vault</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    html {
      scroll-behavior: smooth;
    }
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --border: rgba(255, 255, 255, 0.08);
      --text: #f8fafc;
      --muted: #94a3b8;
      --purple: #8b5cf6;
      --purple-light: #c084fc;
      --pink: #ec4899;
      --blue: #3b82f6;
      --green: #10b981;
      --green-light: #a7f3d0;
      --orange: #f59e0b;
      --red: #ef4444;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      background: var(--bg);
      color: var(--text);
      font-family: 'Inter', sans-serif;
      line-height: 1.6;
      overflow-y: auto;
    }
    .header {
      padding: 14px 16px;
      background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
      border-bottom: 1px solid var(--border);
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #fff;
    }
    .header p {
      margin: 4px 0 0;
      font-size: 11px;
      color: var(--muted);
      font-weight: 500;
    }
    .page-view {
      padding: 16px;
      max-width: 600px;
      margin: 0 auto;
    }
    .menu-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 10px;
    }
    .menu-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 16px;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s ease;
    }
    .menu-item:active {
      transform: scale(0.98);
      background: rgba(255, 255, 255, 0.05);
    }
    .menu-item-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex-grow: 1;
      margin-right: 12px;
    }
    .menu-item-title {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      line-height: 1.4;
    }
    .menu-item-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 11px;
      color: var(--muted);
    }
    .menu-item-chevron {
      color: var(--purple-light);
      font-weight: bold;
      font-size: 16px;
    }
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--purple-light);
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 16px;
      padding: 8px 14px;
      border-radius: 8px;
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.2);
    }
    .back-btn:active {
      background: rgba(139, 92, 246, 0.2);
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      margin-bottom: 20px;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .badge {
      font-size: 10px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 99px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge.writing { background: rgba(139, 92, 246, 0.15); color: #c084fc; }
    .badge.speaking { background: rgba(236, 72, 153, 0.15); color: #f472b6; }
    .badge.reading { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .badge.listening { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .badge.math { background: rgba(245, 158, 11, 0.15); color: #fbcfe8; }
    .badge.coding { background: rgba(6, 182, 212, 0.15); color: #67e8f9; }
    .card-date {
      font-size: 11px;
      color: var(--muted);
    }
    .card-title {
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 16px 0;
      color: #fff;
      line-height: 1.4;
    }
    .actions-bar {
      display: flex;
      gap: 10px;
      margin-bottom: 18px;
    }
    .action-btn {
      flex: 1;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.04);
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s;
      outline: none;
    }
    .action-btn:active {
      transform: scale(0.97);
    }
    .section {
      background: rgba(0, 0, 0, 0.18);
      border: 1px solid rgba(255, 255, 255, 0.02);
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 16px;
    }
    .section-lbl {
      font-size: 11px;
      font-weight: 700;
      color: var(--purple-light);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-left: 3px solid var(--purple);
      padding-left: 8px;
    }
    .section-val {
      font-size: 14px;
      color: var(--text);
      white-space: pre-wrap;
      word-break: break-word;
    }
    .speak-btn {
      background: transparent;
      border: 1px solid rgba(139, 92, 246, 0.4);
      color: var(--purple-light);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      cursor: pointer;
      outline: none;
    }
    .speak-btn:active {
      background: rgba(139, 92, 246, 0.1);
    }
    .vocab-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 10px 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-size: 13px;
      gap: 12px;
    }
    .vocab-row:last-child {
      border-bottom: none;
    }
    .vocab-term {
      font-weight: 600;
      color: var(--purple-light);
      flex: 1;
    }
    .vocab-def {
      color: var(--green-light);
      text-align: right;
      flex: 1;
      font-style: italic;
      transition: filter 0.15s;
    }
    .vocab-def.blurred {
      filter: blur(5px);
      user-select: none;
      -webkit-user-select: none;
    }
    .img-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
    }
    .img-overlay img {
      max-width: 95%;
      max-height: 95%;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📱 Sổ tay Học tập IELTS Di động</h1>
    <p>Tự động lưu trữ • Hiệu lực: 3 ngày</p>
  </div>

  <div class="page-view">
    <h2 style="font-size: 16px; margin: 8px 0 16px 0; color: #fff; font-weight: 600;">📚 Danh sách bài học đã chọn (${items.length})</h2>
    
    <!-- Table of Contents / Index -->
    <div class="menu-list" style="margin-bottom: 24px;">
      ${menuItemsHtml}
    </div>

    <!-- Lesson Cards Stacked -->
    <div class="cards-container">
      ${cardsHtml}
    </div>
  </div>

  <div class="img-overlay" id="imageOverlay" onclick="this.style.display='none'">
    <img id="imageOverlaySrc" src="" alt="Zoomed" />
  </div>

  <script>

    function zoomImage(imgEl) {
      const overlay = document.getElementById('imageOverlay');
      const overlayImg = document.getElementById('imageOverlaySrc');
      if (overlay && overlayImg) {
        overlayImg.src = imgEl.src;
        overlay.style.display = 'flex';
      }
    }


    function speakText(btn) {
      window.speechSynthesis.cancel();
      const parent = btn.closest('.section');
      const valEl = parent ? parent.querySelector('.section-val') : null;
      if (!valEl) return;

      const text = valEl.dataset.rawText || valEl.innerText.trim();
      const viRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
      const lang = viRegex.test(text) ? 'vi-VN' : 'en-US';

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.toLowerCase().startsWith(lang.substring(0, 2)));
      if (voice) utterance.voice = voice;
      
      window.speechSynthesis.speak(utterance);
    }

    function speakWholePane(paneId) {
      window.speechSynthesis.cancel();
      const pane = document.getElementById(paneId);
      if (!pane) return;

      const sections = pane.querySelectorAll('.translatable-section');
      const viRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
      
      sections.forEach(sec => {
        const valEl = sec.querySelector('.section-val');
        if (!valEl) return;
        const text = valEl.dataset.rawText || valEl.innerText.trim();
        if (!text) return;

        const utterance = new SpeechSynthesisUtterance(text);
        const lang = viRegex.test(text) ? 'vi-VN' : 'en-US';
        utterance.lang = lang;
        
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang.toLowerCase().startsWith(lang.substring(0, 2)));
        if (voice) utterance.voice = voice;
        
        window.speechSynthesis.speak(utterance);
      });
    }

    function escapeHtml(str) {
      if (!str) return '';
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function formatBilingualSegments(seg, targetFlag = '🇻🇳', translationColor = 'var(--green-light)') {
      if (!seg || !seg[0] || !seg[1]) return '';
      const orig = seg[1].trim();
      const trans = seg[0].trim();
      if (!orig) return '';

      let alternatingHtml = '';
      if (orig.includes('\\n') || orig.includes('\n')) {
        const origLines = orig.split(/\\n|\n/).map(l => l.trim());
        const transLines = trans.split(/\\n|\n/).map(l => l.trim());
        
        const origContent = origLines.filter(l => l.length > 0);
        const transContent = transLines.filter(l => l.length > 0);
        
        if (origContent.length === transContent.length) {
          for (let i = 0; i < origContent.length; i++) {
            alternatingHtml += '<span class="sentence-en">' + escapeHtml(origContent[i]) + '</span><br>' +
                               '<span class="sentence-vi" style="color: ' + translationColor + '; font-style: italic; display: block; margin-bottom: 8px; font-size: 0.95em;">' + targetFlag + ' ' + escapeHtml(transContent[i]) + '</span>';
          }
        } else {
          alternatingHtml += '<span class="sentence-en">' + escapeHtml(orig).replace(/\\n/g, '<br>').replace(/\n/g, '<br>') + '</span><br>' +
                             '<span class="sentence-vi" style="color: ' + translationColor + '; font-style: italic; display: block; margin-bottom: 8px; font-size: 0.95em;">' + targetFlag + ' ' + escapeHtml(trans).replace(/\\n/g, '<br>').replace(/\n/g, '<br>') + '</span>';
        }
      } else {
        alternatingHtml += '<span class="sentence-en">' + escapeHtml(orig) + '</span><br>' +
                           '<span class="sentence-vi" style="color: ' + translationColor + '; font-style: italic; display: block; margin-bottom: 8px; font-size: 0.95em;">' + targetFlag + ' ' + escapeHtml(trans) + '</span>';
      }
      return alternatingHtml;
    }
  </script>
</body>
</html>`;
}

ipcMain.handle('export-mobile-page', async (event, itemIds) => {
  try {
    console.log('[MAIN] export-mobile-page called for items:', itemIds);
    let items = [];
    if (fs.existsSync(ieltsPath)) {
      const fileData = await fs.promises.readFile(ieltsPath, 'utf8');
      const parsed = JSON.parse(fileData);
      items = parsed.items || [];
    }
    
    const selectedItems = items.filter(item => itemIds.includes(item.id));
    if (selectedItems.length === 0) {
      throw new Error('Không có đề thi nào được chọn hoặc không tìm thấy đề thi tương ứng!');
    }
    
    for (const item of selectedItems) {
      if (item.fields) {
        if (Array.isArray(item.fields.images)) {
          const base64List = [];
          for (const imgPath of item.fields.images) {
            if (imgPath.startsWith('data:image/') || imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
              base64List.push(imgPath);
            } else {
              const b64 = await getBase64FromLocalFile(imgPath);
              if (b64) base64List.push(b64);
              else base64List.push(imgPath);
            }
          }
          item.fields.images = base64List;
        }
        if (item.fields.image) {
          if (!item.fields.image.startsWith('data:image/') && !item.fields.image.startsWith('http') && !item.fields.image.startsWith('https')) {
            const b64 = await getBase64FromLocalFile(item.fields.image);
            if (b64) item.fields.image = b64;
          }
        }
      }
    }
    
    const htmlContent = await generateMobileHTML(selectedItems);
    
    // Perform programmatic Node.js https POST request with multipart/form-data to pastehtml.dev
    const uploadToPasteHTML = (html) => {
      return new Promise((resolve, reject) => {
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        const payload = 
          `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="file"; filename="study_page.html"\r\n` +
          `Content-Type: text/html\r\n\r\n` +
          `${html}\r\n` +
          `--${boundary}--\r\n`;

        const options = {
          hostname: 'pastehtml.dev',
          port: 443,
          path: '/api/pastes',
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': Buffer.byteLength(payload),
            'User-Agent': 'curl/7.81.0'
          }
        };
        
        const req = https.request(options, (res) => {
          let responseBody = '';
          res.on('data', (chunk) => { responseBody += chunk; });
          res.on('end', () => {
            if (res.statusCode === 200 || res.statusCode === 201) {
              try {
                const parsed = JSON.parse(responseBody);
                resolve(parsed);
              } catch (e) {
                reject(new Error(`Failed to parse response: ${responseBody}`));
              }
            } else {
              reject(new Error(`Server returned status ${res.statusCode}: ${responseBody}`));
            }
          });
        });
        
        req.on('error', (err) => { reject(err); });
        req.write(payload);
        req.end();
      });
    };

    const resData = await uploadToPasteHTML(htmlContent);
    console.log('[MAIN] PasteHTML upload response:', resData);
    
    if (resData && resData.render_url) {
      return { success: true, url: resData.render_url };
    } else if (resData && resData.live_url) {
      return { success: true, url: resData.live_url };
    } else if (resData && resData.url) {
      return { success: true, url: resData.url };
    } else {
      throw new Error('Dữ liệu trả về từ server không chứa URL.');
    }
  } catch (err) {
    console.error('[MAIN] Error exporting mobile page:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('load-general-vault', async () => {
  if (cachedGeneralVault) {
    return cachedGeneralVault;
  }
  try {
    if (fs.existsSync(generalPath)) {
      const data = await fs.promises.readFile(generalPath, 'utf8');
      cachedGeneralVault = JSON.parse(data);
      rewriteImageUrls(cachedGeneralVault.items, imagesDir);
      return cachedGeneralVault;
    }
  } catch (e) {
    console.error('Failed to load general vault:', e);
  }
  cachedGeneralVault = { items: [], folders: ["Mặc định"] };
  return cachedGeneralVault;
});

ipcMain.handle('save-general-vault', async (event, data) => {
  try {
    cachedGeneralVault = data;
    if (data && Array.isArray(data.items)) {
      for (const item of data.items) {
        if (item.fields) {
          if (Array.isArray(item.fields.images)) {
            let hasBase64 = false;
            for (const img of item.fields.images) {
              if (typeof img === 'string' && img.startsWith('data:image/')) {
                hasBase64 = true;
                break;
              }
            }
            if (hasBase64) {
              item.fields.images = await Promise.all(
                item.fields.images.map(img => saveBase64ImageAsync(img, `general_img_${item.id}`))
              );
            }
          }
          if (item.fields.image && typeof item.fields.image === 'string' && item.fields.image.startsWith('data:image/')) {
            item.fields.image = await saveBase64ImageAsync(item.fields.image, `general_img_${item.id}`);
          }
        }
      }
    }
    await fs.promises.writeFile(generalPath, JSON.stringify(data), 'utf8');
    broadcastVaultUpdate('general', data);
    return data;
  } catch (e) {
    console.error('Failed to save general vault:', e);
    return null;
  }
});

ipcMain.handle('load-speaking-vault', async () => {
  if (cachedSpeakingVault) {
    return cachedSpeakingVault;
  }
  try {
    if (fs.existsSync(speakingPath)) {
      const data = await fs.promises.readFile(speakingPath, 'utf8');
      cachedSpeakingVault = JSON.parse(data);
      return cachedSpeakingVault;
    }
  } catch (e) {
    console.error('Failed to load speaking vault:', e);
  }
  cachedSpeakingVault = { items: [] };
  return cachedSpeakingVault;
});

ipcMain.handle('save-speaking-vault', async (event, data) => {
  try {
    cachedSpeakingVault = data;
    await fs.promises.writeFile(speakingPath, JSON.stringify(data), 'utf8');
    broadcastVaultUpdate('speaking', data);
    return data;
  } catch (e) {
    console.error('Failed to save speaking vault:', e);
    return null;
  }
});

ipcMain.handle('load-video-challenge', async () => {
  if (cachedVideoChallenge) {
    return cachedVideoChallenge;
  }
  try {
    if (fs.existsSync(videoChallengePath)) {
      const data = await fs.promises.readFile(videoChallengePath, 'utf8');
      cachedVideoChallenge = JSON.parse(data);
      return cachedVideoChallenge;
    }
  } catch (e) {
    console.error('Failed to load video challenge:', e);
  }
  cachedVideoChallenge = { items: [] };
  return cachedVideoChallenge;
});

ipcMain.handle('save-video-challenge', async (event, data) => {
  try {
    cachedVideoChallenge = data;
    await fs.promises.writeFile(videoChallengePath, JSON.stringify(data), 'utf8');
    broadcastVaultUpdate('video-challenge', data);
    return data;
  } catch (e) {
    console.error('Failed to save video challenge:', e);
    return null;
  }
});

ipcMain.handle('load-memorize-vault', async () => {
  if (cachedMemorizeVault) {
    return cachedMemorizeVault;
  }
  try {
    if (fs.existsSync(memorizePath)) {
      const data = await fs.promises.readFile(memorizePath, 'utf8');
      cachedMemorizeVault = JSON.parse(data);
      return cachedMemorizeVault;
    }
  } catch (e) {
    console.error('Failed to load memorize vault:', e);
  }
  cachedMemorizeVault = { items: [] };
  return cachedMemorizeVault;
});

ipcMain.handle('save-memorize-vault', async (event, data) => {
  try {
    cachedMemorizeVault = data;
    await fs.promises.writeFile(memorizePath, JSON.stringify(data), 'utf8');
    broadcastVaultUpdate('memorize', data);
    return data;
  } catch (e) {
    console.error('Failed to save memorize vault:', e);
    return null;
  }
});

ipcMain.handle('load-tiktok-music', async () => {
  try {
    if (fs.existsSync(tiktokMusicPath)) {
      const data = await fs.promises.readFile(tiktokMusicPath, 'utf8');
      cachedTiktokMusic = JSON.parse(data);
      console.log('[MAIN] Loaded tiktok music from disk:', (cachedTiktokMusic.items || []).length, 'items');
      return cachedTiktokMusic;
    }
  } catch (e) {
    console.error('Failed to load tiktok music:', e);
  }
  cachedTiktokMusic = {
    lastChosenUrl: 'https://www.tiktok.com/music/Perfect-6655492047723563778',
    items: [
      { id: 'm_perfect', title: '🎵 Perfect - Ed Sheeran', url: 'https://www.tiktok.com/music/Perfect-6655492047723563778' }
    ]
  };
  try {
    await fs.promises.writeFile(tiktokMusicPath, JSON.stringify(cachedTiktokMusic, null, 2), 'utf8');
  } catch (err) {}
  return cachedTiktokMusic;
});

ipcMain.handle('save-tiktok-music', async (event, data) => {
  try {
    cachedTiktokMusic = data;
    await fs.promises.writeFile(tiktokMusicPath, JSON.stringify(data, null, 2), 'utf8');
    console.log('[MAIN] Saved tiktok music to disk:', (data.items || []).length, 'items');
    broadcastVaultUpdate('tiktok-music', data);
    return data;
  } catch (e) {
    console.error('Failed to save tiktok music:', e);
    return null;
  }
});

ipcMain.handle('load-comments-vault', async () => {
  if (cachedCommentsVault) {
    return cachedCommentsVault;
  }
  try {
    if (fs.existsSync(commentsVaultPath)) {
      const data = await fs.promises.readFile(commentsVaultPath, 'utf8');
      cachedCommentsVault = JSON.parse(data);
      const projCount = Array.isArray(cachedCommentsVault.projects) ? cachedCommentsVault.projects.length : 1;
      console.log('[MAIN] Loaded comments vault from disk:', projCount, 'projects');
      return cachedCommentsVault;
    }
  } catch (e) {
    console.error('Failed to load comments vault:', e);
  }
  cachedCommentsVault = { activeProjectId: 'proj_default', projects: [] };
  return cachedCommentsVault;
});

ipcMain.handle('save-comments-vault', async (event, data) => {
  try {
    cachedCommentsVault = data;
    await fs.promises.writeFile(commentsVaultPath, JSON.stringify(data, null, 2), 'utf8');
    const projCount = Array.isArray(data.projects) ? data.projects.length : 1;
    console.log('[MAIN] Saved comments vault to disk:', projCount, 'projects');
    broadcastVaultUpdate('comments-vault', data);
    return data;
  } catch (e) {
    console.error('Failed to save comments vault:', e);
    return null;
  }
});

ipcMain.handle('load-brain-chain', async () => {
  try {
    if (cachedBrainChain) return cachedBrainChain;
    if (fs.existsSync(brainChainPath)) {
      const data = await fs.promises.readFile(brainChainPath, 'utf8');
      cachedBrainChain = JSON.parse(data);
      const eventCount = Array.isArray(cachedBrainChain.events) ? cachedBrainChain.events.length : 0;
      console.log('[MAIN] Loaded brain chain from disk:', eventCount, 'events');
      return cachedBrainChain;
    }
  } catch (e) {
    console.error('Failed to load brain chain:', e);
  }
  cachedBrainChain = { events: [], activeEventId: null };
  return cachedBrainChain;
});

ipcMain.handle('save-brain-chain', async (event, data) => {
  try {
    cachedBrainChain = data;
    await fs.promises.writeFile(brainChainPath, JSON.stringify(data, null, 2), 'utf8');
    const eventCount = Array.isArray(data.events) ? data.events.length : 0;
    console.log('[MAIN] Saved brain chain to disk:', eventCount, 'events');
    broadcastVaultUpdate('brain-chain', data);
    return data;
  } catch (e) {
    console.error('Failed to save brain chain:', e);
    return null;
  }
});

ipcMain.handle('search-images', async (event, query) => {
  try {
    console.log(`[MAIN] search-images called for: ${query}`);
    const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=15`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.results) {
        return data.results.map(item => ({
          id: item.id,
          url: item.urls.small || item.urls.regular,
          thumb: item.urls.thumb,
          description: item.alt_description || item.description || ''
        }));
      }
    }
  } catch (err) {
    console.error('[MAIN] Unsplash image search error:', err);
  }
  return [];
});

ipcMain.handle('search-youtube-videos', async (event, query) => {
  try {
    console.log(`[MAIN] search-youtube-videos called for: ${query}`);
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8'
      }
    });
    if (res.ok) {
      const html = await res.text();
      const videoRegex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
      const videoIds = [];
      let match;
      while ((match = videoRegex.exec(html)) !== null) {
        if (!videoIds.includes(match[1])) {
          videoIds.push(match[1]);
        }
        if (videoIds.length >= 8) break;
      }
      return videoIds.map(id => ({
        id: id,
        url: `https://www.youtube.com/embed/${id}`,
        title: `YouTube Video`
      }));
    }
  } catch (err) {
    console.error('[MAIN] YouTube search error:', err);
  }
  return [];
});


// Extract direct video links from a TikTok music or tag page
ipcMain.handle('extract-tiktok-music-videos', async (event, musicUrl) => {
  if (!musicUrl || typeof musicUrl !== 'string') {
    return { success: false, error: 'URL không hợp lệ', videos: [] };
  }

  return new Promise((resolve) => {
    let win = null;
    let resolved = false;

    const cleanup = () => {
      if (win) {
        try {
          win.destroy();
        } catch (e) {}
        win = null;
      }
    };

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve({ success: false, error: 'Timeout khi tải trang TikTok', videos: [] });
      }
    }, 10000);

    try {
      win = new BrowserWindow({
        show: false,
        width: 1280,
        height: 800,
        webPreferences: {
          offscreen: true,
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      win.webContents.on('did-finish-load', async () => {
        try {
          // Wait for TikTok React hydration
          await new Promise(r => setTimeout(r, 1800));
          if (resolved || !win) return;

          const videoLinks = await win.webContents.executeJavaScript(`
            (() => {
              const links = Array.from(document.querySelectorAll('a[href*="/video/"]')).map(a => a.href);
              const script = document.getElementById('ItemList');
              if (script) {
                try {
                  const data = JSON.parse(script.textContent);
                  if (data.itemListElement && Array.isArray(data.itemListElement)) {
                    data.itemListElement.forEach(item => {
                      if (item.url && item.url.includes('/video/')) links.push(item.url);
                    });
                  }
                } catch (e) {}
              }
              return Array.from(new Set(links.filter(u => u && u.includes('/video/'))));
            })()
          `);

          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            cleanup();
            resolve({ success: true, videos: videoLinks || [] });
          }
        } catch (err) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            cleanup();
            resolve({ success: false, error: err.message, videos: [] });
          }
        }
      });

      win.loadURL(musicUrl).catch((err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          cleanup();
          resolve({ success: false, error: err.message, videos: [] });
        }
      });
    } catch (err) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        cleanup();
        resolve({ success: false, error: err.message, videos: [] });
      }
    }
  });
});

function createDesktopShortcut() {
  if (process.platform !== 'win32') return;
  if (!app.isPackaged) return; // Do not overwrite shortcut in dev mode!
  const iconPath = path.join(__dirname, 'icon.ico');
  if (!fs.existsSync(iconPath)) return;   // skip if no icon.ico
  const shortcutPath = path.join(app.getPath('desktop'), 'Task Countdown.lnk');
  try {
    shell.writeShortcutLink(shortcutPath, {
      target:      process.execPath,
      args:        '',
      description: 'Task Countdown – Daily productivity tracker',
      icon:        iconPath,
      iconIndex:   0
    });
  } catch (e) {
    console.error('Failed to create shortcut:', e);
  }
}

app.whenReady().then(() => {
  const { session } = require('electron');
  if (session && session.defaultSession) {
    session.defaultSession.setSpellCheckerEnabled(false);
  }
  createWindow();
  createDesktopShortcut();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
