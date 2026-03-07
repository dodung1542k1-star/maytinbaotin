const { pool } = require('../config'); // Sử dụng pool từ cấu hình mysql2/promise
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DOMAIN = process.env.DOMAIN;

const CartModel = {
    // 1. Kiểm tra sản phẩm trước khi thêm
    checkProductBeforeAdding: async (productId) => {
        const [rows] = await pool.execute(
            `SELECT Id, Price, Published, Deleted FROM product 
             WHERE Id = ? AND Published = 1 AND Deleted = 0`,
            [productId]
        );
        return rows[0];
    },

    // 2. Lấy item đã tồn tại trong giỏ
    getExistingItem: async (customerId, productId) => {
        const [rows] = await pool.execute(
            `SELECT Id, Quantity FROM shoppingcartitem 
             WHERE CustomerId = ? AND ProductId = ? AND ShoppingCartTypeId = 1`,
            [customerId, productId]
        );
        return rows[0];
    },

    // 3. Thêm mới sản phẩm vào giỏ
    addItem: async ({ CustomerId, ProductId, Quantity }) => {
        // MySQL sử dụng UTC_TIMESTAMP() hoặc truyền giá trị từ JS
        await pool.execute(
            `INSERT INTO shoppingcartitem (CustomerId, ProductId, StoreId, ShoppingCartTypeId, Quantity, CustomerEnteredPrice, CreatedOnUtc, UpdatedOnUtc)
             VALUES (?, ?, 1, 1, ?, 0, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
            [CustomerId, ProductId, Quantity]
        );
    },

    // 4. Cập nhật số lượng dựa trên Item ID
    updateItemQuantity: async (itemId, newQuantity) => {
        await pool.execute(
            `UPDATE shoppingcartitem SET Quantity = ?, UpdatedOnUtc = UTC_TIMESTAMP() WHERE Id = ?`,
            [newQuantity, itemId]
        );
    },

    // 5. Lấy toàn bộ giỏ hàng kèm ảnh (MySQL không có OUTER APPLY, dùng Subquery)
    getCartByCustomer: async (customerId) => {
        const query = `
            SELECT sci.ProductId, p.Name AS ProductName, p.Price, sci.Quantity,
            (
                SELECT pic.Id FROM product_picture_mapping ppm
                JOIN picture pic ON pic.Id = ppm.PictureId
                WHERE ppm.ProductId = p.Id 
                ORDER BY ppm.DisplayOrder ASC 
                LIMIT 1
            ) AS PictureId
            FROM shoppingcartitem sci
            JOIN product p ON p.Id = sci.ProductId
            WHERE sci.CustomerId = ? AND sci.ShoppingCartTypeId = 1
        `;

        const [rows] = await pool.execute(query, [customerId]);

        return rows.map(item => {
            let imageUrl = `${DOMAIN}/images/default.jpg`;
            if (item.PictureId) {
                const paddedId = item.PictureId.toString().padStart(7, '0');
                const imageDir = path.join(__dirname, '..', 'public', 'images');
                const extensions = ['jpg', 'jpeg', 'png', 'webp'];
                let found = null;
                for (const ext of extensions) {
                    if (fs.existsSync(path.join(imageDir, `${paddedId}_0.${ext}`))) {
                        found = ext;
                        break;
                    }
                }
                if (found) imageUrl = `${DOMAIN}/images/${paddedId}_0.${found}`;
            }
            return { ...item, ImageUrl: imageUrl };
        });
    },

    // 6. Tăng/Giảm số lượng (+1/-1)
    updateQuantity: async (customerId, productId, delta) => {
        await pool.execute(
            `UPDATE shoppingcartitem SET Quantity = Quantity + ?, UpdatedOnUtc = UTC_TIMESTAMP() 
             WHERE CustomerId = ? AND ProductId = ? AND ShoppingCartTypeId = 1`,
            [delta, customerId, productId]
        );
    },

    // 7. Xóa 1 sản phẩm cụ thể
    removeItem: async (customerId, productId) => {
        await pool.execute(
            `DELETE FROM shoppingcartitem WHERE CustomerId = ? AND ProductId = ? AND ShoppingCartTypeId = 1`,
            [customerId, productId]
        );
    },

    // 8. Xóa TOÀN BỘ giỏ hàng
    clearCartByCustomer: async (customerId) => {
        const [result] = await pool.execute(
            `DELETE FROM shoppingcartitem WHERE CustomerId = ? AND ShoppingCartTypeId = 1`,
            [customerId]
        );
        return result;
    }
};

module.exports = CartModel;