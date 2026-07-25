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


def test_scene_snapshot_applies_substance_intensity_cap() -> None:
    """GPU publish surface must honor the same safety caps as parameter-timeline."""
    body = {
        "substance": "pcp",
        "intensity": 1.0,
        "seed": 7,
        "steps": 8,
        "include_simulation": False,
    }
    timeline = client.post("/api/v1/visualize/parameter-timeline", json=body)
    snapshot = client.post("/api/v1/visualize/scene-snapshot", json=body)
    assert timeline.status_code == 200, timeline.text
    assert snapshot.status_code == 200, snapshot.text
    mid = timeline.json()["frames"][len(timeline.json()["frames"]) // 2]
    assert mid["intensity"] == 0.55
    assert snapshot.json()["parameter_field"]["intensity"] == 0.55


def test_intensity_cap_uses_strictest_of_experience_and_overlay() -> None:
    """Recipe intensity_cap: 1.0 must not mask a lower substance overlay cap."""
    mismatched = client.post(
        "/api/v1/visualize/scene-snapshot",
        json={
            "substance": "pcp",
            "experience_id": "exp_lsd_floral_geometry",
            "intensity": 1.0,
            "include_simulation": False,
            "seed": 1,
        },
    )
    assert mismatched.status_code == 400, mismatched.text

    capped = client.post(
        "/api/v1/visualize/parameter-timeline",
        json={
            "substance": "pcp",
            "experience_id": "exp_src_pcp_6d99000a",
            "intensity": 1.0,
            "steps": 4,
            "seed": 1,
        },
    )
    assert capped.status_code == 200, capped.text
    assert capped.json()["intensity"] == 0.55
    assert all(f["intensity"] == 0.55 for f in capped.json()["frames"])


def test_parameter_timeline_neutral_view_rematerializes_all_frames() -> None:
    res = client.post(
        "/api/v1/visualize/parameter-timeline",
        json={
            "substance": "lsd",
            "intensity": 0.9,
            "seed": 3,
            "steps": 4,
            "neutral_view": True,
        },
    )
    assert res.status_code == 200, res.text
    frames = res.json()["frames"]
    assert len(frames) == 4
    for frame in frames:
        assert frame["neutral_view"] is True
        assert frame["engines"].get("neutral_view", 0) >= 0.99
        assert float(frame["parameters"].get("flash_energy", 1)) == 0.0


def test_scene_snapshot_neutral_view_rematerializes_engines() -> None:
    """neutral_view must collapse engines/params — not just set a boolean flag."""
    res = client.post(
        "/api/v1/visualize/scene-snapshot",
        json={
            "substance": "lsd",
            "mode": "open",
            "intensity": 0.8,
            "seed": 3,
            "steps": 8,
            "neutral_view": True,
            "include_simulation": False,
        },
    )
    assert res.status_code == 200, res.text
    field = res.json()["parameter_field"]
    assert field["neutral_view"] is True
    assert field["engines"].get("neutral_view", 0) >= 0.99
    assert field["engines"].get("recursive_feedback", 1) == 0.0
    assert float(field["parameters"].get("flash_energy", 1)) == 0.0


def test_scene_snapshot_rejects_oversized_seed() -> None:
    res = client.post(
        "/api/v1/visualize/scene-snapshot",
        json={
            "substance": "lsd",
            "intensity": 0.5,
            "seed": 2**40,
            "include_simulation": True,
            "width": 16,
            "height": 16,
            "sim_steps": 2,
        },
    )
    assert res.status_code == 422
