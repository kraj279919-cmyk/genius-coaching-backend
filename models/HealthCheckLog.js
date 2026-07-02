const mongoose = require('mongoose');

const healthCheckLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  backendStatus: { type: String },
  mongoStatus: { type: String },
  cloudinaryStatus: { type: String },
  responseTime: { type: Number }, // ms
  memoryUsage: { type: String },
  status: { type: String, enum: ['green', 'yellow', 'red'] },
  notes: { type: String }
}, { timestamps: true });

// TTL index to automatically remove logs older than 30 days
healthCheckLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('HealthCheckLog', healthCheckLogSchema);
