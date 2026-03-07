import React from 'react';

const Pagination = ({ currentPage, totalPages, pageSize, setPageSize, onPageChange }) => (
    <div className="d-flex justify-content-between align-items-center p-3 bg-light-subtle border-top">
        <div className="d-flex gap-2">
            <button 
                className="btn btn-sm btn-outline-secondary px-3"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                Trước
            </button>
            <div className="btn btn-sm btn-white border px-3 fw-medium">
                Trang {currentPage} / {totalPages}
            </div>
            <button 
                className="btn btn-sm btn-outline-secondary px-3"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                Tiếp
            </button>
        </div>
        <div className="d-flex align-items-center gap-2">
            <span className="small text-muted">Hiển thị</span>
            <select 
                className="form-select form-select-sm" 
                style={{ width: '80px' }}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
            >
                {[5, 7, 10, 20].map(size => (
                    <option key={size} value={size}>{size}</option>
                ))}
            </select>
        </div>
    </div>
);

export default Pagination;