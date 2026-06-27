const Notice = require('../models/Notice');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Create a new notice
 * @route   POST /api/notices
 * @access  Private (Admin / Co-Director / Teacher)
 */
const createNotice = catchAsync(async (req, res) => {
  const { title, description, image } = req.body;

  const notice = await Notice.create({
    title,
    description,
    image, // This might come from Cloudinary after upload
    createdBy: req.user._id, // Set the creator to the logged-in user
  });

  res.status(201).json(notice);
});

/**
 * @desc    Get all notices
 * @route   GET /api/notices
 * @access  Private (All logged in users can see notices)
 */
const getNotices = catchAsync(async (req, res) => {
  // Sort by newest first and populate the creator's name
  const notices = await Notice.find({}).sort({ createdAt: -1 }).populate('createdBy', 'name role');
  res.json(notices);
});

/**
 * @desc    Get notice by ID
 * @route   GET /api/notices/:id
 * @access  Private
 */
const getNoticeById = catchAsync(async (req, res) => {
  const notice = await Notice.findById(req.params.id).populate('createdBy', 'name role');

  if (notice) {
    res.json(notice);
  } else {
    res.status(404);
    throw new Error('Notice not found');
  }
});

/**
 * @desc    Update a notice
 * @route   PUT /api/notices/:id
 * @access  Private (Admin or the user who created it)
 */
const updateNotice = catchAsync(async (req, res) => {
  const notice = await Notice.findById(req.params.id);

  if (notice) {
    // Check if the user is authorized to update this notice
    if (notice.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403); // Forbidden
      throw new Error('You are not authorized to update this notice');
    }

    notice.title = req.body.title || notice.title;
    notice.description = req.body.description || notice.description;
    
    if (req.body.image) {
      notice.image = req.body.image;
    }

    const updatedNotice = await notice.save();
    res.json(updatedNotice);
  } else {
    res.status(404);
    throw new Error('Notice not found');
  }
});

/**
 * @desc    Delete a notice
 * @route   DELETE /api/notices/:id
 * @access  Private (Admin or the user who created it)
 */
const deleteNotice = catchAsync(async (req, res) => {
  const notice = await Notice.findById(req.params.id);

  if (notice) {
    if (notice.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('You are not authorized to delete this notice');
    }

    await notice.deleteOne();
    res.json({ message: 'Notice removed successfully' });
  } else {
    res.status(404);
    throw new Error('Notice not found');
  }
});

module.exports = {
  createNotice,
  getNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
};
