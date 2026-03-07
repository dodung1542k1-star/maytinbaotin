const express = require('express');
const router = express.Router();
const controller = require('../controllers/order.controller');

// --- 1. NHÓM ROUTE THANH TOÁN & WEBHOOK (Ưu tiên) ---
// Frontend gọi: /api/orders (để tạo đơn)
router.post('/', controller.createOrder); 

// Frontend gọi: /api/orders/create (để lấy link PayOS)
router.post("/create", controller.createPayment);

// Link cho PayOS gọi: /api/orders/webhook
router.post("/webhook", controller.handleWebhook);


// --- 2. NHÓM ROUTE TĨNH CHO ADMIN ---
router.get('/dashboard-stats', controller.getDashboardStats);
router.get('/summary', controller.getOrderSummary);
router.get('/list', controller.getOrders); // Đổi '/' thành '/list' để tránh trùng với tạo đơn


// --- 3. NHÓM ROUTE THEO ID ---
router.put('/:id/status', controller.updateOrderStatus);
router.put('/:id/totals', controller.updateOrderTotals);
router.get('/:id', controller.getOrderDetail);
router.put('/:id', controller.updateOrder);
router.delete('/:id', controller.deleteOrder);

module.exports = router;