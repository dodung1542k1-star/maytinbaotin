import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Tooltip, Legend, Filler
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

const API_URL = process.env.REACT_APP_API_URL;
// Cấu hình hiển thị trạng thái
const STATUS_MAP = {
  10: { label: "Đang chờ", color: "bg-warning text-dark" },
  20: { label: "Đang xử lý", color: "bg-info text-white" },
  30: { label: "Hoàn thành", color: "bg-success text-white" },
  40: { label: "Đã hủy", color: "bg-danger text-white" }
};

export default function Dashboard() {
  const [data, setData] = useState({ stats: [], latestOrders: [], chartData: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const formatVND = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/orders/dashboard-stats`);
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Lỗi tải Dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Xử lý dữ liệu cho biểu đồ Doanh thu 12 tháng
  const lineData = {
    labels: ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"],
    datasets: [{
      label: "Doanh thu (VNĐ)",
      data: Array.from({ length: 12 }, (_, i) => {
        const monthData = data.chartData?.find(d => d.Month === i + 1);
        return monthData ? monthData.MonthlyTotal : 0;
      }),
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      fill: true,
      tension: 0.4,
      pointRadius: 4,
    }],
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary" role="status"></div>
    </div>
  );

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold m-0 text-dark">Báo Cáo Thống Kê</h4>
        <button className="btn btn-white shadow-sm btn-sm" onClick={() => window.location.reload()}>
          <i className="bi bi-arrow-clockwise"></i> Làm mới
        </button>
      </div>

      {/* ===== TOP CARDS ===== */}
      <div className="row g-3 mb-4">
        {[
         { title: "Tổng đơn hàng", value: data.stats?.reduce((sum, s) => sum + (s.Count || 0), 0) || 0, icon: "bi-cart-check", color: "text-primary" },
          { title: "Đơn hoàn thành", value: data.stats.find(s => s.OrderStatusId === 30)?.Count || 0, icon: "bi-check-circle", color: "text-success" },
          { title: "Đơn đang xử lý", value: data.stats.find(s => s.OrderStatusId === 20)?.Count || 0, icon: "bi-hourglass-split", color: "text-warning" },
          { title: "Tổng doanh thu", value: formatVND(data.stats.reduce((a, b) => a + (b.Total || 0), 0)), icon: "bi-cash-stack", color: "text-danger" },
        ].map((item, i) => (
          <div className="col-md-3" key={i}>
            <div className="card border-0 shadow-sm p-3 position-relative overflow-hidden">
              <div className="d-flex align-items-center">
                <div className={`rounded-circle bg-light p-3 ${item.color} me-3`}>
                  <i className={`bi ${item.icon} fs-4`}></i>
                </div>
                <div>
                  <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '11px' }}>{item.title}</small>
                  <h4 className="fw-bold mb-0">{item.value}</h4>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 mb-4">
        {/* BIỂU ĐỒ DOANH THU */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm p-4 h-100">
            <h6 className="fw-bold mb-4">Doanh thu năm nay</h6>
            <div style={{ height: '300px' }}>
              <Line 
                data={lineData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } }
                }} 
              />
            </div>
          </div>
        </div>

        {/* THỐNG KÊ CHI TIẾT TRẠNG THÁI */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm p-4 h-100">
            <h6 className="fw-bold mb-3">Doanh thu theo trạng thái</h6>
            <div className="mt-3">
              {data.stats.map((s, i) => {
                const status = STATUS_MAP[s.OrderStatusId] || { label: "Khác", color: "bg-secondary" };
                return (
                  <div key={i} className="mb-4">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="small fw-bold">{status.label}</span>
                      <span className="small text-muted">{formatVND(s.Total)}</span>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div className={`progress-bar ${status.color.split(' ')[0]}`} 
                           style={{ width: `${(s.Total / data.stats.reduce((a, b) => a + b.Total, 0)) * 100}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ===== LATEST ORDERS TABLE ===== */}
      <div className="card border-0 shadow-sm p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h6 className="fw-bold mb-0"><i className="bi bi-clock-history me-2"></i>Đơn hàng mới nhất</h6>
          <button onClick={() => navigate('/admin/orders')} className="btn btn-sm btn-outline-primary fw-bold px-3">
            Xem tất cả <i className="bi bi-arrow-right ms-1"></i>
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr style={{ fontSize: '13px' }}>
                <th className="border-0">#ID</th>
                <th className="border-0">Trạng thái</th>
                <th className="border-0">Khách hàng</th>
                <th className="border-0">Ngày đặt</th>
                <th className="border-0 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.latestOrders.map((o) => {
                const status = STATUS_MAP[o.OrderStatusId] || { label: "N/A", color: "bg-secondary" };
                return (
                  <tr key={o.Id} style={{ fontSize: '14px' }}>
                    <td className="fw-bold text-primary">#{o.Id}</td>
                    <td>
                      <span className={`badge rounded-pill ${status.color}`} style={{ fontSize: '11px', padding: '5px 10px' }}>
                        {status.label}
                      </span>
                    </td>
                    <td className="fw-semibold">{o.CustomerName}</td>
                    <td className="text-muted small">
                      {new Date(o.CreatedOnUtc).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="text-center">
                      <button 
                        onClick={() => navigate(`/admin/order/edit/${o.Id}`)} 
                        className="btn btn-sm btn-light border"
                        title="Xem chi tiết"
                      >
                        <i className="bi bi-eye text-primary"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}