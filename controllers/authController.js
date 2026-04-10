// backend/controllers/authController.js
const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User   = require('../models/User');

const normalizeRole = (role) => {
    const r = String(role || '').trim().toLowerCase();
    if (r === 'admin')                  return 'admin';
    if (r === 'farmer' || r === 'farm') return 'farmer';
    if (r === 'staff' || r === 'customer') return 'staff';
    return 'staff';
};

// POST /api/auth/login
const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const loginValue = (username || '').trim();

        if (!loginValue || !password)
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu' });

        const user = await User.findOne({
            $or: [{ username: loginValue }, { email: loginValue }]
        });

        if (!user)
            return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });

        const isHashed = typeof user.password === 'string' && /^\$2[aby]\$/.test(user.password);
        const isMatch  = isHashed
            ? await bcrypt.compare(password, user.password)
            : user.password === password;

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
                id:       user.id,       // ✅ "U003" — custom id từ DB
                _id:      user._id,      // giữ thêm _id nếu cần
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

// POST /api/auth/register
const register = async (req, res, next) => {
    try {
        const { username, email, password, role, fullName, phone } = req.body;

        if (!username || !email || !password)
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });

        const existed = await User.findOne({ $or: [{ username }, { email }] });
        if (existed)
            return res.status(400).json({ message: 'Tài khoản hoặc email đã tồn tại' });

        const normalizedRole = normalizeRole(role);
        const hashed = await bcrypt.hash(password, 12);

        const user = new User({
            username,
            email,
            password: hashed,
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
                id:       user.id,       // ✅ custom id
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

// GET /api/auth/me
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
        res.json({
            ...user.toObject(),
            id:   user.id,   // ✅ custom id
            role: normalizeRole(user.role)
        });
    } catch (err) { next(err); }
};

module.exports = { login, register, getMe };