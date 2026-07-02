const mongoose = require('mongoose');

const jobQueueSchema = new mongoose.Schema({
  type: { type: String, required: true },
  status: { type: String, enum: ['pending', 'running', 'completed', 'failed'], default: 'pending' },
  payloadSummary: { type: String },
  attempts: { type: Number, default: 0 },
  lastError: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('JobQueue', jobQueueSchema);
