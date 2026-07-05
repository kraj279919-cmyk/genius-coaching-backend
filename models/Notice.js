const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title for the notice'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    image: {
      type: String, // URL from Cloudinary (optional)
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['general', 'holiday', 'exam', 'fee', 'admission', 'event', 'urgent'],
      default: 'general',
    },
    targetAudience: {
      type: String,
      enum: ['all', 'teachers', 'students', 'class'],
      default: 'all',
    },
    targetClass: {
      type: String,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'expired'],
      default: 'published',
    },
    expiryDate: {
      type: Date,
    },
  },
  {
    timestamps: true,

  }
);

noticeSchema.index({ status: 1, targetAudience: 1 });

const Notice = mongoose.model('Notice', noticeSchema);

module.exports = Notice;
