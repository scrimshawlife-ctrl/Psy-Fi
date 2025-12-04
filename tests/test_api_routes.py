"""Integration smoke tests to ensure the FastAPI app runs."""

from fastapi.testclient import TestClient

from psyfi_api.main import app


def test_root_route_renders_index_template():
    """Root route should return the HTML landing page."""
    with TestClient(app) as client:
        response = client.get("/")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert "PsyFi" in response.text


def test_health_route_reports_status_payload():
    """Health route should return JSON with basic service metadata."""
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "healthy"
    assert payload["service"] == "psyfi-api"
    assert "timestamp" in payload


def test_api_info_route_reports_version():
    """API info route should expose service identity and version."""
    with TestClient(app) as client:
        response = client.get("/api/info")
    assert response.status_code == 200
    payload = response.json()
    assert payload["message"].startswith("PsyFi API")
    assert payload["version"] == "0.1.0"
