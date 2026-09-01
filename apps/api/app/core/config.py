import os
from dataclasses import dataclass


def _truthy(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    environment: str = os.getenv("SLATE_ENV", "development").strip().lower()
    database_url: str = os.getenv("SLATE_DATABASE_URL", "sqlite:///./data/slate.db").strip()
    offline_mode: bool = _truthy(os.getenv("SLATE_OFFLINE_MODE", "true"))
    allowed_origins: tuple[str, ...] = tuple(
        item.strip()
        for item in os.getenv("SLATE_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    )
    alpha_vantage_key: str | None = os.getenv("SLATE_ALPHA_VANTAGE_KEY") or None
    fred_api_key: str | None = os.getenv("SLATE_FRED_API_KEY") or None
    sec_user_agent: str | None = os.getenv("SLATE_SEC_USER_AGENT") or None

    def validate(self) -> None:
        if self.environment == "production" and not os.getenv("SLATE_DATABASE_URL"):
            raise RuntimeError("SLATE_DATABASE_URL must be set when SLATE_ENV=production.")
        if self.environment == "production" and not os.getenv("SLATE_ALLOWED_ORIGINS"):
            raise RuntimeError("SLATE_ALLOWED_ORIGINS must be set when SLATE_ENV=production.")
        if "*" in self.allowed_origins:
            raise RuntimeError(
                "SLATE_ALLOWED_ORIGINS must use explicit origins; wildcard CORS is not supported."
            )


settings = Settings()
