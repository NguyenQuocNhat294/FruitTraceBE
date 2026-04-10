const mongoose = require('mongoose');

const traceLogSchema = new mongoose.Schema({
    batch_id:    { type: String },
    step:        { type: String },
    title:       { type: String },
    description: { type: String },
    image:       { type: String },
    location:    { type: String },
    date:        { type: String },
}, { timestamps: false, strict: false });

module.exports = mongoose.model('TraceLog', traceLogSchema, 'tracelogs');