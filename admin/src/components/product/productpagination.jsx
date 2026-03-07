import classNames from 'classnames/bind';
import styles from './product.module.scss';

const cx = classNames.bind(styles);

function CategoryPagination({ pagination = {}, onPageChange, onLimitChange }) {
    const { totalPages = 1, currentPage = 1, pageSize = 10 } = pagination;

    // Hàm tạo mảng các số trang hiển thị
    const getPaginationRange = () => {
        const delta = 2; // Số lượng trang hiển thị bên cạnh trang hiện tại
        const range = [];
        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i);
        }

        if (currentPage - delta > 2) range.unshift('...');
        if (currentPage + delta < totalPages - 1) range.push('...');

        range.unshift(1);
        if (totalPages > 1) range.push(totalPages);

        return range;
    };

    const paginationRange = getPaginationRange();

    return (
        <div className={cx('pagination')}>
            <div className={cx('left')}>
                {/* Nút Trước */}
                <button
                    className={cx('nav-btn')}
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    Trước
                </button>

                {/* Danh sách số trang */}
                <div className={cx('page-numbers')}>
                    {paginationRange.map((page, index) => (
                        <button
                            key={index}
                            className={cx('number-btn', {
                                active: page === currentPage,
                                dots: page === '...'
                            })}
                            disabled={page === '...'}
                            onClick={() => typeof page === 'number' && onPageChange(page)}
                        >
                            {page}
                        </button>
                    ))}
                </div>

                {/* Nút Tiếp */}
                <button
                    className={cx('nav-btn')}
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    Tiếp
                </button>
            </div>

            <div className={cx('right')}>
                <span>Hiển thị</span>
                <select value={pageSize} onChange={(e) => onLimitChange(Number(e.target.value))}>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                </select>
                <span>mục trên trang</span>
            </div>
        </div>
    );
}

export default CategoryPagination;