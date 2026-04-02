import redis
import json
import numpy as np
from config import settings
import hashlib
import logging
import asyncio

logger = logging.getLogger(__name__)

CACHE_TIMEOUT_SECONDS = 10  # Fail fast if cache takes too long

# Lazy singletons — initialized on first use, not at import time
_redis_client = None
_model = None
_model_load_attempted = False

def _get_redis():
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}")
            return None
    return _redis_client

def _get_model():
    global _model, _model_load_attempted
    if _model_load_attempted:
        return _model
    _model_load_attempted = True
    try:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        return _model
    except Exception as e:
        logger.warning(f"Failed to load embedding model: {e}")
        return None


CACHE_INDEX_KEY = "querymind:cache_index"

def _embed(text: str) -> list[float]:
    return _get_model().encode(text).tolist()

def _cosine_similarity(a: list, b: list) -> float:
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

async def cache_get(question: str) -> dict | None:
    async def _do_cache_get():
        r = _get_redis()
        if r is None:
            return None

        index_raw = r.get(CACHE_INDEX_KEY)
        if not index_raw:
            return None

        index = json.loads(index_raw)

        model = _get_model()
        if model is None:
            return None

        query_embedding = _embed(question)

        best_score = 0
        best_key = None

        for entry in index:
            score = _cosine_similarity(query_embedding, entry["embedding"])
            if score > best_score:
                best_score = score
                best_key = entry["key"]

        if best_score >= settings.similarity_threshold and best_key:
            cached = r.get(best_key)
            if cached:
                result = json.loads(cached)
                result["from_cache"] = True
                result["cache_score"] = round(best_score, 4)
                return result
        return None

    try:
        return await asyncio.wait_for(_do_cache_get(), timeout=CACHE_TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        logger.warning("Cache get timed out")
        return None
    except Exception as e:
        logger.warning(f"Cache get failed: {e}")
        return None


async def cache_set(question: str, result: dict) -> None:
    async def _do_cache_set():
        r = _get_redis()
        if r is None:
            return

        model = _get_model()
        if model is None:
            return

        key = f"querymind:result:{hashlib.md5(question.encode()).hexdigest()}"
        embedding = _embed(question)

        serializable = json.loads(json.dumps(result, default=str))
        r.setex(key, settings.cache_ttl, json.dumps(serializable))

        index_raw = r.get(CACHE_INDEX_KEY)
        index = json.loads(index_raw) if index_raw else []
        index.append({"key": key, "embedding": embedding, "question": question})
        r.set(CACHE_INDEX_KEY, json.dumps(index))

    try:
        await asyncio.wait_for(_do_cache_set(), timeout=CACHE_TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        logger.warning("Cache set timed out")
    except Exception as e:
        logger.warning(f"Cache set failed: {e}")

