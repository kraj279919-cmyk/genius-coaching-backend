const AuditLog = require('../models/AuditLog');

/**
 * Log an action into the centralized AuditLog table
 * @param {object} req - Express request object (to extract user, ip)
 * @param {string} action - Action description (e.g., "STUDENT_CREATED", "FEE_UPDATED")
 * @param {string} details - Detailed string about what changed
 * @param {string} targetResource - Resource type being modified (e.g., "Student", "Notice")
 * @param {string} targetId - ID of the resource being modified
 */
const logAction = async (req, action, details = '', targetResource = '', targetId = null) => {
  try {
    if (!req || !req.user) return; // Cannot log anonymous actions safely

    await AuditLog.create({
      user: req.user._id,
      role: req.user.role,
      action,
      details,
      ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
      targetResource,
      targetId
    });
  } catch (error) {
    console.error('Audit Log failed:', error.message);
  }
};

module.exports = logAction;
