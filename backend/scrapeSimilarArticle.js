const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const { searchDuckDuckGo } = require('./searchSimilarArticle');

const SIMILAR_CONTENT_PATH = path.join(process.cwd(), 'contentOfSimilarArticle.json');

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
      "relaed link": item.related,
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

  await fsPromises.writeFile(SIMILAR_CONTENT_PATH, JSON.stringify(contentOfSimilarArticles, null, 2), 'utf-8');
  console.log('Saved to contentOfSimilarArticle.json');
  return contentOfSimilarArticles;
}

module.exports = { scrapeTextFromUrl, scrapeAllRelatedArticles };
