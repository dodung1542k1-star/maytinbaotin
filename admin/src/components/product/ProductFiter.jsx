import { useState, useEffect } from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import styles from './product.module.scss';

const cx = classNames.bind(styles);
const API_URL = process.env.REACT_APP_API_URL;
function ProductFilter({ onFilter }) {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState(''); // Thêm state cho ô nhập tên

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/categories/tree`);
                if (res.data.success) {
                    setCategories(res.data.data || []);
                }
            } catch (err) {
                console.error("Lỗi lấy danh mục:", err);
            }
        };
        fetchCategories();
    }, []);

    const renderOptions = (cats, level = 0) =>
        cats.flatMap((cat) => [
            <option key={cat.id} value={cat.id}>
                {'— '.repeat(level) + cat.name}
            </option>,
            ...(cat.children && cat.children.length ? renderOptions(cat.children, level + 1) : []),
        ]);

    const handleSearch = () => {
        // Gửi cả ID danh mục và tên sản phẩm về Product.jsx
        onFilter({ 
            categoryId: selectedCategory, 
            name: searchTerm 
        }); 
    };

    const handleClear = () => {
        setSelectedCategory('');
        setSearchTerm('');
        // Đảm bảo gửi đúng cấu trúc object mà Product.jsx đang mong đợi
        onFilter({ categoryId: '', name: '' });
    };
    return (
        <div className={cx('filter')}>
            <div className={cx('filter-item')}>
                <select 
                    className={cx('select-custom')}
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    <option value="">-- Chọn tất cả danh mục --</option>
                    {renderOptions(categories)}
                </select>
            </div>
            <input
                className={cx('input-search')}
                placeholder="Nhập tên sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className={cx('btn', 'primary')} onClick={handleSearch}>
                Tìm kiếm
            </button>
            <button className={cx('btn', 'outline')} onClick={handleClear}>
                Xóa lọc
            </button>
        </div>
    );
}

export default ProductFilter;