// middleware/verifyToken.js
const jwt = require("jsonwebtoken");
const { createError } = require("./error");

const verifyToken = (req, res, next) => {
  // Lấy token từ cookie hoặc header Authorization (Bearer token)
  let token = req.cookies.access_token;
  if (!token && req.headers.authorization) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(createError(401, "Bạn chưa đăng nhập!"));
  }

  jwt.verify(token, process.env.JWT, (err, user) => {
    if (err) return next(createError(403, "Token không hợp lệ hoặc đã hết hạn!"));
    req.user = user; // Gán user vào request để dùng ở route sau
    next();
  });
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user && req.user.isAdmin) {
      next();
    } else {
      return next(createError(403, "Bạn không có quyền admin!"));
    }
  });
};

module.exports = { verifyToken, verifyAdmin };