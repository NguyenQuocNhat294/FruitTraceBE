const express   = require('express');
const rateLimit = require('express-rate-limit');
const { login, register, getMe, logout, refresh } = require('../controllers/authController');
const verifyToken = require('../middlewares/auth');
const User        = require('../models/User');

const router = express.Router();

// ── RATE LIMITERS ─────────────────────────────────────────────────────────────

const loginLimiter = rateLimit({
    windowMs:        15 * 60 * 1000,
    max:             15,
    message:         { status: 429, message: 'Hành động quá thường xuyên. Vui lòng thử lại sau 15 phút.' },
    standardHeaders: true,
    legacyHeaders:   false,
});

const registerLimiter = rateLimit({
    windowMs:        60 * 60 * 1000,
    max:             5,
    message:         { status: 429, message: 'Giới hạn tạo tài khoản đã đạt mức tối đa. Vui lòng quay lại sau.' },
    standardHeaders: true,
    legacyHeaders:   false,
});

const checkLimiter = rateLimit({
    windowMs:        60 * 1000,
    max:             60,
    message:         { status: 429, message: 'Quá nhiều yêu cầu kiểm tra. Vui lòng thử lại sau.' },
    standardHeaders: true,
    legacyHeaders:   false,
});

const refreshLimiter = rateLimit({
    windowMs:        15 * 60 * 1000,
    max:             30,
    message:         { status: 429, message: 'Quá nhiều yêu cầu gia hạn. Vui lòng thử lại sau.' },
    standardHeaders: true,
    legacyHeaders:   false,
});

// ── ROUTES ────────────────────────────────────────────────────────────────────

router.post('/login',    loginLimiter,    login);
router.post('/register', registerLimiter, register);
router.get ('/me',       verifyToken,     getMe);

// ✅ Thêm mới
router.post('/logout',  verifyToken,    logout);   // xóa cookie, cần đăng nhập mới logout được
router.post('/refresh', refreshLimiter, refresh);  // gia hạn token không cần login lại

// GET /api/auth/check-username?username=abc
router.get('/check-username', checkLimiter, async (req, res) => {
    try {
        const { username } = req.query;
        if (!username?.trim()) return res.json({ exists: false });
        const exists = await User.exists({ username: username.trim() });
        res.json({ exists: !!exists });
    } catch {
        res.status(500).json({ exists: false, message: 'Lỗi server.' });
    }
});

// GET /api/auth/check-email?email=abc@gmail.com
router.get('/check-email', checkLimiter, async (req, res) => {
    try {
        const { email } = req.query;
        if (!email?.trim()) return res.json({ exists: false });
        const exists = await User.exists({ email: email.trim().toLowerCase() });
        res.json({ exists: !!exists });
    } catch {
        res.status(500).json({ exists: false, message: 'Lỗi server.' });
    }
});

module.exports = router;