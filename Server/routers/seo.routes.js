const express = require('express');
const router = express.Router();
const { seoController, footerController } = require('../controllers/seo.controller');

// --- CÁC ROUTE CHO SEO ---
router.get('/admin/seo-settings', seoController.getSeoSettings);
router.post('/admin/seo-settings', seoController.saveSeoSettings);
router.get('/public/home-seo', seoController.getSeoSettings);

// --- ROUTE CHO FOOTER (TOPIC) ---
router.get('/public/menu-footer', footerController.getFooterMenu); // Lấy danh sách cho bảng Home

// Lấy chi tiết 1 bài viết để hiện lên Form (khi sửa)
router.get('/topic/:id', footerController.getTopicDetail); 

// API cho nút Lưu (Sửa bài viết cũ)
router.post('/update-topic', footerController.updateTopic); 

// API cho nút Lưu (Thêm bài viết mới)
router.post('/create-topic', footerController.createTopic); 

router.get('/topic-by-slug/:slug', footerController.getTopicBySlug);

router.delete('/topic/:id', footerController.deleteTopic);

module.exports = router;