const fs = require('fs');
const path = require('path');

const IMAGE_ROOT = path.join(__dirname, '../public/images');
const imageMap = new Map();

function scanDir(dir) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else {
      imageMap.set(item, fullPath);
    }
  }
}

// quét khi server start
scanDir(IMAGE_ROOT);

module.exports = imageMap;
