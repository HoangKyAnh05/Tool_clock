const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Extract all <script>...</script> content and test eval in a dummy window environment
const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
let match;
let count = 0;

// Mock window and document
global.window = {
  addEventListener: () => {},
  innerWidth: 400,
  innerHeight: 800,
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  }
};
global.localStorage = global.window.localStorage;
global.document = {
  getElementById: (id) => ({
    textContent: '',
    innerHTML: '',
    style: {},
    classList: { add: () => {}, remove: () => {} },
    addEventListener: () => {}
  }),
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.navigator = { userAgent: 'test' };

while ((match = scriptRegex.exec(html)) !== null) {
  count++;
  try {
    eval(match[1]);
    console.log(`Script tag #${count} evaluated with ZERO syntax errors!`);
  } catch (err) {
    console.error(`Script tag #${count} ERROR:`, err.message);
    process.exit(1);
  }
}
console.log('ALL SCRIPTS IN index.html ARE 100% CLEAN AND SYNTAX ERROR FREE!');
