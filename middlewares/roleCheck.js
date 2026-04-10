// server/src/middlewares/roleCheck.js
module.exports = (...roles) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
        }
        next();
    };
};