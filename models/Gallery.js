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
    cloudinaryPublicId: {
      type: String,
    },
    category: {
      type: String,
      enum: ['classroom', 'event', 'topper', 'festival', 'smart-class', 'achievement', 'other'],
      default: 'other',
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
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
