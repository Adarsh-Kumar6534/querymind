import logging
import sys
from fastapi import FastAPI, UploadFile, File, HTTPException, APIRouter
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        ensure_history_table()
        logger.info("[STARTUP] History table ready.")
    except Exception as e:
        logger.warning(f"[STARTUP] Could not initialize history table: {e}")
        logger.warning("[STARTUP] App will continue — check your DATABASE_URL env var in Render.")

    # Log startup info
    logger.info(f"[STARTUP] QueryMind API v1.0.0 starting")
    logger.info(f"[STARTUP] Database: {'neon.tech' in settings.database_url and 'Neon' or 'PostgreSQL'}")
    logger.info(f"[STARTUP] Redis cache: {'configured' if settings.redis_url else 'not configured'}")
    logger.info(f"[STARTUP] LLM: {'Ollama' if settings.use_ollama else 'Groq (llama-3.1-8b-instant)'}")
    yield


app = FastAPI(title="QueryMind API", version="1.0.0", lifespan=lifespan)

# API Router
api_router = APIRouter(prefix="/api")

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

@api_router.get("/health")
async def health():
    return {"status": "ok"}

@api_router.get("/schema")
async def schema():
    return {
        "schema": get_schema_string(),
        "tables": get_table_names()
    }

@api_router.post("/query")
async def query(req: QueryRequest):
    logger.info(f"[QUERY] Received question: {req.question[:100]}...")

    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        cached = cache_get(req.question)
        if cached:
            logger.info(f"[QUERY] Cache hit (score: {cached.get('cache_score', 'N/A')})")
            return cached
        logger.info("[QUERY] Cache miss, generating SQL...")
    except Exception as e:
        logger.warning(f"[QUERY] Cache lookup failed, proceeding without cache: {e}")

    try:
        schema = get_schema_string()
        logger.info(f"[QUERY] Schema retrieved ({len(schema)} bytes)")
    except Exception as e:
        logger.error(f"[QUERY] Failed to get schema: {e}")
        raise HTTPException(status_code=503, detail=f"Database schema unavailable: {e}")

    try:
        prompt = build_prompt(schema, req.question)
        initial_sql = await generate_sql(prompt)
        logger.info(f"[QUERY] Generated SQL: {initial_sql[:200]}...")
    except Exception as e:
        logger.error(f"[QUERY] LLM generation failed: {e}")
        raise HTTPException(status_code=504, detail=f"LLM timeout: {e}")

    # Execute with overall timeout (60 seconds max for entire query execution)
    import asyncio
    try:
        result = await asyncio.wait_for(
            asyncio.get_event_loop().run_in_executor(
                None,
                lambda: execute_with_self_correction(
                    initial_sql=initial_sql,
                    schema=schema,
                    question=req.question,
                    engine=engine
                )
            ),
            timeout=60.0
        )
    except asyncio.TimeoutError:
        logger.error("[QUERY] Query execution timed out after 60 seconds")
        raise HTTPException(status_code=504, detail="Query execution timed out after 60 seconds")

    if not result["success"]:
        logger.error(f"[QUERY] Execution failed after {result['attempts']} attempts: {result.get('error')}")
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Could not generate valid SQL after retries",
                "last_sql": result["sql"],
                "error": result.get("error"),
                "attempts": result["attempts"]
            }
        )

    try:
        chart_config = detect_chart(result["data"])
    except Exception as e:
        logger.warning(f"[QUERY] Chart detection failed: {e}")
        chart_config = None

    try:
        save_query(
            question=req.question,
            sql=result["sql"],
            row_count=len(result["data"]),
            attempts=result["attempts"],
            success=result["success"],
            error=result.get("error")
        )
    except Exception as e:
        logger.warning(f"[QUERY] Failed to save history: {e}")

    try:
        response = {**result, "chart": chart_config, "from_cache": False}
        cache_set(req.question, response)
    except Exception as e:
        logger.warning(f"[QUERY] Cache set failed: {e}")

    logger.info(f"[QUERY] Success! {len(result['data'])} rows returned")
    return response

@api_router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    try:
        contents = await file.read()
        info = upload_csv_to_postgres(contents, file.filename)
        return {"message": "CSV uploaded and table created successfully", **info}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"[UPLOAD] Failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.get("/history")
async def history(limit: int = 20):
    return {"history": get_history(limit)}

@api_router.delete("/cache")
async def clear_cache():
    from query.cache import _get_redis
    client = _get_redis()
    client.flushdb()
    return {"message": "Cache cleared successfully"}

app.include_router(api_router)

