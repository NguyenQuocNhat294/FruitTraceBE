// backend/controllers/batchController.js
const Batch = require('../models/Batch');

// URL frontend — ưu tiên env, fallback Vercel
const FRONTEND_URL = (process.env.CLIENT_URL || '')
    .split(',')
    .map(s => s.trim())
    .find(s => s.includes('vercel.app') || s.includes('https://'))
    || 'https://ftrui-trace-fe.vercel.app';

// Tạo QR URL chuẩn cho batch
const makeQrUrl = (batchcode) =>
    `${FRONTEND_URL}/trace?code=${encodeURIComponent(batchcode)}`;

// GET /api/batches?farmid=F001&status=available&productid=P001
const getBatches = async (req, res, next) => {
    try {
        const { farmid, productid, status, search } = req.query;
        const filter = {};
        if (farmid)    filter.farmid    = farmid;
        if (productid) filter.productid = productid;
        if (status)    filter.status    = status;
        if (search) {
            filter.$or = [
                { batchcode: { $regex: search, $options: 'i' } },
                { productid: { $regex: search, $options: 'i' } },
            ];
        }
        const batches = await Batch.find(filter).sort({ harvestdate: -1 });
        res.json(batches);
    } catch (err) { next(err); }
};

// GET /api/batches/:id
const getBatchById = async (req, res, next) => {
    try {
        const batch = await Batch.findById(req.params.id);
        if (!batch) return res.status(404).json({ message: 'Không tìm thấy lô hàng' });
        res.json(batch);
    } catch (err) { next(err); }
};

// GET /api/batches/code/:code
const getBatchByCode = async (req, res, next) => {
    try {
        const code  = req.params.code;
        const batch = await Batch.findOne({
            $or: [
                { batchcode: { $regex: `^${code}$`, $options: 'i' } },
                { id: code },
            ]
        });
        if (!batch) return res.status(404).json({ message: 'Không tìm thấy lô hàng' });
        res.json(batch);
    } catch (err) { next(err); }
};

// POST /api/batches
const createBatch = async (req, res, next) => {
    try {
        const data = { ...req.body };

        // ✅ Tự động generate batchcode nếu chưa có
        if (!data.batchcode) {
            const count = await Batch.countDocuments();
            data.batchcode = `BATCH-${String(count + 1).padStart(3, '0')}`;
        }

        // ✅ Tự động tạo qr_code đúng URL Vercel
        data.qr_code = makeQrUrl(data.batchcode);

        const batch = new Batch(data);
        await batch.save();
        res.status(201).json(batch);
    } catch (err) { next(err); }
};

// PUT /api/batches/:id
const updateBatch = async (req, res, next) => {
    try {
        const batch = await Batch.findById(req.params.id);
        if (!batch) return res.status(404).json({ message: 'Không tìm thấy lô hàng' });

        // Nếu batchcode thay đổi → cập nhật lại qr_code
        if (req.body.batchcode && req.body.batchcode !== batch.batchcode) {
            req.body.qr_code = makeQrUrl(req.body.batchcode);
        }

        Object.assign(batch, req.body);
        await batch.save();
        res.json(batch);
    } catch (err) { next(err); }
};

// DELETE /api/batches/:id
const deleteBatch = async (req, res, next) => {
    try {
        const batch = await Batch.findById(req.params.id);
        if (!batch) return res.status(404).json({ message: 'Không tìm thấy lô hàng' });
        await batch.deleteOne();
        res.json({ message: 'Đã xóa lô hàng' });
    } catch (err) { next(err); }
};

// GET /api/batches/stats
const getBatchStats = async (req, res, next) => {
    try {
        const [total, available, shipping, sold, harvested] = await Promise.all([
            Batch.countDocuments(),
            Batch.countDocuments({ status: 'available' }),
            Batch.countDocuments({ status: 'shipping'  }),
            Batch.countDocuments({ status: 'sold'      }),
            Batch.countDocuments({ status: 'harvested' }),
        ]);
        const totalKg = await Batch.aggregate([
            { $group: { _id: null, total: { $sum: '$quantitykg' } } }
        ]);
        res.json({
            total, available, shipping, sold, harvested,
            totalKg: totalKg[0]?.total || 0,
        });
    } catch (err) { next(err); }
};

module.exports = {
    getBatches, getBatchById, getBatchByCode,
    createBatch, updateBatch, deleteBatch,
    getBatchStats,
};