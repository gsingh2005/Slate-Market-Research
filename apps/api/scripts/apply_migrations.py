"""Apply SQL migrations to the configured SQLite or PostgreSQL database."""

import sys
from pathlib import Path

from sqlalchemy import text

# Make direct execution from apps/api (`python scripts/apply_migrations.py`) package-safe.
API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

MIGRATIONS_DIRECTORY = API_ROOT / "migrations"


def migration_engine():
    from app.db import engine

    return engine


with migration_engine().begin() as connection:
    for migration in sorted(MIGRATIONS_DIRECTORY.glob("*.sql")):
        for statement in migration.read_text().split(";"):
            if statement.strip():
                connection.execute(text(statement))
print("Applied migrations to configured database")
