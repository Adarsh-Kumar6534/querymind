import redis
import json
import numpy as np
from config import settings
import hashlib
import logging
import os

logger = logging.getLogger(__name__)

# Lazy singletons
_redis_client = None
_model = None
_model_load_attempted = False

def _get_redis():
    global _redis_client
    if _redis_client is None:
        if not settings.redis_url:
            return None
        try:
            _redis_client = redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2
            )
            _redis_client.ping()
        except Exception as e:
            logger.warning(f"[CACHE] Redis connection failed: {e}")
            return None
    return _redis_client

def _get_model():
    global _model, _model_load_attempted
    # Disable semantic cache on Render by default to save RAM/Time unless explicitly enabled
    if os.environ.get("DISABLE_SEMANTIC_CACHE", "true").lower() == "true":
        return None
        
    if _model_load_attempted:
        return _model
    _model_load_attempted = True
    try:
        logger.info("[CACHE] Loading embedding model (this may take a while on first run)...")
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("[CACHE] Embedding model loaded successfully.")
        return _model
    except Exception as e:
        logger.warning(f"[CACHE] Failed to load embedding model: {e}")
        return None


CACHE_INDEX_KEY = "querymind:cache_index"

def _embed(text: str) -> list[float]:
    model = _get_model()
    if model is None:
        return None
    return model.encode(text).tolist()

def _cosine_similarity(a: list, b: list) -> float:
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def cache_get(question: str) -> dict | None:
    """Get cached result for similar question. Returns None if no cache hit."""
    try:
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
        if query_embedding is None:
            return None

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
                logger.info(f"[CACHE] Hit with score {best_score:.2f}")
                return result
        return None
    except Exception as e:
        logger.warning(f"Cache get failed: {e}")
        return None


def cache_set(question: str, result: dict) -> None:
    """Cache query result with embedding for future similarity matching."""
    try:
        r = _get_redis()
        if r is None:
            return

        model = _get_model()
        if model is None:
            return

        key = f"querymind:result:{hashlib.md5(question.encode()).hexdigest()}"
        embedding = _embed(question)
        if embedding is None:
            return

        serializable = json.loads(json.dumps(result, default=str))
        r.setex(key, settings.cache_ttl, json.dumps(serializable))

        index_raw = r.get(CACHE_INDEX_KEY)
        index = json.loads(index_raw) if index_raw else []
        index.append({"key": key, "embedding": embedding, "question": question})
        r.set(CACHE_INDEX_KEY, json.dumps(index))
        logger.info(f"[CACHE] Stored result for question")
    except Exception as e:
        logger.warning(f"Cache set failed: {e}")

