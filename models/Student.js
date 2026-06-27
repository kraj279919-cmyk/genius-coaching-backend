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
    parentPhone: {
      type: String,
      required: [true, 'Please add parent phone number'],
    },
    address: {
      type: String,
      required: [true, 'Please add residential address'],
    },
    profileImage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
