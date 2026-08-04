"""Validate I4/I5 JSON schemas against live builder output."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

pytest.importorskip("jsonschema")
from jsonschema import Draft202012Validator

from psyfi_core.experiences.parameter_mapper import map_parameters
from psyfi_core.visualization.export_journey import build_export_journey
from psyfi_core.visualization.journey import build_journey
from psyfi_core.visualization.planner import build_planner

ROOT = Path(__file__).resolve().parents[1]
SCHEMAS = ROOT / "docs" / "schemas"


def _load(name: str) -> dict:
    return json.loads((SCHEMAS / name).read_text(encoding="utf-8"))


def test_planner_schema_validates_builder() -> None:
    field = map_parameters(substance="lsd", mode="open", intensity=0.7, seed=3).to_dict()
    plan = build_planner(
        parameter_field=field,
        spatiotemporal_anchors={"latitude": 0.0, "longitude": 0.0, "hour": 12.0, "year": 2026},
    )
    Draft202012Validator(_load("psyfi_planner.v1.json")).validate(plan)


def test_journey_schema_validates_builder() -> None:
    field = map_parameters(substance="psilocybin", mode="attractor", intensity=0.55, seed=9).to_dict()
    packet = build_journey(
        substance="psilocybin",
        mode="attractor",
        intensity=0.55,
        seed=9,
        parameter_field=field,
        comparison_id="cmp-test",
    )
    Draft202012Validator(_load("psyfi_journey.v1.json")).validate(packet)


def test_export_journey_schema_allows_planner_and_anchors() -> None:
    field = map_parameters(substance="dmt", mode="void", intensity=0.6, seed=1).to_dict()
    pkg = build_export_journey(
        timeline={"substance": "dmt", "mode": "void", "intensity": 0.6, "seed": 1, "frames": [field]},
        spatiotemporal_anchors={"solar_elevation_deg": 25.0},
    )
    Draft202012Validator(_load("psyfi_export_journey.v1.json")).validate(pkg)
    assert pkg.get("planner")
    assert pkg.get("spatiotemporal_anchors")
