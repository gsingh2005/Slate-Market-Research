import os
from dataclasses import dataclass


def _truthy(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env(primary: str, legacy: str | None = None, default: str = "") -> str:
    return os.getenv(primary) or (os.getenv(legacy) if legacy else None) or default


def _database_url(value: str) -> str:
    if value.startswith("postgres://"):
        return value.replace("postgres://", "postgresql+psycopg://", 1)
    if value.startswith("postgresql://"):
        return value.replace("postgresql://", "postgresql+psycopg://", 1)
    return value


@dataclass(frozen=True)
class Settings:
    environment: str = _env("APP_ENV", "SLATE_ENV", "development").strip().lower()
    database_url: str = _database_url(
        _env("DATABASE_URL", "SLATE_DATABASE_URL", "sqlite:///./data/slate.db").strip()
    )
    offline_mode: bool = _truthy(os.getenv("SLATE_OFFLINE_MODE", "true"))
    allowed_origins: tuple[str, ...] = tuple(
        item.strip()
        for item in _env(
            "ALLOWED_ORIGINS",
            "SLATE_ALLOWED_ORIGINS",
            "http://localhost:3000,http://localhost:4173,https://gsingh2005.github.io",
        ).split(",")
        if item.strip()
    )
    alpha_vantage_key: str | None = _env("ALPHA_VANTAGE_API_KEY", "SLATE_ALPHA_VANTAGE_KEY") or None
    fred_api_key: str | None = _env("FRED_API_KEY", "SLATE_FRED_API_KEY") or None
    sec_user_agent: str | None = _env("SEC_USER_AGENT", "SLATE_SEC_USER_AGENT") or None
    log_level: str = os.getenv("LOG_LEVEL", "INFO").upper()
    provider_timeout_seconds: float = float(os.getenv("PROVIDER_TIMEOUT_SECONDS", "10"))
    provider_max_retries: int = int(os.getenv("PROVIDER_MAX_RETRIES", "2"))
    frontend_dist_dir: str | None = os.getenv("SLATE_FRONTEND_DIST_DIR") or None
    seed_demo_data: bool = _truthy(
        os.getenv(
            "SLATE_SEED_DEMO_DATA",
            "false" if _env("APP_ENV", "SLATE_ENV") == "production" else "true",
        )
    )

    def validate(self) -> None:
        if self.environment != "production" and "*" in self.allowed_origins:
            raise RuntimeError(
                "SLATE_ALLOWED_ORIGINS must use explicit origins; wildcard CORS is not supported."
            )
        if self.provider_timeout_seconds <= 0 or self.provider_max_retries < 0:
            raise RuntimeError("Provider timeout and retry settings must be non-negative.")


settings = Settings()
