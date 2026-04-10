const mongoose = require('mongoose');

const inspectionSchema = new mongoose.Schema(
    {
        inspectionCode: { type: String, required: true, unique: true },
        batchcode: { type: String, required: true },
        inspector: { type: String, required: true },
        result: { type: String, enum: ['pass', 'pending', 'fail'], default: 'pending' },
        note: { type: String },
        date: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Inspection', inspectionSchema, 'inspections');

