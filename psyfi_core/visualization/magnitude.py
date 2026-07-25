"""Build portable magnitude visualizations from complex fields."""

from __future__ import annotations

import numpy as np

from psyfi_core.models.session import (
    PsyFiVisualization,
    VisualizationAccessibility,
    VisualizationChannel,
)


def _downsample(values: np.ndarray, max_dim: int) -> np.ndarray:
    """Average-pool a 2D array so neither side exceeds max_dim."""
    height, width = values.shape
    if height <= max_dim and width <= max_dim:
        return values

    scale = max(height / max_dim, width / max_dim)
    out_h = max(1, int(round(height / scale)))
    out_w = max(1, int(round(width / scale)))

    # Block-average without requiring scipy.
    y_idx = (np.linspace(0, height, out_h + 1)).astype(int)
    x_idx = (np.linspace(0, width, out_w + 1)).astype(int)
    out = np.zeros((out_h, out_w), dtype=np.float32)
    for y in range(out_h):
        for x in range(out_w):
            block = values[y_idx[y] : y_idx[y + 1], x_idx[x] : x_idx[x + 1]]
            out[y, x] = float(block.mean()) if block.size else 0.0
    return out


def build_magnitude_visualization(
    field: np.ndarray,
    provenance_id: str,
    *,
    max_dim: int = 64,
    valence: float | None = None,
    coherence: float | None = None,
) -> PsyFiVisualization:
    """Create a Canvas-ready magnitude scene from a complex field.

    Values are normalized to [0, 1] and downsampled so API payloads stay bounded.
    """
    magnitude = np.abs(np.asarray(field, dtype=np.complex64))
    sampled = _downsample(magnitude, max_dim=max_dim)
    peak = float(sampled.max()) if sampled.size else 0.0
    normalized = sampled / peak if peak > 0 else sampled

    height, width = normalized.shape
    metric_bits = []
    if valence is not None:
        metric_bits.append(f"valence {valence:.3f}")
    if coherence is not None:
        metric_bits.append(f"coherence {coherence:.3f}")
    metric_text = f" ({', '.join(metric_bits)})" if metric_bits else ""

    return PsyFiVisualization(
        provenance_id=provenance_id,
        frame_index=0,
        field={
            "width": width,
            "height": height,
            "normalized": True,
            "encoding": "row_major_f32",
            "data_ref": "inline:values",
            "values": normalized.astype(np.float32).tolist(),
        },
        channels=[
            VisualizationChannel(
                id="magnitude",
                role="magnitude",
                units="normalized",
                palette="signal.primary",
                blend="replace",
            )
        ],
        layers=[
            {
                "id": "field_layer",
                "channel_ids": ["magnitude"],
                "visible": True,
                "opacity": 1.0,
            }
        ],
        view={"zoom": 1.0, "pan_x": 0.0, "pan_y": 0.0, "rotation_deg": 0.0},
        accessibility=VisualizationAccessibility(
            summary=(
                f"Normalized field magnitude heatmap at {width}×{height}"
                f"{metric_text}. Modeled simulation output, not a medical reading."
            ),
            legend=[
                {
                    "label": "Magnitude",
                    "meaning": "Relative oscillator amplitude after normalization",
                    "units": "normalized [0,1]",
                }
            ],
            high_contrast_palette="status.warning",
            reduced_motion_alternative=(
                "Use the metrics table and provenance panel; the heatmap is a "
                "static frame with no required animation."
            ),
            downloadable_data_ref=None,
        ),
    )
