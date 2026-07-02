const logAction = require('./auditLogger');

/**
 * Centralized Notification Architecture (Phase 9)
 * Single pipeline to distribute notices to DB, Push Notifications, SMS, Email, etc.
 * @param {object} req - Express request object
 * @param {string} type - Notification Type (e.g., 'NOTICE', 'FEE_REMINDER', 'RESULT_PUBLISHED')
 * @param {string} title - Notification title
 * @param {string} message - Notification body/message
 * @param {array} targetAudience - Array of targets (e.g., ['all'], ['teachers'], ['students', 'class:10'])
 */
const sendNotification = async (req, type, title, message, targetAudience = []) => {
  try {
    // 1. Log to Audit
    await logAction(req, `NOTIFICATION_${type}`, `Title: ${title} | Target: ${targetAudience.join(',')}`, 'Notification');
    
    // 2. Future Expandability: Push Notifications via Expo Push Service
    // if (targetAudience.includes('students')) { await expoPush.send(...) }

    // 3. Future Expandability: WhatsApp/SMS Service
    // if (type === 'FEE_REMINDER') { await twilioService.send(...) }

    console.log(`[Notification Pipeline] Type: ${type}, Title: ${title}, Target: ${targetAudience}`);
    return true;
  } catch (err) {
    console.error('Notification pipeline failed:', err.message);
    return false;
  }
};

module.exports = { sendNotification };
