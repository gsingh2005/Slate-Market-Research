# Production Deployment

Slate deploys as a statically exported Next.js frontend on GitHub Pages and a separate FastAPI service on Render. The Pages build has the repository base path `/Slate-Market-Research`; the browser's API origin is the Render URL, never a provider key or database URL.

## Local frontend build and preview

Run these commands from the repository root:

```bash
npm --prefix apps/web ci
NEXT_PUBLIC_API_URL=http://localhost:8000 npm --prefix apps/web run build:pages
npm --prefix apps/web run preview:pages
```

Open `http://localhost:4173/Slate-Market-Research/`. `NEXT_PUBLIC_API_URL` is compiled into static browser JavaScript. For GitHub Pages, replace the local value with the credential-free HTTPS Render API URL supplied as a repository Actions variable. Do not use an Actions secret for this public value.

## Local backend

Run these commands from the repository root. Use a virtual environment instead of installing dependencies into a Conda base environment.

```bash
python3 -m venv .venv
./.venv/bin/pip install -r apps/api/requirements-dev.txt
./.venv/bin/python apps/api/scripts/apply_migrations.py
./.venv/bin/uvicorn app.main:app --app-dir apps/api --host 0.0.0.0 --port 8000 --reload
```

The migration entry point also supports direct execution from `apps/api` with `python scripts/apply_migrations.py`.

## Render backend

1. In Render, create a new Blueprint from the GitHub repository and select `render.yaml`.
2. Confirm the web service root directory is `apps/api`, build command is `pip install -r requirements.txt`, and start command is `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
3. Confirm the Blueprint's PostgreSQL database is attached as `DATABASE_URL`.
4. Set `ALLOWED_ORIGINS` to `https://gsingh2005.github.io` exactly. Origins never include `/Slate-Market-Research`.
5. Deploy. Render runs `python scripts/apply_migrations.py` before each deploy; it does not reset or seed production data. Keep Render's `$PORT` start command unchanged.
6. Check `https://your-api.onrender.com/health`, `/ready`, and `/docs` before publishing the frontend.

The existing watchlist feature requires persistent data, so production uses Render PostgreSQL. SQLite is only for local development and deterministic tests. `render.yaml` keeps production demo watchlist seeding disabled.

## Environment contract

| Variable | Classification | Production value |
| --- | --- | --- |
| `APP_ENV` | Required non-secret | `production` |
| `DATABASE_URL` | Required secret | Render PostgreSQL connection string, injected by Blueprint |
| `ALLOWED_ORIGINS` | Required non-secret | `https://gsingh2005.github.io` |
| `SLATE_OFFLINE_MODE` | Required non-secret for current release | `true` keeps the labeled deterministic provider active |
| `SLATE_SEED_DEMO_DATA` | Optional non-secret | `false` in production |
| `LOG_LEVEL` | Optional non-secret | `INFO` |
| `PROVIDER_TIMEOUT_SECONDS` | Optional non-secret | `10` |
| `PROVIDER_MAX_RETRIES` | Optional non-secret | `2` |
| `ALPHA_VANTAGE_API_KEY` | Optional secret | Set only after a live provider client is implemented |
| `FRED_API_KEY` | Optional secret | Set only after a live provider client is implemented |
| `SEC_USER_AGENT` | Optional non-secret | A descriptive organization contact, never a personal address |
| `NEXT_PUBLIC_API_URL` | Browser-public value | `https://your-api.onrender.com` at Pages build time |

Legacy `SLATE_*` configuration names remain supported locally, but production should use the names above.

## GitHub Pages

1. In GitHub repository settings, go to **Pages** and select **GitHub Actions** as the source.
2. In **Settings > Secrets and variables > Actions > Variables**, add `NEXT_PUBLIC_API_URL` with the HTTPS Render API base URL. This is a repository variable, not a secret.
3. Push the reviewed workflow to `main` or run **Deploy GitHub Pages** manually from Actions.
4. The workflow validates the URL, runs the frontend checks, uploads only `apps/web/out`, and deploys it to the `github-pages` environment.
5. Open `https://gsingh2005.github.io/Slate-Market-Research/`, search a sample symbol, and confirm browser requests reach the Render API without CORS errors.

Pull requests run static-export validation in CI but never deploy Pages.

## Rollback and custom domains

To roll back Pages, redeploy a prior successful workflow run or revert the relevant `main` commit. To roll back Render, use its dashboard deploy history and ensure the database migration is backward compatible before selecting a prior build.

For a future custom domain, configure it in GitHub Pages settings, add its exact HTTPS origin to `ALLOWED_ORIGINS`, wait for TLS/DNS to settle, then rebuild Pages if the public API URL changes. Do not add a `CNAME` file until the domain is configured in the dashboard.

## Troubleshooting

- Asset 404s usually mean Pages was not built with `npm run build:pages` or the repository subpath is missing from the URL.
- CORS failures usually mean `ALLOWED_ORIGINS` includes a path, uses HTTP, or does not exactly match `https://gsingh2005.github.io`.
- Mixed-content errors mean `NEXT_PUBLIC_API_URL` is not HTTPS.
- API 404 or timeout states are shown in the UI; verify Render `/health` and `/ready` before rebuilding Pages.
- If migration fails, inspect sanitized Render logs, verify the PostgreSQL connection attachment, and run `./.venv/bin/python apps/api/scripts/apply_migrations.py` from the repository root against the intended database.
