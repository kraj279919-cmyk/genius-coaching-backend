const mongoose = require('mongoose');

const doubtSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  status: { type: String, enum: ['Pending', 'Answered'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Doubt', doubtSchema);
