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

    # Check for Groq API Key
    if not settings.groq_api_key or len(settings.groq_api_key) < 10:
        logger.error("[STARTUP] !!! WARNING: GROQ_API_KEY IS MISSING OR TOO SHORT. QUERIES WILL FAIL !!!")
    else:
        logger.info(f"[STARTUP] Groq API configuration detected.")

    # Log startup info
    logger.info(f"[STARTUP] QueryMind API v1.0.0 starting")
    logger.info(f"[STARTUP] Database: {'neon.tech' in settings.database_url and 'Neon' or 'PostgreSQL'}")
    logger.info(f"[STARTUP] Redis cache: {'configured' if settings.redis_url else 'not configured'}")
    logger.info(f"[STARTUP] Semantic cache: {'disabled (Render)' if os.environ.get('DISABLE_SEMANTIC_CACHE', 'true').lower() == 'true' else 'enabled'}")
    yield


app = FastAPI(title="QueryMind API", version="1.0.0", lifespan=lifespan)

# API Router
api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for maximum compatibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    question: str

@app.get("/")
@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}

@api_router.get("/health")
async def api_health():
    return {"status": "ok"}

@api_router.get("/schema")
@app.get("/schema")
async def schema():
    import asyncio
    schema_str = await asyncio.get_event_loop().run_in_executor(None, get_schema_string)
    tables = await asyncio.get_event_loop().run_in_executor(None, get_table_names)
    return {
        "schema": schema_str,
        "tables": tables
    }

@api_router.post("/query")
@app.post("/query")
async def query(req: QueryRequest):
    import time
    start_time = time.time()
    logger.info(f"[QUERY] Received question: {req.question[:100]}...")

    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        cached = cache_get(req.question)
        if cached:
            logger.info(f"[QUERY] Cache hit in {time.time() - start_time:.2f}s")
            return cached
        logger.info("[QUERY] Cache miss, generating SQL...")
    except Exception as e:
        logger.warning(f"[QUERY] Cache lookup failed, proceeding without cache: {e}")

    step_start = time.time()
    try:
        # Run synchronous introspection in executor to avoid blocking the event loop
        schema = await asyncio.get_event_loop().run_in_executor(
            None,
            get_schema_string
        )
        logger.info(f"[QUERY] Schema retrieved in {time.time() - step_start:.2f}s ({len(schema)} bytes)")
    except Exception as e:
        logger.error(f"[QUERY] Failed to get schema: {e}")
        raise HTTPException(status_code=503, detail=f"Database schema unavailable: {e}")

    step_start = time.time()
    try:
        prompt = build_prompt(schema, req.question)
        initial_sql = await generate_sql(prompt)
        logger.info(f"[QUERY] Initial SQL generated in {time.time() - step_start:.2f}s")
    except Exception as e:
        logger.error(f"[QUERY] LLM generation failed: {e}")
        raise HTTPException(status_code=504, detail=f"LLM timeout: {e}")

    # Execute with overall timeout (60 seconds max for entire query execution)
    step_start = time.time()
    import asyncio
    result = None
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
            timeout=80.0 # Slightly increased backend timeout to match frontend
        )
        logger.info(f"[QUERY] Execution with correction completed in {time.time() - step_start:.2f}s")
    except asyncio.TimeoutError:
        logger.error("[QUERY] Query execution timed out after 80 seconds")
        save_query(req.question, initial_sql, 0, 1, False, "Query timed out after 80s")
        raise HTTPException(status_code=504, detail="Query execution timed out after 80 seconds")
    except Exception as e:
        logger.error(f"[QUERY] Unexpected error: {e}")
        save_query(req.question, initial_sql, 0, 1, False, str(e))
        raise HTTPException(status_code=500, detail=f"Internal error: {e}")

    # Handle explicit failure from self-correction loop
    if not result["success"]:
        logger.error(f"[QUERY] Execution failed after {result['attempts']} attempts: {result.get('error')}")
        save_query(
            question=req.question,
            sql=result["sql"],
            row_count=0,
            attempts=result["attempts"],
            success=False,
            error=result.get("error")
        )
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

    logger.info(f"[QUERY] Total time: {time.time() - start_time:.2f}s. Success! {len(result['data'])} rows returned")
    return response

@api_router.post("/upload-csv")
@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    logger.info(f"[UPLOAD] Starting for file: {file.filename}")
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    try:
        contents = await file.read()
        logger.info(f"[UPLOAD] File read complete ({len(contents)} bytes)")
        info = upload_csv_to_postgres(contents, file.filename)
        logger.info(f"[UPLOAD] Success: {info['table_name']}")
        return {"message": "CSV uploaded and table created successfully", **info}
    except ValueError as e:
        logger.warning(f"[UPLOAD] Bad CSV: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"[UPLOAD] Critical failure: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.get("/history")
@app.get("/history")
async def history(limit: int = 20):
    logger.info(f"[HISTORY] Fetching latest {limit} records")
    return {"history": get_history(limit)}

@api_router.delete("/cache")
@app.delete("/cache")
async def clear_cache():
    from query.cache import _get_redis
    client = _get_redis()
    client.flushdb()
    return {"message": "Cache cleared successfully"}

app.include_router(api_router)

