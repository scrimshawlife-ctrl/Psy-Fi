"""Experience catalog loading and curated phenomenology recipes."""

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG_PATH = ROOT / "data" / "phenomenology" / "derived" / "experience_catalog.v1.json"


@dataclass
class ExperienceCatalog:
    """In-memory experience recipe catalog."""

    schema_version: str
    recipes: list[dict[str, Any]]
    path: Path | None = None

    def list(
        self,
        *,
        substance: str | None = None,
        valence: str | None = "positive",
        mode: str | None = None,
    ) -> list[dict[str, Any]]:
        out = self.recipes
        if substance:
            s = substance.lower().replace("_", "-")
            out = [r for r in out if r.get("substance", "").lower().replace("_", "-") == s]
        if valence:
            out = [r for r in out if r.get("valence") == valence]
        if mode:
            m = mode.lower()
            out = [
                r
                for r in out
                if (r.get("visual_recipe") or {}).get("mode_default", "open") == m
                or m in (r.get("modes") or [])
            ]
        return out

    def get(self, experience_id: str) -> dict[str, Any] | None:
        for r in self.recipes:
            if r.get("id") == experience_id:
                return r
        return None

    def substances(self) -> list[str]:
        return sorted({r.get("substance", "unknown") for r in self.recipes})


def load_catalog(path: Path | str | None = None) -> ExperienceCatalog:
    catalog_path = Path(path) if path else DEFAULT_CATALOG_PATH
    if not catalog_path.exists():
        # Fall back to built-in minimal catalog beside this module
        catalog_path = Path(__file__).with_name("builtin_catalog.v1.json")
    data = json.loads(catalog_path.read_text(encoding="utf-8"))
    recipes = data.get("recipes") or data.get("experiences") or []
    return ExperienceCatalog(
        schema_version=data.get("schema_version", "1.0.0"),
        recipes=list(recipes),
        path=catalog_path if catalog_path.exists() else None,
    )


@lru_cache(maxsize=4)
def get_default_catalog() -> ExperienceCatalog:
    return load_catalog()
