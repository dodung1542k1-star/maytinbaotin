import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [tempStatus, setTempStatus] = useState("");

    const statusConfig = {
        10: { label: "Đang chờ", class: "bg-warning text-dark", icon: "bi-clock" },
        20: { label: "Đang xử lý", class: "bg-info text-white", icon: "bi-gear" },
        30: { label: "Hoàn thành", class: "bg-success text-white", icon: "bi-check-circle" },
        40: { label: "Đã hủy", class: "bg-danger text-white", icon: "bi-x-circle" }
    };

    useEffect(() => { fetchOrder(); }, [id]);

    const fetchOrder = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/orders/${id}`);
            if (res.data.success) {
                const receivedData = res.data.data;
                // Khởi tạo Items nếu null
                if (!receivedData.Items) receivedData.Items = [];
                setOrder(receivedData);
                setTempStatus(receivedData.OrderStatusId);
            }
        } catch (err) {
            console.error("Lỗi tải đơn hàng:", err);
        }
    };

    const handleUpdateStatus = async () => {
        try {
            await axios.put(`${API_URL}/api/orders/${id}/status`, { 
                orderStatusId: parseInt(tempStatus) 
            });
            setShowStatusModal(false);
            fetchOrder();
        } catch (err) { 
            alert("Lỗi cập nhật trạng thái"); 
        }
    };

    if (!order) return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="spinner-border text-primary" role="status"></div>
            <span className="ms-2">Đang tải dữ liệu...</span>
        </div>
    );

    const currentStatus = statusConfig[order.OrderStatusId] || statusConfig[10];
    const fallbackImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 px-3">
                <div>
                    <h3 className="fw-bold mb-0">Đơn hàng <span className="text-primary">#{order.CustomOrderNumber || order.Id}</span></h3>
                    <p className="text-muted mb-0">Ngày đặt: {new Date(order.CreatedOnUtc).toLocaleString('vi-VN')}</p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-secondary shadow-sm" onClick={() => navigate(-1)}>
                        <i className="bi bi-arrow-left"></i> Quay lại
                    </button>
                    <button className="btn btn-primary shadow-sm" onClick={() => setShowStatusModal(true)}>
                        <i className="bi bi-pencil-square"></i> Cập nhật trạng thái
                    </button>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-lg-8">
                    {/* Bảng sản phẩm */}
                    <div className="card shadow-sm border-0 rounded-3 mb-4">
                        <div className="card-header bg-white py-3">
                            <h6 className="mb-0 fw-bold"><i className="bi bi-box-seam me-2"></i>Sản phẩm đơn hàng</h6>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="ps-4">Sản phẩm</th>
                                            <th className="text-center">Số lượng</th>
                                            <th className="text-end pe-4">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.Items.map((item, index) => (
                                            <tr key={item.Id || index}>
                                                <td className="ps-4 py-3">
                                                    <div className="d-flex align-items-center">
                                                        <img 
                                                            src={`${API_URL}${item.ProductImage}`}
                                                            alt={item.ProductName}
                                                            className="rounded border me-3"
                                                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                            onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }}
                                                        />
                                                        <div>
                                                            <div className="fw-bold text-dark">{item.ProductName}</div>
                                                            <div className="text-muted small">Mã SP: {item.ProductId}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-center">{item.Quantity}</td>
                                                <td className="text-end pe-4 fw-bold">
                                                    {(item.UnitPriceExclTax * item.Quantity).toLocaleString()} <small>đ</small>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Tổng tiền */}
                    <div className="card shadow-sm border-0 rounded-3 p-4 bg-white">
                        <div className="row justify-content-end">
                            <div className="col-md-5">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Tạm tính:</span>
                                    <span>{order.OrderSubtotalExclTax?.toLocaleString()} đ</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Phí vận chuyển:</span>
                                    <span>{order.OrderShippingExclTax?.toLocaleString()} đ</span>
                                </div>
                                <hr />
                                <div className="d-flex justify-content-between">
                                    <span className="fw-bold h5">TỔNG CỘNG:</span>
                                    <span className="fw-bold h5 text-danger">{order.OrderTotal?.toLocaleString()} đ</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar thông tin */}
               <div className="col-lg-4">
                `    {/* 1. Card Trạng thái - mb-4 để cách cái dưới */}
                    <div className="card shadow-sm border-0 rounded-3 mb-4">
                        <div className="card-body text-center py-4">
                            <h6 className="text-muted text-uppercase small fw-bold mb-3">Trạng thái hiện tại</h6>
                            <span className={`badge rounded-pill ${currentStatus.class} px-4 py-2 fs-6`}>
                                <i className={`bi ${currentStatus.icon} me-2`}></i>
                                {currentStatus.label}
                            </span>
                        </div>
                    </div>

                    {/* 2. Card Khách hàng - mb-4 để cách cái dưới */}
                    <div className="card shadow-sm border-0 rounded-3 mb-4">
                        <div className="card-header bg-white py-3 border-bottom-0">
                            <h6 className="mb-0 fw-bold"><i className="bi bi-person me-2"></i>Khách hàng</h6>
                        </div>
                        <div className="card-body pt-0">
                            <p className="fw-bold mb-1">{order.CustomerFirstName} {order.CustomerLastName}</p>
                            <p className="text-muted small mb-0"><i className="bi bi-envelope me-1"></i>{order.CustomerEmail}</p>
                        </div>
                    </div>

                    {/* 3. Card Địa chỉ - mb-4 để cách cái dưới */}
                    <div className="card shadow-sm border-0 rounded-3 mb-4">
                        <div className="card-header bg-white py-3 border-bottom-0">
                            <h6 className="mb-0 fw-bold"><i className="bi bi-truck me-2"></i>Địa chỉ nhận hàng</h6>
                        </div>
                        <div className="card-body pt-0">
                            <p className="mb-0 text-dark">{order.Address1 || "Chưa có thông tin địa chỉ"}</p>
                            {order.City && <small className="text-muted">{order.City}</small>}
                        </div>
                    </div>

                    {/* 4. Card Số điện thoại - Cái cuối cùng không cần mb-4 trừ khi bạn muốn cách đáy trang */}
                    <div className="card shadow-sm border-0 rounded-3 mb-4">
                        <div className="card-header bg-white py-3 border-bottom-0">
                            <h6 className="mb-0 fw-bold"><i className="bi bi-telephone me-2"></i>Số Điện Thoại</h6>
                        </div>
                        <div className="card-body pt-0">
                            <p className="mb-0 fw-bold text-primary fs-5">
                                <i className="bi bi-phone me-2"></i>
                                {order.PhoneNumber || "N/A"}
                            </p>
                        </div>
                    </div>
                </div>`
            </div>

            {/* Modal */}
            {showStatusModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">Cập nhật trạng thái</h5>
                                <button className="btn-close btn-close-white" onClick={() => setShowStatusModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <select className="form-select form-select-lg" value={tempStatus} onChange={(e) => setTempStatus(e.target.value)}>
                                    <option value="10">🕒 Đang chờ</option>
                                    <option value="20">⚙️ Đang xử lý</option>
                                    <option value="30">✅ Hoàn thành</option>
                                    <option value="40">❌ Đã hủy</option>
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>Hủy</button>
                                <button className="btn btn-primary px-4" onClick={handleUpdateStatus}>Lưu thay đổi</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDetail;