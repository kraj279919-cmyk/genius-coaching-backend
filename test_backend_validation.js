const {
  isValidPhone,
  isValidEmailOptional,
  isValidObjectId,
  validateAmount,
  validateMarks,
  validateDate,
  sanitizeText
} = require('./utils/validators');
const { normalizeClass } = require('./utils/classNormalizer');

console.log("--- B3 VALIDATION TESTS ---");

const runTest = (name, expected, actual) => {
  if (expected === actual) {
    console.log(`[PASS] ${name}`);
  } else {
    console.error(`[FAIL] ${name} - Expected: ${expected}, Got: ${actual}`);
    process.exitCode = 1;
  }
};

runTest("normalizeClass(' CLASS 10 a ')", 'Class 10 A', normalizeClass(' CLASS 10 a '));
runTest("isValidPhone('1234')", false, isValidPhone('1234'));
runTest("isValidPhone('9876543210')", true, isValidPhone('9876543210'));
runTest("isValidEmailOptional('test@example')", false, isValidEmailOptional('test@example'));
runTest("isValidEmailOptional('test@example.com')", true, isValidEmailOptional('test@example.com'));
runTest("isValidEmailOptional('')", true, isValidEmailOptional(''));
runTest("isValidObjectId('123')", false, isValidObjectId('123'));
runTest("isValidObjectId('507f1f77bcf86cd799439011')", true, isValidObjectId('507f1f77bcf86cd799439011'));
runTest("validateAmount(-500)", false, validateAmount(-500));
runTest("validateAmount(500)", true, validateAmount(500));
runTest("validateAmount(0)", true, validateAmount(0));
runTest("validateMarks(110, 100)", false, validateMarks(110, 100));
runTest("validateMarks(90, 100)", true, validateMarks(90, 100));
runTest("validateMarks(-10, 100)", false, validateMarks(-10, 100));
runTest("validateDate('invalid-date')", false, validateDate('invalid-date'));
runTest("validateDate('2023-01-01')", true, validateDate('2023-01-01'));
runTest("sanitizeText('Hello World', 5)", 'Hello', sanitizeText('Hello World', 5));

console.log("--- END OF TESTS ---");
