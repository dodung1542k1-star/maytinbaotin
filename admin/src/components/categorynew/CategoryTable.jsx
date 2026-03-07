import { useNavigate } from 'react-router-dom';
import styles from '../../pages/CatergoryNewPage/CatergoryNewPage.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const CategoryTable = ({ 
    loading, 
    items = [], 
    startIndex = 0, 
    selectedIds = [], 
    setSelectedIds, 
    onDeleteSingle // Sẽ xử lý an toàn bên dưới
}) => {
    const navigate = useNavigate();

    // Kiểm tra an toàn để chắc chắn selectedIds luôn là mảng
    const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : [];

    // 1. Xử lý chọn/bỏ chọn từng item
    const handleCheckboxChange = (id) => {
        if (typeof setSelectedIds !== 'function') return;
        setSelectedIds((prev) => {
            const currentIds = Array.isArray(prev) ? prev : [];
            return currentIds.includes(id) 
                ? currentIds.filter((item) => item !== id) 
                : [...currentIds, id];
        });
    };

    // 2. Xử lý chọn tất cả/bỏ chọn tất cả
    const handleSelectAll = (e) => {
        if (typeof setSelectedIds !== 'function') return;
        const allCurrentIds = items.map((item) => item.Id);
        
        if (e.target.checked) {
            setSelectedIds((prev) => [...new Set([...(prev || []), ...allCurrentIds])]);
        } else {
            setSelectedIds((prev) => (prev || []).filter((id) => !allCurrentIds.includes(id)));
        }
    };

    // 3. Xử lý click nút xóa (Khắc phục lỗi "is not a function")
    const handleDeleteClick = (id) => {
        if (typeof onDeleteSingle === 'function') {
            onDeleteSingle(id);
        } else {
            console.error("LỖI: Bạn chưa truyền prop 'onDeleteSingle' vào CategoryTable!");
            alert("Chức năng xóa chưa được cài đặt ở trang cha.");
        }
    };

    const handleEditClick = (id) => {
        navigate(`/admin/catergorynewpage/edit/${id}`);
    };

    return (
        <table className={cx('table')}>
            <thead>
                <tr>
                    <th>
                        <input 
                            type="checkbox" 
                            onChange={handleSelectAll}
                            checked={items.length > 0 && items.every(item => safeSelectedIds.includes(item.Id))}
                        />
                    </th>
                    <th>Tên danh mục</th>
                    <th>Xuất bản</th>
                    <th>STT</th>
                    <th>Hành động</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center' }}>Đang tải...</td></tr>
                ) : items.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center' }}>Không có dữ liệu</td></tr>
                ) : (
                    items.map((item, index) => {
                        const isSelected = safeSelectedIds.includes(item.Id);
                        return (
                            <tr key={item.Id || index} className={cx({ selected: isSelected })}>
                                <td>
                                    <input 
                                        type="checkbox" 
                                        checked={isSelected}
                                        onChange={() => handleCheckboxChange(item.Id)}
                                    />
                                </td>
                                <td>{item.Name}</td>
                                <td className={cx('center-tick')}>{item.Published ? '✓' : '✕'}</td>
                                <td className={cx('center')}>{startIndex + index + 1}</td>
                                <td className={cx('center')}>
                                    <button 
                                        className={cx('edit')} 
                                        onClick={() => handleEditClick(item.Id)}
                                        title="Sửa"
                                    > 
                                        <i className="fa-solid fa-pencil"></i>
                                    </button>
                                
                                </td>
                            </tr>
                        );
                    })
                )}
            </tbody>
        </table>
    );
};

export default CategoryTable;