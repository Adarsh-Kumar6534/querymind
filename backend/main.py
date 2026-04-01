from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager

from db.connection import engine
from db.introspect import get_schema_string, get_table_names
from llm.groq_client import generate_sql
from llm.prompt_builder import build_prompt
from llm.self_correct import execute_with_self_correction
from query.cache import cache_get, cache_set
from query.history import ensure_history_table, save_query, get_history
from csv_handler import upload_csv_to_postgres
from chart_detector import detect_chart
from config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        ensure_history_table()
        print("[STARTUP] History table ready.")
    except Exception as e:
        print(f"[STARTUP WARNING] Could not initialize history table: {e}")
        print("[STARTUP] App will continue — check your DATABASE_URL env var in Render.")
    yield


app = FastAPI(title="QueryMind API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://querymind-hvgq.vercel.app",
        "http://localhost:5173",  # local dev
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    question: str

@app.get("/")
async def root():
    return {"status": "QueryMind is running", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/schema")
async def schema():
    return {
        "schema": get_schema_string(),
        "tables": get_table_names()
    }

@app.post("/query")
async def query(req: QueryRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    cached = await cache_get(req.question)
    if cached:
        return cached

    schema = get_schema_string()
    prompt = build_prompt(schema, req.question)
    initial_sql = await generate_sql(prompt)

    result = await execute_with_self_correction(
        initial_sql=initial_sql,
        schema=schema,
        question=req.question,
        engine=engine
    )

    chart_config = detect_chart(result["data"])

    save_query(
        question=req.question,
        sql=result["sql"],
        row_count=len(result["data"]),
        attempts=result["attempts"],
        success=result["success"],
        error=result.get("error")
    )

    if result["success"]:
        response = {**result, "chart": chart_config, "from_cache": False}
        await cache_set(req.question, response)
        return response

    raise HTTPException(
        status_code=422,
        detail={
            "message": "Could not generate valid SQL after retries",
            "last_sql": result["sql"],
            "error": result["error"],
            "attempts": result["attempts"]
        }
    )

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    contents = await file.read()
    info = upload_csv_to_postgres(contents, file.filename)
    return {"message": "CSV uploaded and table created successfully", **info}

@app.get("/history")
async def history(limit: int = 20):
    return {"history": get_history(limit)}

@app.delete("/cache")
async def clear_cache():
    from query.cache import _get_redis
    client = _get_redis()
    client.flushdb()
    return {"message": "Cache cleared successfully"}

