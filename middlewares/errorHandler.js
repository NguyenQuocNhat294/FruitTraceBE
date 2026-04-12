// backend/middlewares/errorHandler.js
const errorHandler = (err, req, res, next) => {
    const isProd = process.env.NODE_ENV === 'production';
    const status = err.status || err.statusCode || 500;

    // Log đầy đủ ở server — nhưng KHÔNG gửi ra client khi production
    console.error(
        `❌ [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`,
        `| status: ${status}`,
        `| message: ${err.message}`,
        isProd ? '' : `\n${err.stack}`
    );

    // Xử lý các lỗi MongoDB phổ biến
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ message: messages.join(', ') });
    }

    if (err.code === 11000) {
        // Duplicate key error
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        return res.status(400).json({ message: `${field} đã tồn tại` });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Token không hợp lệ' });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token đã hết hạn' });
    }

    // Production — ẩn chi tiết lỗi server
    if (isProd && status === 500) {
        return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại sau' });
    }

    // Development — trả đầy đủ để debug
    res.status(status).json({
        message: err.message || 'Internal Server Error',
        ...(isProd ? {} : { stack: err.stack }),
    });
};

module.exports = errorHandler;