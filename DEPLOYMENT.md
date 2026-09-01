# Production Deployment

Slate deploys to Render as one Docker Web Service. The container statically exports the Next.js application and FastAPI serves those files and the versioned `/api/v1` endpoints from the same origin. Browser CORS is therefore unnecessary in production.

## Local development

Run every command from the monorepo root. Use a virtual environment instead of installing packages into a Conda base environment.

```bash
python3 -m venv .venv
./.venv/bin/pip install -r apps/api/requirements-dev.txt
./.venv/bin/python apps/api/scripts/apply_migrations.py
./.venv/bin/uvicorn app.main:app --app-dir apps/api --host 0.0.0.0 --port 8000 --reload
```

In another terminal from the monorepo root:

```bash
npm --prefix apps/web ci
npm --prefix apps/web run dev
```

Open `http://localhost:3000`. The development frontend calls `http://localhost:8000`; the backend's explicit local CORS allowlist supports this split-origin workflow.

## Local production container

Build the same image Render uses. Do not supply `NEXT_PUBLIC_API_URL`: an empty value makes the exported browser code call its current origin.

```bash
docker build --build-arg NEXT_PUBLIC_API_URL= -t slate-market-research .
docker run --rm -p 8000:10000 -e PORT=10000 -e APP_ENV=production -e DATABASE_URL=sqlite:////tmp/slate.db -e SLATE_OFFLINE_MODE=true -e SLATE_SEED_DEMO_DATA=true slate-market-research
```

In another terminal:

```bash
curl -i http://localhost:8000/health
curl -i http://localhost:8000/ready
curl -i http://localhost:8000/api/v1/research/AAPL
curl -i http://localhost:8000/research/
```

Open `http://localhost:8000` to verify navigation, theme selection, charts, data refresh, and direct route refreshes from the same origin.

## Render deployment

1. Create a Render Blueprint from this repository and select `render.yaml` at the repository root.
2. Confirm it creates one Docker Web Service named `slate-market-research`. Its Docker context is the repository root and its health check is `/health`.
3. Leave `NEXT_PUBLIC_API_URL` unset. The Docker build uses same-origin API requests from `/`.
4. Set optional provider credentials only in the Render service's environment-variable settings: `ALPHA_VANTAGE_API_KEY`, `FRED_API_KEY`, and `SEC_USER_AGENT`. Do not add them to the repository, Dockerfile, build arguments, or browser variables.
5. Deploy and verify `https://your-service.onrender.com/health`, `https://your-service.onrender.com/ready`, `https://your-service.onrender.com/`, and `https://your-service.onrender.com/research/`.

Render supplies `$PORT`; the Docker command binds Uvicorn to it. Do not replace `$PORT` with a fixed port in Render configuration.

## Environment contract

| Variable | Render value | Purpose |
| --- | --- | --- |
| `APP_ENV` | `production` | Enables production behavior and disables unnecessary CORS middleware. |
| `DATABASE_URL` | `sqlite:////tmp/slate.db` | Disposable SQLite data for the first deployment. |
| `SLATE_FRONTEND_DIST_DIR` | `/app/frontend` | Location of the Next.js static export in the image. |
| `SLATE_OFFLINE_MODE` | `true` | Uses deterministic demo-compatible market data. |
| `SLATE_SEED_DEMO_DATA` | `true` | Seeds demo watchlist data when the temporary database is created. |
| `LOG_LEVEL` | `INFO` | Application log level. |
| `PROVIDER_TIMEOUT_SECONDS` | `10` | Provider request timeout. |
| `PROVIDER_MAX_RETRIES` | `2` | Provider retry limit. |
| `ALPHA_VANTAGE_API_KEY` | optional secret | Set only for an implemented live provider. |
| `FRED_API_KEY` | optional secret | Set only for an implemented live provider. |
| `SEC_USER_AGENT` | optional non-secret | Organization contact for an implemented SEC client. |

The initial SQLite database lives in the container's temporary filesystem. It is nonpersistent: watchlists and other local state can disappear after a restart, redeploy, or instance replacement. This is intentional for a demo deployment. To add persistence later, set `DATABASE_URL` to a managed PostgreSQL connection string and run the reviewed migration workflow before relying on stored data.
