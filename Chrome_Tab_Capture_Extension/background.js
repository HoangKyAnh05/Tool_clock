// Tự động nạp script vào tất cả các tab đang mở trên trình duyệt
function injectIntoAllTabs() {
  chrome.tabs.query({ url: ["http://*/*", "https://*/*", "file://*/*"] }, (tabs) => {
    for (const tab of tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      }).catch(() => {});

      chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["style.css"]
      }).catch(() => {});
    }
  });
}

// Khi cài đặt hoặc reload extension -> nạp ngay vào mọi tab
chrome.runtime.onInstalled.addListener(() => {
  injectIntoAllTabs();
});

// Chạy ngay khi service worker khởi động
injectIntoAllTabs();

// Hàm xử lý chụp tab hiện tại
function captureAndCopy(targetTab) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = targetTab || tabs[0];
    if (!tab || !tab.id) return;

    // Chụp toàn bộ viewport của tab đang active
    chrome.tabs.captureVisibleTab(tab.windowId || null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        console.error("Lỗi khi chụp tab:", chrome.runtime.lastError);
        return;
      }

      // 1. Tự động lưu file ảnh về máy
      const now = new Date();
      const timeStr = `${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
      const sanitizedTitle = (tab.title || "tab").replace(/[\\/:*?"<>|]/g, "_").substring(0, 30);
      const filename = `Capture_${sanitizedTitle}_${timeStr}.png`;

      chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: false
      });

      // 2. Tự động ghi ảnh vào Clipboard của tab đó
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (base64Image) => {
          fetch(base64Image)
            .then((r) => r.blob())
            .then((blob) => {
              const item = new ClipboardItem({ "image/png": blob });
              navigator.clipboard.write([item]).then(() => {
                let toast = document.getElementById("capture-toast-notify");
                if (!toast) {
                  toast = document.createElement("div");
                  toast.id = "capture-toast-notify";
                  document.body.appendChild(toast);
                }
                toast.innerHTML = `✅ <b>ĐÃ CHỤP & COPY FULL TAB!</b><br><span style="font-size:11.5px;color:#cbd5e1">Bấm <b>Ctrl + V</b> để dán ảnh</span>`;
                toast.className = "show";
                setTimeout(() => { toast.className = ""; }, 3500);
              });
            })
            .catch((err) => console.error("Lỗi clipboard:", err));
        },
        args: [dataUrl]
      }).catch((e) => console.error("Lỗi inject script copy:", e));
    });
  });
}

// 1. Click icon extension trên thanh công cụ
chrome.action.onClicked.addListener((tab) => {
  captureAndCopy(tab);
});

// 2. Bấm phím tắt Alt + S
chrome.commands.onCommand.addListener((cmd) => {
  if (cmd === "capture-tab") {
    captureAndCopy();
  }
});

// 3. Bấm nút chuột sườn trên (Forward) hoặc nút ghim đỉnh
chrome.runtime.onMessage.addListener((req, sender) => {
  if (req.action === "TRIGGER_CAPTURE") {
    captureAndCopy(sender?.tab);
  }
});
