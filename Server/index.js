// =======================
// IMPORTS
// =======================
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { connectDB } = require('./config');
const apiRoutes = require('./routers/product.routes'); 
const cartRoutes = require('./routers/cart.routes');
const orderRoutes = require('./routers/order.routes');
const categoryAdminRoute = require('./routers/category.route');
const postRouter = require('./routers/post.route');
const seoRoutes = require('./routers/seo.routes');
const authRoutes = require('./routers/auth.route');
const warrantyRoutes = require('./routers/warranty.route');


const app = express();

// =======================
// MIDDLEWARE (Đặt trên cùng)
// =======================
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001'
    ],
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// KẾT NỐI DATABASE
connectDB();



// 1. Static Files cho Roxy UI & Images
app.use('/elfinder', express.static(path.join(__dirname, 'roxy/public')));

app.use('/images', express.static(path.join(__dirname, 'public/images')));

// 2. Roxy API
const roxyRouter = require('./roxy/app');
app.use('/elfinder', roxyRouter);

// 3. Danh mục (Admin Route)
app.use('/api/categories', categoryAdminRoute);

//dang nhap
app.use('/api/auth', authRoutes);

// 4. Sản phẩm, Bài viết (Client API)
app.use('/api', apiRoutes);
//api cart
app.use('/api/cart', cartRoutes);
//api post
app.use('/api',postRouter)
// Root Route
// Sử dụng route
app.use('/api/orders', orderRoutes);

app.use('/api/seo', seoRoutes);
app.use('/api/warranty', warrantyRoutes);
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API Máy Tính Bảo Tín đang chạy!',
    });
});

// =======================
// ERROR HANDLER
// =======================
app.use((err, req, res, next) => {
    console.error("🔥 Server Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
});

// =======================
// START SERVER (Cổng 8080)
// =======================
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});