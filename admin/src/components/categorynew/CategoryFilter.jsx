import styles from '../../pages/CatergoryNewPage/CatergoryNewPage.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);
const CategoryFilter = ({ searchTerm, setSearchTerm, onSearch }) => (
    <div className={cx('filter')}>
        <input 
            placeholder="Nhập tên danh mục..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className={cx('btn', 'primary')} onClick={onSearch}>Tìm kiếm</button>
    </div>
);
export default CategoryFilter