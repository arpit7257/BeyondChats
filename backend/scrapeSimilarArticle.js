const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const { searchDuckDuckGo } = require('./searchSimilarArticle');

async function scrapeTextFromUrl(url) {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  
  $('script, style').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  
  console.log(text);
  return text;
}

async function scrapeAllRelatedArticles() {
  const finalResults = await searchDuckDuckGo();
  const contentOfSimilarArticles = [];

  for (const item of finalResults) {
    const articleContent = {
      title: item.title,
      related: []
    };

    for (const url of item.related) {
      try {
        console.log(`Scraping: ${url}`);
        const text = await scrapeTextFromUrl(url);
        articleContent.related.push(text);
      } catch (e) {
        console.log(`Failed to scrape: ${url}`);
        articleContent.related.push('');
      }
    }

    contentOfSimilarArticles.push(articleContent);
  }

  fs.writeFileSync('contentOfSimilarArticle.json', JSON.stringify(contentOfSimilarArticles, null, 2));
  console.log('✅ Saved to contentOfSimilarArticle.json');
}

// Run it
scrapeAllRelatedArticles();

module.exports = { scrapeTextFromUrl };
