"""Minimal migration runner for SQLite development deployments."""

import sqlite3
from pathlib import Path

database = Path("data/slate.db")
database.parent.mkdir(parents=True, exist_ok=True)
with sqlite3.connect(database) as connection:
    for migration in sorted(Path("migrations").glob("*.sql")):
        connection.executescript(migration.read_text())
print(f"Applied migrations to {database}")
