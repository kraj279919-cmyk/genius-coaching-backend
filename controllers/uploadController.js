const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const type = req.query.type || req.body.type || 'other';
    let folderName = 'genius-coaching-misc';
    if (type === 'profile') folderName = 'genius-coaching-dps';
    if (type === 'gallery') folderName = 'genius-coaching-gallery';
    if (type === 'material') folderName = 'genius-coaching-materials';
    if (type === 'homework') folderName = 'genius-coaching-homework';
    if (type === 'cms') folderName = 'genius-coaching-cms';

    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: folderName, resource_type: 'auto' },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req);

    // Provide both profileImageUrl (for backward compatibility) and fileUrl
    res.status(200).json({
      success: true,
      profileImageUrl: result.secure_url,
      fileUrl: result.secure_url
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
};
