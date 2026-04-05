from sqlalchemy import inspect, text
import logging
import time
from db.connection import engine

logger = logging.getLogger(__name__)

# Simple in-memory cache
_schema_cache = {
    "string": None,
    "tables": [],
    "expiry": 0
}
CACHE_TTL = 300 # 5 minutes

def get_schema_string() -> str:
    global _schema_cache
    now = time.time()
    
    # Return cached version if still valid
    if _schema_cache["string"] and now < _schema_cache["expiry"]:
        return _schema_cache["string"]

    schema_parts = []
    try:
        with engine.connect() as conn:
            inspector = inspect(conn)
            tables = inspector.get_table_names()
            
            for table_name in tables:
                if table_name in ("query_history", "spatial_ref_sys") or table_name.startswith("pg_"):
                    continue

                try:
                    columns = inspector.get_columns(table_name)
                    pk = inspector.get_pk_constraint(table_name)
                    
                    col_definitions = [f"  - {c['name']} ({str(c['type'])})" for c in columns]
                    
                    # Very fast sample data check
                    sample_data_str = ""
                    try:
                        res = conn.execute(text(f'SELECT * FROM "{table_name}" LIMIT 2'))
                        rows = res.fetchall()
                        if rows:
                            sample_data_str = "\nSample: " + str([dict(zip(res.keys(), r)) for r in rows])
                    except:
                        pass

                    table_block = f"Table: {table_name}\nCols:\n" + "\n".join(col_definitions) + sample_data_str
                    schema_parts.append(table_block)
                except:
                    continue
        
        full_schema = "\n\n".join(schema_parts) if schema_parts else "No tables found."
        _schema_cache["string"] = full_schema
        _schema_cache["tables"] = tables
        _schema_cache["expiry"] = now + CACHE_TTL
        return full_schema

    except Exception as e:
        logger.error(f"[INTROSPECT] Failure: {e}")
        return _schema_cache["string"] or "Schema temporarily unavailable."

def get_table_names() -> list[str]:
    global _schema_cache
    if _schema_cache["tables"] and time.time() < _schema_cache["expiry"]:
        return _schema_cache["tables"]
        
    try:
        with engine.connect() as conn:
            return inspect(conn).get_table_names()
    except:
        return []
