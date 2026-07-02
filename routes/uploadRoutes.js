const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { uploadImage } = require('../controllers/uploadController');

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Single image upload route
router.post('/', protect, upload.single('image'), uploadImage);

module.exports = router;
