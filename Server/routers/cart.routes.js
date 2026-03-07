const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');

router.post('/add', cartController.addToCart);
router.get('/view/:customerId', cartController.viewCart);
router.put('/update', cartController.updateCart);
router.delete('/remove', cartController.removeFromCart);
router.delete('/clear/:customerId', cartController.clearCart); // Link gọi từ Frontend


module.exports = router;