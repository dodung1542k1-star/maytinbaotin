import React from 'react';
import { Search } from 'lucide-react';

const Filter = ({ searchTerm, setSearchTerm, onSearch }) => (
    <div className="bg-white p-3 rounded shadow-sm mb-3 border">
        <div className="input-group">
            <input 
                type="text" 
                className="form-control border-secondary-subtle" 
                placeholder="Nhập tên danh mục..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            />
            <button className="btn btn-primary px-4 d-flex align-items-center gap-2" onClick={onSearch}>
                <Search size={18} /> Tìm kiếm
            </button>
        </div>
    </div>
);

export default Filter;