"""Optional product art pack manifests for GPU scene-snapshots.

Procedural geometry remains authoritative. Packs only attach {id,url} refs when
resolved; CI ships an empty registry (no product binaries).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

PACK_SCHEMA = "psyfi.asset_pack.v1"
_ROOT = Path(__file__).resolve().parents[2]
_EMPTY_FIXTURE = _ROOT / "docs" / "contracts" / "fixtures" / "asset_pack.empty.v1.json"
_PACK_DIR = _ROOT / "packages" / "psyfi-gpu-renderer" / "public" / "assets" / "packs"


def _load_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) else None


def normalize_pack_manifest(raw: dict[str, Any] | None) -> dict[str, Any] | None:
    if not raw or raw.get("schema") != PACK_SCHEMA:
        return None
    pack_id = str(raw.get("id") or "").strip()
    if not pack_id:
        return None

    def refs(key: str) -> list[dict[str, str]]:
        out: list[dict[str, str]] = []
        for i, row in enumerate(raw.get(key) or []):
            if not isinstance(row, dict):
                continue
            url = str(row.get("url") or row.get("href") or "").strip()
            if not url:
                continue
            rid = str(row.get("id") or f"{key}-{i}")
            item = {"id": rid, "url": url}
            role = row.get("role")
            if isinstance(role, str) and role:
                item["role"] = role
            out.append(item)
        return out

    return {
        "schema": PACK_SCHEMA,
        "id": pack_id,
        "version": str(raw.get("version") or "0.0.0"),
        "procedural_fallback": bool(raw.get("procedural_fallback", True)),
        "license": str(raw.get("license") or ""),
        "status": str(raw.get("status") or "stub"),
        "gltf": refs("gltf"),
        "ktx2": refs("ktx2"),
        "splats": refs("splats"),
    }


def list_registered_packs() -> list[dict[str, Any]]:
    """Registered packs: empty stub fixture + any manifests under public/assets/packs."""
    packs: list[dict[str, Any]] = []
    empty = normalize_pack_manifest(_load_json(_EMPTY_FIXTURE))
    if empty:
        packs.append(empty)
    if _PACK_DIR.is_dir():
        for path in sorted(_PACK_DIR.glob("*.json")):
            norm = normalize_pack_manifest(_load_json(path))
            if norm and not any(p["id"] == norm["id"] for p in packs):
                packs.append(norm)
    return packs


def resolve_pack(pack_id: str | None) -> dict[str, Any] | None:
    if not pack_id:
        return None
    want = pack_id.strip()
    for pack in list_registered_packs():
        if pack["id"] == want:
            return pack
    return None


def attach_pack_assets(
    assets: dict[str, list[dict[str, str]]] | None,
    pack_id: str | None,
) -> dict[str, list[dict[str, str]]]:
    """Merge pack refs into snapshot assets. Unknown pack → unchanged/empty."""
    base = {
        "gltf": list((assets or {}).get("gltf") or []),
        "ktx2": list((assets or {}).get("ktx2") or []),
        "splats": list((assets or {}).get("splats") or []),
        "images": list((assets or {}).get("images") or []),
    }
    pack = resolve_pack(pack_id)
    if not pack:
        return base
    for key in ("gltf", "ktx2", "splats"):
        seen = {r["id"] for r in base[key]}
        for row in pack.get(key) or []:
            if row["id"] not in seen:
                base[key].append(dict(row))
                seen.add(row["id"])
    return base
