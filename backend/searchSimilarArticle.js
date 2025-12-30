const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const { fetchArticleTitles } = require('./server'); // Keep your existing import

chromium.use(stealth);

async function searchDuckDuckGo() {
    const titlesObj = await fetchArticleTitles();
    const titles = Object.values(titlesObj || {}).filter(t => !!t);
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
            console.log(`✅ Found: ${links.length} links`);

        } catch (e) {
            console.log(`❌ Failed: ${title}`);
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