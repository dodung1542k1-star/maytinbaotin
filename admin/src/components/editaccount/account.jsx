import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Breadcrumb } from 'react-bootstrap';
import { FaSave, FaCheckCircle, FaInfoCircle, FaChevronUp, FaUserCircle } from 'react-icons/fa';

const EditAccount = () => {
  const [formData, setFormData] = useState({
    active: true,
    taxExempt: false,
    newsletter: false,
  });

  return (
    <Container fluid className="bg-light min-vh-100 py-4">
      {/* Header Section */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h4 className="fw-bold mb-1">Thêm một khách hàng mới</h4>
          <Breadcrumb style={{ fontSize: '0.85rem' }}>
            <Breadcrumb.Item active>Thêm một khách hàng mới</Breadcrumb.Item>
          </Breadcrumb>
        </Col>
        <Col xs="auto">
          <Button variant="primary" className="me-2 shadow-sm d-inline-flex align-items-center">
            <FaSave className="me-2" /> Lưu lại
          </Button>
          <Button variant="primary" className="shadow-sm d-inline-flex align-items-center">
            <FaCheckCircle className="me-2" /> Thoát
          </Button>
        </Col>
      </Row>

      {/* Form Card Section */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center border-bottom-0">
          <div className="d-flex align-items-center fw-bold">
            <FaUserCircle className="me-2 text-secondary" /> Thông tin khách hàng
          </div>
          <FaChevronUp className="text-secondary cursor-pointer" />
        </Card.Header>
        
        <Card.Body className="px-5 py-4">
          <Form>
            {/* Mỗi Row là một trường nhập liệu để căn chỉnh nhãn bên trái giống ảnh mẫu */}
            
            {/* Email */}
            <Form.Group as={Row} className="mb-3 align-items-center">
              <Form.Label column sm={3} className="text-sm-end pe-4">
                Email <FaInfoCircle className="text-secondary opacity-50 small ms-1" />
              </Form.Label>
              <Col sm={9}>
                <Form.Control type="email" />
              </Col>
            </Form.Group>

            {/* Mật khẩu */}
            <Form.Group as={Row} className="mb-3 align-items-center">
              <Form.Label column sm={3} className="text-sm-end pe-4">
                Mật khẩu <FaInfoCircle className="text-secondary opacity-50 small ms-1" />
              </Form.Label>
              <Col sm={9}>
                <Form.Control type="password" />
              </Col>
            </Form.Group>

            {/* Họ */}
            <Form.Group as={Row} className="mb-3 align-items-center">
              <Form.Label column sm={3} className="text-sm-end pe-4">
                Họ <FaInfoCircle className="text-secondary opacity-50 small ms-1" />
              </Form.Label>
              <Col sm={9}>
                <Form.Control type="text" />
              </Col>
            </Form.Group>

            {/* Tên */}
            <Form.Group as={Row} className="mb-3 align-items-center">
              <Form.Label column sm={3} className="text-sm-end pe-4">
                Tên <FaInfoCircle className="text-secondary opacity-50 small ms-1" />
              </Form.Label>
              <Col sm={9}>
                <Form.Control type="text" />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3 align-items-center">
              <Form.Label column sm={3} className="text-sm-end pe-4">
                <span className="text-danger">*</span>Vai trò khách hàng <FaInfoCircle className="text-secondary opacity-50 small ms-1" />
              </Form.Label>
              <Col sm={9}>
                <Form.Select>
                  <option value=""></option>
                  <option value="guest">Khách</option>
                  <option value="registered">Thành viên đã đăng ký</option>
                </Form.Select>
              </Col>
            </Form.Group>
            {/* Kích hoạt */}
            <Form.Group as={Row} className="mb-3 align-items-center">
              <Form.Label column sm={3} className="text-sm-end pe-4">
                Kích hoạt <FaInfoCircle className="text-secondary opacity-50 small ms-1" />
              </Form.Label>
              <Col sm={9}>
                <Form.Check type="checkbox" defaultChecked />
              </Col>
            </Form.Group>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EditAccount;