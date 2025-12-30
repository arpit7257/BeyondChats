const express = require('express');
const fsPromises = require('fs/promises');
const path = require('path');

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
    const { title, author, date, content, url } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Articles stored in: ${STORE_PATH}`);
});

// Export helper for other modules if needed
module.exports = { fetchArticleTitles };
