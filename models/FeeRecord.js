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
    status: {
      type: String,
      enum: ['Paid', 'Pending', 'Partial'],
      default: 'Pending',
    },
    paymentDate: {
      type: Date,
    },
    receiptUrl: {
      type: String, // Cloudinary URL for uploaded receipt photo/PDF
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
