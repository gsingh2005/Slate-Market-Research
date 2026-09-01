import math
import random
from datetime import date, timedelta

from app.schemas import Bar, SymbolProfile

SYMBOLS = {
    "AAPL": ("Apple Inc.", "Technology", "Consumer Electronics", 228.0, 3.35e12),
    "MSFT": ("Microsoft Corporation", "Technology", "Software - Infrastructure", 417.0, 3.10e12),
    "NVDA": ("NVIDIA Corporation", "Technology", "Semiconductors", 124.0, 2.95e12),
    "AMZN": ("Amazon.com, Inc.", "Consumer Cyclical", "Internet Retail", 183.0, 1.93e12),
    "GOOGL": (
        "Alphabet Inc.",
        "Communication Services",
        "Internet Content & Information",
        178.0,
        2.15e12,
    ),
    "JPM": ("JPMorgan Chase & Co.", "Financial Services", "Banks - Diversified", 208.0, 0.59e12),
    "XOM": ("Exxon Mobil Corporation", "Energy", "Oil & Gas Integrated", 116.0, 0.50e12),
    "SPY": ("SPDR S&P 500 ETF Trust", "ETF", "Large Blend", 556.0, 0.51e12),
}


def _seed(symbol: str) -> int:
    return sum((index + 1) * ord(char) for index, char in enumerate(symbol))


def available_symbols() -> list[str]:
    return sorted(SYMBOLS)


def profile_for(symbol: str) -> SymbolProfile:
    ticker = symbol.upper()
    if ticker not in SYMBOLS:
        raise KeyError(ticker)
    name, sector, industry, _, market_cap = SYMBOLS[ticker]
    return SymbolProfile(
        symbol=ticker,
        name=name,
        sector=sector,
        industry=industry,
        description=(
            f"Offline research profile for {name}. Replace sample mode with a configured provider "
            "before relying on live figures."
        ),
        market_cap=market_cap,
        provider="deterministic-sample",
        as_of=date.today(),
    )


def bars_for(symbol: str, days: int = 520) -> list[Bar]:
    ticker = symbol.upper()
    if ticker not in SYMBOLS:
        raise KeyError(ticker)
    rng = random.Random(_seed(ticker))
    _, _, _, starting_price, _ = SYMBOLS[ticker]
    cursor = date.today() - timedelta(days=days + days // 2)
    price = starting_price * 0.72
    output: list[Bar] = []
    sequence = 0
    while len(output) < days:
        cursor += timedelta(days=1)
        if cursor.weekday() >= 5:
            continue
        cycle = math.sin(sequence / 31) * 0.005
        shock = rng.gauss(0.00045, 0.016)
        open_price = price
        close = max(2.0, open_price * (1 + shock + cycle))
        spread = abs(rng.gauss(0.009, 0.004))
        high = max(open_price, close) * (1 + spread)
        low = min(open_price, close) * max(0.1, 1 - spread)
        volume = int(8_000_000 * (1 + rng.random() * 2.8) * (1 + abs(shock) * 8))
        output.append(
            Bar(
                date=cursor,
                open=round(open_price, 2),
                high=round(high, 2),
                low=round(low, 2),
                close=round(close, 2),
                adjusted_close=round(close, 2),
                volume=volume,
            )
        )
        price = close
        sequence += 1
    return output


def fundamentals_for(symbol: str) -> dict[str, float | str | None]:
    profile = profile_for(symbol)
    seed = _seed(profile.symbol)
    return {
        "revenue_ttm": round(profile.market_cap * (0.18 + (seed % 10) / 100), 0),
        "free_cash_flow_ttm": round(profile.market_cap * (0.025 + (seed % 5) / 1000), 0),
        "pe_ratio": round(17 + (seed % 31) * 0.8, 1),
        "price_to_sales": round(2.1 + (seed % 24) * 0.28, 1),
        "gross_margin": round(0.31 + (seed % 35) / 100, 3),
        "operating_margin": round(0.12 + (seed % 25) / 100, 3),
        "debt_to_equity": round(0.25 + (seed % 120) / 100, 2),
        "revenue_growth_yoy": round(-0.03 + (seed % 29) / 100, 3),
        "source": "deterministic-sample",
    }
