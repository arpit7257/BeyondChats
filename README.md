This is a comprehensive and high-impact README designed to impress evaluators. It highlights your technical depth, the complexity of the pipeline you've built, and provides clear instructions for anyone reviewing your work.

---

# AI-Powered Content Intelligence & Enhancement Pipeline

An automated end-to-end system that scrapes legacy blog content, performs competitive research via search engines, and leverages Large Language Models (LLMs) to reformat and enhance articles for better readability and SEO alignment.

## 🚀 Overview

This project is a three-phase full-stack application designed to modernize web content. It automates the "Research-to-Publish" workflow by:

1. **Extracting** historical data from target blogs.
2. **Analyzing** top-ranking competitors on search engines for the same topics.
3. **Synthesizing** new content using the Groq LPU (Llama-3 models) to match modern formatting and depth.
4. **Presenting** a side-by-side comparison in a responsive React interface.

---

## 🏗️ System Architecture & Data Flow

The system follows a modular pipeline architecture. Below is the flow of data through the various phases:

```mermaid
graph TD
    %% Global Styles
    classDef source fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef process fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef database fill:#fff9c4,stroke:#fbc02d,stroke-width:2px;
    classDef ai fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    classDef ui fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;

    subgraph PHASE_1 ["Phase 1: Content Extraction & Storage"]
        A[BeyondChats Blog] -->|Puppeteer / Cheerio| B(Node.js Scraper Engine)
        B -->|POST Request| C[[RESTful CRUD API]]
        C --> D[(MongoDB / Local Storage)]
    end

    subgraph PHASE_2 ["Phase 2: Research & AI Orchestration"]
        D -->|Fetch Original Title| E[Search Engine Crawler]
        E -->|Query: DuckDuckGo/Google| F{Top 2 Competitors}
        F -->|Extract Content| G(Competitor Content Scraper)
        G -->|Reference Data| H[AI Processing Hub]
        D -->|Original Content| H
        H -->|Groq Cloud LPU| I{{Llama-3 LLM Engine}}
        I -->|Enhanced Markdown| J[Citation Generator]
        J -->|Update Content| C
    end

    subgraph PHASE_3 ["Phase 3: Intelligent UI Presentation"]
        K[React.js Frontend] -->|GET Request| C
        C -->|JSON: Original vs Enhanced| K
        K -->|React-Markdown| L[Responsive Split-View Dashboard]
    end

    %% Applying Classes
    class A source;
    class B,E,G,J process;
    class D,C database;
    class H,I ai;
    class K,L ui;

```

---

## 🛠️ Tech Stack

* **Frontend:** React.js, React-Markdown (for AI formatting), CSS3 (Split-view Grid).
* **Backend:** Node.js, Express.js.
* **AI Engine:** Groq Cloud API (Llama-3-70b/8b).
* **Scraping:** Cheerio / Axios / Search APIs.
* **Database:** Local JSON Storage / RESTful CRUD implementation.

---

## ⚙️ Local Setup Instructions

### 1. Prerequisites

* Node.js (v16 or higher)
* A **Groq API Key** (Get it at [console.groq.com](https://console.groq.com/))

### 2. Backend Installation

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create a .env file
touch .env

```

Add the following to your `.env`:

```env
GROQ_API_KEY=your_key_here
PORT=5000

```

### 3. Running the Pipeline

To initiate the full scraping, searching, and AI enhancement process:

```bash
# Run the development server
npm run dev

# In a separate terminal, start the pipeline (if scripted as a separate entry)
npm start

```

### 4. Frontend Installation

```bash
# Navigate to the frontend directory
cd frontend/article-app

# Install dependencies
npm install

# Start the React app
npm run dev

```

---

## 📑 Detailed Phase Breakdown

### Phase 1: Legacy Scraping

* Scrapes the 5 oldest articles from `beyondchats.com/blogs/`.
* Implements full CRUD (Create, Read, Update, Delete) endpoints to manage article objects.

### Phase 2: Competitive Intelligence & LLM

* **Dynamic Search:** Takes the title of the original article and queries search engines for current top-performing blogs.
* **Competitor Analysis:** Scrapes the content of those top results to understand the current "standard" of information.
* **LLM Enhancement:** Prompts the LLM to rewrite the original content, adopting the professional tone and formatting of the top-ranking results while retaining the core message.
* **Citations:** Automatically appends the source links used for research at the bottom of the article.

### Phase 3: Comparison UI

* A "Dashboard" view to select processed articles.
* A "Comparison" view featuring:
* **Left Pane:** Original raw text with metadata.
* **Right Pane:** Markdown-rendered enhanced content with specialized styling for readability.



---

## 🔗 Demo

* **API Documentation:** `http://localhost:5000/api/articles`

---

## 👤 Author

* **Arpit Karn**
