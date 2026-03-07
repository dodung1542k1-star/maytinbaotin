import classNames from 'classnames/bind';
import styles from './product.module.scss';
import { useNavigate } from 'react-router-dom';

const cx = classNames.bind(styles);

// 1. Thêm giá trị mặc định là [] cho products và selectedIds để tránh lỗi .length
function ProductTable({ 
    products = [], 
    loading = false, 
    selectedIds = [], 
    onSelectionChange = () => {} 
}) {
    const navigate = useNavigate();

    // 2. Sử dụng optional chaining (?.) để kiểm tra độ dài mảng an toàn
    const isAllSelected = products?.length > 0 && selectedIds?.length === products?.length;

    const handleCheckItem = (id) => {
        const newSelection = selectedIds.includes(id)
            ? selectedIds.filter(item => item !== id)
            : [...selectedIds, id];
        onSelectionChange(newSelection);
    };

    const handleCheckAll = (e) => {
        if (e.target.checked) {
            // Chỉ lấy ID của những sản phẩm hiện có
            onSelectionChange(products.map(p => p.id));
        } else {
            onSelectionChange([]);
        }
    };

    if (loading) return <div className={cx('loading')}>Đang tải dữ liệu...</div>;

    return (
        <table className={cx('table')}>
            <thead>
                <tr>
                    <th style={{ width: '40px' }}>
                        <input 
                            type="checkbox" 
                            onChange={handleCheckAll}
                            // Kiểm tra an toàn trước khi truy cập length
                            checked={!!isAllSelected}
                        />
                    </th>
                    <th style={{ width: '80px' }}>Hình ảnh</th>
                    <th>Tên sản phẩm</th>
                    <th style={{ width: '150px' }}>Giá bán</th>
                    <th style={{ width: '100px' }}>Xuất bản</th>
                    <th style={{ width: '80px' }}>Cập nhật</th>
                </tr>
            </thead>
            <tbody>
                {/* 3. Dùng products?.length để tránh lỗi nếu products bị null */}
                {products?.length > 0 ? (
                    products.map((item) => (
                        <tr 
                            key={item.id} 
                            className={cx({ selected: selectedIds.includes(item.id) })}
                        >
                            <td>
                                <input 
                                    type="checkbox" 
                                    checked={selectedIds.includes(item.id)}
                                    onChange={() => handleCheckItem(item.id)}
                                />
                            </td>
                            <td>
                                <img 
                                    src={item.image || '/placeholder-image.png'} 
                                    alt={item.name} 
                                    style={{ width: '60px', height: 'auto', borderRadius: '4px' }} 
                                    onError={(e) => e.target.src = '/placeholder-image.png'} // Chống lỗi ảnh die
                                />
                            </td>
                            <td style={{ textAlign: 'left', fontSize: '14px' }}>
                                <strong>{item.name}</strong>
                                <div style={{ fontSize: '12px', color: '#666' }}>{item.slug || 'No SKU'}</div>
                            </td>
                            <td>
                                <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                                    {item.price?.toLocaleString('vi-VN')} đ
                                </span>
                                {item.oldPrice > 0 && (
                                    <div style={{ textDecoration: 'line-through', fontSize: '12px', color: '#999' }}>
                                        {item.oldPrice?.toLocaleString('vi-VN')} đ
                                    </div>
                                )}
                            </td>
                            <td className={cx('center-tick')} style={{ textAlign: 'center' }}>
                                {item.published ? (
                                    <span style={{ color: '#00a65a', fontSize: '18px' }}>✓</span>
                                ) : (
                                    <span style={{ color: '#ccc', fontSize: '18px' }}>✕</span>
                                )}
                            </td>
                            <td className={cx('center')} style={{ textAlign: 'center' }}>
                                <button 
                                    className={cx('edit')} 
                                    onClick={() => navigate(`/admin/product/edit/${item.id}`)}
                                >
                                    <i className="fa-solid fa-pencil"></i>
                                </button>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                            Không tìm thấy sản phẩm nào
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
}

export default ProductTable;