import { Link } from 'react-router-dom';
import '../../index.css';
export default function Sidebar() {
    return (
        <div className="border-end bg-white" style={{ width: 250, minHeight: '100vh' }}>
            {/* Header */}
            <div className="p-3 fw-bold fs-5 border-bottom">
                {/* Bỏ text-primary ở div cha, đưa vào Link và thêm text-decoration-none */}
                <Link to="/admin" className="nav-link text-primary d-flex align-items-center text-decoration-none">
                    <i className="bi bi-box-seam me-2"></i>
                    Bảo tín Computer
                </Link>
            </div>
            <ul className="nav flex-column p-2">
                {/* Authentication */}
                <li className="nav-item">
                    <a className="nav-link fw-semibold d-flex justify-content-between align-items-center" data-bs-toggle="collapse" href="#oderMenu">
                        <span>Quản Lý Đơn Hàng</span>
                        <i className="bi bi-chevron-down small"></i>
                    </a>
                    <div className="collapse ps-4" id="oderMenu">
                        <Link to="/admin/orders" className="nav-link text-muted">
                            Đơn Hàng
                        </Link>
                        <Link to="/admin" className="nav-link text-muted">
                            Giao Hàng
                        </Link>
                        <Link to="/admin" className="nav-link text-muted">
                            yêu cầu trả lại
                        </Link>
                        <Link to="/admin" className="nav-link text-muted">
                            Thẻ quà tặng
                        </Link>
                    </div>
                </li>
                <li className="nav-item">
                    <a className="nav-link fw-semibold d-flex justify-content-between align-items-center" data-bs-toggle="collapse" href="#productMenu">
                        <span>Quản Lý Sản phẩm</span>
                        <i className="bi bi-chevron-down small"></i>
                    </a>
                    <div className="collapse ps-4" id="productMenu">
                        <Link to="/admin/product" className="nav-link text-muted">
                            Sản Phẩm
                        </Link>
                        <Link to="/admin" className="nav-link text-muted">
                            Nhà sản xuất
                        </Link>
                        <Link to="/admin" className="nav-link text-muted">
                            Đánh giá sản phẩm
                        </Link>
                    </div>
                </li>
                <li className="nav-item">
                    <a className="nav-link fw-semibold d-flex justify-content-between align-items-center" data-bs-toggle="collapse" href="#psMenu">
                        <span> Quản Lý Danh Mục</span>
                        <i className="bi bi-chevron-down small"></i>
                    </a>
                    <div className="collapse ps-4" id="psMenu">
                        <Link to="/admin/Category" className="nav-link text-muted">
                            Danh Mục Sản Phẩm
                        </Link>
                         <Link to="/admin/CatergoryNewPage" className="nav-link text-muted">
                            Danh Mục Bài Viết
                        </Link>
                    </div>
                </li>
                {/* Users */}
                <li className="nav-item">
                    <a className="nav-link fw-semibold d-flex justify-content-between align-items-center" data-bs-toggle="collapse" href="#userMenu">
                        <span>Quản Lý Khách Hàng</span>
                        <i className="bi bi-chevron-down small"></i>
                    </a>
                    <div className="collapse ps-4" id="userMenu">
                        <Link to="/admin/users" className="nav-link text-muted">
                            Danh Sách Khách Hàng
                        </Link>
                        <Link to="/admin/account" className="nav-link text-muted">
                            Vai trò khách hàng
                        </Link>
                    </div>
                </li>
                <li className="nav-item">
                    <a className="nav-link fw-semibold d-flex justify-content-between align-items-center" data-bs-toggle="collapse" href="#newMenu">
                        <span>Quản Lý Bài Viết</span>
                        <i className="bi bi-chevron-down small"></i>
                    </a>
                    <div className="collapse ps-4" id="newMenu">
                        <Link to="/admin/new" className="nav-link text-muted">
                            Bài Viết
                        </Link>
                    </div>
                </li>
                <li className="nav-item">
                    <a className="nav-link fw-semibold d-flex justify-content-between align-items-center" data-bs-toggle="collapse" href="#kmMenu">
                        <span>Khuyến Mại</span>
                        <i className="bi bi-chevron-down small"></i>
                    </a>

                    <div className="collapse ps-4" id="kmMenu">
                        <Link to="/admin/warrantypage" className="nav-link text-muted">
                            Bảo Hành 
                        </Link>
                        <Link to="/admin" className="nav-link text-muted">
                            Chiến dịch
                        </Link>
                        <Link to="/admin" className="nav-link text-muted">
                            Đăng kí nhận tin
                        </Link>
                    </div>
                </li>
                <li className="nav-item">
                    <a className="nav-link fw-semibold d-flex justify-content-between align-items-center" data-bs-toggle="collapse" href="#ctMenu">
                        <span>Trang Chủ</span>
                        <i className="bi bi-chevron-down small"></i>
                    </a>
                    <div className="collapse ps-4" id="ctMenu">
                        <Link to="/admin/seohome" className="nav-link text-muted">
                           Seo trang chủ
                        </Link>
                        <Link to="/admin/homemenu" className="nav-link text-muted">
                            Menu chân trang
                        </Link>
                    </div>
                </li>
            </ul>
        </div>
    );
}
