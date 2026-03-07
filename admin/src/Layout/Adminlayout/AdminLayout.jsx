import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';

export default function AdminLayout() {
    const navigate = useNavigate();

    const onLogout = () => {
        localStorage.clear(); // Xóa sạch bộ nhớ tạm
        navigate('/admin/login', { replace: true });
    };

    return (
        <div className="d-flex">
            {/* Truyền hàm logout xuống nếu Sidebar cần dùng */}
            <Sidebar onLogout={onLogout} /> 
            
            <div className="flex-grow-1">
                {/* Hoặc truyền xuống Header */}
                <Header onLogout={onLogout} />
                
                <main className="p-4">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}