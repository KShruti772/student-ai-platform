"""
Configuration settings loader.

Purpose:
- Load configuration from environment variables so secrets/config are not hard-coded.
- Export a simple `settings` object students can import.

Why this exists:
- Environment variables are the standard place for runtime configuration.
- This keeps code portable and secure (avoid committing secrets).
"""
from dataclasses import dataclass
from dotenv import load_dotenv
import os
from pathlib import Path

ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_PATH)  # loads backend/.env regardless of the current shell directory


def _csv_env(name: str, default: str) -> list[str]:
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


@dataclass
class Settings:
    # OpenAI-compatible LM Studio endpoint. FastAPI itself runs on port 8002.
    model_provider: str = os.getenv("MODEL_PROVIDER", "lmstudio")
    environment: str = os.getenv("ENVIRONMENT", os.getenv("ENV", "development"))
    openai_base_url: str = os.getenv(
        "OPENAI_BASE_URL",
        os.getenv("OPENAI_API_BASE", os.getenv("API_URL", "http://127.0.0.1:1234/v1")),
    )
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "lm-studio")
    api_url: str = openai_base_url
    model_name: str = os.getenv("MODEL_NAME", "qwen2.5-coder-7b-instruct")
    temperature: float = float(os.getenv("TEMPERATURE", "0.7"))
    max_tokens: int = int(os.getenv("MAX_TOKENS", "512"))
    ai_request_timeout: int = int(os.getenv("AI_REQUEST_TIMEOUT", "120"))
    cors_origins: list[str] = None
    redis_url: str | None = os.getenv("REDIS_URL", "")

    def __post_init__(self):
        if self.cors_origins is None:
            self.cors_origins = _csv_env(
                "CORS_ORIGINS",
                "http://localhost:3000,http://127.0.0.1:3000",
            )


settings = Settings()
