const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title or caption for the image'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'], // Cloudinary URL
    },
    category: {
      type: String,
      default: 'General', // e.g., 'Events', 'Achievements', 'Classroom'
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Gallery = mongoose.model('Gallery', gallerySchema);

module.exports = Gallery;
