import classNames from 'classnames/bind';
import styles from './categoryform.module.scss';

const cx = classNames.bind(styles);

function CategoryFilter({ searchTerm, setSearchTerm, onSearch, filterKeyword, onClear }) {
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') onSearch();
    };

    return (
        <div className={cx('filter')}>
            <input
                placeholder="Nhập tên danh mục..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
            />
            <button className={cx('btn', 'primary')} onClick={onSearch}>
                Tìm kiếm
            </button>
            {filterKeyword && (
                <button className={cx('btn', 'outline')} onClick={onClear} style={{ marginLeft: '10px' }}>
                    Xóa lọc
                </button>
            )}
        </div>
    );
}

export default CategoryFilter;