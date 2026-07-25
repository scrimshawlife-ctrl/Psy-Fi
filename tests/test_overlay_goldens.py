"""P0: substance overlay distinctness goldens for contract freeze prep."""

from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient

from psyfi_api.main import app
from psyfi_core.experiences.parameter_mapper import build_parameter_timeline, map_parameters

ROOT = Path(__file__).resolve().parents[1]
GOLDENS = ROOT / "tests" / "fixtures" / "experiences" / "substance_overlay_goldens.v1.json"


def test_overlay_goldens_match_frozen_hashes() -> None:
    data = json.loads(GOLDENS.read_text(encoding="utf-8"))
    seed = data["seed"]
    intensity = data["intensity"]
    mode = data["mode"]
    phase_t = data["phase_t"]
    steps = data["steps"]

    hashes = []
    for substance, expected in data["substances"].items():
        snap = map_parameters(
            substance=substance,
            mode=mode,
            intensity=intensity,
            seed=seed,
            phase_t=phase_t,
        )
        tl = build_parameter_timeline(
            steps=steps,
            substance=substance,
            mode=mode,
            intensity=intensity,
            seed=seed,
        )
        assert snap.hash == expected["snapshot_hash"], substance
        assert tl["timeline_hash"] == expected["timeline_hash"], substance
        assert snap.palette["tracers"] == expected["palette_tracers"]
        hashes.append(snap.hash)

    assert len(hashes) == len(set(hashes)), "substance overlays must remain visually distinct"


def test_modulators_change_field_but_stay_clamped() -> None:
    base = map_parameters(substance="lsd", mode="open", seed=9, intensity=0.7, phase_t=0.5)
    mod = map_parameters(
        substance="lsd",
        mode="open",
        seed=9,
        intensity=0.7,
        phase_t=0.5,
        modulators={"camera": 0.8, "motion": 0.5, "midi": 0.6, "audio": 0.7, "haptics": 0.4},
    )
    assert mod.hash != base.hash
    assert mod.parameters["flash_energy"] <= mod.safety["max_flash_hz"] / 3.0
    audio_only = map_parameters(
        substance="lsd",
        mode="open",
        seed=9,
        intensity=0.7,
        phase_t=0.5,
        modulators={"audio": 0.9},
    )
    haptics_only = map_parameters(
        substance="lsd",
        mode="open",
        seed=9,
        intensity=0.7,
        phase_t=0.5,
        modulators={"haptics": 0.9},
    )
    assert audio_only.hash != base.hash
    assert haptics_only.hash != base.hash
    assert audio_only.hash != haptics_only.hash


def test_field_frame_bridge_endpoint() -> None:
    with TestClient(app) as client:
        res = client.post(
            "/api/v1/visualize/field-frame",
            json={
                "width": 24,
                "height": 24,
                "steps": 3,
                "seed": 21,
                "substance": "psilocybin",
                "preset": "psilocybin",
                "mode": "open",
                "intensity": 0.6,
            },
        )
    assert res.status_code == 200
    body = res.json()
    assert body["kind"] == "field_frame"
    assert body["simulation"]["visualization"]
    assert body["parameter_field"]["hash"]
