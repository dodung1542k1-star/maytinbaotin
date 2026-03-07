const CartModel = require('../models/cart.model');

const cartController = {
    addToCart: async (req, res) => {
        try {
            const { CustomerId, ProductId, Quantity } = req.body;
            // Kiểm tra đầu vào
            if (!CustomerId || !ProductId || Quantity === undefined) {
                return res.status(400).json({ success: false, message: 'Thiếu dữ liệu (CustomerId, ProductId hoặc Quantity)' });
            }
            
            // 1. Kiểm tra sản phẩm có hợp lệ (Published & Not Deleted) không
            const product = await CartModel.checkProductBeforeAdding(ProductId);
            if (!product) return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh' });

            // 2. Kiểm tra xem sản phẩm đã có trong giỏ chưa
            const existingItem = await CartModel.getExistingItem(CustomerId, ProductId);
            
            if (existingItem) {
                // Nếu có rồi thì cộng dồn số lượng
                await CartModel.updateItemQuantity(existingItem.Id, existingItem.Quantity + Quantity);
            } else {
                // Nếu chưa có thì thêm mới
                await CartModel.addItem({ CustomerId, ProductId, Quantity });
            }
            
            res.json({ success: true, message: 'Đã thêm vào giỏ hàng' });
        } catch (err) {
            console.error('❌ ADD TO CART ERROR:', err);
            res.status(500).json({ success: false, message: 'Lỗi khi thêm vào giỏ hàng' });
        }
    },

    viewCart: async (req, res) => {
        try {
            const { customerId } = req.params;
            if (!customerId) return res.status(400).json({ success: false, message: 'Thiếu mã khách hàng' });

            const data = await CartModel.getCartByCustomer(customerId);
            res.json(data);
        } catch (err) {
            console.error('❌ VIEW CART ERROR:', err);
            res.status(500).json({ success: false, message: 'Lỗi lấy danh sách giỏ hàng' });
        }
    },

    updateCart: async (req, res) => {
        try {
            const { CustomerId, ProductId, Delta } = req.body;
            if (!CustomerId || !ProductId || Delta === undefined) {
                return res.status(400).json({ success: false, message: 'Thiếu dữ liệu cập nhật' });
            }

            await CartModel.updateQuantity(CustomerId, ProductId, Delta);
            res.json({ success: true, message: 'Cập nhật số lượng thành công' });
        } catch (err) {
            console.error('❌ UPDATE CART ERROR:', err);
            res.status(500).json({ success: false, message: 'Lỗi cập nhật số lượng' });
        }
    },

    removeFromCart: async (req, res) => {
        try {
            const { CustomerId, ProductId } = req.body;
            if (!CustomerId || !ProductId) {
                return res.status(400).json({ success: false, message: 'Thiếu CustomerId hoặc ProductId' });
            }

            await CartModel.removeItem(CustomerId, ProductId);
            res.json({ success: true, message: 'Đã xóa sản phẩm khỏi giỏ' });
        } catch (err) {
            console.error('❌ REMOVE FROM CART ERROR:', err);
            res.status(500).json({ success: false, message: 'Lỗi xóa sản phẩm' });
        }
    },

    clearCart: async (req, res) => {
        try {
            const { customerId } = req.params;
            if (!customerId) return res.status(400).json({ success: false, message: 'Thiếu CustomerId' });

            await CartModel.clearCartByCustomer(customerId);
            res.json({ success: true, message: 'Giỏ hàng đã được dọn sạch' });
        } catch (err) {
            console.error('❌ CLEAR CART ERROR:', err);
            res.status(500).json({ success: false, message: 'Lỗi server khi xóa toàn bộ giỏ hàng' });
        }
    }
};

module.exports = cartController;