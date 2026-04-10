const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    id:          { type: String },
    name:        { type: String, required: true },
    description: { type: String },
}, { timestamps: false, strict: false });

module.exports = mongoose.model('Category', categorySchema, 'categories');