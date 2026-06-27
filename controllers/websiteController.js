const WebsiteContent = require('../models/WebsiteContent');
const catchAsync = require('../utils/catchAsync');

const getWebsiteContent = catchAsync(async (req, res) => {
  let content = await WebsiteContent.findOne({ isActive: true });
  if (!content) {
    content = { bannerText: 'Welcome to Genius Coaching', contactPhone: '+91 0000000000' };
  }
  res.json(content);
});

const updateWebsiteContent = catchAsync(async (req, res) => {
  let content = await WebsiteContent.findOne({ isActive: true });
  if (content) {
    Object.assign(content, req.body);
    const updated = await content.save();
    res.json(updated);
  } else {
    const newContent = await WebsiteContent.create({ ...req.body, isActive: true });
    res.status(201).json(newContent);
  }
});

module.exports = { getWebsiteContent, updateWebsiteContent };
