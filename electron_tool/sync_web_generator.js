// sync_web_generator.js
// Ultra-fast, clean, lightweight Flashcard PWA Generator for GitHub Pages
const fs = require('fs');
const path = require('path');
const { generateIcons } = require('./generate_icons');

function generateMobileHtml() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Flashcard Học Từ Vựng</title>
  <meta name="description" content="Ứng dụng Flashcard học từ vựng nhanh, nhẹ, mượt mà và tự động đồng bộ.">
  <meta name="theme-color" content="#0f172a">
  
  <!-- PWA & Favicon Meta Tags -->
  <link rel="manifest" href="manifest.json">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="icon" type="image/svg+xml" href="icons/icon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="icons/favicon.png">
  <link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
  <link rel="shortcut icon" href="icons/favicon.ico">
  <link rel="apple-touch-icon" href="icons/apple-touch-icon.png">

  <!-- Fonts & Libraries -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>

  <style>
    :root {
      --bg: #0b0d14;
      --card-bg: #131722;
      --primary: #00f2fe;
      --accent: #ff0050;
      --green: #10b981;
      --purple: #8b5cf6;
      --text: #f8fafc;
      --muted: #94a3b8;
      --border: rgba(255, 255, 255, 0.12);
      --radius: 14px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }

    html, body {
      width: 100%;
      height: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      overflow: hidden;
    }

    .app-wrap {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      position: relative;
    }

    /* Top Bar */
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: rgba(19, 23, 34, 0.85);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border);
      z-index: 20;
      gap: 8px;
    }

    .brand-title {
      font-size: 14px;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }

    .filter-tabs {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .filter-tabs::-webkit-scrollbar { display: none; }

    .tab-pill {
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.06);
      color: var(--muted);
      border: 1px solid transparent;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .tab-pill.active {
      background: rgba(0, 242, 254, 0.15);
      color: var(--primary);
      border-color: rgba(0, 242, 254, 0.35);
    }

    .action-btns {
      display: flex;
      gap: 6px;
    }

    .btn-action {
      height: 28px;
      padding: 0 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      transition: all 0.2s;
    }
    .btn-zip {
      background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
      border: none;
    }

    /* Main Flashcard Container */
    .card-viewport {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      position: relative;
      overflow: hidden;
    }

    .card-box {
      width: 100%;
      height: 100%;
      max-height: 720px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      position: relative;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1); }
    }

    .card-img-wrap {
      flex: 1;
      min-height: 200px;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      cursor: pointer;
    }

    .card-img-wrap img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .card-info {
      padding: 14px 16px;
      background: rgba(15, 23, 42, 0.95);
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 45%;
      overflow-y: auto;
    }

    .card-word {
      font-size: 20px;
      font-weight: 900;
      color: var(--primary);
      line-height: 1.3;
      user-select: text;
    }

    .card-trans {
      font-size: 15px;
      font-weight: 700;
      color: #34d399;
      line-height: 1.4;
      user-select: text;
    }

    .card-notes {
      font-size: 12.5px;
      color: #cbd5e1;
      line-height: 1.5;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 8px 10px;
      margin-top: 4px;
      user-select: text;
      white-space: pre-wrap;
    }

    /* Bottom Nav Bar */
    .bottom-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: rgba(19, 23, 34, 0.9);
      border-top: 1px solid var(--border);
      z-index: 20;
      gap: 8px;
    }

    .nav-btn {
      flex: 1;
      height: 42px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      transition: all 0.15s;
    }
    .nav-btn:active {
      transform: scale(0.96);
    }
    .btn-next {
      background: linear-gradient(135deg, #00f2fe 0%, #3b82f6 100%);
      color: #0b0d14;
      border: none;
    }

    .counter-badge {
      font-size: 12px;
      font-weight: 800;
      color: #fff;
      padding: 0 10px;
      white-space: nowrap;
      text-align: center;
    }

    .btn-like {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.06);
      color: #fff;
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .btn-like.liked {
      background: rgba(16, 185, 129, 0.2);
      border-color: #10b981;
      color: #10b981;
    }

    /* Modal */
    .modal {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(8px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 16px;
    }
    .modal.active { display: flex; }
    .modal-box {
      width: 100%;
      max-width: 440px;
      background: #1e293b;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .inp {
      width: 100%;
      height: 38px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: #fff;
      padding: 0 10px;
      font-size: 13px;
      outline: none;
    }

    /* Toast */
    #toast {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(-30px);
      background: #1e293b;
      color: #00f2fe;
      border: 1px solid #00f2fe;
      padding: 8px 18px;
      border-radius: 30px;
      font-size: 12.5px;
      font-weight: 700;
      z-index: 100000;
      opacity: 0;
      transition: all 0.3s;
      pointer-events: none;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
    }
    #toast.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  </style>
</head>
<body>
  <div class="app-wrap">
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="brand-title">🎵 Flashcard</div>
      <div class="filter-tabs">
        <button type="button" class="tab-pill active" id="tabAll" onclick="setFilter('all')">Tất cả (<span id="cntAll">0</span>)</button>
        <button type="button" class="tab-pill" id="tabDue" onclick="setFilter('due')">🔴 Ôn (<span id="cntDue">0</span>)</button>
        <button type="button" class="tab-pill" id="tabMastered" onclick="setFilter('mastered')">🟢 Thuộc (<span id="cntMastered">0</span>)</button>
        <button type="button" class="tab-pill" id="tabImage" onclick="setFilter('image')">🖼️ Ảnh (<span id="cntImage">0</span>)</button>
      </div>
      <div class="action-btns">
        <button type="button" class="btn-action btn-zip" id="btnZip" onclick="triggerZipUpload()">📦 ZIP</button>
        <button type="button" class="btn-action" id="btnAdd" onclick="openAddModal()">➕ Thêm</button>
      </div>
    </div>

    <!-- Main Card Viewport -->
    <div class="card-viewport" id="viewport">
      <div class="card-box" id="cardBox">
        <div class="card-img-wrap" id="cardImgWrap">
          <img id="cardImg" src="" alt="Flashcard" style="display: none;" />
          <div id="imgPlaceholder" style="color: #64748b; font-size: 13px; font-weight: 700; text-align: center; padding: 20px;">
            ⏳ Đang tải dữ liệu Flashcard...
          </div>
        </div>
        <div class="card-info" id="cardInfo">
          <div class="card-word" id="cardWord">Đang tải...</div>
          <div class="card-trans" id="cardTrans"></div>
          <div class="card-notes" id="cardNotes" style="display: none;"></div>
        </div>
      </div>
    </div>

    <!-- Bottom Controls -->
    <div class="bottom-bar">
      <button type="button" class="btn-like" id="btnLike" title="Đánh dấu đã thuộc" onclick="toggleMastered()">❤️</button>
      <button type="button" class="nav-btn" onclick="prevCard()">⬆️ Thẻ trước</button>
      <div class="counter-badge" id="counterBadge">0 / 0</div>
      <button type="button" class="nav-btn btn-next" onclick="nextCard()">Thẻ tiếp ⬇️</button>
    </div>
  </div>

  <!-- Hidden File Input for ZIP -->
  <input type="file" id="zipInput" accept=".zip,application/zip" style="display: none;" />

  <!-- Fullscreen Image Modal -->
  <div class="modal" id="fullImgModal" onclick="this.classList.remove('active')">
    <img id="fullImg" src="" style="max-width: 95%; max-height: 95%; object-fit: contain; border-radius: 8px;" />
  </div>

  <!-- Add Card Modal -->
  <div class="modal" id="addCardModal">
    <div class="modal-box">
      <h3 style="font-size: 15px; color: #fff;">➕ Thêm Thẻ Mới</h3>
      <input type="text" id="addWord" class="inp" placeholder="Từ vựng / Tiêu đề *" />
      <input type="text" id="addTrans" class="inp" placeholder="Dịch nghĩa tiếng Việt" />
      <textarea id="addNotes" class="inp" style="height: 60px; padding: 6px 10px; font-family: inherit;" placeholder="Ghi chú / Ví dụ"></textarea>
      <input type="file" id="addImgFile" accept="image/*" class="inp" style="padding: 6px;" />
      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 6px;">
        <button type="button" class="btn-action" onclick="document.getElementById('addCardModal').classList.remove('active')">Hủy</button>
        <button type="button" class="btn-action btn-zip" onclick="saveNewCard()">Lưu thẻ</button>
      </div>
    </div>
  </div>

  <!-- Toast Message -->
  <div id="toast"></div>

  <script>
    // State
    let ALL_ITEMS = [];
    let curIndex = 0;
    let curFilter = 'all';
    let masteredSet = new Set();
    let dueSet = new Set();

    function showToast(msg) {
      const t = document.getElementById('toast');
      if (!t) return;
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(t._tm);
      t._tm = setTimeout(() => t.classList.remove('show'), 2500);
    }

    // Escape HTML
    function esc(s) {
      if (!s) return '';
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Load Local Storage Sets
    try {
      masteredSet = new Set(JSON.parse(localStorage.getItem('fc_mastered') || '[]'));
      dueSet = new Set(JSON.parse(localStorage.getItem('fc_due') || '[]'));
      curFilter = localStorage.getItem('fc_filter') || 'all';
      curIndex = parseInt(localStorage.getItem('fc_idx') || '0', 10);
    } catch(e) {}

    function saveState() {
      try {
        localStorage.setItem('fc_mastered', JSON.stringify([...masteredSet]));
        localStorage.setItem('fc_due', JSON.stringify([...dueSet]));
        localStorage.setItem('fc_filter', curFilter);
        localStorage.setItem('fc_idx', curIndex.toString());
      } catch(e) {}
    }

    // Fetch Flashcard Data Dynamically
    async function loadData() {
      try {
        const res = await fetch('./data/flashcards.json?t=' + Date.now());
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.items) && data.items.length > 0) {
            ALL_ITEMS = data.items;
          }
        }
      } catch(err) {
        console.warn('Dynamic fetch failed, falling back to local storage:', err);
      }

      if (ALL_ITEMS.length === 0) {
        try {
          const saved = localStorage.getItem('fc_items_cache');
          if (saved) ALL_ITEMS = JSON.parse(saved);
        } catch(e) {}
      }

      updateUI();
    }

    function getFiltered() {
      return ALL_ITEMS.filter(it => {
        if (curFilter === 'due') return dueSet.has(it.id);
        if (curFilter === 'mastered') return masteredSet.has(it.id);
        if (curFilter === 'image') return !!it.imageUrl;
        return true;
      });
    }

    function setFilter(f) {
      curFilter = f;
      curIndex = 0;
      document.querySelectorAll('.tab-pill').forEach(el => el.classList.remove('active'));
      const activeTab = document.getElementById(f === 'all' ? 'tabAll' : (f === 'due' ? 'tabDue' : (f === 'mastered' ? 'tabMastered' : 'tabImage')));
      if (activeTab) activeTab.classList.add('active');
      updateCard();
      saveState();
    }

    function updateCounts() {
      const allCount = ALL_ITEMS.length;
      const dueCount = ALL_ITEMS.filter(x => dueSet.has(x.id)).length;
      const mastCount = ALL_ITEMS.filter(x => masteredSet.has(x.id)).length;
      const imgCount = ALL_ITEMS.filter(x => !!x.imageUrl).length;

      document.getElementById('cntAll').textContent = allCount;
      document.getElementById('cntDue').textContent = dueCount;
      document.getElementById('cntMastered').textContent = mastCount;
      document.getElementById('cntImage').textContent = imgCount;
    }

    function updateCard() {
      updateCounts();
      const list = getFiltered();
      const total = list.length;
      const badge = document.getElementById('counterBadge');
      const imgEl = document.getElementById('cardImg');
      const placeholder = document.getElementById('imgPlaceholder');
      const wordEl = document.getElementById('cardWord');
      const transEl = document.getElementById('cardTrans');
      const notesEl = document.getElementById('cardNotes');
      const btnLike = document.getElementById('btnLike');

      if (total === 0) {
        if (badge) badge.textContent = '0 / 0';
        if (imgEl) imgEl.style.display = 'none';
        if (placeholder) {
          placeholder.style.display = 'block';
          placeholder.textContent = 'Chưa có thẻ nào trong mục này.';
        }
        if (wordEl) wordEl.textContent = '---';
        if (transEl) transEl.textContent = '';
        if (notesEl) notesEl.style.display = 'none';
        if (btnLike) btnLike.classList.remove('liked');
        return;
      }

      if (curIndex < 0) curIndex = 0;
      if (curIndex >= total) curIndex = total - 1;

      const item = list[curIndex];
      if (badge) badge.textContent = \`\${curIndex + 1} / \${total}\`;

      if (item.imageUrl) {
        if (imgEl) {
          imgEl.src = item.imageUrl;
          imgEl.style.display = 'block';
        }
        if (placeholder) placeholder.style.display = 'none';
      } else {
        if (imgEl) imgEl.style.display = 'none';
        if (placeholder) {
          placeholder.style.display = 'block';
          placeholder.textContent = '🖼️ (Thẻ không có ảnh)';
        }
      }

      if (wordEl) wordEl.textContent = item.word || '---';
      if (transEl) transEl.textContent = item.translation || '';
      if (notesEl) {
        if (item.notes) {
          notesEl.textContent = item.notes;
          notesEl.style.display = 'block';
        } else {
          notesEl.style.display = 'none';
        }
      }

      if (btnLike) {
        if (masteredSet.has(item.id)) {
          btnLike.classList.add('liked');
        } else {
          btnLike.classList.remove('liked');
        }
      }

      saveState();
    }

    function updateUI() {
      updateCounts();
      updateCard();
    }

    let isNavigating = false;
    function nextCard() {
      const list = getFiltered();
      if (list.length <= 1 || isNavigating) return;
      isNavigating = true;
      const box = document.getElementById('cardBox');
      if (box) {
        box.style.transition = 'transform 0.16s ease, opacity 0.16s ease';
        box.style.transform = 'translateY(-24px)';
        box.style.opacity = '0.6';
      }
      setTimeout(() => {
        curIndex = (curIndex + 1) % list.length;
        updateCard();
        if (box) {
          box.style.transform = 'translateY(24px)';
          box.offsetHeight; // reflow
          box.style.transform = 'translateY(0)';
          box.style.opacity = '1';
        }
        setTimeout(() => { isNavigating = false; }, 160);
      }, 120);
    }

    function prevCard() {
      const list = getFiltered();
      if (list.length <= 1 || isNavigating) return;
      isNavigating = true;
      const box = document.getElementById('cardBox');
      if (box) {
        box.style.transition = 'transform 0.16s ease, opacity 0.16s ease';
        box.style.transform = 'translateY(24px)';
        box.style.opacity = '0.6';
      }
      setTimeout(() => {
        curIndex = (curIndex - 1 + list.length) % list.length;
        updateCard();
        if (box) {
          box.style.transform = 'translateY(-24px)';
          box.offsetHeight; // reflow
          box.style.transform = 'translateY(0)';
          box.style.opacity = '1';
        }
        setTimeout(() => { isNavigating = false; }, 160);
      }, 120);
    }

    function toggleMastered() {
      const list = getFiltered();
      if (list.length === 0) return;
      const item = list[curIndex];
      if (masteredSet.has(item.id)) {
        masteredSet.delete(item.id);
        showToast('🔄 Đã chuyển về Cần ôn');
      } else {
        masteredSet.add(item.id);
        dueSet.delete(item.id);
        showToast('❤️ Đã đánh dấu Thuộc');
      }
      updateCard();
    }

    // Image Zoom Click
    document.getElementById('cardImgWrap').addEventListener('click', () => {
      const imgEl = document.getElementById('cardImg');
      if (imgEl && imgEl.src && imgEl.style.display !== 'none') {
        document.getElementById('fullImg').src = imgEl.src;
        document.getElementById('fullImgModal').classList.add('active');
      }
    });

    // Unified Gesture Engine (Swipe Up / Down, Drag, Mouse Wheel)
    let startY = 0;
    let startX = 0;
    let isMouseDown = false;
    let lastWheelTime = 0;

    // Touch Swipe (Mobile)
    window.addEventListener('touchstart', e => {
      if (e.target.closest('.modal') || e.target.closest('.top-bar') || e.target.closest('.bottom-bar')) return;
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
    }, { passive: true });

    window.addEventListener('touchend', e => {
      if (e.target.closest('.modal') || e.target.closest('.top-bar') || e.target.closest('.bottom-bar')) return;
      const deltaY = e.changedTouches[0].clientY - startY;
      const deltaX = e.changedTouches[0].clientX - startX;
      
      // Vertical swipe priority (Swipe Up -> Next Card, Swipe Down -> Prev Card)
      if (Math.abs(deltaY) > 30 && Math.abs(deltaY) >= Math.abs(deltaX)) {
        if (deltaY < 0) nextCard();
        else prevCard();
      } else if (Math.abs(deltaX) > 45) {
        if (deltaX < 0) nextCard();
        else prevCard();
      }
    }, { passive: true });

    // Mouse Drag (Desktop)
    window.addEventListener('mousedown', e => {
      if (e.target.closest('.modal') || e.target.closest('.top-bar') || e.target.closest('.bottom-bar') || e.target.closest('button')) return;
      isMouseDown = true;
      startY = e.clientY;
      startX = e.clientX;
    });

    window.addEventListener('mouseup', e => {
      if (!isMouseDown) return;
      isMouseDown = false;
      const deltaY = e.clientY - startY;
      const deltaX = e.clientX - startX;
      if (Math.abs(deltaY) > 30 && Math.abs(deltaY) >= Math.abs(deltaX)) {
        if (deltaY < 0) nextCard();
        else prevCard();
      } else if (Math.abs(deltaX) > 45) {
        if (deltaX < 0) nextCard();
        else prevCard();
      }
    });

    // Mouse Wheel Scroll
    window.addEventListener('wheel', e => {
      if (e.target.closest('.card-notes') || e.target.closest('.modal')) return;
      const now = Date.now();
      if (now - lastWheelTime < 280) return;
      if (e.deltaY > 20) {
        lastWheelTime = now;
        nextCard();
      } else if (e.deltaY < -20) {
        lastWheelTime = now;
        prevCard();
      }
    }, { passive: true });

    // Keyboard Navigation
    window.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextCard();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        prevCard();
      }
    });

    // ZIP Bulk Import
    function triggerZipUpload() {
      document.getElementById('zipInput').click();
    }

    document.getElementById('zipInput').addEventListener('change', async e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      showToast('⏳ Đang đọc file ZIP...');

      try {
        const zip = new JSZip();
        const zipData = await zip.loadAsync(file);
        const validExt = /\\.(png|jpe?g|webp|gif|bmp|svg|avif)$/i;
        const entries = [];

        zipData.forEach((relPath, entry) => {
          if (entry.dir) return;
          const normPath = relPath.split('\\\\').join('/');
          const parts = normPath.split('/');
          const fileName = parts[parts.length - 1];
          const isHidden = parts.some(p => p.startsWith('.') || p === '__MACOSX');

          if (!isHidden && validExt.test(fileName)) {
            entries.push({ path: normPath, entry, fileName });
          }
        });

        if (entries.length === 0) {
          alert('Không tìm thấy ảnh nào trong file ZIP này.');
          return;
        }

        entries.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: 'base' }));

        const newItems = [];
        const now = new Date().toISOString();

        for (let i = 0; i < entries.length; i++) {
          const item = entries[i];
          const base64 = await item.entry.async('base64');
          const ext = item.fileName.split('.').pop().toLowerCase();
          const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : (ext === 'webp' ? 'image/webp' : 'image/png');
          const name = item.fileName.replace(/\\.[^/.]+$/, '').trim();

          newItems.push({
            id: 'tk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_' + i,
            word: name || ('🖼️ Thẻ ảnh #' + (ALL_ITEMS.length + i + 1)),
            translation: '',
            notes: '',
            imageUrl: 'data:' + mime + ';base64,' + base64,
            createdAt: now
          });
        }

        ALL_ITEMS.unshift(...newItems);
        curIndex = 0;
        updateUI();
        showToast('🎉 Đã nạp thành công ' + newItems.length + ' ảnh!');

        try {
          localStorage.setItem('fc_items_cache', JSON.stringify(ALL_ITEMS.slice(0, 100)));
        } catch(e) {}
      } catch(err) {
        alert('Lỗi đọc ZIP: ' + err.message);
      }
      e.target.value = '';
    });

    // Add Card Dialog
    function openAddModal() {
      document.getElementById('addWord').value = '';
      document.getElementById('addTrans').value = '';
      document.getElementById('addNotes').value = '';
      document.getElementById('addImgFile').value = '';
      document.getElementById('addCardModal').classList.add('active');
    }

    async function saveNewCard() {
      const word = (document.getElementById('addWord').value || '').trim();
      const trans = (document.getElementById('addTrans').value || '').trim();
      const notes = (document.getElementById('addNotes').value || '').trim();
      const file = document.getElementById('addImgFile').files?.[0];

      let imgUrl = '';
      if (file) {
        imgUrl = await new Promise(r => {
          const fr = new FileReader();
          fr.onload = ev => r(ev.target.result);
          fr.readAsDataURL(file);
        });
      }

      if (!word && !imgUrl) {
        alert('Vui lòng nhập từ vựng hoặc chọn 1 hình ảnh!');
        return;
      }

      const newItem = {
        id: 'tk_' + Date.now(),
        word: word || ('🖼️ Thẻ ảnh #' + (ALL_ITEMS.length + 1)),
        translation: trans,
        notes: notes,
        imageUrl: imgUrl,
        createdAt: new Date().toISOString()
      };

      ALL_ITEMS.unshift(newItem);
      curIndex = 0;
      document.getElementById('addCardModal').classList.remove('active');
      updateUI();
      showToast('✅ Đã thêm thẻ mới!');
    }

    // Startup Load
    loadData();
  </script>
</body>
</html>`;
}

