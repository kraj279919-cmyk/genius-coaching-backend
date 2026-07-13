const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');

const getMyNotifications = catchAsync(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id }).sort('-createdAt').limit(50);
  res.json(notifications);
});

const markAsRead = catchAsync(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
  res.json({ message: 'All notifications marked as read' });
});

module.exports = { getMyNotifications, markAsRead };
