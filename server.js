require('dotenv').config();
const express       = require('express');
const mongoose      = require('mongoose');
const cors          = require('cors');
const helmet        = require('helmet');
const cookieParser  = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit     = require('express-rate-limit');

// ── Routes ──────────────────────────────────────────
const authRoutes       = require('./routes/authRoutes');
const userRoutes       = require('./routes/userRoutes');
const farmRoutes       = require('./routes/farmRoutes');
const batchRoutes      = require('./routes/batchRoutes');
const traceRoutes      = require('./routes/traceRoutes');
const reviewRoutes     = require('./routes/reviewRoutes');
const productRoutes    = require('./routes/productRoutes');
const categoryRoutes   = require('./routes/categoryRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
const adminRoutes      = require('./routes/adminRoutes');

// ── Middleware ───────────────────────────────────────
const errorHandler = require('./middlewares/errorHandler');

// ── App setup ───────────────────────────────────────
const app = express();

// 1. Helmet — bảo mật HTTP headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
}));

// 2. CORS — cho phép gửi cookie cross-origin
function isAllowedCorsOrigin(origin) {
    if (!origin) return true;
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true;
    try {
        const host = new URL(origin).hostname;
        if (/\.ngrok-free\.(app|dev)$/i.test(host)) return true;
        if (/\.ngrok\.io$/i.test(host))              return true;
    } catch { /* ignore */ }
    const extra = (process.env.CLIENT_URL || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    return extra.includes(origin);
}

app.use(cors({
    origin(origin, callback) {
        if (isAllowedCorsOrigin(origin)) return callback(null, true);
        return callback(null, false);
    },
    credentials:    true,  // ✅ bắt buộc để cookie cross-origin hoạt động
    methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
}));

// 3. Cookie parser — ✅ phải đặt TRƯỚC các route
app.use(cookieParser());

// 4. Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Mongo sanitize
app.use(mongoSanitize());

// 6. Global rate limit
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    message:         { message: 'Quá nhiều yêu cầu, thử lại sau 15 phút' },
    standardHeaders: true,
    legacyHeaders:   false,
    skip:            (req) => req.path === '/health',
}));

// ── API Routes ──────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/farms',       farmRoutes);
app.use('/api/batches',     batchRoutes);
app.use('/api/trace',       traceRoutes);
app.use('/api/reviews',     reviewRoutes);
app.use('/api/products',    productRoutes);
app.use('/api/categories',  categoryRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/admin',       adminRoutes);

// ── Health check ─────────────────────────────────────
app.get('/health', (req, res) => res.json({
    status:  'ok',
    time:    new Date().toISOString(),
    db:      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    storage: 'cloudinary',
    env:     process.env.NODE_ENV || 'development',
}));

// ── 404 handler ──────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// ── Error handler ────────────────────────────────────
app.use(errorHandler);

// ── Kết nối MongoDB & khởi động server ───────────────
const PORT      = process.env.PORT      || 5000;
const MONGO_URI = process.env.MONGO_URI;

const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingEnv   = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
    console.error('❌ Thiếu biến môi trường:', missingEnv.join(', '));
    process.exit(1);
}

mongoose.set('strictQuery', false);

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log('✅ Kết nối thành công tới MongoDB');
        app.listen(PORT, () => {
            console.log(`🚀 Server chạy tại: http://localhost:${PORT}`);
            console.log(`☁️  Storage:         Cloudinary (${process.env.CLOUDINARY_CLOUD_NAME})`);
            console.log(`🔒 Bảo mật:         Helmet + CORS + Cookie + Rate Limit + Mongo Sanitize`);
            console.log(`❤️  Health check:    http://localhost:${PORT}/health`);
        });
    })
    .catch((err) => {
        console.error('❌ Lỗi kết nối MongoDB:', err.message);
        process.exit(1);
    });