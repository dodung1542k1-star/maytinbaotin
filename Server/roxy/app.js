// File: roxy/app.js (hoặc file chứa router.get('/conf'...) )
const express = require('express');
const router = express.Router();

// CẤU HÌNH QUAN TRỌNG
router.get(['/conf.json', '/conf'], (req, res) => {
  res.json({
    // 1. Đường dẫn thư mục vật lý (để server xử lý file)
    // Lưu ý: Tùy logic trong controller của bạn xử lý đường dẫn này thế nào.
    // Thường nên để đường dẫn tương đối từ root project hoặc tuyệt đối.
    FILES_ROOT: "public/images", 
    
    // 2. Đường dẫn hiển thị trên trình duyệt (QUAN TRỌNG ĐỂ SỬA LỖI 404)
    // Phải khớp với route app.use('/images', ...) bên server.js
    RETURN_URL_PREFIX: "/images/", 
    
    INTEGRATION: "custom", // Đổi thành custom để dễ xử lý JS hơn

    // Các API endpoints
    DIRLIST: "/elfinder/fileman/dirlist",
    FILESLIST: "/elfinder/fileman/fileslist",
    UPLOAD: "/elfinder/fileman/upload",
    DOWNLOAD: "/elfinder/fileman/download",
    DOWNLOADDIR: "/elfinder/fileman/downloaddir",
    DELETEFILE: "/elfinder/fileman/delete",
    DELETEDIR: "/elfinder/fileman/delete",
    MOVEFILE: "/elfinder/fileman/move",
    COPYFILE: "/elfinder/fileman/copy",
    RENAMEFILE: "/elfinder/fileman/rename",
    RENAMEDIR: "/elfinder/fileman/rename",
    CREATEDIR: "/elfinder/fileman/createdir",
    GENERATETHUMB: "/elfinder/fileman/generatethumb",

    DEFAULTVIEW: "list",
    OPEN_LAST_DIR: "yes"
  });
});

// ... mount fileman routes ...
router.use('/fileman', require('./routes/fileman'));

module.exports = router;