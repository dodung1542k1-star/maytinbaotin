const express = require('express');
const router = express.Router();
const warrantyController = require('../controllers/warranty.controller');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/search', warrantyController.searchWarranty);
router.get('/all', warrantyController.getAllWarranty); // Endpoint này cực kỳ quan trọng
router.post('/add', warrantyController.createWarranty);
router.put('/update/:id', warrantyController.updateWarranty);
router.delete('/delete/:id', warrantyController.deleteWarranty);
router.post('/import-excel', upload.single('file'), warrantyController.importExcel);

module.exports = router;