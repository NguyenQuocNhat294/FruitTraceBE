// backend/middlewares/auth.js
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const normalizeRole = (role) => {
    const r = String(role || '').trim().toLowerCase();
    if (r === 'admin')                     return 'admin';
    if (r === 'farmer' || r === 'farm')    return 'farmer';
    if (r === 'staff' || r === 'customer') return 'staff';
    return 'staff';
};

module.exports = async (req, res, next) => {
    try {
        // Lấy token từ header
        const authHeader = req.header('Authorization') || '';
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7).trim()
            : null;

        if (!token)
            return res.status(401).json({ message: 'Không tìm thấy token, vui lòng đăng nhập' });

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            if (err.name === 'TokenExpiredError')
                return res.status(401).json({ message: 'Token đã hết hạn, vui lòng đăng nhập lại' });
            return res.status(401).json({ message: 'Token không hợp lệ' });
        }

        // Lấy user từ DB
        const user = await User.findById(decoded.id).select('-password');
        if (!user)
            return res.status(401).json({ message: 'Tài khoản không tồn tại' });

        // Kiểm tra tài khoản bị khóa
        if (user.status === 'inactive' || user.status === 'banned')
            return res.status(403).json({ message: 'Tài khoản đã bị khóa' });

        // Gắn user vào request — chuẩn hóa role
        req.user = {
            ...user.toObject(),
            id:   user.id,   // custom id (U003)
            _id:  user._id,
            role: normalizeRole(user.role),
        };

        next();
    } catch (err) {
        res.status(401).json({ message: 'Xác thực thất bại' });
    }
};