// backend/controllers/authController.js
const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User   = require('../models/User');

// ── Helpers ───────────────────────────────────────────────────────────────────
const normalizeRole = (role) => {
    const r = String(role || '').trim().toLowerCase();
    if (r === 'admin')                     return 'admin';
    if (r === 'farmer' || r === 'farm')    return 'farmer';
    if (r === 'staff' || r === 'customer') return 'staff';
    return 'staff';
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const sanitize = (str) => String(str || '').trim().replace(/[<>"'`]/g, '');

// Cấu hình cookie chung
const COOKIE_OPTS = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 ngày
    path:     '/',
};

// Thông tin user trả về (không có password)
const safeUser = (user, role) => ({
    id:       user.id,
    _id:      user._id,
    username: user.username,
    email:    user.email,
    fullName: user.fullName || '',
    role,
    avatar:   user.avatar  || '',
    phone:    String(user.phone || ''),
    status:   user.status,
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
const login = async (req, res, next) => {
    try {
        const username = sanitize(req.body.username);
        const password = sanitize(req.body.password);

        if (!username || !password)
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu' });

        if (username.length > 100 || password.length > 100)
            return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });

        const user = await User.findOne({ $or: [{ username }, { email: username }] });

        if (!user)
            return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });

        if (user.status === 'inactive' || user.status === 'banned')
            return res.status(403).json({ message: 'Tài khoản đã bị khóa, liên hệ admin' });

        // So sánh password (tương thích cả cũ chưa hash)
        const isHashed = typeof user.password === 'string' && /^\$2[aby]\$/.test(user.password);
        const isMatch  = isHashed
            ? await bcrypt.compare(password, user.password)
            : user.password === password;

        // Tự động hash password cũ chưa được hash
        if (!isHashed && isMatch) {
            user.password = await bcrypt.hash(password, 12);
            await user.save();
        }

        if (!isMatch)
            return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });

        const role  = normalizeRole(user.role);
        const token = jwt.sign(
            { id: user._id, role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // ✅ Lưu token trong cookie httpOnly — không trả về trong body
        res.cookie('token', token, COOKIE_OPTS);

    res.json({
    message: 'Đăng nhập thành công',

    token,

    user: safeUser(user, role),
});
    } catch (err) { next(err); }
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
const register = async (req, res, next) => {
    try {
        const username = sanitize(req.body.username);
        const email    = sanitize(req.body.email).toLowerCase();
        const password = sanitize(req.body.password);
        const fullName = sanitize(req.body.fullName);
        const phone    = sanitize(req.body.phone);
        const role     = sanitize(req.body.role);

        // Validate bắt buộc
        if (!username || !email || !password)
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });

        if (username.length < 4 || username.length > 50)
            return res.status(400).json({ message: 'Tên đăng nhập phải từ 4–50 ký tự' });

        if (!/^[a-zA-Z0-9_]+$/.test(username))
            return res.status(400).json({ message: 'Tên đăng nhập chỉ được dùng chữ, số và _' });

        if (!isValidEmail(email))
            return res.status(400).json({ message: 'Email không hợp lệ' });

        if (password.length < 8)
            return res.status(400).json({ message: 'Mật khẩu phải ít nhất 8 ký tự' });

        if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
            return res.status(400).json({ message: 'Mật khẩu phải có cả chữ và số' });

        // Kiểm tra unique
        const existed = await User.findOne({ $or: [{ username }, { email }] });
        if (existed) {
            const field = existed.username === username ? 'Tên đăng nhập' : 'Email';
            return res.status(400).json({ message: `${field} đã được sử dụng` });
        }

        const normalizedRole = normalizeRole(role);
        const hashed = await bcrypt.hash(password, 12);

        const user = new User({
            username,
            email,
            password:  hashed,
            fullName,
            phone,
            role:      normalizedRole,
            status:    'active',
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
        });
        await user.save();

        const token = jwt.sign(
            { id: user._id, role: normalizedRole },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // ✅ Set cookie luôn sau khi đăng ký (tự động đăng nhập)
        res.cookie('token', token, COOKIE_OPTS);

        res.status(201).json({
            message: 'Đăng ký thành công',
            user: safeUser(user, normalizedRole),
        });
    } catch (err) { next(err); }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
        res.json({
            ...user.toObject(),
            id:   user.id,
            role: normalizeRole(user.role),
        });
    } catch (err) { next(err); }
};

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
const logout = (req, res) => {
    res.clearCookie('token', { ...COOKIE_OPTS, maxAge: 0 });
    res.json({ message: 'Đăng xuất thành công' });
};

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
// Dùng khi token sắp hết hạn — frontend gọi để gia hạn mà không cần login lại
const refresh = async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        if (!token)
            return res.status(401).json({ message: 'Chưa đăng nhập' });

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            res.clearCookie('token', COOKIE_OPTS);
            return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
        }

        const user = await User.findById(decoded.id).select('-password');
        if (!user || user.status === 'inactive')
            return res.status(401).json({ message: 'Tài khoản không hợp lệ' });

        const role     = normalizeRole(user.role);
        const newToken = jwt.sign(
            { id: user._id, role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', newToken, COOKIE_OPTS);
        res.json({ message: 'Token đã được gia hạn', user: safeUser(user, role) });
    } catch (err) { next(err); }
};

module.exports = { login, register, getMe, logout, refresh };
