from functools import lru_cache

from pydantic import model_validator
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

    @model_validator(mode="after")
    def validate_production_configuration(self):
        if self.app_env.lower() in {"prod", "production"}:
            if self.secret_key == "change-this-development-secret-before-production" or self.secret_key.lower().startswith("replace-") or len(self.secret_key) < 32:
                raise ValueError("Production requires a SECRET_KEY of at least 32 characters")
            if self.database_url.startswith("postgresql+psycopg://erp:erp@") or "replace-this-development-database-password" in self.database_url:
                raise ValueError("Production requires non-default database credentials")
            if any(origin.strip() == "*" for origin in self.cors_origins.split(",")):
                raise ValueError("Production CORS origins must be explicit")
            if not self.smtp_host or not self.smtp_from:
                raise ValueError("Production password recovery requires SMTP_HOST and SMTP_FROM")
            if self.frontend_url.startswith("http://"):
                raise ValueError("Production FRONTEND_URL must use HTTPS")
        return self

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
