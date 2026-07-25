#!/usr/bin/env python3
"""Regenerate substance overlay golden hashes after catalog/overlay changes."""

from __future__ import annotations

import json
from pathlib import Path

from psyfi_core.experiences.catalog import get_default_catalog
from psyfi_core.experiences.parameter_mapper import build_parameter_timeline, map_parameters

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "tests" / "fixtures" / "experiences" / "substance_overlay_goldens.v1.json"
SUBSTANCES = (
    "lsd",
    "psilocybin",
    "dmt",
    "5-meo-dmt",
    "mescaline",
    "ketamine",
    "mdma",
    "2c-b",
    "2c-e",
    "al-lad",
    "mxe",
    "mda",
    "pcp",
    "eth-lad",
    "jhana",
    "dxm",
)


def main() -> None:
    get_default_catalog.cache_clear()
    seed = 1337
    intensity = 0.8
    mode = "open"
    phase_t = 0.5
    steps = 8
    substances = {}
    for substance in SUBSTANCES:
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
        substances[substance] = {
            "snapshot_hash": snap.hash,
            "timeline_hash": tl["timeline_hash"],
            "palette_tracers": snap.palette["tracers"],
            "pattern_complexity": snap.parameters.get("pattern_complexity"),
            "symmetry_order": snap.parameters.get("symmetry_order"),
            "top_engines": [
                {"name": name, "weight": weight}
                for name, weight in sorted(snap.engines.items(), key=lambda kv: -kv[1])[:3]
            ],
        }

    hashes = [item["snapshot_hash"] for item in substances.values()]
    if len(hashes) != len(set(hashes)):
        raise SystemExit("Substance overlays are not distinct under the golden seed")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                "schema_version": "1.0.0",
                "seed": seed,
                "intensity": intensity,
                "mode": mode,
                "phase_t": phase_t,
                "steps": steps,
                "substances": substances,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUT.relative_to(ROOT)}")
    for substance, payload in substances.items():
        top = payload["top_engines"][0]["name"]
        print(f"  {substance}: {payload['snapshot_hash']} ({top})")


if __name__ == "__main__":
    main()
