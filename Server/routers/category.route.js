const express = require('express');
const router = express.Router();
const controller = require('../controllers/category.controller');

// 1. Các route tĩnh (không có biến :id) PHẢI ĐỂ LÊN ĐẦU
router.get('/tree', controller.getCategoryTree);


router.put('/reorder', controller.reorderCategories); 

// 2. Các route có biến số :id để bên dưới
router.delete('/:id', controller.deleteCategory);
router.get('/:id', controller.getCategoryById);
router.put('/:id', controller.updateCategory);
router.post('/', controller.createCategory);

module.exports = router;