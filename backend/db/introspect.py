from sqlalchemy import inspect
from db.connection import engine

def get_schema_string() -> str:
    inspector = inspect(engine)
    schema_parts = []

    for table_name in inspector.get_table_names():
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

        table_block = f"Table: {table_name}\nColumns:\n"
        table_block += "\n".join(col_definitions)
        if fk_parts:
            table_block += "\nForeign Keys:\n" + "\n".join(fk_parts)

        schema_parts.append(table_block)

    return "\n\n".join(schema_parts)


def get_table_names() -> list[str]:
    inspector = inspect(engine)
    return inspector.get_table_names()
