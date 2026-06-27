const catchAsync = require('../utils/catchAsync');

const generateResponse = catchAsync(async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    res.status(400);
    throw new Error('Prompt is required');
  }
  
  // Interface only - Gemini implementation goes here in future
  res.json({
    success: true,
    result: `AI Response placeholder for: "${prompt}"`
  });
});

module.exports = { generateResponse };
