"""Export-journey package + image-seed texture attach."""

from __future__ import annotations

import base64
import io

from fastapi.testclient import TestClient
from PIL import Image

from psyfi_api.main import app
from psyfi_core.experiences.parameter_mapper import map_parameters
from psyfi_core.visualization.export_journey import EXPORT_JOURNEY_SCHEMA, build_export_journey
from psyfi_core.visualization.image_seed import attach_image_seed_texture, build_image_seed
from psyfi_core.visualization.scene_snapshot import build_scene_snapshot
from psyfi_core.experiences.catalog import get_default_catalog

client = TestClient(app)


def _png_b64() -> str:
    buf = io.BytesIO()
    Image.new("RGBA", (32, 24), (12, 90, 160, 255)).save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


def test_attach_image_seed_texture_on_snapshot() -> None:
    field = map_parameters(substance="lsd", mode="open", intensity=0.6, seed=3).to_dict()
    b64 = _png_b64()
    snap = build_scene_snapshot(
        parameter_field=field,
        quality_tier="balanced",
        sequence=1,
        image_seed_png_base64=b64,
    )
    assert len(snap["assets"]["images"]) == 1
    assert snap["assets"]["images"][0]["role"] == "image_seed"
    assert snap["assets"]["images"][0]["url"].startswith("data:image/png;base64,")


def test_attach_helper_idempotent() -> None:
    b64 = _png_b64()
    once = attach_image_seed_texture(None, b64)
    twice = attach_image_seed_texture(once, b64)
    assert len(twice["images"]) == 1


def test_build_export_journey_prompt() -> None:
    catalog = get_default_catalog()
    listed = catalog.list(substance="lsd") or catalog.list(valence=None)
    exp = catalog.get(listed[0]["id"]) if listed else None
    pkg = build_export_journey(
        timeline={
            "substance": "lsd",
            "mode": "open",
            "intensity": 0.7,
            "seed": 42,
            "timeline_hash": "abc",
            "frames": [
                {"phase": "comeup", "phase_t": 0.0},
                {"phase": "peak", "phase_t": 0.5},
                {"phase": "settle", "phase_t": 1.0},
            ],
        },
        stills=[{"id": "s0", "phase": "peak", "png_base64": _png_b64()}],
        image_seed={"master_seed": 99, "influence": 0.6, "features": {"energy": 0.5}},
        experience=exp,
    )
    assert pkg["schema"] == EXPORT_JOURNEY_SCHEMA
    assert pkg["t2v"]["status"] == "prompt_only"
    assert "lsd" in pkg["t2v"]["prompt"]
    assert len(pkg["stills"]) == 1


def test_export_journey_endpoint() -> None:
    res = client.post(
        "/api/v1/visualize/export-journey",
        json={
            "timeline": {
                "substance": "lsd",
                "mode": "open",
                "intensity": 0.55,
                "seed": 7,
                "frames": [{"phase": "comeup"}, {"phase": "peak"}],
            },
            "stills": [{"png_base64": _png_b64(), "phase": "peak"}],
        },
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["kind"] == "export_journey"
    assert body["t2v"]["prompt"]


def test_scene_snapshot_endpoint_image_seed_texture() -> None:
    seed = build_image_seed(image=base64.b64decode(_png_b64()), substance="lsd", influence=0.5)
    res = client.post(
        "/api/v1/visualize/scene-snapshot",
        json={
            "substance": "lsd",
            "seed": seed["master_seed"],
            "intensity": 0.6,
            "include_simulation": False,
            "image_hints": seed["parameter_hints"],
            "modulators": {"image": 0.7},
            "image_seed_png_base64": seed["conditioned_texture_png_base64"],
        },
    )
    assert res.status_code == 200, res.text
    assert res.json()["assets"]["images"][0]["id"] == "image_seed"
