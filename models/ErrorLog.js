const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
  route: { type: String },
  statusCode: { type: Number },
  message: { type: String },
  stack: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userRole: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// TTL index: 30 days retention for error logs
errorLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('ErrorLog', errorLogSchema);
