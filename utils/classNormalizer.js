/**
 * Normalizes class names so that filtering by class works consistently
 * e.g., "Class X", "10", "X", "Class 10" -> "Class X"
 */
function normalizeClass(classInput) {
    if (!classInput) return classInput;
    
    let normalized = String(classInput).trim().toUpperCase();
    
    // Remove "CLASS" or "CLASS " prefix
    normalized = normalized.replace(/^CLASS\s*/i, '');

    // Map common arabic numerals to roman numerals (if preferred) or vice versa
    const map = {
        '9': 'IX',
        '10': 'X',
        '11': 'XI',
        '12': 'XII',
        'IX': 'IX',
        'X': 'X',
        'XI': 'XI',
        'XII': 'XII'
    };

    if (map[normalized]) {
        return `Class ${map[normalized]}`;
    }

    // Fallback: Just return "Class [normalized]"
    return `Class ${normalized}`;
}

module.exports = {
    normalizeClass
};
