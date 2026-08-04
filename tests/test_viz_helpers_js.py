"""Run Node numeric invariant tests for Live Experience viz helpers."""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "tests" / "js" / "run_viz_helper_tests.mjs"


@pytest.mark.skipif(shutil.which("node") is None, reason="node not available")
def test_viz_helper_numeric_invariants() -> None:
    assert SCRIPT.is_file()
    proc = subprocess.run(
        ["node", str(SCRIPT)],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        check=False,
    )
    assert proc.returncode == 0, proc.stdout + "\n" + proc.stderr
    assert "viz helper tests: ok" in proc.stdout
