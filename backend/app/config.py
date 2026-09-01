from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Elevate ERP API"
    api_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://erp:erp@db:5432/elevate_erp"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    secret_key: str = "change-this-development-secret-before-production"
    access_token_minutes: int = 480
    app_env: str = "development"
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from: str | None = None
    frontend_url: str = "http://127.0.0.1:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
