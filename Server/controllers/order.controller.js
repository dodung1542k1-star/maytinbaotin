const { pool } = require('../config');
const payOS = require("../payos"); 
const path = require('path');
const fs = require('fs');

/**
 * Lấy danh sách đơn hàng kèm bộ lọc nâng cao
 */
exports.getOrders = async (req, res) => {
    try {
        // Đảm bảo page và pageSize là số nguyên
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.max(1, parseInt(req.query.pageSize) || 10);
        const offset = (page - 1) * pageSize;

        const { customerName, orderId, orderStatusId } = req.query;
        
        // Điều kiện lọc
        let filterSql = ` WHERE o.Deleted = 0`;
        let params = [];
        
        if (customerName) {
            filterSql += ` AND (c.Email LIKE ? OR ba.FirstName LIKE ? OR ba.LastName LIKE ?)`;
            const searchName = `%${customerName}%`;
            params.push(searchName, searchName, searchName);
        }
        if (orderId) {
            filterSql += ` AND o.Id = ?`;
            params.push(orderId);
        }
        if (orderStatusId && orderStatusId !== '0') {
            filterSql += ` AND o.OrderStatusId = ?`;
            params.push(orderStatusId);
        }

        // 1. LẤY TỔNG SỐ DÒNG
        const countQuery = `
            SELECT COUNT(o.Id) AS total 
            FROM \`order\` o
            LEFT JOIN customer c ON o.CustomerId = c.Id
            LEFT JOIN address ba ON o.BillingAddressId = ba.Id
            ${filterSql}`;
        
        // Sử dụng execute cho query đếm
        const [countResult] = await pool.execute(countQuery, params);
        const totalItems = countResult[0].total;

        // 2. LẤY DỮ LIỆU PHÂN TRANG
        // Quan trọng: offset và pageSize PHẢI là kiểu Number
        let dataParams = [...params, offset, pageSize]; 
        
        let dataQuery = `
            SELECT 
                o.Id, o.CustomOrderNumber, o.OrderStatusId, o.PaymentStatusId,
                o.ShippingStatusId, o.OrderTotal, o.CreatedOnUtc,
                IFNULL(c.Email, 'N/A') AS CustomerEmail,
                COALESCE(CONCAT(ba.FirstName, ' ', ba.LastName), CONCAT(c.FirstName, ' ', c.LastName), 'Khách vãng lai') AS CustomerFullName,
                (SELECT SUM((oi.PriceExclTax - (IFNULL(p.ProductCost, 0) * oi.Quantity))) 
                 FROM orderitem oi 
                 JOIN product p ON oi.ProductId = p.Id 
                 WHERE oi.OrderId = o.Id) AS TotalProfit
            FROM \`order\` o
            LEFT JOIN customer c ON o.CustomerId = c.Id
            LEFT JOIN address ba ON o.BillingAddressId = ba.Id
            ${filterSql}
            ORDER BY o.CreatedOnUtc DESC
            LIMIT ?, ?
        `;

        // Thực hiện truy vấn lấy dữ liệu
        const [rows] = await pool.query(dataQuery, dataParams);

        res.json({ 
            success: true, 
            data: rows,
            pagination: {
                totalItems,
                totalPages: Math.ceil(totalItems / pageSize),
                currentPage: page,
                pageSize: pageSize
            },
            summary: {
                totalProfit: rows.reduce((sum, item) => sum + (Number(item.TotalProfit) || 0), 0),
                totalAmount: rows.reduce((sum, item) => sum + (Number(item.OrderTotal) || 0), 0),
                count: rows.length
            }
        });
    } catch (err) {
        console.error("🔥 Error detail:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Lấy chi tiết một đơn hàng
 */
exports.getOrderById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.execute(`SELECT * FROM \`order\` WHERE Id = ? AND Deleted = 0`, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Cập nhật đơn hàng
 */
exports.updateOrder = async (req, res) => {
    const { id } = req.params;
    const { orderStatusId, paymentStatusId, shippingStatusId } = req.body;

    try {
        const [result] = await pool.execute(`
            UPDATE \`order\`
            SET OrderStatusId = ?,
                PaymentStatusId = ?,
                ShippingStatusId = ?
            WHERE Id = ?
        `, [orderStatusId, paymentStatusId, shippingStatusId, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng để cập nhật' });
        }

        res.json({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công' });
    } catch (err) {
        console.error('updateOrder Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Lấy báo cáo tóm tắt
 */
exports.getOrderSummary = async (req, res) => {
    try {
        const query = `
            SELECT 
                COUNT(Id) as TotalOrders,
                SUM(OrderTotal) as TotalRevenue,
                (SELECT SUM((oi.PriceExclTax - (p.ProductCost * oi.Quantity))) 
                 FROM orderitem oi 
                 JOIN product p ON oi.ProductId = p.Id 
                 JOIN \`order\` o_sub ON oi.OrderId = o_sub.Id
                 WHERE o_sub.Deleted = 0) as TotalProfit
            FROM \`order\`
            WHERE Deleted = 0
        `;

        const [rows] = await pool.execute(query);
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('getOrderSummary Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Dashboard Stats (Xử lý đa truy vấn trong MySQL)
 */
exports.getDashboardStats = async (req, res) => {
    try {
        // 1. Thống kê số lượng đơn theo trạng thái
        const [stats] = await pool.execute(`
            SELECT OrderStatusId, COUNT(Id) as Count, SUM(OrderTotal) as Total
            FROM \`order\` WHERE Deleted = 0
            GROUP BY OrderStatusId
        `);

        // 2. Thống kê 5 đơn hàng mới nhất
        const [latestOrders] = await pool.execute(`
            SELECT o.Id, o.OrderStatusId, o.CreatedOnUtc, 
                   COALESCE(CONCAT(ba.FirstName, ' ', ba.LastName), CONCAT(c.FirstName, ' ', c.LastName), 'Khách vãng lai') as CustomerName
            FROM \`order\` o
            LEFT JOIN customer c ON o.CustomerId = c.Id
            LEFT JOIN address ba ON o.BillingAddressId = ba.Id
            WHERE o.Deleted = 0 
            ORDER BY o.CreatedOnUtc DESC 
            LIMIT 5
        `);

        // 3. Thống kê doanh thu 12 tháng (Dùng hàm YEAR() và MONTH() của MySQL)
        const [chartData] = await pool.execute(`
            SELECT MONTH(CreatedOnUtc) as Month, SUM(OrderTotal) as MonthlyTotal
            FROM \`order\`
            WHERE Deleted = 0 AND YEAR(CreatedOnUtc) = YEAR(CURDATE())
            GROUP BY MONTH(CreatedOnUtc)
        `);
        
        res.json({
            success: true,
            stats,
            latestOrders,
            chartData
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

///sửa 1
/**
 * Lấy chi tiết đơn hàng (Client/Admin)
 */
exports.getOrderDetail = async (req, res) => {
    try {
        const { id } = req.params;

        // MySQL sử dụng JSON_ARRAYAGG và JSON_OBJECT để thay thế FOR JSON PATH của MSSQL
        const query = `
            SELECT 
                o.*,
                IFNULL(addr.FirstName, c.FirstName) as CustomerFirstName, 
                IFNULL(addr.LastName, c.LastName) as CustomerLastName, 
                c.Email as CustomerEmail,
                IFNULL(addr.Address1, bill.Address1) as Address1,
                IFNULL(addr.City, bill.City) as City,
                COALESCE(addr.PhoneNumber, bill.PhoneNumber, c.Phone) as PhoneNumber,

                -- Lấy danh sách sản phẩm dưới dạng JSON Array
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'Id', oi.Id,
                            'ProductId', oi.ProductId,
                            'Quantity', oi.Quantity,
                            'UnitPriceExclTax', oi.UnitPriceExclTax,
                            'ProductName', p.Name,
                            'MainPictureId', (
                                SELECT ppm.PictureId FROM product_picture_mapping ppm 
                                WHERE ppm.ProductId = p.Id ORDER BY ppm.DisplayOrder ASC LIMIT 1
                            )
                        )
                    )
                    FROM orderitem oi 
                    JOIN product p ON oi.ProductId = p.Id 
                    WHERE oi.OrderId = o.Id
                ) as Items,

                -- Lấy danh sách ghi chú dưới dạng JSON Array
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'Note', Note,
                            'CreatedOnUtc', CreatedOnUtc
                        )
                    )
                    FROM ordernote 
                    WHERE OrderId = o.Id AND DisplayToCustomer = 1
                    ORDER BY CreatedOnUtc DESC
                ) as Notes

            FROM \`order\` o
            LEFT JOIN customer c ON o.CustomerId = c.Id
            LEFT JOIN address addr ON o.ShippingAddressId = addr.Id
            LEFT JOIN address bill ON o.BillingAddressId = bill.Id
            WHERE o.Id = ? AND o.Deleted = 0
        `;

        const [rows] = await pool.execute(query, [id]);

        if (rows.length > 0) {
            const data = rows[0];

            // 1. Xử lý ảnh cho từng sản phẩm trong mảng Items
            // Lưu ý: MySQL trả về JSON dưới dạng Object/Array luôn, không cần JSON.parse()
            if (data.Items) {
                data.Items = data.Items.map(item => {
                    let foundImage = '/images/default.jpg';

                    if (item.MainPictureId) {
                        const paddedId = item.MainPictureId.toString().padStart(7, '0');
                        const fileNameBase = `${paddedId}_0`;
                        const extensions = ['.jpg', '.jpeg', '.png', '.JPG', '.PNG', '.JPEG'];

                        for (const ext of extensions) {
                            const fullPath = path.join(__dirname, '../public/images', fileNameBase + ext);
                            if (fs.existsSync(fullPath)) {
                                foundImage = `/images/${fileNameBase}${ext}`;
                                break;
                            }
                        }
                    }
                    item.ProductImage = foundImage;
                    delete item.MainPictureId;
                    return item;
                });
            } else {
                data.Items = [];
            }

            // 2. Xử lý Notes (Nếu null thì gán mảng rỗng)
            data.Notes = data.Notes || [];

            res.json({ success: true, data });
        } else {
            res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
        }
    } catch (err) {
        console.error("🔥 Lỗi GetOrderDetail:", err.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
};

/**
 * Cập nhật trạng thái đơn hàng (Rút gọn)
 */
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatusId } = req.body;
        await pool.execute('UPDATE \`order\` SET OrderStatusId = ? WHERE Id = ?', [orderStatusId, id]);
        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Cập nhật tổng tiền đơn hàng
 */
exports.updateOrderTotals = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderSubtotalInclTax, orderShippingInclTax, orderTotal } = req.body;
        await pool.execute(
            'UPDATE \`order\` SET OrderSubtotalInclTax = ?, OrderShippingInclTax = ?, OrderTotal = ? WHERE Id = ?',
            [orderSubtotalInclTax, orderShippingInclTax, orderTotal, id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Xóa đơn hàng (Soft Delete)
 */
exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('UPDATE \`order\` SET Deleted = 1 WHERE Id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Thanh toán qua PayOS
 */
exports.createPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        const [orderResult] = await pool.execute('SELECT OrderTotal FROM \`order\` WHERE Id = ?', [orderId]);

        if (orderResult.length === 0) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        const amount = Math.round(orderResult[0].OrderTotal);
        const randomOrderCode = Math.floor(100000 + Math.random() * 900000);

        const paymentBody = {
            orderCode: randomOrderCode,
            amount: amount,
            description: `Don hang ${orderId}`,
            cancelUrl: process.env.PAYOS_CANCEL_URL,
            returnUrl: process.env.PAYOS_RETURN_URL,
            items: [] 
        };

        const paymentLink = await payOS.paymentRequests.create(paymentBody);
        res.json({ checkoutUrl: paymentLink.checkoutUrl });

    } catch (err) {
        console.error("🔥 Lỗi PayOS:", err.desc || err.message);
        res.status(500).json({ success: false, message: err.desc || "Lỗi tạo link thanh toán" });
    }
};
///sửa 2
/**
 * Xử lý Webhook từ PayOS
 */
exports.handleWebhook = async (req, res) => {
  try {
    const verifiedData = payOS.verifyPaymentWebhookData(req.body);

    // Nếu trạng thái không phải PAID, trả về thành công để PayOS không gửi lại
    if (verifiedData.status !== "PAID") {
      return res.json({ success: true });
    }

    // Kiểm tra đơn hàng tồn tại trong Database
    const [orders] = await pool.execute(
      'SELECT PaymentStatusId FROM `order` WHERE Id = ?', 
      [verifiedData.orderCode]
    );

    if (orders.length === 0) {
      throw new Error("Đơn hàng không tồn tại");
    }

    // Nếu đã PAID (Status 30) rồi thì bỏ qua
    if (orders[0].PaymentStatusId === 30) {
      return res.json({ success: true });
    }

    // Cập nhật trạng thái thanh toán và đơn hàng
    // GETDATE() -> NOW()
    await pool.execute(`
      UPDATE \`order\`
      SET 
        PaymentStatusId = 30,   -- Paid
        OrderStatusId = 20,     -- Processing
        UpdatedOnUtc = NOW()
      WHERE Id = ?
    `, [verifiedData.orderCode]);

    console.log(`✅ Đơn hàng ${verifiedData.orderCode} đã thanh toán thành công`);
    res.json({ success: true });

  } catch (err) {
    console.error("🔥 Webhook error:", err.message);
    res.status(400).json({ success: false });
  }
};

/**
 * Tạo Đơn Hàng Mới (Checkout)
 */
exports.createOrder = async (req, res) => {
    try {
        const { fullName, phone, address, paymentMethod, items } = req.body;

        // --- BƯỚC 1: TẠO ĐỊA CHỈ MỚI ---
        // MySQL không có OUTPUT INSERTED.Id, dùng result.insertId
        const [addressResult] = await pool.execute(`
            INSERT INTO address (
                FirstName, LastName, Email, Company, CountryId, StateProvinceId, 
                City, Address1, ZipPostalCode, PhoneNumber, CreatedOnUtc
            )
            VALUES (?, '', 'guest@example.com', '', 1, 1, 'Hanoi', ?, '10000', ?, NOW())
        `, [fullName, address, phone]);
        
        const newAddressId = addressResult.insertId;

        // --- BƯỚC 2: TẠO ĐƠN HÀNG ---
        const customOrderNumber = `ORD${Date.now()}`;
        const orderTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
        const paymentMethodName = paymentMethod === 'cod' ? 'Payments.CashOnDelivery' : 'Payments.PayOS';

        // NEWID() trong MSSQL -> UUID() trong MySQL
        const [orderResult] = await pool.execute(`
            INSERT INTO \`order\` (
                CustomOrderNumber, BillingAddressId, ShippingAddressId, CustomerId, OrderGuid, StoreId,
                PickupInStore, OrderStatusId, ShippingStatusId, PaymentStatusId,
                PaymentMethodSystemName, CustomerCurrencyCode, CurrencyRate,
                CustomerTaxDisplayTypeId, OrderSubtotalInclTax, OrderSubtotalExclTax,
                OrderSubTotalDiscountInclTax, OrderSubTotalDiscountExclTax,
                OrderShippingInclTax, OrderShippingExclTax,
                PaymentMethodAdditionalFeeInclTax, PaymentMethodAdditionalFeeExclTax,
                TaxRates, OrderTax, OrderDiscount, OrderTotal, RefundedAmount,
                CustomerLanguageId, AffiliateId, AllowStoringCreditCardNumber,
                Deleted, CreatedOnUtc
            )
            VALUES (
                ?, ?, ?, 1, UUID(), 1,
                0, 10, 10, 10,
                ?, 'VND', 1,
                1, ?, ?,
                0, 0, 0, 0, 0, 0,
                '', 0, 0, ?, 0,
                1, 0, 0, 0, NOW()
            )
        `, [
            customOrderNumber, newAddressId, newAddressId, 
            paymentMethodName, orderTotal, orderTotal, orderTotal
        ]);

        const orderId = orderResult.insertId;

        // --- BƯỚC 3: CHÈN ORDER ITEMS ---
        // Sử dụng vòng lặp for...of để đảm bảo async/await hoạt động đúng
        for (const item of items) {
            await pool.execute(`
                INSERT INTO orderitem (
                    OrderId, ProductId, Quantity, UnitPriceInclTax, PriceInclTax, 
                    UnitPriceExclTax, PriceExclTax, DiscountAmountInclTax, DiscountAmountExclTax,
                    AttributeDescription, AttributesXml, DownloadCount, IsDownloadActivated,
                    OrderItemGuid, OriginalProductCost, ItemWeight
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, '', '', 0, 0, UUID(), ?, 0)
            `, [
                orderId, item.productId, item.quantity, item.price, 
                item.price * item.quantity, item.price, item.price * item.quantity, 
                item.price
            ]);
        }

        res.json({ success: true, orderId });

    } catch (err) {
        console.error("🔥 Lỗi createOrder:", err.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống: " + err.message });
    }
};