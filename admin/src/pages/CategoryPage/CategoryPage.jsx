import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './CategoryPage.module.scss';

import CategoryHeader from '../../components/category/CategoryHeader';
import CategoryFilter from '../../components/category/CategoryFilter';
import CategoryTable from '../../components/category/CategoryTable';
import CategoryPagination from '../../components/category/CategoryPagination';

const cx = classNames.bind(styles);
const API_URL = process.env.REACT_APP_API_URL;

function CategoryPage() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterKeyword, setFilterKeyword] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const loadData = () => {
        fetch(`${API_URL}/api/categories/tree`)
            .then((res) => res.json())
            .then((res) => setCategories(res.data || []))
            .catch((err) => console.error('Lỗi fetch:', err));
    };

    useEffect(loadData, []);

    // Logic Flatten Tree
    const flatList = useMemo(() => {
        const flatten = (items, parentPath = '') => {
            let result = [];
            items.forEach((item) => {
                const currentPath = parentPath ? `${parentPath} >> ${item.name}` : item.name;
                result.push({ ...item, displayName: currentPath });
                if (item.children?.length > 0) result = result.concat(flatten(item.children, currentPath));
            });
            return result;
        };
        return flatten(categories);
    }, [categories]);

    const filteredItems = useMemo(() => {
        return flatList.filter((cat) => cat.displayName.toLowerCase().includes(filterKeyword.toLowerCase()));
    }, [flatList, filterKeyword]);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

    const handleDeleteBulk = async () => {
        if (selectedIds.length === 0) return alert('Hãy chọn ít nhất 1 mục');
        if (window.confirm(`Xóa ${selectedIds.length} mục?`)) {
            const deleteRequest = (id) => fetch(`${API_URL}/api/categories/${id}`, { method: 'DELETE' }).then(r => r.json());
            const results = await Promise.all(selectedIds.map(deleteRequest));
            loadData();
            setSelectedIds([]);
        }
    };
    const handleUpdateOrder = async (newOrder) => {
        // 1. Cập nhật UI ngay lập tức cho mượt
        setCategories(newOrder);

        // 2. Tạo mảng dữ liệu vị trí mới
        const orders = newOrder.map((item, index) => ({
            id: item.id,
            position: index
        }));

        // 3. Gọi API lưu vào Database
        try {
            const response = await fetch(`${API_URL}/api/categories/reorder`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orders })
            });

            const result = await response.json();
            if (result.success) {
                console.log('Đã lưu thứ tự vào DB');
            } else {
                alert('Lỗi khi lưu thứ tự!');
                loadData(); // Tải lại dữ liệu cũ nếu lỗi
            }
        } catch (err) {
            console.error('Fetch error:', err);
            loadData();
        }
    };
    return (
        <div className={cx('wrapper')}>
            <CategoryHeader 
                navigate={navigate} 
                categories={categories} // Thêm mới
                onUpdateOrder={handleUpdateOrder}
                selectedCount={selectedIds.length} 
                onDeleteBulk={handleDeleteBulk} 
            />
            
            <CategoryFilter 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
                onSearch={() => { setFilterKeyword(searchTerm); setCurrentPage(1); }}
                onClear={() => { setSearchTerm(''); setFilterKeyword(''); }}
            />

            <CategoryTable 
                items={currentItems}
                selectedIds={selectedIds}
                onToggleSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                onSelectAll={(checked) => setSelectedIds(checked ? currentItems.map(i => i.id) : [])}
                onEdit={(id) => navigate(`/admin/category/edit/${id}`)}
                startIndex={startIndex}
            />

            <CategoryPagination 
                totalPages={totalPages}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            />
        </div>
    );
}

export default CategoryPage;