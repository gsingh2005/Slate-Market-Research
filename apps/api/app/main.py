from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, ready, router
from app.core.config import settings
from app.core.logging import configure_logging
from app.db import initialize_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.validate()
    configure_logging(settings.log_level)
    initialize_database()
    yield


app = FastAPI(title="Slate Market Research API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)
app.add_api_route("/health", health, methods=["GET"], include_in_schema=False)
app.add_api_route("/ready", ready, methods=["GET"], include_in_schema=False)
app.include_router(router)
