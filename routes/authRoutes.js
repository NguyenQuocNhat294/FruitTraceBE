const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, register, getMe } = require('../controllers/authController');
const verifyToken = require('../middlewares/auth');

const router = express.Router();

/**
 * ── RATE LIMITER CONFIGURATION ──
 * Bảo vệ hệ thống khỏi các cuộc tấn công Brute Force
 */

// Giới hạn cho đăng nhập: 15 lần / 15 phút
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: {
        status: 429,
        message: 'Hành động quá thường xuyên. Vui lòng thử lại sau 15 phút.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Giới hạn cho đăng ký: 5 lần / 1 giờ
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        status: 429,
        message: 'Giới hạn tạo tài khoản đã đạt mức tối đa. Vui lòng quay lại sau.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ── ROUTES DEFINITION ──
router.post('/login', loginLimiter, login);
router.post('/register', registerLimiter, register);
router.get('/me', verifyToken, getMe);

module.exports = router;