const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
  "FILES_ROOT": "../images/uploaded",
  "INTEGRATION": "standalone",

  "DIRLIST": "/elfinder/fileman/dirlist",
  "FILESLIST": "/elfinder/fileman/fileslist",
  "UPLOAD": "/elfinder/fileman/upload",
  "DOWNLOAD": "/elfinder/fileman/download",
  "DOWNLOADDIR": "/elfinder/fileman/downloaddir",
  "DELETEFILE": "/elfinder/fileman/delete",
  "MOVEFILE": "/elfinder/fileman/move",
  "COPYFILE": "/elfinder/fileman/copy",
  "RENAMEFILE": "/elfinder/fileman/rename",
  "CREATEDIR": "/elfinder/fileman/createdir",
  "GENERATETHUMB": "/elfinder/fileman/generatethumb",

  "DEFAULTVIEW": "list",
  "OPEN_LAST_DIR": "yes"
}
);
});


// Mount các route xử lý
router.use('/fileman', require('./routes/fileman'));

module.exports = router;