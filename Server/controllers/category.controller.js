const { getEntityBySlug } = require('../models/urlRecord.model');
const { getProductById } = require('../models/product.model');
const { buildCategoryTree } = require('../utils/categoryTree');
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

        // Dùng 'exports' thay vì 'this' để gọi các hàm cùng file một cách an toàn
        if (entity.EntityName === 'Category') return exports.getCategoryDetail(entity.EntityId, res);
        if (entity.EntityName === 'Product') return exports.getProductDetail(entity.EntityId, res);

        res.status(404).json({ success: false, message: 'Loại entity không hỗ trợ' });
    } catch (err) {
        console.error('🔥 ResolveSlug Error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

/**
 * Lấy Cây Danh Mục
 */
exports.getCategoryTree = async (req, res) => {
    try {
        const categories = await categoryModel.getCategoryTreeAdmin(); 
        const tree = buildCategoryTree(categories);
        res.json({ success: true, data: tree });
    } catch (err) {
        console.error('getCategoryTree error:', err);
        res.status(500).json({ success: false });
    }
};

/**
 * Lấy Chi Tiết Danh Mục Để Sửa
 */
exports.getCategoryById = async (req, res) => {
    try {
        const data = await categoryModel.getCategoryById(req.params.id);
        if (!data) return res.status(404).json({ success: false, message: 'Danh mục không tồn tại' });
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Tạo Mới
 */
exports.createCategory = async (req, res) => {
    try {
        const result = await categoryModel.createCategory(req.body);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Xóa Danh Mục
 */
exports.deleteCategory = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
        await categoryModel.deleteCategory(id);
        res.json({ success: true, message: 'Xóa thành công' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

/**
 * Cập Nhật
 */
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await categoryModel.updateCategory(id, req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Chi Tiết Danh Mục (Client)
 */
exports.getCategoryDetail = async (categoryId, res) => {
    try {
        const category = await categoryModel.getCategoryById(categoryId);
        if (!category) return res.status(404).json({ success: false, message: 'Danh mục không tồn tại' });

        const subCategories = await categoryModel.getSubCategories(categoryId);
        const products = await categoryModel.getProductsInCategory(categoryId);

        res.json({
            success: true,
            data: {
                type: 'category',
                category: { id: categoryId, name: category.Name, slug: category.Slug },
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
 * Chi Tiết Sản Phẩm (Client)
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
                    id: product.Id, name: product.Name, price: product.Price,
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
 * Trang Chủ
 */
const path = require('path');
const fs = require('fs');

exports.getHomeData = async (req, res) => {
    try {

        const rawData = await categoryModel.getHomeCategoriesWithProducts();
        const imagesDir = path.join(__dirname, '../public/images');

        const data = rawData.map(category => ({
            ...category,
            products: category.products.map(product => {

                let imageUrl = '/images/default-image.png';

                if (product.PictureId) {

                    const paddedId = product.PictureId
                        .toString()
                        .padStart(7, '0');

                    const baseFileName = `${paddedId}_0`;

                    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
                    let foundExtension = '';

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

                return {
                    id: product.Id,
                    name: product.Name,
                    price: Math.round(product.Price || 0),
                    oldPrice: Math.round(product.OldPrice || 0),
                    slug: product.Slug,
                    imageUrl
                };
            })
        }));

        res.json({ success: true, data });

    } catch (err) {
        console.error("HOME DATA ERROR:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// Thêm hàm này vào controller của bạn
exports.reorderCategories = async (req, res) => {
    try {
        const { orders } = req.body;

        if (!orders || !Array.isArray(orders)) {
            return res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ" });
        }

        const updatePromises = orders.map(item => 
            categoryModel.updateCategoryOrder(item.id, item.position)
        );

        await Promise.all(updatePromises);

        res.status(200).json({ success: true, message: 'Cập nhật thành công' });
    } catch (error) {
        console.error("LỖI SERVER:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};