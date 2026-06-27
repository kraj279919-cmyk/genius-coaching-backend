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
  },
  {
    timestamps: true,
  }
);

const Notice = mongoose.model('Notice', noticeSchema);

module.exports = Notice;
