import React, { useState } from 'react';

export default function Login() {
  // 1. Khai báo state để lưu thông tin form
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // 2. Hàm xử lý khi nhập liệu
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 3. Hàm xử lý đăng nhập
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Đăng nhập thành công!' });
        
        // Lưu Token và thông tin User vào LocalStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Chuyển hướng sau 1 giây (ví dụ về trang chủ hoặc admin)
        setTimeout(() => {
          window.location.href = data.user.roles.includes('NV') ? '/admin' : '/';
        }, 1000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Đăng nhập thất bại' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Không thể kết nối tới server!' });
    } finally {
      setLoading(false);
    }
  };

  // 4. Giao diện Form (Sử dụng CSS inline cơ bản để bạn dễ copy)
  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={{ textAlign: 'center' }}>ĐĂNG NHẬP HỆ THỐNG</h2>
        
        {message.text && (
          <div style={{ 
            padding: '10px', 
            marginBottom: '15px', 
            borderRadius: '4px',
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24'
          }}>
            {message.text}
          </div>
        )}

        <div style={styles.inputGroup}>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="example@gmail.com"
          />
        </div>

        <div style={styles.inputGroup}>
          <label>Mật khẩu:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="********"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          style={{...styles.button, backgroundColor: loading ? '#ccc' : '#007bff'}}
        >
          {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
        </button>
      </form>
    </div>
  );
}

// CSS đơn giản cho demo
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f5f5f5'
  },
  form: {
    padding: '30px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px'
  },
  inputGroup: {
    marginBottom: '15px'
  },
  input: {
    width: '100%',
    padding: '10px',
    marginTop: '5px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '12px',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  }
};