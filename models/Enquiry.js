const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  course: { type: String },
  message: { type: String },
  status: { type: String, enum: ['New', 'Contacted', 'Resolved'], default: 'New' },
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', enquirySchema);
