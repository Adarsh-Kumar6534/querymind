from llm.groq_client import generate_sql
from llm.prompt_builder import build_correction_prompt
from query.executor import execute_query
from config import settings
import logging

logger = logging.getLogger(__name__)

async def execute_with_self_correction(
    initial_sql: str,
    schema: str,
    question: str,
    engine
) -> dict:
    sql = initial_sql
    last_error = None

    for attempt in range(1, settings.max_retries + 1):
        try:
            logger.info(f"Attempt {attempt}: executing SQL")
            result = execute_query(sql, engine)
            logger.info(f"Success on attempt {attempt}")
            return {
                "sql": sql,
                "data": result,
                "attempts": attempt,
                "success": True,
                "error": None
            }
        except Exception as e:
            last_error = str(e)
            logger.warning(f"Attempt {attempt} failed: {last_error}")

            if attempt < settings.max_retries:
                logger.info("Sending error to LLM for correction...")
                correction_prompt = build_correction_prompt(
                    schema=schema,
                    question=question,
                    failed_sql=sql,
                    error=last_error
                )
                sql = await generate_sql(correction_prompt)
                logger.info(f"LLM corrected SQL: {sql}")

    return {
        "sql": sql,
        "data": [],
        "attempts": settings.max_retries,
        "success": False,
        "error": last_error
    }
