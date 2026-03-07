const { pool } = require('../config');

// Hàm tạo Slug chuẩn (Giữ nguyên logic của bạn)
const generateSlug = (text) => {
    if (!text) return '';
    return text.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

// --- HÀM LẤY CHI TIẾT ---
exports.getCategoryById = async (id) => {
    try {
        // Sử dụng đúng tên bảng viết hoa nếu DB của bạn đặt như vậy
        const [rows] = await pool.execute(`
            SELECT c.*, ur.Slug
            FROM Category c
            LEFT JOIN UrlRecord ur ON ur.EntityId = c.Id 
                AND ur.EntityName = 'Category' 
                AND ur.IsActive = 1
            WHERE c.Id = ? AND c.Deleted = 0
        `, [Number(id)]);

        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("Lỗi tại getCategoryById:", error);
        throw error;
    }
};

// Gán hàm Admin bằng hàm lấy chi tiết (OK)
exports.getCategoryByIdAdmin = exports.getCategoryById;

// --- HÀM CÂY DANH MỤC ---
exports.getCategoryTreeAdmin = async () => {
    const [rows] = await pool.execute(`
        SELECT Id, Name, ParentCategoryId, Published,
               LOWER(REPLACE(Name, ' ', '-')) as TempSlug 
        FROM category
        WHERE Deleted = 0
        ORDER BY ParentCategoryId, Name
    `);
    return rows;
};

// --- HÀM CLIENT ---
exports.getSubCategories = async (parentId) => {
    const [rows] = await pool.execute(`
        SELECT c.Name, ur.Slug
        FROM category c
        LEFT JOIN urlrecord ur ON ur.EntityId = c.Id 
            AND ur.EntityName = 'Category' AND ur.IsActive = 1
        WHERE c.ParentCategoryId = ? AND c.Published = 1
        ORDER BY c.Name
    `, [parentId]);
    return rows;
};

exports.getProductsInCategory = async (categoryId) => {
    const [rows] = await pool.execute(`
        SELECT p.Id, p.Name, p.Price, p.OldPrice, ur.Slug
        FROM product_category_mapping pcm
        JOIN product p ON pcm.ProductId = p.Id
        JOIN urlrecord ur ON ur.EntityId = p.Id 
            AND ur.EntityName = 'Product' AND ur.IsActive = 1
        WHERE pcm.CategoryId = ?
            AND p.Published = 1 AND p.Deleted = 0
        ORDER BY pcm.DisplayOrder, p.Name
    `, [categoryId]);
    return rows;
};

// --- HÀM TẠO MỚI (Dùng Transaction của MySQL) ---
exports.createCategory = async (data) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const [result] = await conn.execute(`
            INSERT INTO category (
                Name, Description, ParentCategoryId, Published, ShowOnHomepage, 
                MetaTitle, MetaKeywords, MetaDescription, PictureId, PageSize, 
                AllowCustomersToSelectPageSize, PageSizeOptions, PriceRangeFiltering, 
                PriceFrom, PriceTo, ManuallyPriceRange, IncludeInTopMenu, 
                CategoryTemplateId, CreatedOnUtc, UpdatedOnUtc, Deleted, 
                DisplayOrder, SubjectToAcl, LimitedToStores
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, 0, 1, UTC_TIMESTAMP(), UTC_TIMESTAMP(), 0, 0, 0, 0)
        `, [
            data.Name, 
            data.Description || '', 
            data.ParentCategoryId || 0, 
            data.Published ? 1 : 0, 
            data.ShowOnHomepage ? 1 : 0,
            data.MetaTitle || null, 
            data.MetaKeywords || null, 
            data.MetaDescription || null,
            data.PageSize || 6, 
            data.AllowCustomersToSelectPageSize ? 1 : 0, 
            data.PageSizeOptions || '6, 12',
            data.PriceRangeFiltering ? 1 : 0, 
            data.PriceFrom || 0, 
            data.PriceTo || 0, 
            data.ManuallyPriceRange ? 1 : 0
        ]);

        const newId = result.insertId;

        // XỬ LÝ SLUG
        const slugValue = (data.Slug && data.Slug.trim() !== '') 
            ? data.Slug.trim() 
            : generateSlug(data.Name);

        await conn.execute(`
            INSERT INTO urlrecord (EntityId, EntityName, Slug, IsActive, LanguageId)
            VALUES (?, 'Category', ?, 1, 0)
        `, [newId, slugValue]);

        await conn.commit();
        return { success: true, id: newId };
    } catch (err) {
        if (conn) await conn.rollback();
        throw err;
    } finally {
        if (conn) conn.release();
    }
};

// --- HÀM CẬP NHẬT ---
exports.updateCategory = async (id, data) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // 1. Cập nhật bảng Category
        await conn.execute(`
            UPDATE category SET
                Name = ?, 
                Description = ?, 
                ParentCategoryId = ?,
                Published = ?, 
                ShowOnHomepage = ?,
                MetaTitle = ?, 
                MetaKeywords = ?, 
                MetaDescription = ?, 
                UpdatedOnUtc = UTC_TIMESTAMP(),
                PriceRangeFiltering = ?,
                PriceFrom = ?,
                PriceTo = ?,
                ManuallyPriceRange = ?,
                PageSize = ?
            WHERE Id = ?
        `, [
            data.Name, data.Description || '', data.ParentCategoryId || 0,
            data.Published ? 1 : 0, data.ShowOnHomepage ? 1 : 0,
            data.MetaTitle || null, data.MetaKeywords || null, data.MetaDescription || null,
            data.PriceRangeFiltering ? 1 : 0, data.PriceFrom || 0, data.PriceTo || 0,
            data.ManuallyPriceRange ? 1 : 0, data.PageSize || 6, id
        ]);

        // 2. Xử lý Slug
        const finalSlug = (data.Slug && data.Slug.trim() !== '') 
            ? data.Slug.trim() 
            : generateSlug(data.Name);

        // Vô hiệu hóa các slug cũ của Category này
        await conn.execute(
            "UPDATE urlrecord SET IsActive = 0 WHERE EntityId = ? AND EntityName = 'Category'",
            [id]
        );

        // Kiểm tra slug đã tồn tại chưa để Update hoặc Insert (Thay cho IF EXISTS)
        const [existingSlug] = await conn.execute(
            "SELECT Id FROM urlrecord WHERE EntityId = ? AND EntityName = 'Category' AND Slug = ?",
            [id, finalSlug]
        );

        if (existingSlug.length > 0) {
            await conn.execute(
                "UPDATE urlrecord SET IsActive = 1 WHERE Id = ?",
                [existingSlug[0].Id]
            );
        } else {
            await conn.execute(
                "INSERT INTO urlrecord (EntityId, EntityName, Slug, IsActive, LanguageId) VALUES (?, 'Category', ?, 1, 0)",
                [id, finalSlug]
            );
        }

        await conn.commit();
        return { success: true };
    } catch (err) {
        if (conn) await conn.rollback();
        throw err;
    } finally {
        if (conn) conn.release();
    }
};

// --- HÀM XOÁ ---
exports.deleteCategory = async (id) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // Kiểm tra tồn tại
        const [categoryCheck] = await conn.execute("SELECT Id FROM category WHERE Id = ? AND Deleted = 0", [id]);
        if (categoryCheck.length === 0) throw new Error('Danh mục không tồn tại');

        // Kiểm tra danh mục con
        const [childCheck] = await conn.execute("SELECT COUNT(*) AS total FROM category WHERE ParentCategoryId = ? AND Deleted = 0", [id]);
        if (childCheck[0].total > 0) throw new Error('Vẫn còn danh mục con');

        // Soft delete
        await conn.execute("UPDATE category SET Deleted = 1, UpdatedOnUtc = UTC_TIMESTAMP() WHERE Id = ?", [id]);
        await conn.execute("UPDATE urlrecord SET IsActive = 0 WHERE EntityId = ? AND EntityName = 'Category'", [id]);

        await conn.commit();
        return { success: true };
    } catch (err) {
        if (conn) await conn.rollback();
        throw err; 
    } finally {
        if (conn) conn.release();
    }
};

