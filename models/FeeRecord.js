const mongoose = require('mongoose');

const feeRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please specify the fee amount'],
    },
    month: {
      type: String,
      required: [true, 'Please specify the fee month (e.g., April 2026)'],
    },
    session: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Paid', 'Pending', 'Partial', 'paid', 'pending', 'partial'],
      default: 'pending',
    },
    dueDate: {
      type: Date,
    },
    paymentDate: {
      type: Date,
    },
    paymentMode: {
      type: String,
      enum: ['cash', 'upi', 'bank', 'other'],
    },
    receiptUrl: {
      type: String, // Cloudinary URL for uploaded receipt photo/PDF
    },
    note: {
      type: String,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin or Co-Director
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const FeeRecord = mongoose.model('FeeRecord', feeRecordSchema);

module.exports = FeeRecord;
