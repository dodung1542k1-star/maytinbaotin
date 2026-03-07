const PostModel = require('../models/post.model');
const { pool } = require('../config'); // Đã đổi từ { sql, connectDB } sang pool
const fs = require('fs');
const path = require('path');

/**
 * Lấy chi tiết bài viết theo Slug (Dùng cho trang chi tiết tin tức)
 */
exports.getPostByIdNew = async (req, res) => {
    try {
        const { slug } = req.params; 

        const [rows] = await pool.execute(`
            SELECT 
                p.Id,
                p.Name AS Title,
                p.FullDescription AS FullContent, -- Đổi từ p.Body sang FullDescription cho khớp DB NopCommerce
                p.ShortDescription,
                p.CreatedOnUtc,
                u.Slug, 
                pic.Id AS PictureId,
                pic.MimeType
            FROM post p
            LEFT JOIN picture pic ON p.PictureId = pic.Id
            LEFT JOIN urlrecord u ON p.Id = u.EntityId AND u.EntityName = 'Post' AND u.IsActive = 1
            WHERE u.Slug = ? AND p.Deleted = 0 AND p.Published = 1
            LIMIT 1
        `, [slug]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
        }

        const post = rows[0];
        
        // --- Xử lý logic ảnh ---
        let imageUrl = '/images/default.jpg';
        if (post.PictureId) {
            let extension = 'jpg';
            if (post.MimeType) {
                const parts = post.MimeType.toLowerCase().split('/');
                if (parts.length > 1) extension = parts[1].replace('jpeg', 'jpg');
            }
            // Logic padding ID thành 7 chữ số (Ví dụ: 522 -> 0000522)
            const paddedId = post.PictureId.toString().split(',')[0].padStart(7, '0');
            imageUrl = `/images/${paddedId}_0.${extension}`;
        }

        res.json({
            success: true,
            data: {
                id: post.Id,
                title: post.Title,
                slug: post.Slug,
                content: post.FullContent,
                createdOn: post.CreatedOnUtc,
                imageUrl: imageUrl
            }
        });

    } catch (err) {
        console.error('🔥 Lỗi getPostByIdNew:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

/**
 * Lấy 4 bài viết mới nhất (Dùng cho Widget trang chủ)
 */
exports.getLatestPosts = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT 
                p.Id,
                IFNULL(p.Name, '') AS Title,
                IFNULL(p.ShortDescription, '') AS ShortDescription,
                p.CreatedOnUtc,
                pic.Id AS PictureId,
                pic.MimeType,
                u.Slug AS SeName 
            FROM post p
            LEFT JOIN picture pic ON p.PictureId = pic.Id
            LEFT JOIN urlrecord u ON p.Id = u.EntityId AND u.EntityName = 'Post' AND u.IsActive = 1
            WHERE p.Deleted = 0 AND p.Published = 1
            ORDER BY p.CreatedOnUtc DESC
            LIMIT 4
        `);

        const posts = rows.map(post => {
            let ext = 'jpg';
            if (post.MimeType) {
                const mime = post.MimeType.toLowerCase();
                if (mime.includes('png')) ext = 'png';
                else if (mime.includes('jpeg')) ext = 'jpeg';
                else if (mime.includes('jpg')) ext = 'jpg';
            }

            const paddedId = String(post.PictureId || 0).padStart(7, '0');
            const imageUrl = post.PictureId ? `/images/${paddedId}_0.${ext}` : '/images/default.jpg';

            return {
                id: post.Id,
                title: post.Title,
                shortDescription: post.ShortDescription,
                createdOn: post.CreatedOnUtc,
                imageUrl: imageUrl,
                slug: post.SeName
            };
        });

        res.json({ success: true, data: posts });

    } catch (err) {
        console.error('🔥 Lỗi getLatestPosts:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

/**
 * Lấy tất cả bài viết (Admin)
 */
exports.getAllPosts = async (req, res) => {
    try {
        const posts = await PostModel.getAllPosts();
        res.json({ success: true, data: posts });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Lấy danh mục bài viết theo ID
 */
exports.getNewsCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute(`
            SELECT pc.*, u.Slug 
            FROM postcategory pc
            LEFT JOIN urlrecord u ON pc.Id = u.EntityId AND u.EntityName = 'PostCategory' AND u.IsActive = 1
            WHERE pc.Id = ? AND pc.Deleted = 0
        `, [id]);
            
        if (rows.length > 0) {
            res.json({ success: true, data: rows[0] });
        } else {
            res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

/**
 * Lấy danh sách tất cả danh mục
 */
exports.getNewsCategories = async (req, res) => {
    try {
        const categories = await PostModel.getAllNewsCategories();
        res.json({ success: true, data: categories });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách' });
    }
};

/**
 * Tạo danh mục bài viết
 */
exports.createNewsCategory = async (req, res) => {
    try {
        const result = await PostModel.createNewsCategory(req.body);
        res.json({ success: true, message: 'Thêm danh mục thành công', id: result.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server khi thêm' });
    }
};

/**
 * Cập nhật danh mục
 */
exports.updateNewsCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await PostModel.updateNewsCategory(id, req.body);
        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật' });
    }
};

/**
 * Xóa danh mục
 */
exports.deleteNewsCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await PostModel.deleteNewsCategory(id);
        res.json({ success: true, message: 'Xóa thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa' });
    }
};

//lần 1
/**
 * Xóa hàng loạt bài viết
 */
exports.deleteNew = async (req, res) => {
    try {
        const { ids } = req.body; 

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Mảng ID trống' });
        }

        // MySQL xử lý IN query an toàn hơn với mảng số
        const cleanIds = ids.map(id => Number(id)).filter(id => !isNaN(id));
        
        if (cleanIds.length === 0) {
            return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
        }

        // Sử dụng dấu hỏi chấm để tránh SQL Injection
        const query = `UPDATE post SET Deleted = 1 WHERE Id IN (${cleanIds.join(',')})`;
        await pool.execute(query);

        res.json({ success: true, message: 'Xóa thành công!' });
    } catch (error) {
        console.error('🔥 Lỗi deleteNew:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Lấy dữ liệu trang chủ: Nhóm bài viết theo danh mục (Kèm kiểm tra file ảnh)
 */
exports.getAllDataHome = async (req, res) => {
    try {
        const rawData = await PostModel.getAllCategoriesWithPosts();
        const imagesDir = path.join(__dirname, '../public/images'); 

        const groupedData = rawData.reduce((acc, item) => {
            let category = acc.find(c => c.id === item.CategoryId);

            if (!category) {
                category = {
                    id: item.CategoryId,
                    name: item.CategoryName,
                    slug: item.CategorySlug,
                    posts: []
                };
                acc.push(category);
            }

            if (item.PostId) {
                let imageUrl = '/images/default.jpg';
                
                if (item.PictureId) {
                    const paddedId = item.PictureId.toString().padStart(7, '0');
                    const baseFileName = `${paddedId}_0`;
                    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
                    let foundExtension = '';

                    // Kiểm tra file vật lý trên server
                    for (const ext of extensions) {
                        const filePath = path.join(imagesDir, `${baseFileName}.${ext}`);
                        if (fs.existsSync(filePath)) {
                            foundExtension = ext;
                            break;
                        }
                    }

                    if (foundExtension) {
                        imageUrl = `/images/${baseFileName}.${foundExtension}`;
                    }
                }

                category.posts.push({
                    id: item.PostId,
                    title: item.PostTitle,
                    shortDescription: item.ShortDescription,
                    slug: item.PostSlug,
                    createdOn: item.CreatedOnUtc,
                    imageUrl: imageUrl
                });
            }
            return acc;
        }, []);

        res.json({ success: true, data: groupedData });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Bộ giải mã Slug (Dynamic Resolver) 
 * Giúp xác định Slug là Sản phẩm, Danh mục hay Bài viết
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
            return res.json({ success: true, type: 'product', data: products[0] });
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
            return res.json({ success: true, type: 'category', data: categories[0] });
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
            return res.json({ success: true, type: 'post', data: posts[0] });
        }

        // 4. Kiểm tra DANH MỤC TIN TỨC (PostCategory)
        const [postCats] = await pool.execute(`
            SELECT pc.Id, pc.Name
            FROM postcategory pc
            JOIN urlrecord u ON pc.Id = u.EntityId
            WHERE u.Slug = ? AND u.EntityName = 'PostCategory' AND u.IsActive = 1
            LIMIT 1
        `, [slug]);

        if (postCats.length > 0) {
            return res.json({ success: true, type: 'post_category', data: postCats[0] });
        }

        return res.status(404).json({ success: false, message: 'Slug không tồn tại' });
    } catch (err) {
        console.error('🔥 Resolve slug error:', err);
        res.status(500).json({ success: false });
    }
};
// Map nốt các hàm còn lại từ exports cũ
exports.getPostById = async (req, res) => {
    try {
        const post = await PostModel.getPostById(req.params.id);
        if (post) res.json({ success: true, data: post });
        else res.status(404).json({ success: false, message: 'Không tìm thấy' });
    } catch (err) { res.status(500).json({ success: false, message: 'Lỗi server' }); }
};

exports.updatePostInfo = async (req, res) => {
    try {
        const isUpdated = await PostModel.updatePost(req.params.id, req.body);
        if (isUpdated) res.json({ success: true, message: 'Cập nhật thành công!' });
        else res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createPostInfo = async (req, res) => {
    try {
        const newId = await PostModel.createPost(req.body);
        res.json({ success: true, message: 'Thêm mới thành công!', id: newId });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
//lần 2
// backend controller
/**
 * Lấy danh sách bài viết theo Slug của danh mục
 */
exports.getPostsByCategory = async (req, res) => {
    try {
        const { slug } = req.params;
        const rawPosts = await PostModel.getPostsByCategorySlug(slug);

        const formattedPosts = rawPosts.map(post => {
            let ext = 'jpg'; 
            if (post.MimeType) {
                const mime = post.MimeType.toLowerCase();
                if (mime.includes('png')) ext = 'png';
                else if (mime.includes('jpeg')) ext = 'jpeg'; 
                else if (mime.includes('jpg')) ext = 'jpg';
            }

            const paddedId = String(post.PictureId || 0).padStart(7, '0');
            const imageUrl = post.PictureId ? `/images/${paddedId}_0.${ext}` : '/images/default.jpg';

            return {
                id: post.Id,
                title: post.Title,
                createdOn: post.CreatedOnUtc,
                imageUrl: imageUrl,
                categoryName: post.CategoryName 
            };
        });

        res.json({
            success: true,
            data: {
                category: { Name: formattedPosts.length > 0 ? formattedPosts[0].categoryName : 'Tin tức' },
                posts: formattedPosts
            }
        });
    } catch (error) {
        console.error('🔥 Lỗi getPostsByCategory:', error);
        res.status(500).json({ success: false });
    }
};

/**
 * Lấy chi tiết bài viết theo Slug (Client)
 */
exports.getPostBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const post = await PostModel.getPostBySlug(slug);

        if (!post) {
            return res.status(404).json({ success: false });
        }

        let ext = 'jpg';
        if (post.MimeType) {
            const mime = post.MimeType.toLowerCase();
            if (mime.includes('png')) ext = 'png';
            else if (mime.includes('jpeg')) ext = 'jpeg';
            else if (mime.includes('jpg')) ext = 'jpg';
        }

        const paddedId = String(post.PictureId || 0).padStart(7, '0');
        const imageUrl = post.PictureId ? `/images/${paddedId}_0.${ext}` : '/images/default.jpg';

        res.json({
            success: true,
            data: {
                id: post.Id,
                title: post.Title,
                slug: post.SeName,
                shortDescription: post.ShortDescription,
                content: post.Content,
                createdOn: post.CreatedOnUtc,
                metaTitle: post.MetaTitle,
                metaDescription: post.MetaDescription,
                imageUrl,
                category: {
                    name: post.CategoryName,
                    slug: post.CategorySlug,
                },
            },
        });
    } catch (error) {
        console.error('🔥 Lỗi getPostBySlug:', error);
        res.status(500).json({ success: false });
    }
};

/**
 * Đồng bộ Comment từ Facebook (Sử dụng Transaction MySQL)
 */
exports.syncComments = async (req, res) => {
    const { postId, fbUserId, fullName, email, avatar, commentText } = req.body;

    if (!postId || !fbUserId) {
        return res.status(400).json({ success: false, message: "Thiếu PostId hoặc Facebook UserId" });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        let customerId;
        const userEmail = email || `${fbUserId}@facebook.com`;

        // 1. Kiểm tra hoặc tạo mới Customer
        const [checkUser] = await connection.execute(
            `SELECT Id FROM customer WHERE SystemName = ? OR Email = ? LIMIT 1`,
            [fbUserId, userEmail]
        );

        if (checkUser.length > 0) {
            customerId = checkUser[0].Id;
        } else {
            // MySQL sử dụng insertId thay vì OUTPUT INSERTED.Id
            // NEWID() của MSSQL thay bằng UUID()
            const [newUser] = await connection.execute(`
                INSERT INTO customer (FirstName, Email, SystemName, Active, Deleted, CreatedOnUtc, CustomerGuid, MustChangePassword)
                VALUES (?, ?, ?, 1, 0, UTC_TIMESTAMP(), UUID(), 0)
            `, [fullName || 'Facebook User', userEmail, fbUserId]);
            
            customerId = newUser.insertId;
        }

        // 2. Lưu thông tin ảnh vào bảng Picture
        await connection.execute(`
            INSERT INTO picture (VirtualPath, SeoFilename, MimeType, IsNew)
            VALUES (?, ?, 'image/jpeg', 1)
        `, [avatar || '', `fb_user_${fbUserId}`]);

        // 3. Lưu vào bảng PostComment
        await connection.execute(`
            INSERT INTO postcomment (StoreId, CustomerId, PostId, CommentText, IsApproved, CreatedOnUtc)
            VALUES (1, ?, ?, ?, 1, UTC_TIMESTAMP())
        `, [customerId, postId, commentText || 'Đã bình luận qua Facebook']);

        // 4. Đánh dấu bài viết có comment mới
        await connection.execute(
            `UPDATE post SET HasNewComment = 1 WHERE Id = ?`,
            [postId]
        );

        await connection.commit();
        res.json({ success: true, message: "Đồng bộ thành công" });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("🔥 Transaction Error:", err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (connection) connection.release();
    }
};