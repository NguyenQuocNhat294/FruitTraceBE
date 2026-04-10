const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
    id:              { type: String },
    batchcode:       { type: String },
    productid:       { type: String },
    farmid:          { type: String },
    harvestdate:     { type: Date },
    packagingdate:   { type: Date },
    expirydate:      { type: Date },
    quantitykg:      { type: Number },
    qr_code:         { type: String },
    image:           { type: String },
    status:          { type: String, default: 'available' },
}, { timestamps: false, strict: false });

module.exports = mongoose.model('Batch', batchSchema, 'batches');