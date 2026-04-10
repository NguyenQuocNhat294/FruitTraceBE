const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
    id:            { type: String },
    FarmName:      { type: String, required: true },
    OwnerId:       { type: String },
    province:      { type: String },
    district:      { type: String },
    address:       { type: String },
    AreaHectare:   { type: Number },
    certification: { type: String },
    image:         { type: String },
    createdat:     { type: Date },
}, { timestamps: false, strict: false });

module.exports = mongoose.model('Farm', farmSchema, 'farms');