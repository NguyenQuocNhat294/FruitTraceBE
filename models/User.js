// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id:        { type: String },
    username:  { type: String, required: true, unique: true },
    email:     { type: String, required: true, unique: true },
    password:  { type: String, required: true },
    fullName:  { type: String },
    // Chấp nhận cả "farmer" và "farm" từ data cũ
    role:      { type: String, enum: ['admin', 'farmer', 'farm', 'staff'], default: 'staff' },
    phone:     { type: String }, // ← đổi từ Number → String cho an toàn
    avatar:    { type: String },
    status:    { type: String, enum: ['active', 'inactive'], default: 'active' },
    CreatedAt: { type: Date, default: Date.now },
    UpdatedAt: { type: Date, default: Date.now },
}, { timestamps: false, strict: false });

module.exports = mongoose.model('User', userSchema, 'users');