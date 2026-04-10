// server/src/middlewares/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) throw new Error();

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) throw new Error();

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Vui lòng đăng nhập' });
    }
};