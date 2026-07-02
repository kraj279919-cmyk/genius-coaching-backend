const mongoose = require('mongoose');

const apiRequestLogSchema = new mongoose.Schema({
  route: { type: String },
  method: { type: String },
  statusCode: { type: Number },
  responseTime: { type: Number }, // ms
  userRole: { type: String },
  errorFlag: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// TTL index: 7 days retention for request logs (they grow fast)
apiRequestLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

module.exports = mongoose.model('ApiRequestLog', apiRequestLogSchema);
