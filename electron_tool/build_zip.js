const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function copyFolderRecursiveSync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  if (fs.lstatSync(source).isDirectory()) {
    const files = fs.readdirSync(source);
    files.forEach((file) => {
      const curSource = path.join(source, file);
      const curTarget = path.join(target, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, curTarget);
      } else {
        fs.copyFileSync(curSource, curTarget);
      }
    });
  }
}

try {
  console.log("=== Bắt đầu đóng gói ứng dụng ===");
  
  // 1. Chạy electron-builder --win dir
  console.log("Chạy electron-builder...");
  execSync("npx electron-builder --win dir", { stdio: 'inherit' });
  
  // 2. Sao chép thư mục data vào dist/win-unpacked/data
  const srcData = path.join(__dirname, 'data');
  const destData = path.join(__dirname, 'dist', 'win-unpacked', 'data');
  
  console.log(`Sao chép thư mục data từ ${srcData} sang ${destData}...`);
  copyFolderRecursiveSync(srcData, destData);
  
  // 3. Nén thư mục dist/win-unpacked thành file ZIP bằng PowerShell
  const zipDest = path.join(__dirname, 'Task_Countdown_Portable.zip');
  if (fs.existsSync(zipDest)) {
    console.log("Xóa file zip cũ...");
    fs.unlinkSync(zipDest);
  }
  
  console.log("Đang nén thư mục thành file ZIP bằng PowerShell...");
  const psCommand = `powershell -Command "Compress-Archive -Path '${path.join(__dirname, 'dist', 'win-unpacked', '*')}' -DestinationPath '${zipDest}' -Force"`;
  execSync(psCommand, { stdio: 'inherit' });
  
  console.log("=== ĐÓNG GÓI THÀNH CÔNG! ===");
  console.log("Sản phẩm: Task_Countdown_Portable.zip");
} catch (err) {
  console.error("Lỗi đóng gói:", err);
  process.exit(1);
}
