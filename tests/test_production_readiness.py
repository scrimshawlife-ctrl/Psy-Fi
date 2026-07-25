"""Production readiness board + hard-freeze ship gates."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_readme_has_production_readiness_board() -> None:
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    assert "## Production readiness" in readme
    assert "docs/PRODUCTION_READINESS.md" in readme
    assert "hard_frozen" in readme or "hard freeze" in readme.lower()
    assert "NVIDIA" in readme or "nvidia" in readme.lower()


def test_nvidia_gpu_doc_covers_rtx_5060() -> None:
    doc = (ROOT / "docs" / "NVIDIA_GPU.md").read_text(encoding="utf-8")
    assert "RTX 5060" in doc
    assert "WebGPU" in doc
    assert "--profile nvidia" in doc
    assert (ROOT / "scripts" / "check_nvidia_host.sh").exists()


def test_production_readiness_board_doc() -> None:
    board = (ROOT / "docs" / "PRODUCTION_READINESS.md").read_text(encoding="utf-8")
    assert "Production Readiness Board" in board
    assert "filled" in board.lower()
    assert "hard freeze" in board.lower() or "hard_frozen" in board
    assert "Docker" in board
    assert "G3 premium desktop stack" in board


def test_device_matrix_filled() -> None:
    matrix = (ROOT / "docs" / "BROWSER_CAPABILITY_MATRIX.md").read_text(encoding="utf-8")
    assert "filled" in matrix.lower()
    assert "does **not** block" in matrix
    for needle in (
        "iPhone 15 Pro",
        "Pixel 8",
        "MacBook Pro M3",
        "RTX 4060",
        "Firefox 128",
    ):
        assert needle in matrix


def test_phase4_evidence_filled() -> None:
    phase4 = (ROOT / "docs" / "PHASE4_USABILITY.md").read_text(encoding="utf-8")
    assert "evidence filled" in phase4.lower()
    assert "✅ pass" in phase4
    assert "_pending_" not in phase4


def test_hard_freeze_manifest_policy() -> None:
    manifest = json.loads((ROOT / "docs" / "contracts" / "frozen" / "MANIFEST.json").read_text())
    assert manifest["status"] == "hard_frozen"
    assert manifest["policy"]["device_matrix"] == "living_continuous_qa_not_blocking"
