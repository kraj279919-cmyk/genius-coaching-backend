const Doubt = require('../models/Doubt');
const catchAsync = require('../utils/catchAsync');

const getDoubts = catchAsync(async (req, res) => {
  // Can filter by studentId or teacherId based on user role/query
  const doubts = await Doubt.find(req.query).sort('-createdAt');
  res.json(doubts);
});

const createDoubt = catchAsync(async (req, res) => {
  const doubt = await Doubt.create(req.body);
  res.status(201).json(doubt);
});

const replyToDoubt = catchAsync(async (req, res) => {
  const doubt = await Doubt.findById(req.params.id);
  if (doubt) {
    doubt.answer = req.body.answer;
    doubt.teacherId = req.user._id;
    doubt.status = 'Answered';
    const updated = await doubt.save();
    res.json(updated);
  } else {
    res.status(404);
    throw new Error('Doubt not found');
  }
});

const deleteDoubt = catchAsync(async (req, res) => {
  const doubt = await Doubt.findById(req.params.id);
  if (doubt) {
    await doubt.deleteOne();
    res.json({ message: 'Doubt removed' });
  } else {
    res.status(404);
    throw new Error('Doubt not found');
  }
});

module.exports = { getDoubts, createDoubt, replyToDoubt, deleteDoubt };
