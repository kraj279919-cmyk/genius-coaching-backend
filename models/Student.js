const mongoose = require('mongoose');

// Define the Student schema
// Note: This links to the base User model via user account if needed,
// or we can store all info here and link via email/userId.
// To keep it simple, we include a reference to the auth User.
const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentId: {
      type: String,
      required: [true, 'Please add a student ID (Roll No)'],
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Please add student name'],
    },
    class: {
      type: String,
      required: [true, 'Please add a class (e.g., 5th, 10th)'],
    },
    section: {
      type: String,
      required: [true, 'Please add a section'],
    },
    phone: {
      type: String,
      required: [true, 'Please add student phone number'],
    },
    address: {
      type: String,
      required: [true, 'Please add residential address'],
    },
    fatherName: { type: String },
    motherName: { type: String },
    guardianName: { type: String },
    parentPhone: { type: String },
    alternateMobile: { type: String },
    emergencyContact: { type: String },
    profileImage: {
      type: String,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived', 'deleted'],
      default: 'active',
    },
    academicYear: {
      type: String,
      default: '2025-26',
    },
    previousClassHistory: [
      {
        class: String,
        academicYear: String,
        promotedAt: Date,
      }
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
studentSchema.index({ userId: 1 });
studentSchema.index({ class: 1, status: 1 });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
