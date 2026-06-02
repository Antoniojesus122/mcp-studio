"""Configuración cargada desde .env."""

from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

LLMProvider = Literal["auto", "gemini", "groq", "anthropic", "heuristic"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    postgres_url: str
    github_token: str
    github_user_agent: str = "mcp-studio-crawler/0.1"

    # ------------------------------------------------------------------
    # LLM provider for categorisation. "auto" picks the first one
    # with credentials. "heuristic" never calls an LLM.
    # ------------------------------------------------------------------
    llm_provider: LLMProvider = "auto"

    # Anthropic
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-haiku-4-5"

    # Google Gemini (free tier — recomendado)
    google_api_key: str | None = None
    gemini_model: str = "gemini-2.0-flash"

    # Groq (free tier — Llama 3.3 70B muy rápido)
    groq_api_key: str | None = None
    groq_model: str = "llama-3.3-70b-versatile"

    @field_validator("postgres_url")
    @classmethod
    def _force_psycopg_v3(cls, v: str) -> str:
        if v.startswith("postgresql://"):
            return "postgresql+psycopg://" + v.removeprefix("postgresql://")
        if v.startswith("postgres://"):
            return "postgresql+psycopg://" + v.removeprefix("postgres://")
        return v

    def resolved_provider(self) -> LLMProvider:
        """Devuelve el provider efectivo basado en las keys disponibles."""
        if self.llm_provider != "auto":
            return self.llm_provider
        if self.google_api_key:
            return "gemini"
        if self.groq_api_key:
            return "groq"
        if self.anthropic_api_key:
            return "anthropic"
        return "heuristic"


settings = Settings()  # type: ignore[call-arg]
