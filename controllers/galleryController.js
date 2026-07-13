const Gallery = require('../models/Gallery');
const cloudinary = require('cloudinary').v2;
const catchAsync = require('../utils/catchAsync');
const {
  validateRequiredFields
} = require('../utils/validators');

/**
 * @desc    Get all gallery images (Admin view)
 * @route   GET /api/gallery
 * @access  Private (Admin / Director)
 */
const getGallery = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.status) filter.status = req.query.status;

  const limit = parseInt(req.query.limit) || 1000;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const gallery = await Gallery.find(filter)
    .lean()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('uploadedBy', 'name role');

  res.json(gallery);
});

/**
 * @desc    Get public gallery images (Active only)
 * @route   GET /api/gallery/public
 * @access  Public
 */
const getPublicGallery = catchAsync(async (req, res) => {
  const filter = { status: 'active' };
  if (req.query.category) filter.category = req.query.category;

  const limit = parseInt(req.query.limit) || 1000;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const gallery = await Gallery.find(filter)
    .lean()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('-uploadedBy'); // Hide uploader info for public

  res.json(gallery);
});

/**
 * @desc    Get single gallery image
 * @route   GET /api/gallery/:id
 * @access  Private
 */
const getGalleryById = catchAsync(async (req, res) => {
  const galleryItem = await Gallery.findById(req.params.id)
    .populate('uploadedBy', 'name role');

  if (galleryItem) {
    if (req.user.role !== 'admin' && req.user.role !== 'director' && galleryItem.status !== 'active') {
      res.status(403);
      throw new Error('Not authorized to view inactive images');
    }
    res.json(galleryItem);
  } else {
    res.status(404);
    throw new Error('Gallery image not found');
  }
});

/**
 * @desc    Upload new gallery image
 * @route   POST /api/gallery
 * @access  Private (Admin / Director)
 */
const createGalleryImage = catchAsync(async (req, res) => {
  const { title, imageUrl, cloudinaryPublicId, category, description, status } = req.body;

  const requiredError = validateRequiredFields(['title', 'imageUrl'], req.body);
  if (requiredError) { res.status(400); throw new Error(requiredError); }

  if (!imageUrl.startsWith('http')) { res.status(400); throw new Error('Invalid Image URL'); }
  if (category && !['campus', 'events', 'achievements', 'other'].includes(category)) { res.status(400); throw new Error('Invalid category.'); }
  if (status && !['active', 'inactive'].includes(status)) { res.status(400); throw new Error('Invalid status.'); }

  const galleryItem = await Gallery.create({
    title,
    imageUrl,
    cloudinaryPublicId,
    category: category || 'other',
    description: description || '',
    status: status || 'active',
    uploadedBy: req.user._id,
  });

  const populated = await Gallery.findById(galleryItem._id).populate('uploadedBy', 'name role');
  res.status(201).json(populated);
});

/**
 * @desc    Update gallery image
 * @route   PATCH /api/gallery/:id
 * @access  Private (Admin / Director)
 */
const updateGalleryImage = catchAsync(async (req, res) => {
  const galleryItem = await Gallery.findById(req.params.id);

  if (galleryItem) {
    const { title, imageUrl, cloudinaryPublicId, category, description, status } = req.body;
    
    if (req.body.title !== undefined && req.body.title.trim() === '') { res.status(400); throw new Error("Title is required."); }
    if (req.body.imageUrl !== undefined && !req.body.imageUrl.startsWith('http')) { res.status(400); throw new Error('Invalid Image URL'); }
    if (req.body.category !== undefined && !['campus', 'events', 'achievements', 'other'].includes(req.body.category)) { res.status(400); throw new Error('Invalid category.'); }
    if (req.body.status !== undefined && !['active', 'inactive'].includes(req.body.status)) { res.status(400); throw new Error('Invalid status.'); }

    if (title) galleryItem.title = title;
    if (imageUrl) galleryItem.imageUrl = imageUrl;
    if (cloudinaryPublicId !== undefined) galleryItem.cloudinaryPublicId = cloudinaryPublicId;
    if (category) galleryItem.category = category;
    if (description !== undefined) galleryItem.description = description;
    if (status) galleryItem.status = status;

    const updated = await galleryItem.save();
    const populated = await Gallery.findById(updated._id).populate('uploadedBy', 'name role');
    res.json(populated);
  } else {
    res.status(404);
    throw new Error('Gallery image not found');
  }
});

/**
 * @desc    Delete gallery image
 * @route   DELETE /api/gallery/:id
 * @access  Private (Admin / Director)
 */
const deleteGalleryImage = catchAsync(async (req, res) => {
  const galleryItem = await Gallery.findById(req.params.id);

  if (galleryItem) {
    if (galleryItem.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(galleryItem.cloudinaryPublicId);
      } catch (err) {
        console.error('Failed to delete image from Cloudinary:', err);
      }
    }
    await galleryItem.deleteOne();
    res.json({ message: 'Gallery image deleted successfully' });
  } else {
    res.status(404);
    throw new Error('Gallery image not found');
  }
});

module.exports = {
  getGallery,
  getPublicGallery,
  getGalleryById,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
};
