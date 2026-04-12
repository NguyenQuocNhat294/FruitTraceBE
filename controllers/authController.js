// backend/controllers/authController.js
const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User   = require('../models/User');

const normalizeRole = (role) => {
    const r = String(role || '').trim().toLowerCase();
    if (r === 'admin')                     return 'admin';
    if (r === 'farmer' || r === 'farm')    return 'farmer';
    if (r === 'staff' || r === 'customer') return 'staff';
    return 'staff';
};

// ── Validate email format ──
const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ── Sanitize string — xóa ký tự nguy hiểm ──
const sanitize = (str) =>
    String(str || '').trim().replace(/[<>"'`]/g, '');

// ── POST /api/auth/login ─────────────────────────────
const login = async (req, res, next) => {
    try {
        const username = sanitize(req.body.username);
        const password = sanitize(req.body.password);

        // Validate
        if (!username || !password)
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu' });

        if (username.length > 100 || password.length > 100)
            return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });

        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        });

        // Trả cùng 1 message để tránh user enumeration
        if (!user)
            return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });

        // Kiểm tra tài khoản bị khóa
        if (user.status === 'inactive' || user.status === 'banned')
            return res.status(403).json({ message: 'Tài khoản đã bị khóa, liên hệ admin' });

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

        const normalizedRole = normalizeRole(user.role);

        const token = jwt.sign(
            { id: user._id, role: normalizedRole },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id:       user.id,
                _id:      user._id,
                username: user.username,
                email:    user.email,
                role:     normalizedRole,
                avatar:   user.avatar,
                phone:    String(user.phone || ''),
                status:   user.status,
            }
        });
    } catch (err) { next(err); }
};

// ── POST /api/auth/register ──────────────────────────
const register = async (req, res, next) => {
    try {
        const username = sanitize(req.body.username);
        const email    = sanitize(req.body.email);
        const password = sanitize(req.body.password);
        const fullName = sanitize(req.body.fullName);
        const phone    = sanitize(req.body.phone);
        const role     = sanitize(req.body.role);

        // Validate bắt buộc
        if (!username || !email || !password)
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });

        // Validate độ dài
        if (username.length < 3 || username.length > 50)
            return res.status(400).json({ message: 'Tên đăng nhập phải từ 3-50 ký tự' });

        if (password.length < 6)
            return res.status(400).json({ message: 'Mật khẩu phải ít nhất 6 ký tự' });

        // Validate email format
        if (!isValidEmail(email))
            return res.status(400).json({ message: 'Email không hợp lệ' });

        // Kiểm tra tồn tại
        const existed = await User.findOne({ $or: [{ username }, { email }] });
        if (existed)
            return res.status(400).json({ message: 'Tài khoản hoặc email đã tồn tại' });

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

        res.status(201).json({
            token,
            user: {
                id:       user.id,
                _id:      user._id,
                username: user.username,
                email:    user.email,
                role:     normalizedRole,
                avatar:   user.avatar || '',
                status:   user.status,
            }
        });
    } catch (err) { next(err); }
};

// ── GET /api/auth/me ─────────────────────────────────
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

module.exports = { login, register, getMe };