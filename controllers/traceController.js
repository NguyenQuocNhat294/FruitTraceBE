// backend/controllers/traceController.js
const TraceLog = require('../models/TraceLog');
const Batch    = require('../models/Batch');

// GET /api/trace/:batchId
// batchId có thể là: MongoDB ObjectId, custom id "B001", hoặc batchcode "BATCH-001"
const getTraceByBatch = async (req, res, next) => {
    try {
        const { batchId } = req.params;

        // Tìm batch để lấy custom id "B001"
        let customId = batchId;
        try {
            const batch = await Batch.findOne({
                $or: [
                    { _id:       batchId },
                    { id:        batchId },
                    { batchcode: batchId },
                    { batchcode: { $regex: `^${batchId}$`, $options:'i' } },
                ]
            });
            if (batch) customId = batch.id; // lấy custom id "B001"
        } catch {}

        // Query tracelogs theo batch_id string
        const logs = await TraceLog.find({
            $or: [
                { batch_id: customId },
                { batch_id: batchId  },
            ]
        }).sort({ date: 1, step: 1 });

        res.json(logs);
    } catch (err) { next(err); }
};

// GET /api/trace?batch_id=B001
const getAllTraceLogs = async (req, res, next) => {
    try {
        const { batch_id, limit = 100 } = req.query;
        const filter = {};
        if (batch_id) filter.batch_id = batch_id;
        const logs = await TraceLog.find(filter)
            .sort({ date: -1 })
            .limit(parseInt(limit));
        res.json(logs);
    } catch (err) { next(err); }
};

// POST /api/trace
const createTraceLog = async (req, res, next) => {
    try {
        const log = new TraceLog(req.body);
        await log.save();
        res.status(201).json(log);
    } catch (err) { next(err); }
};

// PUT /api/trace/:id
const updateTraceLog = async (req, res, next) => {
    try {
        const log = await TraceLog.findById(req.params.id);
        if (!log) return res.status(404).json({ message:'Không tìm thấy nhật ký' });
        Object.assign(log, req.body);
        await log.save();
        res.json(log);
    } catch (err) { next(err); }
};

// DELETE /api/trace/:id
const deleteTraceLog = async (req, res, next) => {
    try {
        const log = await TraceLog.findById(req.params.id);
        if (!log) return res.status(404).json({ message:'Không tìm thấy nhật ký' });
        await log.deleteOne();
        res.json({ message:'Đã xóa nhật ký' });
    } catch (err) { next(err); }
};

module.exports = {
    getTraceByBatch, getAllTraceLogs,
    createTraceLog, updateTraceLog, deleteTraceLog,
};