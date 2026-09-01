from pathlib import Path

from dataclasses import replace
from fastapi.testclient import TestClient

from app import main
from app.frontend import resolve_exported_file


def test_exported_files_resolve_directories_and_reject_unsafe_paths(tmp_path: Path):
    frontend = tmp_path / "frontend"
    (frontend / "research").mkdir(parents=True)
    (frontend / "index.html").write_text("home")
    (frontend / "research" / "index.html").write_text("research")
    (tmp_path / "outside.html").write_text("outside")

    assert resolve_exported_file(frontend, "") == frontend / "index.html"
    assert resolve_exported_file(frontend, "research/") == frontend / "research" / "index.html"
    assert resolve_exported_file(frontend, "../outside.html") is None
    assert resolve_exported_file(frontend, "missing") is None


def test_fastapi_serves_exported_routes_and_keeps_missing_api_paths_as_404(
    tmp_path: Path, monkeypatch
):
    frontend = tmp_path / "frontend"
    (frontend / "research").mkdir(parents=True)
    (frontend / "index.html").write_text("home")
    (frontend / "research" / "index.html").write_text("research")
    monkeypatch.setattr(main, "settings", replace(main.settings, frontend_dist_dir=str(frontend)))

    with TestClient(main.app) as client:
        home = client.get("/?source=smoke")
        research = client.get("/research/")
        missing = client.get("/missing/")
        missing_api = client.get("/api/not-found")

    assert home.status_code == 200
    assert home.text == "home"
    assert research.status_code == 200
    assert research.text == "research"
    assert missing.status_code == 404
    assert missing_api.status_code == 404
