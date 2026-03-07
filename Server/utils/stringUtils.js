const createSlug = (text) => {
    if (!text) return '';
    return text.toString().toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Khử dấu
        .replace(/[đĐ]/g, 'd')
        .replace(/([^0-9a-z-\s])/g, '') // Xóa ký tự đặc biệt
        .replace(/(\s+)/g, '-') // Đổi khoảng trắng thành gạch ngang
        .replace(/-+/g, '-') // Xóa gạch ngang thừa
        .replace(/^-+|-+$/g, ''); // Xóa gạch ngang ở đầu/cuối
};

module.exports = { createSlug };