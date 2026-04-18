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
        // ✅ Ưu tiên cookie httpOnly, fallback sang Authorization header (Postman/mobile)
        const cookieToken = req.cookies?.token;
        const headerToken = (req.header('Authorization') || '').startsWith('Bearer ')
            ? req.header('Authorization').slice(7).trim()
            : null;

        const token = cookieToken || headerToken;

        if (!token)
            return res.status(401).json({ message: 'Chưa đăng nhập, vui lòng đăng nhập lại' });

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            // Nếu token trong cookie hết hạn → clear cookie luôn
            if (cookieToken) {
                res.clearCookie('token', {
                    httpOnly: true,
                    secure:   process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
                    path:     '/',
                });
            }
            if (err.name === 'TokenExpiredError')
                return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });
            return res.status(401).json({ message: 'Token không hợp lệ' });
        }

        // Lấy user từ DB
        const user = await User.findById(decoded.id).select('-password');
        if (!user)
            return res.status(401).json({ message: 'Tài khoản không tồn tại' });

        // Kiểm tra tài khoản bị khóa
        if (user.status === 'inactive' || user.status === 'banned')
            return res.status(403).json({ message: 'Tài khoản đã bị khóa, liên hệ admin' });

        // Gắn user vào request
        req.user = {
            ...user.toObject(),
            id:   user.id,
            _id:  user._id,
            role: normalizeRole(user.role),
        };

        next();
    } catch (err) {
        res.status(401).json({ message: 'Xác thực thất bại' });
    }
};