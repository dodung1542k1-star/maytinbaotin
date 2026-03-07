const sql = require('mssql/msnodesqlv8');
const { config } = require('../config');

// Hàm tạo Slug chuẩn (Khử dấu tiếng Việt, ký tự đặc biệt)
const generateSlug = (text) => {
    if (!text) return '';
    return text.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
        .replace(/[đĐ]/g, 'd')
        .replace(/\s+/g, '-')           // Khoảng trắng thành -
        .replace(/[^\w\-]+/g, '')       // Xóa ký tự đặc biệt
        .replace(/\-\-+/g, '-')         // Thay -- thành -
        .replace(/^-+/, '')             // Xóa - đầu
        .replace(/-+$/, '');            // Xóa - cuối
};

// --- HÀM LẤY CHI TIẾT (Admin & Client) ---
exports.getCategoryById = async (id) => {
    const pool = await sql.connect(config);
    const request = pool.request();
    request.input('id', sql.Int, Number(id));

    // QUAN TRỌNG: JOIN với UrlRecord để lấy Slug về cho SEO
    const result = await request.query(`
        SELECT c.*, ur.Slug
        FROM Category c
        LEFT JOIN UrlRecord ur ON ur.EntityId = c.Id 
            AND ur.EntityName = 'Category' 
            AND ur.IsActive = 1
        WHERE c.Id = @id AND c.Deleted = 0
    `);

    return result.recordset[0] || null;
};

exports.getCategoryByIdAdmin = exports.getCategoryById;

// --- HÀM CÂY DANH MỤC ---
exports.getCategoryTreeAdmin = async () => {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`
        SELECT Id, Name, ParentCategoryId, Published
        FROM Category
        WHERE Deleted = 0
        ORDER BY ParentCategoryId, Name
    `);
    return result.recordset;
};

// --- HÀM CLIENT ---
exports.getSubCategories = async (parentId) => {
    const pool = await sql.connect(config);
    const result = await pool.request()
        .input('id', sql.Int, parentId)
        .query(`
            SELECT c.Name, ur.Slug
            FROM Category c
            LEFT JOIN UrlRecord ur ON ur.EntityId = c.Id 
                AND ur.EntityName = 'Category' AND ur.IsActive = 1
            WHERE c.ParentCategoryId = @id AND c.Published = 1
            ORDER BY c.Name
        `);
    return result.recordset;
};

exports.getProductsInCategory = async (categoryId) => {
    const pool = await sql.connect(config);
    const result = await pool.request()
        .input('id', sql.Int, categoryId)
        .query(`
            SELECT p.Id, p.Name, p.Price, p.OldPrice, ur.Slug
            FROM Product_Category_Mapping pcm
            JOIN Product p ON pcm.ProductId = p.Id
            JOIN UrlRecord ur ON ur.EntityId = p.Id 
                AND ur.EntityName = 'Product' AND ur.IsActive = 1
            WHERE pcm.CategoryId = @id
                AND p.Published = 1 AND p.Deleted = 0
            ORDER BY pcm.DisplayOrder, p.Name
        `);
    return result.recordset;
};

