const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');

const FINAL_CONTENT_PATH = path.join(process.cwd(), 'finalContent.json');

async function postArticlesToServer(createArticleFunc) {
  try {
    console.log('Reading finalContent.json...\n');
    const data = await fsPromises.readFile(FINAL_CONTENT_PATH, 'utf-8');
    const articles = JSON.parse(data);

    if (!Array.isArray(articles)) {
      console.error('Error: finalContent.json does not contain an array');
      return;
    }

    console.log(`Found ${articles.length} articles to post.\n`);

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      console.log(`Posting Article ${i + 1}/${articles.length}: "${article.title}"`);

      try {
        const result = await createArticleFunc({
          title: article.title,
          author: article.author,
          date: article.date,
          content: article.content,
          url: article.url
        });
        console.log(`Success (ID: ${result.id})`);
      } catch (err) {
        console.log(`  ! Error: ${err.message}`);
      }
    }

    console.log('\nAll articles posted.');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

module.exports = { postArticlesToServer };