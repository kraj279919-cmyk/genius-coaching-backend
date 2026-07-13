const express = require('express');
const router = express.Router();
const {
  saveTimetable,
  getTimetable
} = require('../controllers/timetableController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .post(authorize('admin', 'director'), saveTimetable);

router.route('/:class')
  .get(getTimetable);

router.route('/:class/:section')
  .get(getTimetable);

module.exports = router;
