"""Tests for ResonanceFrame model."""

import numpy as np
import pytest

from psyfi_core.models import ResonanceFrame


def test_resonance_frame_zeros() -> None:
    """Test creating a zero resonance frame."""
    width, height = 32, 16
    frame = ResonanceFrame.zeros(width, height)

    assert frame.width == width
    assert frame.height == height
    assert frame.field.shape == (height, width)
    assert frame.field.dtype == np.complex64
    assert np.all(frame.field == 0)


def test_resonance_frame_copy_with_field() -> None:
    """Test copying a frame with a new field."""
    width, height = 32, 16
    frame = ResonanceFrame.zeros(width, height)

    # Create new field
    new_field = np.ones((height, width), dtype=np.complex64)
    new_frame = frame.copy_with_field(new_field)

    assert new_frame.width == width
    assert new_frame.height == height
    assert np.all(new_frame.field == 1.0)

    # Original should be unchanged
    assert np.all(frame.field == 0)


def test_resonance_frame_copy_with_field_wrong_shape() -> None:
    """Test that copy_with_field rejects wrong shape."""
    width, height = 32, 16
    frame = ResonanceFrame.zeros(width, height)

    # Wrong shape
    wrong_field = np.ones((10, 10), dtype=np.complex64)

    with pytest.raises(ValueError, match="doesn't match"):
        frame.copy_with_field(wrong_field)


def test_resonance_frame_metadata() -> None:
    """Test that metadata is preserved in copy_with_field."""
    frame = ResonanceFrame.zeros(32, 16)
    frame.metadata["test"] = "value"

    new_field = np.ones((16, 32), dtype=np.complex64)
    new_frame = frame.copy_with_field(new_field)

    assert new_frame.metadata["test"] == "value"