// --- HÀM TẠO MỚI ---
exports.createCategory = async (data) => {
    const pool = await sql.connect(config);
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        const request = new sql.Request(transaction);

        request.input('Name', sql.NVarChar, data.Name);
        request.input('Description', sql.NVarChar, data.Description || '');
        request.input('ParentCategoryId', sql.Int, data.ParentCategoryId || 0);
        request.input('Published', sql.Bit, data.Published ? 1 : 0);
        request.input('ShowOnHomepage', sql.Bit, data.ShowOnHomepage ? 1 : 0);
        request.input('MetaTitle', sql.NVarChar, data.MetaTitle || null);
        request.input('MetaKeywords', sql.NVarChar, data.MetaKeywords || null);
        request.input('MetaDescription', sql.NVarChar, data.MetaDescription || null);
        request.input('PictureId', sql.Int, 0); 
        request.input('PageSize', sql.Int, data.PageSize || 6);
        request.input('AllowCustomersToSelectPageSize', sql.Bit, data.AllowCustomersToSelectPageSize ? 1 : 0);
        request.input('PageSizeOptions', sql.NVarChar, data.PageSizeOptions || '6, 12');
        request.input('PriceRangeFiltering', sql.Bit, data.PriceRangeFiltering ? 1 : 0);
        request.input('PriceFrom', sql.Decimal(18, 4), data.PriceFrom || 0);
        request.input('PriceTo', sql.Decimal(18, 4), data.PriceTo || 0);
        request.input('ManuallyPriceRange', sql.Bit, data.ManuallyPriceRange ? 1 : 0);
        request.input('IncludeInTopMenu', sql.Bit, 0);
        request.input('CategoryTemplateId', sql.Int, 1);
        request.input('CreatedOnUtc', sql.DateTime, new Date());
        request.input('UpdatedOnUtc', sql.DateTime, new Date());
        request.input('Deleted', sql.Bit, 0);
        request.input('DisplayOrder', sql.Int, 0);
        request.input('SubjectToAcl', sql.Bit, 0);
        request.input('LimitedToStores', sql.Bit, 0);

        const result = await request.query(`
            INSERT INTO Category (
                Name, Description, ParentCategoryId, Published, ShowOnHomepage, 
                MetaTitle, MetaKeywords, MetaDescription, PictureId, PageSize, 
                AllowCustomersToSelectPageSize, PageSizeOptions, PriceRangeFiltering, 
                PriceFrom, PriceTo, ManuallyPriceRange, IncludeInTopMenu, 
                CategoryTemplateId, CreatedOnUtc, UpdatedOnUtc, Deleted, 
                DisplayOrder, SubjectToAcl, LimitedToStores
            )
            OUTPUT INSERTED.Id
            VALUES (
                @Name, @Description, @ParentCategoryId, @Published, @ShowOnHomepage, 
                @MetaTitle, @MetaKeywords, @MetaDescription, @PictureId, @PageSize, 
                @AllowCustomersToSelectPageSize, @PageSizeOptions, @PriceRangeFiltering, 
                @PriceFrom, @PriceTo, @ManuallyPriceRange, @IncludeInTopMenu, 
                @CategoryTemplateId, @CreatedOnUtc, @UpdatedOnUtc, @Deleted, 
                @DisplayOrder, @SubjectToAcl, @LimitedToStores
            )
        `);

        const newId = result.recordset[0].Id;

        // XỬ LÝ SLUG: Ưu tiên slug từ client, nếu trống thì tự tạo
        const slugValue = (data.Slug && data.Slug.trim() !== '') 
            ? data.Slug.trim() 
            : generateSlug(data.Name);
        
        const requestSlug = new sql.Request(transaction);
        requestSlug.input('EntityId', sql.Int, newId);
        requestSlug.input('EntityName', sql.NVarChar, 'Category');
        requestSlug.input('Slug', sql.NVarChar, slugValue);
        requestSlug.input('IsActive', sql.Bit, 1);
        requestSlug.input('LanguageId', sql.Int, 0);

        await requestSlug.query(`
            INSERT INTO UrlRecord (EntityId, EntityName, Slug, IsActive, LanguageId)
            VALUES (@EntityId, @EntityName, @Slug, @IsActive, @LanguageId)
        `);

        await transaction.commit();
        return { success: true, id: newId };
    } catch (err) {
        if (transaction) await transaction.rollback();
        throw err;
    }
};

