// sync_web_generator.js
// Generates standalone, mobile-optimized TikTok Flashcard PWA for GitHub Pages
const fs = require('fs');
const path = require('path');
const { generateIcons } = require('./generate_icons');

function generateMobileHtml(data) {
  const items = (data && data.items) ? data.items : [];
  const totalCount = items.length;
  const jsonData = JSON.stringify(items);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>TikTok Flashcard - Học Từ Vựng IELTS Mobile PWA</title>
  <meta name="description" content="Ứng dụng Flashcard TikTok học từ vựng IELTS, feed ảnh to rõ, phát âm chuẩn, lướt vuốt cực mượt trên điện thoại.">
  <meta name="theme-color" content="#0b0d14">
  
  <!-- PWA Meta Tags -->
  <link rel="manifest" href="manifest.json">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="TikTok Flash">
  <link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
  <link rel="icon" type="image/svg+xml" href="icons/icon.svg">
  <link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">

  <!-- Modern Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

  <style>
    :root {
      --bg: #0b0d14;
      --bg-card: #131722;
      --surface: #1a2030;
      --primary: #00f2fe;
      --primary-gradient: linear-gradient(135deg, #ff0050 0%, #7c3aed 50%, #00f2fe 100%);
      --tk-pink: #ff0050;
      --tk-cyan: #00f2fe;
      --tk-purple: #8b5cf6;
      --accent-green: #10b981;
      --accent-red: #ef4444;
      --accent-gold: #f59e0b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --border: rgba(255, 255, 255, 0.12);
      --border-glow: rgba(0, 242, 254, 0.35);
      --radius: 20px;
      --radius-sm: 12px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }

    html, body {
      width: 100%;
      height: 100%;
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      user-select: none;
      -webkit-user-select: none;
    }

    body {
      display: flex;
      flex-direction: column;
      padding-top: env(safe-area-inset-top, 0px);
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }

    /* Top Navigation Header */
    header {
      flex-shrink: 0;
      z-index: 50;
      background: rgba(11, 13, 20, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
    }

    .brand-logo {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #ff0050 0%, #00f2fe 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 4px 15px rgba(255, 0, 80, 0.4);
      flex-shrink: 0;
    }

    .brand-text h1 {
      font-size: 15px;
      font-weight: 900;
      letter-spacing: -0.2px;
      background: linear-gradient(135deg, #fff 30%, #00f2fe 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1.2;
    }

    .brand-text p {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .icon-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .icon-btn:active {
      transform: scale(0.92);
      background: rgba(255, 255, 255, 0.15);
    }

    .pwa-install-btn {
      height: 34px;
      padding: 0 12px;
      border-radius: 99px;
      background: linear-gradient(135deg, #ff0050 0%, #8b5cf6 100%);
      border: none;
      color: #fff;
      font-size: 11.5px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;
      box-shadow: 0 3px 12px rgba(255, 0, 80, 0.35);
      animation: pulseBtn 2.5s infinite;
    }

    @keyframes pulseBtn {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.04); }
    }

    /* Sub Toolbar (Mode Switcher & Auto-Scroll) */
    .sub-bar {
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 14px;
      background: rgba(19, 23, 34, 0.7);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      gap: 8px;
    }

    .segmented-control {
      display: flex;
      background: rgba(0, 0, 0, 0.4);
      padding: 3px;
      border-radius: 99px;
      border: 1px solid var(--border);
    }

    .segmented-btn {
      padding: 5px 12px;
      border-radius: 99px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .segmented-btn.active {
      background: linear-gradient(135deg, #ff0050 0%, #00f2fe 100%);
      color: #fff;
      box-shadow: 0 2px 8px rgba(0, 242, 254, 0.3);
    }

    .autoscroll-badge {
      display: flex;
      align-items: center;
      gap: 5px;
      background: rgba(0, 242, 254, 0.1);
      border: 1px solid rgba(0, 242, 254, 0.3);
      padding: 4px 10px;
      border-radius: 99px;
      font-size: 11.5px;
      font-weight: 700;
      color: var(--primary);
      cursor: pointer;
    }

    .autoscroll-badge.active {
      background: linear-gradient(135deg, rgba(255,0,80,0.2) 0%, rgba(0,242,254,0.2) 100%);
      border-color: #ff0050;
      color: #ff0050;
    }

    /* Filter Tabs Bar */
    .filter-bar {
      flex-shrink: 0;
      display: flex;
      gap: 6px;
      padding: 8px 14px;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .filter-bar::-webkit-scrollbar {
      display: none;
    }

    .filter-pill {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 99px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-pill.active {
      background: rgba(0, 242, 254, 0.15);
      border-color: #00f2fe;
      color: #fff;
    }

    .filter-badge {
      background: rgba(0, 0, 0, 0.4);
      padding: 1px 7px;
      border-radius: 99px;
      font-size: 10px;
      color: #00f2fe;
    }

    /* Main Container */
    main {
      flex: 1;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* ==========================================================================
       VIEW 1: TIKTOK FEED VIEW (FULLSCREEN VERTICAL SWIPE)
       ========================================================================== */
    .tiktok-feed-container {
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .feed-card {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 10px 14px 20px 14px;
      transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.35s ease;
      touch-action: pan-y;
    }

    .feed-card-box {
      width: 100%;
      height: 100%;
      max-width: 480px;
      background: linear-gradient(165deg, #131722 0%, #0c0e17 100%);
      border: 1.5px solid rgba(255, 255, 255, 0.12);
      border-radius: var(--radius);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }

    /* Image Display Area in Feed */
    .feed-img-area {
      flex: 1;
      width: 100%;
      min-height: 0;
      position: relative;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      cursor: zoom-in;
    }

    .feed-img-area img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: transform 0.3s ease;
    }

    .img-zoom-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.3);
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      color: #fff;
      font-weight: 700;
      pointer-events: none;
    }

    /* Text Vocabulary Area (for text cards) */
    .feed-text-area {
      flex: 1;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 24px 20px;
      text-align: center;
      position: relative;
    }

    .feed-word-title {
      font-size: 32px;
      font-weight: 900;
      line-height: 1.2;
      background: linear-gradient(135deg, #ffffff 40%, #00f2fe 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
      word-break: break-word;
    }

    .feed-word-trans {
      font-size: 20px;
      font-weight: 700;
      color: #6ee7b7;
      margin-bottom: 16px;
      line-height: 1.4;
    }

    .feed-quick-notes {
      font-size: 13.5px;
      color: #cbd5e1;
      line-height: 1.6;
      max-height: 180px;
      overflow-y: auto;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 12px 14px;
      text-align: left;
      width: 100%;
      white-space: pre-wrap;
    }

    /* Bottom Info Bar inside Feed Card */
    .feed-bottom-info {
      flex-shrink: 0;
      padding: 12px 16px;
      background: rgba(11, 13, 20, 0.92);
      backdrop-filter: blur(16px);
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 6px;
      z-index: 10;
    }

    .feed-info-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .feed-tag {
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      background: rgba(139, 92, 246, 0.25);
      color: #c4b5fd;
      border: 1px solid rgba(139, 92, 246, 0.4);
    }

    .feed-index-pill {
      font-size: 11px;
      color: #00f2fe;
      font-weight: 700;
      background: rgba(0, 242, 254, 0.1);
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid rgba(0, 242, 254, 0.3);
    }

    .feed-caption-title {
      font-size: 15px;
      font-weight: 800;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .feed-caption-trans {
      font-size: 13px;
      font-weight: 600;
      color: #6ee7b7;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Right-side Floating Action Toolbar (TikTok style) */
    .feed-side-actions {
      position: absolute;
      right: 14px;
      bottom: 75px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: center;
      z-index: 25;
    }

    .side-action-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(11, 13, 20, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.5);
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .side-action-btn:active {
      transform: scale(0.85);
      border-color: var(--primary);
    }

    .side-action-btn.active-like {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-color: #10b981;
      color: #fff;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
    }

    .side-action-btn.active-due {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border-color: #ef4444;
      color: #fff;
    }

    .side-action-label {
      font-size: 9.5px;
      font-weight: 800;
      margin-top: 2px;
      color: #e2e8f0;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    }

    /* Floating Heart on Double Tap */
    .floating-heart {
      position: absolute;
      font-size: 70px;
      color: #ff0050;
      pointer-events: none;
      animation: floatUpHeart 0.8s ease-out forwards;
      z-index: 100;
      transform: translate(-50%, -50%);
    }

    @keyframes floatUpHeart {
      0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0.9; }
      50% { transform: translate(-50%, -80%) scale(1.3); opacity: 1; }
      100% { transform: translate(-50%, -120%) scale(1.6); opacity: 0; }
    }

    /* Next / Prev Floating Navigation Arrows for Ease of Use */
    .feed-nav-bar {
      position: absolute;
      bottom: 6px;
      left: 14px;
      right: 14px;
      display: flex;
      justify-content: space-between;
      gap: 10px;
      z-index: 30;
      pointer-events: none;
    }

    .feed-nav-btn {
      pointer-events: auto;
      flex: 1;
      height: 44px;
      border-radius: var(--radius-sm);
      background: rgba(19, 23, 34, 0.9);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      color: #fff;
      font-size: 13px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
      transition: all 0.2s;
    }

    .feed-nav-btn:active {
      transform: scale(0.96);
      background: rgba(255, 255, 255, 0.15);
    }

    .feed-nav-btn.primary {
      background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
      color: #0b0d14;
      border: none;
      box-shadow: 0 4px 15px rgba(0, 242, 254, 0.35);
    }

    /* ==========================================================================
       VIEW 2: 3D FLIP CARD VIEW
       ========================================================================== */
    .view-3d-container {
      width: 100%;
      height: 100%;
      display: none;
      flex-direction: column;
      padding: 10px 14px 20px 14px;
      overflow-y: auto;
      align-items: center;
    }

    .card-stage-3d {
      width: 100%;
      max-width: 480px;
      flex: 1;
      min-height: 420px;
      perspective: 1200px;
      margin-bottom: 12px;
    }

    .card-3d-inner {
      width: 100%;
      height: 100%;
      position: relative;
      transform-style: preserve-3d;
      transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      cursor: pointer;
    }

    .card-3d-inner.flipped {
      transform: rotateY(180deg);
    }

    .card-face {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      border-radius: var(--radius);
      padding: 18px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);
      border: 1.5px solid var(--border);
    }

    .card-face-front {
      background: linear-gradient(160deg, #181c2b 0%, #0d0f1a 100%);
      border-color: rgba(0, 242, 254, 0.35);
    }

    .card-face-back {
      background: linear-gradient(160deg, #0a1f18 0%, #091319 100%);
      border-color: rgba(16, 185, 129, 0.4);
      transform: rotateY(180deg);
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      z-index: 100;
      display: none;
      flex-direction: column;
      padding: env(safe-area-inset-top, 16px) 16px env(safe-area-inset-bottom, 16px) 16px;
    }

    .modal-overlay.active {
      display: flex;
    }

    .modal-sheet {
      width: 100%;
      max-width: 500px;
      margin: auto;
      background: #131722;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      display: flex;
      flex-direction: column;
      max-height: 85vh;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8);
      overflow: hidden;
    }

    .modal-header {
      padding: 14px 18px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-title {
      font-size: 16px;
      font-weight: 800;
      color: #fff;
    }

    .modal-body {
      padding: 16px 18px;
      overflow-y: auto;
      flex: 1;
    }

    /* Search results list */
    .search-input-box {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border);
      padding: 10px 14px;
      border-radius: 12px;
      margin-bottom: 12px;
    }

    .search-input-box input {
      flex: 1;
      background: transparent;
      border: none;
      color: #fff;
      font-size: 14px;
      outline: none;
    }

    .search-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 14px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      margin-bottom: 8px;
      cursor: pointer;
    }

    .search-item:active {
      background: rgba(0, 242, 254, 0.15);
      border-color: #00f2fe;
    }

    .search-item-word {
      font-size: 15px;
      font-weight: 800;
      color: #fff;
    }

    .search-item-trans {
      font-size: 12.5px;
      color: #6ee7b7;
      margin-top: 2px;
    }

    /* Examples Drawer Sheet */
    .drawer-sheet {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      max-height: 80vh;
      background: #131722;
      border-top: 2px solid var(--primary);
      border-radius: 24px 24px 0 0;
      z-index: 90;
      transform: translateY(100%);
      transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
      display: flex;
      flex-direction: column;
      box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.8);
      padding-bottom: env(safe-area-inset-bottom, 16px);
    }

    .drawer-sheet.active {
      transform: translateY(0);
    }

    /* PWA iOS Guide Modal */
    .ios-step {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 13.5px;
      color: #cbd5e1;
    }

    .ios-step-num {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--primary);
      color: #0b0d14;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    /* Image Fullscreen Zoom */
    .img-fullscreen-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #000;
      z-index: 150;
      display: none;
      align-items: center;
      justify-content: center;
    }

    .img-fullscreen-modal.active {
      display: flex;
    }

    .img-fullscreen-modal img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .img-close-btn {
      position: absolute;
      top: calc(16px + env(safe-area-inset-top, 0px));
      right: 16px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.4);
      color: #fff;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <header>
    <div class="brand" id="btnLogoHome">
      <div class="brand-logo">🎵</div>
      <div class="brand-text">
        <h1>TIKTOK FLASHCARD</h1>
        <p id="headerProgressText">672 Thẻ Học IELTS</p>
      </div>
    </div>
    <div class="header-actions">
      <button type="button" id="btnPwaInstall" class="pwa-install-btn" title="Cài đặt App vào Màn hình chính">
        <span>📲</span> Cài App
      </button>
      <button type="button" id="btnOpenSearch" class="icon-btn" title="Tìm kiếm">🔍</button>
      <button type="button" id="btnShuffle" class="icon-btn" title="Trộn ngẫu nhiên thẻ">🎲</button>
    </div>
  </header>

  <!-- Sub Bar: Mode Switcher & Auto Scroll -->
  <div class="sub-bar">
    <div class="segmented-control">
      <button type="button" id="btnModeFeed" class="segmented-btn active">📱 TikTok Feed</button>
      <button type="button" id="btnMode3D" class="segmented-btn">🔄 Thẻ Lật 3D</button>
    </div>

    <div id="btnAutoScroll" class="autoscroll-badge" title="Tự động phát âm và lướt thẻ">
      <span>⏱️</span>
      <span id="lblAutoScroll">Tự lướt: <b>TẮT</b></span>
    </div>
  </div>

  <!-- Filter Pills -->
  <div class="filter-bar">
    <button type="button" class="filter-pill active" data-filter="all">
      <span>📚 Tất cả</span>
      <span class="filter-badge" id="badgeAll">0</span>
    </button>
    <button type="button" class="filter-pill" data-filter="due">
      <span>🔴 Cần ôn</span>
      <span class="filter-badge" id="badgeDue">0</span>
    </button>
    <button type="button" class="filter-pill" data-filter="mastered">
      <span>🟢 Đã thuộc</span>
      <span class="filter-badge" id="badgeMastered">0</span>
    </button>
    <button type="button" class="filter-pill" data-filter="image">
      <span>🖼️ Thẻ ảnh</span>
      <span class="filter-badge" id="badgeImage">0</span>
    </button>
  </div>

  <!-- Main Content Area -->
  <main id="mainContainer">
    
    <!-- VIEW 1: TikTok Feed View (Default) -->
    <div id="feedView" class="tiktok-feed-container">
      
      <!-- Feed Card Item -->
      <div class="feed-card" id="activeFeedCard">
        <div class="feed-card-box">
          
          <!-- Case A: Image Flashcard -->
          <div class="feed-img-area" id="feedImgArea" style="display: none;">
            <img id="feedImgEl" src="" alt="Flashcard" />
            <div class="img-zoom-badge">🔍 Chạm phóng to</div>
          </div>

          <!-- Case B: Text Vocabulary Card -->
          <div class="feed-text-area" id="feedTextArea" style="display: none;">
            <div class="feed-word-title" id="feedWordTitle">Loading...</div>
            <div class="feed-word-trans" id="feedWordTrans">Dịch nghĩa</div>
            <div class="feed-quick-notes" id="feedQuickNotes">Ví dụ & Ghi chú...</div>
          </div>

          <!-- Right Floating Action Buttons (TikTok style) -->
          <div class="feed-side-actions">
            <div class="side-action-btn" id="btnFeedSpeak" title="Phát âm tiếng Anh">
              <span style="font-size: 20px;">🔊</span>
              <span class="side-action-label">Đọc</span>
            </div>
            <div class="side-action-btn" id="btnFeedDrawer" title="Xem dịch & 10 ví dụ">
              <span style="font-size: 20px;">📖</span>
              <span class="side-action-label">Ví dụ</span>
            </div>
            <div class="side-action-btn" id="btnFeedMarkMastered" title="Đánh dấu đã thuộc">
              <span style="font-size: 20px;">💚</span>
              <span class="side-action-label">Thuộc</span>
            </div>
            <a href="#" target="_blank" class="side-action-btn" id="btnFeedTiktokLink" title="Mở video TikTok">
              <span style="font-size: 20px;">🎬</span>
              <span class="side-action-label">TikTok</span>
            </a>
            <div class="side-action-btn" id="btnFeedCopyPrompt" title="Copy prompt cho AI">
              <span style="font-size: 18px;">📋</span>
              <span class="side-action-label">Prompt</span>
            </div>
          </div>

          <!-- Bottom Card Caption -->
          <div class="feed-bottom-info">
            <div class="feed-info-header">
              <span class="feed-tag" id="feedTag">IELTS Mastery</span>
              <span class="feed-index-pill" id="feedIndexPill">Thẻ 1 / 672</span>
            </div>
            <div class="feed-caption-title" id="feedCaptionTitle">Từ vựng</div>
            <div class="feed-caption-trans" id="feedCaptionTrans">Bản dịch tiếng Việt</div>
          </div>
        </div>
      </div>

      <!-- Feed Navigation Buttons -->
      <div class="feed-nav-bar">
        <button type="button" class="feed-nav-btn" id="btnFeedPrev">▲ Thẻ trước</button>
        <button type="button" class="feed-nav-btn primary" id="btnFeedNext">Thẻ sau ▼</button>
      </div>
    </div>

    <!-- VIEW 2: 3D Flip Card View -->
    <div id="view3D" class="view-3d-container">
      <div class="card-stage-3d">
        <div class="card-3d-inner" id="card3dInner">
          
          <!-- Front Face -->
          <div class="card-face card-face-front">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="feed-tag" id="card3dTag">Mặt trước</span>
              <button type="button" class="icon-btn" id="btnCard3dSpeakFront">🔊</button>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
              <div id="card3dFrontImgBox" style="max-height: 240px; display: none; margin-bottom: 12px;">
                <img id="card3dFrontImg" src="" style="max-height: 220px; max-width: 100%; object-fit: contain; border-radius: 12px;" />
              </div>
              <div class="feed-word-title" id="card3dFrontWord">Word</div>
              <div style="font-size: 13px; color: var(--primary); margin-top: 8px;">👆 Chạm thẻ để lật xem nghĩa & ví dụ</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; color: var(--text-muted);">👈 Vuốt chuyển thẻ 👉</span>
              <a href="#" target="_blank" class="pwa-install-btn" id="btnCard3dTiktokFront" style="background: rgba(255,255,255,0.1); border: 1px solid var(--border);">🎬 TikTok</a>
            </div>
          </div>

          <!-- Back Face -->
          <div class="card-face card-face-back">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="feed-tag" style="background: rgba(16,185,129,0.25); color: #6ee7b7; border-color: #10b981;">Bản dịch & Ví dụ</span>
              <button type="button" class="icon-btn" id="btnCard3dSpeakBack">🔊</button>
            </div>
            <div style="flex: 1; overflow-y: auto; padding: 10px 0;">
              <div class="feed-word-trans" id="card3dBackTrans" style="font-size: 24px; text-align: center;">Nghĩa tiếng Việt</div>
              <div id="card3dBackNotes" style="font-size: 13px; line-height: 1.6; color: #cbd5e1; white-space: pre-wrap; margin-top: 10px; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 10px;">Ví dụ...</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <button type="button" class="feed-nav-btn" id="btnCard3dFlipBack" style="height: 36px; padding: 0 12px; font-size: 12px;">🔄 Lật lại</button>
              <a href="#" target="_blank" class="pwa-install-btn" id="btnCard3dTiktokBack" style="background: rgba(255,255,255,0.1); border: 1px solid var(--border);">🎬 TikTok</a>
            </div>
          </div>

        </div>
      </div>

      <!-- 3D Controls -->
      <div style="width: 100%; max-width: 480px; display: flex; gap: 10px;">
        <button type="button" class="feed-nav-btn" id="btn3DPrev">◀ Trước</button>
        <button type="button" class="feed-nav-btn primary" id="btn3DNext">Sau ▶</button>
      </div>
    </div>
  </main>

  <!-- Bottom Details Drawer (for Examples & Translation) -->
  <div class="drawer-sheet" id="examplesDrawer">
    <div class="modal-header">
      <div class="modal-title" id="drawerTitle">📖 Chi tiết từ vựng & Ví dụ</div>
      <button type="button" class="icon-btn" id="btnCloseDrawer">✕</button>
    </div>
    <div class="modal-body" id="drawerContent">
      <!-- Populated dynamically -->
    </div>
  </div>

  <!-- Search Modal -->
  <div class="modal-overlay" id="searchModal">
    <div class="modal-sheet">
      <div class="modal-header">
        <div class="modal-title">🔍 Tìm kiếm 672 Thẻ Flashcard</div>
        <button type="button" class="icon-btn" id="btnCloseSearch">✕</button>
      </div>
      <div class="modal-body">
        <div class="search-input-box">
          <span>🔍</span>
          <input type="text" id="searchInput" placeholder="Nhập từ tiếng Anh hoặc tiếng Việt..." />
        </div>
        <div id="searchResultsList"></div>
      </div>
    </div>
  </div>

  <!-- Fullscreen Image Viewer Modal -->
  <div class="img-fullscreen-modal" id="imgFullscreenModal">
    <button type="button" class="img-close-btn" id="btnCloseImgModal">✕</button>
    <img id="fullscreenImg" src="" alt="Zoomed Flashcard" />
  </div>

  <!-- PWA iOS Add to Home Screen Instructions Modal -->
  <div class="modal-overlay" id="iosPwaModal">
    <div class="modal-sheet">
      <div class="modal-header">
        <div class="modal-title">📲 Thêm vào Màn hình chính (iOS)</div>
        <button type="button" class="icon-btn" id="btnCloseIosModal">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 13.5px; color: #94a3b8; margin-bottom: 14px;">Để dùng ứng dụng mượt mà không thanh địa chỉ như một App thật trên iPhone:</p>
        <div class="ios-step">
          <div class="ios-step-num">1</div>
          <div>Chạm vào biểu tượng <b>Chia sẻ</b> (ô vuông có mũi tên trỏ lên <b>⎋</b>) ở thanh dưới Safari.</div>
        </div>
        <div class="ios-step">
          <div class="ios-step-num">2</div>
          <div>Cuộn xuống và chọn <b>"Thêm vào MH chính"</b> (Add to Home Screen <b>⊞</b>).</div>
        </div>
        <div class="ios-step">
          <div class="ios-step-num">3</div>
          <div>Chạm <b>"Thêm"</b> (Add) ở góc trên bên phải màn hình.</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Embedded Dataset -->
  <script id="flashcard-data" type="application/json">
${jsonData}
  </script>

  <script>
    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('[PWA] Service Worker registered:', reg.scope))
          .catch(err => console.warn('[PWA] Service Worker registration failed:', err));
      });
    }

    // PWA Install prompt handling
    let deferredPrompt = null;
    const btnPwaInstall = document.getElementById('btnPwaInstall');
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (btnPwaInstall) btnPwaInstall.style.display = 'flex';
    });

    if (btnPwaInstall) {
      btnPwaInstall.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log('[PWA] User response to install:', outcome);
          deferredPrompt = null;
        } else {
          // Check iOS Safari
          const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
          if (isIos) {
            document.getElementById('iosPwaModal').classList.add('active');
          } else {
            alert('Để cài đặt App, hãy bấm vào menu 3 chấm trên trình duyệt và chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính" nhé!');
          }
        }
      });
    }

    // Load Flashcard Data
    let RAW_ITEMS = [];
    try {
      const el = document.getElementById('flashcard-data');
      RAW_ITEMS = el ? JSON.parse(el.textContent) : [];
    } catch (e) {
      console.error('Failed to parse items:', e);
      RAW_ITEMS = [];
    }

    // Local Storage State
    let masteredIds = new Set(JSON.parse(localStorage.getItem('pwa_tk_mastered') || '[]'));
    let dueIds = new Set(JSON.parse(localStorage.getItem('pwa_tk_due') || '[]'));
    let activeFilter = localStorage.getItem('pwa_tk_filter') || 'all';
    let currentIndex = parseInt(localStorage.getItem('pwa_tk_index') || '0', 10);
    let viewMode = localStorage.getItem('pwa_tk_view_mode') || 'feed'; // 'feed' | '3d'
    let autoScrollInterval = null;
    let autoScrollSeconds = 0; // 0 = off, 3, 5, 7

    function saveState() {
      localStorage.setItem('pwa_tk_mastered', JSON.stringify([...masteredIds]));
      localStorage.setItem('pwa_tk_due', JSON.stringify([...dueIds]));
      localStorage.setItem('pwa_tk_filter', activeFilter);
      localStorage.setItem('pwa_tk_index', currentIndex.toString());
      localStorage.setItem('pwa_tk_view_mode', viewMode);
    }

    function getFilteredList() {
      return RAW_ITEMS.filter(item => {
        if (activeFilter === 'due') return dueIds.has(item.id);
        if (activeFilter === 'mastered') return masteredIds.has(item.id);
        if (activeFilter === 'image') return !!item.imageUrl;
        return true;
      });
    }

    function updateBadges() {
      const allCount = RAW_ITEMS.length;
      const dueCount = RAW_ITEMS.filter(x => dueIds.has(x.id)).length;
      const masteredCount = RAW_ITEMS.filter(x => masteredIds.has(x.id)).length;
      const imageCount = RAW_ITEMS.filter(x => !!x.imageUrl).length;

      document.getElementById('badgeAll').textContent = allCount;
      document.getElementById('badgeDue').textContent = dueCount;
      document.getElementById('badgeMastered').textContent = masteredCount;
      document.getElementById('badgeImage').textContent = imageCount;
      
      const pct = allCount > 0 ? Math.round((masteredCount / allCount) * 100) : 0;
      document.getElementById('headerProgressText').textContent = \`\${allCount} thẻ • Đã thuộc \${pct}%\`;
    }

    function renderCurrentCard() {
      const list = getFilteredList();
      if (list.length === 0) {
        // Empty state
        if (currentIndex !== 0) currentIndex = 0;
      } else {
        if (currentIndex < 0) currentIndex = 0;
        if (currentIndex >= list.length) currentIndex = list.length - 1;
      }

      const item = list[currentIndex] || { word: 'Không có thẻ', translation: 'Chưa có dữ liệu cho bộ lọc này' };
      const currentNum = list.length > 0 ? currentIndex + 1 : 0;
      const totalNum = list.length;

      // 1. Render Feed View
      const feedImgArea = document.getElementById('feedImgArea');
      const feedImgEl = document.getElementById('feedImgEl');
      const feedTextArea = document.getElementById('feedTextArea');
      const feedWordTitle = document.getElementById('feedWordTitle');
      const feedWordTrans = document.getElementById('feedWordTrans');
      const feedQuickNotes = document.getElementById('feedQuickNotes');
      const feedIndexPill = document.getElementById('feedIndexPill');
      const feedCaptionTitle = document.getElementById('feedCaptionTitle');
      const feedCaptionTrans = document.getElementById('feedCaptionTrans');
      const feedTag = document.getElementById('feedTag');
      const btnFeedMarkMastered = document.getElementById('btnFeedMarkMastered');
      const btnFeedTiktokLink = document.getElementById('btnFeedTiktokLink');

      feedIndexPill.textContent = \`Thẻ \${currentNum} / \${totalNum}\`;
      feedCaptionTitle.textContent = item.word || 'Thẻ ảnh';
      feedCaptionTrans.textContent = item.translation || (item.imageUrl ? 'Chạm để xem ảnh to' : '');
      feedTag.textContent = item.level ? \`Level \${item.level}\` : 'IELTS Mastery';

      if (item.imageUrl) {
        feedImgArea.style.display = 'flex';
        feedImgEl.src = item.imageUrl;
        feedTextArea.style.display = 'none';
      } else {
        feedImgArea.style.display = 'none';
        feedTextArea.style.display = 'flex';
        feedWordTitle.textContent = item.word || '---';
        feedWordTrans.textContent = item.translation || '';
        feedQuickNotes.textContent = item.notes || 'Chưa có ví dụ ghi chú.';
      }

      // Mark status style
      if (masteredIds.has(item.id)) {
        btnFeedMarkMastered.classList.add('active-like');
      } else {
        btnFeedMarkMastered.classList.remove('active-like');
      }

      // TikTok link
      const tkUrl = item.tiktokUrl || (\`https://www.tiktok.com/search?q=\${encodeURIComponent(item.word || '')}\`);
      btnFeedTiktokLink.href = tkUrl;

      // 2. Render 3D View
      const card3dFrontWord = document.getElementById('card3dFrontWord');
      const card3dBackTrans = document.getElementById('card3dBackTrans');
      const card3dBackNotes = document.getElementById('card3dBackNotes');
      const card3dFrontImgBox = document.getElementById('card3dFrontImgBox');
      const card3dFrontImg = document.getElementById('card3dFrontImg');
      const card3dTag = document.getElementById('card3dTag');
      const btnCard3dTiktokFront = document.getElementById('btnCard3dTiktokFront');
      const btnCard3dTiktokBack = document.getElementById('btnCard3dTiktokBack');

      card3dFrontWord.textContent = item.word || '';
      card3dBackTrans.textContent = item.translation || '';
      card3dBackNotes.textContent = item.notes || 'Chưa có ví dụ ghi chú.';
      card3dTag.textContent = \`Thẻ \${currentNum} / \${totalNum}\`;
      btnCard3dTiktokFront.href = tkUrl;
      btnCard3dTiktokBack.href = tkUrl;

      if (item.imageUrl) {
        card3dFrontImgBox.style.display = 'block';
        card3dFrontImg.src = item.imageUrl;
      } else {
        card3dFrontImgBox.style.display = 'none';
      }

      saveState();
    }

    // Next / Prev Actions
    function nextCard() {
      const list = getFilteredList();
      if (list.length === 0) return;
      if (currentIndex < list.length - 1) {
        currentIndex++;
      } else {
        currentIndex = 0; // loop around
      }
      renderCurrentCard();
      if (autoScrollSeconds > 0) speakCurrentWord();
    }

    function prevCard() {
      const list = getFilteredList();
      if (list.length === 0) return;
      if (currentIndex > 0) {
        currentIndex--;
      } else {
        currentIndex = list.length - 1;
      }
      renderCurrentCard();
    }

    // TTS Audio Pronunciation
    function speakCurrentWord() {
      const list = getFilteredList();
      const item = list[currentIndex];
      if (!item || !item.word) return;

      const cleanWord = item.word.replace(/\\(.*?\\)/g, '').replace(/[^a-zA-Z0-9\\s']/g, '').trim();
      if (!cleanWord) return;

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(cleanWord);
        utter.lang = 'en-US';
        utter.rate = 0.9;
        window.speechSynthesis.speak(utter);
      }
    }

    // Double Tap Like Animation
    function triggerHeartAnim(x, y) {
      const heart = document.createElement('div');
      heart.className = 'floating-heart';
      heart.innerHTML = '❤️';
      heart.style.left = x + 'px';
      heart.style.top = y + 'px';
      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 800);
    }

    // Toggle Mastered
    function toggleMastered(e) {
      const list = getFilteredList();
      const item = list[currentIndex];
      if (!item || !item.id) return;

      if (masteredIds.has(item.id)) {
        masteredIds.delete(item.id);
      } else {
        masteredIds.add(item.id);
        dueIds.delete(item.id);
        if (e && e.clientX && e.clientY) {
          triggerHeartAnim(e.clientX, e.clientY);
        } else {
          triggerHeartAnim(window.innerWidth / 2, window.innerHeight / 2);
        }
      }
      updateBadges();
      renderCurrentCard();
    }

    // Mode Switcher
    function setViewMode(mode) {
      viewMode = mode;
      const feedView = document.getElementById('feedView');
      const view3D = document.getElementById('view3D');
      const btnModeFeed = document.getElementById('btnModeFeed');
      const btnMode3D = document.getElementById('btnMode3D');

      if (mode === '3d') {
        feedView.style.display = 'none';
        view3D.style.display = 'flex';
        btnModeFeed.classList.remove('active');
        btnMode3D.classList.add('active');
      } else {
        feedView.style.display = 'flex';
        view3D.style.display = 'none';
        btnModeFeed.classList.add('active');
        btnMode3D.classList.remove('active');
      }
      renderCurrentCard();
    }

    // Auto-Scroll Feature
    const autoScrollLevels = [0, 3, 5, 7];
    let autoScrollIdx = 0;

    function toggleAutoScroll() {
      autoScrollIdx = (autoScrollIdx + 1) % autoScrollLevels.length;
      autoScrollSeconds = autoScrollLevels[autoScrollIdx];
      const lbl = document.getElementById('lblAutoScroll');
      const badge = document.getElementById('btnAutoScroll');

      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }

      if (autoScrollSeconds === 0) {
        lbl.innerHTML = 'Tự lướt: <b>TẮT</b>';
        badge.classList.remove('active');
      } else {
        lbl.innerHTML = \`Tự lướt: <b>\${autoScrollSeconds}s</b>\`;
        badge.classList.add('active');
        speakCurrentWord();
        autoScrollInterval = setInterval(() => {
          nextCard();
        }, autoScrollSeconds * 1000);
      }
    }

    // Touch Swipe Gestures for TikTok Feed View
    let touchStartY = 0;
    let touchStartX = 0;
    let touchStartTime = 0;
    let lastTapTime = 0;

    const feedCardEl = document.getElementById('activeFeedCard');
    feedCardEl.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      touchStartTime = Date.now();
    }, { passive: true });

    feedCardEl.addEventListener('touchend', (e) => {
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const duration = Date.now() - touchStartTime;

      // Check double tap
      const now = Date.now();
      if (now - lastTapTime < 300 && Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15) {
        toggleMastered(e.changedTouches[0]);
      }
      lastTapTime = now;

      if (duration < 600) {
        if (deltaY < -40) {
          // Swipe up -> Next
          nextCard();
        } else if (deltaY > 40) {
          // Swipe down -> Prev
          prevCard();
        }
      }
    });

    // 3D Card Swipe
    const card3dInner = document.getElementById('card3dInner');
    card3dInner.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      card3dInner.classList.toggle('flipped');
    });

    // Open Examples Drawer
    function openDrawer() {
      const list = getFilteredList();
      const item = list[currentIndex];
      if (!item) return;

      const drawer = document.getElementById('examplesDrawer');
      const title = document.getElementById('drawerTitle');
      const content = document.getElementById('drawerContent');

      title.textContent = item.word ? \`📖 \${item.word}\` : '📖 Chi tiết từ vựng';
      content.innerHTML = \`
        <div style="font-size: 18px; font-weight: 800; color: #6ee7b7; margin-bottom: 12px;">\${item.translation || ''}</div>
        <div style="font-size: 14px; line-height: 1.7; color: #e2e8f0; white-space: pre-wrap; background: rgba(255,255,255,0.04); padding: 14px; border-radius: 12px; border: 1px solid var(--border);">\${item.notes || 'Chưa có ghi chú ví dụ.'}</div>
        <div style="margin-top: 16px; display: flex; gap: 10px;">
          <button type="button" class="feed-nav-btn primary" id="btnDrawerSpeak" style="flex: 1;">🔊 Phát âm</button>
        </div>
      \`;
      drawer.classList.add('active');

      const btnDrawerSpeak = document.getElementById('btnDrawerSpeak');
      if (btnDrawerSpeak) btnDrawerSpeak.addEventListener('click', speakCurrentWord);
    }

    document.getElementById('btnCloseDrawer').addEventListener('click', () => {
      document.getElementById('examplesDrawer').classList.remove('active');
    });

    // Copy Prompt for AI
    function copyPromptForAI() {
      const list = getFilteredList();
      const item = list[currentIndex];
      if (!item) return;

      const promptText = \`Hãy giúp tôi giải thích chi tiết từ/cụm từ "\${item.word || ''}" (Nghĩa: "\${item.translation || ''}"), đặt 3 câu ví dụ giao tiếp Speaking và 2 câu Writing học thuật chuẩn band 7.5+ kèm dịch nghĩa tiếng Việt.\`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(promptText).then(() => {
          alert('✅ Đã copy prompt! Hãy dán vào Gemini / ChatGPT để học thêm nhé.');
        });
      }
    }

    // Zoom Image Modal
    document.getElementById('feedImgArea').addEventListener('click', () => {
      const list = getFilteredList();
      const item = list[currentIndex];
      if (item && item.imageUrl) {
        const modal = document.getElementById('imgFullscreenModal');
        const img = document.getElementById('fullscreenImg');
        img.src = item.imageUrl;
        modal.classList.add('active');
      }
    });

    document.getElementById('btnCloseImgModal').addEventListener('click', () => {
      document.getElementById('imgFullscreenModal').classList.remove('active');
    });

    // Search Logic
    const searchModal = document.getElementById('searchModal');
    const searchInput = document.getElementById('searchInput');
    const searchResultsList = document.getElementById('searchResultsList');

    document.getElementById('btnOpenSearch').addEventListener('click', () => {
      searchModal.classList.add('active');
      searchInput.value = '';
      renderSearchResults('');
      setTimeout(() => searchInput.focus(), 150);
    });

    document.getElementById('btnCloseSearch').addEventListener('click', () => {
      searchModal.classList.remove('active');
    });

    function renderSearchResults(query) {
      const q = (query || '').toLowerCase().trim();
      const results = RAW_ITEMS.filter(item => {
        if (!q) return true;
        return (item.word && item.word.toLowerCase().includes(q)) ||
               (item.translation && item.translation.toLowerCase().includes(q)) ||
               (item.notes && item.notes.toLowerCase().includes(q));
      }).slice(0, 40);

      searchResultsList.innerHTML = '';
      if (results.length === 0) {
        searchResultsList.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 20px;">Không tìm thấy thẻ nào phù hợp.</div>';
        return;
      }

      results.forEach(item => {
        const div = document.createElement('div');
        div.className = 'search-item';
        div.innerHTML = \`
          <div>
            <div class="search-item-word">\${item.word || '🖼️ Thẻ ảnh'}</div>
            <div class="search-item-trans">\${item.translation || (item.imageUrl ? 'Thẻ ảnh' : '')}</div>
          </div>
          <div style="font-size: 11px; color: var(--primary); font-weight: bold;">Học ngay ▶</div>
        \`;
        div.addEventListener('click', () => {
          searchModal.classList.remove('active');
          activeFilter = 'all';
          document.querySelectorAll('.filter-pill').forEach(p => p.classList.toggle('active', p.dataset.filter === 'all'));
          const idx = RAW_ITEMS.findIndex(x => x.id === item.id);
          if (idx >= 0) currentIndex = idx;
          renderCurrentCard();
        });
        searchResultsList.appendChild(div);
      });
    }

    searchInput.addEventListener('input', (e) => {
      renderSearchResults(e.target.value);
    });

    // Filter Buttons
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeFilter = pill.dataset.filter;
        currentIndex = 0;
        renderCurrentCard();
      });
    });

    // Shuffle Button
    document.getElementById('btnShuffle').addEventListener('click', () => {
      for (let i = RAW_ITEMS.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [RAW_ITEMS[i], RAW_ITEMS[j]] = [RAW_ITEMS[j], RAW_ITEMS[i]];
      }
      currentIndex = 0;
      renderCurrentCard();
      alert('🎲 Đã trộn ngẫu nhiên toàn bộ thẻ!');
    });

    // Close modal on backdrop click or Escape
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) searchModal.classList.remove('active');
    });

    const iosPwaModal = document.getElementById('iosPwaModal');
    iosPwaModal.addEventListener('click', (e) => {
      if (e.target === iosPwaModal) iosPwaModal.classList.remove('active');
    });

    const imgFullscreenModal = document.getElementById('imgFullscreenModal');
    imgFullscreenModal.addEventListener('click', (e) => {
      if (e.target === imgFullscreenModal) imgFullscreenModal.classList.remove('active');
    });

    const examplesDrawer = document.getElementById('examplesDrawer');
    window.addEventListener('click', (e) => {
      if (examplesDrawer.classList.contains('active') && !examplesDrawer.contains(e.target) && !e.target.closest('#btnFeedDrawer')) {
        examplesDrawer.classList.remove('active');
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchModal.classList.remove('active');
        iosPwaModal.classList.remove('active');
        imgFullscreenModal.classList.remove('active');
        examplesDrawer.classList.remove('active');
      }
    });

    // Event Listeners
    document.getElementById('btnFeedNext').addEventListener('click', nextCard);
    document.getElementById('btnFeedPrev').addEventListener('click', prevCard);
    document.getElementById('btn3DNext').addEventListener('click', nextCard);
    document.getElementById('btn3DPrev').addEventListener('click', prevCard);
    document.getElementById('btnFeedSpeak').addEventListener('click', speakCurrentWord);
    document.getElementById('btnCard3dSpeakFront').addEventListener('click', speakCurrentWord);
    document.getElementById('btnCard3dSpeakBack').addEventListener('click', speakCurrentWord);
    document.getElementById('btnFeedDrawer').addEventListener('click', openDrawer);
    document.getElementById('btnFeedCopyPrompt').addEventListener('click', copyPromptForAI);
    document.getElementById('btnFeedMarkMastered').addEventListener('click', toggleMastered);
    document.getElementById('btnModeFeed').addEventListener('click', () => setViewMode('feed'));
    document.getElementById('btnMode3D').addEventListener('click', () => setViewMode('3d'));
    document.getElementById('btnAutoScroll').addEventListener('click', toggleAutoScroll);
    document.getElementById('btnCloseIosModal').addEventListener('click', () => {
      document.getElementById('iosPwaModal').classList.remove('active');
    });

    // Initialize
    updateBadges();
    setViewMode(viewMode);
    renderCurrentCard();
  </script>
</body>
</html>`;
}

