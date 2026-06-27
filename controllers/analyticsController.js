const catchAsync = require('../utils/catchAsync');
const Student = require('../models/Student');

const getAnalytics = catchAsync(async (req, res) => {
  // Placeholder analytics generation
  const totalStudents = await Student.countDocuments();
  res.json({
    monthlyRevenue: [50000, 52000, 51000, 60000],
    studentGrowth: [totalStudents - 10, totalStudents - 5, totalStudents],
    topSubjects: ['Physics', 'Mathematics']
  });
});

module.exports = { getAnalytics };
