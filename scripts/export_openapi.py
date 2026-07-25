#!/usr/bin/env python3
"""Export the live FastAPI OpenAPI document into docs/contracts/."""

from __future__ import annotations

import json
from pathlib import Path

from psyfi_api.main import app

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "contracts" / "openapi.json"


def main() -> None:
    """Write the current OpenAPI snapshot."""
    OUT.parent.mkdir(parents=True, exist_ok=True)
    schema = app.openapi()
    OUT.write_text(json.dumps(schema, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)} ({len(schema.get('paths', {}))} paths)")


if __name__ == "__main__":
    main()
