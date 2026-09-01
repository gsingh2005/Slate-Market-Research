from pathlib import Path


def resolve_exported_file(frontend_dir: Path, request_path: str) -> Path | None:
    """Return a regular exported asset for a URL path, or ``None`` when absent."""
    root = frontend_dir.resolve()
    candidate = (root / request_path.lstrip("/")).resolve()

    try:
        candidate.relative_to(root)
    except ValueError:
        return None

    if candidate.is_dir():
        candidate = candidate / "index.html"

    return candidate if candidate.is_file() else None
