const Ticket = require('../models/Ticket');

exports.createTicket = async (req, res) => {
  try {
    const { subject, message, category } = req.body;
    const ticket = new Ticket({
      subject,
      message,
      category,
      createdBy: req.user.id
    });
    await ticket.save();
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Error creating ticket', error: err.message });
  }
};

exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ createdBy: req.user.id }).sort('-createdAt');
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tickets', error: err.message });
  }
};

exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().populate('createdBy', 'username role').sort('-createdAt');
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tickets', error: err.message });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    const { status, reply } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status, reply }, { new: true });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Error updating ticket', error: err.message });
  }
};
