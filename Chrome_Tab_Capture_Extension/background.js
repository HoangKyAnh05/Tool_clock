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
async function captureAndCopy(targetTab) {
  let tab = targetTab;
  if (!tab || !tab.id) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    tab = tabs[0];
  }
  if (!tab || !tab.id) return;

  try {
    // 1. Tạm ẩn tất cả nút bấm và overlay của extension để chụp ảnh gốc nguyên bản 100%
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        document.documentElement.setAttribute("data-tab-capturing", "true");
      }
    }).catch(() => {});

    // Chờ 40ms để trình duyệt vẽ lại giao diện hoàn toàn không có lớp mờ hay nút bấm
    await new Promise((resolve) => setTimeout(resolve, 40));

    // 2. Chụp toàn bộ viewport tab đang active với màu gốc, độ phân giải gốc
    const captureTabSafe = (windowId, retries = 5) => {
      chrome.tabs.captureVisibleTab(windowId, { format: "png" }, async (dataUrl) => {
        // 3. Khôi phục lại giao diện & tạo hiệu ứng flash báo hiệu SAU KHI chụp
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            document.documentElement.removeAttribute("data-tab-capturing");

            let flash = document.getElementById("tab-capture-flash-overlay");
            if (!flash) {
              flash = document.createElement("div");
              flash.id = "tab-capture-flash-overlay";
              document.body.appendChild(flash);
            }
            flash.classList.remove("active");
            void flash.offsetWidth; // Trigger reflow
            flash.classList.add("active");
            setTimeout(() => { flash.classList.remove("active"); }, 200);
          }
        }).catch(() => {});

        if (chrome.runtime.lastError || !dataUrl) {
          const errMsg = chrome.runtime.lastError ? chrome.runtime.lastError.message : "No data";
          if (retries > 0 && errMsg.includes("MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND")) {
            setTimeout(() => captureTabSafe(windowId, retries - 1), 700);
            return;
          }
          console.error("Lỗi khi chụp tab:", chrome.runtime.lastError);
          return;
        }

        // 4. Tự động lưu file ảnh về máy
        const now = new Date();
        const timeStr = `${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
        const sanitizedTitle = (tab.title || "tab").replace(/[\\/:*?"<>|]/g, "_").substring(0, 30);
        const filename = `Capture_${sanitizedTitle}_${timeStr}.png`;

        chrome.downloads.download({
          url: dataUrl,
          filename: filename,
          saveAs: false
        });

        // 5. Tự động ghi ảnh vào Clipboard của tab đó
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
                  toast.innerHTML = `✅ <b>ĐÃ CHỤP & COPY FULL TAB!</b><br><span style="font-size:11.5px;color:#cbd5e1">Bấm <b>Ctrl + V</b> để dán ảnh gốc</span>`;
                  toast.className = "show";
                  setTimeout(() => { toast.className = ""; }, 3500);
                });
              })
              .catch((err) => console.error("Lỗi clipboard:", err));
          },
          args: [dataUrl]
        }).catch((e) => console.error("Lỗi inject script copy:", e));
      });
    };

    captureTabSafe(tab.windowId || null);
  } catch (err) {
    console.error("Lỗi trong captureAndCopy:", err);
  }
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
