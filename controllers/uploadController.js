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

    // Determine correct Cloudinary resource_type based on MIME
    const isImage = req.file.mimetype.startsWith('image/');
    const resourceType = isImage ? 'image' : 'raw';

    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: folderName, resource_type: resourceType },
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

    // Standardized response contract
    res.status(200).json({
      success: true,
      file: {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
        size: req.file.size
      },
      // Retained for backwards compatibility:
      profileImageUrl: result.secure_url,
      fileUrl: result.secure_url
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { publicId, resourceType } = req.body;
    if (!publicId) {
      return res.status(400).json({ message: 'publicId is required for deletion.' });
    }

    const resType = resourceType === 'raw' ? 'raw' : 'image';
    
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resType });
    
    if (result.result === 'ok' || result.result === 'not found') {
      res.status(200).json({ success: true, message: 'File deleted from cloud storage.' });
    } else {
      res.status(500).json({ message: 'Cloudinary failed to delete the file.', details: result });
    }
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    res.status(500).json({ message: 'Error deleting file from cloud storage.' });
  }
};
