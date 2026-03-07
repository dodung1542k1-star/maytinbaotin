'use client';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './categoryform.module.scss';
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

function CategoryForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [categories, setCategories] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [parentId, setParentId] = useState('');
    const [published, setPublished] = useState(true);
    const [showOnHomepage, setShowOnHomepage] = useState(false);

    const [slug, setSlug] = useState('');
    const [isAutoSlug, setIsAutoSlug] = useState(!isEdit);
    const [metaTitle, setMetaTitle] = useState('');
    const [metaKeywords, setMetaKeywords] = useState('');
    const [metaDescription, setMetaDescription] = useState('');

    const [pageSize, setPageSize] = useState(6);
    // const [pageSizeOptions, setPageSizeOptions] = useState('6, 12');
    // const [allowSelectPageSize, setAllowSelectPageSize] = useState(false);
    
    const [priceFilter, setPriceFilter] = useState(false);
    const [priceFrom, setPriceFrom] = useState(0);
    const [priceTo, setPriceTo] = useState(0);
    const [manualPriceRange, setManualPriceRange] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/api/categories/tree`)
            .then((res) => res.json())
            .then((res) => setCategories(res.data || []))
            .catch((err) => console.error('Load tree lỗi:', err));
    }, []);

    useEffect(() => {
        if (!isEdit) return;
        fetch(`${API_URL}/api/categories/${id}`)
            .then((res) => res.json())
            .then((res) => {
                const d = res.data;
                if (!d) return;
                setName(d.Name || '');
                setDescription(d.Description || '');
                setParentId(d.ParentCategoryId !== null ? String(d.ParentCategoryId) : '');
                setPublished(Boolean(d.Published));
                setShowOnHomepage(Boolean(d.ShowOnHomepage));
                setSlug(d.Slug || '');
                setIsAutoSlug(false);
                setMetaTitle(d.MetaTitle || '');
                setMetaKeywords(d.MetaKeywords || '');
                setMetaDescription(d.MetaDescription || '');
                setPageSize(d.PageSize || 6);
                setPriceFilter(Boolean(d.PriceRangeFiltering));
                setPriceFrom(d.PriceFrom || 0);
                setPriceTo(d.PriceTo || 0);
                setManualPriceRange(Boolean(d.ManuallyPriceRange));
            })
            .catch((err) => console.error('Load detail lỗi:', err));
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

    const handleSubmit = (stayOnPage = false) => {
        if (!name.trim()) {
            alert('Tên danh mục không được để trống');
            return;
        }

        const payload = {
            Name: name,
            Slug: slug.trim(),
            Description: description,
            ParentCategoryId: parentId ? Number(parentId) : 0,
            Published: published,
            ShowOnHomepage: showOnHomepage,
            MetaTitle: metaTitle,
            MetaKeywords: metaKeywords,
            MetaDescription: metaDescription,
            PageSize: Number(pageSize),
            PriceRangeFiltering: priceFilter,
            PriceFrom: Number(priceFrom),
            PriceTo: Number(priceTo),
            ManuallyPriceRange: manualPriceRange,
        };

        fetch(isEdit ? `${API_URL}/api/categories/${id}` : `${API_URL}/api/categories`, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
        .then((res) => res.json())
        .then((res) => {
            if (res.success) {
                alert(isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công');
                if (!stayOnPage) navigate('/admin/category');
            } else {
                alert('Lỗi: ' + res.message);
            }
        });
    };
    const renderOptions = (cats, level = 0) =>
        cats.flatMap((cat) => [
            <option key={cat.id} value={String(cat.id)} disabled={isEdit && String(cat.id) === String(id)}>
                {'— '.repeat(level) + cat.name}
            </option>,
            ...(cat.children && cat.children.length ? renderOptions(cat.children, level + 1) : []),
        ]);
    const handleBack = () => {
        navigate('/admin/Category'); 
    };
    return (
        <div className={cx('wrapper')}>
            <h2>{isEdit ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>

            <div className={cx('formGroup')}>
                <label>Tên *</label>
                <input value={name} onChange={handleNameChange} placeholder="Nhập tên danh mục..." />
            </div>

            <div className={cx('formGroup')}>
                <label>Mô tả</label>
                <TinyEditor value={description} onChange={setDescription} />
            </div>

            <div className={cx('checkbox')}>
                <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
                <label>Xuất bản</label>
            </div>
            
            <div className={cx('checkbox')}>
                <input type="checkbox" checked={showOnHomepage} onChange={(e) => setShowOnHomepage(e.target.checked)} />
                <label>Hiển thị trang chủ</label>
            </div>
            <hr />
            <div className={cx('card')}>
                <h3>Cấu hình hiển thị & Lọc giá</h3>
                <div className={cx('grid-2')}>
                    <div className={cx('formGroup')}>
                        <label>Danh mục cha</label>
                        <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
                            <option value="">[Trống - Danh mục gốc]</option>
                            {renderOptions(categories)}
                        </select>
                    </div>
                    <div className={cx('formGroup')}>
                        <label>Số sản phẩm/trang</label>
                        <input 
                            type="number" 
                            value={pageSize} 
                            onChange={(e) => setPageSize(e.target.value)} 
                        />
                    </div>
                </div>
                <div className={cx('filter-section')}>
                    <div className={cx('checkbox')}>
                        <input 
                            type="checkbox" 
                            id="priceFilter" 
                            checked={priceFilter} 
                            onChange={(e) => setPriceFilter(e.target.checked)} 
                        />
                        <label htmlFor="priceFilter">
                            <strong>Bật bộ lọc giá</strong> (Hiển thị thanh trượt giá ngoài web)
                        </label>
                    </div>
                    {priceFilter && (
                        <div className={cx('price-range-config')}>
                            <div className={cx('grid-2')}>
                                <div className={cx('formGroup')}>
                                    <label>Giá tối thiểu (VNĐ)</label>
                                    <input 
                                        type="number" 
                                        value={priceFrom} 
                                        onChange={(e) => setPriceFrom(e.target.value)} 
                                    />
                                </div>
                                <div className={cx('formGroup')}>
                                    <label>Giá tối đa (VNĐ)</label>
                                    <input
                                        type="text"
                                        value={priceTo ? Number(priceTo).toLocaleString("vi-VN") : ""}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/\D/g, "");
                                            setPriceTo(raw);
                                        }}
                                    />
                                </div>
                            </div>
                            <div className={cx('checkbox')}>
                                <input 
                                    type="checkbox" 
                                    id="manualPrice" 
                                    checked={manualPriceRange} 
                                    onChange={(e) => setManualPriceRange(e.target.checked)} 
                                />
                                <label htmlFor="manualPrice">Cấu hình hạn mức thủ công (Manual)</label>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <hr />
            <h3>SEO</h3>
            <div className={cx('formGroup')}>
                <label>Meta title</label>
                <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
            </div>

            <div className={cx('formGroup')}>
                <label>Meta keywords</label>
                <input value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} />
            </div>

            <div className={cx('formGroup')}>
                <label>Meta description</label>
                <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
            </div>

            <div className={cx('formGroup')}>
                <label>Tên thân thiện SEO (Slug)</label>
                <input value={slug} onChange={handleSlugChange} />
            </div>

            <div className={cx('actions-bar')}>
                <div className={cx('actions-content')}>
                    <button className={cx('btn', 'save')} onClick={() => handleSubmit(false)}>Lưu lại</button>
                    <button className={cx('btn', 'save-continue')} onClick={handleBack} >Thoát</button>
                </div>
            </div>
        </div>
    );
}

export default CategoryForm;