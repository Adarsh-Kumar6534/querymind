from sqlalchemy import text
from sqlalchemy.engine import Engine
import pandas as pd

def execute_query(sql: str, engine: Engine) -> list[dict]:
    with engine.connect() as conn:
        result = conn.execute(text(sql))
        rows = result.fetchall()
        columns = list(result.keys())
        return [dict(zip(columns, row)) for row in rows]


def get_result_as_dataframe(sql: str, engine: Engine) -> pd.DataFrame:
    return pd.read_sql(sql, engine)
