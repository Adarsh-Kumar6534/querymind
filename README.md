# QueryMind

A production-ready Text-to-SQL engine that converts plain English questions into SQL queries, executes them against PostgreSQL, auto-corrects failed queries using a self-correction retry loop, caches results semantically, supports CSV uploads, and renders results as tables and charts.

## Features

- **Natural Language to SQL**: Ask questions in plain English and get PostgreSQL queries
- **Self-Correction Loop**: Automatically fixes failed SQL queries using LLM feedback
- **Semantic Caching**: Caches query results with vector similarity matching
- **CSV Upload**: Import CSV files as database tables on the fly
- **Auto-Chart Detection**: Automatically suggests bar or line charts based on data
- **Query History**: Track all queries with success/failure status

## Prerequisites

- Python 3.11+
- Node.js (LTS)
- PostgreSQL
- Redis (or Upstash for cloud)
- Groq API key

## Setup

### 1. Database Setup

```bash
# Create the database in PostgreSQL
psql -U postgres
CREATE DATABASE querymind;
\q
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

### 4. Configure Environment Variables

Edit `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/querymind
REDIS_URL=redis://localhost:6379
MAX_RETRIES=3
CACHE_TTL=3600
SIMILARITY_THRESHOLD=0.92
USE_OLLAMA=false
```

## Running the Application

### Start Backend

```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs at: http://localhost:5173

## Usage

1. Open http://localhost:5173 in your browser
2. Type a question like "Show me all tables" or "What is the total revenue?"
3. Press Ctrl+Enter or click "Run Query"
4. View the generated SQL, results table, and auto-generated chart
5. Upload CSV files to add new tables to query against

## API Endpoints

- `GET /` - Health check
- `GET /health` - Health status
- `GET /schema` - Get database schema
- `POST /query` - Execute a natural language query
- `POST /upload-csv` - Upload a CSV file
- `GET /history` - Get query history
- `DELETE /cache` - Clear the cache

## Project Structure

```
querymind/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Pydantic settings
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # Environment variables
│   ├── db/
│   │   ├── connection.py    # Database connection
│   │   └── introspect.py    # Schema introspection
│   ├── llm/
│   │   ├── groq_client.py   # Groq API client
│   │   ├── prompt_builder.py # Prompt templates
│   │   └── self_correct.py  # Self-correction loop
│   ├── query/
│   │   ├── executor.py      # Query execution
│   │   ├── cache.py         # Semantic caching
│   │   └── history.py       # Query history
│   ├── csv_handler.py       # CSV upload handler
│   └── chart_detector.py    # Chart type detection
└── frontend/
    ├── src/
    │   ├── App.jsx          # Main app component
    │   ├── api/client.js    # API client
    │   └── components/      # React components
    └── package.json
```

## Technologies

- **Backend**: FastAPI, SQLAlchemy, Groq (Llama 3.1 70B)
- **Frontend**: React, Vite, TailwindCSS, Recharts
- **Database**: PostgreSQL
- **Cache**: Redis with sentence-transformers for semantic similarity
