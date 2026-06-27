const StudyMaterial = require('../models/StudyMaterial');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Upload new study material
 * @route   POST /api/materials
 * @access  Private (Admin / Teacher)
 */
const createMaterial = catchAsync(async (req, res) => {
  const { title, description, fileUrl, class: targetClass } = req.body;

  const material = await StudyMaterial.create({
    title,
    description,
    fileUrl, // URL from Cloudinary upload
    class: targetClass,
    uploadedBy: req.user._id,
  });

  res.status(201).json(material);
});

/**
 * @desc    Get all study materials (optionally filtered by class)
 * @route   GET /api/materials
 * @access  Private
 */
const getMaterials = catchAsync(async (req, res) => {
  // If the user is a student, they might only want to see materials for their class
  // For now, we allow filtering by query param like ?class=10th
  const filter = {};
  if (req.query.class) {
    filter.class = req.query.class;
  }

  const materials = await StudyMaterial.find(filter)
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'name role');
    
  res.json(materials);
});

/**
 * @desc    Get study material by ID
 * @route   GET /api/materials/:id
 * @access  Private
 */
const getMaterialById = catchAsync(async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id).populate('uploadedBy', 'name role');

  if (material) {
    res.json(material);
  } else {
    res.status(404);
    throw new Error('Study material not found');
  }
});

/**
 * @desc    Update study material details
 * @route   PUT /api/materials/:id
 * @access  Private (Admin or uploader)
 */
const updateMaterial = catchAsync(async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id);

  if (material) {
    if (material.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('You are not authorized to update this material');
    }

    material.title = req.body.title || material.title;
    material.description = req.body.description || material.description;
    material.class = req.body.class || material.class;
    
    if (req.body.fileUrl) {
      material.fileUrl = req.body.fileUrl;
    }

    const updatedMaterial = await material.save();
    res.json(updatedMaterial);
  } else {
    res.status(404);
    throw new Error('Study material not found');
  }
});

/**
 * @desc    Delete study material
 * @route   DELETE /api/materials/:id
 * @access  Private (Admin or uploader)
 */
const deleteMaterial = catchAsync(async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id);

  if (material) {
    if (material.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('You are not authorized to delete this material');
    }

    await material.deleteOne();
    res.json({ message: 'Study material removed successfully' });
  } else {
    res.status(404);
    throw new Error('Study material not found');
  }
});

module.exports = {
  createMaterial,
  getMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
};
