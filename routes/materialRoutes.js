const express = require('express');
const router = express.Router();
const {
  createMaterial,
  getMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
} = require('../controllers/materialController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getMaterials)
  .post(authorize('admin', 'teacher'), createMaterial);

router.route('/:id')
  .get(getMaterialById)
  .put(authorize('admin', 'teacher'), updateMaterial)
  .delete(authorize('admin', 'teacher'), deleteMaterial);

module.exports = router;
