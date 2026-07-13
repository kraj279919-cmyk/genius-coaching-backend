const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  startTime: { type: String, required: true }, // Format: "09:00 AM"
  endTime: { type: String, required: true },   // Format: "10:00 AM"
});

const timetableSchema = new mongoose.Schema({
  class: { type: String, required: true },
  section: { type: String, default: 'A' },
  dayOfWeek: { 
    type: String, 
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  periods: [periodSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Prevent duplicate class+section+day entries
timetableSchema.index({ class: 1, section: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);
