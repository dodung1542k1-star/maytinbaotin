import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './new.module.scss'; 
import TinyEditor from '../Editor/TinyEditor';

const cx = classNames.bind(styles);

const API_URL = process.env.REACT_APP_API_URL;

function EditNew() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    // ===== STATE CƠ BẢN =====
    const [title, setTitle] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [fullDescription, setFullDescription] = useState('');
    const [published, setPublished] = useState(true);
    const [allowComments, setAllowComments] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);

    // ===== ẢNH ĐẠI DIỆN =====
    const [pictureId, setPictureId] = useState(0);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageName, setImageName] = useState('Chưa có ảnh nào được chọn');

    // ===== DANH MỤC =====
    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState(0);

    // ===== SEO =====
    const [metaTitle, setMetaTitle] = useState('');
    const [metaKeywords, setMetaKeywords] = useState('');
    const [metaDescription, setMetaDescription] = useState('');
    const [seName, setSeName] = useState('');

    // ===== LOAD DANH MỤC =====
    useEffect(() => {
        fetch(`${API_URL}/api/new`)
            .then(res => res.json())
            .then(res => {
                if (res.success) setCategories(res.data || []);
            })
            .catch(err => console.error('Lỗi load danh mục:', err));
    }, []);

    // ===== LOAD CHI TIẾT BÀI VIẾT (EDIT) =====
    useEffect(() => {
        if (!isEdit) return;
        setLoading(true);
        fetch(`${API_URL}/api/new/post-detail/${id}`)
            .then(res => res.json())
            .then(res => {
        if (res.success && res.data) {
            const d = res.data;

            // 1. Làm sạch ID bài viết (tránh lỗi dấu phẩy)
            const rawPicId = d.PictureId ? d.PictureId.toString().split(',')[0] : 0;
            const cleanPicId = parseInt(rawPicId);
            setPictureId(cleanPicId);
            if (cleanPicId > 0) {
                const paddedId = cleanPicId.toString().padStart(7, '0');
                
                const imageUrl = `${API_URL}/images/${paddedId}_0.png`;
                
                setImagePreview(imageUrl);
                setImageName(`Ảnh hiện tại (ID: ${cleanPicId})`);
            } else {
                setImagePreview(null);
                setImageName('Chưa có ảnh nào được chọn');
            }

                    // Các field khác giữ nguyên
                    setTitle(d.Title || '');
                    setShortDescription(d.ShortDescription || '');
                    setPublished(d.Published ?? true);
                    setAllowComments(d.AllowComments ?? true);
                    setSelectedCategoryId(d.CategoryId || 0);
                    setMetaTitle(d.MetaTitle || '');
                    setMetaKeywords(d.MetaKeywords || '');
                    setMetaDescription(d.MetaDescription || '');
                    setSeName(d.SeName || '');

                    let content = d.FullDescription || '';
                    if (content.includes('src="/')) {
                        content = content.replace(/src="\//g, `src="${API_URL}/`);
                    }
                    setFullDescription(content);

                    if (d.StartDateUtc) setStartDate(d.StartDateUtc.split('T')[0]);
                    if (d.EndDateUtc) setEndDate(d.EndDateUtc.split('T')[0]);
                }
            })
            .catch(err => console.error('Lỗi load bài viết:', err))
            .finally(() => setLoading(false));
    }, [id, isEdit]);

    // ===== AUTO SEO NAME =====
    useEffect(() => {
        if (!isEdit && title) {
            const slug = title
                .toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/[^\w ]+/g, '')
                .replace(/ +/g, '-');
            setSeName(slug);
        }
    }, [title, isEdit]);

    // ===== SAVE (UPLOAD + CREATE / UPDATE) =====
    const handleSave = async (redirectAfterSave = true) => {
        if (!title.trim()) {
            alert('Vui lòng nhập tiêu đề bài viết!');
            return;
        }
        try {
            setLoading(true);
            let currentPictureId = pictureId;

            // UPLOAD ẢNH
            if (imageFile) {
                const formData = new FormData();
                formData.append('picture', imageFile);

                const uploadRes = await fetch(`${API_URL}/api/images/upload`, { 
                    method: 'POST',
                    body: formData
                });

                if (!uploadRes.ok) {
                    throw new Error('Upload ảnh thất bại');
                }

                const uploadResult = await uploadRes.json();
                if (uploadResult.success) {
                    currentPictureId = uploadResult.pictureId;
                }
            }

            const payload = {
                Title: title,
                PictureId: currentPictureId,
                CategoryId: parseInt(selectedCategoryId),
                ShortDescription: shortDescription || '',
                FullDescription: fullDescription || '',
                Published: published ? 1 : 0,
                AllowComments: allowComments ? 1 : 0,
                StartDateUtc: startDate || null,
                EndDateUtc: endDate || null,
                MetaTitle: metaTitle || '',
                MetaKeywords: metaKeywords || '',
                MetaDescription: metaDescription || '',
                SeName: seName || ''
            };

            const url = isEdit
                ? `${API_URL}/api/new/update/${id}`
                : `${API_URL}/api/new/create`;

            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();

            if (result.success) {
                alert(isEdit ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
                if (redirectAfterSave) navigate('/admin/new');
            } else {
                alert(result.message);
            }
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEdit && !title) {
        return <div className={cx('loading')}>Đang tải...</div>;
    }

    return (
        <div className={cx('wrapper')}>
            <div className={cx('header')}>
                <div>
                    <h2>{isEdit ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}</h2>
                    <span>{isEdit ? `Mã bài viết: ${id}` : 'Tạo nội dung bài viết mới cho hệ thống'}</span>
                </div>
            </div>

            <hr />

            {/* BOX 1: THÔNG TIN CHÍNH */}
            <div className={cx('box')}>
                <div className={cx('boxHeader')}>
                    <i className="fa-solid fa-circle-info"></i> Thông tin cơ bản
                </div>
                <div className={cx('boxBody')}>
                    <div className={cx('formGroup')}>
                        <label>Tiêu đề bài viết <span style={{color:'red'}}>*</span></label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Khai trương chi nhánh mới..." />
                    </div>

                    <div className={cx('formGroup')}>
                        <label>Mô tả ngắn (Hiển thị ở danh sách bài viết)</label>
                        <textarea rows="3" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="Tóm tắt nội dung bài viết..." />
                    </div>

                    <div className={cx('formGroup')}>
                        <label>Nội dung chi tiết</label>
                        <div className={cx('editorWrapper')}>
                            <TinyEditor value={fullDescription} onChange={setFullDescription} />
                        </div>
                    </div>

                    <div className={cx('formGroup')}>
                        <label>Ảnh đại diện</label>
                        <div className={cx('uploadContainer')}>
                            <div className={cx('uploadBox')}>
                                <div className={cx('fileInfo')}>
                                    <button className={cx('removeBtn')} onClick={() => {setImagePreview(null); setImageName('Chưa chọn ảnh')}}>
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                    <label htmlFor="file-upload" className={cx('fileLabel')}>
                                        <i className="fa-solid fa-cloud-arrow-up"></i>
                                        <span className={cx('fileName')}>{imageName}</span>
                                    </label>
                                   <input id="file-upload" type="file" hidden onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setImageFile(file); // <<--- THÊM DÒNG NÀY
                                            setImageName(file.name);
                                            setImagePreview(URL.createObjectURL(file));
                                        }
                                    }} />
                                </div>
                            </div>
                            <div className={cx('imagePreview')}>
                                {imagePreview ? <img src={imagePreview} alt="preview" /> : <div className={cx('noImage')}>Chưa có ảnh</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOX 2: CẤU HÌNH & HIỂN THỊ */}
            <div className={cx('box')}>
                <div className={cx('boxHeader')}>
                    <i className="fa-solid fa-gear"></i> Cấu hình hiển thị
                </div>
                <div className={cx('boxBody')}>
                    <div className={cx('formGroup')}>
                        <label>Thuộc danh mục tin tức</label>
                        <select 
                            style={{width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px'}}
                            value={selectedCategoryId} 
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                        >
                            <option value="0">--- Chọn danh mục ---</option>
                            {categories.map(cat => (
                                <option key={cat.Id} value={cat.Id}>{cat.Name}</option>
                            ))}
                        </select>
                    </div>

                    <div className={cx('row-flex')} style={{display: 'flex', gap: '20px'}}>
                        <div className={cx('formGroup')} style={{ flex: 1 }}>
                            <label>Ngày bắt đầu hiển thị</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{width: '100%'}} />
                        </div>
                        <div className={cx('formGroup')} style={{ flex: 1 }}>
                            <label>Ngày kết thúc hiển thị</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{width: '100%'}} />
                        </div>
                    </div>
                    
                    <div style={{display: 'flex', gap: '30px', marginTop: '10px'}}>
                        <div className={cx('checkbox')}>
                            <input type="checkbox" id="published" checked={published} onChange={(e) => setPublished(e.target.checked)} />
                            <label htmlFor="published" style={{marginLeft: '8px', fontWeight: 'bold'}}>Công khai bài viết</label>
                        </div>
                        <div className={cx('checkbox')}>
                            <input type="checkbox" id="allowComments" checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)} />
                            <label htmlFor="allowComments" style={{marginLeft: '8px'}}>Cho phép khách bình luận</label>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOX 3: SEO */}
            <div className={cx('box')}>
                <div className={cx('boxHeader')}>
                    <i className="fa-solid fa-magnifying-glass"></i> Tối ưu kết quả tìm kiếm (SEO)
                </div>
                <div className={cx('boxBody')}>
                    <div className={cx('formGroup')}>
                        <label>Tiêu đề SEO (Meta Title)</label>
                        <input type="text" style={{width: '100%', padding: '8px'}} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Bỏ trống sẽ lấy tiêu đề bài viết" />
                    </div>
                    <div className={cx('formGroup')}>
                        <label>Từ khóa SEO (Meta Keywords)</label>
                        <input type="text" style={{width: '100%', padding: '8px'}} value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} placeholder="Từ khóa cách nhau bởi dấu phẩy" />
                    </div>
                    <div className={cx('formGroup')}>
                        <label>Mô tả SEO (Meta Description)</label>
                        <textarea rows="3" style={{width: '100%', padding: '8px', border: '1px solid #ddd'}} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
                    </div>
                    <div className={cx('formGroup')}>
                        <label>Đường dẫn thân thiện (Se Name)</label>
                        <input type="text" style={{width: '100%', padding: '8px'}} value={seName} onChange={(e) => setSeName(e.target.value)} placeholder="VD: khai-truong-chi-nhanh-moi" />
                    </div>
                </div>
            </div>

            {/* ACTIONS */}
            <div className={cx('actions-bar')} style={{marginTop: '20px', padding: '20px', background: '#fff', borderTop: '2px solid #007bff', position: 'sticky', bottom: 0}}>
                <div className={cx('actions-content')}>
                    <button className={cx('btn', 'save')} onClick={() => handleSave(true)} disabled={loading} style={{marginRight: '10px', padding: '10px 25px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>
                        <i className="fa-solid fa-check"></i> {loading ? ' Đang lưu...' : ' Lưu & Thoát'}
                    </button>
                    <button className={cx('btn', 'save-continue')} onClick={() => handleSave(false)} disabled={loading} style={{marginRight: '10px', padding: '10px 25px', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>
                        <i className="fa-solid fa-floppy-disk"></i> {isEdit ? ' Cập nhật' : ' Lưu & Tiếp tục'}
                    </button>
                    <button className={cx('btn', 'cancel')} onClick={() => navigate('/admin/new')} style={{padding: '10px 25px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
                        Hủy bỏ
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditNew;
