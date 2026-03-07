import React from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const navigate = useNavigate();

    return (
        <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
                <h4 className="fw-bold mb-0 text-dark">Danh Mục Bài Viết</h4>
                <small className="text-muted">Bảng điều khiển - Danh Mục Bài Viết</small>
            </div>
            <div className="d-flex gap-2">
                {/* Nút thêm mới dẫn đến /home/create */}
                <button 
                    className="btn btn-primary btn-sm px-3 d-flex align-items-center gap-1 shadow-sm"
                    onClick={() => navigate('/admin/home/create')}
                >
                    <Plus size={16} /> Thêm mới
                </button>
        
                <button className="btn btn-outline-secondary btn-sm px-2">
                    <MoreHorizontal size={16} />
                </button>
            </div>
        </div>
    );
};

export default Header;