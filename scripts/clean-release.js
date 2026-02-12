const fs = require('fs');
const path = require('path');

const releaseDir = path.resolve(__dirname, '../release');

console.log('开始清理 release 目录...');

if (!fs.existsSync(releaseDir)) {
  console.log('Release 目录不存在，跳过清理。');
  process.exit(0);
}

// 查找 .app 文件
function findApp(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory() && item.name.endsWith('.app')) {
      return fullPath;
    }
    if (item.isDirectory()) {
      const found = findApp(fullPath);
      if (found) return found;
    }
  }
  return null;
}

try {
  const appPath = findApp(releaseDir);

  if (!appPath) {
    console.log('未找到 .app 文件，保留所有内容。');
    process.exit(0);
  }

  const appName = path.basename(appPath);
  const targetPath = path.join(releaseDir, appName);

  // 如果 .app 不在 release 根目录，移动它
  if (appPath !== targetPath) {
    console.log(`移动 ${appName} 到 release 根目录...`);
    // 此时目标路径不应该存在，如果存在则先删除
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    }
    fs.renameSync(appPath, targetPath);
  }

  // 删除 release 下除了 appName 以外的所有文件
  const items = fs.readdirSync(releaseDir);
  items.forEach(item => {
    if (item !== appName) {
      const itemPath = path.join(releaseDir, item);
      console.log(`删除 ${item}...`);
      fs.rmSync(itemPath, { recursive: true, force: true });
    }
  });

  console.log('清理完成，release 目录仅保留了 app。');
} catch (error) {
  console.error('清理过程中发生错误:', error);
  process.exit(1);
}
