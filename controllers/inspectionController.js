const Inspection = require('../models/Inspection');

const getInspections = async (req, res, next) => {
    try {
        const { batchcode, result, q } = req.query;
        const filter = {};
        if (batchcode) filter.batchcode = batchcode;
        if (result) filter.result = result;
        if (q) {
            filter.$or = [
                { inspectionCode: { $regex: q, $options: 'i' } },
                { batchcode: { $regex: q, $options: 'i' } },
                { inspector: { $regex: q, $options: 'i' } },
            ];
        }
        const rows = await Inspection.find(filter).sort({ date: -1, createdAt: -1 });
        res.json(rows);
    } catch (err) {
        next(err);
    }
};

const createInspection = async (req, res, next) => {
    try {
        const { batchcode, inspector, result, note } = req.body;
        if (!batchcode || !inspector) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
        }

        const count = await Inspection.countDocuments();
        const inspectionCode = `INSP-${String(count + 1).padStart(3, '0')}`;

        const inspection = new Inspection({
            inspectionCode,
            batchcode,
            inspector,
            result: result || 'pending',
            note: note || '',
            date: new Date(),
        });

        await inspection.save();
        res.status(201).json(inspection);
    } catch (err) {
        next(err);
    }
};

const updateInspection = async (req, res, next) => {
    try {
        const inspection = await Inspection.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!inspection) return res.status(404).json({ message: 'Không tìm thấy phiếu kiểm định' });
        res.json(inspection);
    } catch (err) {
        next(err);
    }
};

const deleteInspection = async (req, res, next) => {
    try {
        const inspection = await Inspection.findByIdAndDelete(req.params.id);
        if (!inspection) return res.status(404).json({ message: 'Không tìm thấy phiếu kiểm định' });
        res.json({ message: 'Đã xóa phiếu kiểm định' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getInspections,
    createInspection,
    updateInspection,
    deleteInspection,
};

