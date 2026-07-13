const mongoose = require('mongoose');

const teacherAttendanceSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
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
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin/Director
      required: true,
    },
    remarks: {
      type: String, // Optional reason
    }
  },
  {
    timestamps: true,
  }
);

teacherAttendanceSchema.index({ teacherId: 1, date: -1 });

const TeacherAttendance = mongoose.model('TeacherAttendance', teacherAttendanceSchema);

module.exports = TeacherAttendance;
