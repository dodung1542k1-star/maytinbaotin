const { pool } = require('../config');

/**
 * Lấy tất cả bài viết (Admin)
 */
exports.getAllPosts = async () => {
    try {
        const query = `
            SELECT 
                p.Id, 
                IFNULL(p.Name, '') as Title, 
                p.Published, 
                p.AllowComments,
                p.CreatedOnUtc,
                IFNULL((SELECT Slug FROM urlrecord WHERE EntityId = p.Id AND EntityName = 'Post' AND IsActive = 1 ORDER BY Id DESC LIMIT 1), '') as SeName,
                (SELECT pc.Name 
                 FROM postcategory pc 
                 JOIN post_postcategory_mapping pcm ON pc.Id = pcm.PostCategoryId 
                 WHERE pcm.PostId = p.Id LIMIT 1) as CategoryName,
                IFNULL((SELECT COUNT(*) FROM postcomment pc WHERE pc.PostId = p.Id AND pc.IsApproved = 1), 0) as CommentCount
            FROM post p
            WHERE p.Deleted = 0
            ORDER BY p.CreatedOnUtc DESC
        `;
        const [rows] = await pool.execute(query);
        return rows;
    } catch (err) {
        throw err;
    }
};

/**
 * Lấy danh mục kèm bài viết (Client - Trang tin tức)
 */
exports.getAllCategoriesWithPosts = async () => {
    try {
        const query = `
            SELECT 
                pc.Id AS CategoryId,
                pc.Name AS CategoryName,
                u_cat.Slug AS CategorySlug,
                p.Id AS PostId,
                p.Name AS PostTitle,
                p.ShortDescription,
                p.CreatedOnUtc,
                p.PictureId,
                pic.MimeType,
                u_post.Slug AS PostSlug
            FROM postcategory pc
            INNER JOIN urlrecord u_cat ON pc.Id = u_cat.EntityId 
                AND u_cat.EntityName = 'PostCategory' AND u_cat.IsActive = 1
            LEFT JOIN post_postcategory_mapping pcm ON pc.Id = pcm.PostCategoryId
            LEFT JOIN post p ON pcm.PostId = p.Id AND p.Deleted = 0 AND p.Published = 1
            LEFT JOIN urlrecord u_post ON p.Id = u_post.EntityId 
                AND u_post.EntityName = 'Post' AND u_post.IsActive = 1
            LEFT JOIN picture pic ON p.PictureId = pic.Id
            WHERE pc.Deleted = 0
            ORDER BY pc.DisplayOrder, p.CreatedOnUtc DESC
        `;
        const [rows] = await pool.execute(query);
        return rows;
    } catch (err) {
        throw err;
    }
};

/**
 * Lấy bài viết theo ID
 */