// --- HÀM CẬP NHẬT ---
exports.updateCategory = async (id, data) => {
    const pool = await sql.connect(config);
    const transaction = new sql.Transaction(pool);
    
    try {
        await transaction.begin();
        const request = new sql.Request(transaction);

        request.input('id', sql.Int, id);
        request.input('Name', sql.NVarChar, data.Name);
        request.input('Description', sql.NVarChar, data.Description || '');
        request.input('ParentCategoryId', sql.Int, data.ParentCategoryId || 0);
        request.input('Published', sql.Bit, data.Published ? 1 : 0);
        request.input('ShowOnHomepage', sql.Bit, data.ShowOnHomepage ? 1 : 0);
        request.input('MetaTitle', sql.NVarChar, data.MetaTitle || null);
        request.input('MetaKeywords', sql.NVarChar, data.MetaKeywords || null);
        request.input('MetaDescription', sql.NVarChar, data.MetaDescription || null);
        request.input('UpdatedOnUtc', sql.DateTime, new Date());

        // --- THÊM CÁC TRƯỜNG LỌC GIÁ VÀO ĐÂY ---
        request.input('PriceRangeFiltering', sql.Bit, data.PriceRangeFiltering ? 1 : 0);
        request.input('PriceFrom', sql.Decimal(18, 4), data.PriceFrom || 0);
        request.input('PriceTo', sql.Decimal(18, 4), data.PriceTo || 0);
        request.input('ManuallyPriceRange', sql.Bit, data.ManuallyPriceRange ? 1 : 0);
        request.input('PageSize', sql.Int, data.PageSize || 6); // Thêm cả PageSize nếu bạn có dùng

        await request.query(`
            UPDATE Category SET
                Name = @Name, 
                Description = @Description, 
                ParentCategoryId = @ParentCategoryId,
                Published = @Published, 
                ShowOnHomepage = @ShowOnHomepage,
                MetaTitle = @MetaTitle, 
                MetaKeywords = @MetaKeywords, 
                MetaDescription = @MetaDescription, 
                UpdatedOnUtc = @UpdatedOnUtc,
                -- Cập nhật thêm các cột mới
                PriceRangeFiltering = @PriceRangeFiltering,
                PriceFrom = @PriceFrom,
                PriceTo = @PriceTo,
                ManuallyPriceRange = @ManuallyPriceRange,
                PageSize = @PageSize
            WHERE Id = @id
        `);

        // --- PHẦN CẬP NHẬT SLUG GIỮ NGUYÊN ---
        const finalSlug = (data.Slug && data.Slug.trim() !== '') 
            ? data.Slug.trim() 
            : generateSlug(data.Name);
        
        const requestSlug = new sql.Request(transaction);
        requestSlug.input('id', sql.Int, id);
        requestSlug.input('Slug', sql.NVarChar, finalSlug);

        await requestSlug.query(`
            UPDATE UrlRecord SET IsActive = 0 
            WHERE EntityId = @id AND EntityName = 'Category'
        `);

        await requestSlug.query(`
            IF EXISTS (SELECT 1 FROM UrlRecord WHERE EntityId = @id AND EntityName = 'Category' AND Slug = @Slug)
            BEGIN
                UPDATE UrlRecord SET IsActive = 1 
                WHERE EntityId = @id AND EntityName = 'Category' AND Slug = @Slug
            END
            ELSE
            BEGIN
                INSERT INTO UrlRecord (EntityId, EntityName, Slug, IsActive, LanguageId)
                VALUES (@id, 'Category', @Slug, 1, 0)
            END
        `);

        await transaction.commit();
        return { success: true };
    } catch (err) {
        if (transaction) await transaction.rollback();
        throw err;
    }
};

