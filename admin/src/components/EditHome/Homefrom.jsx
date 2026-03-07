import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import {
    Save,
    ArrowLeft,
    Search,
    ChevronUp,
    ChevronDown
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;

/* ===== HÀM TẠO SLUG SEO THÂN THIỆN ===== */
const toSeoSlug = (text) => {
    if (!text) return '';
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};

function HomeForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id) && id !== '0';
    const [isSeoOpen, setIsSeoOpen] = useState(true);

    const [formData, setFormData] = useState({
        Id: 0,
        Title: '',
        Slug: '',
        Body: '',
        MetaTitle: '',
        MetaKeywords: '',
        MetaDescription: ''
    });

    /* ===== LOAD DỮ LIỆU KHI SỬA ===== */
/* ===== LOAD DỮ LIỆU KHI SỬA ===== */
    useEffect(() => {
        if (isEditMode) {
            fetch(`${API_URL}/api/seo/topic/${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data) {
                        setFormData({
                            Id: data.Id,
                            Title: data.Title || '',
                            // Phải khớp chính xác tên cột trả về từ query SELECT *
                            Slug: data.Slug || data.SystemName || '', 
                            Body: data.Body || '',
                            MetaTitle: data.MetaTitle || '',
                            MetaKeywords: data.MetaKeywords || '', // Khớp với cột [MetaKeywords]
                            MetaDescription: data.MetaDescription || ''
                        });
                    }
                })
                .catch(err => console.error('Lỗi lấy dữ liệu:', err));
        }
    }, [id, isEditMode]);
    /* ===== LƯU DỮ LIỆU ===== */
    const handleSave = async () => {
        const endpoint = isEditMode ? 'update-topic' : 'create-topic';

        // Tự động tối ưu SEO nếu người dùng để trống
        const payload = {
            Id: parseInt(formData.Id),
            Title: formData.Title,
            Slug: formData.Slug,
            Body: formData.Body,
            MetaTitle: formData.MetaTitle || formData.Title,
            MetaKeywords: formData.MetaKeywords, 
            MetaDescription: formData.MetaDescription
        };
        try {
            const res = await fetch(`${API_URL}/api/seo/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert(isEditMode ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
                navigate('/admin/homemenu');
            } else {
                const errorData = await res.json();
                alert('Lỗi: ' + errorData.message);
            }
        } catch (err) {
            console.error('Lỗi lưu:', err);
            alert('Không thể kết nối đến server');
        }
    };
    return (
        <div className="p-4 bg-light min-vh-100">
            {/* ACTION BAR */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                    <button
                       className="btn btn-primary d-flex align-items-center gap-2 px-4"
                        onClick={() => navigate('/admin/homemenu')}
                    >
                        <ArrowLeft />
                    </button>
                    <h5 className="fw-bold mb-0">
                        {isEditMode
                            ? `Chỉnh sửa: ${formData.Title}`
                            : 'Thêm mới bài viết chân trang'}
                    </h5>
                </div>
                <button
                    className="btn btn-primary d-flex align-items-center gap-2 px-4"
                    onClick={handleSave}
                >
                    <Save size={18} />
                    {isEditMode ? 'Cập nhật' : 'Lưu bài viết'}
                </button>
            </div>

            {/* NỘI DUNG CHÍNH */}
            <div className="card shadow-sm border-0 mb-4">
                <div className="card-body p-4">
                    {/* TITLE */}
                    <div className="row mb-3 align-items-center">
                        <div className="col-md-2 text-end small fw-bold text-secondary">
                            Tiêu đề
                        </div>
                        <div className="col-md-10">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Nhập tiêu đề bài viết..."
                                value={formData.Title}
                               onChange={(e) => {
                                    const title = e.target.value;
                                    setFormData({
                                        ...formData,
                                        Title: title,
                                        Slug: isEditMode ? formData.Slug : toSeoSlug(title) 
                                    });
                                }}
                            />
                        </div>
                    </div>
                    {/* BODY */}
                    <div className="row">
                        <div className="col-md-2 text-end small fw-bold text-secondary">
                            Nội dung
                        </div>
                        <div className="col-md-10">
                            <Editor
                                tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.7.0/tinymce.min.js"
                                value={formData.Body}
                                onEditorChange={(content) =>
                                    setFormData({ ...formData, Body: content })
                                }
                                init={{
                                    height: 450,
                                    menubar: true,
                                    branding: false,
                                    promotion: false,
                                    plugins: 'advlist autolink lists link image charmap preview anchor code table help wordcount',
                                    toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright | bullist numlist outdent indent | removeformat'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* CẤU HÌNH SEO */}
            <div className="card shadow-sm border-0">
                <div
                    className="card-header bg-white py-3 d-flex justify-content-between align-items-center"
                    onClick={() => setIsSeoOpen(!isSeoOpen)}
                    style={{ cursor: 'pointer' }}
                >
                    <span className="fw-bold text-primary">
                        <Search size={18} className="me-2" />
                        CẤU HÌNH SEO (THẺ META)
                    </span>
                    {isSeoOpen ? <ChevronUp /> : <ChevronDown />}
                </div>

                {isSeoOpen && (
                    <div className="card-body p-4 border-top">
                        <div className="row mb-3">
                            <div className="col-md-3 text-end small fw-bold text-secondary">Meta Title</div>
                            <div className="col-md-9">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.MetaTitle}
                                    onChange={(e) => setFormData({ ...formData, MetaTitle: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="row mb-3">
                            <div className="col-md-3 text-end small fw-bold text-secondary">Meta Keywords</div>
                            <div className="col-md-9">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.MetaKeywords}
                                    onChange={(e) => setFormData({ ...formData, MetaKeywords: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="row mb-3">
                            <div className="col-md-3 text-end small fw-bold text-secondary">Meta Description</div>
                            <div className="col-md-9">
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    value={formData.MetaDescription}
                                    onChange={(e) => setFormData({ ...formData, MetaDescription: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="row mb-3">
                        <div className="col-md-3 text-end small fw-bold text-secondary">
                            Đường dẫn SEO
                        </div>
                            <div className="col-md-9">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.Slug}
                                        onChange={(e) => setFormData({ ...formData, Slug: toSeoSlug(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default HomeForm;