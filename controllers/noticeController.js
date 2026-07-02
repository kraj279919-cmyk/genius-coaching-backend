const Notice = require('../models/Notice');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Create a new notice
 * @route   POST /api/notices
 * @access  Private (Admin / Co-Director / Teacher)
 */
const createNotice = catchAsync(async (req, res) => {
  const { title, description, image, category, targetAudience, targetClass, priority, status, expiryDate } = req.body;

  if (!title || !description) {
    res.status(400);
    throw new Error('Title and description are required');
  }

  // If user is a teacher, they can only create notices for their class
  if (req.user.role === 'teacher') {
    if (targetAudience !== 'class') {
      res.status(403);
      throw new Error('Teachers can only create notices targeted to a specific class');
    }
    // Assume teacher sets targetClass to their assigned class. (We're trusting the frontend here, or could check assignedClasses)
  } else if (req.user.role === 'student') {
    res.status(403);
    throw new Error('Students cannot create notices');
  }

  const notice = await Notice.create({
    title,
    description,
    image,
    category: category || 'general',
    targetAudience: targetAudience || 'all',
    targetClass: targetAudience === 'class' ? targetClass : undefined,
    priority: priority || 'normal',
    status: status || 'published',
    expiryDate,
    createdBy: req.user._id,
  });

  res.status(201).json(notice);
});

/**
 * @desc    Get all notices
 * @route   GET /api/notices
 * @access  Private (All logged in users can see notices)
 */
const getNotices = catchAsync(async (req, res) => {
  let query = {};
  const currentDate = new Date();

  if (req.user.role === 'admin' || req.user.role === 'director') {
    // Admin sees everything
  } else if (req.user.role === 'teacher') {
    // Teachers see published notices targeted to 'all', 'teachers', or 'class' (and maybe their own drafts)
    query = {
      $or: [
        { targetAudience: { $in: ['all', 'teachers', 'class'] }, status: 'published', $or: [{ expiryDate: { $gt: currentDate } }, { expiryDate: null }] },
        { createdBy: req.user._id }
      ]
    };
  } else if (req.user.role === 'student') {
    // Students see published active notices for 'all', 'students', or their specific class
    query = {
      status: 'published',
      $or: [{ expiryDate: { $gt: currentDate } }, { expiryDate: null }],
      targetAudience: { $in: ['all', 'students', 'class'] }
    };
  }

  const notices = await Notice.find(query)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name role');

  res.json(notices);
});

/**
 * @desc    Get public notices
 * @route   GET /api/notices/public
 * @access  Public
 */
const getPublicNotices = catchAsync(async (req, res) => {
  const currentDate = new Date();
  
  // Public only sees 'all' audience, published, and not expired
  const query = {
    status: 'published',
    targetAudience: 'all',
    $or: [{ expiryDate: { $gt: currentDate } }, { expiryDate: null }]
  };

  const notices = await Notice.find(query)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name');

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
    if (notice.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'director') {
      res.status(403);
      throw new Error('You are not authorized to update this notice');
    }

    notice.title = req.body.title !== undefined ? req.body.title : notice.title;
    notice.description = req.body.description !== undefined ? req.body.description : notice.description;
    notice.category = req.body.category !== undefined ? req.body.category : notice.category;
    notice.targetAudience = req.body.targetAudience !== undefined ? req.body.targetAudience : notice.targetAudience;
    notice.targetClass = req.body.targetAudience === 'class' ? (req.body.targetClass !== undefined ? req.body.targetClass : notice.targetClass) : undefined;
    notice.priority = req.body.priority !== undefined ? req.body.priority : notice.priority;
    notice.status = req.body.status !== undefined ? req.body.status : notice.status;
    notice.expiryDate = req.body.expiryDate !== undefined ? req.body.expiryDate : notice.expiryDate;
    
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
    if (notice.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'director') {
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
  getPublicNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
};
