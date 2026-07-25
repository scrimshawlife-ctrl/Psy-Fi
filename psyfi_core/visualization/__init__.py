"""Renderer-independent visualization helpers built on existing field arrays."""

from psyfi_core.visualization.magnitude import build_magnitude_visualization
from psyfi_core.visualization.scene_snapshot import (
    SCENE_SNAPSHOT_SCHEMA,
    build_scene_snapshot,
)

__all__ = [
    "SCENE_SNAPSHOT_SCHEMA",
    "build_magnitude_visualization",
    "build_scene_snapshot",
]
