"""Provider boundaries. Live clients are intentionally optional in local/offline mode."""

import csv
from pathlib import Path
from typing import Protocol

from app import sample_data
from app.schemas import Bar, SymbolProfile


class MarketDataProvider(Protocol):
    name: str

    def profile(self, symbol: str) -> SymbolProfile: ...
    def bars(self, symbol: str) -> list[Bar]: ...
    def fundamentals(self, symbol: str) -> dict[str, float | str | None]: ...


class SampleProvider:
    name = "deterministic-sample"

    def profile(self, symbol: str) -> SymbolProfile:
        return sample_data.profile_for(symbol)

    def bars(self, symbol: str) -> list[Bar]:
        return sample_data.bars_for(symbol)

    def fundamentals(self, symbol: str) -> dict[str, float | str | None]:
        return sample_data.fundamentals_for(symbol)


class CsvProvider(SampleProvider):
    """Read normalized OHLCV CSV files while falling back to sample metadata."""

    name = "csv"

    def __init__(self, directory: str):
        self.directory = Path(directory)

    def bars(self, symbol: str) -> list[Bar]:
        file_path = self.directory / f"{symbol.upper()}.csv"
        if not file_path.exists():
            raise FileNotFoundError(file_path)
        with file_path.open(newline="") as handle:
            return [Bar.model_validate(row) for row in csv.DictReader(handle)]


class StooqProvider:
    name = "stooq"

    def profile(self, symbol: str) -> SymbolProfile:
        raise NotImplementedError("Stooq supplies EOD prices; pair it with a profile provider.")

    def bars(self, symbol: str) -> list[Bar]:
        raise NotImplementedError("Configure a network client before enabling Stooq in production.")

    def fundamentals(self, symbol: str) -> dict[str, float | str | None]:
        raise NotImplementedError("Stooq does not provide fundamentals.")


class AlphaVantageProvider(StooqProvider):
    name = "alpha-vantage"


class SecEdgarFundamentalsProvider:
    name = "sec-edgar"

    def fundamentals(self, symbol: str) -> dict[str, float | str | None]:
        raise NotImplementedError(
            "Map tickers to SEC CIKs and configure a descriptive User-Agent in production."
        )


class FredMacroProvider:
    name = "fred"

    def series(self, series_id: str) -> list[dict[str, str | float]]:
        raise NotImplementedError("Configure FRED_API_KEY to retrieve macro observations.")
