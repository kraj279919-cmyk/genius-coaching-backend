const multer = require('multer');
const path = require('path');

// Configure local storage for Multer
// Files will be temporarily stored in the 'uploads' folder before uploading to Cloudinary
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    // Generate a unique filename using Date to prevent overwriting
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File filter to allow only images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|pdf/;
  // Check extension
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (jpeg, jpg, png) and PDF files are allowed!'), false);
  }
};

// Initialize multer with the config
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB file size limit
  }
});

module.exports = upload;
