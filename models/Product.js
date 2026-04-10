const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id:          { type: String },
    name:        { type: String, required: true },
    CategoryId:  { type: String },
    FarmId:      { type: String },
    price:       { type: Number },
    unit:        { type: String, default: 'kg' },
    description: { type: String },
    image:       { type: String },
    stock:       { type: Number, default: 0 },
    rating:      { type: Number, default: 0 },
    createdat:   { type: Date },
    status:      { type: String, default: 'active' },
}, {
    timestamps: false,  // tắt vì đã có createdat
    strict: false       // cho phép các field không khai báo
});

module.exports = mongoose.model('Product', productSchema, 'products');
