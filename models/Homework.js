const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a homework title'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description/instructions'],
    },
    subject: {
      type: String,
      required: [true, 'Please specify the subject'],
    },
    class: {
      type: String,
      required: [true, 'Please specify the class (e.g. 10th)'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Please set a due date'],
    },
    attachmentUrl: {
      type: String, // Cloudinary URL for any attached PDF or image
    },
    attachmentType: {
      type: String,
      enum: ['pdf', 'image', 'link', 'none'],
      default: 'none',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'expired'],
      default: 'active',
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Teacher ID
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Homework = mongoose.model('Homework', homeworkSchema);

module.exports = Homework;
