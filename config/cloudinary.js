const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

// Ensure env variables are loaded before configuration
dotenv.config();

/**
 * Configure Cloudinary with our account credentials from .env
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
