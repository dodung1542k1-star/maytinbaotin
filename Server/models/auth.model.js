const { pool } = require('../config'); // Đảm bảo config này xuất ra mysql2 pool

const AuthModel = {
    findCustomerByEmail: async (email) => {
        // MySQL: Dùng LIMIT 1 thay cho TOP 1
        const [rows] = await pool.execute(`
            SELECT Id, Username, Email, Active, Deleted, FirstName, LastName
            FROM customer 
            WHERE Email = ? AND Deleted = 0 
            LIMIT 1
        `, [email]);
        return rows[0];
    },

    getLatestPassword: async (customerId) => {
        // MySQL: ORDER BY phải đứng trước LIMIT 1
        const [rows] = await pool.execute(`
            SELECT Password, PasswordSalt, PasswordFormatId
            FROM customerpassword
            WHERE CustomerId = ?
            ORDER BY CreatedOnUtc DESC 
            LIMIT 1
        `, [customerId]);
        return rows[0];
    },

    getCustomerRoles: async (customerId) => {
        const [rows] = await pool.execute(`
            SELECT cr.SystemName
            FROM customerrole cr
            JOIN customer_customerrole_mapping ccrm ON cr.Id = ccrm.CustomerRole_Id
            WHERE ccrm.Customer_Id = ? AND cr.Active = 1
        `, [customerId]);
        return rows.map(row => row.SystemName);
    },

    saveLog: async (logData) => {
        const { shortMessage, fullMessage, ipAddress, customerId, pageUrl } = logData;
        // MySQL: Dùng UTC_TIMESTAMP() thay cho GETUTCDATE()
        await pool.execute(`
            INSERT INTO log (ShortMessage, IpAddress, CustomerId, LogLevelId, FullMessage, PageUrl, CreatedOnUtc)
            VALUES (?, ?, ?, 10, ?, ?, UTC_TIMESTAMP())
        `, [shortMessage, ipAddress, customerId, fullMessage, pageUrl]);
    },

    updateLoginStatus: async (customerId, isSuccess) => {
        if (isSuccess) {
            await pool.execute(`
                UPDATE customer 
                SET FailedLoginAttempts = 0, LastLoginDateUtc = UTC_TIMESTAMP() 
                WHERE Id = ?
            `, [customerId]);
        } else {
            // MySQL: Không dùng += được trong chuỗi query trực tiếp, dùng cột = cột + 1
            await pool.execute(`
                UPDATE customer 
                SET FailedLoginAttempts = FailedLoginAttempts + 1 
                WHERE Id = ?
            `, [customerId]);
        }
    }
};

module.exports = AuthModel;