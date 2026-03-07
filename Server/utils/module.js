// controllers/category.controller.js
const { getEntityBySlug } = require('../models/urlRecord.model');
const { getProductById } = require('../models/product.model');
const { buildCategoryTree } = require('../utils/categoryTree');

// Import tất cả các hàm từ model category
const categoryModel = require('../models/category.model');

/**
 * Điều hướng theo Slug (Dùng cho Client)
 */
exports.resolveSlug = async (req, res) => {
    const { slug } = req.params;
    if (['favicon.ico', 'robots.txt'].includes(slug)) return res.status(404).json({ success: false });

    try {
        const entity = await getEntityBySlug(slug);
        if (!entity) return res.status(404).json({ success: false, message: 'Không tìm thấy trang' });

        if (entity.EntityName === 'Category') return this.getCategoryDetail(entity.EntityId, res);
        if (entity.EntityName === 'Product') return this.getProductDetail(entity.EntityId, res);

        res.status(404).json({ success: false, message: 'Loại entity không hỗ trợ' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

/**
 * Lấy Cây Danh Mục (Dùng cho Admin và Menu)
 */
exports.getCategoryTree = async (req, res) => {
    try {
        // Sử dụng hàm lấy tất cả từ model
        const categories = await categoryModel.getCategoryTreeAdmin(); 
        const tree = buildCategoryTree(categories);
        res.json({ success: true, data: tree });
    } catch (err) {
        console.error('getCategoryTree error:', err);
        res.status(500).json({ success: false });
    }
};

/**
 * Lấy Chi Tiết Danh Mục Để Sửa (Dùng cho Admin Form)
 */
exports.getCategoryById = async (req, res) => {
    try {
        const data = await categoryModel.getCategoryById(req.params.id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Danh mục không tồn tại'
            });
        }

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


/**
 * Tạo Mới Danh Mục
 */
exports.createCategory = async (req, res) => {
    try {
        const result = await categoryModel.createCategory(req.body);
        res.json(result); // Trả về { success: true, id: ... }
    } catch (err) {
        console.error('createCategory error:', err);
        // Trả về lỗi chi tiết để React biết lỗi gì
        res.status(500).json({ success: false, error: err.message });
    }
};


// xoá danh mục
exports.deleteCategory = async (req, res) => {
    try {
        const id = parseInt(req.params.id); // Ép kiểu số để tránh lỗi query mssql
        
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
        }

        await categoryModel.deleteCategory(id);

        res.json({
            success: true,
            message: 'Xóa danh mục thành công'
        });
    } catch (err) {
        console.error('Delete Error:', err.message);
        // Trả về message lỗi từ throw Error trong Model (ví dụ: "còn danh mục con")
        res.status(400).json({
            success: false,
            message: err.message 
        });
    }
};

/**
 * Cập Nhật Danh Mục (Sửa lỗi không lưu thông tin)
 */
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        await categoryModel.updateCategory(id, data);
        res.json({ success: true });
    } catch (err) {
        console.error('updateCategory error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Chi Tiết Danh Mục (Cho trang danh sách sản phẩm Client)
 */
exports.getCategoryDetail = async (categoryId, res) => {
    try {
        const category = await categoryModel.getCategoryByIdAdmin(categoryId);
        if (!category) return res.status(404).json({ success: false, message: 'Danh mục không tồn tại' });

        const subCategories = await categoryModel.getSubCategories(categoryId);
        const products = await categoryModel.getProductsInCategory(categoryId);

        res.json({
            success: true,
            data: {
                type: 'category',
                category: { id: categoryId, name: category.Name },
                subCategories: subCategories.map(sc => ({ name: sc.Name, slug: sc.Slug })),
                products: products.map(p => ({
                    id: p.Id, name: p.Name, price: p.Price, oldPrice: p.OldPrice || null, slug: p.Slug
                }))
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi tải danh mục' });
    }
};

/**
 * Chi Tiết Sản Phẩm (Dùng cho Client)
 */
exports.getProductDetail = async (productId, res) => {
    try {
        const product = await getProductById(productId);
        if (!product) return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });

        res.json({
            success: true,
            data: {
                type: 'product',
                product: {
                    id: product.Id,
                    name: product.Name,
                    price: product.Price,
                    oldPrice: product.OldPrice || null,
                    shortDescription: product.ShortDescription || null,
                    fullDescription: product.FullDescription || null
                }
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi tải sản phẩm' });
    }
};

/**
 * Lấy danh mục và sản phẩm hiển thị tại Trang Chủ
 */
exports.getHomeData = async (req, res) => {
    try {
        const rawData = await categoryModel.getHomeCategoriesWithProducts();

        // Xử lý logic tạo ImageUrl cho từng sản phẩm
        const data = rawData.map(category => ({
            ...category,
            products: category.products.map(product => {
                let imageUrl = null;

                if (product.PictureId && product.MimeType) {
                    // Logic giống hệt phần Post: padStart 7 chữ số + đuôi file
                    const extension = product.MimeType.split('/')[1] || 'jpg';
                    const fileName = product.PictureId.toString().padStart(7, '0');
                    imageUrl = `/images/${fileName}_0.${extension}`;
                } else {
                    imageUrl = '/images/default-product.jpg'; // Ảnh mặc định
                }

                return {
                    id: product.Id,
                    name: product.Name,
                    price: product.Price,
                    oldPrice: product.OldPrice,
                    slug: product.Slug,
                    imageUrl: imageUrl // Trả về đường dẫn đã xử lý
                };
            })
        }));

        res.json({ success: true, data });
    } catch (err) {
        console.error('getHomeData error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};