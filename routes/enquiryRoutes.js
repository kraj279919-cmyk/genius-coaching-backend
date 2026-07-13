const express = require('express');
const router = express.Router();
const { getEnquiries, createEnquiry, updateEnquiryStatus, deleteEnquiry, addFollowUp, convertToStudent } = require('../controllers/enquiryController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.post('/', createEnquiry); // Public route for website
router.get('/', protect, adminOnly, getEnquiries);
router.put('/:id', protect, adminOnly, updateEnquiryStatus);
router.delete('/:id', protect, adminOnly, deleteEnquiry);
router.post('/:id/followup', protect, adminOnly, addFollowUp);
router.post('/:id/convert', protect, adminOnly, convertToStudent);

module.exports = router;
