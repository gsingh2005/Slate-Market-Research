from app.analytics import historical_scenarios, risk_statistics, ema, rsi, sma
from app.sample_data import bars_for


def test_sma_warmup_is_none_and_then_correct():
    assert sma([1, 2, 3, 4], 3) == [None, None, 2.0, 3.0]


def test_ema_warmup_does_not_backfill():
    result = ema([1, 2, 3, 4], 3)
    assert result[:2] == [None, None]
    assert result[2] == 2.0


def test_rsi_rising_series_reaches_100_after_warmup():
    result = rsi(list(range(1, 20)), 14)
    assert result[13] is None
    assert result[14] == 100


def test_risk_statistics_are_finite_and_use_deterministic_history():
    metrics = risk_statistics(bars_for("AAPL"), bars_for("SPY"))
    assert metrics["annualized_volatility"] is not None
    assert metrics["max_drawdown"] <= 0
    assert -1 < metrics["value_at_risk_95"] < 1


def test_historical_scenarios_have_ordered_empirical_intervals():
    scenario = historical_scenarios(bars_for("AAPL"), horizon=10)
    assert scenario["sample_size"] == 510
    assert scenario["downside_return"] <= scenario["median_return"] <= scenario["upside_return"]
