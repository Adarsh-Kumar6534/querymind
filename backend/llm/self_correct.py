import asyncio
from llm.groq_client import generate_sql
from llm.prompt_builder import build_correction_prompt
from query.executor import execute_query
from config import settings
import logging

logger = logging.getLogger(__name__)


def execute_with_self_correction(
    initial_sql: str,
    schema: str,
    question: str,
    engine
) -> dict:
    """Execute SQL with self-correction loop. Returns result dict with success status."""
    sql = initial_sql
    last_error = None

    for attempt in range(1, settings.max_retries + 1):
        try:
            logger.info(f"[ATTEMPT {attempt}] Executing SQL: {sql[:80]}...")
            result = execute_query(sql, engine)
            logger.info(f"[ATTEMPT {attempt}] Success! Retrieved {len(result)} rows")
            return {
                "sql": sql,
                "data": result,
                "attempts": attempt,
                "success": True,
                "error": None
            }
        except Exception as e:
            last_error = str(e)
            logger.warning(f"[ATTEMPT {attempt}] Failed: {last_error}")

            if attempt < settings.max_retries:
                try:
                    logger.info(f"[ATTEMPT {attempt}] Requesting LLM correction...")
                    correction_prompt = build_correction_prompt(
                        schema=schema,
                        question=question,
                        failed_sql=sql,
                        error=last_error
                    )
                    # Run async generate_sql in sync context
                    sql = asyncio.run(generate_sql(correction_prompt))
                    logger.info(f"[ATTEMPT {attempt}] LLM provided corrected SQL: {sql[:80]}...")
                except Exception as correction_error:
                    last_error = f"LLM correction failed: {correction_error}"
                    logger.error(f"[ATTEMPT {attempt}] Correction failed: {last_error}")
                    break

    logger.error(f"All {settings.max_retries} attempts exhausted. Last error: {last_error}")
    return {
        "sql": sql,
        "data": [],
        "attempts": settings.max_retries,
        "success": False,
        "error": last_error
    }
