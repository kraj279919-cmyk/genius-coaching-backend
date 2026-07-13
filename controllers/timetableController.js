const Timetable = require('../models/Timetable');
const catchAsync = require('../utils/catchAsync');
const { normalizeClassName, getAliasesForClass } = require('../utils/classNormalizer');

/**
 * @desc    Create or update timetable for a class & day
 * @route   POST /api/timetable
 * @access  Private (Admin)
 */
const saveTimetable = catchAsync(async (req, res) => {
  const { class: className, section, dayOfWeek, periods } = req.body;

  if (!className || !dayOfWeek || !periods) {
    res.status(400); throw new Error('Class, dayOfWeek, and periods are required');
  }

  const cleanClass = normalizeClassName(className);

  let timetable = await Timetable.findOne({ class: cleanClass, section: section || 'A', dayOfWeek });

  if (timetable) {
    timetable.periods = periods;
    await timetable.save();
  } else {
    timetable = await Timetable.create({
      class: cleanClass,
      section: section || 'A',
      dayOfWeek,
      periods,
      createdBy: req.user._id
    });
  }

  res.status(200).json(timetable);
});

/**
 * @desc    Get timetable by class
 * @route   GET /api/timetable/:class/:section?
 * @access  Private
 */
const getTimetable = catchAsync(async (req, res) => {
  const aliases = getAliasesForClass(req.params.class);
  const section = req.params.section || 'A';

  const timetables = await Timetable.find({
    class: { $in: aliases },
    section
  }).populate('periods.teacherId', 'name subject').sort({ dayOfWeek: 1 });

  res.json(timetables);
});

module.exports = {
  saveTimetable,
  getTimetable
};
