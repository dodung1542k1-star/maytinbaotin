import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({ totalProfit: 0, totalAmount: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const navigate = useNavigate();
  
  const [filter, setFilter] = useState({
    customerName: '',
    orderId: '',
    orderStatusId: '0',
    fromDate: '',
    toDate: ''
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const getStatusBadge = (statusId) => {
    switch (Number(statusId)) {
      case 10: return <span className="badge bg-warning text-dark px-2 py-1">Đang chờ</span>;
      case 20: return <span className="badge bg-info text-white px-2 py-1">Đang xử lý</span>;
      case 30: return <span className="badge bg-success px-2 py-1">Hoàn thành</span>;
      case 40: return <span className="badge bg-danger px-2 py-1">Đã hủy</span>;
      default: return <span className="badge bg-secondary px-2 py-1">Không xác định</span>;
    }
  };

  // Hàm gọi API (có tham số page)
  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/orders/list`, { 
        params: { ...filter, page, pageSize: 10 } 
      });
      if (response.data.success) {
        setOrders(response.data.data); // Chỉ chứa 10 dòng của trang hiện tại
        setSummary(response.data.summary); // Chứa con số tổng của toàn bộ các trang
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Lỗi khi lấy đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders(1);
  }, [filter.orderStatusId]); // Tự động load khi đổi trạng thái nhanh

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOrders(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchOrders(newPage);
    }
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="fw-bold mb-0">Quản lý Đơn hàng</h3>
          <p className="text-muted small">Danh sách đơn hàng hệ thống</p>
        </div>
      </div>

      {/* FILTER FORM */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <form onSubmit={handleSearch}>
            <div className="row g-3">
              <div className="col-md-4">
                <input type="text" className="form-control" placeholder="Tên khách hàng/Email..." 
                  value={filter.customerName} onChange={(e) => setFilter({...filter, customerName: e.target.value})} />
              </div>
              <div className="col-md-2">
                <select className="form-select" value={filter.orderStatusId} 
                  onChange={(e) => setFilter({...filter, orderStatusId: e.target.value})}>
                  <option value="0">Tất cả trạng thái</option>
                  <option value="10">Đang chờ</option>
                  <option value="20">Đang xử lý</option>
                  <option value="30">Hoàn thành</option>
                  <option value="40">Đã hủy</option>
                </select>
              </div>
              <div className="col-md-2">
                <input type="date" className="form-control" onChange={(e) => setFilter({...filter, fromDate: e.target.value})} />
              </div>
              <div className="col-md-2">
                <input type="date" className="form-control" onChange={(e) => setFilter({...filter, toDate: e.target.value})} />
              </div>
              <div className="col-md-2">
                <button type="submit" className="btn btn-primary w-100">Tìm kiếm</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr className="small text-uppercase fw-bold">
                  <th className="ps-3">ID</th>
                  <th>Trạng thái</th>
                  <th>Khách hàng</th>
                  <th>Ngày tạo</th>
                  <th>Tổng tiền</th>
                  <th>Lợi nhuận</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="text-center py-5">Đang tải...</td></tr>
                ) : orders.map((order) => (
                  <tr key={order.Id}>
                    <td className="ps-3 fw-bold">#{order.Id}</td>
                    <td>{getStatusBadge(order.OrderStatusId)}</td>
                    <td>
                      <div>{order.CustomerFullName}</div>
                      <div className="small text-muted">{order.CustomerEmail}</div>
                    </td>
                    <td>{new Date(order.CreatedOnUtc).toLocaleString('vi-VN')}</td>
                    <td className="fw-bold">{formatCurrency(order.OrderTotal)}</td>
                    <td className="text-success">{formatCurrency(order.TotalProfit)}</td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-light border" onClick={() => navigate(`/admin/order/edit/${order.Id}`)}>
                        <i className="bi bi-eye"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* SUMMARY */}
          <div className="d-flex justify-content-end p-3 bg-light border-top border-bottom">
            <div className="text-end" style={{minWidth: '280px', fontSize: '13px'}}>
              <div className="small text-muted mb-2 fw-bold text-uppercase">Tóm tắt kết quả lọc</div>
              <div className="d-flex justify-content-between mb-1">
                <span>Tổng đơn hàng:</span> 
                <span className="fw-bold">{summary.count} đơn</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span>Tổng lợi nhuận:</span> 
                <span className="text-success fw-bold">{formatCurrency(summary.totalProfit)}</span>
              </div>
              <div className="d-flex justify-content-between border-top mt-1 pt-1">
                <span className="fw-bold">Tổng doanh thu:</span> 
                <span className="fw-bold text-primary" style={{fontSize: '15px'}}>{formatCurrency(summary.totalAmount)}</span>
              </div>
            </div>
          </div>
          {/* PAGINATION FOOTER */}
          <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
              <div className="small text-muted">
                  Hiển thị <strong>{orders.length}</strong> / {pagination.totalItems} đơn hàng
              </div>
              <nav>
                  <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                          <button type="button" className="page-link" onClick={() => handlePageChange(pagination.currentPage - 1)}>Trước</button>
                      </li>
                      {[...Array(pagination.totalPages)].map((_, i) => (
                          <li key={i} className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}>
                              <button type="button" className="page-link" onClick={() => handlePageChange(i + 1)}>{i + 1}</button>
                          </li>
                      ))}
                      <li className={`page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`}>
                          <button type="button" className="page-link" onClick={() => handlePageChange(pagination.currentPage + 1)}>Sau</button>
                      </li>
                  </ul>
              </nav>
          </div>
        </div>
      </div>
    </div>
  );
}