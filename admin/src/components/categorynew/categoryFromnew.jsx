'use client';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './categorynew.module.scss';
import TinyEditor from '../Editor/TinyEditor';

const cx = classNames.bind(styles);

const convertToSlug = (text) => {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

const API_URL = process.env.REACT_APP_API_URL;

function CategoryFormNew() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    // Dữ liệu danh mục
    const [categories, setCategories] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [published, setPublished] = useState(true);
    const [displayOrder, setDisplayOrder] = useState(0);

    // SEO & Slug
    const [slug, setSlug] = useState('');
    const [isAutoSlug, setIsAutoSlug] = useState(!isEdit);
    const [metaTitle, setMetaTitle] = useState('');
    const [metaKeywords, setMetaKeywords] = useState('');
    const [metaDescription, setMetaDescription] = useState('');

    // 1. Load danh sách danh mục (để chọn danh mục cha nếu cần)
    useEffect(() => {
        fetch(`${API_URL}/api/new`) // Sử dụng endpoint lấy danh mục tin tức
            .then((res) => res.json())
            .then((res) => {
                if (res.success) setCategories(res.data || []);
            })
            .catch((err) => console.error('Lỗi load danh mục:', err));
    }, []);

    // 2. Load chi tiết nếu là chế độ Sửa (Edit)
    useEffect(() => {
        if (!isEdit) return;
        fetch(`${API_URL}/api/new/${id}`)
            .then((res) => res.json())
            .then((res) => {
                const d = res.data;
                if (res.success && d) {
                    setName(d.Name || '');
                    setDescription(d.Description || '');
                    setPublished(Boolean(d.Published));
                    setDisplayOrder(d.DisplayOrder || 0);
                    setSlug(d.Slug || '');
                    setMetaTitle(d.MetaTitle || '');
                    setMetaKeywords(d.MetaKeywords || '');
                    setMetaDescription(d.MetaDescription || '');
                    setIsAutoSlug(false);
                }
            })
            .catch((err) => console.error('Lỗi load chi tiết:', err));
    }, [id, isEdit]);

    const handleNameChange = (e) => {
        const value = e.target.value;
        setName(value);
        if (isAutoSlug) setSlug(convertToSlug(value));
    };

    const handleSlugChange = (e) => {
        setSlug(e.target.value);
        setIsAutoSlug(false);
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            alert('Tên danh mục không được để trống');
            return;
        }

        const payload = {
            Name: name,
            Slug: slug.trim(),
            Published: published,
            DisplayOrder: Number(displayOrder),
            MetaTitle: metaTitle,
            Description: String(description || ''),
            MetaKeywords: metaKeywords,
            MetaDescription: metaDescription,
        };
        
        try {
            const response = await fetch(isEdit ? `${API_URL}/api/new/${id}` : `${API_URL}/api/new`, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const res = await response.json();

            if (res.success) {
                alert(isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công');
                navigate('/admin/catergorynewpage'); // Hoặc đường dẫn list của bạn
            } else {
                alert('Lỗi: ' + res.message);
            }
        } catch (error) {
            alert('Lỗi kết nối server');
        }
    };

    const handleBack = () => {
        navigate('/admin/catergorynewpage');
    };
    return (
        <div className={cx('wrapper')}>
            <div className={cx('header-form')}>
                <h2>{isEdit ? 'Sửa danh mục bài viết' : 'Thêm danh mục bài viết'}</h2>
            </div>

            <div className={cx('form-container')}>
                {/* Thông tin chính */}
                <div className={cx('card')}>
                    <h3>Thông tin chung</h3>
                    <div className={cx('formGroup')}>
                        <label>Tên danh mục *</label>
                        <input value={name} onChange={handleNameChange} placeholder="Ví dụ: Tin tức công nghệ..." />
                    </div>

                    <div className={cx('formGroup')}>
                        <label>Mô tả bài viết</label>
                        <TinyEditor value={description} onChange={setDescription} />
                    </div>

                    <div className={cx('grid-2')}>
                        <div className={cx('formGroup')}>
                            <label>Thứ tự hiển thị</label>
                            <input 
                                type="number" 
                                value={displayOrder} 
                                onChange={(e) => setDisplayOrder(e.target.value)} 
                            />
                        </div>
                        <div className={cx('checkbox-group')}>
                            <div className={cx('checkbox')}>
                                <input 
                                    type="checkbox" 
                                    id="pub"
                                    checked={published} 
                                    onChange={(e) => setPublished(e.target.checked)} 
                                />
                                <label htmlFor="pub">Xuất bản (Hiển thị ngay)</label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Phần SEO */}
                <div className={cx('card')}>
                    <h3>Tối ưu SEO</h3>
                    <div className={cx('formGroup')}>
                        <label>Meta Title</label>
                        <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
                    </div>

                    <div className={cx('formGroup')}>
                        <label>Meta Keywords</label>
                        <input value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} />
                    </div>

                    <div className={cx('formGroup')}>
                        <label>Meta Description</label>
                        <textarea 
                            rows="3"
                            value={metaDescription} 
                            onChange={(e) => setMetaDescription(e.target.value)} 
                        />
                    </div>
                    <div className={cx('formGroup')}>
                        <label>Đường dẫn thân thiện (Slug)</label>
                        <input value={slug} onChange={handleSlugChange} placeholder="tin-tuc-moi" />
                    </div>
                </div>
            </div>

            {/* Thanh hành động cố định bên dưới hoặc trên */}
            <div className={cx('actions-bar')}>
                <button className={cx('btn', 'save')} onClick={handleSubmit}>
                    <i className="fa-solid fa-check"></i> Lưu lại
                </button>
                <button className={cx('btn', 'exit')} onClick={handleBack}>
                    Thoát
                </button>
            </div>
        </div>
    );
}

export default CategoryFormNew;