async function writeWebFiles(data, rootDir) {
  const html = generateMobileHtml();

  // 1. Generate PWA Icons
  const rootIconsDir = path.join(rootDir, 'icons');
  const docsIconsDir = path.join(rootDir, 'docs', 'icons');
  await generateIcons([
    rootDir,
    path.join(rootDir, 'docs'),
    rootIconsDir,
    docsIconsDir
  ]);

  // 2. Generate Manifest and SW
  const manifestJson = JSON.stringify({
    name: "Flashcard Học Từ Vựng",
    short_name: "Flashcard",
    description: "Ứng dụng Flashcard học từ vựng nhanh, nhẹ, mượt mà và tự động đồng bộ.",
    start_url: "./index.html",
    scope: "./",
    display: "standalone",
    background_color: "#0b0d14",
    theme_color: "#0b0d14",
    orientation: "portrait",
    icons: [
      { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ]
  }, null, 2);

  const swJs = `// Minimal Service Worker
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
self.addEventListener('fetch', (e) => e.respondWith(fetch(e.request).catch(() => new Response('Offline'))));
`;

  // 3. Write lightweight HTML and PWA files to Root
  const rootIndex = path.join(rootDir, 'index.html');
  fs.writeFileSync(rootIndex, html, 'utf8');
  fs.writeFileSync(path.join(rootDir, 'manifest.json'), manifestJson, 'utf8');
  fs.writeFileSync(path.join(rootDir, 'sw.js'), swJs, 'utf8');

  // 4. Write to Docs for GitHub Pages
  const docsDir = path.join(rootDir, 'docs');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  const docsIndex = path.join(docsDir, 'index.html');
  fs.writeFileSync(docsIndex, html, 'utf8');
  fs.writeFileSync(path.join(docsDir, 'manifest.json'), manifestJson, 'utf8');
  fs.writeFileSync(path.join(docsDir, 'sw.js'), swJs, 'utf8');

  // 5. Write pure flashcards.json and slot_1.json data files (fast, clean, separate from HTML!)
  const docsDataDir = path.join(docsDir, 'data');
  const rootDataDir = path.join(rootDir, 'data');
  if (!fs.existsSync(docsDataDir)) fs.mkdirSync(docsDataDir, { recursive: true });
  if (!fs.existsSync(rootDataDir)) fs.mkdirSync(rootDataDir, { recursive: true });

  const cleanPayload = JSON.stringify(data, null, 2);
  fs.writeFileSync(path.join(docsDataDir, 'flashcards.json'), cleanPayload, 'utf8');
  fs.writeFileSync(path.join(rootDataDir, 'flashcards.json'), cleanPayload, 'utf8');
  fs.writeFileSync(path.join(docsDataDir, 'slot_1.json'), cleanPayload, 'utf8');
  fs.writeFileSync(path.join(rootDataDir, 'slot_1.json'), cleanPayload, 'utf8');

  console.log('[SYNC] Successfully generated clean, lightweight PWA files and data at root and docs/');
  return { rootIndex, docsIndex };
}

module.exports = {
  generateMobileHtml,
  writeWebFiles
};
