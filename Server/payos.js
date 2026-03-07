const PayOS = require("@payos/node");

// Khởi tạo instance từ class nằm bên trong object
const payOS = new PayOS.PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

module.exports = payOS;