const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const fsPromises = require('fs/promises');
const path = require('path');

const STORE_PATH = path.join(process.cwd(), 'tempstore.json');

chromium.use(stealth);

// Helper: Load articles directly from tempstore.json
async function loadArticles() {
  try {
    const data = await fsPromises.readFile(STORE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

async function searchDuckDuckGo() {
    const articles = await loadArticles();
    const titles = articles.map(a => a.title).filter(t => !!t);
    const finalResults = [];

    const browser = await chromium.launch({ headless: true });

    for (const title of titles) {
        // Create a FRESH context for every search (clears cookies/cache)
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            console.log(`🔍 Searching DDG for: "${title}"`);
            
            // Go to DuckDuckGo
            await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(title)}&t=h_&ia=web`, { waitUntil: 'domcontentloaded' });
            
            // Wait for results
            await page.waitForSelector('#react-layout', { timeout: 5000 });

            const links = await page.evaluate(() => {
                // DDG uses data-testid="result-title-a" for main links
                const anchors = Array.from(document.querySelectorAll('[data-testid="result-title-a"]'));
                return anchors.map(a => a.href).slice(0, 2);
            });

            finalResults.push({ title, related: links });
            console.log(`Found: ${links.length} links`);

        } catch (e) {
            console.log(`Failed: ${title}`);
            finalResults.push({ title, related: [] });
        }

        // Close context to wipe "memory" of this session
        await context.close();
        
        // Short random delay is still good manners
        const wait = Math.floor(Math.random() * 2000) + 1000;
        await new Promise(r => setTimeout(r, wait));
    }

    await browser.close();
    console.log(JSON.stringify(finalResults, null, 2));
    return finalResults;
}

module.exports = { searchDuckDuckGo };

// Uncomment to run directly
// searchDuckDuckGo();