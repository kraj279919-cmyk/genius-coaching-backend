const WebsiteContent = require('../models/WebsiteContent');
const catchAsync = require('../utils/catchAsync');
const {
  isValidPhone,
  isValidEmailOptional,
  sanitizeText
} = require('../utils/validators');

/**
 * @desc    Get website content (Admin)
 * @route   GET /api/website
 * @access  Private (Admin / Director)
 */
const getWebsiteContent = catchAsync(async (req, res) => {
  let content = await WebsiteContent.findOne().sort({ createdAt: -1 });
  if (!content) {
    content = await WebsiteContent.create({
      instituteName: 'Genius Coaching',
      heroTitle: 'Welcome to Genius Coaching'
    });
  }
  res.json(content);
});

/**
 * @desc    Get public website content
 * @route   GET /api/website/public
 * @access  Public
 */
const getPublicWebsiteContent = catchAsync(async (req, res) => {
  let content = await WebsiteContent.findOne({ status: 'active', isActive: true }).sort({ createdAt: -1 })
    .select('-updatedBy -isActive -status -createdAt -updatedAt'); // Strip sensitive/admin fields
    
  if (!content) {
    // Fallback if no active content found
    content = await WebsiteContent.findOne().sort({ createdAt: -1 }).select('-updatedBy');
    if (!content) content = { instituteName: 'Genius Coaching', heroTitle: 'Welcome' };
  }
  res.json(content);
});

/**
 * @desc    Update entire website content
 * @route   PUT /api/website
 * @access  Private (Admin / Director)
 */
const updateWebsiteContent = catchAsync(async (req, res) => {
  let content = await WebsiteContent.findOne().sort({ createdAt: -1 });

  if (req.body.contactPhone !== undefined && req.body.contactPhone !== '' && !isValidPhone(req.body.contactPhone)) {
    res.status(400); throw new Error('Invalid contact phone number.');
  }
  if (req.body.contactEmail !== undefined && !isValidEmailOptional(req.body.contactEmail)) {
    res.status(400); throw new Error('Invalid contact email format.');
  }
  if (req.body.logoUrl !== undefined && req.body.logoUrl !== '' && !req.body.logoUrl.startsWith('http')) {
    res.status(400); throw new Error('Invalid logo URL.');
  }
  if (req.body.bannerUrl !== undefined && req.body.bannerUrl !== '' && !req.body.bannerUrl.startsWith('http')) {
    res.status(400); throw new Error('Invalid banner URL.');
  }
  if (req.body.directorPhotoUrl !== undefined && req.body.directorPhotoUrl !== '' && !req.body.directorPhotoUrl.startsWith('http')) {
    res.status(400); throw new Error('Invalid director photo URL.');
  }

  // Sanitize huge texts
  if (req.body.aboutText) req.body.aboutText = sanitizeText(req.body.aboutText, 5000);
  if (req.body.directorMessage) req.body.directorMessage = sanitizeText(req.body.directorMessage, 5000);
  
  if (content) {
    Object.assign(content, req.body);
    content.updatedBy = req.user._id;
    const updated = await content.save();
    res.json(updated);
  } else {
    const newContent = await WebsiteContent.create({ 
      ...req.body, 
      updatedBy: req.user._id 
    });
    res.status(201).json(newContent);
  }
});

/**
 * @desc    Update specific website section (partial update)
 * @route   PATCH /api/website/section/:section
 * @access  Private (Admin / Director)
 */
const updateWebsiteSection = catchAsync(async (req, res) => {
  let content = await WebsiteContent.findOne().sort({ createdAt: -1 });
  if (!content) {
    res.status(404);
    throw new Error('Website content not found to patch');
  }

  // The request body should contain the fields for that section
  if (req.body.contactPhone !== undefined && req.body.contactPhone !== '' && !isValidPhone(req.body.contactPhone)) {
    res.status(400); throw new Error('Invalid contact phone number.');
  }
  if (req.body.contactEmail !== undefined && !isValidEmailOptional(req.body.contactEmail)) {
    res.status(400); throw new Error('Invalid contact email format.');
  }
  if (req.body.logoUrl !== undefined && req.body.logoUrl !== '' && !req.body.logoUrl.startsWith('http')) {
    res.status(400); throw new Error('Invalid logo URL.');
  }
  if (req.body.bannerUrl !== undefined && req.body.bannerUrl !== '' && !req.body.bannerUrl.startsWith('http')) {
    res.status(400); throw new Error('Invalid banner URL.');
  }
  if (req.body.directorPhotoUrl !== undefined && req.body.directorPhotoUrl !== '' && !req.body.directorPhotoUrl.startsWith('http')) {
    res.status(400); throw new Error('Invalid director photo URL.');
  }
  if (req.body.aboutText) req.body.aboutText = sanitizeText(req.body.aboutText, 5000);
  if (req.body.directorMessage) req.body.directorMessage = sanitizeText(req.body.directorMessage, 5000);

  Object.assign(content, req.body);
  content.updatedBy = req.user._id;
  const updated = await content.save();
  res.json(updated);
});

module.exports = { 
  getWebsiteContent, 
  getPublicWebsiteContent, 
  updateWebsiteContent,
  updateWebsiteSection
};
