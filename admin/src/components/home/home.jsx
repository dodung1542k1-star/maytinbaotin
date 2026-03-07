import React, { useEffect, useState } from 'react';
import { Edit2, Plus, MoreHorizontal, Search, Check, ChevronLeft, ChevronRight } from 'lucide-react';
const API_URL = process.env.REACT_APP_API_URL;
function Home() {
    const [categories, setCategories] = useState([]); // Dữ liệu gốc từ API
    const [filteredData, setFilteredData] = useState([]); // Dữ liệu sau khi tìm kiếm/phân trang
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(7);
    const [currentPage, setCurrentPage] = useState(1);

    // 1. Lấy dữ liệu từ API
    useEffect(() => {
        fetch(`${API_URL}/api/seo/public/menu-footer`)
            .then(res => res.json())
            .then(data => {
                // Gộp 3 cột lại thành một danh sách duy nhất
                const allData = [
                    ...(data.column1 || []),
                    ...(data.column2 || []),
                    ...(data.column3 || [])
                ];
                
                // Lọc bỏ các mục không có Title (như Id 16 của bạn)
                const validData = allData.filter(item => item.Title !== null);
                setCategories(validData);
                setFilteredData(validData);
            })
            .catch(err => console.error("Lỗi kết nối API:", err));
    }, []);

    // 2. Logic Tìm kiếm
    const handleSearch = () => {
        const results = categories.filter(item => 
            item.Title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredData(results);
        setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
    };

    // 3. Logic Phân trang
    const indexOfLastItem = currentPage * pageSize;
    const indexOfFirstItem = indexOfLastItem - pageSize;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

    return (
        <div className="p-4 bg-light min-vh-100 font-sans">
            {/* Header: Tiêu đề & Nút thao tác */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h4 className="fw-bold mb-0 text-dark">Danh Mục Bài Viết</h4>
                    <small className="text-muted">Bảng điều khiển - Danh Mục Bài Viết</small>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-primary btn-sm px-3 d-flex align-items-center gap-1 shadow-sm">
                        <Plus size={16} /> Thêm mới
                    </button>
                    <button className="btn btn-danger btn-sm px-3 shadow-sm">
                        Xóa lựa chọn
                    </button>
                    <button className="btn btn-outline-secondary btn-sm px-2">
                        <MoreHorizontal size={16} />
                    </button>
                </div>
            </div>
            {/* Search Bar */}
            <div className="bg-white p-3 rounded shadow-sm mb-3 border">
                <div className="input-group">
                    <input 
                        type="text" 
                        className="form-control border-secondary-subtle" 
                        placeholder="Nhập tên danh mục..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button className="btn btn-primary px-4 d-flex align-items-center gap-2" onClick={handleSearch}>
                        <Search size={18} /> Tìm kiếm
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="table-responsive bg-white rounded shadow-sm border">
                <table className="table table-hover align-middle mb-0">
                    <thead className="table-light border-bottom">
                        <tr>
                            <th style={{ width: '50px' }} className="ps-3 text-center">
                                <input type="checkbox" className="form-check-input" />
                            </th>
                            <th className="py-3 fw-bold text-secondary">Tên danh mục</th>
                            <th className="text-center fw-bold text-secondary">Xuất bản</th>
                            <th className="text-center fw-bold text-secondary">STT</th>
                            <th className="text-center fw-bold text-secondary">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? (
                            currentItems.map((item, index) => (
                                <tr key={item.Id} className="border-bottom">
                                    <td className="ps-3 text-center">
                                        <input type="checkbox" className="form-check-input" />
                                    </td>
                                    <td className="text-dark py-3 ps-2 fw-medium">
                                        {item.Title}
                                    </td>
                                    <td className="text-center">
                                        <div className="bg-success-subtle rounded-circle d-inline-flex p-1">
                                            <Check size={16} className="text-success" />
                                        </div>
                                    </td>
                                    <td className="text-center text-muted">
                                        {indexOfFirstItem + index + 1}
                                    </td>
                                    <td className="text-center">
                                        <button className="btn btn-primary btn-sm p-2 shadow-sm border-0" style={{backgroundColor: '#0d6efd'}}>
                                            <Edit2 size={14} color="white" fill="white" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-5 text-muted">
                                    Không tìm thấy dữ liệu phù hợp...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                
                {/* Footer Bảng: Phân trang & Hiển thị */}
                <div className="d-flex justify-content-between align-items-center p-3 bg-light-subtle border-top">
                    <div className="d-flex gap-2">
                        <button 
                            className="btn btn-sm btn-outline-secondary px-3"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Trước
                        </button>
                        <div className="btn btn-sm btn-white border px-3 fw-medium">
                            Trang {currentPage} / {totalPages}
                        </div>
                        <button 
                            className="btn btn-sm btn-outline-secondary px-3"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Tiếp
                        </button>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        <span className="small text-muted">Hiển thị</span>
                        <select 
                            className="form-select form-select-sm" 
                            style={{ width: '80px' }}
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={5}>5</option>
                            <option value={7}>7</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;