const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Reset user password (Admin only)
 * @route   PATCH /api/users/:id/reset-password
 * @access  Private (Admin)
 */
const resetPassword = catchAsync(async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Set new password (the model's pre-save middleware will hash it)
  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password reset successfully' });
});

module.exports = {
  resetPassword,
};
