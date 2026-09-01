import math
from collections.abc import Iterable

from app.schemas import Bar


def _mean(values: Iterable[float]) -> float:
    values = list(values)
    return sum(values) / len(values) if values else 0.0


def sma(values: list[float], period: int) -> list[float | None]:
    result: list[float | None] = []
    for index in range(len(values)):
        result.append(
            _mean(values[index - period + 1 : index + 1]) if index >= period - 1 else None
        )
    return result


def ema(values: list[float], period: int) -> list[float | None]:
    result: list[float | None] = [None] * len(values)
    if len(values) < period:
        return result
    multiplier = 2 / (period + 1)
    previous = _mean(values[:period])
    result[period - 1] = previous
    for index in range(period, len(values)):
        previous = (values[index] - previous) * multiplier + previous
        result[index] = previous
    return result


def rsi(values: list[float], period: int = 14) -> list[float | None]:
    result: list[float | None] = [None] * len(values)
    if len(values) <= period:
        return result
    gains = [max(values[index] - values[index - 1], 0) for index in range(1, len(values))]
    losses = [max(values[index - 1] - values[index], 0) for index in range(1, len(values))]
    avg_gain, avg_loss = _mean(gains[:period]), _mean(losses[:period])
    result[period] = 100 if avg_loss == 0 else 100 - 100 / (1 + avg_gain / avg_loss)
    for index in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[index]) / period
        avg_loss = (avg_loss * (period - 1) + losses[index]) / period
        result[index + 1] = 100 if avg_loss == 0 else 100 - 100 / (1 + avg_gain / avg_loss)
    return result


def macd(values: list[float]) -> tuple[list[float | None], list[float | None], list[float | None]]:
    fast, slow = ema(values, 12), ema(values, 26)
    line = [a - b if a is not None and b is not None else None for a, b in zip(fast, slow)]
    valid = [value for value in line if value is not None]
    signal_valid = ema(valid, 9)
    signal: list[float | None] = [None] * (len(line) - len(valid)) + signal_valid
    histogram = [a - b if a is not None and b is not None else None for a, b in zip(line, signal)]
    return line, signal, histogram


def bollinger(
    values: list[float], period: int = 20
) -> tuple[list[float | None], list[float | None], list[float | None]]:
    middle = sma(values, period)
    upper: list[float | None] = []
    lower: list[float | None] = []
    for index, average in enumerate(middle):
        if average is None:
            upper.append(None)
            lower.append(None)
            continue
        deviation = math.sqrt(
            _mean((value - average) ** 2 for value in values[index - period + 1 : index + 1])
        )
        upper.append(average + 2 * deviation)
        lower.append(average - 2 * deviation)
    return middle, upper, lower


def atr(bars: list[Bar], period: int = 14) -> list[float | None]:
    ranges = []
    for index, bar in enumerate(bars):
        previous = bars[index - 1].close if index else bar.close
        ranges.append(max(bar.high - bar.low, abs(bar.high - previous), abs(bar.low - previous)))
    return sma(ranges, period)


def returns(values: list[float]) -> list[float | None]:
    return [None] + [
        values[index] / values[index - 1] - 1 if values[index - 1] else None
        for index in range(1, len(values))
    ]


def max_drawdown(values: list[float]) -> float:
    peak, worst = values[0], 0.0
    for value in values:
        peak = max(peak, value)
        worst = min(worst, value / peak - 1)
    return worst


def _standard_deviation(values: list[float]) -> float | None:
    if len(values) < 2:
        return None
    average = _mean(values)
    return math.sqrt(_mean((value - average) ** 2 for value in values))


