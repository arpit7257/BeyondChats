const express = require('express');
const fsPromises = require('fs/promises');
const path = require('path');

// Import all pipeline functions
const { getLast5Urls } = require('./getLast5Urls');
const { scrapeArticle } = require('./scrape');
const { searchDuckDuckGo } = require('./searchSimilarArticle');
const { scrapeAllRelatedArticles } = require('./scrapeSimilarArticle');
const { enhancePipeline } = require('./llmContentUpdate');
const { postArticlesToServer: postArticlesToServerFunc } = require('./postFinalContent');

const app = express();
const PORT = 5000;
const STORE_PATH = path.join(process.cwd(), 'tempstore.json');

// Middleware
app.use(express.json());

// Helper: Load articles from file
async function loadArticles() {
  try {
    const data = await fsPromises.readFile(STORE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Simple helper: read all articles and return object of id => title
async function fetchArticleTitles() {
  try {
    const articles = await loadArticles();
    const titles = {};
    articles.forEach((a, i) => {
      const key = (a && a.id) ? a.id : `idx_${i}`;
      titles[key] = (a && a.title) ? a.title : '';
    });
    return titles;
  } catch (err) {
    console.error('fetchArticleTitles error:', err.message);
    return {};
  }
}

// Helper: Save articles to file
async function saveArticles(articles) {
  await fsPromises.writeFile(STORE_PATH, JSON.stringify(articles, null, 2), 'utf-8');
}

// Helper: Create a new article
async function createArticle(articleData) {
  const { title, author, date, content, url } = articleData;
  
  if (!title) {
    throw new Error('Title is required');
  }
  
  const newArticle = {
    id: Date.now() + Math.random(),
    title,
    author: author || '',
    date: date || new Date().toLocaleDateString(),
    content: content || '',
    url: url || ''
  };
  
  const articles = await loadArticles();
  articles.push(newArticle);
  await saveArticles(articles);
  
  return newArticle;
}

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'BeyondChats Articles API' });
});

// ========== CRUD OPERATIONS ==========

// 1. READ ALL articles
app.get('/api/articles', async (req, res) => {
  try {
    const articles = await loadArticles();
    res.json({ success: true, count: articles.length, data: articles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. READ ONE article by ID
app.get('/api/articles/:id', async (req, res) => {
  try {
    const articles = await loadArticles();
    const article = articles.find(a => a.id == req.params.id);
    
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }
    
    res.json({ success: true, data: article });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. CREATE ONE article
app.post('/api/articles', async (req, res) => {
  try {
    const newArticle = await createArticle(req.body);
    res.status(201).json({ success: true, data: newArticle });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. UPDATE ONE article by ID
app.put('/api/articles/:id', async (req, res) => {
  try {
    const articles = await loadArticles();
    const index = articles.findIndex(a => a.id == req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }
    
    // Update fields
    articles[index] = { ...articles[index], ...req.body, id: articles[index].id };
    await saveArticles(articles);
    
    res.json({ success: true, data: articles[index] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. DELETE ONE article by ID
app.delete('/api/articles/:id', async (req, res) => {
  try {
    const articles = await loadArticles();
    const index = articles.findIndex(a => a.id == req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }
    
    const deletedArticle = articles.splice(index, 1);
    await saveArticles(articles);
    
    res.json({ success: true, message: 'Article deleted', data: deletedArticle[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. DELETE ALL articles
app.delete('/api/articles', async (req, res) => {
  try {
    await saveArticles([]);
    res.json({ success: true, message: 'All articles deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========== INTEGRATED PIPELINE ==========
// Main pipeline: orchestrates all functions in order
async function runFullPipeline() {
  try {
    console.log('\n\n========== STARTING FULL PIPELINE ==========\n');

    // Step 1: Get last 5 URLs
    console.log('Step 1: Getting last 5 URLs...');
    const urls = await getLast5Urls();
    console.log(`Found ${urls.length} URLs\n`);

    // Step 2: Scrape articles from those URLs
    console.log('Step 2: Scraping articles...');
    const articles = [];
    for (const url of urls) {
      const article = await scrapeArticle(url);
      articles.push(article);
    }
    await saveArticles(articles);
    console.log(`Scraped ${articles.length} articles to tempstore.json\n`);

    // Step 3: Search for similar articles
    console.log('Step 3: Searching for similar articles on DuckDuckGo...');
    const similarResults = await searchDuckDuckGo();
    console.log(`Found similar articles\n`);

    // Step 4: Scrape all related articles
    console.log('Step 4: Scraping related articles...');
    await scrapeAllRelatedArticles();
    console.log(`Scraped related articles to contentOfSimilarArticle.json\n`);

    // Step 5: Enhance content with LLM
    console.log('Step 5: Enhancing content with LLM...');
    await enhancePipeline();
    console.log(`Generated enhanced content to finalContent.json\n`);

    // Step 6: Post articles to server
    console.log('Step 6: Posting articles to database...');
    await postArticlesToServerFunc(createArticle);
    console.log(`Articles posted to server\n`);

    console.log('========== PIPELINE COMPLETED SUCCESSFULLY ==========\n');
  } catch (err) {
    console.error(' PIPELINE ERROR:', err.message);
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Articles stored in: ${STORE_PATH}`);
  
  // Automatically run the full pipeline when server starts
  console.log('\nInitializing full pipeline...');
  runFullPipeline();
});

// Export helper for other modules if needed
module.exports = { fetchArticleTitles, createArticle, loadArticles, saveArticles };
