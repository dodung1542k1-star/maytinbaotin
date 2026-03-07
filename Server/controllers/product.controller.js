const productModel = require('../models/product.model');
const { getCategoriesWithSlug, getCategoryById } = require('../models/category.model');
const PostModel = require('../models/post.model');
const { connectDB ,pool } = require('../config');
const path = require('path');
const fs = require('fs');
require('dotenv').config();


const DOMAIN = process.env.DOMAIN;
 // Lấy sản phẩm theo danh mục
exports.getProductsByCategory = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 100;

        if (isNaN(categoryId)) {
            return res.status(400).json({ success: false, message: 'ID danh mục không hợp lệ' });
        }

        // 1. (Tùy chọn) Kiểm tra danh mục có tồn tại không
        const category = await getCategoryById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Danh mục không tồn tại' });
        }

        // 2. Gọi model lấy sản phẩm
        const { products, total } = await productModel.getProductsByCategoryId(categoryId, page, pageSize);

        res.json({
            success: true,
            categoryName: category.Name,
            pagination: {
                totalItems: total,
                currentPage: page,
                pageSize: pageSize,
                totalPages: Math.ceil(total / pageSize)
            },
            data: products
        });
    } catch (err) {
        console.error('getProductsByCategory error:', err);
        res.status(500).json({ success: false, message: 'Lỗi khi tải danh sách sản phẩm' });
    }
};
// Hàm lấy cây danh mục cũ của bạn
exports.getCategoryTree = async (req, res) => {
    try {
        const categories = await getCategoriesWithSlug();
        const buildTree = (parentId = 0) => {
            return categories
                .filter(c => (c.ParentCategoryId || 0) === parentId)
                .map(c => ({
                    id: c.Id,
                    name: c.Name,
                    slug: c.Slug || null,
                    children: buildTree(c.Id)
                }));
        };
        const tree = buildTree(0);
        res.json({ success: true, data: tree });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi tải cây danh mục' });
    }
};
exports.getPosts = async (req, res) => {
    try {
        const posts = await PostModel.getAllPosts();
        res.json({
            success: true,
            data: posts
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
// controllers/product.controller.js
exports.getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        // Bỏ await connectDB() nếu bạn đã import pool từ file config ở đầu file
        // Nếu dùng mysql2, ta dùng pool.execute trực tiếp

        const [rows] = await pool.execute(`
            SELECT 
                p.Id, p.Name, p.ShortDescription, p.FullDescription, p.Price, p.OldPrice,p.DiscountDescription,
                u.Slug as ProductSlug,
                ppm.PictureId,
                -- Cú pháp MySQL: Dùng LIMIT 1 thay cho TOP 1
                (SELECT CategoryId FROM Product_Category_Mapping WHERE ProductId = p.Id LIMIT 1) as CategoryId
            FROM Product p
            INNER JOIN UrlRecord u ON p.Id = u.EntityId
            LEFT JOIN Product_Picture_Mapping ppm ON p.Id = ppm.ProductId
            WHERE u.Slug = ? 
              AND u.EntityName = 'Product' 
              AND u.IsActive = 1
            ORDER BY ppm.DisplayOrder ASC
        `, [slug]);

        if (rows.length > 0) {
            // 1. Khởi tạo đối tượng sản phẩm và làm sạch giá tiền (.0000)
            let product = { 
                ...rows[0],
                Price: rows[0].Price ? Math.round(rows[0].Price) : 0,
                OldPrice: rows[0].OldPrice ? Math.round(rows[0].OldPrice) : 0
            };

            const uploadDir = path.join(__dirname, '../public/images'); 
            const formatPictureId = (id) => id ? id.toString().padStart(7, '0') : null;

            // 2. Xử lý danh sách hình ảnh (Duyệt qua tất cả các rows để lấy PictureId)
            product.Images = rows
                .filter(row => row.PictureId)
                .map(row => {
                    const picId = formatPictureId(row.PictureId);
                    const fileNameBase = `${picId}_0`;
                    const extensions = ['.jpeg', '.jpg', '.png', '.webp', '.JPEG', '.JPG', '.PNG', '.WEBP'];
                    
                    let detectedExt = '.jpeg'; 
                    for (const ext of extensions) {
                        if (fs.existsSync(path.join(uploadDir, fileNameBase + ext))) {
                            detectedExt = ext;
                            break;
                        }
                    }
                    return `${DOMAIN}/images/${fileNameBase}${detectedExt}`; 
                });

            // 3. Nếu không có ảnh thì dùng ảnh mặc định
            if (product.Images.length === 0) {
                product.Images = [`${DOMAIN}/images/default-product.png`];
            }

            res.json({ success: true, data: product });
        } else {
            res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        console.error("Lỗi getProductBySlug:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getProductsByCategorySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 12;
        const minPrice = parseFloat(req.query.minPrice) || 0;
        const maxPrice = parseFloat(req.query.maxPrice) || 100000000;

        // Lấy pool từ file config (đảm bảo file config export pool của mysql2)
        const pool = await connectDB(); 

        // 1. Tìm EntityId (Dùng pool.execute của MySQL)
        // Bỏ "dbo.", dùng "?" thay cho "@slug"
        const [urlRows] = await pool.execute(`
            SELECT EntityId FROM UrlRecord 
            WHERE Slug = ? AND EntityName = 'Category' AND IsActive = 1
            LIMIT 1
        `, [slug]);

        // Kiểm tra độ dài mảng rows
        if (!urlRows || urlRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Danh mục không tồn tại' });
        }

        const categoryId = urlRows[0].EntityId;

        // 2. Lấy thông tin Category (Hàm getCategoryById bạn đã sửa sang MySQL trước đó)
        const category = await getCategoryById(categoryId);

        // 3. Gọi model (Đảm bảo hàm getProductsByCategoryId trong model đã sửa sang MySQL)
        const { products, total } = await productModel.getProductsByCategoryId(
            categoryId, 
            page, 
            pageSize, 
            minPrice, 
            maxPrice
        );

        res.json({
            success: true,
            categoryName: category?.Name,
            categoryId: categoryId,
            pagination: {
                totalItems: total,
                currentPage: page,
                pageSize: pageSize,
                totalPages: Math.ceil(total / pageSize)
            },
            data: products
        });
    } catch (err) {
        console.error('getProductsByCategorySlug error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
exports.resolveSlug = async (req, res) => {
    try {
        const { slug } = req.params;
        
        // 1. Sử dụng pool trực tiếp từ config (đã import ở đầu file)
        // Không dùng await pool.request() vì MySQL không có hàm này
        const [rows] = await pool.execute(
            `SELECT EntityId, EntityName 
             FROM UrlRecord 
             WHERE Slug = ? AND IsActive = 1 
             LIMIT 1`, 
            [slug]
        );

        // 2. MySQL trả về kết quả trong mảng rows
        if (!rows || rows.length === 0) {
            console.log(`[API Info] Slug "${slug}" not found in Database.`);
            return res.status(404).json({ success: false, message: 'Slug not found' });
        }

        const { EntityId, EntityName } = rows[0];

        // 3. Xử lý Logic (Dùng toLowerCase để tránh lỗi so sánh chữ Hoa/Thường)
        const type = EntityName.toLowerCase();

        if (type === 'category') {
            const category = await getCategoryById(EntityId); 
            return res.json({
                success: true,
                type: 'category', 
                data: category
            });
        } 
        
        if (type === 'product') {
            const product = await productModel.getProductById(EntityId); 
            // Nếu tìm thấy Slug nhưng không tìm thấy Product (do Deleted=1), cần xử lý:
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product data not found' });
            }
            return res.json({
                success: true,
                type: 'product',
                data: product
            });
        }

        res.status(404).json({ success: false, message: 'Entity type not supported' });
    } catch (err) {
        console.error("Lỗi resolveSlug:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

///seach tìm kiếm sản phẩm 
exports.searchProducts = async (req, res) => {
    try {
        const keyword = req.query.q ? req.query.q.trim() : '';
        const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : null;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;

        if (!keyword) {
            return res.status(200).json({ 
                success: true, 
                data: [], 
                pagination: { totalItems: 0, currentPage: page, totalPages: 0 } 
            });
        }

        let resultData;
        if (categoryId && !isNaN(categoryId)) {
            resultData = await productModel.searchProductsByCategory(keyword, categoryId, page, pageSize);
        } else {
            resultData = await productModel.searchProductsGlobal(keyword, page, pageSize);
        }
        const products = resultData?.products || [];
        const total = resultData?.total || 0;
        const uploadDir = path.join(__dirname, '../public/images');
        const formatPictureId = (id) => id ? id.toString().padStart(7, '0') : null;

        const formattedProducts = products.map(p => {
            let imageUrl = `${DOMAIN}/images/default-product.png`; 
            const picId = formatPictureId(p.MainPictureId);

            if (picId) {
                const fileNameBase = `${picId}_0`;
                const extensions = ['.jpeg', '.jpg', '.png', '.webp']; 
                for (const ext of extensions) {
                    const fullPath = path.join(uploadDir, fileNameBase + ext);
                    if (fs.existsSync(fullPath)) {
                        imageUrl = `${DOMAIN}/images/${fileNameBase}${ext}`;
                        break;
                    }
                }
            }

            return {
                id: p.Id,
                name: p.Name,
                price: Math.round(p.Price) || 0,        // Sửa dòng này
                oldPrice: Math.round(p.OldPrice) || 0,  // Sửa dòng này
                slug: p.ProductSlug,
                image: imageUrl
            };
        });

        return res.status(200).json({
            success: true,
            pagination: { 
                totalItems: total, 
                currentPage: page, 
                pageSize: pageSize, 
                totalPages: Math.ceil(total / pageSize) 
            },
            data: formattedProducts
        });

    } catch (err) {
        console.error('❌ Search Controller Error:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Đã có lỗi xảy ra tại máy chủ khi tìm kiếm.' 
        });
    }
};
/// kiểm tra xem sản phẩm ở danh mục nào 
exports.getProducts = async (req, res) => {
    try {
        const categoryId = req.query.categoryId;
        
        // 1. Cú pháp MySQL chuẩn
        let query = `
            SELECT DISTINCT 
                p.Id, 
                p.Name, 
                p.Price, 
                u.Slug as ProductSlug, 
                (SELECT PictureId FROM Product_Picture_Mapping WHERE ProductId = p.Id ORDER BY DisplayOrder ASC LIMIT 1) as PictureId
            FROM Product p
            LEFT JOIN UrlRecord u ON p.Id = u.EntityId AND u.EntityName = 'Product' AND u.IsActive = 1
            LEFT JOIN Product_Category_Mapping pcm ON p.Id = pcm.ProductId
            WHERE p.Published = 1 AND p.Deleted = 0
        `;

        const queryParams = [];

        // 2. Kiểm tra CategoryId an toàn
        if (categoryId && categoryId !== 'undefined' && categoryId !== 'null') {
            query += ` AND pcm.CategoryId = ?`;
            queryParams.push(categoryId);
        }

        query += ` ORDER BY p.Id DESC LIMIT 20`;

        // 3. Thực thi truy vấn
        const [rows] = await pool.execute(query, queryParams);
        
        const uploadDir = path.resolve(__dirname, '../public/images');
        const formatPictureId = (id) => id ? id.toString().padStart(7, '0') : null;

        const formattedProducts = rows.map(p => {
            let imageUrl = `${DOMAIN}/images/default-product.png`; 
            
            // Xử lý logic tìm file ảnh
            if (p.PictureId) {
                const picId = formatPictureId(p.PictureId);
                const fileNameBase = `${picId}_0`;
                const extensions = ['.jpeg', '.jpg', '.png', '.webp', '.JPEG', '.JPG', '.PNG', '.WEBP'];
                
                for (const ext of extensions) {
                    const fullPath = path.join(uploadDir, fileNameBase + ext);
                    if (fs.existsSync(fullPath)) {
                        imageUrl = `${DOMAIN}/images/${fileNameBase}${ext}`;
                        break;
                    }
                }
            }

            // TRẢ VỀ DỮ LIỆU ĐÃ LÀM SẠCH GIÁ
            return {
                Id: p.Id,
                Name: p.Name,
                // SỬA TẠI ĐÂY: Dùng Math.round để loại bỏ .0000
                Price: p.Price ? Math.round(p.Price) : 0,
                ProductSlug: p.ProductSlug,
                ImageUrl: imageUrl
            };
        });

        res.json({ 
            success: true, 
            count: formattedProducts.length, 
            data: formattedProducts 
        });

    } catch (error) {
        console.error("Lỗi getProducts Controller:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// thêm sửa xoá của sản phẩm 
exports.getAllProducts = async (req, res) => {
    try {
        // 1. Lấy tham số từ query
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);
        const categoryId = req.query.categoryId;
        const searchName = req.query.q || '';
        const offset = (page - 1) * limit;

        let whereClause = ` WHERE p.Deleted = 0`;
        let params = [];

        // 2. Logic tìm kiếm tên
        if (searchName.trim() !== '') {
            whereClause += ` AND p.Name LIKE ?`;
            params.push(`%${searchName}%`);
        }

        // 3. Logic tìm danh mục (bao gồm cả danh mục con) - MySQL Recursive CTE
        let cteQuery = "";
        if (categoryId && categoryId !== '' && !isNaN(parseInt(categoryId))) {
            cteQuery = `
                WITH RECURSIVE CategoryTree AS (
                    SELECT Id FROM category WHERE Id = ?
                    UNION ALL
                    SELECT c.Id FROM category c
                    INNER JOIN CategoryTree ct ON c.ParentCategoryId = ct.Id
                )
            `;
            whereClause += ` AND pcm.CategoryId IN (SELECT Id FROM CategoryTree)`;
            params.unshift(parseInt(categoryId)); // Đưa catId vào đầu mảng params vì CTE nằm trên cùng
        }

        // 4. Query lấy tổng số bản ghi
        const countQuery = `
            ${cteQuery}
            SELECT COUNT(DISTINCT p.Id) AS total
            FROM product p
            LEFT JOIN product_category_mapping pcm ON p.Id = pcm.ProductId
            ${whereClause}
        `;
        const [countResult] = await pool.query(countQuery, params);
        const totalItems = countResult[0]?.total || 0;

        // 5. Query lấy dữ liệu sản phẩm
        // SỬA ĐỔI: Thêm p.Sku và dùng ROUND() để mất đuôi .0000
        const dataQuery = `
            ${cteQuery}
            SELECT DISTINCT 
                p.Id, 
                p.Name, 
                p.Sku, 
                ROUND(p.Price, 0) AS Price, 
                ROUND(p.OldPrice, 0) AS OldPrice, 
                u.Slug AS ProductSlug,
                (SELECT PictureId FROM product_picture_mapping 
                 WHERE ProductId = p.Id ORDER BY DisplayOrder ASC LIMIT 1) AS PictureId
            FROM product p
            LEFT JOIN urlrecord u ON p.Id = u.EntityId 
                AND u.EntityName = 'Product' AND u.IsActive = 1
            LEFT JOIN product_category_mapping pcm ON p.Id = pcm.ProductId
            ${whereClause}
            ORDER BY p.Id DESC
            LIMIT ?, ?
        `;

        // Thêm offset và limit vào cuối mảng params (Đảm bảo là kiểu Number)
        const [rows] = await pool.query(dataQuery, [...params, Number(offset), Number(limit)]);

        // 6. Xử lý logic ảnh và định dạng dữ liệu trả về
        const uploadDir = path.resolve(__dirname, '../public/images');
        const formatPictureId = (id) => id.toString().padStart(7, '0');

        const products = rows.map(p => {
            let imageUrl = `${DOMAIN}/images/default-product.png`;
            if (p.PictureId) {
                const picId = formatPictureId(p.PictureId);
                const base = `${picId}_0`;
                const exts = ['.jpeg', '.jpg', '.png', '.webp', '.JPG', '.PNG'];
                for (const ext of exts) {
                    if (fs.existsSync(path.join(uploadDir, base + ext))) {
                        imageUrl = `${DOMAIN}/images/${base}${ext}`;
                        break;
                    }
                }
            }
            return {
                id: p.Id,
                name: p.Name,
                sku: p.Sku || '', // Trả về SKU, nếu null thì để chuỗi rỗng
                price: p.Price,
                oldPrice: p.OldPrice,
                slug: p.ProductSlug,
                image: imageUrl
            };
        });

        // 7. Trả về kết quả
        res.json({
            success: true,
            pagination: {
                totalItems: totalItems,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page,
                pageSize: limit
            },
            data: products
        });

    } catch (err) {
        console.error('getAllProducts error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
// Lấy chi tiết sản phẩm phục vụ việc Edit
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        // pool đã được require ở đầu file controller, không cần gọi connectDB() nữa

        // 1. Lấy thông tin sản phẩm và Slug (Dùng MySQL syntax)
        const productQuery = `
            SELECT p.*, 
                   ROUND(p.Price, 0) as Price, 
                   ROUND(p.OldPrice, 0) as OldPrice,
                   u.Slug, 
                   (SELECT CategoryId FROM product_category_mapping WHERE ProductId = p.Id LIMIT 1) as CategoryId
            FROM product p
            LEFT JOIN urlrecord u ON p.Id = u.EntityId AND u.EntityName = 'Product'
            WHERE p.Id = ?
        `;

        const [productRows] = await pool.query(productQuery, [id]);

        if (productRows.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
        }

        let productData = productRows[0];

        // 2. Lấy danh sách hình ảnh
        const pictureQuery = `
            SELECT pic.Id, pic.SeoFilename, ppm.DisplayOrder
            FROM product_picture_mapping ppm
            JOIN picture pic ON ppm.PictureId = pic.Id
            WHERE ppm.ProductId = ?
            ORDER BY ppm.DisplayOrder ASC
        `;

        const [pictureRows] = await pool.query(pictureQuery, [id]);

        // 3. XỬ LÝ FORMAT ẢNH
        const uploadDir = path.resolve(__dirname, '../public/images');
        const formatPictureId = (id) => id.toString().padStart(7, '0');

        productData.Images = pictureRows.map(pic => {
            const picIdFormatted = formatPictureId(pic.Id);
            const fileNameBase = `${picIdFormatted}_0`;
            const extensions = ['.jpeg', '.jpg', '.png', '.webp', '.JPG', '.PNG'];
            
            let finalUrl = `${DOMAIN}/images/default-product.png`;
            let detectedFileName = "";

            for (const ext of extensions) {
                const fullPath = path.join(uploadDir, fileNameBase + ext);
                if (fs.existsSync(fullPath)) {
                    finalUrl = `${DOMAIN}/images/${fileNameBase}${ext}`;
                    detectedFileName = fileNameBase + ext;
                    break;
                }
            }

            return {
                Id: pic.Id,
                SeoFilename: pic.SeoFilename || detectedFileName,
                DisplayOrder: pic.DisplayOrder,
                Url: finalUrl
            };
        });

        res.json({ success: true, data: productData });

    } catch (err) {
        console.error("Lỗi getProductById:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
async function insertPictureBinary(connection, file) {
    // 1. Thực hiện chèn dữ liệu vào bảng Picture
    // Trong MySQL, dùng dấu ? thay cho @ và không có OUTPUT INSERTED.Id
    const query = `
        INSERT INTO picture (MimeType, SeoFilename, IsNew)
        VALUES (?, ?, 1)
    `;

    // Thực thi câu lệnh với mảng tham số
    const [result] = await connection.execute(query, [
        file.mimetype, 
        file.originalname
    ]);

    // 2. Lấy ID vừa tạo (MySQL trả về trong insertId)
    const pictureId = result.insertId;

    // 3. Xử lý lưu file vật lý vào thư mục public/images
    const ext = path.extname(file.originalname) || '.jpg';
    const picIdFormatted = pictureId.toString().padStart(7, '0'); // Ví dụ: 0000057
    const fileName = `${picIdFormatted}_0${ext}`; // Ví dụ: 0000057_0.jpg
    const uploadPath = path.join(__dirname, '../public/images', fileName);

    // Ghi file từ buffer
    fs.writeFileSync(uploadPath, file.buffer);

    return pictureId;
}
// 2. CẬP NHẬT SẢN PHẨM (UPDATE) - Dựa trên mẫu của bạn
exports.updateProduct = async (req, res) => {
    // Lấy connection từ pool để làm Transaction
    const connection = await pool.getConnection();

    try {
        const { id } = req.params;
        const files = req.files || [];

        const { 
            Name, ShortDescription, FullDescription, Price, OldPrice, Sku, 
            StockQuantity, Published, ShowOnHomePage, Slug, CategoryId,
            MetaTitle, MetaKeywords, MetaDescription,
            DiscountDescription, // 1. LẤY DỮ LIỆU TỪ BODY
            ExistingImageIds, 
            ImageDetails 
        } = req.body;

        // BẮT ĐẦU TRANSACTION
        await connection.beginTransaction();

        /* ================= 1. UPDATE PRODUCT ================= */
        // 2. THÊM DiscountDescription = ? VÀO QUERY
        const updateProductQuery = `
            UPDATE product SET
                Name = ?, ShortDescription = ?, FullDescription = ?,
                Price = ?, OldPrice = ?, Sku = ?, StockQuantity = ?,
                Published = ?, ShowOnHomePage = ?, MetaTitle = ?,
                MetaKeywords = ?, MetaDescription = ?,
                DiscountDescription = ?, 
                UpdatedOnUtc = NOW()
            WHERE Id = ?
        `;

        // 3. THÊM GIÁ TRỊ VÀO MẢNG PARAMS (Đúng thứ tự với dấu ?)
        const productParams = [
            Name, 
            ShortDescription || '', 
            FullDescription || '', 
            parseFloat(Price) || 0, 
            parseFloat(OldPrice) || 0, 
            Sku || '', 
            parseInt(StockQuantity) || 0,
            (Published === 'true' || Published === true) ? 1 : 0,
            (ShowOnHomePage === 'true' || ShowOnHomePage === true) ? 1 : 0,
            MetaTitle || null,
            MetaKeywords || null,
            MetaDescription || null,
            DiscountDescription || null, // Thêm giá trị này
            id
        ];

        await connection.execute(updateProductQuery, productParams);

        /* ================= 2. XỬ LÝ ẢNH CŨ ================= */
        let keepIds = [];
        if (ExistingImageIds) {
            const tempArray = Array.isArray(ExistingImageIds) ? ExistingImageIds : [ExistingImageIds];
            keepIds = tempArray
                .map(val => String(val))
                .filter(val => val && !val.startsWith('temp') && !isNaN(val))
                .map(Number);
        }

        let deleteQuery = `DELETE FROM product_picture_mapping WHERE ProductId = ?`;
        let deleteParams = [id];
        
        if (keepIds.length > 0) {
            const placeholders = keepIds.map(() => '?').join(',');
            deleteQuery += ` AND PictureId NOT IN (${placeholders})`;
            deleteParams.push(...keepIds);
        }
        await connection.execute(deleteQuery, deleteParams);

        if (ImageDetails) {
            const details = typeof ImageDetails === 'string' ? JSON.parse(ImageDetails) : ImageDetails;
            for (const item of details) {
                if (item.Id && !isNaN(item.Id) && !String(item.Id).startsWith('temp')) {
                    await connection.execute(
                        `UPDATE picture SET SeoFilename = ? WHERE Id = ?`,
                        [item.SeoFilename || '', item.Id]
                    );
                }
            }
        }

        /* ================= 3. XỬ LÝ SLUG (urlrecord) ================= */
        if (Slug) {
            const [slugCheck] = await connection.execute(
                `SELECT Id FROM urlrecord WHERE EntityId = ? AND EntityName = 'Product'`,
                [id]
            );

            if (slugCheck.length > 0) {
                await connection.execute(
                    `UPDATE urlrecord SET Slug = ?, IsActive = 1 WHERE EntityId = ? AND EntityName = 'Product'`,
                    [Slug, id]
                );
            } else {
                await connection.execute(
                    `INSERT INTO urlrecord (EntityId, EntityName, Slug, IsActive, LanguageId) VALUES (?, 'Product', ?, 1, 0)`,
                    [id, Slug]
                );
            }
        }

        /* ================= 4. XỬ LÝ DANH MỤC ================= */
        if (CategoryId) {
            await connection.execute(`DELETE FROM product_category_mapping WHERE ProductId = ?`, [id]);
            await connection.execute(
                `INSERT INTO product_category_mapping (ProductId, CategoryId, IsFeaturedProduct, DisplayOrder) VALUES (?, ?, 0, 0)`,
                [id, parseInt(CategoryId)]
            );
        }

        /* ================= 5. TẢI ẢNH MỚI LÊN ================= */
        for (const file of files) {
            const pictureId = await insertPictureBinary(connection, file); 
            await connection.execute(
                `INSERT INTO product_picture_mapping (ProductId, PictureId, DisplayOrder)
                 VALUES (?, ?, (SELECT COALESCE(MAX(DisplayOrder), 0) + 1 FROM product_picture_mapping p2 WHERE ProductId = ?))`,
                [id, pictureId, id]
            );
        }

        await connection.commit();
        res.json({ success: true, message: 'Cập nhật sản phẩm thành công' });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('UPDATE PRODUCT ERROR:', err);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ: ' + err.message });
    } finally {
        if (connection) connection.release();
    }
};
// 3. XÓA SẢN PHẨM (XÓA MỀM)
exports.deleteProduct = async (req, res) => {
    // 1. Lấy connection từ pool của MySQL
    const connection = await pool.getConnection();

    try {
        const { id } = req.params;

        // 2. Bắt đầu giao dịch (Transaction)
        await connection.beginTransaction();

        // 3. Đánh dấu xóa sản phẩm (Soft Delete)
        // MySQL dùng NOW() thay cho GETUTCDATE() và dấu ? thay cho @id
        const updateProductQuery = `
            UPDATE product 
            SET Deleted = 1, UpdatedOnUtc = NOW() 
            WHERE Id = ?
        `;
        await connection.execute(updateProductQuery, [id]);

        // 4. Vô hiệu hóa Slug (UrlRecord)
        const updateSlugQuery = `
            UPDATE urlrecord 
            SET IsActive = 0 
            WHERE EntityId = ? AND EntityName = 'Product'
        `;
        await connection.execute(updateSlugQuery, [id]);

        // 5. Xác nhận thành công
        await connection.commit();
        
        res.json({ success: true, message: "Xóa sản phẩm thành công" });

    } catch (err) {
        // 6. Nếu lỗi thì quay lại trạng thái cũ
        if (connection) await connection.rollback();
        console.error("Lỗi xóa sản phẩm:", err);
        res.status(500).json({ success: false, message: "Lỗi máy chủ: " + err.message });

    } finally {
        // 7. Giải phóng kết nối để không làm treo Pool
        if (connection) connection.release();
    }
};
// thêm sản phẩm 
exports.createProduct = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const files = req.files || [];
        const { 
            Name, ShortDescription, FullDescription, Price, OldPrice, Sku, 
            StockQuantity, Published, ShowOnHomePage, CallForPrice, Slug, 
            CategoryId, MetaTitle, MetaKeywords, MetaDescription,
            ProductTypeId, ProductTemplateId, VendorId, AdminComment,
            OrderMinimumQuantity, OrderMaximumQuantity, ManageInventoryMethodId,
            DisplayOrder, DiscountDescription 
        } = req.body;

        await connection.beginTransaction();

        /* ================= 1. INSERT PRODUCT ================= */
        // Đã xóa bỏ 'as MinQty' và các cột trùng lặp
        const query = `
            INSERT INTO product (
                Name, ShortDescription, FullDescription, Sku, Price, OldPrice, 
                StockQuantity, Published, ShowOnHomepage, CallForPrice, 
                MetaTitle, MetaKeywords, MetaDescription, 
                ProductTypeId, ProductTemplateId, VendorId, AdminComment,
                OrderMinimumQuantity, OrderMaximumQuantity, ManageInventoryMethodId,
                DisplayOrder, DiscountDescription, CreatedOnUtc, UpdatedOnUtc, Deleted,
                VisibleIndividually, AllowCustomerReviews, IsShipEnabled, 
                IsFreeShipping, ShipSeparately, AdditionalShippingCharge
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, 
                ?, ?, ?, ?, 
                ?, ?, ?, 
                ?, ?, ?, ?, 
                ?, ?, ?, 
                ?, ?, NOW(), NOW(), 0,
                1, 1, 1, 0, 0, 0
            )
        `;

        const params = [
            Name || null, ShortDescription || null, FullDescription || null, Sku || null, 
            parseFloat(Price) || 0, parseFloat(OldPrice) || 0,
            parseInt(StockQuantity) || 0, 
            (Published === 'true' || Published === true ? 1 : 0),
            (ShowOnHomePage === 'true' || ShowOnHomePage === true ? 1 : 0),
            (CallForPrice === 'true' || CallForPrice === true ? 1 : 0),
            MetaTitle || null, MetaKeywords || null, MetaDescription || null,
            parseInt(ProductTypeId) || 5, parseInt(ProductTemplateId) || 1, 
            parseInt(VendorId) || 0, AdminComment || null,
            parseInt(OrderMinimumQuantity) || 1, parseInt(OrderMaximumQuantity) || 10000, 
            parseInt(ManageInventoryMethodId) || 1,
            parseInt(DisplayOrder) || 0, 
            DiscountDescription || null
        ];

        const [result] = await connection.execute(query, params);
        const productId = result.insertId;

        /* ================= 2. XỬ LÝ SLUG ================= */
        if (Slug) {
            await connection.execute(
                "INSERT INTO urlrecord (EntityId, EntityName, Slug, IsActive, LanguageId) VALUES (?, 'Product', ?, 1, 0)",
                [productId, Slug]
            );
        }

        /* ================= 3. DANH MỤC ================= */
        if (CategoryId) {
            await connection.execute(
                "INSERT INTO product_category_mapping (ProductId, CategoryId, IsFeaturedProduct, DisplayOrder) VALUES (?, ?, 0, 0)",
                [productId, parseInt(CategoryId)]
            );
        }

        /* ================= 4. HÌNH ẢNH ================= */
        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const pictureId = await insertPictureBinary(connection, files[i]);
                await connection.execute(
                    "INSERT INTO product_picture_mapping (ProductId, PictureId, DisplayOrder) VALUES (?, ?, ?)",
                    [productId, pictureId, i + 1]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công!', data: { Id: productId } });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Lỗi tạo sản phẩm:", err);
        res.status(500).json({ success: false, message: "Lỗi SQL: " + err.sqlMessage || err.message });
    } finally {
        if (connection) connection.release();
    }
};
/////lấy tất cả sản phẩm ra 
// Lấy tất cả sản phẩm phục vụ Sitemap (Chỉ lấy các trường cần thiết để tối ưu hiệu năng)
exports.getAllProductsitemap = async (req, res) => {
    try {
        const pool = await connectDB(); 

        // Truy vấn lấy ID, Name, UpdatedOn và quan trọng nhất là Slug từ UrlRecord
        const result = await pool.request()
            .query(`
                SELECT 
                    p.Id, 
                    p.Name, 
                    p.UpdatedOnUtc as updatedOn,
                    u.Slug as slug
                FROM dbo.Product p
                INNER JOIN dbo.UrlRecord u ON p.Id = u.EntityId
                WHERE u.EntityName = 'Product' 
                  AND u.IsActive = 1
                  AND p.Published = 1
                  AND p.Deleted = 0
                ORDER BY p.CreatedOnUtc DESC
            `);

        res.json({ 
            success: true, 
            data: result.recordset 
        });
    } catch (error) {
        console.error('getAllProducts Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi server: ' + error.message 
        });
    }
};