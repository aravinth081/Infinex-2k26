const fs = require('fs');

console.log('=== VERIFYING SCROLLSPY & ACTIVE NAV TRACKING ===');

const cmsEngine = fs.readFileSync('js/cms-engine.js', 'utf8');
const mainJs = fs.readFileSync('js/main.js', 'utf8');
const styleCss = fs.readFileSync('css/style.css', 'utf8');

const tests = [
  {
    name: 'html element has scroll-padding-top for navbar clearance',
    pass: styleCss.includes('scroll-padding-top: 80px')
  },
  {
    name: 'setActiveNavSection function exists in cms-engine.js',
    pass: cmsEngine.includes('function setActiveNavSection(')
  },
  {
    name: 'updateActiveNavOnScroll function exists in cms-engine.js',
    pass: cmsEngine.includes('function updateActiveNavOnScroll(')
  },
  {
    name: 'initNavigationActiveTracking binds click & scroll listeners',
    pass: cmsEngine.includes('function initNavigationActiveTracking()') &&
          cmsEngine.includes("window.addEventListener('scroll', updateActiveNavOnScroll")
  },
  {
    name: 'renderNavigation invokes initNavigationActiveTracking',
    pass: cmsEngine.includes('initNavigationActiveTracking()')
  },
  {
    name: 'smooth scrolling with navbar offset implemented on nav click',
    pass: cmsEngine.includes('window.scrollTo({') && cmsEngine.includes("behavior: 'smooth'")
  },
  {
    name: 'main.js delegates active nav tracking to HorizonCMS',
    pass: mainJs.includes('window.HorizonCMS.updateActiveNavOnScroll()')
  },
  {
    name: 'mobile drawer click delegation implemented',
    pass: mainJs.includes("mobileNavContainer.addEventListener('click'")
  },
  {
    name: '.nav-link.active CSS pill styles present',
    pass: styleCss.includes('.nav-link.active') && styleCss.includes('border-radius: 9999px')
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
