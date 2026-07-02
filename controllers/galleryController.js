const Gallery = require('../models/Gallery');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Get all gallery images (Admin view)
 * @route   GET /api/gallery
 * @access  Private (Admin / Director)
 */
const getGallery = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.status) filter.status = req.query.status;

  const gallery = await Gallery.find(filter)
    .sort({ createdAt: -1 })
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

  const gallery = await Gallery.find(filter)
    .sort({ createdAt: -1 })
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

  if (!title) { res.status(400); throw new Error('Title required'); }
  if (!imageUrl) { res.status(400); throw new Error('Image URL required'); }
  if (!imageUrl.startsWith('http')) { res.status(400); throw new Error('Invalid Image URL'); }

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
    
    if (title) galleryItem.title = title;
    if (imageUrl) {
      if (!imageUrl.startsWith('http')) { res.status(400); throw new Error('Invalid Image URL'); }
      galleryItem.imageUrl = imageUrl;
    }
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
