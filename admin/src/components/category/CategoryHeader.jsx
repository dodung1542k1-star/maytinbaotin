import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './categoryform.module.scss';
import SortCategoryModal from './SortCategoryModal'; // Nhớ tạo file này cùng thư mục

const cx = classNames.bind(styles);

function CategoryHeader({ navigate, selectedCount, onDeleteBulk, categories, onUpdateOrder }) {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className={cx('header')}>
            <div>
                <h2>Danh mục sản phẩm</h2>
                <span>Bảng điều khiển - Danh mục sản phẩm</span>
            </div>

            <div className={cx('actions')}>
                <button
                    className={cx('btn', 'primary')}
                    onClick={() => navigate('/admin/category/create')}
                >
                    Thêm mới
                </button>
                <button
                    onClick={onDeleteBulk}
                    className={cx('btn', 'danger')}
                >
                    Xóa lựa chọn {selectedCount > 0 && `(${selectedCount})`}
                </button>
                <button 
                    className={cx('btn', 'more')}
                    onClick={() => setShowModal(true)}
                >
                    ⋯
                </button>
            </div>

            {showModal && (
                <SortCategoryModal 
                    categories={categories}
                    onClose={() => setShowModal(false)}
                    onSave={(newList) => {
                        onUpdateOrder(newList);
                        setShowModal(false);
                    }}
                />
            )}
        </div>
    );
}

export default CategoryHeader;