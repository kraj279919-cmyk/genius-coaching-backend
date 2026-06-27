const express = require('express');
const router = express.Router();
const { getDoubts, createDoubt, replyToDoubt, deleteDoubt } = require('../controllers/doubtController');
const { protect } = require('../middleware/authMiddleware');
const { teacherOnly, studentOnly } = require('../middleware/roleMiddleware');

router.use(protect);
router.route('/')
  .get(getDoubts)
  .post(studentOnly, createDoubt);

router.post('/reply/:id', teacherOnly, replyToDoubt);
router.delete('/:id', teacherOnly, deleteDoubt); // Teachers/Admins can delete

module.exports = router;
