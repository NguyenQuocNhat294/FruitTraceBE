// server/src/models/Task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    farmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    description: String,
    type: { type: String, enum: ['planting', 'harvest', 'maintenance', 'other'] },
    status: { type: String, enum: ['pending', 'in-progress', 'completed', 'cancelled'], default: 'pending' },
    dueDate: Date,
    completedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);