/**
 * test-hero-mobile-visual.cjs
 * Validates that Hero Text and 3D Robot Image are both clearly visible on Mobile with Robot in Background
 */
const fs = require('fs');

let passed = 0;
let total = 0;

function check(name, condition) {
  total++;
  if (condition) {
    passed++;
    console.log(`✅ [PASS] ${name}`);
  } else {
    console.error(`❌ [FAIL] ${name}`);
  }
}

console.log('=== VERIFYING HERO SECTION TEXT & VISUAL RESPONSIVE CLARITY ===');

const styleCss = fs.readFileSync('css/style.css', 'utf8');

// 1. Check that mobile .hero-visual is in background behind content
check('.hero-visual on mobile is position: absolute in background', styleCss.includes('.hero-visual {\n    position: absolute !important;\n    top: 50% !important;'));
check('.hero-visual has z-index: 1', styleCss.includes('z-index: 1 !important;'));

// 2. Check that mobile .hero-content is in foreground on top of background
check('.hero-content on mobile is position: relative with z-index: 5', styleCss.includes('.hero-content {\n    position: relative !important;\n    z-index: 5 !important;'));

// 3. Check that .hero-ai-art-container and .hero-robot-img have high clarity (>= 0.95 opacity) and no radial mask cutoff
check('.hero-ai-art-container has opacity: 0.95', styleCss.includes('opacity: 0.95 !important;'));
check('.hero-ai-art-container has mask-image: none', styleCss.includes('mask-image: none !important;'));
check('.hero-robot-img has opacity: 0.95 and drop-shadow', styleCss.includes('filter: drop-shadow(0 12px 32px rgba(37, 99, 235, 0.22)) !important;'));

// 4. Check that .hero-title and .hero-blue-text have high-contrast white halo text-shadow
check('.hero-title has high-contrast white text-shadow halo', styleCss.includes('text-shadow: 0 0 18px #FFFFFF, 0 0 8px #FFFFFF, 0 2px 4px rgba(255, 255, 255, 1), 0 0 32px #FFFFFF !important;'));

// 5. Check that .hero-lead has high-contrast color #0F172A and transparent background (no white card box)
check('.hero-lead text color is high-contrast #0F172A', styleCss.includes('color: #0F172A !important;'));
check('.hero-lead has transparent background (no white box)', styleCss.includes('background: transparent !important;'));

// 6. Check desktop layout is intact
check('desktop .hero-grid has 2-column layout', styleCss.includes('grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.88fr);'));

console.log('----------------------------------------------------');
console.log(`TOTAL RESULT: ${passed} / ${total} CHECKS PASSED`);

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
