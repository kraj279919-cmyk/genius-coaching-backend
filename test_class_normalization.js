const { normalizeClassName, getAliasesForClass } = require('./utils/classNormalizer');

function runTests() {
  console.log('--- Testing normalizeClassName ---');
  
  const testCases1 = [
    { input: '10th', expected: 'Class 10' },
    { input: '9th', expected: 'Class 9' },
    { input: 'IX', expected: 'Class 9' },
    { input: 'X', expected: 'Class 10' },
    { input: 'Class XI', expected: 'Class 11' },
    { input: 'XII', expected: 'Class 12' },
    { input: 'Class 10', expected: 'Class 10' },
    { input: 'Class 12', expected: 'Class 12' },
  ];

  let passed1 = 0;
  testCases1.forEach(t => {
    const res = normalizeClassName(t.input);
    if (res === t.expected) {
      console.log(`[PASS] "${t.input}" -> "${res}"`);
      passed1++;
    } else {
      console.log(`[FAIL] "${t.input}" -> "${res}" (Expected: "${t.expected}")`);
    }
  });

  console.log('\n--- Testing getAliasesForClass ---');
  
  const testCases2 = [
    { input: 'Class 9', expected: ['Class 9', '9', '9th', 'IX', 'Class IX', '9 th', 'class 9', 'class IX'] },
    { input: 'Class 10', expected: ['Class 10', '10', '10th', 'X', 'Class X', '10 th', 'class 10', 'class X'] },
    { input: 'Class 11', expected: ['Class 11', '11', '11th', 'XI', 'Class XI', '11 th', 'class 11', 'class XI'] },
    { input: 'Class 12', expected: ['Class 12', '12', '12th', 'XII', 'Class XII', '12 th', 'class 12', 'class XII'] },
  ];

  let passed2 = 0;
  testCases2.forEach(t => {
    const res = getAliasesForClass(t.input);
    // Sort them so order doesn't matter for deep equality check
    const sortedRes = [...res].sort();
    const sortedExpected = [...t.expected].sort();
    
    if (JSON.stringify(sortedRes) === JSON.stringify(sortedExpected)) {
      console.log(`[PASS] "${t.input}" -> [${res.join(', ')}]`);
      passed2++;
    } else {
      console.log(`[FAIL] "${t.input}" -> [${res.join(', ')}] (Expected: [${t.expected.join(', ')}])`);
    }
  });

  console.log(`\nSummary: ${passed1 + passed2}/${testCases1.length + testCases2.length} tests passed.`);
  if (passed1 + passed2 !== testCases1.length + testCases2.length) {
    process.exit(1);
  }
}

runTests();
