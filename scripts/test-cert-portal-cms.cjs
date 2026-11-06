// scripts/test-cert-portal-cms.cjs
// Verification suite for Certification Portal Header (Image 1) and Certificate Claim CTA (Image 2) CMS controls.

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Starting Certification Portal & Claim CTA CMS Verification Suite...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

// 1. Verify index.html elements
const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

test('index.html contains #certPortalEyebrow', () => {
  assert(indexHtml.includes('id="certPortalEyebrow"'), 'Missing id="certPortalEyebrow" in index.html');
});

test('index.html contains #certPortalTitle and #certPortalTitleHighlight', () => {
  assert(indexHtml.includes('id="certPortalTitle"'), 'Missing id="certPortalTitle" in index.html');
  assert(indexHtml.includes('id="certPortalTitleHighlight"'), 'Missing id="certPortalTitleHighlight" in index.html');
});

test('index.html contains #certPortalDesc', () => {
  assert(indexHtml.includes('id="certPortalDesc"'), 'Missing id="certPortalDesc" in index.html');
});

test('index.html contains claim CTA banner elements', () => {
  assert(indexHtml.includes('class="claim-cta-banner"'), 'Missing .claim-cta-banner in index.html');
  assert(indexHtml.includes('class="claim-cta-heading"'), 'Missing .claim-cta-heading in index.html');
  assert(indexHtml.includes('class="claim-cta-text"'), 'Missing .claim-cta-text in index.html');
  assert(indexHtml.includes('class="btn-cta-unstop"'), 'Missing .btn-cta-unstop in index.html');
  assert(indexHtml.includes('class="btn-cta-whatsapp"'), 'Missing .btn-cta-whatsapp in index.html');
});

// 2. Verify control.html admin inputs
const controlHtmlPath = path.join(__dirname, '..', 'control.html');
const controlHtml = fs.readFileSync(controlHtmlPath, 'utf8');

test('control.html contains all Image 1 inputs (Certification Portal Header)', () => {
  assert(controlHtml.includes('id="cmsCertPortalEyebrow"'), 'Missing #cmsCertPortalEyebrow');
  assert(controlHtml.includes('id="cmsCertPortalTitlePrefix"'), 'Missing #cmsCertPortalTitlePrefix');
  assert(controlHtml.includes('id="cmsCertPortalTitleHighlight"'), 'Missing #cmsCertPortalTitleHighlight');
  assert(controlHtml.includes('id="cmsCertPortalDesc"'), 'Missing #cmsCertPortalDesc');
});

test('control.html contains all Image 2 inputs (Claim CTA Card)', () => {
  assert(controlHtml.includes('id="cmsClaimCtaHeading"'), 'Missing #cmsClaimCtaHeading');
  assert(controlHtml.includes('id="cmsClaimCtaDesc"'), 'Missing #cmsClaimCtaDesc');
  assert(controlHtml.includes('id="cmsClaimCtaBtn1Text"'), 'Missing #cmsClaimCtaBtn1Text');
  assert(controlHtml.includes('id="cmsClaimCtaBtn1Url"'), 'Missing #cmsClaimCtaBtn1Url');
  assert(controlHtml.includes('id="cmsClaimCtaBtn2Text"'), 'Missing #cmsClaimCtaBtn2Text');
  assert(controlHtml.includes('id="cmsClaimCtaBtn2Url"'), 'Missing #cmsClaimCtaBtn2Url');
});

// 3. Verify js/cms-content.js default schemas
const cmsContentJsPath = path.join(__dirname, '..', 'js', 'cms-content.js');
const cmsContentJs = fs.readFileSync(cmsContentJsPath, 'utf8');

test('js/cms-content.js contains certificationHeader default schema', () => {
  assert(cmsContentJs.includes('certificationHeader:'), 'Missing certificationHeader in cms-content.js');
  assert(cmsContentJs.includes('OFFICIAL CREDENTIAL PORTAL'), 'Missing default eyebrow in cms-content.js');
  assert(cmsContentJs.includes('Claim Your'), 'Missing default titlePrefix in cms-content.js');
  assert(cmsContentJs.includes('Official Certificate'), 'Missing default titleHighlight in cms-content.js');
});

test('js/cms-content.js contains claimCta default schema', () => {
  assert(cmsContentJs.includes('claimCta:'), 'Missing claimCta in cms-content.js');
  assert(cmsContentJs.includes('Ready to Earn Your Official Certificate?'), 'Missing heading in claimCta');
});

// 4. Verify js/cms-engine.js renderer and export
const cmsEngineJsPath = path.join(__dirname, '..', 'js', 'cms-engine.js');
const cmsEngineJs = fs.readFileSync(cmsEngineJsPath, 'utf8');

test('js/cms-engine.js has renderCertificationHeader implementation', () => {
  assert(cmsEngineJs.includes('function renderCertificationHeader'), 'Missing function renderCertificationHeader');
  assert(cmsEngineJs.includes('renderCertificationHeader(content)'), 'renderCertificationHeader is not called in applyToDOM');
  assert(cmsEngineJs.includes('renderCertificationHeader: renderCertificationHeader'), 'renderCertificationHeader is not exported');
});

