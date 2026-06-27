const Announcement = require('../models/Announcement');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Create a new announcement
 * @route   POST /api/announcements
 * @access  Private (Admin / Co-Director)
 */
const createAnnouncement = catchAsync(async (req, res) => {
  const { title, content, isActive, priority } = req.body;

  const announcement = await Announcement.create({
    title,
    content,
    isActive,
    priority: priority || 'Normal',
    createdBy: req.user._id,
  });

  res.status(201).json(announcement);
});

/**
 * @desc    Get all active announcements
 * @route   GET /api/announcements
 * @access  Public
 */
const getAnnouncements = catchAsync(async (req, res) => {
  const filter = {};
  
  // If not logged in or not admin, only show active announcements
  // For simplicity, we make this public endpoint only return active ones
  // We can add a separate protected route for admins to see all
  if (!req.user || req.user.role === 'student') {
      filter.isActive = true;
  }

  const announcements = await Announcement.find(filter)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name');

  res.json(announcements);
});

/**
 * @desc    Get announcement by ID
 * @route   GET /api/announcements/:id
 * @access  Public
 */
const getAnnouncementById = catchAsync(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id)
    .populate('createdBy', 'name');

  if (announcement) {
    res.json(announcement);
  } else {
    res.status(404);
    throw new Error('Announcement not found');
  }
});

/**
 * @desc    Update an announcement
 * @route   PUT /api/announcements/:id
 * @access  Private (Admin / Co-Director)
 */
const updateAnnouncement = catchAsync(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (announcement) {
    announcement.title = req.body.title || announcement.title;
    announcement.content = req.body.content || announcement.content;
    
    if (req.body.isActive !== undefined) {
      announcement.isActive = req.body.isActive;
    }
    
    if (req.body.priority) {
        announcement.priority = req.body.priority;
    }

    const updatedAnnouncement = await announcement.save();
    res.json(updatedAnnouncement);
  } else {
    res.status(404);
    throw new Error('Announcement not found');
  }
});

/**
 * @desc    Delete an announcement
 * @route   DELETE /api/announcements/:id
 * @access  Private (Admin / Co-Director)
 */
const deleteAnnouncement = catchAsync(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (announcement) {
    await announcement.deleteOne();
    res.json({ message: 'Announcement deleted successfully' });
  } else {
    res.status(404);
    throw new Error('Announcement not found');
  }
});

module.exports = {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
};
