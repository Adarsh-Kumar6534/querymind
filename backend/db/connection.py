from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config import settings
import logging

logger = logging.getLogger(__name__)

def _make_engine():
    url = settings.database_url
    # Fix for Render/Heroku/Neon providing postgres:// instead of postgresql://
    if url and url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    connect_args = {
        "connect_timeout": 15,  # Slightly increased connection timeout
    }
    # Only require SSL for cloud-hosted Postgres (Neon, Render, etc.)
    if "neon.tech" in url or "render.com" in url or "elephantsql.com" in url:
        connect_args["sslmode"] = "require"

    try:
        engine = create_engine(
            url,
            echo=False,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
            connect_args=connect_args
        )
        return engine
    except Exception as e:
        logger.error(f"[DB] Failed to create engine: {e}")
        raise

try:
    engine = _make_engine()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    # Test connection at startup
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info("[DB] Connection test successful")
except Exception as e:
    import sys
    print(f"[STARTUP ERROR] Could not create DB engine: {e}", file=sys.stderr)
    raise

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