function writeWebFiles(data, rootDir) {
  const html = generateMobileHtml(data);
  
  // 1. Generate PWA Icons
  const rootIconsDir = path.join(rootDir, 'icons');
  const docsIconsDir = path.join(rootDir, 'docs', 'icons');
  generateIcons([rootIconsDir, docsIconsDir]);

  // 2. Generate Manifest and SW in root
  const manifestJson = JSON.stringify({
    name: "TikTok Flashcard - Học Từ Vựng IELTS",
    short_name: "TikTok Flash",
    description: "App Flashcard TikTok học từ vựng IELTS với feed ảnh to rõ, phát âm, lướt vuốt cực mượt trên điện thoại",
    start_url: "./index.html",
    scope: "./",
    display: "standalone",
    background_color: "#0b0d14",
    theme_color: "#0b0d14",
    orientation: "portrait",
    icons: [
      {
        src: "icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "icons/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any maskable"
      },
      {
        src: "icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png"
      }
    ],
    categories: ["education", "productivity"]
  }, null, 2);

  const swJs = `// sw.js - Service Worker for TikTok Flashcard PWA
const CACHE_NAME = 'tiktok-flashcard-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return res;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
  );
});`;

  // 3. Write Root files
  const rootIndex = path.join(rootDir, 'index.html');
  fs.writeFileSync(rootIndex, html, 'utf8');
  fs.writeFileSync(path.join(rootDir, 'manifest.json'), manifestJson, 'utf8');
  fs.writeFileSync(path.join(rootDir, 'sw.js'), swJs, 'utf8');

  // 4. Write Docs files
  const docsDir = path.join(rootDir, 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  const docsIndex = path.join(docsDir, 'index.html');
  fs.writeFileSync(docsIndex, html, 'utf8');
  fs.writeFileSync(path.join(docsDir, 'manifest.json'), manifestJson, 'utf8');
  fs.writeFileSync(path.join(docsDir, 'sw.js'), swJs, 'utf8');

  console.log('[SYNC] Successfully generated mobile PWA files at root and docs/');
  return { rootIndex, docsIndex };
}

module.exports = {
  generateMobileHtml,
  writeWebFiles
};
