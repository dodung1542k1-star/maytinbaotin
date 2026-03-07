const { pool } = require('../config');
const fs = require('fs');
const path = require('path');

/**
 * 1. Lấy ảnh từ Database Binary
 */
exports.getPictureById = async (req, res) => {
    try {
        const pictureId = Number(req.params.id);
        
        // Query kết hợp lấy MimeType và BinaryData
        const [rows] = await pool.execute(`
            SELECT p.MimeType, pb.BinaryData
            FROM picture p
            JOIN picturebinary pb ON p.Id = pb.PictureId
            WHERE p.Id = ?
        `, [pictureId]);

        if (rows.length === 0) {
            return res.status(404).send('Not found');
        }

        const image = rows[0];
        res.setHeader('Content-Type', image.MimeType);
        res.end(image.BinaryData); 
    } catch (err) {
        console.error("🔥 Lỗi getPictureById:", err);
        res.status(500).send('Error');
    }
};

/**
 * 2. Upload ảnh mới: Lưu vào DB VÀ lưu file vật lý
 */
exports.uploadPictureBinary = async (req, res) => {
    let connection;
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Không có file nào được gửi lên' });
        }

        const buffer = req.file.buffer;
        const mimeType = req.file.mimetype;
        // Chuyển jpeg thành jpg để đồng nhất đuôi file nếu cần
        const fileExt = mimeType.split('/')[1].replace('jpeg', 'jpg');

        // Lấy kết nối để thực hiện Transaction
        connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Bước A: Chèn vào bảng picture
            // MySQL sử dụng AUTO_INCREMENT, lấy ID qua insertId
            const [picResult] = await connection.execute(`
                INSERT INTO picture (MimeType, SeoFilename, IsNew) 
                VALUES (?, ?, ?)
            `, [mimeType, 'post-image', 1]);
            
            const newId = picResult.insertId;

            // Bước B: Chèn vào bảng picturebinary
            // Trong MySQL, kiểu VarBinary(MAX) của MSSQL tương đương với LONGBLOB
            await connection.execute(`
                INSERT INTO picturebinary (PictureId, BinaryData) 
                VALUES (?, ?)
            `, [newId, buffer]);

            // Commit Transaction
            await connection.commit();

            // Bước C: Ghi file vật lý ra thư mục public/images
            const paddedId = newId.toString().padStart(7, '0');
            const fileName = `${paddedId}_0.${fileExt}`;
            const uploadDir = path.join(__dirname, '../public/images');
            
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const uploadPath = path.join(uploadDir, fileName);
            fs.writeFileSync(uploadPath, buffer);

            res.json({ 
                success: true, 
                pictureId: newId,
                url: `/images/${fileName}` 
            });

        } catch (err) {
            if (connection) await connection.rollback();
            throw err;
        }
    } catch (err) {
        console.error("🔥 Lỗi Upload Backend:", err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (connection) connection.release(); // Luôn giải phóng kết nối
    }
};