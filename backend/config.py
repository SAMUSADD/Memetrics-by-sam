import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel

# Load environment variables from standard locations
for candidate in (
    Path(__file__).resolve().parent / ".env",
    Path(__file__).resolve().parent.parent / ".env",
):
    if candidate.exists():
        load_dotenv(candidate)


class Settings(BaseModel):
    cors_origins: list[str] = ["*"]
    app_name: str = "MeMetrics SuperApp"
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


settings = Settings()