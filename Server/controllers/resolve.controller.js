const { pool } = require('../config'); // Sử dụng pool từ cấu hình MySQL

/**
 * Hàm giải mã Slug để xác định loại thực thể (Product, Category, Post, PostCategory)
 */
exports.resolveSlug = async (req, res) => {
    try {
        const { slug } = req.params;

        // 1. Kiểm tra SẢN PHẨM (Product)
        const [products] = await pool.execute(`
            SELECT p.*
            FROM product p
            JOIN urlrecord u ON p.Id = u.EntityId
            WHERE u.Slug = ? AND u.EntityName = 'Product' AND u.IsActive = 1
            LIMIT 1
        `, [slug]);

        if (products.length > 0) {
            return res.json({
                success: true,
                type: 'product',
                data: products[0]
            });
        }

        // 2. Kiểm tra DANH MỤC SẢN PHẨM (Category)
        const [categories] = await pool.execute(`
            SELECT c.*
            FROM category c
            JOIN urlrecord u ON c.Id = u.EntityId
            WHERE u.Slug = ? AND u.EntityName = 'Category' AND u.IsActive = 1
            LIMIT 1
        `, [slug]);

        if (categories.length > 0) {
            return res.json({
                success: true,
                type: 'category',
                data: categories[0]
            });
        }

        // 3. Kiểm tra BÀI VIẾT (Post)
        const [posts] = await pool.execute(`
            SELECT p.*
            FROM post p
            JOIN urlrecord u ON p.Id = u.EntityId
            WHERE u.Slug = ? AND u.EntityName = 'Post' AND u.IsActive = 1
            LIMIT 1
        `, [slug]);

        if (posts.length > 0) {
            return res.json({
                success: true,
                type: 'post',
                data: posts[0]
            });
        }

        // 4. Kiểm tra DANH MỤC TIN TỨC (PostCategory)
        const [postCategories] = await pool.execute(`
            SELECT pc.Id, pc.Name
            FROM postcategory pc
            JOIN urlrecord u ON pc.Id = u.EntityId
            WHERE u.Slug = ? AND u.EntityName = 'PostCategory' AND u.IsActive = 1
            LIMIT 1
        `, [slug]);

        if (postCategories.length > 0) {
            return res.json({
                success: true,
                type: 'post_category',
                data: postCategories[0]
            });
        }

        // Nếu không khớp với bất kỳ entity nào
        return res.status(404).json({ 
            success: false, 
            message: 'Đường dẫn không tồn tại hoặc đã bị xóa' 
        });

    } catch (err) {
        console.error('🔥 Resolve slug error:', err);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
};