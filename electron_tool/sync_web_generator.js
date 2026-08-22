// sync_web_generator.js
// Generates standalone, mobile-optimized TikTok Flashcard PWA for GitHub Pages with 1-Digit Cloud Sync, Add New Card, and Manual Up/Down Buttons
const fs = require('fs');
const path = require('path');
const { generateIcons } = require('./generate_icons');

function generateMobileHtml(data) {
  const items = (data && data.items) ? data.items : [];
  const jsonData = JSON.stringify(items);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>TikTok Flashcard - Lướt Từ Vựng IELTS</title>
  <meta name="description" content="Ứng dụng Flashcard TikTok học từ vựng IELTS, lướt lên xuống chuẩn TikTok, có nút Thẻ trên / Thẻ dưới, thêm thẻ ảnh mới, sao lưu Cloud mã 1 số, phát âm to rõ.">
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
      --surface: #131722;
      --primary: #00f2fe;
      --tk-pink: #ff0050;
      --tk-cyan: #00f2fe;
      --tk-purple: #8b5cf6;
      --accent-green: #10b981;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --border: rgba(255, 255, 255, 0.12);
      --radius: 16px;
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

    /* Top Floating Translucent Header */
    header {
      flex-shrink: 0;
      z-index: 60;
      background: rgba(11, 13, 20, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .brand-logo {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: linear-gradient(135deg, #ff0050 0%, #00f2fe 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 12px rgba(255, 0, 80, 0.4);
      flex-shrink: 0;
    }

    .brand-text h1 {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: -0.2px;
      background: linear-gradient(135deg, #fff 30%, #00f2fe 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1.2;
    }

    .brand-text p {
      font-size: 10.5px;
      color: #94a3b8;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .icon-btn {
      width: 34px;
      height: 34px;
      border-radius: 99px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .icon-btn:active {
      transform: scale(0.92);
      background: rgba(255, 255, 255, 0.15);
    }

    .pwa-install-btn {
      height: 32px;
      padding: 0 10px;
      border-radius: 99px;
      background: linear-gradient(135deg, #ff0050 0%, #8b5cf6 100%);
      border: none;
      color: #fff;
      font-size: 11px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      box-shadow: 0 3px 12px rgba(255, 0, 80, 0.35);
    }

    .add-card-header-btn {
      height: 32px;
      padding: 0 12px;
      border-radius: 99px;
      background: linear-gradient(135deg, #ff0050 0%, #00f2fe 100%);
      border: none;
      color: #fff;
      font-size: 11.5px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      box-shadow: 0 3px 12px rgba(0, 242, 254, 0.35);
    }

    /* Sub Toolbar (Filter Pills & Auto-Scroll) */
    .sub-toolbar {
      flex-shrink: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 12px;
      background: rgba(19, 23, 34, 0.9);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      gap: 8px;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .sub-toolbar::-webkit-scrollbar {
      display: none;
    }

    .filter-pills-group {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .filter-pill {
      flex-shrink: 0;
      padding: 4px 10px;
      border-radius: 99px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border);
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .filter-pill.active {
      background: rgba(0, 242, 254, 0.15);
      border-color: #00f2fe;
      color: #fff;
    }

    .autoscroll-pill {
      flex-shrink: 0;
      padding: 4px 10px;
      border-radius: 99px;
      background: rgba(0, 242, 254, 0.08);
      border: 1px solid rgba(0, 242, 254, 0.3);
      color: var(--primary);
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .autoscroll-pill.active {
      background: linear-gradient(135deg, rgba(255,0,80,0.2) 0%, rgba(0,242,254,0.2) 100%);
      border-color: #ff0050;
      color: #ff0050;
    }

    /* Main Container (Full Screen 100% Viewport) */
    main {
      flex: 1;
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: #000;
    }

    /* ==========================================================================
       TIKTOK VERTICAL SWIPE DECK (FULL SCREEN & ULTRA SMOOTH)
       ========================================================================== */
    .tiktok-viewport {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      touch-action: none;
      cursor: grab;
    }

    .tiktok-viewport:active {
      cursor: grabbing;
    }

    .tiktok-slider-track {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      will-change: transform;
    }

    .tiktok-slide {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      background: #0b0d14;
    }

    /* Slide Card Content */
    .slide-body {
      flex: 1;
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 16px;
      overflow: hidden;
    }

    /* Image Flashcard in Fullscreen Slide */
    .slide-img-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: zoom-in;
    }

    .slide-img-container img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: var(--radius);
      box-shadow: 0 10px 40px rgba(0,0,0,0.8);
      pointer-events: none;
    }

    /* Text Flashcard in Fullscreen Slide */
    .slide-text-container {
      width: 100%;
      max-width: 540px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 20px;
      pointer-events: none;
    }

    .slide-word-title {
      font-size: 38px;
      font-weight: 900;
      line-height: 1.2;
      background: linear-gradient(135deg, #ffffff 40%, #00f2fe 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 10px;
      word-break: break-word;
      text-shadow: 0 4px 20px rgba(0, 242, 254, 0.3);
    }

    .slide-word-trans {
      font-size: 22px;
      font-weight: 800;
      color: #6ee7b7;
      margin-bottom: 16px;
      line-height: 1.4;
    }

    .slide-notes-card {
      width: 100%;
      font-size: 14.5px;
      color: #cbd5e1;
      line-height: 1.6;
      max-height: 240px;
      overflow-y: auto;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 14px 16px;
      text-align: left;
      white-space: pre-wrap;
      box-shadow: 0 8px 30px rgba(0,0,0,0.5);
    }

    /* Right-side Floating Action Toolbar (TikTok Style) */
    .tiktok-side-actions {
      position: absolute;
      right: 12px;
      bottom: 75px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;
      z-index: 30;
    }

    .side-btn {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: rgba(19, 23, 34, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1.5px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      text-decoration: none;
    }

    .side-btn:active {
      transform: scale(0.86);
      border-color: var(--primary);
    }

    .side-btn.active-like {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-color: #10b981;
      color: #fff;
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.5);
    }

    .side-btn-label {
      font-size: 9px;
      font-weight: 800;
      margin-top: 1px;
      color: #e2e8f0;
    }

    /* Floating Bottom Navigation Bar (Thẻ Trên & Thẻ Dưới) */
    .bottom-nav-bar {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(19, 23, 34, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1.5px solid rgba(0, 242, 254, 0.35);
      border-radius: 99px;
      padding: 4px 6px;
      z-index: 40;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.7);
    }

    .nav-arrow-btn {
      height: 36px;
      padding: 0 14px;
      border-radius: 99px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fff;
      font-size: 12.5px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .nav-arrow-btn:active {
      transform: scale(0.92);
      background: linear-gradient(135deg, rgba(0,242,254,0.3) 0%, rgba(59,130,246,0.3) 100%);
      border-color: #00f2fe;
      color: #00f2fe;
    }

    .nav-counter-pill {
      font-size: 11.5px;
      font-weight: 800;
      color: #00f2fe;
      padding: 0 8px;
      white-space: nowrap;
    }

    /* Bottom Info Caption Overlay */
    .slide-bottom-overlay {
      position: absolute;
      left: 0;
      bottom: 58px;
      width: 100%;
      padding: 30px 75px 8px 16px;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.5) 60%, transparent 100%);
      pointer-events: none;
      z-index: 20;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .slide-tag-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .slide-tag {
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      background: rgba(139, 92, 246, 0.35);
      color: #c4b5fd;
      border: 1px solid rgba(139, 92, 246, 0.5);
    }

    .slide-index-tag {
      font-size: 11px;
      color: #00f2fe;
      font-weight: 800;
      background: rgba(0, 242, 254, 0.15);
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid rgba(0, 242, 254, 0.35);
    }

    .slide-caption-title {
      font-size: 16px;
      font-weight: 900;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .slide-caption-trans {
      font-size: 13.5px;
      font-weight: 700;
      color: #6ee7b7;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Floating Heart on Double Tap */
    .floating-heart {
      position: absolute;
      font-size: 76px;
      color: #ff0050;
      pointer-events: none;
      animation: floatUpHeart 0.8s ease-out forwards;
      z-index: 100;
      transform: translate(-50%, -50%);
    }

    @keyframes floatUpHeart {
      0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0.95; }
      50% { transform: translate(-50%, -80%) scale(1.3); opacity: 1; }
      100% { transform: translate(-50%, -130%) scale(1.6); opacity: 0; }
    }

    /* Subtle On-screen Swipe Hint Indicator */
    .swipe-hint-pill {
      position: absolute;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #e2e8f0;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 99px;
      pointer-events: none;
      z-index: 30;
      display: flex;
      align-items: center;
      gap: 6px;
      opacity: 0.85;
      animation: bounceHint 2s infinite ease-in-out;
    }

    @keyframes bounceHint {
      0%, 100% { transform: translate(-50%, 0); }
      50% { transform: translate(-50%, 4px); }
    }

    /* Modals & Drawers */
    .drawer-sheet {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      max-height: 82vh;
      background: #131722;
      border-top: 2px solid var(--primary);
      border-radius: 24px 24px 0 0;
      z-index: 100;
      transform: translateY(100%);
      transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
      display: flex;
      flex-direction: column;
      box-shadow: 0 -10px 50px rgba(0, 0, 0, 0.9);
      padding-bottom: env(safe-area-inset-bottom, 16px);
    }

    .drawer-sheet.active {
      transform: translateY(0);
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      z-index: 120;
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
      max-height: 88vh;
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

    /* Slot Keypad Buttons */
    .slot-keypad {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      margin: 14px 0;
    }

    .slot-btn {
      height: 44px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border);
      color: #fff;
      font-size: 16px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .slot-btn:active {
      transform: scale(0.92);
    }

    .slot-btn.active {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-color: #10b981;
      color: #fff;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
    }

    /* Image Upload & Paste Dropzone in Add Card Modal */
    .add-dropzone {
      border: 2px dashed rgba(0, 242, 254, 0.4);
      background: rgba(0, 242, 254, 0.04);
      border-radius: 14px;
      padding: 16px;
      text-align: center;
      margin-bottom: 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .add-dropzone:active {
      background: rgba(0, 242, 254, 0.12);
      border-color: #00f2fe;
    }

    .preview-img-box {
      width: 100%;
      max-height: 200px;
      position: relative;
      display: none;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      border-radius: 12px;
      overflow: hidden;
      background: #000;
    }

    .preview-img-box img {
      max-width: 100%;
      max-height: 200px;
      object-fit: contain;
    }

    .remove-preview-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.85);
      border: none;
      color: #fff;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Fullscreen Image Zoom */
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

    /* iOS Step Guide */
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
  </style>
</head>
<body>

  <!-- Top Header -->
  <header>
    <div class="brand" id="btnLogoHome">
      <div class="brand-logo">🎵</div>
      <div class="brand-text">
        <h1>TIKTOK FLASHCARD</h1>
        <p id="headerProgressText">672 Thẻ Học IELTS</p>
      </div>
    </div>
    <div class="header-actions">
      <button type="button" id="btnOpenNewCardModal" class="add-card-header-btn" title="Thêm thẻ từ vựng hoặc thẻ ảnh mới">
        <span>➕</span> Thêm Thẻ
      </button>
      <button type="button" id="btnOpenCloudSync" class="icon-btn" title="Đồng bộ Cloud với Mã 1 chữ số (0 - 9)" style="background: rgba(16,185,129,0.2); border-color: #10b981; color: #6ee7b7;">☁️</button>
      <button type="button" id="btnPwaInstall" class="pwa-install-btn" title="Cài đặt App vào Màn hình chính">
        <span>📲</span> Cài App
      </button>
      <button type="button" id="btnOpenSearch" class="icon-btn" title="Tìm kiếm">🔍</button>
      <button type="button" id="btnShuffle" class="icon-btn" title="Trộn ngẫu nhiên">🎲</button>
    </div>
  </header>

  <!-- Sub Toolbar (Filter Pills & Auto-Scroll) -->
  <div class="sub-toolbar">
    <div class="filter-pills-group">
      <button type="button" class="filter-pill active" data-filter="all">📚 Tất cả (<span id="badgeAll">0</span>)</button>
      <button type="button" class="filter-pill" data-filter="due">🔴 Cần ôn (<span id="badgeDue">0</span>)</button>
      <button type="button" class="filter-pill" data-filter="mastered">🟢 Đã thuộc (<span id="badgeMastered">0</span>)</button>
      <button type="button" class="filter-pill" data-filter="image">🖼️ Thẻ ảnh (<span id="badgeImage">0</span>)</button>
    </div>

    <div id="btnAutoScroll" class="autoscroll-pill" title="Tự động phát âm và lướt thẻ">
      <span>⏱️</span>
      <span id="lblAutoScroll">Tự lướt: <b>TẮT</b></span>
    </div>
  </div>

  <!-- Main Fullscreen Swipe Viewport -->
  <main id="mainContainer">
    <div class="tiktok-viewport" id="tiktokViewport">
      
      <!-- Swipe Hint Bubble -->
      <div class="swipe-hint-pill" id="swipeHint">
        <span>↕️ Vuốt lên / xuống hoặc bấm nút Thẻ trên / Thẻ dưới</span>
      </div>

      <!-- Sliding Deck Track (Contains 3 Slides: Prev, Current, Next) -->
      <div class="tiktok-slider-track" id="sliderTrack">
        <!-- Slide 0: Top (Previous) -->
        <div class="tiktok-slide" id="slidePrev"></div>
        
        <!-- Slide 1: Center (Current Active) -->
        <div class="tiktok-slide" id="slideCurrent"></div>
        
        <!-- Slide 2: Bottom (Next) -->
        <div class="tiktok-slide" id="slideNext"></div>
      </div>

      <!-- Floating Action Buttons on Right (Fixed to Viewport) -->
      <div class="tiktok-side-actions">
        <!-- Up Card Button -->
        <div class="side-btn" id="btnSideNavPrev" title="Thẻ Trên / Trước (Phím ↑)">
          <span style="font-size: 20px;">▲</span>
          <span class="side-btn-label">Thẻ trên</span>
        </div>
        <!-- Down Card Button -->
        <div class="side-btn" id="btnSideNavNext" title="Thẻ Dưới / Sau (Phím ↓)">
          <span style="font-size: 20px;">▼</span>
          <span class="side-btn-label">Thẻ dưới</span>
        </div>
        <div class="side-btn" id="btnSideAddCard" title="Thêm Thẻ Mới / Thẻ Ảnh" style="background: linear-gradient(135deg, rgba(255,0,80,0.6) 0%, rgba(0,242,254,0.6) 100%); border-color: #00f2fe;">
          <span style="font-size: 20px;">➕</span>
          <span class="side-btn-label">Thêm thẻ</span>
        </div>
        <div class="side-btn" id="btnSideSpeak" title="Phát âm chuẩn tiếng Anh">
          <span style="font-size: 20px;">🔊</span>
          <span class="side-btn-label">Phát âm</span>
        </div>
        <div class="side-btn" id="btnSideDrawer" title="Xem nghĩa & 10 ví dụ">
          <span style="font-size: 20px;">📖</span>
          <span class="side-btn-label">Ví dụ</span>
        </div>
        <div class="side-btn" id="btnSideMastered" title="Đánh dấu đã nhớ">
          <span style="font-size: 20px;">💚</span>
          <span class="side-btn-label">Đã thuộc</span>
        </div>
        <a href="#" target="_blank" class="side-btn" id="btnSideTiktok" title="Mở video TikTok">
          <span style="font-size: 20px;">🎬</span>
          <span class="side-btn-label">TikTok</span>
        </a>
        <div class="side-btn" id="btnSidePrompt" title="Copy prompt cho AI">
          <span style="font-size: 18px;">📋</span>
          <span class="side-btn-label">Prompt</span>
        </div>
      </div>

      <!-- Floating Bottom Quick Navigation Controls (Thẻ Trên & Thẻ Dưới) -->
      <div class="bottom-nav-bar" id="bottomNavBar">
        <button type="button" class="nav-arrow-btn" id="btnNavPrev" title="Xem thẻ trước (hoặc phím mũi tên Lên ↑)">
          <span style="font-size: 15px;">▲</span>
          <span>Thẻ trên</span>
        </button>
        <div class="nav-counter-pill" id="lblNavCounter">Thẻ 1 / 672</div>
        <button type="button" class="nav-arrow-btn" id="btnNavNext" title="Xem thẻ sau (hoặc phím mũi tên Xuống ↓)">
          <span>Thẻ dưới</span>
          <span style="font-size: 15px;">▼</span>
        </button>
      </div>

    </div>
  </main>

  <!-- Examples Drawer -->
  <div class="drawer-sheet" id="examplesDrawer">
    <div class="modal-header">
      <div class="modal-title" id="drawerTitle">📖 Chi tiết từ vựng & Ví dụ</div>
      <button type="button" class="icon-btn" id="btnCloseDrawer">✕</button>
    </div>
    <div class="modal-body" id="drawerContent"></div>
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

  <!-- Modal: Add New Flashcard / Photo Card -->
  <div class="modal-overlay" id="newCardModal">
    <div class="modal-sheet">
      <div class="modal-header">
        <div class="modal-title" style="color: #00f2fe; display: flex; align-items: center; gap: 8px;">
          ➕ THÊM THẺ FLASHCARD / THẺ ẢNH MỚI
        </div>
        <button type="button" class="icon-btn" id="btnCloseNewCardModal">✕</button>
      </div>
      <div class="modal-body">
        
        <!-- Image Upload & Preview Section -->
        <input type="file" id="inpAddCardFile" accept="image/*" style="display: none;" />
        <input type="hidden" id="newCardImgBase64" value="" />

        <div class="preview-img-box" id="previewImgBox">
          <img id="previewImgEl" src="" alt="Preview" />
          <button type="button" class="remove-preview-btn" id="btnRemovePreview" title="Xóa ảnh">✕</button>
        </div>

        <div class="add-dropzone" id="addImgDropzone">
          <span style="font-size: 30px;">🖼️</span>
          <div style="font-size: 13px; font-weight: 800; color: #00f2fe;">Chạm để Tải ảnh / Chụp ảnh hoặc Dán ảnh (Ctrl+V)</div>
          <div style="font-size: 11px; color: var(--text-muted);">Hỗ trợ ảnh chụp màn hình, ảnh từ thư viện, camera hoặc clipboard</div>
          <div style="display: flex; gap: 8px; margin-top: 6px;">
            <button type="button" class="pwa-install-btn" id="btnTriggerUpload" style="background: rgba(0,242,254,0.2); border: 1px solid #00f2fe; color: #00f2fe;">📁 Chọn ảnh</button>
            <button type="button" class="pwa-install-btn" id="btnTriggerPaste" style="background: rgba(255,0,80,0.2); border: 1px solid #ff0050; color: #ff0050;">📋 Dán từ Clipboard</button>
          </div>
        </div>

        <!-- Input Fields -->
        <div style="margin-bottom: 10px;">
          <label style="font-size: 11.5px; font-weight: 700; color: #94a3b8; display: block; margin-bottom: 4px;">Từ Tiếng Anh / Tên Thẻ *</label>
          <input type="text" id="newCardWord" placeholder="Ví dụ: resilient, consequence (hoặc để trống nếu là ảnh)" style="width: 100%; height: 42px; background: rgba(255,255,255,0.06); border: 1px solid var(--border); border-radius: 10px; color: #fff; padding: 0 12px; font-size: 14px; font-weight: 700; outline: none;" />
        </div>

        <div style="margin-bottom: 10px;">
          <label style="font-size: 11.5px; font-weight: 700; color: #94a3b8; display: block; margin-bottom: 4px;">Dịch Nghĩa Tiếng Việt</label>
          <input type="text" id="newCardTrans" placeholder="Ví dụ: kiên cường, hậu quả..." style="width: 100%; height: 42px; background: rgba(255,255,255,0.06); border: 1px solid var(--border); border-radius: 10px; color: #6ee7b7; padding: 0 12px; font-size: 13.5px; font-weight: 600; outline: none;" />
        </div>

        <div style="margin-bottom: 10px;">
          <label style="font-size: 11.5px; font-weight: 700; color: #94a3b8; display: block; margin-bottom: 4px;">Ví Dụ & Ghi Chú (Speaking / Writing / Ngữ Cảnh)</label>
          <textarea id="newCardNotes" placeholder="Nhập câu ví dụ hoặc phân tích..." rows="3" style="width: 100%; background: rgba(255,255,255,0.06); border: 1px solid var(--border); border-radius: 10px; color: #cbd5e1; padding: 10px 12px; font-size: 13px; outline: none; resize: vertical;"></textarea>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="font-size: 11.5px; font-weight: 700; color: #94a3b8; display: block; margin-bottom: 4px;">Link Video TikTok (Tùy chọn)</label>
          <input type="url" id="newCardTiktokUrl" placeholder="https://www.tiktok.com/..." style="width: 100%; height: 38px; background: rgba(255,255,255,0.06); border: 1px solid var(--border); border-radius: 10px; color: #94a3b8; padding: 0 12px; font-size: 12.5px; outline: none;" />
        </div>

        <!-- Submit Buttons -->
        <div style="display: flex; gap: 10px;">
          <button type="button" id="btnSaveNewCard" class="pwa-install-btn" style="flex: 1; height: 44px; font-size: 14px; font-weight: 800; justify-content: center; background: linear-gradient(135deg, #ff0050 0%, #00f2fe 100%);">
            💾 Lưu Thẻ Mới
          </button>
        </div>

      </div>
    </div>
  </div>

  <!-- Cloud Sync Modal (1-Digit Slot: 0 - 9) -->
  <div class="modal-overlay" id="cloudSyncModal">
    <div class="modal-sheet">
      <div class="modal-header">
        <div class="modal-title" style="color: #10b981; display: flex; align-items: center; gap: 8px;">
          ☁️ ĐỒNG BỘ CLOUD (MÃ 1 SỐ)
        </div>
        <button type="button" class="icon-btn" id="btnCloseCloudModal">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 13px; color: #cbd5e1; line-height: 1.5; margin-bottom: 10px;">
          Chọn <b>Mã 1 chữ số (0 - 9)</b> mà bạn đã sao lưu trên máy tính để nạp toàn bộ từ vựng và tiến độ vào điện thoại:
        </p>

        <!-- 10 Slots Selector Grid -->
        <div class="slot-keypad" id="mobileSlotKeypad">
          <button type="button" class="slot-btn" data-slot="0">0</button>
          <button type="button" class="slot-btn active" data-slot="1">1</button>
          <button type="button" class="slot-btn" data-slot="2">2</button>
          <button type="button" class="slot-btn" data-slot="3">3</button>
          <button type="button" class="slot-btn" data-slot="4">4</button>
          <button type="button" class="slot-btn" data-slot="5">5</button>
          <button type="button" class="slot-btn" data-slot="6">6</button>
          <button type="button" class="slot-btn" data-slot="7">7</button>
          <button type="button" class="slot-btn" data-slot="8">8</button>
          <button type="button" class="slot-btn" data-slot="9">9</button>
        </div>

        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 12px 14px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px;">Mã đã chọn: <b id="lblMobileSelectedSlot" style="color: #10b981; font-size: 18px;">[ 1 ]</b></span>
            <span id="lblMobileSlotInfo" style="font-size: 11.5px; color: #94a3b8;">Chạm nút bên dưới để tải</span>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button type="button" id="btnMobileDownloadSlot" class="pwa-install-btn" style="height: 44px; font-size: 13.5px; justify-content: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
            ⬇️ Đồng bộ ngay từ Mã [<span class="mobile-slot-num">1</span>]
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Fullscreen Image Viewer Modal -->
  <div class="img-fullscreen-modal" id="imgFullscreenModal">
    <button type="button" class="img-close-btn" id="btnCloseImgModal">✕</button>
    <img id="fullscreenImg" src="" alt="Zoomed Flashcard" />
  </div>

  <!-- PWA iOS Guide Modal -->
  <div class="modal-overlay" id="iosPwaModal">
    <div class="modal-sheet">
      <div class="modal-header">
        <div class="modal-title">📲 Thêm vào Màn hình chính (iOS)</div>
        <button type="button" class="icon-btn" id="btnCloseIosModal">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 13.5px; color: #94a3b8; margin-bottom: 14px;">Để dùng ứng dụng mượt mà toàn màn hình không thanh địa chỉ:</p>
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
          .then(reg => {
            console.log('[PWA] Service Worker registered:', reg.scope);
            reg.update();
          })
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
          deferredPrompt = null;
        } else {
          const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
          if (isIos) {
            document.getElementById('iosPwaModal').classList.add('active');
          } else {
            alert('Hãy bấm menu 3 chấm trên trình duyệt và chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính" nhé!');
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

    // Check if user has a custom synced dataset in localStorage
    const savedCustomItems = localStorage.getItem('pwa_tk_custom_items');
    if (savedCustomItems) {
      try {
        const parsed = JSON.parse(savedCustomItems);
        if (Array.isArray(parsed) && parsed.length > 0) {
          RAW_ITEMS = parsed;
        }
      } catch (err) {}
    }

    // Local Storage State
    let masteredIds = new Set(JSON.parse(localStorage.getItem('pwa_tk_mastered') || '[]'));
    let dueIds = new Set(JSON.parse(localStorage.getItem('pwa_tk_due') || '[]'));
    let activeFilter = localStorage.getItem('pwa_tk_filter') || 'all';
    let currentIndex = parseInt(localStorage.getItem('pwa_tk_index') || '0', 10);
    let autoScrollInterval = null;
    let autoScrollSeconds = 0; // 0 = off, 3, 5, 7

    function saveState() {
      localStorage.setItem('pwa_tk_mastered', JSON.stringify([...masteredIds]));
      localStorage.setItem('pwa_tk_due', JSON.stringify([...dueIds]));
      localStorage.setItem('pwa_tk_filter', activeFilter);
      localStorage.setItem('pwa_tk_index', currentIndex.toString());
      localStorage.setItem('pwa_tk_custom_items', JSON.stringify(RAW_ITEMS));
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

    // Slide HTML Builder
    function buildSlideContent(item, index, total) {
      if (!item) {
        return '<div class="slide-body"><div style="color: #94a3b8; text-align: center;">Chưa có thẻ nào trong mục này.<br><br><button type="button" class="add-card-header-btn" onclick="openAddCardModal()" style="margin: auto;">➕ Thêm thẻ đầu tiên</button></div></div>';
      }

      let inner = '';
      if (item.imageUrl) {
        inner = \`
          <div class="slide-img-container" data-img="\${item.imageUrl}">
            <img src="\${item.imageUrl}" alt="Flashcard" />
          </div>
        \`;
      } else {
        inner = \`
          <div class="slide-text-container">
            <div class="slide-word-title">\${item.word || '---'}</div>
            <div class="slide-word-trans">\${item.translation || ''}</div>
            <div class="slide-notes-card">\${item.notes || 'Chưa có ghi chú ví dụ.'}</div>
          </div>
        \`;
      }

      const tagText = item.level ? \`Level \${item.level}\` : 'IELTS Mastery';

      return \`
        <div class="slide-body">
          \${inner}
        </div>
        <div class="slide-bottom-overlay">
          <div class="slide-tag-row">
            <span class="slide-tag">\${tagText}</span>
            <span class="slide-index-tag">Thẻ \${index + 1} / \${total}</span>
          </div>
          <div class="slide-caption-title">\${item.word || '🖼️ Thẻ ảnh'}</div>
          <div class="slide-caption-trans">\${item.translation || (item.imageUrl ? 'Chạm ảnh để phóng to toàn màn hình' : '')}</div>
        </div>
      \`;
    }

    // Render 3 Slides (Prev, Current, Next)
    const slidePrev = document.getElementById('slidePrev');
    const slideCurrent = document.getElementById('slideCurrent');
    const slideNext = document.getElementById('slideNext');
    const sliderTrack = document.getElementById('sliderTrack');
    const btnSideMastered = document.getElementById('btnSideMastered');
    const btnSideTiktok = document.getElementById('btnSideTiktok');
    const lblNavCounter = document.getElementById('lblNavCounter');

    function renderDeck() {
      const list = getFilteredList();
      const total = list.length;
      if (total === 0) {
        slideCurrent.innerHTML = buildSlideContent(null, 0, 0);
        slidePrev.innerHTML = '';
        slideNext.innerHTML = '';
        if (lblNavCounter) lblNavCounter.textContent = 'Thẻ 0 / 0';
        return;
      }

      if (currentIndex < 0) currentIndex = 0;
      if (currentIndex >= total) currentIndex = total - 1;

      const prevIdx = (currentIndex - 1 + total) % total;
      const nextIdx = (currentIndex + 1) % total;

      const currentItem = list[currentIndex];
      const prevItem = list[prevIdx];
      const nextItem = list[nextIdx];

      slidePrev.innerHTML = buildSlideContent(prevItem, prevIdx, total);
      slideCurrent.innerHTML = buildSlideContent(currentItem, currentIndex, total);
      slideNext.innerHTML = buildSlideContent(nextItem, nextIdx, total);

      // Positioning 3 slides vertically
      slidePrev.style.transform = 'translateY(-100%)';
      slideCurrent.style.transform = 'translateY(0%)';
      slideNext.style.transform = 'translateY(100%)';
      sliderTrack.style.transform = 'translateY(0px)';

      // Update Nav counter pill
      if (lblNavCounter) lblNavCounter.textContent = \`Thẻ \${currentIndex + 1} / \${total}\`;

      // Side action buttons status
      if (masteredIds.has(currentItem.id)) {
        btnSideMastered.classList.add('active-like');
      } else {
        btnSideMastered.classList.remove('active-like');
      }

      const tkUrl = currentItem.tiktokUrl || (\`https://www.tiktok.com/search?q=\${encodeURIComponent(currentItem.word || '')}\`);
      btnSideTiktok.href = tkUrl;

      // Bind image zoom click
      slideCurrent.querySelectorAll('.slide-img-container').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const src = el.getAttribute('data-img');
          if (src) {
            document.getElementById('fullscreenImg').src = src;
            document.getElementById('imgFullscreenModal').classList.add('active');
          }
        });
      });

      saveState();
    }

    // =========================================================================
    // MANUAL NAVIGATION FUNCTIONS (THẺ TRÊN & THẺ DƯỚI)
    // =========================================================================
    function goToNextCard() {
      const list = getFilteredList();
      if (list.length <= 1 || isAnimating) return;
      isAnimating = true;
      sliderTrack.style.transition = 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)';
      sliderTrack.style.transform = 'translateY(-100%)';
      setTimeout(() => {
        currentIndex = (currentIndex + 1) % list.length;
        renderDeck();
        sliderTrack.style.transition = 'none';
        sliderTrack.style.transform = 'translateY(0px)';
        isAnimating = false;
        if (autoScrollSeconds > 0) speakCurrentWord();
      }, 280);
    }

    function goToPrevCard() {
      const list = getFilteredList();
      if (list.length <= 1 || isAnimating) return;
      isAnimating = true;
      sliderTrack.style.transition = 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)';
      sliderTrack.style.transform = 'translateY(100%)';
      setTimeout(() => {
        currentIndex = (currentIndex - 1 + list.length) % list.length;
        renderDeck();
        sliderTrack.style.transition = 'none';
        sliderTrack.style.transform = 'translateY(0px)';
        isAnimating = false;
      }, 280);
    }

    // =========================================================================
    // UNIFIED POINTER & TOUCH GESTURE ENGINE (WORKS ON ALL MOBILES & COMPUTERS)
    // =========================================================================
    const viewport = document.getElementById('tiktokViewport');
    let isPointerDown = false;
    let startY = 0;
    let currentY = 0;
    let startTime = 0;
    let isAnimating = false;
    let lastTapTime = 0;

    function handleStart(y) {
      if (isAnimating) return;
      isPointerDown = true;
      startY = y;
      currentY = y;
      startTime = Date.now();
      sliderTrack.style.transition = 'none';
    }

    function handleMove(y) {
      if (!isPointerDown || isAnimating) return;
      currentY = y;
      const deltaY = currentY - startY;
      sliderTrack.style.transform = \`translateY(\${deltaY}px)\`;
    }

    function handleEnd() {
      if (!isPointerDown || isAnimating) return;
      isPointerDown = false;

      const deltaY = currentY - startY;
      const duration = Date.now() - startTime;
      const threshold = Math.max(window.innerHeight * 0.12, 40);
      const velocity = Math.abs(deltaY) / (duration || 1);

      const list = getFilteredList();
      if (list.length <= 1) {
        sliderTrack.style.transition = 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)';
        sliderTrack.style.transform = 'translateY(0px)';
        return;
      }

      // Check double tap
      const now = Date.now();
      if (now - lastTapTime < 280 && Math.abs(deltaY) < 12) {
        toggleMastered();
      }
      lastTapTime = now;

      if (deltaY < -threshold || (deltaY < -25 && velocity > 0.35)) {
        goToNextCard();
      } else if (deltaY > threshold || (deltaY > 25 && velocity > 0.35)) {
        goToPrevCard();
      } else {
        // Bounce back
        sliderTrack.style.transition = 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)';
        sliderTrack.style.transform = 'translateY(0px)';
      }
    }

    // Pointer Events
    viewport.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.side-btn') || e.target.closest('.bottom-nav-bar') || e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return;
      handleStart(e.clientY);
      try { viewport.setPointerCapture(e.pointerId); } catch(err) {}
    });

    viewport.addEventListener('pointermove', (e) => {
      handleMove(e.clientY);
    });

    viewport.addEventListener('pointerup', (e) => {
      try { viewport.releasePointerCapture(e.pointerId); } catch(err) {}
      handleEnd();
    });

    viewport.addEventListener('pointercancel', (e) => {
      try { viewport.releasePointerCapture(e.pointerId); } catch(err) {}
      handleEnd();
    });

    // Touch Event Fallbacks
    viewport.addEventListener('touchstart', (e) => {
      if (e.target.closest('.side-btn') || e.target.closest('.bottom-nav-bar') || e.target.closest('button') || e.target.closest('a')) return;
      handleStart(e.touches[0].clientY);
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) handleMove(e.touches[0].clientY);
    }, { passive: true });

    viewport.addEventListener('touchend', handleEnd);
    viewport.addEventListener('touchcancel', handleEnd);

    // Mouse Wheel Scroll
    let wheelDebounce = false;
    viewport.addEventListener('wheel', (e) => {
      if (wheelDebounce || isAnimating) return;
      if (Math.abs(e.deltaY) > 20) {
        wheelDebounce = true;
        if (e.deltaY > 0) {
          goToNextCard();
        } else {
          goToPrevCard();
        }
        setTimeout(() => { wheelDebounce = false; }, 350);
      }
    }, { passive: true });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (document.getElementById('searchModal').classList.contains('active') ||
          document.getElementById('cloudSyncModal').classList.contains('active') ||
          document.getElementById('newCardModal').classList.contains('active')) return;
      
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'j') {
        goToNextCard();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'k') {
        goToPrevCard();
      } else if (e.key === 's' || e.key === 'S') {
        speakCurrentWord();
      }
    });

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
      heart.style.left = (x || window.innerWidth / 2) + 'px';
      heart.style.top = (y || window.innerHeight / 2) + 'px';
      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 800);
    }

    // Toggle Mastered
    function toggleMastered() {
      const list = getFilteredList();
      const item = list[currentIndex];
      if (!item || !item.id) return;

      if (masteredIds.has(item.id)) {
        masteredIds.delete(item.id);
      } else {
        masteredIds.add(item.id);
        dueIds.delete(item.id);
        triggerHeartAnim(window.innerWidth / 2, window.innerHeight / 2);
      }
      updateBadges();
      renderDeck();
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
          goToNextCard();
          speakCurrentWord();
        }, autoScrollSeconds * 1000);
      }
    }

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
        <div style="font-size: 20px; font-weight: 800; color: #6ee7b7; margin-bottom: 12px;">\${item.translation || ''}</div>
        <div style="font-size: 14.5px; line-height: 1.7; color: #e2e8f0; white-space: pre-wrap; background: rgba(255,255,255,0.04); padding: 14px; border-radius: 12px; border: 1px solid var(--border);">\${item.notes || 'Chưa có ghi chú ví dụ.'}</div>
        <div style="margin-top: 16px; display: flex; gap: 10px;">
          <button type="button" class="pwa-install-btn" id="btnDrawerSpeak" style="flex: 1; height: 42px; font-size: 13px; justify-content: center;">🔊 Phát âm từ này</button>
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

    // Zoom Image Modal Close
    document.getElementById('btnCloseImgModal').addEventListener('click', () => {
      document.getElementById('imgFullscreenModal').classList.remove('active');
    });

    // =========================================================================
    // ADD NEW FLASHCARD / PHOTO CARD MODAL LOGIC
    // =========================================================================
    const newCardModal = document.getElementById('newCardModal');
    const inpAddCardFile = document.getElementById('inpAddCardFile');
    const newCardImgBase64 = document.getElementById('newCardImgBase64');
    const previewImgBox = document.getElementById('previewImgBox');
    const previewImgEl = document.getElementById('previewImgEl');
    const btnRemovePreview = document.getElementById('btnRemovePreview');
    const newCardWord = document.getElementById('newCardWord');
    const newCardTrans = document.getElementById('newCardTrans');
    const newCardNotes = document.getElementById('newCardNotes');
    const newCardTiktokUrl = document.getElementById('newCardTiktokUrl');
    const btnSaveNewCard = document.getElementById('btnSaveNewCard');

    function openAddCardModal(preloadedImg = null) {
      newCardWord.value = '';
      newCardTrans.value = '';
      newCardNotes.value = '';
      newCardTiktokUrl.value = '';
      
      if (preloadedImg) {
        newCardImgBase64.value = preloadedImg;
        previewImgEl.src = preloadedImg;
        previewImgBox.style.display = 'flex';
        newCardWord.placeholder = \`🖼️ Thẻ ảnh #\${RAW_ITEMS.length + 1}\`;
      } else {
        newCardImgBase64.value = '';
        previewImgBox.style.display = 'none';
        newCardWord.placeholder = 'Ví dụ: resilient, consequence...';
      }

      newCardModal.classList.add('active');
      setTimeout(() => newCardWord.focus(), 150);
    }

    window.openAddCardModal = openAddCardModal;

    document.getElementById('btnOpenNewCardModal').addEventListener('click', () => openAddCardModal());
    document.getElementById('btnSideAddCard').addEventListener('click', () => openAddCardModal());
    document.getElementById('btnCloseNewCardModal').addEventListener('click', () => {
      newCardModal.classList.remove('active');
    });

    // Trigger file upload
    document.getElementById('btnTriggerUpload').addEventListener('click', (e) => {
      e.stopPropagation();
      inpAddCardFile.click();
    });

    document.getElementById('addImgDropzone').addEventListener('click', () => {
      inpAddCardFile.click();
    });

    inpAddCardFile.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result;
        newCardImgBase64.value = base64;
        previewImgEl.src = base64;
        previewImgBox.style.display = 'flex';
        if (!newCardWord.value.trim()) {
          newCardWord.value = \`🖼️ Thẻ ảnh #\${RAW_ITEMS.length + 1}\`;
        }
      };
      reader.readAsDataURL(file);
    });

    // Trigger paste from clipboard
    document.getElementById('btnTriggerPaste').addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        if (navigator.clipboard && navigator.clipboard.read) {
          const items = await navigator.clipboard.read();
          for (const item of items) {
            for (const type of item.types) {
              if (type.startsWith('image/')) {
                const blob = await item.getType(type);
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const base64 = ev.target.result;
                  newCardImgBase64.value = base64;
                  previewImgEl.src = base64;
                  previewImgBox.style.display = 'flex';
                  if (!newCardWord.value.trim()) {
                    newCardWord.value = \`🖼️ Thẻ ảnh #\${RAW_ITEMS.length + 1}\`;
                  }
                  alert('✅ Đã dán ảnh từ Clipboard thành công!');
                };
                reader.readAsDataURL(blob);
                return;
              }
            }
          }
          alert('Không tìm thấy hình ảnh nào trong Clipboard. Hãy thử Copy ảnh trước nhé!');
        } else {
          alert('Hãy nhấn Ctrl+V trên bàn phím để dán ảnh!');
        }
      } catch (err) {
        alert('Không thể đọc Clipboard: ' + err.message + '. Bạn có thể nhấn Ctrl+V để dán trực tiếp.');
      }
    });

    // Remove preview image
    btnRemovePreview.addEventListener('click', (e) => {
      e.stopPropagation();
      newCardImgBase64.value = '';
      previewImgBox.style.display = 'none';
      previewImgEl.src = '';
      inpAddCardFile.value = '';
    });

    // Global Paste (Ctrl+V) listener
    window.addEventListener('paste', (e) => {
      if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            const reader = new FileReader();
            reader.onload = (ev) => {
              const base64 = ev.target.result;
              openAddCardModal(base64);
            };
            reader.readAsDataURL(blob);
            break;
          }
        }
      }
    });

    // Save New Card Action
    btnSaveNewCard.addEventListener('click', () => {
      let wordVal = newCardWord.value.trim();
      const transVal = newCardTrans.value.trim();
      const notesVal = newCardNotes.value.trim();
      const tiktokVal = newCardTiktokUrl.value.trim();
      const imgVal = newCardImgBase64.value.trim();

      if (!wordVal && !imgVal) {
        alert('Vui lòng nhập từ tiếng Anh hoặc tải/dán một hình ảnh!');
        return;
      }

      if (!wordVal && imgVal) {
        wordVal = \`🖼️ Thẻ ảnh #\${RAW_ITEMS.length + 1}\`;
      }

      const newId = 'tk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const newCard = {
        id: newId,
        word: wordVal,
        translation: transVal,
        notes: notesVal,
        tiktokUrl: tiktokVal || undefined,
        imageUrl: imgVal || undefined,
        level: 1,
        createdAt: new Date().toISOString()
      };

      // Add to beginning of items
      RAW_ITEMS.unshift(newCard);
      currentIndex = 0;
      saveState();
      updateBadges();
      renderDeck();
      newCardModal.classList.remove('active');
      alert(\`🎉 Đã thêm thành công thẻ "\${wordVal}" vào bộ flashcard!\`);
    });

    // =========================================================================
    // 1-DIGIT CLOUD SYNC LOGIC (0 - 9)
    // =========================================================================
    let mobileActiveSlot = '1';
    const cloudSyncModal = document.getElementById('cloudSyncModal');
    const lblMobileSelectedSlot = document.getElementById('lblMobileSelectedSlot');
    const lblMobileSlotInfo = document.getElementById('lblMobileSlotInfo');
    const btnMobileDownloadSlot = document.getElementById('btnMobileDownloadSlot');

    function updateMobileSlotUI() {
      if (lblMobileSelectedSlot) lblMobileSelectedSlot.textContent = \`[ \${mobileActiveSlot} ]\`;
      document.querySelectorAll('#mobileSlotKeypad .slot-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.slot === mobileActiveSlot);
      });
      document.querySelectorAll('.mobile-slot-num').forEach(el => el.textContent = mobileActiveSlot);
    }

    document.getElementById('btnOpenCloudSync').addEventListener('click', () => {
      updateMobileSlotUI();
      cloudSyncModal.classList.add('active');
    });

    document.getElementById('btnCloseCloudModal').addEventListener('click', () => {
      cloudSyncModal.classList.remove('active');
    });

    document.querySelectorAll('#mobileSlotKeypad .slot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        mobileActiveSlot = btn.dataset.slot || '1';
        updateMobileSlotUI();
      });
    });

    // Download / Restore from Cloud Slot on Mobile
    btnMobileDownloadSlot.addEventListener('click', async () => {
      const origHtml = btnMobileDownloadSlot.innerHTML;
      btnMobileDownloadSlot.disabled = true;
      btnMobileDownloadSlot.innerHTML = '⏳ Đang tải dữ liệu từ Cloud...';

      try {
        const slotUrl = \`./data/slot_\${mobileActiveSlot}.json?t=\${Date.now()}\`;
        const res = await fetch(slotUrl);
        if (!res.ok) {
          throw new Error(\`Mã [\${mobileActiveSlot}] chưa có bản sao lưu trên Cloud (Mã lỗi \${res.status}). Hãy sao lưu từ máy tính trước nhé!\`);
        }
        const data = await res.json();
        const downloadedItems = data.items || [];
        if (downloadedItems.length === 0) {
          alert(\`Mã Cloud [\${mobileActiveSlot}] rỗng (chưa có thẻ nào).\`);
        } else {
          RAW_ITEMS = downloadedItems;
          localStorage.setItem('pwa_tk_custom_items', JSON.stringify(RAW_ITEMS));
          if (Array.isArray(data.masteredIds)) {
            data.masteredIds.forEach(id => masteredIds.add(id));
          }
          if (Array.isArray(data.dueIds)) {
            data.dueIds.forEach(id => dueIds.add(id));
          }
          currentIndex = 0;
          updateBadges();
          renderDeck();
          alert(\`✅ Đồng bộ thành công \${downloadedItems.length} thẻ từ Mã Cloud [\${mobileActiveSlot}]!\`);
          cloudSyncModal.classList.remove('active');
        }
      } catch (err) {
        console.error('Download slot error:', err);
        alert(err.message || 'Không thể kết nối đến máy chủ Cloud.');
      } finally {
        btnMobileDownloadSlot.disabled = false;
        btnMobileDownloadSlot.innerHTML = origHtml;
      }
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
            <div style="font-size: 15px; font-weight: 800; color: #fff;">\${item.word || '🖼️ Thẻ ảnh'}</div>
            <div style="font-size: 12.5px; color: #6ee7b7; margin-top: 2px;">\${item.translation || (item.imageUrl ? 'Thẻ ảnh' : '')}</div>
          </div>
          <div style="font-size: 11px; color: var(--primary); font-weight: bold;">Học ngay ▶</div>
        \`;
        div.addEventListener('click', () => {
          searchModal.classList.remove('active');
          activeFilter = 'all';
          document.querySelectorAll('.filter-pill').forEach(p => p.classList.toggle('active', p.dataset.filter === 'all'));
          const idx = RAW_ITEMS.findIndex(x => x.id === item.id);
          if (idx >= 0) currentIndex = idx;
          renderDeck();
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
        renderDeck();
      });
    });

    // Shuffle Button
    document.getElementById('btnShuffle').addEventListener('click', () => {
      for (let i = RAW_ITEMS.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [RAW_ITEMS[i], RAW_ITEMS[j]] = [RAW_ITEMS[j], RAW_ITEMS[i]];
      }
      currentIndex = 0;
      renderDeck();
      alert('🎲 Đã trộn ngẫu nhiên toàn bộ thẻ!');
    });

    // Close on backdrop click / Escape
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) searchModal.classList.remove('active');
    });

    cloudSyncModal.addEventListener('click', (e) => {
      if (e.target === cloudSyncModal) cloudSyncModal.classList.remove('active');
    });

    newCardModal.addEventListener('click', (e) => {
      if (e.target === newCardModal) newCardModal.classList.remove('active');
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
      if (examplesDrawer.classList.contains('active') && !examplesDrawer.contains(e.target) && !e.target.closest('#btnSideDrawer')) {
        examplesDrawer.classList.remove('active');
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchModal.classList.remove('active');
        cloudSyncModal.classList.remove('active');
        newCardModal.classList.remove('active');
        iosPwaModal.classList.remove('active');
        imgFullscreenModal.classList.remove('active');
        examplesDrawer.classList.remove('active');
      }
    });

    // Navigation Buttons Event Listeners
    document.getElementById('btnNavPrev').addEventListener('click', goToPrevCard);
    document.getElementById('btnNavNext').addEventListener('click', goToNextCard);
    document.getElementById('btnSideNavPrev').addEventListener('click', goToPrevCard);
    document.getElementById('btnSideNavNext').addEventListener('click', goToNextCard);

    // Other Actions
    document.getElementById('btnSideSpeak').addEventListener('click', speakCurrentWord);
    document.getElementById('btnSideDrawer').addEventListener('click', openDrawer);
    document.getElementById('btnSidePrompt').addEventListener('click', copyPromptForAI);
    document.getElementById('btnSideMastered').addEventListener('click', toggleMastered);
    document.getElementById('btnAutoScroll').addEventListener('click', toggleAutoScroll);
    document.getElementById('btnCloseIosModal').addEventListener('click', () => {
      document.getElementById('iosPwaModal').classList.remove('active');
    });

    // Hide swipe hint after 4 seconds
    setTimeout(() => {
      const hint = document.getElementById('swipeHint');
      if (hint) {
        hint.style.transition = 'opacity 0.6s';
        hint.style.opacity = '0';
        setTimeout(() => hint.remove(), 600);
      }
    }, 4000);

    // Initialize
    updateBadges();
    renderDeck();
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
    description: "App Flashcard TikTok học từ vựng IELTS với feed ảnh to rõ, nút Thẻ trên/Thẻ dưới, thêm thẻ mới, phát âm, lướt vuốt cực mượt trên điện thoại",
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
const CACHE_NAME = 'tiktok-flashcard-v8';
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
  if (event.request.url.includes('/data/')) {
    event.respondWith(fetch(event.request));
    return;
  }
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

  // 5. Ensure all 10 default slot files exist in docs/data and data/
  const docsDataDir = path.join(docsDir, 'data');
  const rootDataDir = path.join(rootDir, 'data');
  if (!fs.existsSync(docsDataDir)) fs.mkdirSync(docsDataDir, { recursive: true });
  if (!fs.existsSync(rootDataDir)) fs.mkdirSync(rootDataDir, { recursive: true });

  const itemsList = data.items || [];
  for (let i = 0; i <= 9; i++) {
    const slotPathDocs = path.join(docsDataDir, `slot_${i}.json`);
    const slotPathRoot = path.join(rootDataDir, `slot_${i}.json`);
    if (!fs.existsSync(slotPathDocs)) {
      const initSlot = {
        slot: i.toString(),
        updatedAt: new Date().toISOString(),
        count: itemsList.length,
        items: itemsList,
        masteredIds: [],
        dueIds: []
      };
      const json = JSON.stringify(initSlot, null, 2);
      fs.writeFileSync(slotPathDocs, json, 'utf8');
      fs.writeFileSync(slotPathRoot, json, 'utf8');
    }
  }

  console.log('[SYNC] Successfully generated mobile PWA files at root and docs/');
  return { rootIndex, docsIndex };
}

module.exports = {
  generateMobileHtml,
  writeWebFiles
};
