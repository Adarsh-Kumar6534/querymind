from sqlalchemy import inspect, text
import logging
from db.connection import engine

logger = logging.getLogger(__name__)

def get_schema_string() -> str:
    schema_parts = []
    
    try:
        with engine.connect() as conn:
            # Use the connection-bound inspector for better reliability
            inspector = inspect(conn)
            tables = inspector.get_table_names()
            logger.info(f"[INTROSPECT] Found {len(tables)} tables")

            for table_name in tables:
                # Skip system and history tables
                if table_name in ("query_history", "spatial_ref_sys") or table_name.startswith("pg_"):
                    continue

                try:
                    columns = inspector.get_columns(table_name)
                    pk = inspector.get_pk_constraint(table_name)
                    
                    col_definitions = []
                    for col in columns:
                        col_str = f"  - {col['name']} ({str(col['type'])})"
                        if col['name'] in (pk.get('constrained_columns') or []):
                            col_str += " PRIMARY KEY"
                        col_definitions.append(col_str)

                    # Get sample rows with a timeout-safe approach
                    sample_data_str = ""
                    try:
                        # Use double quotes for table names to handle special characters
                        res = conn.execute(text(f'SELECT * FROM "{table_name}" LIMIT 3'))
                        rows = res.fetchall()
                        if rows:
                            sample_data_str = "\nSample Rows:\n"
                            cols = res.keys()
                            for row in rows:
                                row_dict = dict(zip(cols, row))
                                sample_data_str += f"  {row_dict}\n"
                    except Exception as row_err:
                        logger.warning(f"[INTROSPECT] Could not get rows for {table_name}: {row_err}")
                        sample_data_str = "\n(Sample data unavailable)"

                    table_block = f"Table: {table_name}\nColumns:\n" + "\n".join(col_definitions)
                    if sample_data_str:
                        table_block += sample_data_str
                    
                    schema_parts.append(table_block)
                except Exception as table_err:
                    logger.warning(f"[INTROSPECT] Skipping table {table_name} due to error: {table_err}")
                    continue

    except Exception as e:
        logger.error(f"[INTROSPECT] Critical failure: {e}")
        # Return a basic message rather than crashing, to avoid 503
        return "Schema temporarily unavailable. Please try again."

    return "\n\n".join(schema_parts) if schema_parts else "No user tables found."


def get_table_names() -> list[str]:
    inspector = inspect(engine)
    return inspector.get_table_names()
