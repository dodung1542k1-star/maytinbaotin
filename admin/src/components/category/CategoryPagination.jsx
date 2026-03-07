import classNames from 'classnames/bind';
import styles from './categoryform.module.scss';

const cx = classNames.bind(styles);

function CategoryPagination({ totalPages, currentPage, setCurrentPage, itemsPerPage, onItemsPerPageChange }) {
    if (totalPages <= 0) return null;

    return (
        <div className={cx('pagination')}>
            <div className={cx('left')}>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}>
                    Trước
                </button>
                <button className={cx({ active: currentPage === 1 })} onClick={() => setCurrentPage(1)}>
                    1
                </button>

                {currentPage > 3 && <span>...</span>}

                {Array.from({ length: 3 }, (_, i) => currentPage - 1 + i)
                    .filter((page) => page > 1 && page < totalPages)
                    .map((page) => (
                        <button
                            key={page}
                            className={cx({ active: page === currentPage })}
                            onClick={() => setCurrentPage(page)}
                        >
                            {page}
                        </button>
                    ))}

                {currentPage < totalPages - 2 && <span>...</span>}

                {totalPages > 1 && (
                    <button className={cx({ active: currentPage === totalPages })} onClick={() => setCurrentPage(totalPages)}>
                        {totalPages}
                    </button>
                )}

                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}>
                    Tiếp
                </button>
            </div>

            <div className={cx('right')}>
                Hiển thị
                <select value={itemsPerPage} onChange={(e) => onItemsPerPageChange(Number(e.target.value))}>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                </select>
                mục trên trang
            </div>
        </div>
    );
}

export default CategoryPagination;