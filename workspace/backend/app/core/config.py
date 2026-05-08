from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _normalize_async_db_url(url: str) -> str:
    """Railway/Heroku style postgres:// URLs must use asyncpg for create_async_engine."""
    if "://" not in url:
        return url
    scheme, rest = url.split("://", 1)
    if scheme in ("postgres", "postgresql"):
        return f"postgresql+asyncpg://{rest}"
    if scheme == "postgresql+psycopg2":
        return f"postgresql+asyncpg://{rest}"
    return url


def _normalize_sync_db_url(url: str) -> str:
    """Alembic and sync helpers use psycopg2."""
    if "://" not in url:
        return url
    scheme, rest = url.split("://", 1)
    if scheme in ("postgres", "postgresql"):
        return f"postgresql+psycopg2://{rest}"
    if scheme == "postgresql+asyncpg":
        return f"postgresql+psycopg2://{rest}"
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    app_name: str = "ByeolDDang API"

    database_url: str = "postgresql+asyncpg://byeol:byeol@localhost:5432/byeolddang"
    database_url_sync: str = "postgresql+psycopg2://byeol:byeol@localhost:5432/byeolddang"
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret: str = "please-change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_ttl_seconds: int = 900
    jwt_refresh_ttl_seconds: int = 1_209_600

    s3_bucket: str = "byeolddang-dev"
    s3_region: str = "ap-northeast-2"
    s3_endpoint_url: str | None = None
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None

    toss_secret_key: str = "test_sk_change_me"
    toss_client_key: str = "test_ck_change_me"

    cors_origins: str = "http://localhost:3000"

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, v: object) -> object:  # noqa: ANN401 — pydantic coerces
        if isinstance(v, str):
            return _normalize_async_db_url(v)
        return v

    @field_validator("database_url_sync", mode="before")
    @classmethod
    def normalize_database_url_sync(cls, v: object) -> object:
        if isinstance(v, str):
            return _normalize_sync_db_url(v)
        return v

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
