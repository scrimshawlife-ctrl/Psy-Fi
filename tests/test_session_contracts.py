"""Tests for session contracts integrated with existing Pydantic models."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from jsonschema import validate

from psyfi_api.main import app
from psyfi_core.models.session import PsyFiSession, SessionMetrics

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "docs" / "contracts" / "fixtures" / "session.example.json"


def test_session_fixture_round_trips_through_pydantic() -> None:
    """Hand-authored fixture must validate against the live Pydantic model."""
    session = PsyFiSession.model_validate_json(FIXTURE.read_text(encoding="utf-8"))
    assert session.schema_version == "psyfi.session.v1"
    assert session.parameters.width == 64
    assert session.result is not None
    assert session.result.metrics.coherence == pytest.approx(0.54)


def test_exported_session_schema_matches_fixture() -> None:
    """Exported JSON Schema (same pattern as substance presets) validates the fixture."""
    schema_path = ROOT / "psyfi_core" / "schemas" / "session.schema.json"
    assert schema_path.exists(), "Run scripts/export_schemas.py to create schema artifacts"
    schema = __import__("json").loads(schema_path.read_text(encoding="utf-8"))
    instance = __import__("json").loads(FIXTURE.read_text(encoding="utf-8"))
    validate(instance=instance, schema=schema)


def test_simulate_returns_session_and_is_seed_deterministic() -> None:
    """Existing /simulate/ route should expose additive session metadata."""
    payload = {"width": 32, "height": 32, "steps": 5, "seed": 42}
    with TestClient(app) as client:
        first = client.post("/simulate/", json=payload)
        second = client.post("/simulate/", json=payload)

    assert first.status_code == 200
    assert second.status_code == 200
    a = first.json()
    b = second.json()

    assert a["seed"] == 42
    assert a["schema_version"] == "psyfi.session.v1"
    assert a["provenance_id"]
    assert a["module_chain"] == [
        "consciousness_omega",
        "normalization_nu",
        "valence_kappa",
    ]
    assert "session" in a
    PsyFiSession.model_validate(a["session"])

    # Deterministic metrics for identical seeds/params.
    for key in ("valence", "coherence", "symmetry", "roughness", "richness"):
        assert a[key] == pytest.approx(b[key])


def test_from_simulation_helper_builds_portable_document() -> None:
    """Factory helper should produce a complete portable session document."""
    session = PsyFiSession.from_simulation(
        seed=7,
        width=16,
        height=16,
        steps=3,
        metrics=SessionMetrics(
            valence=0.1,
            coherence=0.2,
            symmetry=0.3,
            roughness=0.4,
            richness=0.5,
        ),
        module_chain=["consciousness_omega"],
    )
    assert session.seed == 7
    assert session.result is not None
    assert session.provenance.module_chain == ["consciousness_omega"]
