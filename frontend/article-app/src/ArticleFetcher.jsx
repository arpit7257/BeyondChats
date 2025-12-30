import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

import './ArticleFetcher.css';
import './MarkdownStyles.css';

const ArticleFetcher = () => {
  const [uniqueTitles, setUniqueTitles] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);

  // --- Format Original Text ---
  const formatOriginalText = (text) => {
    if (!text) return <p>No content available.</p>;
    const paragraphs = text.split(/\n\s*\n/);
    return paragraphs.map((para, index) => (
      <p key={index} style={{ marginBottom: '1rem' }}>
        {para.split(/\n/).map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < para.split(/\n/).length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    ));
  };

  // --- Render URLs ---
  const renderReferences = (urlString, isEnhanced) => {
    if (!urlString) return null;
    const urls = urlString.split(',').map((u) => u.trim());

    return (
      <div className="reference-section">
        <div className="divider"></div>
        <h4 className="ref-header">Sources:</h4>
        {urls.map((url, index) => (
          <div key={index} className="link-container">
            <span className="link-label">
              {isEnhanced ? `Reference ${index + 1}: ` : 'URL: '}
            </span>
            <a href={url} target="_blank" rel="noopener noreferrer" className="link">
              {url}
            </a>
          </div>
        ))}
      </div>
    );
  };

  const handleInitialFetch = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/articles');
      const jsonResponse = await response.json();
      const list = jsonResponse.data || [];
      const allTitles = list.map(article => article.title);
      setUniqueTitles([...new Set(allTitles)]);
      setHasFetched(true);
      setComparisonData(null);
    } catch (error) {
      console.error("Error fetching articles:", error);
    }
  };

  const handleTitleClick = async (title) => {
    try {
      const encodedTitle = encodeURIComponent(title);
      const response = await fetch(`http://localhost:5000/api/articles/search/${encodedTitle}`);
      const jsonResponse = await response.json();
      setComparisonData(jsonResponse.data);
    } catch (error) {
      console.error(`Error searching for ${title}:`, error);
    }
  };

  // --- VIEW: SPLIT COMPARISON ---
  if (comparisonData && comparisonData.length >= 2) {
    const original = comparisonData[0];
    const enhanced = comparisonData[1];

    return (
      <div className="article-container">
        <button onClick={() => setComparisonData(null)} className="back-button">
          ← Back to Dashboard
        </button>

        <h2 className="main-title">{original.title}</h2>

        <div className="split-view">
          {/* --- LEFT CARD: ORIGINAL --- */}
          <div className="card">
            <div className="header-original">Original</div>
            <div className="meta-data">
              <span><strong>Author:</strong> {original.author}</span>
              <span><strong>Date:</strong> {original.date}</span>
            </div>
            <div className="content-body">
              {formatOriginalText(original.content)}
              {renderReferences(original.url, false)}
            </div>
          </div>

          {/* --- RIGHT CARD: ENHANCED WITH AI --- */}
          <div className="card">
            <div className="header-enhanced">Enhanced by AI</div>
            <div className="meta-data">
              <span><strong>Author:</strong> {enhanced.author}</span>
              <span><strong>Date:</strong> {enhanced.date}</span>
            </div>
            
            <div className="content-body markdown-content">
               <ReactMarkdown>
                 {enhanced.content}
               </ReactMarkdown>
               
               {renderReferences(enhanced.url, true)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: DASHBOARD ---
  return (
    <div className="article-container">
      <h1 className="dashboard-title">Article Dashboard</h1>
      {!hasFetched ? (
        <button onClick={handleInitialFetch} className="main-button">
          Click to render articles
        </button>
      ) : (
        <div className="grid">
          {uniqueTitles.map((title, index) => (
            <button key={index} onClick={() => handleTitleClick(title)} className="title-button">
              {title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArticleFetcher;