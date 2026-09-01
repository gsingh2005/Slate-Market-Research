# Slate Market Research

Slate is an offline-first equity research terminal for exploring price structure, technical indicators, fundamental snapshots, screeners, comparisons, and transparent illustrative backtests. It is educational research software, not investment advice.

> Screenshot placeholder: add an anonymized product screenshot here before public launch.

## Financial-risk disclaimer

Nothing in this repository is financial, investment, legal, or tax advice. Market data can be delayed, incomplete, synthetic, or inaccurate. Technical signals and backtest results are descriptive illustrations, not predictions. Always verify decisions against primary filings and appropriate professional advice.

## Features

- Research views with OHLCV price charts, SMA overlays, RSI, MACD, Bollinger Bands, ATR, volatility, beta, and drawdown.
- Deterministic offline sample data for AAPL, MSFT, NVDA, AMZN, GOOGL, JPM, XOM, and SPY.
- Screener, comparison workspace, persisted local watchlists, and a walk-forward momentum backtest.
- Provider boundaries for CSV, Stooq, Alpha Vantage, SEC EDGAR fundamentals, and FRED macro data.
- Source-aware risk disclosures throughout the API and UI.

## Architecture

```text
apps/
  api/                  FastAPI, SQLAlchemy, migrations, analytics, tests
  web/                  Next.js App Router interface and browser tests
docs/                   Architecture notes
.github/                CI, Dependabot, issue and pull-request templates
```

The frontend calls versioned `/api/v1` endpoints. The API owns provider access, calculations, and persistence. Development uses SQLite; the SQLAlchemy layer supports PostgreSQL URLs for production. `SampleProvider` supplies reproducible synthetic data when offline mode is enabled.

## Data providers and licensing

The default provider is deterministic sample data, clearly labeled in responses. CSV, Stooq, Alpha Vantage, SEC EDGAR, and FRED adapters are boundaries only; live clients must be configured and reviewed before use. Each source has its own attribution, terms, rate limits, redistribution restrictions, and data-quality caveats. Do not assume a provider allows commercial use or redistribution without checking its current terms.

## Prerequisites

- Python 3.12 for the supported container/CI runtime (Python 3.10+ is expected to work locally).
- Node.js 22 and npm.
- Docker Compose, optional.

## Local installation

```bash
cp .env.example .env
python3 -m venv .venv
.venv/bin/pip install -r apps/api/requirements-dev.txt
npm --prefix apps/web ci
```

### Start the backend locally

```bash
./.venv/bin/uvicorn app.main:app --app-dir apps/api --host 0.0.0.0 --port 8000 --reload
```

API documentation is available at `http://localhost:8000/docs`.

### Start the frontend locally

```bash
npm --prefix apps/web run dev
```

Open `http://localhost:3000`.

### Docker

```bash
docker compose up --build
```

The Compose setup runs the API in offline mode and exposes the UI on port 3000. It stores the development SQLite database in `apps/api/data/`, which is deliberately ignored by Git.

## Environment configuration

Copy `.env.example` and keep the resulting `.env` private. `NEXT_PUBLIC_API_URL` is intentionally browser-exposed and must contain only a credential-free API base URL. Provider credentials such as `ALPHA_VANTAGE_API_KEY`, `FRED_API_KEY`, and `SEC_USER_AGENT` are backend-only and optional.

`APP_ENV=production` requires both `DATABASE_URL` and explicit `ALLOWED_ORIGINS`; wildcard origins are rejected at startup. Keep `SLATE_OFFLINE_MODE=true` for demos, tests, and CI. Live provider adapters remain disabled until implemented and configured.

## Database and migrations

The API initializes its local watchlist schema at startup. For an explicit SQLite migration run:

```bash
./.venv/bin/python apps/api/scripts/apply_migrations.py
```

For PostgreSQL, provide a compatible `SLATE_DATABASE_URL` and use a production migration runner before deployment.

## Quality checks

```bash
# Backend
.venv/bin/ruff format --check apps/api
.venv/bin/ruff check apps/api
.venv/bin/pytest apps/api/app/tests -q

# Frontend
npm --prefix apps/web run format:check
npm --prefix apps/web run lint
npm --prefix apps/web run typecheck
npm --prefix apps/web test
npm --prefix apps/web run build:pages
```

CI runs these checks without live provider calls. It uses deterministic sample data and safe mock public URLs.

## Troubleshooting

- If the UI cannot load research data, start the API and confirm `NEXT_PUBLIC_API_URL` points to it.
- If port 3000 or 8000 is already in use, stop the conflicting service or choose another port.
- Delete the ignored local SQLite database only if you intentionally want to reset local watchlists.
- Live provider support is not active in this release; leave offline mode enabled unless you implement and test a provider client.

## Security and contributing

Never submit credentials, private keys, or vulnerability details in public issues. See [.github/SECURITY.md](.github/SECURITY.md) and replace its placeholder contact before publishing. Contribution expectations are in [CONTRIBUTING.md](CONTRIBUTING.md).

Use a focused branch, run the quality checks above, and describe data-source implications in every pull request. Do not add downloaded datasets, local databases, provider caches, or build artifacts to commits.

## Deployment overview

Build the API and web containers separately or with Docker Compose. Production deployment requires a managed database, explicit browser origins, HTTPS termination, observability, and a review of every live data provider's licensing and rate limits.

GitHub Pages and Render deployment instructions are in [DEPLOYMENT.md](DEPLOYMENT.md).

## Known limitations

- Sample prices and fundamentals are synthetic and not market quotes.
- Live provider adapters are interfaces, not production network clients.
- The backtest omits taxes, liquidity, delistings, slippage beyond a simple cost input, and survivorship-bias controls.
- Authentication, multi-user authorization, and hosted database migrations are not yet implemented.

## License

No reuse license has been selected. Publishing without a license generally reserves reuse rights, so choose a license deliberately before accepting external contributions or inviting reuse.
