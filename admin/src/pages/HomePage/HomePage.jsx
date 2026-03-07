import React, { useEffect, useState } from 'react';
import Header from '../../components/EditHome/Homeheader';
import Filter from '../../components/EditHome/Homefilter';
import Hometable from '../../components/EditHome/Hometable';
import Pagination from '../../components/EditHome/Homepagination';
const API_URL = process.env.REACT_APP_API_URL;
function Home() {
    const [categories, setCategories] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(7);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetch(`${API_URL}/api/seo/public/menu-footer`)
            .then(res => res.json())
            .then(data => {
                const allData = [...(data.column1 || []), ...(data.column2 || []), ...(data.column3 || [])];
                const validData = allData.filter(item => item.Title !== null);
                setCategories(validData);
                setFilteredData(validData);
            })
            .catch(err => console.error("Lỗi:", err));
    }, []);

    const handleSearch = () => {
        const results = categories.filter(item => 
            item.Title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredData(results);
        setCurrentPage(1);
    };

    const indexOfLastItem = currentPage * pageSize;
    const indexOfFirstItem = indexOfLastItem - pageSize;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
    const handleDelete = async (id, title) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa bài viết "${title}" không?`)) {
            try {
                const res = await fetch(`${API_URL}/api/seo/topic/${id}`, {
                    method: 'DELETE',
                });

                if (res.ok) {
                    alert('Xóa thành công!');
                    // Cập nhật lại state để biến mất dòng vừa xóa mà không cần F5
                    const updatedData = categories.filter(item => item.Id !== id);
                    setCategories(updatedData);
                    setFilteredData(updatedData);
                } else {
                    alert('Lỗi khi xóa bài viết');
                }
            } catch (err) {
                console.error("Lỗi:", err);
                alert('Không thể kết nối đến server');
            }
        }
    };
    return (
        <div className="p-4 bg-light min-vh-100 font-sans">
            <Header />
            <Filter 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
                onSearch={handleSearch} 
            />
            <div className="table-responsive bg-white rounded shadow-sm border">
                <Hometable data={currentItems} startIndex={indexOfFirstItem} onDelete={handleDelete} />
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    setPageSize={(size) => { setPageSize(size); setCurrentPage(1); }}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
}

export default Home;