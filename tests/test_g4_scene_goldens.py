"""G4 cutover: canonical scene-snapshot structure goldens (CPU-side visual smoke)."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from psyfi_core.experiences.parameter_mapper import map_parameters
from psyfi_core.visualization.scene_snapshot import build_scene_snapshot

ROOT = Path(__file__).resolve().parents[1]
GOLDENS = ROOT / "tests" / "fixtures" / "experiences" / "g4_scene_snapshot_goldens.v1.json"


def _fingerprint(snap: dict) -> str:
    proc = snap["procedural"]
    payload = {
        "quality_tier": snap["quality_tier"],
        "pf_hash": snap["parameter_field"]["hash"],
        "counts": {k: len(v) for k, v in proc.items()},
        "crystal_ids": [n.get("id") for n in proc["crystals"][:8]],
        "glyph_ids": [n.get("id") for n in proc["glyphs"][:8]],
        "post": snap["post"],
        "assets": snap["assets"],
    }
    blob = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(blob.encode()).hexdigest()


def test_g4_canonical_scene_snapshot_goldens() -> None:
    data = json.loads(GOLDENS.read_text(encoding="utf-8"))
    assert data["schema"] == "psyfi.g4_scene_snapshot_goldens.v1"
    tier = data["quality_tier"]
    fingerprints: list[str] = []

    for key, expected in data["cases"].items():
        field = map_parameters(
            substance=expected["substance"],
            mode=expected["mode"],
            intensity=expected["intensity"],
            seed=expected["seed"],
        ).to_dict()
        snap = build_scene_snapshot(
            parameter_field=field,
            quality_tier=tier,
            sequence=1,
            snapshot_id="golden",
        )
        assert snap["assets"] == {"gltf": [], "ktx2": [], "splats": [], "images": []}
        assert snap["parameter_field"]["hash"] == expected["parameter_field_hash"], key
        counts = {k: len(v) for k, v in snap["procedural"].items()}
        assert counts == expected["counts"], key
        fp = _fingerprint(snap)
        assert fp == expected["fingerprint"], key
        fingerprints.append(fp)

    assert len(fingerprints) == len(set(fingerprints)), "G4 seeds must remain structurally distinct"