// --- HÀM XOÁ ---
exports.deleteCategory = async (id) => {
    const pool = await sql.connect(config);
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        const request = new sql.Request(transaction);
        request.input('id', sql.Int, id);

        const categoryCheck = await request.query(`SELECT Id FROM Category WHERE Id = @id AND Deleted = 0`);
        if (categoryCheck.recordset.length === 0) throw new Error('Danh mục không tồn tại');

        const childCheck = await request.query(`SELECT COUNT(*) AS total FROM Category WHERE ParentCategoryId = @id AND Deleted = 0`);
        if (childCheck.recordset[0].total > 0) throw new Error('Vẫn còn danh mục con');

        await request.query(`UPDATE Category SET Deleted = 1, UpdatedOnUtc = GETUTCDATE() WHERE Id = @id`);
        await request.query(`UPDATE UrlRecord SET IsActive = 0 WHERE EntityId = @id AND EntityName = 'Category'`);

        await transaction.commit();
        return { success: true };
    } catch (err) {
        if (transaction) await transaction.rollback();
        throw err; 
    }
};
// --- HÀM LẤY DANH SÁCH CHO ADMIN CÓ TÌM KIẾM ---
exports.getCategoryTreeAdmin = async (searchTerm = '') => {
    const pool = await sql.connect(config);
    const request = pool.request();
    
    let query = `
        SELECT Id, Name, ParentCategoryId, Published, DisplayOrder
        FROM Category
        WHERE Deleted = 0
    `;

    // Nếu có từ khóa tìm kiếm, thêm điều kiện LIKE
    if (searchTerm) {
        request.input('searchTerm', sql.NVarChar, `%${searchTerm}%`);
        query += ` AND Name LIKE @searchTerm`;
    }

    query += ` ORDER BY ParentCategoryId, DisplayOrder, Name`;

    const result = await request.query(query);
    return result.recordset;
};
// --- HÀM MỚI: Lấy danh mục được tick checkbox hiển thị trang chủ ---
exports.getHomeCategories = async () => {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`
        SELECT Id, Name 
        FROM Category 
        WHERE ShowOnHomePage = 1 
          AND Published = 1 
          AND Deleted = 0
        ORDER BY DisplayOrder ASC
    `);
    return result.recordset;
};

// --- HÀM LẤY DANH MỤC TRANG CHỦ KÈM SẢN PHẨM ---
exports.getHomeCategoriesWithProducts = async () => {
    const pool = await sql.connect(config);
    
    // 1. Lấy danh mục hiển thị trang chủ
    const catResult = await pool.request().query(`
        SELECT c.Id, c.Name, ur.Slug
        FROM Category c
        LEFT JOIN UrlRecord ur ON ur.EntityId = c.Id 
            AND ur.EntityName = 'Category' AND ur.IsActive = 1
        WHERE c.ShowOnHomePage = 1 
          AND c.Published = 1 
          AND c.Deleted = 0
        ORDER BY c.DisplayOrder ASC
    `);

    const categories = catResult.recordset;

    // 2. Với mỗi danh mục, lấy sản phẩm và thông tin Picture
    const result = await Promise.all(categories.map(async (cat) => {
        const productResult = await pool.request()
            .input('categoryId', sql.Int, cat.Id)
            .query(`
                SELECT TOP 8 
                    p.Id, p.Name, p.Price, p.OldPrice, ur.Slug,
                    pic.Id AS PictureId,
                    pic.MimeType
                FROM Product_Category_Mapping pcm
                JOIN Product p ON pcm.ProductId = p.Id
                LEFT JOIN UrlRecord ur ON ur.EntityId = p.Id 
                    AND ur.EntityName = 'Product' AND ur.IsActive = 1
                -- Lấy ảnh đầu tiên của sản phẩm thông qua bảng mapping
                OUTER APPLY (
                    SELECT TOP 1 picInner.Id, picInner.MimeType
                    FROM Product_Picture_Mapping ppm
                    JOIN Picture picInner ON ppm.PictureId = picInner.Id
                    WHERE ppm.ProductId = p.Id
                    ORDER BY ppm.DisplayOrder ASC
                ) pic
                WHERE pcm.CategoryId = @categoryId
                  AND p.Published = 1 AND p.Deleted = 0
                ORDER BY pcm.DisplayOrder ASC, p.Name ASC
            `);
        
        return {
            ...cat,
            products: productResult.recordset
        };
    }));

    return result;
};