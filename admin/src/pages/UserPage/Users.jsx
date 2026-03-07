import React from 'react';

export default function Users() {
  // Dữ liệu khách hàng mẫu dựa trên ảnh
  const users = [
    { email: 'dodung1542k1@gmail.com', name: '', roles: 'Registered, NV', phone: 'tân lập', active: true },
    { email: 'maytinhhtc1@gmail.com', name: '', roles: 'Registered', phone: '0974697439', active: true },
    { email: 'maytinhhtc3@gmail.com', name: 'Quản Trị Viên', roles: 'Administrators, Registered', phone: '0933666982', active: true },
  ];

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      {/* HEADER SECTION */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="fw-bold mb-0">Danh sách khách hàng</h3>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb small mb-0">
              <li className="breadcrumb-item"><a href="#" className="text-decoration-none text-muted">Bảng điều khiển</a></li>
              <li className="breadcrumb-item active">Danh sách khách hàng</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary btn-sm px-3 fw-bold shadow-sm">
            <span className="me-1">+</span> Thêm mới
          </button>
          <button className="btn btn-success btn-sm px-2 shadow-sm">
             <i className="bi bi-three-dots"></i>
          </button>
        </div>
      </div>

      {/* SEARCH SECTION */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <i className="bi bi-search"></i> 
                </span>
                <input type="text" className="form-control border-start-0" placeholder="Nhập email..." />
              </div>
            </div>
            <div className="col-md-2">
              <button className="btn btn-primary w-100 fw-bold shadow-sm">
                 Tìm kiếm
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOMER LIST TABLE SECTION */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr className="small fw-bold text-dark border-bottom">
                  <th className="ps-3" style={{ width: '40px' }}>
                    <input type="checkbox" className="form-check-input border-secondary" />
                  </th>
                  <th style={{ minWidth: '200px' }}>Email</th>
                  <th>Tên</th>
                  <th>Vai trò khách hàng</th>
                  <th>Điện thoại</th>
                  <th className="text-center">Kích hoạt</th>
                  <th className="text-center" style={{ width: '100px' }}>Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={index} style={{ fontSize: '14px' }}>
                    <td className="ps-3">
                      <input type="checkbox" className="form-check-input border-secondary shadow-none" />
                    </td>
                    <td className="text-dark">{user.email}</td>
                    <td>{user.name}</td>
                    <td>{user.roles}</td>
                    <td>{user.phone}</td>
                    <td className="text-center">
                      {user.active && <span className="text-primary fw-bold" style={{fontSize: '18px'}}>✓</span>}
                    </td>
                    <td className="text-center">
                      <button className="btn btn-primary btn-sm rounded-2 px-2 shadow-sm">
                         <i className="bi bi-pencil-fill"></i> 
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION SECTION */}
          <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light rounded-bottom">
            <div className="d-flex gap-2 align-items-center">
              <button className="btn btn-sm btn-link text-decoration-none text-muted p-0 me-2">Trước</button>
              <button className="btn btn-primary btn-sm px-3 fw-bold rounded-1">1</button>
              <button className="btn btn-sm btn-link text-decoration-none text-muted p-0 ms-2">Tiếp</button>
            </div>
            <div className="small text-muted d-flex align-items-center gap-2">
              <span>Show</span>
              <select className="form-select form-select-sm shadow-none" style={{ width: '70px' }}>
                <option>15</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}