"""Product art pack registry + scene-snapshot attach."""

from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient

from psyfi_api.main import app
from psyfi_core.experiences.parameter_mapper import map_parameters
from psyfi_core.visualization.asset_packs import (
    PACK_SCHEMA,
    attach_pack_assets,
    list_registered_packs,
    normalize_pack_manifest,
    resolve_pack,
)
from psyfi_core.visualization.scene_snapshot import build_scene_snapshot

client = TestClient(app)
ROOT = Path(__file__).resolve().parents[1]
EMPTY = ROOT / "docs" / "contracts" / "fixtures" / "asset_pack.empty.v1.json"
PACK_DIR = ROOT / "packages" / "psyfi-gpu-renderer" / "public" / "assets" / "packs"


def test_empty_stub_fixture_normalizes() -> None:
    raw = json.loads(EMPTY.read_text(encoding="utf-8"))
    pack = normalize_pack_manifest(raw)
    assert pack is not None
    assert pack["schema"] == PACK_SCHEMA
    assert pack["id"] == "empty_stub"
    assert pack["gltf"] == []
    assert pack["ktx2"] == []


def test_list_registered_includes_empty_stub() -> None:
    packs = list_registered_packs()
    assert any(p["id"] == "empty_stub" for p in packs)


def test_attach_unknown_pack_leaves_assets() -> None:
    base = {"gltf": [], "ktx2": [{"id": "a", "url": "/x.ktx2"}], "splats": []}
    out = attach_pack_assets(base, "does-not-exist")
    assert out["ktx2"] == base["ktx2"]
    assert out["gltf"] == []


def test_attach_empty_stub_keeps_procedural_only() -> None:
    field = map_parameters(substance="lsd", mode="open", intensity=0.7, seed=3).to_dict()
    snap = build_scene_snapshot(
        parameter_field=field,
        quality_tier="balanced",
        sequence=1,
        asset_pack_id="empty_stub",
    )
    assert snap["asset_pack_id"] == "empty_stub"
    assert snap["assets"]["gltf"] == []
    assert snap["assets"]["ktx2"] == []
    assert snap["procedural"]["crystals"]


def test_attach_merges_pack_refs() -> None:
    pack_path = PACK_DIR / "_test_proto_pack.json"
    pack_path.write_text(
        json.dumps(
            {
                "schema": PACK_SCHEMA,
                "id": "_test_proto",
                "version": "0.0.1",
                "procedural_fallback": True,
                "status": "draft",
                "gltf": [{"id": "proto_mesh", "url": "/gpu/assets/packs/proto.glb"}],
                "ktx2": [{"id": "proto_tex", "url": "/gpu/assets/packs/proto.ktx2", "role": "ground"}],
                "splats": [],
            }
        ),
        encoding="utf-8",
    )
    try:
        pack = resolve_pack("_test_proto")
        assert pack is not None
        merged = attach_pack_assets(None, "_test_proto")
        assert {r["id"] for r in merged["gltf"]} == {"proto_mesh"}
        assert {r["id"] for r in merged["ktx2"]} == {"proto_tex"}

        field = map_parameters(substance="lsd", mode="open", intensity=0.5, seed=1).to_dict()
        snap = build_scene_snapshot(
            parameter_field=field,
            quality_tier="balanced",
            sequence=1,
            include_fixture_assets=True,
            asset_pack_id="_test_proto",
        )
        ids = {r["id"] for r in snap["assets"]["ktx2"]}
        assert "fixture_ground" in ids
        assert "proto_tex" in ids
    finally:
        if pack_path.is_file():
            pack_path.unlink()


def test_scene_snapshot_endpoint_asset_pack_id() -> None:
    res = client.post(
        "/api/v1/visualize/scene-snapshot",
        json={
            "substance": "lsd",
            "intensity": 0.6,
            "seed": 11,
            "include_simulation": False,
            "asset_pack_id": "empty_stub",
        },
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["asset_pack_id"] == "empty_stub"
    assert body["assets"]["ktx2"] == []
