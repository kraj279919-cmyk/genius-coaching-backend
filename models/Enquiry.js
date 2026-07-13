const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  course: { type: String },
  message: { type: String },
  status: { type: String, enum: ['New', 'Contacted', 'Resolved', 'Converted', 'Dropped'], default: 'New' },
  followUps: [{
    date: { type: Date, default: Date.now },
    notes: { type: String },
    status: { type: String }
  }],
  convertedToStudent: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', enquirySchema);
