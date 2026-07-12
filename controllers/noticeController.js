const Notice = require('../models/Notice');
const catchAsync = require('../utils/catchAsync');
const { normalizeClassName, getAliasesForClass } = require('../utils/classNormalizer');
const {
  validateRequiredFields,
  validateDate
} = require('../utils/validators');

/**
 * @desc    Create a new notice
 * @route   POST /api/notices
 * @access  Private (Admin / Co-Director / Teacher)
 */
const createNotice = catchAsync(async (req, res) => {
  const { title, description, image, category, targetAudience, targetClass, priority, status, expiryDate } = req.body;

  const requiredError = validateRequiredFields(['title', 'description'], req.body);
  if (requiredError) { res.status(400); throw new Error(requiredError); }

  const validCategories = ['general', 'exam', 'event', 'holiday'];
  if (category && !validCategories.includes(category)) { res.status(400); throw new Error('Invalid category.'); }

  const validAudiences = ['all', 'teachers', 'students', 'class'];
  if (targetAudience && !validAudiences.includes(targetAudience)) { res.status(400); throw new Error('Invalid target audience.'); }

  if ((targetAudience === 'class' || req.user.role === 'teacher') && !targetClass) {
    res.status(400); throw new Error('Target class is required when audience is class.');
  }

  if (expiryDate && !validateDate(expiryDate)) { res.status(400); throw new Error('Invalid expiry date format.'); }
  if (status && !['draft', 'published', 'expired'].includes(status)) { res.status(400); throw new Error('Invalid status.'); }
  if (priority && !['low', 'normal', 'high', 'urgent'].includes(priority)) { res.status(400); throw new Error('Invalid priority.'); }

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
    targetClass: targetAudience === 'class' ? normalizeClassName(targetClass) : undefined,
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
    const student = await require('../models/Student').findOne({ userId: req.user._id });
    const sClass = student ? normalizeClassName(student.class) : 'UNKNOWN';
    
    query = {
      status: 'published',
      $or: [{ expiryDate: { $gt: currentDate } }, { expiryDate: null }],
      $or: [
        { targetAudience: { $in: ['all', 'students'] } },
        { targetAudience: 'class', targetClass: { $in: getAliasesForClass(sClass) } }
      ]
    };
  }

  const limit = parseInt(req.query.limit) || 1000;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const notices = await Notice.find(query)
    .lean()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
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

  const limit = parseInt(req.query.limit) || 1000;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const notices = await Notice.find(query)
    .lean()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
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

    if (req.body.title !== undefined && req.body.title.trim() === '') { res.status(400); throw new Error("Title is required."); }
    if (req.body.description !== undefined && req.body.description.trim() === '') { res.status(400); throw new Error("Description is required."); }
    if (req.body.category !== undefined && !['general', 'exam', 'event', 'holiday'].includes(req.body.category)) { res.status(400); throw new Error('Invalid category.'); }
    if (req.body.targetAudience !== undefined && !['all', 'teachers', 'students', 'class'].includes(req.body.targetAudience)) { res.status(400); throw new Error('Invalid target audience.'); }
    if (req.body.expiryDate !== undefined && req.body.expiryDate !== null && !validateDate(req.body.expiryDate)) { res.status(400); throw new Error('Invalid expiry date format.'); }
    if (req.body.status !== undefined && !['draft', 'published', 'expired'].includes(req.body.status)) { res.status(400); throw new Error('Invalid status.'); }
    if (req.body.priority !== undefined && !['low', 'normal', 'high', 'urgent'].includes(req.body.priority)) { res.status(400); throw new Error('Invalid priority.'); }

    notice.title = req.body.title !== undefined ? req.body.title : notice.title;
    notice.description = req.body.description !== undefined ? req.body.description : notice.description;
    notice.category = req.body.category !== undefined ? req.body.category : notice.category;
    notice.targetAudience = req.body.targetAudience !== undefined ? req.body.targetAudience : notice.targetAudience;
    notice.targetClass = notice.targetAudience === 'class' ? (req.body.targetClass !== undefined ? normalizeClassName(req.body.targetClass) : notice.targetClass) : undefined;
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
