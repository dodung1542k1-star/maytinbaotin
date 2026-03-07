import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    const confirmLogout = window.confirm("Bạn có chắc chắn muốn đăng xuất không?");
    if (confirmLogout) {
      // 1. Xóa dữ liệu phiên làm việc
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // 2. Đẩy về trang login
      // Sử dụng replace: true để người dùng không thể nhấn nút "Back" quay lại Admin
      navigate('/admin/login', { replace: true });
    }
  };

  return (
    <nav className="navbar bg-white border-bottom px-3 d-flex align-items-center justify-content-between">
      {/* Left */}
      <div className="d-flex align-items-center gap-3">
        <button className="btn btn-light border-0">
          <i className="bi bi-list fs-4"></i>
        </button>

        <div className="position-relative">
          <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
          <input
            type="text"
            className="form-control ps-5"
            placeholder="Ctrl + K"
            style={{ width: 260 }}
          />
        </div>
      </div>

      {/* Right */}
      <div className="d-flex align-items-center gap-3">
        <button className="btn btn-light border-0">
          <i className="bi bi-github fs-5"></i>
        </button>

        <button className="btn btn-light border-0 position-relative">
          <i className="bi bi-bell fs-5"></i>
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary">
            2
          </span>
        </button>

        {/* Nút Đăng xuất được lồng vào Avatar hoặc tạo nút riêng */}
        <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={handleLogout}>
          <img
            src="https://i.pravatar.cc/40"
            alt="avatar"
            className="rounded-circle border"
            width={36}
            height={36}
          />
          <button className="btn btn-sm btn-outline-danger border-0">
            <i className="bi bi-box-arrow-right"></i> Thoát
          </button>
        </div>
      </div>
    </nav>
  );
}