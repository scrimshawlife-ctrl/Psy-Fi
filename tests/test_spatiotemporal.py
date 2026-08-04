"""I3 spatiotemporal anchors — normalize, solar elevation, image-seed / export-journey."""

from __future__ import annotations

import base64
import io

from fastapi.testclient import TestClient
from PIL import Image

from psyfi_api.main import app
from psyfi_core.visualization.export_journey import build_export_journey
from psyfi_core.visualization.image_seed import build_image_seed
from psyfi_core.visualization.spatiotemporal import (
    SPATIOTEMPORAL_SCHEMA,
    normalize_anchors,
    solar_elevation_deg,
)

client = TestClient(app)


def _png_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("RGBA", (48, 32), (80, 140, 200, 255)).save(buf, format="PNG")
    return buf.getvalue()


def test_solar_elevation_deterministic() -> None:
    a = solar_elevation_deg(latitude=37.77, longitude=0.0, day_of_year=172, hour=14.0)
    b = solar_elevation_deg(latitude=37.77, longitude=0.0, day_of_year=172, hour=14.0)
    assert a == b
    night = solar_elevation_deg(latitude=37.77, longitude=0.0, day_of_year=172, hour=2.0)
    assert night < a
    noon = solar_elevation_deg(latitude=0.0, longitude=0.0, day_of_year=80, hour=12.0)
    assert noon > 50.0


def test_normalize_derives_solar_elevation() -> None:
    packet = normalize_anchors(
        {"latitude": 37.77, "longitude": -122.42, "year": 2026, "hour": 14.0}
    )
    assert packet is not None
    assert packet["schema"] == SPATIOTEMPORAL_SCHEMA
    assert packet["solar_elevation_source"] == "derived"
    assert packet["solar_elevation_deg"] is not None
    assert packet["claim"] == "INFERRED"


def test_normalize_keeps_provided_solar() -> None:
    packet = normalize_anchors(
        {"latitude": 10.0, "longitude": 20.0, "hour": 12.0, "solar_elevation_deg": 42.5}
    )
    assert packet is not None
    assert packet["solar_elevation_deg"] == 42.5
    assert packet["solar_elevation_source"] == "provided"
    assert packet["claim"] == "OBSERVED"


def test_image_seed_echoes_anchors() -> None:
    a = build_image_seed(
        image=_png_bytes(),
        substance="lsd",
        influence=0.5,
        spatiotemporal_anchors={
            "latitude": 37.77,
            "longitude": -122.42,
            "year": 2026,
            "hour": 15.0,
        },
    )
    b = build_image_seed(
        image=_png_bytes(),
        substance="lsd",
        influence=0.5,
        spatiotemporal_anchors={
            "latitude": 37.77,
            "longitude": -122.42,
            "year": 2026,
            "hour": 15.0,
        },
    )
    assert a["spatiotemporal_anchors"]["solar_elevation_deg"] == b["spatiotemporal_anchors"][
        "solar_elevation_deg"
    ]
    assert a["master_seed"] == b["master_seed"]


def test_image_seed_json_endpoint_anchors() -> None:
    b64 = base64.b64encode(_png_bytes()).decode("ascii")
    res = client.post(
        "/api/v1/visualize/image-seed/json",
        json={
            "image_base64": b64,
            "substance": "lsd",
            "influence": 0.4,
            "include_preview": False,
            "include_source_field": False,
            "spatiotemporal_anchors": {
                "latitude": 48.85,
                "longitude": 2.35,
                "year": 2024,
                "hour": 12.0,
            },
        },
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["spatiotemporal_anchors"]["latitude"] == 48.85
    assert body["spatiotemporal_anchors"]["solar_elevation_source"] == "derived"


def test_export_journey_prompt_includes_anchors() -> None:
    pkg = build_export_journey(
        timeline={
            "substance": "lsd",
            "mode": "open",
            "intensity": 0.6,
            "seed": 3,
            "frames": [{"phase": "peak"}],
        },
        spatiotemporal_anchors={
            "latitude": 37.77,
            "longitude": -122.42,
            "year": 2026,
            "hour": 14.0,
        },
    )
    assert pkg["spatiotemporal_anchors"] is not None
    assert "solar elevation" in pkg["t2v"]["prompt"].lower()
    assert "Spatiotemporal plate" in pkg["t2v"]["prompt"]


def test_export_journey_endpoint_anchors() -> None:
    res = client.post(
        "/api/v1/visualize/export-journey",
        json={
            "timeline": {
                "substance": "psilocybin",
                "mode": "open",
                "intensity": 0.5,
                "seed": 9,
                "frames": [{"phase": "comeup"}, {"phase": "peak"}],
            },
            "spatiotemporal_anchors": {
                "latitude": 0.0,
                "longitude": 0.0,
                "year": 2020,
                "hour": 12.0,
            },
        },
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["spatiotemporal_anchors"]["solar_elevation_deg"] is not None
    assert "0.00" in body["t2v"]["prompt"] or "grounded near" in body["t2v"]["prompt"]
