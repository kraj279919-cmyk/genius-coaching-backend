const StudyMaterial = require('../models/StudyMaterial');
const Student = require('../models/Student');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Upload new study material
 * @route   POST /api/materials
 * @access  Private (Admin / Teacher)
 */
const createMaterial = catchAsync(async (req, res) => {
  const { title, description, class: targetClass, subject, type, fileUrl, cloudinaryPublicId, status } = req.body;

  if (!title) { res.status(400); throw new Error('Title required'); }
  if (!targetClass) { res.status(400); throw new Error('Class required'); }
  if (!subject) { res.status(400); throw new Error('Subject required'); }
  if (!fileUrl) { res.status(400); throw new Error('File URL required'); }
  if (!fileUrl.startsWith('http')) { res.status(400); throw new Error('Invalid URL'); }

  const material = await StudyMaterial.create({
    title,
    description: description || '',
    subject,
    class: targetClass,
    type: type || 'note',
    fileUrl,
    cloudinaryPublicId,
    status: status || 'active',
    uploadedBy: req.user._id,
  });

  const populated = await StudyMaterial.findById(material._id).populate('uploadedBy', 'name role');
  res.status(201).json(populated);
});

/**
 * @desc    Get all materials
 * @route   GET /api/materials
 * @access  Private
 */
const getMaterials = catchAsync(async (req, res) => {
  const filter = {};
  
  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) { res.status(404); throw new Error('Student profile not found'); }
    filter.class = student.class;
    filter.status = 'active'; // Students see only active materials
  } else {
    if (req.query.class) filter.class = req.query.class;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
  }

  const materials = await StudyMaterial.find(filter)
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'name role');

  res.json(materials);
});

/**
 * @desc    Get materials by class
 * @route   GET /api/materials/class/:className
 * @access  Private
 */
const getMaterialsByClass = catchAsync(async (req, res) => {
  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student || student.class !== req.params.className) {
      res.status(403);
      throw new Error('Unauthorized access to this class materials');
    }
  }

  const materials = await StudyMaterial.find({ class: req.params.className })
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'name role');

  res.json(materials);
});

/**
 * @desc    Get specific material by ID
 * @route   GET /api/materials/:id
 * @access  Private
 */
const getMaterialById = catchAsync(async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id)
    .populate('uploadedBy', 'name role');

  if (material) {
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student || material.class !== student.class) {
        res.status(403);
        throw new Error('Unauthorized access');
      }
    }
    res.json(material);
  } else {
    res.status(404);
    throw new Error('Material not found');
  }
});

/**
 * @desc    Update material
 * @route   PATCH /api/materials/:id
 * @access  Private (Admin / Teacher)
 */
const updateMaterial = catchAsync(async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id);

  if (material) {
    const { title, description, class: targetClass, subject, type, fileUrl, cloudinaryPublicId, status } = req.body;
    
    if (title) material.title = title;
    if (description !== undefined) material.description = description;
    if (subject) material.subject = subject;
    if (targetClass) material.class = targetClass;
    if (type) material.type = type;
    if (fileUrl) {
      if (!fileUrl.startsWith('http')) { res.status(400); throw new Error('Invalid URL'); }
      material.fileUrl = fileUrl;
    }
    if (cloudinaryPublicId !== undefined) material.cloudinaryPublicId = cloudinaryPublicId;
    if (status) material.status = status;

    const updatedMaterial = await material.save();
    const populated = await StudyMaterial.findById(updatedMaterial._id).populate('uploadedBy', 'name role');
    res.json(populated);
  } else {
    res.status(404);
    throw new Error('Material not found');
  }
});

/**
 * @desc    Delete material
 * @route   DELETE /api/materials/:id
 * @access  Private (Admin / Teacher)
 */
const deleteMaterial = catchAsync(async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id);

  if (material) {
    await material.deleteOne();
    res.json({ message: 'Material deleted successfully' });
  } else {
    res.status(404);
    throw new Error('Material not found');
  }
});

module.exports = {
  createMaterial,
  getMaterials,
  getMaterialsByClass,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
};
