from llm.groq_client import generate_sql
from llm.prompt_builder import build_correction_prompt
from query.executor import execute_query
from config import settings
import logging
import asyncio

logger = logging.getLogger(__name__)

QUERY_TIMEOUT_SECONDS = 60  # Total timeout for entire query process

async def execute_with_self_correction(
    initial_sql: str,
    schema: str,
    question: str,
    engine
) -> dict:
    sql = initial_sql
    last_error = None

    async def _execute_attempt(attempt: int):
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

    for attempt in range(1, settings.max_retries + 1):
        try:
            result = await asyncio.wait_for(
                _execute_attempt(attempt),
                timeout=30  # 30s per execution attempt
            )
            return result
        except asyncio.TimeoutError:
            last_error = f"Query execution timed out after 30 seconds (attempt {attempt})"
            logger.warning(f"Attempt {attempt} timed out: {last_error}")
        except Exception as e:
            last_error = str(e)
            logger.warning(f"Attempt {attempt} failed: {last_error}")

        if attempt < settings.max_retries:
            try:
                logger.info("Sending error to LLM for correction...")
                correction_prompt = build_correction_prompt(
                    schema=schema,
                    question=question,
                    failed_sql=sql,
                    error=last_error
                )
                sql = await generate_sql(correction_prompt)
                logger.info(f"LLM corrected SQL: {sql}")
            except asyncio.TimeoutError:
                last_error = "LLM correction timed out"
                logger.error(f"LLM correction timed out on attempt {attempt}")
                break
            except Exception as e:
                last_error = str(e)
                logger.error(f"LLM correction failed: {e}")
                break

    return {
        "sql": sql,
        "data": [],
        "attempts": attempt,
        "success": False,
        "error": last_error
    }
