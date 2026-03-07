import { useState, useEffect,useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import classNames from 'classnames/bind';
import styles from '../../pages/ProductPage/product.module.scss';
import TinyEditor from '../Editor/TinyEditor';

const cx = classNames.bind(styles);

const createSlug = (str) => {
    if (!str) return '';
    str = str.toLowerCase().trim();
    str = str.replace(/[áàảãạăắằẳẵặâấầẩẫậ]/g, 'a');
    str = str.replace(/[éèẻẽẹêếềểễệ]/g, 'e');
    str = str.replace(/[íìỉĩị]/g, 'i');
    str = str.replace(/[óòỏõọôốồổỗộơớờởỡợ]/g, 'o');
    str = str.replace(/[úùủũụưứừửữự]/g, 'u');
    str = str.replace(/[ýỳỷỹỵ]/g, 'y');
    str = str.replace(/đ/g, 'd');
    str = str.replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    return str;
};
const API_URL = process.env.REACT_APP_API_URL;
function ProductForm() {
        const { id } = useParams();
        const navigate = useNavigate();
        const isEditMode = !!id;
        const fileInputRef = useRef(null);
        const [categories, setCategories] = useState([]); // State lưu danh sách danh mục đã xử lý phẳng
        const [fullDescription, setFullDescription] = useState(''); // State riêng cho Editor
        const [isAutoSlug, setIsAutoSlug] = useState(!isEditMode);   // Tắt auto slug khi Edit
        const [newImages, setNewImages] = useState([]); // FILE THẬT
        const [editingImageId, setEditingImageId] = useState(null); // Lưu ID của ảnh đang được mở chế độ sửa
        const [product, setProduct] = useState({
        Name: '',
        ShortDescription: '',
        FullDescription: '',
        Sku: '',
        Price: 0,
        OldPrice: 0,
        StockQuantity: 0,
        Published: true,
        ShowOnHomePage: false,
        CallForPrice: false,
        CategoryId: '',
        Images: [],
        ProductTypeId: 5, 
        ProductTemplateId: 1, 
        VendorId: 0,
        AdminComment: '',
        OrderMinimumQuantity: 1,
        OrderMaximumQuantity: 10000,
        ManageInventoryMethodId: 1,
        CreatedOnUtc: new Date().toISOString(),
        UpdatedOnUtc: new Date().toISOString(),
        Deleted: false,
        DisplayOrder: 0
    });
    // Hàm đệ quy để làm phẳng cây danh mục và thêm ký tự thụt đầu dòng
    const flattenCategories = (categoryNodes, level = 0) => {
        let list = [];
        categoryNodes.forEach(node => {
            list.push({
                id: node.id,
                name: "— ".repeat(level) + node.name
            });
            if (node.children && node.children.length > 0) {
                list = [...list, ...flattenCategories(node.children, level + 1)];
            }
        });
        return list;
    };
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;

        setProduct(prev => {
            const newData = { ...prev, [name]: val };
            
            // Nếu đang thêm mới và đổi tên -> Tự tạo Slug
            if (name === 'Name' && isAutoSlug && !isEditMode) {
                newData.Slug = createSlug(val);
            }
            return newData;
        });

        // Nếu người dùng tự gõ vào ô Slug, tắt chế độ AutoSlug
        if (name === 'Slug') setIsAutoSlug(false);
    };
    // 1. Lấy cây danh mục từ API của bạn
   useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/categories/tree`);
                if (res.data.success) {
                    setCategories(flattenCategories(res.data.data));
                }
            } catch (err) {
                console.error("Lỗi tải cây danh mục:", err);
            }
        };
        fetchCategories();
    }, []);

    // 2. Lấy dữ liệu sản phẩm cũ (nếu là sửa)
    useEffect(() => {
    if (!id) {
        setFullDescription('');
        // Reset về giá trị trắng cho sản phẩm mới
        setProduct(prev => ({ 
            ...prev, 
            Name: '', Slug: '', MetaTitle: '', MetaKeywords: '', MetaDescription: '' 
        }));
        return;
    }
    const fetchProduct = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/products/${id}`);
            if (res.data.success) {
                const d = res.data.data;
                
                setProduct({
                    ...d,
                    Name: d.Name || d.name || '',
                    Slug: d.Slug || d.slug || '',
                    MetaTitle: d.MetaTitle || d.metaTitle || '',
                    MetaKeywords: d.MetaKeywords || d.metaKeywords || '',
                    MetaDescription: d.MetaDescription || d.metaDescription || '',
                    Price: d.Price || 0,
                    OldPrice: d.OldPrice || 0,
                    Sku: d.Sku || '',
                    CategoryId: d.CategoryId || '',
                    Images: d.Images || [],
                    Published: Boolean(d.Published),
                    ShowOnHomePage: Boolean(d.ShowOnHomePage),
                    CallForPrice: Boolean(d.CallForPrice)
                });

                setFullDescription(d.FullDescription || d.fullDescription || '');
                setIsAutoSlug(false);
            }
        } catch (err) {
            console.error("Lỗi fetch:", err);
        }
    };

        fetchProduct();
    }, [id]);

    const [showSticky, setShowSticky] = useState(false);
    useEffect(() => {
        const handleScroll = () => {
            // Nếu cuộn xuống quá 200px thì hiện thanh điều khiển
            if (window.scrollY > 200) {
                setShowSticky(true);
            } else {
                setShowSticky(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    const handleSave = async (stayOnPage = false) => {
        try {
            const url = isEditMode
                ? `${API_URL}/api/products/${id}`
                : `${API_URL}/api/products`;

            const formData = new FormData();
            formData.append('FullDescription', fullDescription || '');

            Object.entries(product).forEach(([key, value]) => {
                if (key !== 'Images' && key !== 'FullDescription') {
                    formData.append(key, value === null || value === undefined ? '' : value);
                }
            });

            // Gửi IDs ảnh cũ
            const existingIds = product.Images
                .filter(img => img.Id && !String(img.Id).startsWith('blob'))
                .map(img => img.Id);
            existingIds.forEach(id => formData.append('ExistingImageIds[]', id));

            // Gửi Detail ảnh để sửa SEO
            const imageDetails = product.Images
                .filter(img => img.Id && !String(img.Id).startsWith('blob'))
                .map(img => ({ Id: img.Id, SeoFilename: img.SeoFilename }));
            formData.append('ImageDetails', JSON.stringify(imageDetails));

            // Gửi ảnh mới
            newImages.forEach(file => formData.append('files', file));

            const res = await axios({
                method: isEditMode ? 'put' : 'post',
                url,
                data: formData,
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                alert('Lưu thành công!');
                const serverProductId = res.data.data?.Id || id; // Lấy ID mới từ server nếu là thêm mới

                if (stayOnPage) {
                    if (!isEditMode) {
                        // Thêm mới xong bấm "Lưu & Tiếp tục" -> Nhảy sang trang Sửa sản phẩm đó
                        navigate(`/admin/product/edit/${serverProductId}`);
                    } else {
                        // Đang sửa mà bấm "Lưu & Tiếp tục" -> F5
                        window.location.reload();
                    }
                } else {
                    // Bấm "Lưu" -> Về danh sách
                    navigate('/admin/product');
                }
            }
        } catch (err) {
            console.error("Lỗi:", err);
            alert('Lỗi: ' + (err.response?.data?.message || err.message));
        }
    };
    // hàm xửa lý ảnh 
    const handleUploadClick = () => fileInputRef.current.click();
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 1. Lưu file thật để gửi server
        setNewImages(prev => [...prev, file]);

        // 2. Tạo preview (UI)
        const previewImg = {
            Id: Date.now(),
            Url: URL.createObjectURL(file),
            DisplayOrder: product.Images.length + 1,
            SeoFilename: file.name
        };

        setProduct(prev => ({
            ...prev,
            Images: [...prev.Images, previewImg]
        }));
    };
    const handleRemoveImage = (imgId) => {
    // Nếu là ảnh mới chọn (có blob), hãy thu hồi URL để tránh rò rỉ bộ nhớ
    const imgToRemove = product.Images.find(img => img.Id === imgId);
    if (imgToRemove?.Url.startsWith('blob')) {
        URL.revokeObjectURL(imgToRemove.Url);
        // Xóa file tương ứng trong mảng newImages (so sánh qua name)
        setNewImages(prev => prev.filter(file => file.name !== imgToRemove.SeoFilename));
    }

        // Cập nhật lại danh sách hiển thị
        setProduct(prev => ({
            ...prev,
            Images: prev.Images.filter(img => img.Id !== imgId)
        }));
    };

    // 2. Hàm chỉnh sửa tên SEO trực tiếp trên input
    const handleEditSeoFilename = (imgId, newName) => {
        setProduct(prev => ({
            ...prev,
            Images: prev.Images.map(img => 
                img.Id === imgId ? { ...img, SeoFilename: newName } : img
            )
        }));
    };
    return (
        <div className={cx('wrapper')}>
            <h2>{isEditMode ? `Sửa sản phẩm: ${product.Name}` : 'Thêm sản phẩm mới'}</h2>
            <div className={cx('container')}>
                <div className={cx('main-info')}>
                    <div className={cx('card')}>
                        <h3>Thông tin chung</h3>
                        <div className={cx('formGroup')}>
                            <label>Tên sản phẩm *</label>
                            <input name="Name" value={product.Name} onChange={handleChange} />
                        </div>
                        <div className={cx('formGroup')}>
                            <label>Mô tả ngắn</label>
                            <textarea name="ShortDescription" value={product.ShortDescription} onChange={handleChange} />
                        </div>
                        <div className={cx('formGroup')}>
                            <label>Giảm giá (Mô tả giảm giá)</label>
                            <textarea name="DiscountDescription" value={product.DiscountDescription} onChange={handleChange} />
                        </div>
                            <div className={cx('formGroup')}>
                                <label>Mô tả chi tiết</label>
                                <TinyEditor 
                                    value={fullDescription}
                                    onChange={setFullDescription}
                                />
                            </div>
                        <div className={cx('card')} style={{boxShadow: 'none', padding: '20px 0 0 0'}}>
                            <h3>Phân loại</h3>
                            <div className={cx('formGroup')}>
                                <label>Danh mục chính</label>
                                <select name="CategoryId" value={product.CategoryId} onChange={handleChange}>
                                    <option value="">-- Chọn danh mục --</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className={cx('card')}>
                        <h3>Giá cả & Kho hàng</h3>
                        <div className={cx('row')}>
                            <div className={cx('formGroup', 'col')}>
                                <label>Giá hiện tại (đ)</label>
                                <input type="number" name="Price" value={product.Price} onChange={handleChange} />
                            </div>
                            <div className={cx('formGroup', 'col')}>
                                <label>Giá cũ (đ)</label>
                                <input type="number" name="OldPrice" value={product.OldPrice} onChange={handleChange} />
                            </div>
                        </div>
                        <div className={cx('row')}>
                            <div className={cx('formGroup', 'col')}>
                                <label>Mã SKU</label>
                                <input name="Sku" value={product.Sku} onChange={handleChange} />
                            </div>
                            <div className={cx('formGroup', 'col')}>
                                <label>Số lượng kho</label>
                                <input type="number" name="StockQuantity" value={product.StockQuantity} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                    <div className={cx('card')}>
                        <h3>Hình ảnh</h3>
                       <div className={cx('card')}>
                        <h3>Hình ảnh</h3>
                        <div className={cx('image-placeholder')}>
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                            <button className={cx('btn-upload')} onClick={handleUploadClick}>Tải ảnh sản phẩm</button>
                            <p>{product.Images?.length > 0 ? `Đã có ${product.Images.length} ảnh` : 'Chưa có ảnh nào'}</p>
                        </div>
                    </div>
                    </div>
                   <div className={cx('card')}>
                        <div className={cx('tabs')}>
                            <button className={cx('tab', 'active')}>Hình ảnh</button>
                            <button className={cx('tab')}>Video</button>
                        </div>
                        <table className={cx('image-table')}>
                            <thead>
                                <tr>
                                    <th>Hình ảnh</th>
                                    <th>Thứ tự</th>
                                    <th>Tên File (SEO)</th>
                                    <th>Cập nhật</th>
                                    <th>Xóa</th>
                                </tr>
                            </thead>
                            <tbody>
                                {product.Images.map((img) => {
                                        const isEditing = editingImageId === img.Id; // Kiểm tra xem dòng này có đang mở khóa sửa không
                                        return (
                                            <tr key={img.Id}>
                                                <td>
                                                    <img 
                                                        src={img.Url} 
                                                        className={cx('thumb')} 
                                                        alt={img.SeoFilename} 
                                                    />
                                                </td>
                                                <td>{img.DisplayOrder}</td>
                                                <td>
                                                    {isEditing ? (
                                                        <input 
                                                            type="text"
                                                            className={cx('input-seo-active')}
                                                            value={img.SeoFilename || ''}
                                                            autoFocus
                                                            onChange={(e) => handleEditSeoFilename(img.Id, e.target.value)}
                                                            // Nhấn Enter để đóng nhanh
                                                            onKeyDown={(e) => e.key === 'Enter' && setEditingImageId(null)}
                                                        />
                                                    ) : (
                                                        <span className={cx('text-seo')}>{img.SeoFilename}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <button 
                                                        className={cx('btn-edit', { active: isEditing })}
                                                        onClick={() => setEditingImageId(isEditing ? null : img.Id)}
                                                        type="button"
                                                        title={isEditing ? "Xong" : "Sửa tên SEO"}
                                                    >
                                                        {isEditing ? '✔' : '✎'} 
                                                    </button>
                                                </td>
                                                <td>
                                                    <button 
                                                        className={cx('btn-delete')} 
                                                        onClick={() => handleRemoveImage(img.Id)}
                                                        type="button"
                                                    >
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                {product.Images.length === 0 && (
                                    <tr><td colSpan="5" style={{textAlign:'center'}}>Không có ảnh</td></tr>
                                )}
                            </tbody>
                        </table>
                        <div className={cx('table-footer')}>
                            <span>{product.Images.length} items</span>
                            <button className={cx('refresh')}>↻</button>
                        </div>
                    </div>
                    <div className={cx('card')}>
                        <h3>SEO & Đường dẫn</h3>
                        <div className={cx('formGroup')}>
                            <label>Meta Title</label>
                            <input name="MetaTitle" value={product.MetaTitle} onChange={handleChange} />
                        </div>
                        <div className={cx('formGroup')}>
                            <label>Meta Keywords</label>
                            <input name="MetaKeywords" value={product.MetaKeywords} onChange={handleChange} />
                        </div>
                        <div className={cx('formGroup')}>
                            <label>Meta Description</label>
                            <textarea name="MetaDescription" value={product.MetaDescription} onChange={handleChange} />
                        </div>
                        <div className={cx('formGroup')}>
                            <label>Đường dẫn thân thiện (Slug)</label>
                            <input name="Slug" value={product.Slug} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                <div className={cx('side-info')}>
                    <div className={cx('card')}>
                        <h3>Trạng thái</h3>
                        <div className={cx('checkbox')}>
                            <input 
                                type="checkbox" id="pub" 
                                name="Published" checked={product.Published} onChange={handleChange} 
                            />
                            <label htmlFor="pub">Hiển thị công khai</label>
                        </div>
                        <div className={cx('checkbox')}>
                            <input 
                                type="checkbox" id="home" 
                                name="ShowOnHomePage" checked={product.ShowOnHomePage} onChange={handleChange} 
                            />
                            <label htmlFor="home">Hiển thị ở trang chủ</label>
                        </div>
                        <div className={cx('checkbox')}>
                            <input 
                                type="checkbox" id="hot" 
                                name="CallForPrice" checked={product.CallForPrice} onChange={handleChange} 
                            />
                            <label htmlFor="hot">Liên Hệ Để Biết Giá</label>
                        </div>
                    </div>
                </div>
            </div>
        <div className={cx('sticky-footer', { visible: showSticky })}>
            <div className={cx('footer-content')}>
                <div className={cx('header-actions')}>
                    <button className={cx('btn', 'outline')} onClick={() => window.history.back()}>
                        Hủy bỏ
                    </button>
                    <button  className={cx('btn', 'save')}  onClick={() => handleSave(false)} >
                         Lưu sản phẩm
                    </button>
                </div>
            </div>
        </div>
    </div>
    );
}

export default ProductForm;