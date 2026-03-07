import { useNavigate } from 'react-router-dom';
import styles from '../../pages/CatergoryNewPage/CatergoryNewPage.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const CategoryHeader = ({ onDelete }) => {
    const navigate = useNavigate();

    const handleAddClick = () => {
        navigate('/admin/catergorynewpage/create');
    };

    return (
        <div className={cx('header')}>
            <div>
                <h2>Danh Mục Bài Viết</h2>
                <span>Bảng điều khiển - Danh Mục Bài Viết</span>
            </div>
            <div className={cx('actions')}>
                <button className={cx('btn', 'primary')} onClick={handleAddClick}> 
                    Thêm mới 
                </button>
                <button className={cx('btn', 'danger')} onClick={onDelete}> 
                    Xóa lựa chọn 
                </button>
                <button className={cx('btn', 'more')}>⋯</button>
            </div>
        </div>
    );
};

export default CategoryHeader;