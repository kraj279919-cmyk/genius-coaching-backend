const express = require('express');
const router = express.Router();
const {
  createMaterial,
  getMaterials,
  getMaterialsByClass,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
} = require('../controllers/materialController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/class/:className')
  .get(getMaterialsByClass);

router.route('/')
  .get(getMaterials)
  .post(authorize('admin', 'director', 'teacher'), createMaterial);

router.route('/:id')
  .get(getMaterialById)
  .put(authorize('admin', 'director', 'teacher'), updateMaterial)
  .patch(authorize('admin', 'director', 'teacher'), updateMaterial)
  .delete(authorize('admin', 'director', 'teacher'), deleteMaterial);

module.exports = router;
