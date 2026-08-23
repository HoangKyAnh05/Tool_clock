const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const marker = 'id="flashcard-data"';
const pos = html.indexOf(marker);
if (pos === -1) {
  console.log('NOT FOUND');
  process.exit(1);
}

const openTagEnd = html.indexOf('>', pos);
const closeTag = html.indexOf('</script>', openTagEnd);
const content = html.substring(openTagEnd + 1, closeTag).trim();

try {
  const items = JSON.parse(content);
  console.log('JSON parsed successfully! Total items:', items.length);
  
  // Check if any item has broken image or broken properties
  let imageCards = 0;
  let textCards = 0;
  items.forEach((it, idx) => {
    if (it.imageUrl) imageCards++;
    else textCards++;
  });
  console.log('Text cards:', textCards, 'Image cards:', imageCards);
} catch (err) {
  console.error('JSON ERROR:', err.message);
}
