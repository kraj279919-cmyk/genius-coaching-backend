const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teacherId: {
      type: String,
      required: [true, 'Please add a teacher ID'],
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Please add teacher name'],
    },
    subject: {
      type: String,
      required: [true, 'Please add main subject'],
    },
    qualification: {
      type: String,
      required: [true, 'Please add qualification'],
    },
    phone: {
      type: String,
      required: [true, 'Please add phone number'],
    },
    profileImage: {
      type: String,
    },
    email: {
      type: String,
    },
    address: {
      type: String,
    },
    experience: {
      type: String,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived', 'deleted'],
      default: 'active',
    },
    assignedClasses: [{
      type: String,
    }],
    cloudinaryPublicId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;
