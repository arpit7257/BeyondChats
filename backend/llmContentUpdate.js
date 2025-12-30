require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');

// --- CONFIGURATION ---
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const SIMILAR_CONTENT_PATH = path.join(process.cwd(), 'contentOfSimilarArticle.json');
const FINAL_CONTENT_PATH = path.join(process.cwd(), 'finalContent.json');

// --- HELPER: Sleep ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- LOADER ---
async function loadSimilarContent() {
  try {
    const data = await fsPromises.readFile(SIMILAR_CONTENT_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading contentOfSimilarArticle.json:", err.message);
    return [];
  }
}

// --- PROMPT GENERATOR ---
function createContentPrompt(title, relatedInfo) {
  const context = Array.isArray(relatedInfo) ? relatedInfo.join('\n\n') : (relatedInfo || '');

  const safeContext = context.substring(0, 6000); 

  return `You are an expert SEO Content Writer.
  
Task: Write a comprehensive, engaging, and detailed article in Markdown format based on the "Context Information" provided below.

Title of Article: "${title}"

Context Information:
${safeContext}

Instructions:
1. Use the Title provided above.
2. Structure the content with clear Markdown headers (##, ###).
3. Do NOT output a JSON object. Output ONLY the raw Markdown text of the article.
4. Ensure the content is original and optimized for search engines.`;
}

// --- LLM CALLER ---
async function callGroqLLM(prompt) {
  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      console.log(`  > API Call (Attempt ${attempt + 1})...`);
      
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + GROQ_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a helpful article writer.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.6,
          // FIX 2: Reduced output tokens to fit combined TPM limit
          // 1500 tokens is plenty for a blog post (~1000 words)
          max_tokens: 1500 
        })
      });

      // FIX 3: Parse error body to see WHY it failed
      if (!response.ok) {
        const errorBody = await response.text(); 
        
        if (response.status === 429) {
          console.log('  ! Rate limit hit (429).');
          console.log(`  ! Server Message: ${errorBody}`); // This will tell you the real reason
          
          // Exponential backoff: 20s, 40s, 60s...
          const waitTime = 20000 * (attempt + 1);
          console.log(`  ! Waiting ${waitTime/1000} seconds...`);
          await sleep(waitTime);
          attempt++;
          continue;
        }

        throw new Error(`API Error: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "";

    } catch (error) {
      console.log('  ! Request Failed:', error.message);
      attempt++;
      await sleep(2000);
    }
  }
  return "Error: Could not generate content after multiple attempts.";
}

// --- MAIN PIPELINE ---
async function enhancePipeline() {
  console.log('Starting Content Generation Pipeline...\n');
  
  const sourceData = await loadSimilarContent();
  
  if (!sourceData || sourceData.length === 0) {
    console.log("No data found in contentOfSimilarArticle.json");
    return;
  }

  const finalResults = [];

  for (let i = 0; i < sourceData.length; i++) {
    const item = sourceData[i];
    const itemTitle = item.title || "Untitled Article";
    
    const relatedContent = item.related || item.content || ""; 
    const rawLinks = item['relaed link'] || item.related_links || [];
    const urlString = Array.isArray(rawLinks) ? rawLinks.join(', ') : (rawLinks || "");

    console.log(`\nProcessing [${i + 1}/${sourceData.length}]: "${itemTitle}"`);

    const prompt = createContentPrompt(itemTitle, relatedContent);
    const generatedMarkdown = await callGroqLLM(prompt);

    const finalObject = {
      id: Date.now() + Math.random(),
      title: itemTitle,
      author: "llama-3.3-70b-versatile",
      date: new Date().toLocaleDateString(),
      content: generatedMarkdown,
      url: urlString
    };

    finalResults.push(finalObject);
    
    console.log('Article generated successfully.');
    // Keep a generous pause to clear the TPM buffer for the next loop
    console.log('Pausing for TPM reset...');
    await sleep(5000); 
  }

  await fsPromises.writeFile(FINAL_CONTENT_PATH, JSON.stringify(finalResults, null, 2), 'utf-8');
  console.log(`\nSuccess! Saved ${finalResults.length} articles to finalContent.json`);
  return finalResults;
}

module.exports = { enhancePipeline };

module.exports = { enhancePipeline };