def _percentile(values: list[float], percentile: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    index = (len(ordered) - 1) * percentile
    lower, upper = math.floor(index), math.ceil(index)
    return (
        ordered[lower]
        if lower == upper
        else ordered[lower] + (ordered[upper] - ordered[lower]) * (index - lower)
    )


def risk_statistics(bars: list[Bar], benchmark: list[Bar]) -> dict[str, float | None]:
    """Descriptive daily-return statistics using 252 trading days per year."""
    closes = [bar.adjusted_close for bar in bars]
    daily = [value for value in returns(closes) if value is not None]
    benchmark_daily = [
        value for value in returns([bar.adjusted_close for bar in benchmark]) if value is not None
    ]
    paired = list(zip(daily[-len(benchmark_daily) :], benchmark_daily[-len(daily) :]))
    mean_daily = _mean(daily)
    volatility = _standard_deviation(daily)
    downside = _standard_deviation([min(value, 0) for value in daily])
    total_return = closes[-1] / closes[0] - 1 if len(closes) > 1 else None
    years = len(daily) / 252
    annualized_return = (
        (1 + total_return) ** (1 / years) - 1 if total_return is not None and years else None
    )
    drawdown = max_drawdown(closes) if closes else None
    current_drawdown = closes[-1] / max(closes) - 1 if closes else None
    market_mean = _mean([market for _, market in paired])
    market_variance = _mean((market - market_mean) ** 2 for _, market in paired) if paired else 0
    covariance = (
        _mean((asset - mean_daily) * (market - market_mean) for asset, market in paired)
        if paired
        else 0
    )
    beta = covariance / market_variance if market_variance else None
    correlation = (
        covariance / (volatility * _standard_deviation([market for _, market in paired]))
        if volatility and paired and _standard_deviation([market for _, market in paired])
        else None
    )
    alpha = ((mean_daily - (beta or 0) * market_mean) * 252) if beta is not None else None
    var_95 = _percentile(daily, 0.05)
    tail = [value for value in daily if var_95 is not None and value <= var_95]
    return {
        "total_return": total_return,
        "annualized_return": annualized_return,
        "daily_volatility": volatility,
        "annualized_volatility": volatility * math.sqrt(252) if volatility is not None else None,
        "downside_deviation": downside * math.sqrt(252) if downside is not None else None,
        "beta_vs_spy": beta,
        "alpha_vs_spy": alpha,
        "correlation_vs_spy": correlation,
        "r_squared_vs_spy": correlation**2 if correlation is not None else None,
        "sharpe_ratio": (mean_daily / volatility * math.sqrt(252)) if volatility else None,
        "sortino_ratio": (mean_daily / downside * math.sqrt(252)) if downside else None,
        "calmar_ratio": annualized_return / abs(drawdown)
        if annualized_return is not None and drawdown
        else None,
        "max_drawdown": drawdown,
        "current_drawdown": current_drawdown,
        "value_at_risk_95": var_95,
        "conditional_value_at_risk_95": _mean(tail) if tail else None,
        "positive_day_percentage": sum(value > 0 for value in daily) / len(daily)
        if daily
        else None,
        "best_day_return": max(daily) if daily else None,
        "worst_day_return": min(daily) if daily else None,
    }


def historical_scenarios(bars: list[Bar], horizon: int = 10) -> dict[str, float | int | str | None]:
    """Empirical overlapping return intervals, deliberately labeled as scenarios, not forecasts."""
    closes = [bar.adjusted_close for bar in bars]
    outcomes = [
        closes[index] / closes[index - horizon] - 1 for index in range(horizon, len(closes))
    ]
    return {
        "horizon_sessions": horizon,
        "lookback_sessions": len(closes),
        "sample_size": len(outcomes),
        "method": "overlapping historical returns",
        "downside_return": _percentile(outcomes, 0.1),
        "median_return": _percentile(outcomes, 0.5),
        "upside_return": _percentile(outcomes, 0.9),
    }


def snapshot_metrics(bars: list[Bar], benchmark: list[Bar]) -> dict[str, float | None]:
    closes = [bar.adjusted_close for bar in bars]
    daily = [value for value in returns(closes) if value is not None]
    annualized_vol = (
        math.sqrt(252) * math.sqrt(_mean((value - _mean(daily)) ** 2 for value in daily))
        if daily
        else None
    )
    market = [
        value for value in returns([bar.adjusted_close for bar in benchmark]) if value is not None
    ]
    paired = list(zip(daily[-len(market) :], market[-len(daily) :]))
    market_variance = (
        _mean((item[1] - _mean(value[1] for value in paired)) ** 2 for item in paired)
        if paired
        else 0
    )
    covariance = (
        _mean(
            (item[0] - _mean(value[0] for value in paired))
            * (item[1] - _mean(value[1] for value in paired))
            for item in paired
        )
        if paired
        else 0
    )
    return {
        "last_price": closes[-1],
        "return_1m": closes[-1] / closes[-22] - 1 if len(closes) > 22 else None,
        "return_3m": closes[-1] / closes[-64] - 1 if len(closes) > 64 else None,
        "return_1y": closes[-1] / closes[-253] - 1 if len(closes) > 253 else None,
        "annualized_volatility": annualized_vol,
        "max_drawdown": max_drawdown(closes),
        "beta_vs_spy": covariance / market_variance if market_variance else None,
        "average_volume_20d": _mean([bar.volume for bar in bars[-20:]]),
        **risk_statistics(bars, benchmark),
    }


def indicator_set(bars: list[Bar]) -> dict[str, list[float | None]]:
    closes = [bar.adjusted_close for bar in bars]
    macd_line, macd_signal, macd_histogram = macd(closes)
    middle, upper, lower = bollinger(closes)
    return {
        "sma_20": sma(closes, 20),
        "sma_50": sma(closes, 50),
        "sma_200": sma(closes, 200),
        "ema_20": ema(closes, 20),
        "rsi_14": rsi(closes),
        "macd": macd_line,
        "macd_signal": macd_signal,
        "macd_histogram": macd_histogram,
        "bb_middle": middle,
        "bb_upper": upper,
        "bb_lower": lower,
        "atr_14": atr(bars),
    }
