global.File = global.File || class {};
const cheerio = require('cheerio');
const fsPromises = require('fs/promises');
const path = require('path');
const { getLast5Urls } = require('./getLast5Urls');

const STORE_PATH = path.join(process.cwd(), 'tempstore.json');

async function scrapeArticle(articleUrl) {
    try {
        const res = await fetch(articleUrl);
        const html = await res.text();
        const $ = cheerio.load(html);

        const title = $('.elementor-widget-theme-post-title h1').text().trim() || $('title').text().trim();
        const author = $('.elementor-post-info__item--type-author').text().trim();
        const date = $('.elementor-post-info__item--type-date time').text().trim();

        // 2. Extract Article Content
        // We target the main content container and exclude shared widgets/social buttons
        const contentSelector = '.elementor-widget-theme-post-content';
        
        // Remove unwanted elements inside the content (social placeholders, etc.)
        $(contentSelector).find('.has-social-placeholder, script, style').remove();

        const fullText = [];
        $(contentSelector).find('h2, h3, p, li').each((i, el) => {
            const text = $(el).text().trim();
            if (text) fullText.push(text);
        });

        return {
            id: Date.now() + Math.random(), // Unique ID for CRUD operations
            url: articleUrl,
            title,
            author,
            date,
            content: fullText.join('\n\n') // Joining with double newline for readability
        };
    } catch (err) {
        console.error('scrapeArticle error for', articleUrl, err.message);
        return { url: articleUrl, error: err.message };
    }
}

async function run() {
    console.log('Fetching URLs...');
    const urls = await getLast5Urls();
    
    if (!urls || urls.length === 0) {
        console.log('No article URLs found.');
        return;
    }

    // Scrape in parallel
    const scrapedResults = await Promise.all(urls.map(u => scrapeArticle(u)));

    // 3. Store in JSON format
    try {
        await fsPromises.writeFile(
            STORE_PATH, 
            JSON.stringify(scrapedResults, null, 2), 
            'utf-8'
        );
        console.log(`Successfully saved ${scrapedResults.length} articles to tempstore.json`);
    } catch (fsErr) {
        console.error('Error writing to file:', fsErr.message);
    }
}

if (require.main === module) {
    run();
}

module.exports = { scrapeArticle, run };