exports.getPostById = async (id) => {
    const query = `
        SELECT p.*, 
               p.Name as Title,
               u.Slug as SeName, 
               pic.MimeType,
               pic.Id AS PictureId,
               (SELECT PostCategoryId 
                FROM post_postcategory_mapping 
                WHERE PostId = p.Id LIMIT 1) as CategoryId
        FROM post p
        LEFT JOIN urlrecord u ON p.Id = u.EntityId AND u.EntityName = 'Post' AND u.IsActive = 1
        LEFT JOIN picture pic ON p.PictureId = pic.Id 
        WHERE p.Id = ? AND p.Deleted = 0
        ORDER BY u.Id DESC LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
};

/**
 * Hàm hỗ trợ cập nhật Slug (Sử dụng Connection từ Transaction)
 */
const updateSlug = async (connection, entityId, entityName, slug) => {
    await connection.execute(
        `DELETE FROM urlrecord WHERE EntityId = ? AND EntityName = ?`, 
        [entityId, entityName]
    );
    
    if (slug) {
        await connection.execute(
            `INSERT INTO urlrecord (EntityName, Slug, EntityId, IsActive, LanguageId) VALUES (?, ?, ?, 1, 0)`,
            [entityName, slug, entityId]
        );
    }
};

/**
 * Tạo bài viết mới
 */
exports.createPost = async (data) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // MySQL dùng UTC_TIMESTAMP() thay cho GETUTCDATE()
        const [postResult] = await connection.execute(`
            INSERT INTO post (
                Name, MetaKeywords, MetaTitle, Alternate, ShortDescription, FullDescription, 
                PictureId, MetaDescription, ShowOnHomepage, AllowComments, Tags, 
                SubjectToAcl, LimitedToStores, PostTemplateId, DisplayOrder, Published, 
                Deleted, StartDateUtc, EndDateUtc, CreatedOnUtc, UpdatedOnUtc
            )
            VALUES (?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?, 0, 0, 1, 0, ?, 0, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
        `, [
            data.Title, data.MetaKeywords || '', data.MetaTitle || '', 
            data.ShortDescription || '', data.FullDescription || '', data.PictureId || 0,
            data.MetaDescription || '', data.ShowOnHomepage ? 1 : 0, data.AllowComments ? 1 : 0, 
            data.Tags || '', data.Published ? 1 : 0, 
            data.StartDateUtc ? new Date(data.StartDateUtc) : null,
            data.EndDateUtc ? new Date(data.EndDateUtc) : null
        ]);

        const newPostId = postResult.insertId;

        if (data.CategoryId && parseInt(data.CategoryId) > 0) {
            await connection.execute(
                `INSERT INTO post_postcategory_mapping (PostId, PostCategoryId, DisplayOrder, IsNew) VALUES (?, ?, 0, 0)`,
                [newPostId, parseInt(data.CategoryId)]
            );
        }

        await updateSlug(connection, newPostId, 'Post', data.SeName);
        
        await connection.commit();
        return newPostId;
    } catch (err) {
        if (connection) await connection.rollback();
        console.error("🔥 LỖI CREATE_POST:", err.message);
        throw err;
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Cập nhật bài viết
 */
exports.updatePost = async (id, data) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        await connection.execute(`
            UPDATE post SET 
                Name = ?, ShortDescription = ?, FullDescription = ?, 
                MetaKeywords = ?, MetaTitle = ?, MetaDescription = ?,
                Published = ?, AllowComments = ?, PictureId = ?, 
                UpdatedOnUtc = UTC_TIMESTAMP()
            WHERE Id = ?
        `, [
            data.Title, data.ShortDescription || '', data.FullDescription || '',
            data.MetaKeywords || '', data.MetaTitle || '', data.MetaDescription || '',
            data.Published ? 1 : 0, data.AllowComments ? 1 : 0, data.PictureId || 0, id
        ]);

        // Xóa mapping cũ và thêm mới
        await connection.execute(`DELETE FROM post_postcategory_mapping WHERE PostId = ?`, [id]);

        if (data.CategoryId && parseInt(data.CategoryId) > 0) {
            await connection.execute(
                `INSERT INTO post_postcategory_mapping (PostId, PostCategoryId, DisplayOrder, IsNew) VALUES (?, ?, 0, 0)`,
                [id, parseInt(data.CategoryId)]
            );
        }

        await updateSlug(connection, id, 'Post', data.SeName);
        
        await connection.commit();
        return true;
    } catch (err) {
        if (connection) await connection.rollback();
        console.error("🔥 LỖI UPDATE_POST:", err.message);
        throw err;
    } finally {
        if (connection) connection.release();
    }
};
///sửa 1
/**
 * Lấy tất cả danh mục tin tức (Admin)
 */
exports.getAllNewsCategories = async () => {
    try {
        const [rows] = await pool.execute(`
            SELECT pc.*, u.Slug 
            FROM postcategory pc
            LEFT JOIN urlrecord u ON pc.Id = u.EntityId AND u.EntityName = 'PostCategory' AND u.IsActive = 1
            WHERE pc.Deleted = 0 
            ORDER BY pc.DisplayOrder ASC
        `);
        return rows;
    } catch (err) {
        throw err;
    }
};

/**
 * Thêm mới Danh mục
 */
exports.createNewsCategory = async (data) => { 
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.execute(`
            INSERT INTO postcategory (
                Name, Description, MetaKeywords, MetaTitle, MetaDescription, Published, 
                Deleted, DisplayOrder, CreatedOnUtc, UpdatedOnUtc,
                PostCategoryTemplateId, ShowOnHomepage, IncludeInTopMenu, SubjectToAcl, LimitedToStores
            )
            VALUES (?, ?, ?, ?, ?, ?, 0, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP(), 1, 0, 0, 0, 0)
        `, [
            data.Name, data.Description || '', data.MetaKeywords || '', 
            data.MetaTitle || data.Name, data.MetaDescription || '', 
            data.Published ?? 1, data.DisplayOrder || 0
        ]);

        const newId = result.insertId;

        if (data.Slug) {
            await connection.execute(`
                INSERT INTO urlrecord (EntityId, EntityName, Slug, IsActive, LanguageId)
                VALUES (?, 'PostCategory', ?, 1, 0)
            `, [newId, data.Slug]);
        }

        await connection.commit();
        return { success: true, id: newId };
    } catch (err) {
        if (connection) await connection.rollback();
        throw err;
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Cập nhật Danh mục
 */
exports.updateNewsCategory = async (id, data) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        await connection.execute(`
            UPDATE postcategory 
            SET Name = ?, 
                Description = ?, 
                MetaTitle = ?, 
                MetaKeywords = ?, 
                MetaDescription = ?, 
                Published = ?, 
                DisplayOrder = ?, 
                UpdatedOnUtc = UTC_TIMESTAMP()
            WHERE Id = ?
        `, [
            data.Name, data.Description || '', data.MetaTitle, 
            data.MetaKeywords, data.MetaDescription, data.Published, 
            data.DisplayOrder, id
        ]);

        if (data.Slug) {
            // Tắt tất cả slug cũ của danh mục này
            await connection.execute(
                `UPDATE urlrecord SET IsActive = 0 WHERE EntityId = ? AND EntityName = 'PostCategory'`,
                [id]
            );

            // Kiểm tra xem slug này đã tồn tại cho entity này chưa
            const [existing] = await connection.execute(
                `SELECT Id FROM urlrecord WHERE EntityId = ? AND EntityName = 'PostCategory' AND Slug = ?`,
                [id, data.Slug]
            );

            if (existing.length > 0) {
                await connection.execute(`UPDATE urlrecord SET IsActive = 1 WHERE Id = ?`, [existing[0].Id]);
            } else {
                await connection.execute(
                    `INSERT INTO urlrecord (EntityId, EntityName, Slug, IsActive, LanguageId) VALUES (?, 'PostCategory', ?, 1, 0)`,
                    [id, data.Slug]
                );
            }
        }

        await connection.commit();
        return { success: true };
    } catch (err) {
        if (connection) await connection.rollback();
        throw err;
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Xóa Danh mục (Soft Delete)
 */
exports.deleteNewsCategory = async (id) => {
    try {
        await pool.execute(`UPDATE postcategory SET Deleted = 1 WHERE Id = ?`, [id]);
        await pool.execute(`UPDATE urlrecord SET IsActive = 0 WHERE EntityId = ? AND EntityName = 'PostCategory'`, [id]);
        await pool.execute(`DELETE FROM post_postcategory_mapping WHERE PostCategoryId = ?`, [id]);
        return { success: true };
    } catch (err) {
        throw err;
    }
};

/**
 * Xóa Bài viết (Soft Delete)
 */
exports.deletePost = async (id) => {
    try {
        const [result] = await pool.execute('UPDATE post SET Deleted = 1 WHERE Id = ?', [id]);
        return result.affectedRows > 0;
    } catch (err) {
        throw err;
    }
};

/**
 * Lấy danh sách bài viết theo Slug của Danh mục (Client)
 */
exports.getPostsByCategorySlug = async (categorySlug) => {
    try {
        const query = `
            SELECT 
                p.Id, 
                p.Name as Title, 
                p.ShortDescription,
                p.CreatedOnUtc,
                p.PictureId,
                pic.MimeType,
                u_post.Slug as SeName,
                pc.Name as CategoryName,
                u_cat.Slug as CategorySlug
            FROM post p
            INNER JOIN post_postcategory_mapping pcm ON p.Id = pcm.PostId
            INNER JOIN postcategory pc ON pcm.PostCategoryId = pc.Id
            INNER JOIN urlrecord u_cat ON pc.Id = u_cat.EntityId 
                AND u_cat.EntityName = 'PostCategory' AND u_cat.IsActive = 1
            LEFT JOIN urlrecord u_post ON p.Id = u_post.EntityId 
                AND u_post.EntityName = 'Post' AND u_post.IsActive = 1
            LEFT JOIN picture pic ON p.PictureId = pic.Id
            WHERE u_cat.Slug = ? 
                AND p.Deleted = 0 
                AND p.Published = 1
            ORDER BY p.CreatedOnUtc DESC
        `;
        const [rows] = await pool.execute(query, [categorySlug]);
        return rows;
    } catch (err) {
        throw err;
    }
};

/**
 * Lấy chi tiết bài viết theo Slug (Client)
 */
exports.getPostBySlug = async (slug) => {
    try {
        const query = `
            SELECT 
                p.Id, 
                p.Name as Title, 
                p.ShortDescription, 
                p.FullDescription as Content,
                p.CreatedOnUtc,
                p.PictureId,
                p.AllowComments,
                p.MetaTitle,
                p.MetaKeywords,
                p.MetaDescription,
                pic.MimeType,
                u.Slug as SeName,
                pc.Name as CategoryName,
                u_cat.Slug as CategorySlug
            FROM post p
            INNER JOIN urlrecord u ON p.Id = u.EntityId 
                AND u.EntityName = 'Post' AND u.IsActive = 1
            LEFT JOIN picture pic ON p.PictureId = pic.Id
            LEFT JOIN post_postcategory_mapping pcm ON p.Id = pcm.PostId
            LEFT JOIN postcategory pc ON pcm.PostCategoryId = pc.Id
            LEFT JOIN urlrecord u_cat ON pc.Id = u_cat.EntityId 
                AND u_cat.EntityName = 'PostCategory' AND u_cat.IsActive = 1
            WHERE u.Slug = ? AND p.Deleted = 0
            LIMIT 1
        `;
        const [rows] = await pool.execute(query, [slug]);
        return rows[0] || null;
    } catch (err) {
        throw err;
    }
};