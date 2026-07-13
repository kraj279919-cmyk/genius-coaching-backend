/**
 * utils/classNormalizer.js
 * Central utility for normalizing class names across the backend.
 */

// Helper to convert Roman numerals up to 12
const romanToNum = (roman) => {
  const romanMap = {
    'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5, 
    'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10, 
    'xi': 11, 'xii': 12
  };
  return romanMap[roman.toLowerCase()] || null;
};

/**
 * Normalizes any class string into "Class X" format
 * Examples: "IX" -> "Class 9", "9th" -> "Class 9", "Class X" -> "Class 10"
 * @param {string} value 
 * @returns {string|null} The canonical class string or null if invalid
 */
const normalizeClassName = (value) => {
  if (!value || typeof value !== 'string') return null;

  let cleaned = value.trim().toLowerCase();
  
  // Remove common prefixes/suffixes
  cleaned = cleaned.replace(/^class\s*/, '');
  cleaned = cleaned.replace(/(th|st|nd|rd)$/, '');
  
  // Check if it's a roman numeral
  const fromRoman = romanToNum(cleaned);
  if (fromRoman) {
    return `Class ${fromRoman}`;
  }

  // Check if it's a valid number 1-12
  const num = parseInt(cleaned, 10);
  if (!isNaN(num) && num >= 1 && num <= 12) {
    return `Class ${num}`;
  }

  // Fallback
  return value.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

/**
 * Checks if a class is valid within 1-12 range
 */
const isValidClass = (value) => {
  const normalized = normalizeClassName(value);
  if (!normalized) return false;
  return normalized.startsWith('Class ');
};

/**
 * Returns an array of aliases that might match a given canonical class.
 * Useful for building $in queries in MongoDB to maintain backwards compatibility.
 * @param {string} canonicalClass e.g. "Class 9"
 * @returns {string[]} e.g. ["Class 9", "9", "9th", "IX", "Class IX", "X", "Class X" etc. wait, no, only aliases for THAT class]
 */
const getAliasesForClass = (canonicalClass) => {
  const normalized = normalizeClassName(canonicalClass);
  if (!normalized || !normalized.startsWith('Class ')) {
    return [canonicalClass]; // Return as array for $in query compatibility
  }

  const num = parseInt(normalized.replace('Class ', ''), 10);
  
  const numToRoman = {
    1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V',
    6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X',
    11: 'XI', 12: 'XII'
  };
  
  const roman = numToRoman[num];
  const suffix = (num === 1) ? 'st' : (num === 2) ? 'nd' : (num === 3) ? 'rd' : 'th';
  
  const aliases = [
    normalized,             // "Class 9"
    `${num}`,               // "9"
    `${num}${suffix}`,      // "9th"
    roman,                  // "IX"
    `Class ${roman}`,       // "Class IX"
    `${num} ${suffix}`,     // "9 th"
    `class ${num}`,         // "class 9"
    `class ${roman}`        // "class ix"
  ];
  
  // To prevent breaking apps that saved "Class - Stream" as the class name
  if (num === 11 || num === 12) {
    aliases.push(`${roman} - Science`);
    aliases.push(`${roman} - Commerce`);
    aliases.push(`${roman} - Arts`);
    aliases.push(`${roman}-Science`);
    aliases.push(`${roman}-Commerce`);
    aliases.push(`Class ${roman} - Science`);
    aliases.push(`Class ${roman} - Commerce`);
    aliases.push(`${num}th - Science`);
    aliases.push(`${num}th - Commerce`);
    // Also lowercase/capitalized variations just in case
    aliases.push(`${roman} - science`);
    aliases.push(`${roman} - commerce`);
  }
  
  return aliases;
};

/**
 * Compare two classes (for sorting)
 * "Class 9" < "Class 10"
 */
const compareClassNames = (a, b) => {
  const normA = normalizeClassName(a) || '';
  const normB = normalizeClassName(b) || '';
  
  const numA = parseInt(normA.replace(/\D/g, ''), 10);
  const numB = parseInt(normB.replace(/\D/g, ''), 10);
  
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB;
  }
  return normA.localeCompare(normB);
};

// Also export the old normalizeClass mapping to our new function to prevent breaking old imports completely
const normalizeClass = normalizeClassName;

module.exports = {
  normalizeClassName,
  isValidClass,
  getAliasesForClass,
  compareClassNames,
  normalizeClass // Backward compatibility
};
