import uuid
from datetime import date

from sqlalchemy.orm import Session

from app.adapters import MarketDataProvider, SampleProvider
from app.analytics import indicator_set, snapshot_metrics
from app.models import Watchlist
from app.sample_data import available_symbols
from app.schemas import BacktestInput, ResearchSnapshot, WatchlistInput, WatchlistOutput

provider: MarketDataProvider = SampleProvider()


def research(symbol: str) -> ResearchSnapshot:
    bars = provider.bars(symbol)
    profile = provider.profile(symbol)
    benchmark = provider.bars("SPY")
    indicators = indicator_set(bars)
    metrics = snapshot_metrics(bars, benchmark)
    last_rsi = next((item for item in reversed(indicators["rsi_14"]) if item is not None), 50)
    sma_50 = next(
        (item for item in reversed(indicators["sma_50"]) if item is not None), bars[-1].close
    )
    momentum = min(
        100, max(0, 50 + metrics["return_3m"] * 180 + (10 if bars[-1].close > sma_50 else -10))
    )
    bottom_probability = min(90, max(5, 54 - (last_rsi - 30) * 0.6 - metrics["return_1m"] * 150))
    risks = [
        "Sample mode uses deterministic synthetic history and should not be treated as a "
        "market quote.",
        "Technical signals are descriptive and can fail during regime changes or gaps.",
        "Fundamental figures require primary-source validation before use in an investment "
        "decision.",
    ]
    return ResearchSnapshot(
        profile=profile,
        bars=bars,
        metrics=metrics,
        indicators=indicators,
        fundamentals=provider.fundamentals(symbol),
        scores={
            "momentum_score": round(momentum, 1),
            "potential_bottom_probability": round(bottom_probability, 1),
            "regime": "Constructive" if bars[-1].close > sma_50 else "Caution",
            "rsi_signal": "Oversold"
            if last_rsi < 30
            else "Overbought"
            if last_rsi > 70
            else "Neutral",
        },
        risks=risks,
        data_notes=[
            "Provider: deterministic sample",
            f"As of: {date.today().isoformat()}",
            "Adjusted close is used for return calculations.",
        ],
    )


def screener() -> list[dict[str, object]]:
    rows = []
    for symbol in available_symbols():
        item = research(symbol)
        rows.append(
            {
                "symbol": symbol,
                "name": item.profile.name,
                "sector": item.profile.sector,
                "last_price": item.metrics["last_price"],
                "return_3m": item.metrics["return_3m"],
                "volatility": item.metrics["annualized_volatility"],
                "momentum_score": item.scores["momentum_score"],
                "rsi": next(
                    value for value in reversed(item.indicators["rsi_14"]) if value is not None
                ),
            }
        )
    return sorted(rows, key=lambda item: float(item["momentum_score"]), reverse=True)


def list_watchlists(session: Session) -> list[WatchlistOutput]:
    return [
        WatchlistOutput(
            id=row.id,
            name=row.name,
            symbols=[symbol for symbol in row.symbols.split(",") if symbol],
        )
        for row in session.query(Watchlist).all()
    ]


def create_watchlist(session: Session, payload: WatchlistInput) -> WatchlistOutput:
    symbols = sorted({symbol.upper().strip() for symbol in payload.symbols if symbol.strip()})
    row = Watchlist(id=uuid.uuid4().hex[:12], name=payload.name.strip(), symbols=",".join(symbols))
    session.add(row)
    session.commit()
    session.refresh(row)
    return WatchlistOutput(id=row.id, name=row.name, symbols=symbols)


def run_backtest(payload: BacktestInput) -> dict[str, object]:
    series = [provider.bars(symbol.upper()) for symbol in payload.symbols]
    common = min(len(item) for item in series)
    curves = [1.0]
    positions: list[dict[str, object]] = []
    # Momentum is calculated only from prior closes; the following period return is realized later.
    for index in range(payload.lookback_days, common - 1, payload.rebalance_days):
        scores = [
            (
                bars[index].adjusted_close / bars[index - payload.lookback_days].adjusted_close - 1,
                symbol,
                bars,
            )
            for symbol, bars in zip(payload.symbols, series)
        ]
        _, winner, winner_bars = max(scores)
        next_index = min(index + payload.rebalance_days, common - 1)
        gross_return = (
            winner_bars[next_index].adjusted_close / winner_bars[index].adjusted_close - 1
        )
        net_return = gross_return - payload.transaction_cost_bps / 10000
        curves.append(curves[-1] * (1 + net_return))
        positions.append(
            {"date": winner_bars[index].date, "symbol": winner, "period_return": net_return}
        )
    return {
        "methodology": (
            "Walk-forward relative momentum; one winning symbol is selected using only the prior "
            "lookback window. Rebalances use a one-period execution delay."
        ),
        "equity_curve": curves,
        "trades": positions,
        "total_return": curves[-1] - 1,
        "max_drawdown": min(curves[i] / max(curves[: i + 1]) - 1 for i in range(len(curves))),
        "disclosure": (
            "Illustrative backtest on deterministic sample data. It excludes taxes, liquidity "
            "constraints, delistings, and most real-world costs."
        ),
    }
