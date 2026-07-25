"""OpenAPI snapshot drift checks against the live FastAPI app."""

from __future__ import annotations

import json
from pathlib import Path

from psyfi_api.main import app

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / "docs" / "contracts" / "openapi.json"

REQUIRED_PATHS = {
    "/",
    "/health",
    "/ready",
    "/api/info",
    "/simulate/",
    "/api/presets/",
    "/api/presets/{preset_id}",
    "/api/jobs/simulate",
    "/api/jobs/{job_id}",
    "/api/telemetry/status",
    "/api/midi/devices",
    "/api/midi/start",
}


def test_openapi_snapshot_exists_and_covers_core_routes() -> None:
    """Committed OpenAPI snapshot must include the core product routes."""
    assert SNAPSHOT.exists(), "Run scripts/export_openapi.py to refresh docs/contracts/openapi.json"
    snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    paths = set(snapshot.get("paths", {}))
    missing = REQUIRED_PATHS - paths
    assert not missing, f"OpenAPI snapshot missing routes: {sorted(missing)}"


def test_live_openapi_includes_simulate_seed_and_session_fields() -> None:
    """Live schema should expose the additive simulate contract fields."""
    schema = app.openapi()
    simulate = schema["components"]["schemas"]["SimulateRequest"]
    response = schema["components"]["schemas"]["SimulateResponse"]

    assert "seed" in simulate.get("properties", {})
    for field in (
        "schema_version",
        "engine_version",
        "api_version",
        "seed",
        "provenance_id",
        "module_chain",
        "session",
    ):
        assert field in response.get("properties", {})


def test_openapi_snapshot_matches_live_path_set() -> None:
    """Fail when route inventory drifts from the committed snapshot."""
    snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    live = app.openapi()
    assert set(snapshot["paths"]) == set(live["paths"])
