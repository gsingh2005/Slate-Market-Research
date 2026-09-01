from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.rate_limit import analysis_rate_limit
from app.db import engine, get_session
from app.sample_data import available_symbols
from app.schemas import BacktestInput, WatchlistInput
from app.services import create_watchlist, list_watchlists, research, run_backtest, screener

router = APIRouter(prefix="/api/v1")


@router.get("/health")
def health():
    return {"status": "ok", "mode": "offline-first", "provider": "deterministic-sample"}


@router.get("/ready")
def ready():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable."
        )
    return {"status": "ready"}


@router.get("/symbols")
def symbols():
    return {"symbols": available_symbols()}


@router.get("/research/{symbol}")
def research_detail(symbol: str, _: None = Depends(analysis_rate_limit)):
    normalized = symbol.strip().upper()
    if not normalized.isalpha() or len(normalized) > 8:
        raise HTTPException(status_code=422, detail="Symbol must be 1-8 alphabetic characters.")
    try:
        return research(normalized)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Unknown symbol: {symbol.upper()}")


@router.get("/screener")
def screener_results(
    min_momentum: float = 0, sector: str | None = None, _: None = Depends(analysis_rate_limit)
):
    rows = screener()
    return [
        row
        for row in rows
        if float(row["momentum_score"]) >= min_momentum
        and (sector is None or row["sector"] == sector)
    ]


@router.post("/backtests")
def backtest(payload: BacktestInput, _: None = Depends(analysis_rate_limit)):
    try:
        return run_backtest(payload)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Unknown symbol: {error.args[0]}")


@router.get("/watchlists")
def watchlists(session: Session = Depends(get_session)):
    return list_watchlists(session)


@router.post("/watchlists", status_code=201)
def add_watchlist(payload: WatchlistInput, session: Session = Depends(get_session)):
    return create_watchlist(session, payload)
