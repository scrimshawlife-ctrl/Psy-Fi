"""Soft-freeze drift checks for /api/v1 contract artifacts."""

from __future__ import annotations

import json
from pathlib import Path

from psyfi_api.main import app

ROOT = Path(__file__).resolve().parents[1]
FROZEN = ROOT / "docs" / "contracts" / "frozen"
LIVING_OPENAPI = ROOT / "docs" / "contracts" / "openapi.json"


def test_freeze_manifest_is_soft_frozen() -> None:
    manifest = json.loads((FROZEN / "MANIFEST.json").read_text(encoding="utf-8"))
    assert manifest["status"] == "soft_frozen"
    assert manifest["api_version"] == "v1"
    for name in manifest["artifacts"]:
        assert (FROZEN / name).exists(), name


def test_frozen_openapi_matches_living_and_live_app() -> None:
    living = json.loads(LIVING_OPENAPI.read_text(encoding="utf-8"))
    frozen = json.loads((FROZEN / "openapi.v1.json").read_text(encoding="utf-8"))
    live_paths = set(app.openapi()["paths"])
    assert set(living["paths"]) == set(frozen["paths"])
    assert set(frozen["paths"]) == live_paths
    for required in (
        "/api/v1/experiences",
        "/api/v1/substances",
        "/api/v1/visualize/parameter-timeline",
        "/api/v1/visualize/field-frame",
        "/api/v1/jobs/simulate",
    ):
        assert required in frozen["paths"]


def test_frozen_overlay_goldens_match_fixture() -> None:
    living = (ROOT / "tests" / "fixtures" / "experiences" / "substance_overlay_goldens.v1.json").read_text(
        encoding="utf-8"
    )
    frozen = (FROZEN / "substance_overlay_goldens.v1.json").read_text(encoding="utf-8")
    assert json.loads(living) == json.loads(frozen)
