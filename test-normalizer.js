const { normalizeClassName, getAliasesForClass } = require('./utils/classNormalizer');

const aliases1 = getAliasesForClass('Class IX');
const aliases2 = getAliasesForClass('Class 10');
const aliases3 = getAliasesForClass('10th');
const aliases4 = getAliasesForClass('Class X');

console.log('Class IX aliases:', aliases1);
console.log('Class 10 aliases:', aliases2);
console.log('10th aliases:', aliases3);
console.log('Class X aliases:', aliases4);
