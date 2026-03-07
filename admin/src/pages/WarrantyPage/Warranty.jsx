import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Edit, Trash2, Plus, FileSpreadsheet, Loader2 } from 'lucide-react';

function WarrantyPage() {
    const [warranties, setWarranties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    
    const [currentData, setCurrentData] = useState({
        customer_name: '', phone_number: '', serial_number: '',
        warranty_code: '', product_name: '', purchase_date: '',
        expiry_date: '', status: 'Bình thường', note: ''
    });

    // 1. Lấy danh sách sản phẩm bảo hành
    const fetchWarranties = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:8080/api/warranty/all');
            if (res.data.success) {
                setWarranties(res.data.data);
            }
        } catch (err) {
            console.error("Lỗi lấy dữ liệu:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchWarranties(); }, []);

    // 2. Xử lý Thêm hoặc Sửa
    const handleSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            if (isEdit) {
                await axios.put(`http://localhost:8080/api/warranty/update/${currentData.id}`, currentData);
            } else {
                await axios.post('http://localhost:8080/api/warranty/add', currentData);
            }
            setShowModal(false);
            fetchWarranties();
            resetForm();
        } catch (err) {
            alert("Có lỗi xảy ra, vui lòng kiểm tra lại dữ liệu!");
        } finally {
            setActionLoading(false);
        }
    };

    // 3. Xử lý Xóa
    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa bản ghi này?")) {
            try {
                await axios.delete(`http://localhost:8080/api/warranty/delete/${id}`);
                fetchWarranties();
            } catch (err) {
                alert("Không thể xóa bản ghi này!");
            }
        }
    };

    // 4. Xử lý Import Excel
    const handleImportExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setActionLoading(true);
        try {
            const res = await axios.post('http://localhost:8080/api/warranty/import-excel', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(res.data.message);
            fetchWarranties();
        } catch (err) {
            alert("Lỗi khi nhập file Excel! Vui lòng kiểm tra định dạng file.");
        } finally {
            setActionLoading(false);
            e.target.value = null; // Reset input file
        }
    };

    const resetForm = () => {
        setCurrentData({
            customer_name: '', phone_number: '', serial_number: '',
            warranty_code: '', product_name: '', purchase_date: '',
            expiry_date: '', status: 'Bình thường', note: ''
        });
        setIsEdit(false);
    };

    const openEdit = (item) => {
        setIsEdit(true);
        // Xử lý format ngày để input type="date" có thể đọc được (YYYY-MM-DD)
        const formattedItem = {
            ...item,
            purchase_date: item.purchase_date ? item.purchase_date.split('T')[0] : '',
            expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : ''
        };
        setCurrentData(formattedItem);
        setShowModal(true);
    };

    return (
        <div className="container-fluid py-4">
            <div className="card shadow border-0">
                <div className="card-header bg-white py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
                    <h5 className="mb-0 fw-bold text-primary">HỆ THỐNG QUẢN LÝ BẢO HÀNH</h5>
                    
                    <div className="d-flex gap-2">
                        {/* Nút Import Excel */}
                        <label className="btn btn-outline-success d-flex align-items-center gap-2 mb-0 cursor-pointer">
                            <input type="file" hidden accept=".xlsx, .xls" onChange={handleImportExcel} disabled={actionLoading} />
                            <FileSpreadsheet size={18} /> Import Excel
                        </label>

                        {/* Nút Thêm mới */}
                        <button className="btn btn-danger d-flex align-items-center gap-2" 
                                onClick={() => { resetForm(); setShowModal(true); }}>
                            <Plus size={18} /> Thêm Phiếu
                        </button>
                    </div>
                </div>

                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-5">
                            <Loader2 className="spinner-border text-primary" />
                            <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Mã Phiếu</th>
                                        <th>Khách Hàng</th>
                                        <th>Sản Phẩm / Serial</th>
                                        <th>Ngày Mua</th>
                                        <th>Hạn Bảo Hành</th>
                                        <th>Trạng Thái</th>
                                        <th className="text-center">Thao Tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {warranties.length > 0 ? warranties.map((item) => (
                                        <tr key={item.id}>
                                            <td><span className="badge bg-secondary">{item.warranty_code}</span></td>
                                            <td>
                                                <div className="fw-bold">{item.customer_name}</div>
                                                <small className="text-muted">{item.phone_number}</small>
                                            </td>
                                            <td>
                                                <div className="text-truncate" style={{maxWidth: '200px'}}>{item.product_name}</div>
                                                <small className="text-danger fw-medium">SN: {item.serial_number}</small>
                                            </td>
                                            <td>{new Date(item.purchase_date).toLocaleDateString('vi-VN')}</td>
                                            <td>{new Date(item.expiry_date).toLocaleDateString('vi-VN')}</td>
                                            <td>
                                                <span className={`badge ${new Date(item.expiry_date) < new Date() ? 'bg-danger' : 'bg-success'}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <button className="btn btn-sm btn-light text-primary me-2" onClick={() => openEdit(item)}>
                                                    <Edit size={16} />
                                                </button>
                                                <button className="btn btn-sm btn-light text-danger" onClick={() => handleDelete(item.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4 text-muted">Chưa có dữ liệu bảo hành nào.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Thêm/Sửa */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title fw-bold">
                                    {isEdit ? 'CẬP NHẬT THÔNG TIN' : 'TẠO PHIẾU BẢO HÀNH MỚI'}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Tên khách hàng</label>
                                        <input type="text" className="form-control" value={currentData.customer_name} required
                                            onChange={e => setCurrentData({...currentData, customer_name: e.target.value})} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Số điện thoại</label>
                                        <input type="text" className="form-control" value={currentData.phone_number} required
                                            onChange={e => setCurrentData({...currentData, phone_number: e.target.value})} />
                                    </div>
                                    <div className="col-md-12">
                                        <label className="form-label fw-bold">Tên sản phẩm</label>
                                        <input type="text" className="form-control" value={currentData.product_name} required
                                            onChange={e => setCurrentData({...currentData, product_name: e.target.value})} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Số Serial (S/N)</label>
                                        <input type="text" className="form-control" value={currentData.serial_number} required
                                            onChange={e => setCurrentData({...currentData, serial_number: e.target.value})} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Mã phiếu bảo hành</label>
                                        <input type="text" className="form-control" value={currentData.warranty_code} required
                                            onChange={e => setCurrentData({...currentData, warranty_code: e.target.value})} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Ngày mua</label>
                                        <input type="date" className="form-control" value={currentData.purchase_date} required
                                            onChange={e => setCurrentData({...currentData, purchase_date: e.target.value})} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Hạn bảo hành</label>
                                        <input type="date" className="form-control" value={currentData.expiry_date} required
                                            onChange={e => setCurrentData({...currentData, expiry_date: e.target.value})} />
                                    </div>
                                    <div className="col-md-12">
                                        <label className="form-label fw-bold">Trạng thái</label>
                                        <select className="form-select" value={currentData.status}
                                            onChange={e => setCurrentData({...currentData, status: e.target.value})}>
                                            <option value="Bình thường">Bình thường</option>
                                            <option value="Đang bảo hành">Đang bảo hành</option>
                                            <option value="Hết hạn">Hết hạn</option>
                                            <option value="Đã trả máy">Đã trả máy</option>
                                        </select>
                                    </div>
                                    <div className="col-md-12">
                                        <label className="form-label fw-bold">Ghi chú thêm</label>
                                        <textarea className="form-control" rows="2" value={currentData.note}
                                            onChange={e => setCurrentData({...currentData, note: e.target.value})}></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Đóng</button>
                                    <button type="submit" className="btn btn-primary px-4" disabled={actionLoading}>
                                        {actionLoading ? 'Đang xử lý...' : (isEdit ? 'Lưu cập nhật' : 'Tạo phiếu ngay')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WarrantyPage;