// --- HÀM LẤY DANH SÁCH CHO ADMIN CÓ TÌM KIẾM ---
exports.getCategoryTreeAdmin = async (searchTerm = '') => {
    let query = `
        SELECT Id, Name, ParentCategoryId, Published, DisplayOrder
        FROM category
        WHERE Deleted = 0
    `;
    const params = [];

    if (searchTerm) {
        query += ` AND Name LIKE ?`;
        params.push(`%${searchTerm}%`);
    }

    query += ` ORDER BY ParentCategoryId, DisplayOrder, Name`;
    const [rows] = await pool.execute(query, params);
    return rows;
};

// --- Lấy danh mục hiển thị trang chủ ---
exports.getHomeCategories = async () => {
    const [rows] = await pool.execute(`
        SELECT Id, Name 
        FROM category 
        WHERE ShowOnHomePage = 1 
          AND Published = 1 
          AND Deleted = 0
        ORDER BY DisplayOrder ASC
    `);
    return rows;
};

// --- HÀM LẤY DANH MỤC TRANG CHỦ KÈM SẢN PHẨM ---
exports.getHomeCategoriesWithProducts = async () => {
    // 1. Lấy danh mục được đánh dấu hiển thị ở trang chủ
    const [categories] = await pool.execute(`
        SELECT c.Id, c.Name, ur.Slug
        FROM category c
        LEFT JOIN urlrecord ur 
            ON ur.EntityId = c.Id 
            AND ur.EntityName = 'Category' 
            AND ur.IsActive = 1
        WHERE c.ShowOnHomePage = 1
          AND c.Published = 1
          AND c.Deleted = 0
        ORDER BY c.DisplayOrder ASC
    `);

    // 2. Lấy sản phẩm bao gồm cả sản phẩm trong danh mục con
    const result = await Promise.all(categories.map(async (cat) => {
        const [products] = await pool.execute(`
            WITH RECURSIVE CategoryTree AS (
                SELECT Id FROM category WHERE Id = ? AND Deleted = 0
                UNION ALL
                SELECT c.Id FROM category c
                INNER JOIN CategoryTree ct ON c.ParentCategoryId = ct.Id
                WHERE c.Deleted = 0
            )
            SELECT 
                p.Id,
                p.Name,
                p.Price,
                p.OldPrice,
                ur.Slug,
                (
                    SELECT ppm.PictureId
                    FROM product_picture_mapping ppm
                    WHERE ppm.ProductId = p.Id
                    ORDER BY ppm.DisplayOrder ASC
                    LIMIT 1
                ) AS PictureId
            FROM product p
            INNER JOIN product_category_mapping pcm ON p.Id = pcm.ProductId
            LEFT JOIN urlrecord ur 
                ON ur.EntityId = p.Id
                AND ur.EntityName = 'Product'
                AND ur.IsActive = 1
            WHERE pcm.CategoryId IN (SELECT Id FROM CategoryTree)
            AND p.Published = 1
            AND p.Deleted = 0
            GROUP BY p.Id, ur.Slug -- Gom nhóm theo ID sản phẩm
            ORDER BY p.CreatedOnUtc DESC 
            LIMIT 8
        `, [cat.Id]);

        return {
            ...cat,
            products: products
        };
    }));

    return result;
};

exports.updateCategoryOrder = async (id, position) => {
    try {
        const sql = 'UPDATE category SET DisplayOrder = ? WHERE Id = ?';
        const [result] = await pool.execute(sql, [position, id]);
        return result;
    } catch (error) {
        console.error("Lỗi tại updateCategoryOrder:", error);
        throw error;
    }
};