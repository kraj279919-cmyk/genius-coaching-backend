const cloudinary = require('../config/cloudinary');
const fs = require('fs');

/**
 * Uploads a local file to Cloudinary
 * 
 * @param {String} localFilePath - The local path of the file to upload
 * @param {String} folderName - The destination folder inside Cloudinary
 * @returns {Object} - The Cloudinary upload response containing the secure_url
 */
const uploadFile = async (localFilePath, folderName = 'genius_general') => {
  try {
    if (!localFilePath) return null;

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: folderName,
      resource_type: 'auto', // Automatically detect if it's image or pdf
    });

    // File has been uploaded successfully, now delete the local copy
    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    // Remove the locally saved temporary file as the upload operation failed
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.error('Cloudinary Upload Error:', error);
    return null;
  }
};

/**
 * Deletes a file from Cloudinary using its public ID
 * 
 * @param {String} publicId - The unique public ID of the image on Cloudinary
 * @returns {Boolean} - True if deleted successfully
 */
const deleteFile = async (publicId) => {
  try {
    if (!publicId) return false;
    
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    return false;
  }
};

module.exports = { uploadFile, deleteFile };
