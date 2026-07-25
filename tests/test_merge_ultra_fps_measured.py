"""merge_ultra_fps_measured.py upserts measured samples."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "merge_ultra_fps_measured.py"


def test_merge_ultra_fps_measured_upsert(tmp_path: Path) -> None:
    measured = tmp_path / "measured.json"
    measured.write_text(
        json.dumps(
            {
                "schema": "psyfi.ultra_fps_matrix.v1",
                "mode": "measured",
                "date": "2026-07-25",
                "note": "test",
                "samples": [],
            }
        ),
        encoding="utf-8",
    )
    sample = tmp_path / "sample.json"
    sample.write_text(
        json.dumps(
            {
                "schema": "psyfi.ultra_fps_sample.v1",
                "sample": {
                    "id": "nvidia-rtx-4070",
                    "avgFps": 140,
                    "low1pctFps": 125,
                    "p95Ms": 7.5,
                    "source": "measured",
                    "note": "unit test",
                },
            }
        ),
        encoding="utf-8",
    )
    proc = subprocess.run(
        [sys.executable, str(SCRIPT), str(sample), "--measured", str(measured)],
        check=True,
        capture_output=True,
        text=True,
    )
    assert "nvidia-rtx-4070" in proc.stdout
    doc = json.loads(measured.read_text(encoding="utf-8"))
    assert doc["mode"] == "measured"
    assert len(doc["samples"]) == 1
    assert doc["samples"][0]["avgFps"] == 140
