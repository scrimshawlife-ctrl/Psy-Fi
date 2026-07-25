"""Soft-freeze drift checks for /api/v1 contract artifacts."""

from __future__ import annotations

import json
from pathlib import Path

from psyfi_api.main import app

ROOT = Path(__file__).resolve().parents[1]
FROZEN = ROOT / "docs" / "contracts" / "frozen"
LIVING_OPENAPI = ROOT / "docs" / "contracts" / "openapi.json"
LIVING_SCENE = ROOT / "docs" / "schemas" / "psyfi_scene_snapshot.v1.json"
LIVING_FIELD = ROOT / "docs" / "schemas" / "psyfi_parameter_field.v1.json"
LIVING_FRAME = ROOT / "docs" / "schemas" / "psyfi_visual_frame.v1.json"
LIVING_OVERLAYS = ROOT / "data" / "phenomenology" / "derived" / "substance_visual_overlays.v1.json"


def _load(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def test_freeze_manifest_is_hard_frozen() -> None:
    manifest = _load(FROZEN / "MANIFEST.json")
    assert isinstance(manifest, dict)
    assert manifest["status"] == "hard_frozen"
    assert manifest["freeze_id"] == "psyfi-api-v1-hard-2026-07-25"
    assert manifest["api_version"] == "v1"
    policy = manifest["policy"]
    assert isinstance(policy, dict)
    assert policy.get("device_matrix") == "living_continuous_qa_not_blocking"
    for name in manifest["artifacts"]:
        assert (FROZEN / name).exists(), name


def test_frozen_openapi_matches_living_and_live_app() -> None:
    living = _load(LIVING_OPENAPI)
    frozen = _load(FROZEN / "openapi.v1.json")
    assert isinstance(living, dict) and isinstance(frozen, dict)
    live_paths = set(app.openapi()["paths"])
    assert set(living["paths"]) == set(frozen["paths"])
    assert set(frozen["paths"]) == live_paths
    # Full body equality (not only path keys)
    assert living == frozen
    for required in (
        "/api/v1/experiences",
        "/api/v1/substances",
        "/api/v1/visualize/parameter-timeline",
        "/api/v1/visualize/field-frame",
        "/api/v1/visualize/scene-snapshot",
        "/api/v1/jobs/simulate",
    ):
        assert required in frozen["paths"]


def test_frozen_overlay_goldens_match_fixture() -> None:
    living = _load(ROOT / "tests" / "fixtures" / "experiences" / "substance_overlay_goldens.v1.json")
    frozen = _load(FROZEN / "substance_overlay_goldens.v1.json")
    assert living == frozen


def test_frozen_schema_bodies_match_living() -> None:
    pairs = [
        (LIVING_SCENE, FROZEN / "psyfi_scene_snapshot.v1.json"),
        (LIVING_FIELD, FROZEN / "psyfi_parameter_field.v1.json"),
        (LIVING_FRAME, FROZEN / "psyfi_visual_frame.v1.json"),
        (LIVING_OVERLAYS, FROZEN / "substance_visual_overlays.v1.json"),
    ]
    for living_path, frozen_path in pairs:
        assert living_path.exists(), living_path
        assert frozen_path.exists(), frozen_path
        assert _load(living_path) == _load(frozen_path), f"drift: {frozen_path.name}"
