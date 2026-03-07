import ProductFilter from "../../components/product/ProductFiter";
import ProductHeader from "../../components/product/productHeader";
import { useState, useEffect } from 'react';
import axios from 'axios';
import CategoryPagination from "../../components/product/productpagination";
import CategoryTable from "../../components/product/producttable";

const API_URL = process.env.REACT_APP_API_URL;

function Product() {
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({});
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]); // State này đang giữ danh sách ID cần xóa

    const [filters, setFilters] = useState({
        categoryId: '',
        name: ''
    });

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/products`, {
                params: {
                    page: page,
                    limit: limit,
                    categoryId: filters.categoryId || undefined, 
                    q: filters.name || undefined
                }
            });
            if (res.data.success) {
                setProducts(res.data.data);
                setPagination(res.data.pagination);
            }
        } catch (error) {
            console.error("Lỗi:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [page, filters, limit]);

    return ( 
        <div>
            <ProductHeader 
                selectedIds={selectedIds} 
                onRefresh={() => {
                    fetchProducts();
                    setSelectedIds([]); // Xóa xong thì reset mảng chọn về rỗng
                }} 
            />
            
            <ProductFilter onFilter={(filterValues) => { 
                setFilters(filterValues); 
                setPage(1); 
            }} />
            
            {/* QUAN TRỌNG: Cần truyền 2 props này xuống để Table có thể cập nhật selectedIds */}
            <CategoryTable 
                products={products} 
                loading={loading} 
                selectedIds={selectedIds} 
                onSelectionChange={setSelectedIds} 
            />
            
            <CategoryPagination 
                pagination={pagination} 
                onPageChange={setPage} 
                onLimitChange={(newLimit) => {
                    setLimit(newLimit);
                    setPage(1);
                }} 
            /> 
        </div>
    );
}

export default Product;