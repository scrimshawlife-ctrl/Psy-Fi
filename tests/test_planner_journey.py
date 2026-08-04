"""I4 deterministic planner + I5 journey objects."""

from __future__ import annotations

from fastapi.testclient import TestClient

from psyfi_api.main import app
from psyfi_core.experiences.parameter_mapper import map_parameters
from psyfi_core.visualization.export_journey import build_export_journey
from psyfi_core.visualization.journey import JOURNEY_SCHEMA, build_journey
from psyfi_core.visualization.planner import PLANNER_SCHEMA, build_planner

client = TestClient(app)


def test_build_planner_deterministic() -> None:
    field = map_parameters(substance="lsd", mode="attractor", intensity=0.7, seed=42).to_dict()
    a = build_planner(
        parameter_field=field,
        spatiotemporal_anchors={"latitude": 0.0, "longitude": 0.0, "year": 2026, "hour": 12.0},
        notes="test plate",
    )
    b = build_planner(
        parameter_field=field,
        spatiotemporal_anchors={"latitude": 0.0, "longitude": 0.0, "year": 2026, "hour": 12.0},
        notes="test plate",
    )
    assert a["schema"] == PLANNER_SCHEMA
    assert a["claim"] == "INFERRED"
    assert a["hash"] == b["hash"]
    assert a["motifs"]
    assert "solar" in a["lighting_notes"].lower() or "plate" in a["lighting_notes"].lower()
    assert "INFERRED planner" in a["planner_text"]


def test_planner_endpoint() -> None:
    res = client.post(
        "/api/v1/visualize/planner",
        json={
            "substance": "psilocybin",
            "mode": "open",
            "intensity": 0.55,
            "seed": 7,
            "spatiotemporal_anchors": {"latitude": 10.0, "longitude": 20.0, "hour": 15.0, "year": 2024},
        },
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["kind"] == "planner"
    assert body["hash"]
    assert body["motifs"]


def test_export_journey_includes_planner() -> None:
    field = map_parameters(substance="lsd", mode="void", intensity=0.6, seed=3).to_dict()
    pkg = build_export_journey(
        timeline={
            "substance": "lsd",
            "mode": "void",
            "intensity": 0.6,
            "seed": 3,
            "frames": [field, {**field, "phase": "peak"}],
        },
        spatiotemporal_anchors={"latitude": 0.0, "longitude": 0.0, "hour": 12.0, "year": 2020},
    )
    assert pkg["planner"]["schema"] == PLANNER_SCHEMA
    assert "Motifs:" in pkg["t2v"]["prompt"] or pkg["planner"]["motifs"]


def test_build_journey_packet() -> None:
    field = map_parameters(substance="dmt", mode="power", intensity=0.8, seed=9).to_dict()
    j = build_journey(
        substance="dmt",
        mode="power",
        intensity=0.8,
        seed=9,
        parameter_field=field,
        spatiotemporal_anchors={"solar_elevation_deg": 30.0},
    )
    assert j["schema"] == JOURNEY_SCHEMA
    assert j["id"].startswith("jny-")
    assert j["planner"]["hash"]


def test_journey_endpoint() -> None:
    res = client.post(
        "/api/v1/visualize/journey",
        json={
            "substance": "lsd",
            "mode": "open",
            "intensity": 0.7,
            "seed": 42,
            "title": "test-journey",
            "spatiotemporal_anchors": {"latitude": 1.0, "longitude": 2.0, "hour": 10.0, "year": 2025},
            "notes": "archive me",
        },
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["kind"] == "journey"
    assert body["schema"] == JOURNEY_SCHEMA
    assert body["planner"]["planner_text"]
