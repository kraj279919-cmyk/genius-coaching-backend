const mongoose = require('mongoose');
const { normalizeClass } = require('./classNormalizer');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const isValidPhone = (phone) => {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10;
};

const isValidEmailOptional = (email) => {
  if (!email || email.trim() === '') return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const normalizePhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

const normalizeEmail = (email) => {
  if (!email) return '';
  return email.trim().toLowerCase();
};

const normalizeClassName = (className) => normalizeClass(className);

const validateRequiredFields = (fields, data) => {
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field].toString().trim() === '') {
      return `Field '${field}' is required.`;
    }
  }
  return null;
};

const validateAmount = (amount) => {
  const num = Number(amount);
  return !isNaN(num) && num >= 0;
};

const validateMarks = (marksObtained, totalMarks) => {
  const obtained = Number(marksObtained);
  const total = Number(totalMarks);
  if (isNaN(obtained) || isNaN(total)) return false;
  if (obtained < 0 || total <= 0) return false;
  if (obtained > total) return false;
  return true;
};

const validateDate = (dateStr) => {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

const isFutureDateAllowed = (dateStr) => {
  if (!validateDate(dateStr)) return false;
  const date = new Date(dateStr);
  const now = new Date();
  return date >= now;
};

const sanitizeText = (text, maxLength = 1000) => {
  if (!text) return '';
  let clean = text.toString().trim();
  if (clean.length > maxLength) {
    clean = clean.substring(0, maxLength);
  }
  return clean;
};

const cleanErrorMessage = (error) => {
  if (error.name === 'ValidationError') {
    return Object.values(error.errors).map(val => val.message).join(', ');
  }
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return `${field} already exists.`;
  }
  return error.message || 'Server Error';
};

module.exports = {
  isValidObjectId,
  isValidPhone,
  isValidEmailOptional,
  normalizePhone,
  normalizeEmail,
  normalizeClassName: normalizeClass,
  validateRequiredFields,
  validateAmount,
  validateMarks,
  validateDate,
  isFutureDateAllowed,
  sanitizeText,
  cleanErrorMessage
};
