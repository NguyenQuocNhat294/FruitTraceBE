require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const helmet   = require('helmet');
const path     = require('path');

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

// 1. Helmet — cho phép ảnh load cross-origin
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
}));

// 2. CORS — phải cho phép header ngrok-skip-browser-warning (axios) để preflight OPTIONS qua ngrok
function isAllowedCorsOrigin(origin) {
    if (!origin) return true;
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true;
    try {
        const host = new URL(origin).hostname;
        if (/\.ngrok-free\.(app|dev)$/i.test(host)) return true;
        if (/\.ngrok\.io$/i.test(host)) return true;
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
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
}));

// 3. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Static files — serve ảnh từ frontend/public/images
app.use('/images', express.static(
    path.join(__dirname, '../frontend/public/images'),
    { maxAge: '1d' }
));

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
    status: 'ok',
    time:   new Date().toISOString(),
    db:     mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
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

mongoose.set('strictQuery', false);

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log('✅ Kết nối thành công tới MongoDB');
        app.listen(PORT, () => {
            console.log(`🚀 Server chạy tại: http://localhost:${PORT}`);
            console.log(`🖼️  Images:          http://localhost:${PORT}/images/`);
            console.log(`❤️  Health check:    http://localhost:${PORT}/health`);
        });
    })
    .catch((err) => {
        console.error('❌ Lỗi kết nối MongoDB:', err.message);
        process.exit(1);
    });