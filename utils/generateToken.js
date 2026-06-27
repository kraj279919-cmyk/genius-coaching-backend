const jwt = require('jsonwebtoken');

/**
 * Generates a JSON Web Token (JWT) for a user.
 * 
 * @param {String} userId - The database ID of the user
 * @param {String} role - The role of the user (e.g., 'student', 'admin')
 * @returns {String} - The generated JWT string
 */
const generateToken = (userId, role) => {
  // Sign the token with user info and our secret key
  return jwt.sign(
    { id: userId, role: role }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
};

module.exports = generateToken;
