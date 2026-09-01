from fastapi.testclient import TestClient

from app.main import app


def test_research_endpoint_returns_aligned_series():
    with TestClient(app) as client:
        response = client.get("/api/v1/research/AAPL")
    assert response.status_code == 200
    payload = response.json()
    assert payload["profile"]["symbol"] == "AAPL"
    assert len(payload["bars"]) == len(payload["indicators"]["sma_50"])
    assert payload["indicators"]["sma_50"][:49] == [None] * 49
    assert [bar["date"] for bar in payload["bars"]] == sorted(
        bar["date"] for bar in payload["bars"]
    )
    assert all(
        isinstance(bar[key], (int, float))
        for bar in payload["bars"]
        for key in ["open", "high", "low", "close", "volume"]
    )


def test_unknown_symbol_is_a_clear_404():
    with TestClient(app) as client:
        response = client.get("/api/v1/research/NOPE")
    assert response.status_code == 404


def test_health_and_readiness_probes_are_available():
    with TestClient(app) as client:
        assert client.get("/health").json()["status"] == "ok"
        assert client.get("/ready").json()["status"] == "ready"


def test_cors_allows_configured_frontend_origins_and_rejects_unknown_origin():
    with TestClient(app) as client:
        allowed_origins = [
            "http://localhost:3000",
            "http://localhost:4173",
            "https://gsingh2005.github.io",
        ]
        preflights = [
            client.options(
                "/api/v1/research/AAPL",
                headers={"Origin": origin, "Access-Control-Request-Method": "GET"},
            )
            for origin in allowed_origins
        ]
        rejected = client.get("/health", headers={"Origin": "https://untrusted.example"})
    assert [response.status_code for response in preflights] == [200, 200, 200]
    assert [
        response.headers["access-control-allow-origin"] for response in preflights
    ] == allowed_origins
    assert "access-control-allow-origin" not in rejected.headers
