import { useState, useEffect, useMemo, useCallback } from 'react';
import classNames from 'classnames/bind';
import axios from 'axios';
import styles from './CatergoryNewPage.module.scss';
import CategoryHeader from '../../components/categorynew/CategoryHeader';
import CategoryFilter from '../../components/categorynew/CategoryFilter';
import CategoryTable from '../../components/categorynew/CategoryTable';
import CategoryPagination from '../../components/categorynew/CategoryPagination';

const cx = classNames.bind(styles);
// Đảm bảo API_URL có "/" ở cuối hoặc xử lý nối chuỗi cẩn thận
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

function CatergoryNewPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterKeyword, setFilterKeyword] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(7);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);

    // Tách hàm fetch ra để dùng lại sau khi xóa
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/new`);
            if (response.data.success) {
                setCategories(response.data.data || []);
            }
        } catch (error) {
            console.error("Lỗi lấy dữ liệu:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Logic Lọc dữ liệu an toàn
    const filteredItems = useMemo(() => {
        return categories.filter(item => 
            (item.Name || '').toLowerCase().includes(filterKeyword.toLowerCase())
        );
    }, [categories, filterKeyword]);

    // Logic Phân trang
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

    // XỬ LÝ XÓA ĐƠN
    const handleDeleteSingle = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
            try {
                // Sửa URL cho đúng với Backend của bạn
                const res = await axios.delete(`${API_URL}/api/new/${id}`);
                if (res.data.success) {
                    alert("Xóa thành công!");
                    fetchData(); // Load lại dữ liệu
                    setSelectedIds(prev => prev.filter(sid => sid !== id));
                }
            } catch (err) {
                alert("Lỗi khi xóa: " + (err.response?.data?.message || err.message));
            }
        }
    };

    // XỬ LÝ XÓA NHIỀU
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            alert('Vui lòng chọn ít nhất một danh mục để xóa!');
            return;
        }

        if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} mục đã chọn?`)) {
            try {
                // Gọi song song các request xóa
                const deletePromises = selectedIds.map(id => 
                    axios.delete(`${API_URL}/api/new/${id}`)
                );

                await Promise.all(deletePromises);
                
                alert('Đã xóa thành công các mục được chọn');
                fetchData(); // Load lại dữ liệu
                setSelectedIds([]); // Xóa sạch list đã chọn
            } catch (error) {
                console.error("Lỗi xóa hàng loạt:", error);
                alert("Có lỗi xảy ra khi xóa một số mục.");
            }
        }
    };

    return (
        <div className={cx('wrapper')}>
            <CategoryHeader 
                onAdd={() => console.log('Điều hướng sang trang thêm mới')} 
                onDelete={handleBulkDelete} 
            />

            <CategoryFilter 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
                onSearch={() => { setFilterKeyword(searchTerm); setCurrentPage(1); }} 
            />

            <CategoryTable 
                loading={loading} 
                items={currentItems} 
                selectedIds={selectedIds} // THÊM DÒNG NÀY ĐỂ FIX LỖI CHECKBOX
                setSelectedIds={setSelectedIds}
                startIndex={startIndex} 
                onDeleteSingle={handleDeleteSingle}
            />

            <CategoryPagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                setCurrentPage={setCurrentPage} 
                itemsPerPage={itemsPerPage} 
                setItemsPerPage={setItemsPerPage} 
            />
        </div>
    );
}

export default CatergoryNewPage;