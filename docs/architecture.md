# Architecture

`apps/web` renders the Next.js research terminal. `apps/api` owns data access, analysis, and persistence. Frontend calls are made only through versioned `/api/v1` endpoints, preserving a clean provider boundary.

In offline mode, `SampleProvider` provides reproducible OHLCV and fundamentals. Production providers should implement the `MarketDataProvider` protocol and attach source, timestamp, adjustment, and licensing metadata to every payload.

Technical calculations use adjusted close for returns and preserve warm-up periods as nulls. The backtest chooses positions from only the preceding lookback window and realizes returns in later periods, avoiding direct future leakage.

