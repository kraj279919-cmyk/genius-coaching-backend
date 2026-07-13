const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  message: { type: String, required: true },
  category: { type: String, enum: ['Technical', 'Academic', 'Billing', 'General'], default: 'General' },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' },
  reply: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
