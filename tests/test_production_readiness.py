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


def test_production_readiness_board_doc() -> None:
    board = (ROOT / "docs" / "PRODUCTION_READINESS.md").read_text(encoding="utf-8")
    assert "Production Readiness Board" in board
    assert "unfrozen" in board.lower()
    assert "hard freeze" in board.lower() or "hard_frozen" in board
    assert "Docker" in board


def test_device_matrix_unfrozen() -> None:
    matrix = (ROOT / "docs" / "BROWSER_CAPABILITY_MATRIX.md").read_text(encoding="utf-8")
    assert "unfrozen" in matrix.lower()
    assert "does **not** block" in matrix


def test_hard_freeze_manifest_policy() -> None:
    manifest = json.loads((ROOT / "docs" / "contracts" / "frozen" / "MANIFEST.json").read_text())
    assert manifest["status"] == "hard_frozen"
    assert manifest["policy"]["device_matrix"] == "living_continuous_qa_not_blocking"
