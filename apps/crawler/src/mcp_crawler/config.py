"""Configuración cargada desde .env."""

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    postgres_url: str
    github_token: str
    github_user_agent: str = "mcp-studio-crawler/0.1"

    # LLM categorisation (opcional)
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-haiku-4-5"

    @field_validator("postgres_url")
    @classmethod
    def _force_psycopg_v3(cls, v: str) -> str:
        # SQLAlchemy default es psycopg2; forzamos v3 con el prefijo +psycopg.
        if v.startswith("postgresql://"):
            return "postgresql+psycopg://" + v.removeprefix("postgresql://")
        if v.startswith("postgres://"):
            return "postgresql+psycopg://" + v.removeprefix("postgres://")
        return v


settings = Settings()  # type: ignore[call-arg]
