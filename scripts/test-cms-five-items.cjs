const fs = require('fs');

console.log('=== VERIFYING CMS 5 TARGET ITEMS INTEGRATION ===');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const controlHtml = fs.readFileSync('control.html', 'utf8');
const cmsContentJs = fs.readFileSync('js/cms-content.js', 'utf8');
const cmsEngineJs = fs.readFileSync('js/cms-engine.js', 'utf8');
const adminControllerJs = fs.readFileSync('js/admin-cms-controller.js', 'utf8');

const tests = [
  // 1. Browser Tab Title (Image 1)
  {
    name: '1. Tab Title input in control.html (cmsTabTitle)',
    pass: controlHtml.includes('id="cmsTabTitle"')
  },
  {
    name: '1. Tab Title in cms-content.js (global.tabTitle)',
    pass: cmsContentJs.includes('tabTitle:')
  },
  {
    name: '1. Tab Title engine binding in cms-engine.js (document.title)',
    pass: cmsEngineJs.includes('content.global.tabTitle') && cmsEngineJs.includes('document.title = tabTitle')
  },
  {
    name: '1. Tab Title save/populate in admin-cms-controller.js',
    pass: adminControllerJs.includes("'cmsTabTitle'")
  },

  // 2. Official Platform Button in Footer (Image 2)
  {
    name: '2. Official Platform input in control.html (cmsFooterPlatformText & Url)',
    pass: controlHtml.includes('id="cmsFooterPlatformText"') && controlHtml.includes('id="cmsFooterPlatformUrl"')
  },
  {
    name: '2. Official Platform selector in index.html (footer-meta-link)',
    pass: indexHtml.includes('footer-meta-link')
  },
  {
    name: '2. Official Platform engine renderer in cms-engine.js',
    pass: cmsEngineJs.includes('.footer-meta-link') && cmsEngineJs.includes('officialPlatformText')
  },
  {
    name: '2. Official Platform save/populate in admin-cms-controller.js',
    pass: adminControllerJs.includes("'cmsFooterPlatformText'") && adminControllerJs.includes("'cmsFooterPlatformUrl'")
  },

  // 3. Hero Top Eyebrow Pill Badge (Image 3)
  {
    name: '3. Hero Eyebrow Pill input in control.html (cmsHeroEyebrow with badge label)',
    pass: controlHtml.includes('id="cmsHeroEyebrow"') && controlHtml.includes('Image 3 Badge')
  },
  {
    name: '3. Hero Eyebrow selector in index.html (hero-eyebrow)',
    pass: indexHtml.includes('hero-eyebrow')
  },
  {
    name: '3. Hero Eyebrow renderer in cms-engine.js',
    pass: cmsEngineJs.includes('.hero-eyebrow') && cmsEngineJs.includes('eyebrowText')
  },

  // 4. Certificate Claim CTA Card (Image 4)
  {
    name: '4. Claim CTA inputs in control.html (cmsClaimCtaHeading, Desc, Btns)',
    pass: controlHtml.includes('id="cmsClaimCtaHeading"') && controlHtml.includes('id="cmsClaimCtaBtn1Text"')
  },
  {
    name: '4. Claim CTA Banner selector in index.html (claim-cta-banner)',
    pass: indexHtml.includes('claim-cta-banner') && indexHtml.includes('btn-cta-unstop') && indexHtml.includes('btn-cta-whatsapp')
  },
  {
    name: '4. Claim CTA engine renderer in cms-engine.js (renderClaimCta)',
    pass: cmsEngineJs.includes('function renderClaimCta') && cmsEngineJs.includes('.claim-cta-banner')
  },
  {
    name: '4. Claim CTA save/populate in admin-cms-controller.js',
    pass: adminControllerJs.includes("'cmsClaimCtaHeading'") && adminControllerJs.includes("'cmsClaimCtaBtn1Text'")
  },

  // 5. FAQ Section Header & Description (Image 5)
  {
    name: '5. FAQ Header inputs in control.html (cmsFaqEyebrow, Title, Desc)',
    pass: controlHtml.includes('id="cmsFaqEyebrow"') && controlHtml.includes('id="cmsFaqTitle"') && controlHtml.includes('id="cmsFaqDesc"')
  },
  {
    name: '5. FAQ Header engine renderer in cms-engine.js',
    pass: cmsEngineJs.includes('faqHeader') && cmsEngineJs.includes("faqSection.querySelector('.section-title')")
  },
  {
    name: '5. FAQ Header save/populate in admin-cms-controller.js',
    pass: adminControllerJs.includes("'cmsFaqEyebrow'") && adminControllerJs.includes("'cmsFaqTitle'")
  },

  // Unstop Smart Importer Auto-fill test
  {
    name: 'Unstop Smart Importer updates all 5 items',
    pass: adminControllerJs.includes('current.global.tabTitle =') &&
          adminControllerJs.includes('current.hero.eyebrowText =') &&
          adminControllerJs.includes('current.footer.officialPlatformText =') &&
          adminControllerJs.includes('current.claimCta =') &&
          adminControllerJs.includes('current.faqHeader =')
  }
];

let allPass = true;
tests.forEach(t => {
  const icon = t.pass ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`${icon} ${t.name}`);
  if (!t.pass) allPass = false;
});

console.log('----------------------------------------------------');
console.log(`TOTAL RESULT: ${tests.filter(t => t.pass).length} / ${tests.length} CHECKS PASSED`);
if (!allPass) process.exit(1);
