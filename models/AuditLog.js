const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: String
  },
  ipAddress: {
    type: String
  },
  targetResource: {
    type: String
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId
  }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
