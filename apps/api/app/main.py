from contextlib import asynccontextmanager

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.api import health, ready, router
from app.core.config import settings
from app.core.logging import configure_logging
from app.db import initialize_database
from app.frontend import resolve_exported_file


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.validate()
    configure_logging(settings.log_level)
    initialize_database()
    yield


app = FastAPI(title="Slate Market Research API", version="0.1.0", lifespan=lifespan)
if settings.environment != "production":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.allowed_origins),
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
    )
app.add_api_route("/health", health, methods=["GET"], include_in_schema=False)
app.add_api_route("/ready", ready, methods=["GET"], include_in_schema=False)
app.add_api_route("/api/health", health, methods=["GET"], include_in_schema=False)
app.add_api_route("/api/ready", ready, methods=["GET"], include_in_schema=False)
app.include_router(router)


@app.get("/{request_path:path}", include_in_schema=False)
async def serve_frontend(request_path: str) -> FileResponse:
    """Serve only files emitted by Next static export after API routes have matched."""
    if request_path.startswith("api/") or not settings.frontend_dist_dir:
        raise HTTPException(status_code=404, detail="Not Found")

    exported_file = resolve_exported_file(Path(settings.frontend_dist_dir), request_path)
    if exported_file is None:
        raise HTTPException(status_code=404, detail="Not Found")
    return FileResponse(exported_file)
