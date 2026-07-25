"""Tests for preset catalog and visualization payload integration."""

import numpy as np
from fastapi.testclient import TestClient

from psyfi_api.main import app
from psyfi_core.models.session import PsyFiVisualization
from psyfi_core.visualization import build_magnitude_visualization


def test_preset_catalog_lists_existing_registry() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/presets/")
        legacy = client.get("/api/presets/")
    assert response.status_code == 200
    assert legacy.status_code == 200
    payload = response.json()
    assert payload["count"] >= 1
    ids = {item["id"] for item in payload["presets"]}
    assert "lsd" in ids
    assert "dmt" in ids
    assert legacy.json()["count"] == payload["count"]


def test_preset_detail_and_simulate_with_dmt() -> None:
    with TestClient(app) as client:
        detail = client.get("/api/v1/presets/dmt")
        assert detail.status_code == 200
        assert detail.json()["coupling_strength"] > 1.0

        simulated = client.post(
            "/api/v1/simulate/",
            json={"width": 32, "height": 32, "steps": 4, "seed": 9, "preset": "dmt"},
        )
    assert simulated.status_code == 200
    body = simulated.json()
    assert body["preset"] == "dmt"
    assert body["api_version"] == "v1"
    assert "visualization" in body
    viz = PsyFiVisualization.model_validate(body["visualization"])
    assert viz.field["width"] <= 64
    assert viz.field["height"] <= 64
    assert len(viz.field["values"]) == viz.field["height"]
    assert len(viz.field["values"][0]) == viz.field["width"]


def test_magnitude_visualization_downsamples() -> None:
    field = (np.ones((128, 96), dtype=np.float32) * np.exp(1j * 0.25)).astype(np.complex64)
    viz = build_magnitude_visualization(field, "prov_test", max_dim=32)
    assert viz.field["width"] <= 32
    assert viz.field["height"] <= 32
    assert viz.accessibility.summary
