const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { uploadImage, deleteFile } = require('../controllers/uploadController');

// Multer memory storage
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/jpg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Images, PDFs, DOCs, and PPTs are allowed.'), false);
  }
};
const upload = multer({ 
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB Max globally
  fileFilter
});

// Single file upload route
router.post('/', protect, upload.single('file'), uploadImage);

// Delete file route
router.delete('/', protect, deleteFile);

module.exports = router;
