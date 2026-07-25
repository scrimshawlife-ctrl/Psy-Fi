#!/usr/bin/env python3
"""Sync living contract artifacts into docs/contracts/frozen/ for soft freeze."""

from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FROZEN = ROOT / "docs" / "contracts" / "frozen"

COPIES = [
    (ROOT / "docs" / "contracts" / "openapi.json", FROZEN / "openapi.v1.json"),
    (ROOT / "psyfi_core" / "schemas" / "session.schema.json", FROZEN / "session.schema.v1.json"),
    (
        ROOT / "docs" / "schemas" / "psyfi_experience_recipe.v1.json",
        FROZEN / "psyfi_experience_recipe.v1.json",
    ),
    (
        ROOT / "docs" / "schemas" / "psyfi_parameter_field.v1.json",
        FROZEN / "psyfi_parameter_field.v1.json",
    ),
    (
        ROOT / "docs" / "schemas" / "psyfi_visual_frame.v1.json",
        FROZEN / "psyfi_visual_frame.v1.json",
    ),
    (
        ROOT / "tests" / "fixtures" / "experiences" / "substance_overlay_goldens.v1.json",
        FROZEN / "substance_overlay_goldens.v1.json",
    ),
    (
        ROOT / "data" / "phenomenology" / "derived" / "substance_visual_overlays.v1.json",
        FROZEN / "substance_visual_overlays.v1.json",
    ),
]


def main() -> None:
    FROZEN.mkdir(parents=True, exist_ok=True)
    for src, dst in COPIES:
        if not src.exists():
            raise SystemExit(f"Missing source artifact: {src}")
        shutil.copy2(src, dst)
        print(f"Synced {src.relative_to(ROOT)} -> {dst.relative_to(ROOT)}")

    manifest_path = FROZEN / "MANIFEST.json"
    manifest = {
        "schema_version": "1.0.0",
        "freeze_id": "psyfi-api-v1-soft-2026-07-25",
        "status": "soft_frozen",
        "frozen_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "api_version": "v1",
        "policy": {
            "additive_ok": True,
            "breaking_requires": "version bump discussion + new freeze_id",
            "hard_freeze_requires": [
                "physical_device_matrix_rows",
                "phase4_usability_evidence",
            ],
        },
        "artifacts": sorted(p.name for p in FROZEN.iterdir() if p.is_file()),
    }
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {manifest_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