// 5. Verify js/admin-cms-controller.js populate and save bindings
const adminCmsJsPath = path.join(__dirname, '..', 'js', 'admin-cms-controller.js');
const adminCmsJs = fs.readFileSync(adminCmsJsPath, 'utf8');

test('js/admin-cms-controller.js populates and saves certificationHeader', () => {
  assert(adminCmsJs.includes("setVal('cmsCertPortalEyebrow'"), 'Missing setVal for cmsCertPortalEyebrow');
  assert(adminCmsJs.includes("setVal('cmsCertPortalTitlePrefix'"), 'Missing setVal for cmsCertPortalTitlePrefix');
  assert(adminCmsJs.includes("setVal('cmsCertPortalTitleHighlight'"), 'Missing setVal for cmsCertPortalTitleHighlight');
  assert(adminCmsJs.includes("setVal('cmsCertPortalDesc'"), 'Missing setVal for cmsCertPortalDesc');
  assert(adminCmsJs.includes("getVal('cmsCertPortalEyebrow')"), 'Missing getVal for cmsCertPortalEyebrow in saveCMSSection');
});

test('js/admin-cms-controller.js populates and saves claimCta', () => {
  assert(adminCmsJs.includes("setVal('cmsClaimCtaHeading'"), 'Missing setVal for cmsClaimCtaHeading');
  assert(adminCmsJs.includes("getVal('cmsClaimCtaHeading')"), 'Missing getVal for cmsClaimCtaHeading in saveCMSSection');
});

// 6. Functional DOM Rendering Test using JSDOM
let jsdom;
try {
  jsdom = require('jsdom');
} catch (e) {
  // If jsdom not installed, skip DOM test
}

if (jsdom) {
  const { JSDOM } = jsdom;
  test('DOM rendering works for custom certificationHeader and claimCta', () => {
    const dom = new JSDOM(indexHtml, { runScripts: "dangerously" });
    const { window } = dom;

    // Load CMS scripts in mock window
    const scriptCms = dom.window.document.createElement('script');
    scriptCms.textContent = cmsContentJs;
    dom.window.document.head.appendChild(scriptCms);

    const scriptEngine = dom.window.document.createElement('script');
    scriptEngine.textContent = cmsEngineJs;
    dom.window.document.head.appendChild(scriptEngine);

    // Test default render
    const eyebrow = dom.window.document.getElementById('certPortalEyebrow');
    assert.strictEqual(eyebrow.textContent.trim(), 'OFFICIAL CREDENTIAL PORTAL');

    const title = dom.window.document.getElementById('certPortalTitle');
    assert(title.textContent.includes('Claim Your'));
    assert(title.textContent.includes('Official Certificate'));

    // Apply custom content
    const customContent = dom.window.HorizonCMS.getContent();
    customContent.certificationHeader = {
      eyebrow: 'VERIFIED BLOCKCHAIN CREDENTIALS',
      titlePrefix: 'Download Your',
      titleHighlight: 'Prestige Certificate',
      description: 'Custom verified description for 2026 participants.'
    };
    customContent.claimCta = {
      heading: 'Custom CTA Header Test',
      description: 'Custom CTA Description Test',
      primaryButtonText: 'Custom Register',
      primaryButtonUrl: 'https://unstop.com/custom-test',
      secondaryButtonText: 'Custom WhatsApp',
      secondaryButtonUrl: 'https://whatsapp.com/custom-group'
    };

    dom.window.HorizonCMS.renderCertificationHeader(customContent);
    dom.window.HorizonCMS.renderClaimCta(customContent);

    // Verify Image 1 elements updated
    assert.strictEqual(dom.window.document.getElementById('certPortalEyebrow').textContent.trim(), 'VERIFIED BLOCKCHAIN CREDENTIALS');
    assert(dom.window.document.getElementById('certPortalTitle').textContent.includes('Download Your'));
    assert(dom.window.document.getElementById('certPortalTitleHighlight').textContent.includes('Prestige Certificate'));
    assert.strictEqual(dom.window.document.getElementById('certPortalDesc').textContent.trim(), 'Custom verified description for 2026 participants.');

    // Verify Image 2 elements updated
    const banner = dom.window.document.querySelector('.claim-cta-banner');
    assert.strictEqual(banner.querySelector('.claim-cta-heading').textContent.trim(), 'Custom CTA Header Test');
    assert.strictEqual(banner.querySelector('.claim-cta-text').textContent.trim(), 'Custom CTA Description Test');
    assert.strictEqual(banner.querySelector('.btn-cta-unstop').getAttribute('href'), 'https://unstop.com/custom-test');
    assert.strictEqual(banner.querySelector('.btn-cta-whatsapp').getAttribute('href'), 'https://whatsapp.com/custom-group');
  });
}

console.log(`\n========================================`);
console.log(`Results: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) process.exit(1);
