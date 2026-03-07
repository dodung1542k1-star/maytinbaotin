import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Pagination, Container, Row, Col, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
const API_URL = process.env.REACT_APP_API_URL;
const NewPage = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [itemsPerPage, setItemsPerPage] = useState(7);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    // ✅ State cho chức năng xoá nhiều
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await fetch(`${API_URL}/api/new/all`);
                const result = await response.json();
                if (result.success) setPosts(result.data || []);
            } catch (error) {
                console.error("Lỗi:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    // ✅ Tìm kiếm theo Name
    const filteredPosts = posts.filter(post =>
        (post.Name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredPosts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);

    const formatDate = (dateString) => {
        if (!dateString) return '---';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', { 
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleEdit = (id) => {
        navigate(`/admin/new/edit/${id}`);
    };

    const handleAddNew = () => {
        navigate('/admin/new/create');
    };

    // ================== CHỨC NĂNG XOÁ ==================
    const handleCheck = (id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const handleCheckAll = (checked) => {
        if (checked) {
            setSelectedIds(currentItems.map(item => item.Id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) {
            alert('Vui lòng chọn ít nhất 1 bài viết để xoá');
            return;
        }

        if (!window.confirm(`Bạn có chắc muốn xoá ${selectedIds.length} bài viết?`)) return;

        try {
            const response = await fetch(`${API_URL}/api/new/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            });

            // Kiểm tra nếu server trả về lỗi (404, 500...) thì không ép kiểu JSON
            if (!response.ok) {
                const errorText = await response.text(); // Đọc lỗi dưới dạng text/html
                throw new Error(`Server báo lỗi ${response.status}: Đường dẫn không tồn tại hoặc lỗi code.`);
            }

            const result = await response.json();

            if (result.success) {
                alert('Xoá thành công!');
                setPosts(prev => prev.filter(p => !selectedIds.includes(p.Id)));
                setSelectedIds([]);
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Lỗi chi tiết:", error);
            alert(error.message); 
        }
    };
    // ========================================

    return (
        <Container fluid className="mt-4 p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <Row className="mb-3 align-items-center">
                <Col>
                    <h2 className="fw-bold mb-0">Bài viết</h2>
                    <small className="text-muted">Bảng điều khiển - Bài viết</small>
                </Col>
                <Col className="text-end">
                    <Button variant="primary" className="me-2 px-3" onClick={handleAddNew}>
                        + Thêm mới
                    </Button>
                    <Button variant="danger" className="px-3" onClick={handleDelete}>
                        Xóa lựa chọn
                    </Button>
                </Col>
            </Row>

            <div className="bg-white p-3 rounded shadow-sm mb-4">
                <Row className="g-2">
                    <Col md={4}>
                        <Form.Control 
                            type="text" 
                            placeholder="Nhập tên bài viết..." 
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </Col>
                    <Col md={2}>
                        <Button 
                            variant="primary" 
                            className="w-100"
                            onClick={() => setCurrentPage(1)}
                        >
                            Tìm kiếm
                        </Button>
                    </Col>
                </Row>
            </div>

            <div className="bg-white rounded shadow-sm overflow-hidden">
                <Table hover responsive className="mb-0 align-middle">
                    <thead className="bg-light border-bottom">
                        <tr>
                            <th className="ps-3">
                                <Form.Check 
                                    type="checkbox"
                                    checked={selectedIds.length === currentItems.length && currentItems.length > 0}
                                    onChange={(e) => handleCheckAll(e.target.checked)}
                                />
                            </th>
                            <th style={{ width: '30%' }}>Tên</th>
                            <th>Bình luận</th>
                            <th>Ngày bắt đầu</th>
                            <th>Ngày kết thúc</th>
                            <th>Ngày tạo</th>
                            <th className="text-center">Xuất bản</th>
                            <th className="text-center">Cập nhật</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" className="text-center py-5">
                                    Đang tải bài viết...
                                </td>
                            </tr>
                        ) : currentItems.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="text-center py-5 text-muted">
                                    Không tìm thấy bài viết nào
                                </td>
                            </tr>
                        ) : (
                            currentItems.map((post) => (
                                <tr key={post.Id}>
                                    <td className="ps-3">
                                        <Form.Check 
                                            type="checkbox"
                                            checked={selectedIds.includes(post.Id)}
                                            onChange={() => handleCheck(post.Id)}
                                        />
                                    </td>
                                    <td className="ps-3">
                                        <div className="fw-medium text-dark">{post.Title}</div>
                                    </td>
                                    <td>
                                        <div className="fw-medium text-dark">{post.Name}</div>
                                    </td>
                                    <td>
                                        <Badge bg="light" text="dark" className="border d-flex align-items-center gap-2">
                                            <span style={{ color: (post.AllowComments === true || post.AllowComments === 1) ? '#28a745' : '#dc3545' }}>
                                                <i className={`fa-solid ${(post.AllowComments === true || post.AllowComments === 1) ? 'fa-comment-dots' : 'fa-comment-slash'}`}></i>
                                                {' '}Bình luận: {(post.AllowComments === true || post.AllowComments === 1) ? 'Mở' : 'Khóa'}
                                            </span>
                                            
                                            <div className="vr mx-1"></div>

                                            <span className="fw-bold text-primary">
                                                {post.CommentCount || 0} <small className="text-muted">bình luận</small>
                                            </span>
                                        </Badge>
                                    </td>
                                    <td>{formatDate(post.StartDateUtc)}</td>
                                    <td>{formatDate(post.EndDateUtc)}</td>
                                    <td>{formatDate(post.CreatedOnUtc)}</td>
                                    <td className="text-center">
                                        {post.Published ? 
                                            <span className="text-success fs-5">✓</span> : 
                                            <span className="text-danger fs-5">✕</span>
                                        }
                                    </td>
                                    <td className="text-center">
                                        <Button 
                                            variant="primary" 
                                            size="sm" 
                                            className="rounded p-1 px-2"
                                            onClick={() => handleEdit(post.Id)}
                                        >
                                            <i className="fa-solid fa-pencil"></i>
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>

                <div className="d-flex justify-content-between align-items-center p-3 border-top">
                    <Pagination className="mb-0">
                        <Pagination.Prev
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            Trước
                        </Pagination.Prev>

                        {[...Array(totalPages)].map((_, i) => (
                            <Pagination.Item
                                key={i + 1}
                                active={i + 1 === currentPage}
                                onClick={() => setCurrentPage(i + 1)}
                            >
                                {i + 1}
                            </Pagination.Item>
                        ))}

                        <Pagination.Next
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(currentPage + 1)}
                        >
                            Tiếp
                        </Pagination.Next>
                    </Pagination>

                    <div className="d-flex align-items-center text-muted small">
                        <span>Show</span>
                        <Form.Select
                            size="sm"
                            className="mx-2"
                            style={{ width: '70px' }}
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={7}>7</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                        </Form.Select>
                        <span>items</span>
                        <span className="ms-3">
                            {filteredPosts.length > 0 ? indexOfFirstItem + 1 : 0}
                            -{Math.min(indexOfLastItem, filteredPosts.length)} of {filteredPosts.length} items
                        </span>
                    </div>
                </div>
            </div>
        </Container>
    );
};

export default NewPage;