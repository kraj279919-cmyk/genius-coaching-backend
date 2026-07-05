const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    examName: {
      type: String,
      required: [true, 'Please specify the exam name (e.g., Mid-Term)'],
    },
    subject: {
      type: String,
      required: [true, 'Please specify the subject'],
    },
    class: {
      type: String,
      required: true,
    },
    marksObtained: {
      type: Number,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
    },
    grade: {
      type: String,
    },
    remarks: {
      type: String,
    },
    reportUrl: {
      type: String,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin or Teacher
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

resultSchema.index({ studentId: 1 });
resultSchema.index({ class: 1 });

const Result = mongoose.model('Result', resultSchema);

module.exports = Result;
