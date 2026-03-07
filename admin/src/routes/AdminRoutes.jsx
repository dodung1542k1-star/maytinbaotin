import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../utils/ProtectedRoute';
import AdminLayout from '../Layout/Adminlayout/AdminLayout';

// Import các Page
import Dashboard from '../pages/DashboardPage/DashboardPage';
import Users from '../pages/UserPage/Users';
import Orders from '../pages/OrdersPage/Orders';
import Login from '../pages/Loginpage/Login';
import Product from '../pages/ProductPage/product';
import CategoryForm from '../components/category/categoryform';
import CategoryPage from '../pages/CategoryPage/CategoryPage';
import CatergoryNewPage from '../pages/CatergoryNewPage/CatergoryNewPage';
import NewPage from '../pages/NewPage/NewPage';
import EditNew from '../components/Editnew/Editnew';
import ProductFrom from '../components/product/Productfrom';
import Account from '../pages/AccountPage/account';
import OrderDetail from '../pages/orderdetail/orderdetail';
import SeoHomePage from '../pages/SeoHomepage/Seohomepage';
import HomePage from '../pages/HomePage/HomePage';
import HomeForm from '../components/EditHome/Homefrom';
import CategoryFormNew from '../components/categorynew/categoryFromnew';
import EditAccount from '../components/editaccount/account';
import WarrantyPage from '../pages/WarrantyPage/Warranty';

export default function AdminRoutes() {
    return (
        <Routes>
            <Route path="/admin/login" element={<Login />} />
            <Route 
                element={
                    <ProtectedRoute requiredRole="NV">
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/admin/orders" element={<Orders />} />
                <Route path="/admin/account" element={<Account />} />
                <Route path="/admin/users" element={<Users />} />
                <Route path="/admin/product" element={<Product />} />
                <Route path="/admin/category" element={<CategoryPage />} />
                <Route path="/admin/category/create" element={<CategoryForm />} />
                <Route path="/admin/category/edit/:id" element={<CategoryForm />} />
                <Route path="/admin/catergorynewpage" element={<CatergoryNewPage />} />
                <Route path="/admin/new" element={<NewPage />} />
                <Route path="/admin/new/edit/:id" element={<EditNew />} />
                <Route path="/admin/new/create" element={<EditNew />} />
                <Route path="/admin/product/edit/:id" element={<ProductFrom />} />
                <Route path="/admin/product/add/" element={<ProductFrom />} />
                <Route path="/admin/order/edit/:id" element={<OrderDetail />} />
                <Route path="/admin/seohome" element={<SeoHomePage />} />
                <Route path="/admin/homemenu" element={<HomePage />} />
                <Route path="/admin/home/create/:id" element={<HomeForm />} />
                <Route path="/admin/home/create/" element={<HomeForm />} />
                <Route path="/admin/catergorynewpage/create" element={<CategoryFormNew />} />
                <Route path="/admin/catergorynewpage/edit/:id" element={<CategoryFormNew />} />
                <Route path="/admin/editaccount/create" element={<EditAccount />} />
                <Route path="/admin/warrantypage" element={<WarrantyPage />} />
            </Route>

            {/* 3. Bắt các đường dẫn lạ trong vùng admin và đẩy về /admin để kiểm tra lại login */}
            <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
        </Routes>
    );
}