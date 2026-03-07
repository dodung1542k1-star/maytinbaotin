const seoService = require('../models/seo.model');

const seoController = {
    getSeoSettings: async (req, res) => {
        try {
            const data = await seoService.getHomePageSeo();
            res.json(data);
        } catch (err) {
            res.status(500).json({ message: 'Lỗi', error: err.message });
        }
    },
    saveSeoSettings: async (req, res) => {
        try {
            const { title, description, keywords } = req.body;
            await seoService.updateHomePageSeo({ title, description, keywords });
            res.json({ message: 'Thành công' });
        } catch (err) {
            res.status(500).json({ message: 'Lỗi', error: err.message });
        }
    }
};

const footerController = {
    getFooterMenu: async (req, res) => {
        try {
            const data = await seoService.getFooterMenu();
            res.json(data);
        } catch (err) {
            res.status(500).json({ message: 'Lỗi', error: err.message });
        }
    },
    // --- THÊM MỚI: Lấy chi tiết 1 bài viết để sửa ---
    getTopicDetail: async (req, res) => {
        try {
            const data = await seoService.getTopicById(req.params.id);
            if (!data) return res.status(404).json({ message: 'Không tìm thấy dữ liệu' });
            
            // Trả về toàn bộ data, React sẽ hứng theo tên cột của SQL (viết hoa chữ cái đầu)
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    getTopicBySlug: async (req, res) => {
        try {
            const data = await seoService.getTopicBySlug(req.params.slug);
            if (!data) return res.status(404).json({ message: 'Không thấy bài viết' });
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    createTopic: async (req, res) => {
        try {
            await seoService.createTopic(req.body); // Service đã lo phần connectDB và SQL
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    },
    // --- THÊM MỚI: Lưu cập nhật bài viết ---
    updateTopic: async (req, res) => {
        try {
            await seoService.updateTopic(req.body);
            res.json({ message: 'Cập nhật bài viết thành công' });
        } catch (err) {
            res.status(500).json({ message: 'Lỗi', error: err.message });
        }
    },
    deleteTopic: async (req, res) => {
    try {
        const { id } = req.params;
        await seoService.deleteTopic(id);
        res.json({ success: true, message: 'Xóa bài viết thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
};

module.exports = {
    seoController,
    footerController
};