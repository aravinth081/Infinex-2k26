const fs = require('fs');
const path = require('path');

const files = ['index.html', 'winner.html', 'judges.html', '404.html', 'control.html', 'css/style.css', 'js/cms-engine.js', 'js/admin-cms-controller.js'];

console.log('=== THEME AUDIT OF CODEBASE ===');
files.forEach(f => {
  if (fs.existsSync(f)) {
    const text = fs.readFileSync(f, 'utf8');
    console.log(`\n--- ${f} (${text.length} bytes, ${text.split('\n').length} lines) ---`);
    const hexColors = [...new Set(text.match(/#[0-9a-fA-F]{3,8}/g) || [])];
    const darkColors = hexColors.filter(c => /#(?:0[0-9a-fA-F]{2,5}|1[0-1][0-9a-fA-F]{4}|070[bB]|080[dD]|0[dD]15|111[bB]|0508)/i.test(c));
    const cyanViolet = hexColors.filter(c => /#(?:00[dD]9[fF]{2}|8[bB]5[cC][fF]6|38[fF]9[dD]7)/i.test(c));
    console.log('Dark/Black background hexes:', darkColors);
    console.log('Cyan/Violet neon hexes:', cyanViolet);
  }
});
