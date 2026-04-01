from sqlalchemy import text
from db.connection import engine

def ensure_history_table():
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS query_history (
                id SERIAL PRIMARY KEY,
                question TEXT NOT NULL,
                generated_sql TEXT NOT NULL,
                row_count INTEGER,
                attempts INTEGER DEFAULT 1,
                success BOOLEAN DEFAULT TRUE,
                error_message TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """))
        conn.commit()


def save_query(question: str, sql: str, row_count: int,
               attempts: int, success: bool, error: str = None):
    try:
        with engine.connect() as conn:
            conn.execute(text("""
                INSERT INTO query_history
                (question, generated_sql, row_count, attempts, success, error_message)
                VALUES (:q, :sql, :rc, :att, :suc, :err)
            """), {
                "q": question, "sql": sql, "rc": row_count,
                "att": attempts, "suc": success, "err": error
            })
            conn.commit()
    except Exception as e:
        pass


def get_history(limit: int = 20) -> list[dict]:
    try:
        with engine.connect() as conn:
            rows = conn.execute(text("""
                SELECT question, generated_sql, row_count, attempts,
                       success, created_at
                FROM query_history
                ORDER BY created_at DESC
                LIMIT :limit
            """), {"limit": limit}).fetchall()
            return [dict(r._mapping) for r in rows]
    except Exception:
        return []
