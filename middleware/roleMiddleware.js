/**
 * Middleware to restrict access based on user roles.
 * Ensure this is used AFTER the 'protect' middleware so req.user exists.
 * 
 * @param {...String} roles - Allowed roles (e.g., 'admin', 'teacher')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if the user's role is included in the allowed roles
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403); // Forbidden
      throw new Error(`User role '${req.user ? req.user.role : 'unknown'}' is not authorized to access this route`);
    }
    next();
  };
};

// Convenience specific role middlewares
const adminOnly = authorize('admin');
const teacherOnly = authorize('teacher', 'admin'); // admin can also do teacher things usually
const studentOnly = authorize('student', 'admin');

module.exports = { authorize, adminOnly, teacherOnly, studentOnly };
