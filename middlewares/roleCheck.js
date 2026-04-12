// backend/middlewares/roleCheck.js
module.exports = (...roles) => {
    return (req, res, next) => {
        // Chưa đăng nhập
        if (!req.user)
            return res.status(401).json({ message: 'Vui lòng đăng nhập' });

        // Không đủ quyền
        if (!roles.includes(req.user.role)) {
            // Log cảnh báo — ai đang cố truy cập trái phép
            console.warn(
                `⚠️  [${new Date().toISOString()}] UNAUTHORIZED ACCESS`,
                `| user: ${req.user.username || req.user.id}`,
                `| role: ${req.user.role}`,
                `| required: [${roles.join(', ')}]`,
                `| path: ${req.method} ${req.originalUrl}`,
                `| ip: ${req.ip}`
            );
            return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
        }

        next();
    };
};