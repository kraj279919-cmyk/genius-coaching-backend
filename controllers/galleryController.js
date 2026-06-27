const Gallery = require('../models/Gallery');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Upload an image to gallery
 * @route   POST /api/gallery
 * @access  Private (Admin / Co-Director)
 */
const createGalleryImage = catchAsync(async (req, res) => {
  const { title, imageUrl, category } = req.body;

  const image = await Gallery.create({
    title,
    imageUrl, // from Cloudinary upload
    category: category || 'General',
    uploadedBy: req.user._id,
  });

  res.status(201).json(image);
});

/**
 * @desc    Get all gallery images
 * @route   GET /api/gallery
 * @access  Public (so the website can display them)
 */
const getGalleryImages = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;

  const images = await Gallery.find(filter)
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'name');

  res.json(images);
});

/**
 * @desc    Get gallery image by ID
 * @route   GET /api/gallery/:id
 * @access  Public
 */
const getGalleryImageById = catchAsync(async (req, res) => {
  const image = await Gallery.findById(req.params.id)
    .populate('uploadedBy', 'name');

  if (image) {
    res.json(image);
  } else {
    res.status(404);
    throw new Error('Image not found');
  }
});

/**
 * @desc    Update a gallery image details
 * @route   PUT /api/gallery/:id
 * @access  Private (Admin / Co-Director)
 */
const updateGalleryImage = catchAsync(async (req, res) => {
  const image = await Gallery.findById(req.params.id);

  if (image) {
    image.title = req.body.title || image.title;
    image.category = req.body.category || image.category;

    const updatedImage = await image.save();
    res.json(updatedImage);
  } else {
    res.status(404);
    throw new Error('Image not found');
  }
});

/**
 * @desc    Delete a gallery image
 * @route   DELETE /api/gallery/:id
 * @access  Private (Admin / Co-Director)
 */
const deleteGalleryImage = catchAsync(async (req, res) => {
  const image = await Gallery.findById(req.params.id);

  if (image) {
    await image.deleteOne();
    res.json({ message: 'Image deleted from gallery successfully' });
  } else {
    res.status(404);
    throw new Error('Image not found');
  }
});

module.exports = {
  createGalleryImage,
  getGalleryImages,
  getGalleryImageById,
  updateGalleryImage,
  deleteGalleryImage,
};
