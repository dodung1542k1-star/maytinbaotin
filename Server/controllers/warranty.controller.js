const Warranty = require('../models/warranty.model');
const xlsx = require('xlsx');

const warrantyController = {
    // 1. Tra cứu cho khách hàng
    searchWarranty: async (req, res) => {
        try {
            const { type, value } = req.query;
            const data = await Warranty.search(type, value);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 2. Lấy tất cả danh sách (Admin) - GIẢI QUYẾT LỖI 404
    getAllWarranty: async (req, res) => {
        try {
            const data = await Warranty.getAll();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 3. Tạo phiếu mới
    createWarranty: async (req, res) => {
        try {
            await Warranty.create(req.body);
            res.json({ success: true, message: "Thêm thành công!" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 4. Cập nhật phiếu
    updateWarranty: async (req, res) => {
        try {
            await Warranty.update(req.params.id, req.body);
            res.json({ success: true, message: "Cập nhật thành công!" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 5. Xóa phiếu
    deleteWarranty: async (req, res) => {
        try {
            await Warranty.delete(req.params.id);
            res.json({ success: true, message: "Xóa thành công!" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 6. Nhập từ file Excel
    importExcel: async (req, res) => {
        try {
            if (!req.file) return res.status(400).json({ message: "Chưa có file nào được tải lên!" });

            const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

            for (const row of sheetData) {
                // Map dữ liệu từ file Excel vào DB
                await Warranty.create({
                    customer_name: row['Họ tên'],
                    phone_number: row['Số điện thoại'],
                    serial_number: row['Số Serial'],
                    warranty_code: row['Mã phiếu'],
                    product_name: row['Tên sản phẩm'],
                    purchase_date: row['Ngày mua'], // Định dạng YYYY-MM-DD
                    expiry_date: row['Ngày hết hạn'],
                    status: row['Trạng thái'] || 'Bình thường',
                    note: row['Ghi chú'] || ''
                });
            }

            res.json({ success: true, message: `Import thành công ${sheetData.length} dòng!` });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi file Excel: " + error.message });
        }
    }
};

module.exports = warrantyController;