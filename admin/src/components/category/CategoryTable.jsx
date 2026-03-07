import classNames from 'classnames/bind';
import styles from './categoryform.module.scss';

const cx = classNames.bind(styles);

function CategoryTable({ items, selectedIds, onToggleSelect, onSelectAll, onEdit, startIndex }) {
    const isAllSelected = items.length > 0 && selectedIds.length === items.length;

    return (
        <table className={cx('table')}>
            <thead>
                <tr>
                    <th style={{ width: '40px' }}>
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={(e) => onSelectAll(e.target.checked)}
                        />
                    </th>
                    <th>Tên</th>
                    <th style={{ width: '100px' }}>Xuất bản</th>
                    <th style={{ width: '60px' }}>STT</th>
                    <th style={{ width: '80px' }}>Sửa</th>
                </tr>
            </thead>
            <tbody>
                {items.length === 0 ? (
                    <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                            Không tìm thấy dữ liệu phù hợp
                        </td>
                    </tr>
                ) : (
                    items.map((item, index) => (
                        <tr key={item.id}>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(item.id)}
                                    onChange={() => onToggleSelect(item.id)}
                                />
                            </td>
                            <td>{item.displayName}</td>
                            <td className={cx('center-tick')}>
                                {item.published ? (
                                    <span style={{ color: 'green', fontWeight: 'bold' }}>✓</span>
                                ) : (
                                    <span style={{ color: 'red' }}>✕</span>
                                )}
                            </td>
                            <td className={cx('center')}>{startIndex + index + 1}</td>
                            <td className={cx('center')}>
                                <button className={cx('edit')} onClick={() => onEdit(item.id)}>
                                    <i className="fa-solid fa-pencil"></i>
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );
}

export default CategoryTable;