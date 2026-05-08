from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


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

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
