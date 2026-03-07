const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');

// ==========================================
// 2. PHẦN BÀI VIẾT (POST)
// ==========================================

// --- NHÓM 1: CÁC ROUTE TĨNH (Phải đặt lên đầu để không bị nhầm với :id) ---

// Lấy bài viết mới nhất
router.get('/posts/latest', postController.getLatestPosts);

// Danh mục tin tức (News Categories)
router.get('/new', postController.getNewsCategories);
router.post('/new', postController.createNewsCategory);

// Bài viết (Posts)
router.get('/new/all', postController.getAllPosts); // Đã đưa lên trên :id, hết lỗi "Không tìm thấy danh mục"
router.post('/new/create', postController.createPostInfo);
router.delete('/new/delete', postController.deleteNew);

// Tổng hợp dữ liệu trang chủ (All categories with posts)
router.get('/all-categories-posts', postController.getAllDataHome);

// --- NHÓM 2: CÁC ROUTE THEO SLUG (SEO) ---

router.get('/resolve/:slug', postController.resolveSlug);
router.get('/all-categories-posts/:slug', postController.getPostsByCategory);
router.get('/post/:slug', postController.getPostBySlug);

// --- NHÓM 3: CÁC ROUTE CÓ THAM SỐ ID (Phải đặt dưới cùng) ---

// Thao tác với Danh mục theo ID
router.get('/new/:id', postController.getNewsCategoryById); 
router.put('/new/:id', postController.updateNewsCategory);
router.delete('/new/:id', postController.deleteNewsCategory);

// Thao tác với Bài viết theo ID
// LƯU Ý: Đổi đường dẫn để tránh trùng với /new/:id của danh mục bên trên
router.get('/new/post-detail/:id', postController.getPostById); 
router.put('/new/update/:id', postController.updatePostInfo);

// Route SEO bài viết mới nhất theo ID
router.get('/api/postnew/:id', postController.getPostByIdNew);

// --- NHÓM 4: KHÁC ---
router.post('/sync-comment', postController.syncComments);

module.exports = router;