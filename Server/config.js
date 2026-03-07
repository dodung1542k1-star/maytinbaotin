const mysql = require('mysql2/promise');
require('dotenv').config();

// Cấu hình kết nối lấy từ file .env
const config = {
    host: process.env.DB_SERVER || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'maytinhbaotin_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+07:00' ,
    multipleStatements: true
};

// Tạo pool kết nối ngay lập tức
const pool = mysql.createPool(config);

/**
 * Hàm connectDB để giữ tương thích với code cũ của bạn
 * Giúp kiểm tra kết nối khi khởi động server
 */
async function connectDB() {
    try {
        const connection = await pool.getConnection();
        console.log(`✅ KẾT NỐI MYSQL THÀNH CÔNG: ${config.database}`);
        connection.release();
        return pool;
    } catch (err) {
        console.error('❌ KẾT NỐI MYSQL THẤT BẠI:', err.message);
        // Không nên throw err ở đây để tránh sập app ngay lập tức nếu muốn xử lý riêng
        return null;
    }
}

/**
 * Export đầy đủ:
 * 1. connectDB: Để chạy lúc khởi động app (trong index.js)
 * 2. pool: Để dùng trong các Model (pool.execute)
 * 3. sql: Chính là thư viện mysql2 (để thay thế mssql cũ)
 */
module.exports = { 
    connectDB, 
    pool, 
    sql: mysql 
};