const { pool } = require('../config'); 

const Warranty = {
    search: async (type, value) => {
        let field = "";
        if (type === 'phone') field = "phone_number";
        else if (type === 'serial') field = "serial_number";
        else if (type === 'code') field = "warranty_code";
        else throw new Error("Loại tra cứu không hợp lệ");
        
        const sql = `SELECT * FROM warranties WHERE ${field} = ?`;
        const [rows] = await pool.execute(sql, [value]);
        return rows;
    },

    getAll: async () => {
        const sql = "SELECT * FROM warranties ORDER BY created_at DESC";
        const [rows] = await pool.execute(sql);
        return rows;
    },

    create: async (data) => {
        const sql = `INSERT INTO warranties 
        (customer_name, phone_number, serial_number, warranty_code, product_name, purchase_date, expiry_date, status, note) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const params = [
            data.customer_name, 
            data.phone_number, 
            data.serial_number, 
            data.warranty_code, 
            data.product_name, 
            data.purchase_date, 
            data.expiry_date, 
            data.status || 'Bình thường', 
            data.note || ''
        ];
        return await pool.execute(sql, params);
    },

    update: async (id, data) => {
        const sql = `UPDATE warranties SET 
        customer_name=?, phone_number=?, serial_number=?, warranty_code=?, product_name=?, purchase_date=?, expiry_date=?, status=?, note=? 
        WHERE id=?`;
        
        const params = [
            data.customer_name, data.phone_number, data.serial_number, 
            data.warranty_code, data.product_name, data.purchase_date, 
            data.expiry_date, data.status, data.note, id
        ];
        return await pool.execute(sql, params);
    },

    delete: async (id) => {
        const sql = "DELETE FROM warranties WHERE id = ?";
        return await pool.execute(sql, [id]);
    }
};

module.exports = Warranty;