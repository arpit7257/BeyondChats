// minimal shim for `File` used by undici/web fetch in some Node versions
global.File = global.File || class {};
const cheerio = require('cheerio');

// Page that lists articles
const LISTING_URL = 'https://beyondchats.com/blogs/page/14/';

async function getLast5Urls() {
    try {
        const res = await fetch(LISTING_URL);
        const html = await res.text();
        const $ = cheerio.load(html);

        const urls = [];
        $('article.entry-card').each(function () {
            const href = $(this).find('.entry-title a').attr('href');
            if (href) urls.push(href);
        });

        // Return the last 5 URLs (or fewer if not available)
        return urls.slice(-5);
    } catch (err) {
        console.error('getLast5Urls error:', err);
        return [];
    }
}

module.exports = getLast5Urls;
