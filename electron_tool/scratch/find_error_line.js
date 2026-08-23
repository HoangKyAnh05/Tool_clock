const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const sIdx = html.indexOf('<script>');
const eIdx = html.lastIndexOf('</script>');
const scriptBody = html.substring(sIdx + 8, eIdx);

const lines = scriptBody.split('\n');
console.log('Total lines in script:', lines.length);

// Binary search or line-by-line check
let testCode = '';
for (let i = 0; i < lines.length; i++) {
  testCode += lines[i] + '\n';
  try {
    new Function(testCode);
  } catch (err) {
    // If it's unexpected end of input, keep going; if it's token error, report!
    if (!err.message.includes('Unexpected end of input') && !err.message.includes('missing ) after argument list')) {
      console.log(`Error near line ${i + 1}: ${lines[i]}`);
      console.log('Error message:', err.message);
      break;
    }
  }
}
