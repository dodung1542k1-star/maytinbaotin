const AuthModel = require('../models/auth.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const authController = {
    login: async (req, res) => {
        const { email, password } = req.body;
        // Lấy IP chuẩn hơn
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        try {
            // 1. Tìm khách hàng
            const customer = await AuthModel.findCustomerByEmail(email);
            if (!customer) {
                return res.status(401).json({ success: false, message: 'Email không tồn tại' });
            }

            // 2. Kiểm tra trạng thái
            // Lưu ý: MySQL kiểu Bit/TinyInt trả về 1 hoặc 0 (tương đương true/false trong JS)
            if (!customer.Active) {
                return res.status(403).json({ success: false, message: 'Tài khoản đang bị khóa' });
            }

            // 3. Lấy mật khẩu
            const dbPassword = await AuthModel.getLatestPassword(customer.Id);
            if (!dbPassword || !dbPassword.Password) {
                return res.status(401).json({ success: false, message: 'Dữ liệu mật khẩu không hợp lệ' });
            }

            const salt = dbPassword.PasswordSalt;
            const dbHash = dbPassword.Password.trim().toUpperCase();

            // Logic băm SHA512 (Giữ nguyên như cũ của bạn)
            const hashSHA512 = crypto.createHash('sha512')
                                     .update(password + salt)
                                     .digest('hex')
                                     .toUpperCase();

            const hashSHA256 = crypto.createHash('sha256')
                                     .update(password + salt)
                                     .digest('hex')
                                     .toUpperCase();

            const isMatch = (hashSHA512 === dbHash || hashSHA256 === dbHash);

            if (!isMatch) {
                await AuthModel.updateLoginStatus(customer.Id, false);
                return res.status(401).json({ success: false, message: 'Mật khẩu không đúng' });
            }

            // 4. JWT Token
            const roles = await AuthModel.getCustomerRoles(customer.Id);
            const token = jwt.sign(
                { id: customer.Id, roles, email: customer.Email },
                process.env.JWT_SECRET || 'BAOTIN_SECRET_KEY',
                { expiresIn: '24h' }
            );

            // 5. Cập nhật & Log
            await AuthModel.updateLoginStatus(customer.Id, true);
            
            try {
                await AuthModel.saveLog({
                    shortMessage: `Đăng nhập thành công: ${email}`,
                    fullMessage: `User ID: ${customer.Id} login thành công từ IP: ${ipAddress}`,
                    ipAddress,
                    customerId: customer.Id,
                    pageUrl: '/api/auth/login'
                });
            } catch (e) { console.error("Lỗi lưu log:", e.message); }

            return res.json({
                success: true,
                message: 'Đăng nhập thành công',
                token,
                user: {
                    id: customer.Id,
                    name: `${customer.FirstName || ''} ${customer.LastName || ''}`.trim() || customer.Username,
                    roles
                }
            });

        } catch (error) {
            console.error('🔥 Lỗi MySQL Login:', error);
            return res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
        }
    }
};

module.exports = authController;