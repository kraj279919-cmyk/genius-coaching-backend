const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Leave', 'present', 'absent', 'late', 'leave'],
      required: true,
    },
    class: {
      type: String,
      required: true,
    },
    section: {
      type: String,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Usually a Teacher or Admin
      required: true,
    },
    remarks: {
      type: String, // Optional reason for absence
    }
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ studentId: 1, date: -1 });
attendanceSchema.index({ class: 1, date: -1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
