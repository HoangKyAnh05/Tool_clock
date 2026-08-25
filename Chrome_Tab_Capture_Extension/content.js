// ==========================================
// 1. LẮNG NGHE NÚT CHUỘT SƯỜN TRÊN & PHÍM NUMLOCK
// ==========================================
let lastTriggerTime = 0;

// Lắng nghe phím NumLock
window.addEventListener("keydown", (e) => {
  if (e.code === "NumLock" || e.key === "NumLock" || e.keyCode === 144) {
    const now = Date.now();
    if (now - lastTriggerTime > 800) {
      lastTriggerTime = now;
      triggerCaptureNow();
    }
  }
}, true);

function handleForwardClick(e) {
  // e.button === 4 là nút Go Forward (nút sườn trên)
  if (e.button === 4) {
    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    if (now - lastTriggerTime > 500) {
      lastTriggerTime = now;
      triggerCaptureNow();
    }
  }
}

window.addEventListener("mouseup", handleForwardClick, true);
window.addEventListener("pointerup", handleForwardClick, true);

window.addEventListener("mousedown", (e) => {
  if (e.button === 4) {
    e.preventDefault();
    e.stopPropagation();
  }
}, true);
window.addEventListener("pointerdown", (e) => {
  if (e.button === 4) {
    e.preventDefault();
    e.stopPropagation();
  }
}, true);
window.addEventListener("auxclick", (e) => {
  if (e.button === 4) {
    e.preventDefault();
    e.stopPropagation();
  }
}, true);

// ==========================================
// 2. NÚT BẤM GHIM MÉP TRÊN TAB
// ==========================================
function initTopButton() {
  if (document.getElementById("top-tab-capture-trigger")) return;

  const btn = document.createElement("div");
  btn.id = "top-tab-capture-trigger";
  btn.title = "Chụp full tab & Copy vào Clipboard (Nút chuột sườn trên / Alt + S)";
  btn.innerHTML = `
    <div class="capture-bar-content">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="13" r="4"></circle>
      </svg>
      <span>📸 Chụp tab (Copy)</span>
    </div>
  `;

  btn.addEventListener("click", () => {
    triggerCaptureNow();
  });

  document.body.appendChild(btn);
}

function triggerCaptureNow() {
  const btn = document.getElementById("top-tab-capture-trigger");
  if (btn) {
    btn.classList.add("capturing");
    setTimeout(() => btn.classList.remove("capturing"), 400);
  }

  chrome.runtime.sendMessage({ action: "TRIGGER_CAPTURE" });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTopButton);
} else {
  initTopButton();
}
