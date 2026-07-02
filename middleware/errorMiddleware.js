/**
 * Handles routes that do not exist (404 errors)
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  // Pass the error to the global errorHandler
  next(error);
};

/**
 * Global error handler
 * Formats all errors into a clean JSON response instead of crashing the server or sending HTML
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // 1. Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    message = 'Resource not found or invalid ID format';
    statusCode = 404;
  }

  // 2. Mongoose Duplicate Key Error
  if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
    // Attempt to extract the field name if possible, otherwise generic message
    let field = 'a unique field';
    if (err.keyValue) {
      field = Object.keys(err.keyValue)[0];
    } else if (err.message) {
      const match = err.message.match(/index:\s+([a-z_]+)\s+dup/i);
      if (match && match[1]) field = match[1].replace('_1', '');
    }
    message = `Duplicate value entered for ${field}. Please choose another value.`;
    statusCode = 400;
  }

  // 3. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    message = `Validation failed: ${messages.join(', ')}`;
    statusCode = 400;
  }

  // Phase 13.8 - Log error to database
  try {
    const ErrorLog = require('../models/ErrorLog');
    // Ensure we don't block the response if db fails
    ErrorLog.create({
      route: req.originalUrl,
      statusCode,
      message,
      stack: err.stack,
      userId: req.user ? req.user._id : null,
      userRole: req.user ? req.user.role : null
    }).catch(console.error);
  } catch (e) {
    // Ignore require error if not loaded
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only show the stack trace if we are in development mode
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };
