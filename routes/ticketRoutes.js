const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .post(ticketController.createTicket);

router.get('/my', ticketController.getMyTickets);

// Admin routes
router.route('/all')
  .get(authorize('admin', 'director'), ticketController.getAllTickets);

router.route('/:id')
  .put(authorize('admin', 'director'), ticketController.updateTicket);

module.exports = router;
