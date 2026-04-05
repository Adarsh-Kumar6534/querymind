import pandas as pd
import io
import re
from db.connection import engine

def sanitize_name(name: str) -> str:
    name = re.sub(r'[^a-zA-Z0-9_]', '_', name.lower().strip())
    if name and name[0].isdigit():
        name = f"col_{name}"
    return name or "unnamed"

def infer_pg_type(dtype) -> str:
    if "int" in str(dtype): return "BIGINT"
    if "float" in str(dtype): return "DOUBLE PRECISION"
    if "bool" in str(dtype): return "BOOLEAN"
    if "datetime" in str(dtype): return "TIMESTAMP"
    return "TEXT"

def upload_csv_to_postgres(file_bytes: bytes, original_filename: str) -> dict:
    # Decode bytes to string, handling different encodings
    try:
        file_str = file_bytes.decode('utf-8')
    except UnicodeDecodeError:
        file_str = file_bytes.decode('latin-1')

    # Read CSV with better error handling
    df = pd.read_csv(
        io.StringIO(file_str),
        on_bad_lines='skip',
        skipinitialspace=True
    )

    if df.empty:
        raise ValueError("CSV file is empty")

    df.columns = [sanitize_name(c) for c in df.columns]
    table_name = sanitize_name(original_filename.replace(".csv", ""))

    df.to_sql(table_name, engine, if_exists="replace", index=False)

    return {
        "table_name": table_name,
        "row_count": len(df),
        "columns": list(df.columns),
        "dtypes": {col: str(df[col].dtype) for col in df.columns}
    }
