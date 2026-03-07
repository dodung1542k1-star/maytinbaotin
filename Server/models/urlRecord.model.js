const { pool } = require('../config');

/**
 * Lấy thông tin Entity (Id và Tên bảng) dựa trên đường dẫn SEO (Slug)
 * @param {string} slug - Đường dẫn thân thiện (ví dụ: 'iphone-15-pro-max')
 */
exports.getEntityBySlug = async (slug) => {
    try {
        // Sử dụng pool.execute để tối ưu hiệu năng và bảo mật (Prepared Statement)
        const [rows] = await pool.execute(`
            SELECT EntityId, EntityName
            FROM urlrecord
            WHERE Slug = ? AND IsActive = 1
            LIMIT 1
        `, [slug]);

        // Trả về bản ghi đầu tiên nếu tìm thấy, ngược lại trả về null
        return rows.length > 0 ? rows[0] : null;
    } catch (err) {
        console.error('🔥 Lỗi getEntityBySlug:', err);
        throw err;
    }
};