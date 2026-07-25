#!/usr/bin/env python3
"""Merge a measured Ultra fps sample into the hardware matrix fixture.

Usage:
  python3 scripts/merge_ultra_fps_measured.py path/to/ultra_fps_sample.json
  python3 scripts/merge_ultra_fps_measured.py sample.json --promote-synthetic

Downloads come from /gpu/?measure_fps=1 (schema psyfi.ultra_fps_sample.v1).
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MEASURED = (
    ROOT
    / "packages"
    / "psyfi-gpu-renderer"
    / "fixtures"
    / "qa"
    / "ultra_fps_matrix.measured.v1.json"
)
SYNTHETIC = (
    ROOT
    / "packages"
    / "psyfi-gpu-renderer"
    / "fixtures"
    / "qa"
    / "ultra_fps_matrix.synthetic.v1.json"
)


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _write(path: Path, doc: dict) -> None:
    path.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")


def _extract_sample(payload: dict) -> dict:
    if payload.get("schema") == "psyfi.ultra_fps_sample.v1":
        sample = dict(payload["sample"])
    elif "avgFps" in payload and "id" in payload:
        sample = dict(payload)
    else:
        raise SystemExit("Unrecognized sample payload (want psyfi.ultra_fps_sample.v1)")
    sample["source"] = "measured"
    if not sample.get("id"):
        raise SystemExit("sample.id required")
    for key in ("avgFps", "low1pctFps", "p95Ms"):
        if key not in sample:
            raise SystemExit(f"sample.{key} required")
    return sample


def _upsert(samples: list[dict], sample: dict) -> list[dict]:
    out = [s for s in samples if s.get("id") != sample["id"]]
    out.append(sample)
    out.sort(key=lambda s: str(s.get("id")))
    return out


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("sample_json", type=Path, help="Downloaded measure_fps payload")
    parser.add_argument(
        "--promote-synthetic",
        action="store_true",
        help="Also replace the matching id in ultra_fps_matrix.synthetic.v1.json",
    )
    parser.add_argument(
        "--measured",
        type=Path,
        default=MEASURED,
        help="Measured matrix fixture path",
    )
    args = parser.parse_args(argv)

    payload = _load(args.sample_json)
    sample = _extract_sample(payload)
    measured = _load(args.measured) if args.measured.exists() else {
        "schema": "psyfi.ultra_fps_matrix.v1",
        "mode": "measured",
        "date": str(date.today()),
        "note": "Hardware-measured Ultra fps samples.",
        "samples": [],
    }
    measured["schema"] = "psyfi.ultra_fps_matrix.v1"
    measured["mode"] = "measured"
    measured["date"] = str(date.today())
    measured["samples"] = _upsert(list(measured.get("samples") or []), sample)
    _write(args.measured, measured)
    print(f"Wrote {args.measured} ({len(measured['samples'])} samples) · id={sample['id']}")

    if args.promote_synthetic:
        synth = _load(SYNTHETIC)
        synth["samples"] = _upsert(list(synth.get("samples") or []), sample)
        # Keep mode synthetic until every sample is measured.
        if all(s.get("source") == "measured" for s in synth["samples"]):
            synth["mode"] = "measured"
            synth["note"] = "All rows hardware-measured (promoted from measure_fps captures)."
        else:
            synth["mode"] = "synthetic"
            synth["note"] = (
                "Mixed: some rows hardware-measured via merge_ultra_fps_measured.py "
                "--promote-synthetic; others remain CI stand-ins."
            )
        synth["date"] = str(date.today())
        _write(SYNTHETIC, synth)
        measured_n = sum(1 for s in synth["samples"] if s.get("source") == "measured")
        print(f"Promoted into {SYNTHETIC} · measured={measured_n}/{len(synth['samples'])}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
