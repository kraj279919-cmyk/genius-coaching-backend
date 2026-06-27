const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a course title'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a course description'],
    },
    classLevel: {
      type: String, // e.g. "10th", "Foundation", "12th"
      required: true,
    },
    board: {
      type: String,
      enum: ['CBSE', 'BSEB', 'Both'],
      default: 'Both',
    },
    fee: {
      type: Number, // Optional public fee display
    },
    imageUrl: {
      type: String, // Cover image for the course card
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

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
