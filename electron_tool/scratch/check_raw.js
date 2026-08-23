const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Check for unescaped </script inside json
const startTag = '<script id="flashcard-data" type="application/json">';
const sIdx = html.indexOf(startTag);
const eIdx = html.indexOf('</script>', sIdx + startTag.length);
const jsonRaw = html.substring(sIdx + startTag.length, eIdx);

console.log('Raw JSON length in index.html:', jsonRaw.length);
try {
  const parsed = JSON.parse(jsonRaw);
  console.log('Successfully parsed! Count:', parsed.length);
} catch (e) {
  console.error('Failed to parse jsonRaw:', e);
}
