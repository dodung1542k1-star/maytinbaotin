// src/utils/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const location = useLocation();

    // Nếu chưa có token (chưa đăng nhập)
    if (!token) {
        // Đẩy về trang đăng nhập và chặn đứng mọi render khác
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    // Nếu đã đăng nhập nhưng sai quyền (ví dụ không phải nhân viên)
    if (requiredRole && !user?.roles?.includes(requiredRole)) {
        alert("Bạn không có quyền vào khu vực này!");
        return <Navigate to="/" replace />;
    }

    // Nếu thỏa mãn hết thì mới cho xem nội dung Admin
    return children;
};

export default ProtectedRoute;