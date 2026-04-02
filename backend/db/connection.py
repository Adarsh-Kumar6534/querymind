from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config import settings

def _make_engine():
    url = settings.database_url
    kwargs = dict(echo=False, pool_pre_ping=True, pool_size=5, max_overflow=10)
    # Only require SSL for cloud-hosted Postgres (Neon, Render, etc.)
    if "neon.tech" in url or "render.com" in url:
        kwargs["connect_args"] = {"sslmode": "require"}
    return create_engine(url, **kwargs)

try:
    engine = _make_engine()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
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
