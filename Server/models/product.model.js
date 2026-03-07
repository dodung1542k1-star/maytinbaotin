const { connectDB ,pool} = require('../config');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Lấy DOMAIN từ file .env, mặc định là localhost:8080 nếu chưa có
const DOMAIN = process.env.DOMAIN ;


const formatProductData = (prod) => {
    const uploadDir = path.resolve(__dirname, '../public/images');
    let imageUrl = `${DOMAIN}/images/default-product.png`;

    if (prod.MainPictureId || prod.PictureId) {
        const picId = (prod.MainPictureId || prod.PictureId).toString().padStart(7, '0');
        const fileNameBase = `${picId}_0`;
        const extensions = ['.jpeg', '.jpg', '.png', '.webp', '.JPEG', '.JPG', '.PNG', '.WEBP'];

        for (const ext of extensions) {
            if (fs.existsSync(path.join(uploadDir, fileNameBase + ext))) {
                imageUrl = `${DOMAIN}/images/${fileNameBase}${ext}`;
                break;
            }
        }
    }

    return {
        ...prod,
        Price: prod.Price ? Math.round(prod.Price) : 0,
        OldPrice: prod.OldPrice ? Math.round(prod.OldPrice) : 0,
        ImageUrl: imageUrl
    };
};

exports.getProductById = async (id) => {
    try {
        const [rows] = await pool.execute(
            `SELECT * FROM Product WHERE Id = ? AND Deleted = 0`,
            [id]
        );
        return rows.length > 0 ? formatProductData(rows[0]) : null;
    } catch (error) {
        console.error("Lỗi tại getProductById Model:", error);
        throw error;
    }
};
// Thêm 2 tham số vào cuối danh sách: minPrice, maxPrice
exports.getProductsByCategoryId = async (categoryId, page, pageSize, minPrice = 0, maxPrice = 100000000) => {
    try {
        const offset = (page - 1) * pageSize;
        const query = `
            WITH RECURSIVE CategoryTree AS (
                SELECT Id FROM Category WHERE Id = ? AND Deleted = 0
                UNION ALL
                SELECT c.Id FROM Category c
                INNER JOIN CategoryTree ct ON c.ParentCategoryId = ct.Id
                WHERE c.Deleted = 0
            )
            SELECT p.Id, p.Name, p.Price, p.OldPrice, u.Slug,
                (SELECT PictureId FROM Product_Picture_Mapping WHERE ProductId = p.Id ORDER BY DisplayOrder ASC LIMIT 1) as MainPictureId
            FROM Product p
            INNER JOIN Product_Category_Mapping pcm ON p.Id = pcm.ProductId
            LEFT JOIN UrlRecord u ON p.Id = u.EntityId AND u.EntityName = 'Product' AND u.IsActive = 1
            WHERE pcm.CategoryId IN (SELECT Id FROM CategoryTree) 
              AND p.Published = 1 AND p.Deleted = 0
              AND p.Price >= ? AND p.Price <= ?
            ORDER BY p.CreatedOnUtc DESC LIMIT ? OFFSET ?;

            WITH RECURSIVE CategoryTree AS (
                SELECT Id FROM Category WHERE Id = ? AND Deleted = 0
                UNION ALL
                SELECT c.Id FROM Category c
                INNER JOIN CategoryTree ct ON c.ParentCategoryId = ct.Id
                WHERE c.Deleted = 0
            )
            SELECT COUNT(DISTINCT p.Id) as Total FROM Product p
            INNER JOIN Product_Category_Mapping pcm ON p.Id = pcm.ProductId
            WHERE pcm.CategoryId IN (SELECT Id FROM CategoryTree)
              AND p.Published = 1 AND p.Deleted = 0
              AND p.Price >= ? AND p.Price <= ?;
        `;

        const [results] = await pool.query(query, [
            categoryId, minPrice, maxPrice, pageSize, offset,
            categoryId, minPrice, maxPrice
        ]);

        return {
            products: results[0].map(formatProductData),
            total: results[1][0].Total
        };
    } catch (error) { throw error; }
};

///seach tìm kiếm sản phẩm 
exports.searchProductsByCategory = async (keyword, categoryId, page, pageSize) => {
    try {
        const offset = (parseInt(page) - 1) * parseInt(pageSize);
        const limit = parseInt(pageSize);
        const words = keyword.trim().split(/\s+/).filter(w => w.length > 0);
        
        let queryParams = [];
        let whereConditions = words.length > 0 
            ? words.map(word => { queryParams.push(`%${word}%`); return `p.Name LIKE ?`; }).join(' AND ')
            : "1=1";

        queryParams.push(parseInt(categoryId));

        const countQuery = `
            SELECT COUNT(*) as TotalCount
            FROM product p
            INNER JOIN product_category_mapping pcm ON p.Id = pcm.ProductId
            INNER JOIN urlrecord u ON p.Id = u.EntityId
            WHERE ${whereConditions} AND pcm.CategoryId = ?
              AND u.EntityName = 'Product' AND u.IsActive = 1 
              AND p.Published = 1 AND p.Deleted = 0
        `;
        const [countRows] = await pool.query(countQuery, queryParams);

        const dataParams = [...queryParams, limit, offset];
        const dataQuery = `
            SELECT p.Id, p.Name, p.Price, p.OldPrice, u.Slug as ProductSlug,
                (SELECT ppm.PictureId FROM product_picture_mapping ppm 
                 WHERE ppm.ProductId = p.Id ORDER BY ppm.DisplayOrder ASC LIMIT 1) as MainPictureId
            FROM product p
            INNER JOIN product_category_mapping pcm ON p.Id = pcm.ProductId
            INNER JOIN urlrecord u ON p.Id = u.EntityId
            WHERE ${whereConditions} AND pcm.CategoryId = ?
              AND u.EntityName = 'Product' AND u.IsActive = 1 
              AND p.Published = 1 AND p.Deleted = 0
            ORDER BY p.Id LIMIT ? OFFSET ?
        `;

        // QUAN TRỌNG: Đổi sang pool.query
        const [rows] = await pool.query(dataQuery, dataParams);
        return { products: rows, total: countRows[0]?.TotalCount || 0 };
    } catch (err) {
        console.error("❌ Lỗi Model searchProductsByCategory:", err);
        throw err;
    }
};

exports.searchProductsGlobal = async (keyword, page, pageSize) => {
    try {
        const offset = (parseInt(page) - 1) * parseInt(pageSize);
        const limit = parseInt(pageSize);
        const words = keyword.trim().split(/\s+/).filter(w => w.length > 0);
        
        let queryParams = [];
        let whereConditions = words.length > 0 
            ? words.map(word => { queryParams.push(`%${word}%`); return `p.Name LIKE ?`; }).join(' AND ')
            : "1=1";

        // Query tính tổng
        const countQuery = `
            SELECT COUNT(*) as TotalCount FROM product p
            INNER JOIN urlrecord u ON p.Id = u.EntityId
            WHERE ${whereConditions} AND u.EntityName = 'Product' 
              AND u.IsActive = 1 AND p.Published = 1 AND p.Deleted = 0
        `;
        const [countRows] = await pool.query(countQuery, queryParams); // Dùng pool.query cho đồng bộ
        
        const dataParams = [...queryParams, limit, offset];
        const dataQuery = `
            SELECT p.Id, p.Name, p.Price, p.OldPrice, u.Slug as ProductSlug,
                (SELECT ppm.PictureId FROM product_picture_mapping ppm 
                 WHERE ppm.ProductId = p.Id ORDER BY ppm.DisplayOrder ASC LIMIT 1) as MainPictureId
            FROM product p
            INNER JOIN urlrecord u ON p.Id = u.EntityId
            WHERE ${whereConditions} AND u.EntityName = 'Product' 
              AND u.IsActive = 1 AND p.Published = 1 AND p.Deleted = 0
            ORDER BY p.Id LIMIT ? OFFSET ?
        `;

        // QUAN TRỌNG: Đổi từ pool.execute sang pool.query
        const [rows] = await pool.query(dataQuery, dataParams); 
        
        return { products: rows, total: countRows[0]?.TotalCount || 0 };
    } catch (err) {
        console.error("❌ Lỗi Model searchProductsGlobal:", err);
        throw err;
    }
};

exports.getHomeSEO = async () => {
    try {
        const [rows] = await pool.execute(`
            SELECT Name, Value FROM Setting 
            WHERE Name IN (
                'commonsettings.seometaitemstitle', 
                'commonsettings.defaultmetadescription', 
                'commonsettings.defaultmetakeywords'
            )
        `);

        const seoData = {};
        rows.forEach(row => { seoData[row.Name] = row.Value; });
        return seoData;
    } catch (err) { throw err; }
};

