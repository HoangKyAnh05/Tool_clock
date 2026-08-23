const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const sIdx = html.indexOf('<script>');
const eIdx = html.lastIndexOf('</script>');
const scriptBody = html.substring(sIdx + 8, eIdx);

try {
  const script = new vm.Script(scriptBody, { filename: 'generated_script.js' });
  console.log('VM Script compiled successfully!');
} catch (err) {
  console.error('VM Compile Error:', err.stack);
}
