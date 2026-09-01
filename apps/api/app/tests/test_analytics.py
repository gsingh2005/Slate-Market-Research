from app.analytics import ema, rsi, sma


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
