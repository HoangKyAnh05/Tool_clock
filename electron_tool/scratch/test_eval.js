const template = `
function cleanSafe(s) {
  return (s || '').replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');
}
`;

console.log('--- GENERATED CODE IN HTML ---');
console.log(template);

try {
  eval(template);
  console.log('Evaluated safely! Test on "word (test).":', cleanSafe('word (test).'));
} catch (e) {
  console.error('EVAL ERROR:', e);
}
