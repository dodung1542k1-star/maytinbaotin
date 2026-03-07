const express = require('express');
const router = express.Router();
const multer = require('multer');

const upload = multer(); 

const productController = require('../controllers/product.controller');
const pictureController = require('../controllers/picture.controller');
const categoryController = require('../controllers/category.controller');
const { verifyToken, verifyAdmin } = require('../verifyToken');

// ==========================================
// 1. PHẦN DANH MỤC & TRANG CHỦ (STATIC ROUTES)
// ==========================================
router.get('/categories/tree', productController.getCategoryTree);

router.get('/home/categories-products', categoryController.getHomeData);
// ==========================================
// 3. PHẦN HÌNH ẢNH (PICTURE)
// ==========================================
router.post('/images/upload', upload.single('picture'), pictureController.uploadPictureBinary);
router.get('/api/picture/:id', pictureController.getPictureById);

// ==========================================
// 4. PHẦN SẢN PHẨM & GIẢI MÃ SLUG (IMPORTANT)
// ==========================================

// Route lấy sản phẩm theo ID danh mục (Dùng cho phân trang/lọc)
router.get('/products/category/:id', productController.getProductsByCategory);

// Route lấy sản phẩm theo Slug danh mục (Dùng cho URL thân thiện)
router.get('/products/category/s/:slug', productController.getProductsByCategorySlug);

/**
 * ĐIỂM CHỐT: Giải mã mọi loại Slug (Category hoặc Product)
 * Frontend khi vào một URL lạ sẽ gọi API này để biết render giao diện nào.
 */
router.get('/resolve/:slug', productController.resolveSlug);

// Route lấy chi tiết sản phẩm theo slug (Dùng nếu resolve xác định là product)
router.get('/product-detail/:slug', productController.getProductBySlug);

// 5. ADMIN & TEST
/// seach tìm kiếm sản phẩm 
router.get('/search', productController.searchProducts);

/// kiểm tra xem sản phẩm ở danh mục nào 
router.get('/product', productController.getProducts);

//phần get ra sản phẩm
router.get('/products', productController.getAllProducts);

// Lấy 1 sp để sửa
router.get('/products/:id', productController.getProductById);

// Thêm mới
router.post('/products', upload.array('files'), productController.createProduct);

// Sửa
router.put('/products/:id',upload.array('files'), productController.updateProduct);

// Xóa
router.delete('/products/:id', productController.deleteProduct);

// Route này dùng để lấy TẤT CẢ slug sản phẩm phục vụ Sitemap
router.get('/all-products-sitemap', productController.getAllProductsitemap);

router.get('/admin/test', verifyToken, verifyAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Chào Admin!',
    user: req.user
  });
});

module.exports = router;