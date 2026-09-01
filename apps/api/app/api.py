from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_session
from app.sample_data import available_symbols
from app.schemas import BacktestInput, WatchlistInput
from app.services import create_watchlist, list_watchlists, research, run_backtest, screener

router = APIRouter(prefix="/api/v1")


@router.get("/health")
def health():
    return {"status": "ok", "mode": "offline-first", "provider": "deterministic-sample"}


@router.get("/symbols")
def symbols():
    return {"symbols": available_symbols()}


@router.get("/research/{symbol}")
def research_detail(symbol: str):
    try:
        return research(symbol)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Unknown symbol: {symbol.upper()}")


@router.get("/screener")
def screener_results(min_momentum: float = 0, sector: str | None = None):
    rows = screener()
    return [
        row
        for row in rows
        if float(row["momentum_score"]) >= min_momentum
        and (sector is None or row["sector"] == sector)
    ]


@router.post("/backtests")
def backtest(payload: BacktestInput):
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
