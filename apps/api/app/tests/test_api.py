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


def test_unknown_symbol_is_a_clear_404():
    with TestClient(app) as client:
        response = client.get("/api/v1/research/NOPE")
    assert response.status_code == 404
