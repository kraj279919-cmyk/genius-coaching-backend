const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Delete an image from Cloudinary using its public_id
 * @param {string} publicId - The Cloudinary public_id of the asset
 */
const deleteImage = async (publicId) => {
  if (!publicId) return false;
  
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`Cloudinary delete result for ${publicId}:`, result);
    return result.result === 'ok';
  } catch (error) {
    console.error(`Error deleting image from Cloudinary (${publicId}):`, error.message);
    return false;
  }
};

module.exports = {
  deleteImage,
};
