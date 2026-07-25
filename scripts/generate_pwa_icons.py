#!/usr/bin/env python3
"""Generate minimal solid PNG icons for PWA installability (stdlib only)."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "psyfi_api" / "static"


def _chunk(tag: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + tag
        + data
        + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    )


def write_png(path: Path, size: int, rgb: tuple[int, int, int]) -> None:
    """Write a solid-color RGBA PNG."""
    r, g, b = rgb
    raw = bytearray()
    for _y in range(size):
        raw.append(0)  # filter none
        for _x in range(size):
            raw.extend((r, g, b, 255))

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    png = b"".join(
        [
            b"\x89PNG\r\n\x1a\n",
            _chunk(b"IHDR", ihdr),
            _chunk(b"IDAT", zlib.compress(bytes(raw), 9)),
            _chunk(b"IEND", b""),
        ]
    )
    path.write_bytes(png)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    # Brand cyan-ish fill for install icons.
    color = (62, 231, 242)
    for size in (192, 512):
        out = OUT_DIR / f"icon-{size}.png"
        write_png(out, size, color)
        print(f"Wrote {out.relative_to(ROOT)} ({size}x{size})")


if __name__ == "__main__":
    main()
