FEW_SHOT_EXAMPLES = """
Example 1:
Question: How many transactions happened last month?
SQL: SELECT COUNT(*) FROM transactions WHERE created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') AND created_at < date_trunc('month', CURRENT_DATE)

Example 2:
Question: What is the average transaction amount per account?
SQL: SELECT account_id, AVG(amount) as avg_amount FROM transactions GROUP BY account_id ORDER BY avg_amount DESC

Example 3:
Question: Show me the top 5 accounts by total spending
SQL: SELECT account_id, SUM(amount) as total_spent FROM transactions GROUP BY account_id ORDER BY total_spent DESC LIMIT 5
"""

def build_prompt(schema: str, question: str) -> str:
    return f"""You are an expert PostgreSQL SQL generator.

DATABASE SCHEMA:
{schema}

RULES:
1. Use ONLY the tables and columns that exist in the schema above
2. Write valid PostgreSQL syntax only
3. Use proper JOINs when referencing multiple tables
4. Always use table aliases for clarity
5. Return ONLY the raw SQL query — no explanation, no backticks, no markdown
6. If aggregating, always include GROUP BY
7. Prefer LIMIT 100 on large result sets unless the user specifies otherwise

FEW-SHOT EXAMPLES:
{FEW_SHOT_EXAMPLES}

USER QUESTION: {question}

SQL:"""


def build_correction_prompt(schema: str, question: str, failed_sql: str, error: str) -> str:
    return f"""You are an expert PostgreSQL SQL debugger.

The following SQL query failed with an error. Fix it.

DATABASE SCHEMA:
{schema}

ORIGINAL QUESTION: {question}

FAILED SQL:
{failed_sql}

ERROR MESSAGE:
{error}

RULES:
1. Analyze the error carefully
2. Fix the exact issue — do not rewrite unnecessarily
3. Use ONLY tables and columns from the schema above
4. Return ONLY the corrected raw SQL — no explanation, no backticks

CORRECTED SQL:"""
