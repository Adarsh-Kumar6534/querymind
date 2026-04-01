from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    groq_api_key: str
    database_url: str
    redis_url: str
    max_retries: int = 3
    cache_ttl: int = 3600
    similarity_threshold: float = 0.92
    use_ollama: bool = False

    class Config:
        env_file = ".env"

settings = Settings()
