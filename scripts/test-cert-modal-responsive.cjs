/**
 * test-cert-modal-responsive.cjs
 * Validates responsive modal preview rules for Desktop and Mobile viewports
 */
const fs = require('fs');
const assert = require('assert');

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

console.log('=== VERIFYING CERTIFICATE PREVIEW MODAL RESPONSIVE ARCHITECTURE ===');

const styleCss = fs.readFileSync('css/style.css', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const winnerHtml = fs.readFileSync('winner.html', 'utf8');
const judgesHtml = fs.readFileSync('judges.html', 'utf8');
const mainJs = fs.readFileSync('js/main.js', 'utf8');

// 1. Verify index.html modal elements
check('index.html contains certGalleryModal', indexHtml.includes('id="certGalleryModal"'));
check('index.html contains modal-cert-stage', indexHtml.includes('class="modal-cert-stage"'));
check('index.html contains certModalCanvas and certModalImage', indexHtml.includes('id="certModalCanvas"') && indexHtml.includes('id="certModalImage"'));

// 2. Verify css/style.css no clipping / no fixed aspect-ratio on stage
check('.modal-cert-stage has overflow: visible', styleCss.includes('.modal-cert-stage') && styleCss.includes('overflow: visible !important'));
check('.modal-cert-stage does NOT have aspect-ratio: 16 / 11.3', !styleCss.includes('aspect-ratio: 16 / 11.3'));
check('mobile does NOT have max-height: 48vh', !styleCss.includes('max-height: 48vh'));

// 3. Verify desktop canvas scaling rules
check('desktop canvas has max-height calc constraint to fit viewport without clipping', styleCss.includes('max-height: calc(88vh - 170px) !important'));
check('canvas maintains exact A4 3508 / 2480 ratio', styleCss.includes('aspect-ratio: 3508 / 2480 !important'));

// 4. Verify mobile canvas scaling rules
check('mobile canvas scales smoothly with max-height: none', styleCss.includes('max-height: none !important'));

// 5. Verify winner and judges modals
check('winner.html canvas has responsive max-height', winnerHtml.includes('max-height: calc(88vh - 170px)'));
check('judges.html canvas has responsive max-height', judgesHtml.includes('max-height: calc(88vh - 170px)'));

// 6. Verify main.js dynamic template support in openCertModal
check('main.js openCertModal supports dynamic admin uploaded templates', mainJs.includes('getEffectiveTemplate(certKey)'));

console.log('----------------------------------------------------');
console.log(`TOTAL RESULT: ${passed} / ${total} CHECKS PASSED`);

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
