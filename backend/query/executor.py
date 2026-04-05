from sqlalchemy import text
from sqlalchemy.engine import Engine
import pandas as pd
import logging

logger = logging.getLogger(__name__)

def execute_query(sql: str, engine: Engine) -> list[dict]:
    """Execute SQL query and return results as list of dicts."""
    with engine.connect() as conn:
        logger.info(f"Executing SQL on DB...")
        # Set statement timeout to 30 seconds
        conn.execute(text("SET statement_timeout = 30000"))
        result = conn.execute(
            text(sql),
            execution_options={"stream_results": True}
        )
        rows = result.fetchall()
        columns = list(result.keys())
        logger.info(f"Query returned {len(rows)} rows")
        return [dict(zip(columns, row)) for row in rows]


def get_result_as_dataframe(sql: str, engine: Engine) -> pd.DataFrame:
    return pd.read_sql(sql, engine)
