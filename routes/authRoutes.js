// backend/routes/authRoutes.js
const express    = require('express');
const router     = express.Router();
const { login, register, getMe } = require('../controllers/authController');
const verifyToken = require('../middlewares/auth');

router.post('/login',    login);
router.post('/register', register);
router.get('/me',        verifyToken, getMe);

module.exports = router;