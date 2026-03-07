import React, { useState, useEffect } from 'react';
const API_URL = process.env.REACT_APP_API_URL;
function SeoHome() {
    const [seo, setSeo] = useState({
        title: '',
        description: '',
        keywords: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', msg: '' });

    useEffect(() => {
        fetchSeoData();
    }, []);

    const fetchSeoData = async () => {
        try {
            const res = await fetch(`${API_URL}/api/seo/admin/seo-settings`);
            const data = await res.json();
            setSeo({
                title: data['commonsettings.defaulttitle'] || '',
                description: data['commonsettings.defaultmetadescription'] || '',
                keywords: data['commonsettings.defaultmetakeywords'] || ''
            });
        } catch (err) {
            showStatus('danger', 'Lỗi: Không thể kết nối với máy chủ SQL!');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/seo/admin/seo-settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(seo)
            });

            if (res.ok) {
                showStatus('success', '🚀 Đã lưu cấu hình SEO thành công!');
            } else {
                showStatus('danger', 'Thất bại: Server trả về lỗi khi lưu.');
            }
        } catch (err) {
            showStatus('danger', 'Lỗi kết nối: Kiểm tra Server Node.js của bạn.');
        } finally {
            setLoading(false);
        }
    };

    const showStatus = (type, msg) => {
        setStatus({ type, msg });
        setTimeout(() => setStatus({ type: '', msg: '' }), 4000);
    };

    return (
        // container-fluid giúp giao diện chiếm trọn chiều ngang màn hình
        <div className="container-fluid py-4 min-vh-100 bg-light">
            <div className="row justify-content-center">
                <div className="col-12 col-xl-10">
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-primary text-white py-3">
                            <h5 className="card-title mb-0">
                                <i className="fa-solid fa-earth-americas me-2"></i>
                                Quản lý SEO Trang Chủ - Máy Tính Bảo Tín
                            </h5>
                        </div>
                        
                        <div className="card-body p-4">
                            {status.msg && (
                                <div className={`alert alert-${status.type} alert-dismissible fade show`} role="alert">
                                    {status.msg}
                                    <button type="button" className="btn-close" onClick={() => setStatus({type:'', msg:''})}></button>
                                </div>
                            )}

                            <form onSubmit={handleSave}>
                                <div className="row">
                                    {/* Cột trái: Title & Description */}
                                    <div className="col-md-6">
                                        <div className="mb-4">
                                            <label className="form-label fw-bold text-secondary">
                                                Meta Title (Tiêu đề SEO)
                                            </label>
                                            <input 
                                                type="text" 
                                                className="form-control form-control-lg"
                                                value={seo.title}
                                                onChange={(e) => setSeo({...seo, title: e.target.value})}
                                                placeholder="VD: Máy Tính Bảo Tín - Laptop, PC Đồ Họa Chính Hãng"
                                                required
                                            />
                                            <div className="form-text text-muted">Nên dưới 60 ký tự để hiển thị tốt nhất trên Google.</div>
                                        </div>

                                        <div className="mb-4">
                                            <label className="form-label fw-bold text-secondary">
                                                Meta Description (Mô tả SEO)
                                            </label>
                                            <textarea 
                                                className="form-control"
                                                rows="5"
                                                value={seo.description}
                                                onChange={(e) => setSeo({...seo, description: e.target.value})}
                                                placeholder="Mô tả ngắn về cửa hàng của bạn..."
                                            ></textarea>
                                            <div className="form-text text-muted">Nên khoảng 150-160 ký tự.</div>
                                        </div>
                                    </div>

                                    {/* Cột phải: Keywords chuyên sâu */}
                                    <div className="col-md-6">
                                        <div className="mb-4 h-100 d-flex flex-column">
                                            <label className="form-label fw-bold text-secondary">
                                                Meta Keywords (Từ khóa dữ liệu thật)
                                            </label>
                                            <textarea 
                                                className="form-control flex-grow-1 mb-2"
                                                style={{ minHeight: '215px' }}
                                                value={seo.keywords}
                                                onChange={(e) => setSeo({...seo, keywords: e.target.value})}
                                                placeholder="Dán dữ liệu thật tại đây: máy tính pc, laptop, pc đồ hoạ, máy tính đồng bộ..."
                                            ></textarea>
                                            <div className="alert alert-info py-2 mb-0" style={{fontSize: '0.85rem'}}>
                                                <strong>Mẹo:</strong> Dán chuỗi "máy tính pc, laptop, link kiện máy tính, pc đồ hoạ..." của bạn vào đây để tối ưu tìm kiếm.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <hr className="my-4" />

                                <div className="d-flex justify-content-end gap-2">
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-secondary px-4"
                                        onClick={fetchSeoData}
                                    >
                                        Hủy thay đổi
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary px-5 fw-bold"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                        ) : null}
                                        LƯU CẤU HÌNH SEO
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SeoHome;