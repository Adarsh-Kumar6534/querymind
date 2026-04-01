from groq import Groq
import httpx
from config import settings

groq_client = Groq(api_key=settings.groq_api_key)

async def generate_sql(prompt: str) -> str:
    if settings.use_ollama:
        return await _ollama_generate(prompt)

    completion = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert PostgreSQL query generator. "
                    "Always return ONLY the raw SQL query with no explanation, "
                    "no markdown, no backticks, no comments. "
                    "The query must be valid PostgreSQL syntax."
                )
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.1,
        max_tokens=512,
    )
    raw = completion.choices[0].message.content.strip()
    return _clean_sql(raw)


async def _ollama_generate(prompt: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.ollama_url}/api/generate",
            json={"model": "sqlcoder", "prompt": prompt, "stream": False},
            timeout=60.0
        )
        return _clean_sql(response.json()["response"])


def _clean_sql(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1])
    return raw.strip().rstrip(";")
