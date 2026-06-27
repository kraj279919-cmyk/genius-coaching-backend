const express = require('express');
const router = express.Router();
const {
  createResult,
  getResults,
  getResultById,
  updateResult,
  deleteResult,
} = require('../controllers/resultController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getResults)
  .post(authorize('admin', 'teacher'), createResult);

router.route('/:id')
  .get(getResultById)
  .put(authorize('admin', 'teacher'), updateResult)
  .delete(authorize('admin', 'teacher'), deleteResult);

module.exports = router;
