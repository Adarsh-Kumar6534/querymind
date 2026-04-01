import redis
import json
import numpy as np
from sentence_transformers import SentenceTransformer
from config import settings
import hashlib

_redis = redis.from_url(settings.redis_url, decode_responses=True)
_model = SentenceTransformer("all-MiniLM-L6-v2")

CACHE_INDEX_KEY = "querymind:cache_index"

def _embed(text: str) -> list[float]:
    return _model.encode(text).tolist()

def _cosine_similarity(a: list, b: list) -> float:
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

async def cache_get(question: str) -> dict | None:
    try:
        index_raw = _redis.get(CACHE_INDEX_KEY)
        if not index_raw:
            return None

        index = json.loads(index_raw)
        query_embedding = _embed(question)

        best_score = 0
        best_key = None

        for entry in index:
            score = _cosine_similarity(query_embedding, entry["embedding"])
            if score > best_score:
                best_score = score
                best_key = entry["key"]

        if best_score >= settings.similarity_threshold and best_key:
            cached = _redis.get(best_key)
            if cached:
                result = json.loads(cached)
                result["from_cache"] = True
                result["cache_score"] = round(best_score, 4)
                return result
    except Exception as e:
        pass
    return None


async def cache_set(question: str, result: dict) -> None:
    try:
        key = f"querymind:result:{hashlib.md5(question.encode()).hexdigest()}"
        embedding = _embed(question)

        serializable = json.loads(json.dumps(result, default=str))
        _redis.setex(key, settings.cache_ttl, json.dumps(serializable))

        index_raw = _redis.get(CACHE_INDEX_KEY)
        index = json.loads(index_raw) if index_raw else []
        index.append({"key": key, "embedding": embedding, "question": question})
        _redis.set(CACHE_INDEX_KEY, json.dumps(index))
    except Exception as e:
        pass
