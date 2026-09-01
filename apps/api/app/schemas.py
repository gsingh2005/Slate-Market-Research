from datetime import date

from typing import Any

from pydantic import BaseModel, Field, field_validator, model_validator


class Bar(BaseModel):
    date: date
    open: float
    high: float
    low: float
    close: float
    adjusted_close: float
    volume: int


class SymbolProfile(BaseModel):
    symbol: str
    name: str
    sector: str
    industry: str
    description: str
    market_cap: float
    provider: str
    as_of: date


class ResearchSnapshot(BaseModel):
    profile: SymbolProfile
    bars: list[Bar]
    metrics: dict[str, float | None]
    indicators: dict[str, list[float | None]]
    fundamentals: dict[str, float | str | None]
    scores: dict[str, Any]
    risks: list[str]
    data_notes: list[str]


class WatchlistInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    symbols: list[str] = Field(default_factory=list)


class WatchlistOutput(BaseModel):
    id: str
    name: str
    symbols: list[str]


class BacktestInput(BaseModel):
    symbols: list[str] = Field(min_length=1, max_length=25)
    start: date | None = None
    end: date | None = None
    rebalance_days: int = Field(default=21, ge=5, le=126)
    lookback_days: int = Field(default=126, ge=30, le=504)
    transaction_cost_bps: float = Field(default=5, ge=0, le=100)

    @field_validator("symbols")
    @classmethod
    def validate_symbols(cls, symbols: list[str]) -> list[str]:
        normalized = [symbol.strip().upper() for symbol in symbols]
        if any(not symbol.isalpha() or len(symbol) > 8 for symbol in normalized):
            raise ValueError("Symbols must be 1-8 alphabetic characters.")
        return normalized

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start and self.end and self.start > self.end:
            raise ValueError("Start date must not be later than end date.")
        return self
