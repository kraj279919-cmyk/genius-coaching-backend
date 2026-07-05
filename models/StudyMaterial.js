const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    subject: {
      type: String,
      required: [true, 'Please specify the subject'],
    },
    type: {
      type: String,
      enum: ['pdf', 'video', 'link', 'note', 'image'],
      default: 'note',
    },
    fileUrl: {
      type: String,
      required: [true, 'Please provide the file URL'],
    },
    cloudinaryPublicId: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    class: {
      type: String,
      required: [true, 'Please specify the class this material is for'],
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

studyMaterialSchema.index({ class: 1, status: 1 });

const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);

module.exports = StudyMaterial;
