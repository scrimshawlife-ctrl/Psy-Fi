"""Tests for immutable GPU scene snapshot packaging + API."""

from __future__ import annotations

from fastapi.testclient import TestClient

from psyfi_api.main import app
from psyfi_core.experiences.parameter_mapper import map_parameters
from psyfi_core.visualization.scene_snapshot import SCENE_SNAPSHOT_SCHEMA, build_scene_snapshot

client = TestClient(app)


def test_build_scene_snapshot_deterministic_procedural() -> None:
    field = map_parameters(substance="lsd", mode="power", intensity=0.8, seed=1337).to_dict()
    a = build_scene_snapshot(parameter_field=field, quality_tier="balanced", sequence=1, snapshot_id="fixed")
    b = build_scene_snapshot(parameter_field=field, quality_tier="balanced", sequence=1, snapshot_id="fixed")
    assert a["schema_version"] == SCENE_SNAPSHOT_SCHEMA
    assert a["procedural"]["glyphs"] == b["procedural"]["glyphs"]
    assert a["procedural"]["crystals"]
    assert a["post"]["bloom"] is True
    assert "ssr" in a["post"]


def test_neutral_view_collapses_post() -> None:
    field = map_parameters(substance="dmt", mode="void", intensity=0.5, seed=7, neutral_view=True).to_dict()
    snap = build_scene_snapshot(parameter_field=field, quality_tier="ultra", sequence=2)
    assert snap["parameter_field"]["neutral_view"] is True
    assert snap["post"]["ssao"] is False
    assert snap["post"]["ssr"] is False


def test_scene_snapshot_endpoint() -> None:
    res = client.post(
        "/api/v1/visualize/scene-snapshot",
        json={
            "substance": "lsd",
            "mode": "open",
            "intensity": 0.7,
            "seed": 42,
            "quality_tier": "balanced",
            "sequence": 3,
            "include_simulation": True,
            "sim_steps": 2,
            "width": 16,
            "height": 16,
        },
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["schema_version"] == SCENE_SNAPSHOT_SCHEMA
    assert body["sequence"] == 3
    assert body["parameter_field"]["hash"]
    assert body["magnitude_field"] is not None
    assert body["procedural"]["metaballs"]
    assert body["kind"] == "scene_snapshot"
