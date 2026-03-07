import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Thêm axios
import classNames from 'classnames/bind';
import styles from './product.module.scss';

const cx = classNames.bind(styles);
const API_URL = process.env.REACT_APP_API_URL;
// Giả sử bạn truyền props selectedIds (mảng các ID đang tích chọn) và onRefresh (để tải lại danh sách)
function ProductHeader({ selectedIds = [], onRefresh }) {
    const navigate = useNavigate();

    const handleAddNew = () => {
        navigate('/admin/product/add');
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) {
            alert("Vui lòng chọn ít nhất một sản phẩm để xóa!");
            return;
        }

        const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} sản phẩm đã chọn?`);
        if (!confirmDelete) return;

        try {
            // Thực hiện lặp để xóa hoặc gọi API xóa hàng loạt (Bulk Delete)
            // Ở đây mình làm theo route đơn lẻ của bạn:
            const deletePromises = selectedIds.map(id => 
                axios.delete(`${API_URL}/api/products/${id}`)
            );

            await Promise.all(deletePromises);
            
            alert("Đã xóa các sản phẩm thành công!");
            if (onRefresh) onRefresh(); // Gọi hàm load lại dữ liệu ở component cha
        } catch (err) {
            console.error("Lỗi khi xóa:", err);
            alert("Có lỗi xảy ra khi xóa sản phẩm.");
        }
    };

    return (
        <div className={cx('header')}>
            <div>
                <h2>Danh mục sản phẩm</h2>
                <span>Bảng điều khiển - Danh mục sản phẩm</span>
            </div>

            <div className={cx('actions')}>
                <button
                    className={cx('btn', 'primary')}
                    onClick={handleAddNew}
                >
                    Thêm mới
                </button>
                
                <button
                    className={cx('btn', 'danger')}
                    onClick={handleDeleteSelected} // Gán sự kiện xóa
                    disabled={selectedIds.length === 0} // Ẩn/Hiện dựa trên lựa chọn
                >
                    Xóa lựa chọn {selectedIds.length > 0 && `(${selectedIds.length})`}
                </button>
                
                <button className={cx('btn', 'more')}>⋯</button>
            </div>
        </div>
    );
}

export default ProductHeader;