const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleMessages.push('[ERROR] ' + msg.text());
    }
  });

  // Navigate to the page
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 30000 });

  // Check if the collapsible sections exist
  const sections = await page.$$('.collapsible-section');
  console.log('Found ' + sections.length + ' collapsible sections');

  // Check for GitHub projects section
  const githubSection = await page.$('#github-projects');
  console.log('GitHub projects section exists:', !!githubSection);

  // Check if there are project cards loaded
  const projectCards = await page.$$('.grid .card, .grid [class*="ProjectCard"]');
  console.log('Project cards found:', projectCards.length);

  // Get page title
  const title = await page.title();
  console.log('Page title:', title);

  // Report console errors
  if (consoleMessages.length > 0) {
    console.log('Console errors:', consoleMessages.length);
    consoleMessages.forEach(msg => console.log(msg));
  } else {
    console.log('No console errors');
  }

  await browser.close();
})();
