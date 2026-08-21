// Chuyển DataURL thành Blob PNG nhanh và chuẩn xác
function dataUrlToBlob(dataUrl) {
  const byteString = atob(dataUrl.split(',')[1]);
  const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target === "offscreen" && message.type === "copy-image-to-clipboard") {
    try {
      const blob = dataUrlToBlob(message.dataUrl);
      navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ]).then(() => {
        sendResponse({ success: true });
      }).catch((err) => {
        console.error("Offscreen write error:", err);
        sendResponse({ success: false, error: err.toString() });
      });
    } catch (e) {
      console.error("Offscreen error:", e);
      sendResponse({ success: false, error: e.toString() });
    }
    return true;
  }
});
