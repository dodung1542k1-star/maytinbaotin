import styles from '../../pages/CatergoryNewPage/CatergoryNewPage.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);
const CategoryPagination = ({ currentPage, totalPages, setCurrentPage, itemsPerPage, setItemsPerPage }) => (
    <div className={cx('pagination')}>
        <div className={cx('left-pagi')}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}> Trước </button>
            <span style={{ margin: '0 10px' }}>Trang {currentPage} / {totalPages || 1}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}> Tiếp </button>
        </div>
        <div className={cx('right')}>
            Hiển thị
            <select value={itemsPerPage} onChange={(e) => {setItemsPerPage(Number(e.target.value)); setCurrentPage(1);}}>
                <option value={7}>7</option>
                <option value={10}>10</option>
            </select>
        </div>
    </div>
);

export default CategoryPagination;