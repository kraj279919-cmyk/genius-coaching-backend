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
  // If status is 200 but we have an error, default to 500 (Internal Server Error)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode);
  
  const isProduction = process.env.NODE_ENV === 'production';
  // If it's a 500 error in production, hide the internal error message
  const safeMessage = (isProduction && statusCode === 500) 
    ? 'Internal Server Error' 
    : err.message;

  res.json({
    message: safeMessage,
    // Only show the stack trace if we are in development mode
    stack: isProduction ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };
