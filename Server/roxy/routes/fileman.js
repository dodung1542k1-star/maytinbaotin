const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const sizeOf = require('image-size');
const multer = require('multer');

// Đường dẫn gốc trỏ đến thư mục public/images/
const serverRoot = path.resolve(__dirname, '../../public/images/');

// Đảm bảo thư mục uploaded luôn tồn tại
fs.ensureDirSync(path.join(serverRoot, 'uploaded'));

/* ================================
   1. THƯ MỤC & DANH SÁCH
================================ */

// Lấy danh sách thư mục đệ quy
router.all('/dirlist', (req, res) => {
  const response = [];
  getDirectories('uploaded', response);
  res.json(response);
});

// Lấy danh sách file trong 1 thư mục
router.all('/fileslist', (req, res) => {
  const response = [];
  const dir = req.query.d || req.body.d || 'uploaded';
  const absPath = path.join(serverRoot, dir);

  if (!fs.existsSync(absPath)) return res.json([]);

  try {
    const files = fs.readdirSync(absPath);
    files.forEach(file => {
      const full = path.join(absPath, file);
      const stat = fs.statSync(full);
      
      if (stat.isFile()) {
        let width = 0, height = 0;
        try { 
          const size = sizeOf(full); 
          width = size.width; 
          height = size.height;
        } catch(e) {}
        
        response.push({
          p: path.join(dir, file).replace(/\\/g, '/'),
          s: parseInt(stat.size), // Đảm bảo là số
          t: Math.floor(stat.mtime.getTime() / 1000), // Đảm bảo là số (Quan trọng để fix lỗi dateFormat)
          w: width || 0,
          h: height || 0
        });
      }
    });
    res.json(response);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
});

// Tạo thư mục mới
router.post('/createdir', (req, res) => {
  try {
    const { d, n } = req.body; 
    const targetPath = path.join(serverRoot, d, n);
    fs.ensureDirSync(targetPath);
    res.json({ res: 'ok', msg: 'Success' });
  } catch (err) {
    res.json({ res: 'error', msg: err.message });
  }
});

/* ================================
   2. XÓA & ĐỔI TÊN (ĐÃ SỬA LỖI)
================================ */

// Xóa: Hỗ trợ cả file (f) và thư mục (d)
router.all('/delete', (req, res) => {
  try {
    // RoxyFileman có thể gửi qua GET hoặc POST, và tham số là f hoặc d
    const target = req.query.f || req.body.f || req.query.d || req.body.d;
    
    if (!target) return res.json({ res: 'error', msg: 'No path provided' });

    const absPath = path.join(serverRoot, target);

    // Bảo vệ không cho xóa thư mục gốc
    if (absPath === path.join(serverRoot, 'uploaded')) {
      return res.json({ res: 'error', msg: 'Cannot delete root directory' });
    }

    if (fs.existsSync(absPath)) {
      fs.removeSync(absPath); // Xóa sạch file hoặc folder
      res.json({ res: 'ok' });
    } else {
      res.json({ res: 'error', msg: 'File or directory not found' });
    }
  } catch (err) {
    res.json({ res: 'error', msg: err.message });
  }
});

// Đổi tên: Hỗ trợ cả file và thư mục
router.all('/rename', (req, res) => {
  try {
    const oldTarget = req.query.f || req.body.f || req.query.d || req.body.d;
    const newName = req.query.n || req.body.n;
    
    if (!oldTarget || !newName) return res.json({ res: 'error', msg: 'Invalid data' });

    const oldPath = path.join(serverRoot, oldTarget);
    const parentDir = path.dirname(oldTarget);
    const newPath = path.join(serverRoot, parentDir, newName);

    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      res.json({ res: 'ok' });
    } else {
      res.json({ res: 'error', msg: 'Source not found' });
    }
  } catch (err) {
    res.json({ res: 'error', msg: err.message });
  }
});

/* ================================
   3. UPLOAD & THUMBNAIL
================================ */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(serverRoot, req.body.d || 'uploaded');
    fs.ensureDirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage }).array('files[]');

router.post('/upload', (req, res) => {
  upload(req, res, err => {
    if (err) return res.json({ res: 'error', msg: err });
    res.json({ res: 'ok' });
  });
});

router.get('/generatethumb', (req, res) => {
  const file = req.query.f;
  if (!file) return res.status(404).send();
  const filePath = path.join(serverRoot, file);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Not found');
  }
});

// Download file (nút Download trong Roxy)
router.get('/download', (req, res) => {
  const file = req.query.f;
  if (!file) return res.status(404).send('No file specified');
  
  const filePath = path.join(serverRoot, file);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.download(filePath); // Tự động gửi header download
  } else {
    res.status(404).send('File not found');
  }
});
/* ================================
   HELPER
================================ */
function getDirectories(dir, result) {
  const absPath = path.join(serverRoot, dir);
  if(!fs.existsSync(absPath)) return;
  
  const info = { p: dir.replace(/\\/g, '/'), f: 0, d: 0 };
  result.push(info);

  try {
    const items = fs.readdirSync(absPath);
    items.forEach(item => {
      const fullPath = path.join(absPath, item);
      if (fs.statSync(fullPath).isDirectory()) {
        info.d++;
        getDirectories(path.join(dir, item), result);
      } else {
        info.f++;
      }
    });
  } catch (e) {}
}

module.exports = router;