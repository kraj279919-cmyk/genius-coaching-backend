/**
 * Wrapper function to handle errors in async route controllers.
 * This saves us from writing try-catch blocks in every single controller.
 * Any error thrown will be caught and passed to the error handling middleware.
 * 
 * @param {Function} fn - The async controller function
 * @returns {Function} - Express middleware function
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    // Run the function and catch any errors, passing them to Next()
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = catchAsync;
