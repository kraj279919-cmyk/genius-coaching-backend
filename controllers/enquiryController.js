const Enquiry = require('../models/Enquiry');
const catchAsync = require('../utils/catchAsync');

const getEnquiries = catchAsync(async (req, res) => {
  const enquiries = await Enquiry.find().sort('-createdAt');
  res.json(enquiries);
});

const createEnquiry = catchAsync(async (req, res) => {
  const enquiry = await Enquiry.create(req.body);
  res.status(201).json(enquiry);
});

const updateEnquiryStatus = catchAsync(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id);
  if (enquiry) {
    enquiry.status = req.body.status || enquiry.status;
    const updated = await enquiry.save();
    res.json(updated);
  } else {
    res.status(404);
    throw new Error('Enquiry not found');
  }
});

const deleteEnquiry = catchAsync(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id);
  if (enquiry) {
    await enquiry.deleteOne();
    res.json({ message: 'Enquiry removed' });
  } else {
    res.status(404);
    throw new Error('Enquiry not found');
  }
});

module.exports = { getEnquiries, createEnquiry, updateEnquiryStatus, deleteEnquiry };
