from sqlalchemy import inspect, text
from db.connection import engine

def get_schema_string() -> str:
    inspector = inspect(engine)
    schema_parts = []

    for table_name in inspector.get_table_names():
        # Skip system and history tables
        if table_name in ("query_history", "spatial_ref_sys"):
            continue

        columns = inspector.get_columns(table_name)
        foreign_keys = inspector.get_foreign_keys(table_name)
        pk = inspector.get_pk_constraint(table_name)

        col_definitions = []
        for col in columns:
            col_str = f"  - {col['name']} ({str(col['type'])})"
            if col['name'] in (pk.get('constrained_columns') or []):
                col_str += " PRIMARY KEY"
            if not col.get('nullable', True):
                col_str += " NOT NULL"
            col_definitions.append(col_str)

        fk_parts = []
        for fk in foreign_keys:
            fk_parts.append(
                f"  - FK: {fk['constrained_columns']} -> "
                f"{fk['referred_table']}.{fk['referred_columns']}"
            )

        # Get 3 sample rows to help the LLM understand column values
        sample_data_str = ""
        try:
            with engine.connect() as conn:
                result = conn.execute(text(f"SELECT * FROM {table_name} LIMIT 3"))
                rows = result.fetchall()
                if rows:
                    sample_data_str = "\nSample Rows:\n"
                    cols = result.keys()
                    for row in rows:
                        row_dict = dict(zip(cols, row))
                        sample_data_str += f"  {row_dict}\n"
        except Exception as e:
            sample_data_str = f"\n(Could not retrieve sample data: {e})"

        table_block = f"Table: {table_name}\nColumns:\n"
        table_block += "\n".join(col_definitions)
        if fk_parts:
            table_block += "\nForeign Keys:\n" + "\n".join(fk_parts)
        if sample_data_str:
            table_block += sample_data_str

        schema_parts.append(table_block)

    return "\n\n".join(schema_parts)


def get_table_names() -> list[str]:
    inspector = inspect(engine)
    return inspector.get_table_names()
