"""Pass-1 image seed conditioner + Pass-2 modulator.image wiring."""

from __future__ import annotations

import base64
import io

import numpy as np
from fastapi.testclient import TestClient
from PIL import Image

from psyfi_api.main import app
from psyfi_core.experiences.catalog import get_default_catalog
from psyfi_core.experiences.parameter_mapper import map_parameters
from psyfi_core.visualization.image_seed import (
    IMAGE_SEED_SCHEMA,
    build_image_seed,
    condition_image,
    derive_master_seed,
)

client = TestClient(app)


def _png_bytes(color=(40, 120, 200, 255), size=(64, 48)) -> bytes:
    img = Image.new("RGBA", size, color)
    # Add structure so edge features are non-zero
    px = img.load()
    for x in range(size[0]):
        px[x, size[1] // 2] = (220, 40, 60, 255)
        px[x, x % size[1]] = (30, 200, 90, 255)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_build_image_seed_deterministic() -> None:
    catalog = get_default_catalog()
    listed = catalog.list(substance="lsd") or catalog.list(valence=None)
    experience = catalog.get(listed[0]["id"]) if listed else None
    data = _png_bytes()
    a = build_image_seed(
        image=data,
        experience=experience,
        substance_overlay=catalog.overlay("lsd"),
        substance="lsd",
        mode="open",
        influence=0.7,
    )
    b = build_image_seed(
        image=data,
        experience=experience,
        substance_overlay=catalog.overlay("lsd"),
        substance="lsd",
        mode="open",
        influence=0.7,
    )
    assert a["schema"] == IMAGE_SEED_SCHEMA
    assert a["master_seed"] == b["master_seed"]
    assert a["parameter_hints"]
    assert a["source_field"]["width"] >= 8
    assert a["conditioned_preview_png_base64"]


def test_conditioner_changes_pixels_with_influence() -> None:
    rgba = np.asarray(Image.open(io.BytesIO(_png_bytes())), dtype=np.float32) / 255.0
    drive = {
        "palette_energy": 0.9,
        "void_bias": 0.5,
        "attractor_bias": 0.4,
        "turbulence": 0.3,
        "pattern_complexity": 0.6,
        "edge_gain": 0.5,
        "bloom": 0.4,
        "kaleidoscope": 0.7,
        "void_expansion": 0.2,
        "organic_bloom": 0.3,
        "recursive_feedback": 0.2,
    }
    out = condition_image(rgba, drive=drive, influence=0.8, seed=99)
    assert out.shape == rgba.shape
    assert not np.allclose(out[..., :3], rgba[..., :3], atol=1e-3)
    assert derive_master_seed(out) != derive_master_seed(rgba)


def test_image_modulator_applies_hints() -> None:
    base = map_parameters(substance="lsd", mode="open", intensity=0.7, seed=1)
    with_img = map_parameters(
        substance="lsd",
        mode="open",
        intensity=0.7,
        seed=1,
        modulators={"image": 1.0},
        image_hints={"palette_energy": 0.2, "edge_gain": 0.15},
    )
    assert with_img.parameters["palette_energy"] > base.parameters["palette_energy"]
    assert with_img.parameters["edge_gain"] > base.parameters["edge_gain"]


def test_image_seed_json_endpoint() -> None:
    b64 = base64.b64encode(_png_bytes()).decode("ascii")
    catalog = get_default_catalog()
    listed = catalog.list(substance="lsd") or catalog.list(valence=None)
    exp_id = listed[0].get("id") if listed else None
    res = client.post(
        "/api/v1/visualize/image-seed/json",
        json={
            "image_base64": b64,
            "substance": "lsd",
            "experience_id": exp_id,
            "mode": "open",
            "intensity": 0.7,
            "influence": 0.65,
            "apply_recommended": True,
        },
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["schema"] == IMAGE_SEED_SCHEMA
    assert body["kind"] == "image_seed"
    assert isinstance(body["master_seed"], int)
    assert body["source_field"]["values"]


def test_image_seed_multipart_endpoint() -> None:
    files = {"file": ("seed.png", _png_bytes(), "image/png")}
    data = {
        "substance": "lsd",
        "mode": "open",
        "intensity": "0.7",
        "influence": "0.5",
    }
    res = client.post("/api/v1/visualize/image-seed", files=files, data=data)
    assert res.status_code == 200, res.text
    assert res.json()["master_seed"] >= 0


def test_timeline_accepts_image_modulator_and_hints() -> None:
    res = client.post(
        "/api/v1/visualize/parameter-timeline",
        json={
            "substance": "lsd",
            "mode": "open",
            "intensity": 0.6,
            "seed": 12345,
            "steps": 4,
            "modulators": {"image": 0.8},
            "image_hints": {"palette_energy": 0.12, "turbulence": 0.05},
        },
    )
    assert res.status_code == 200, res.text
    frames = res.json()["frames"]
    assert frames[0]["parameters"]["palette_energy"] >= 0.0
