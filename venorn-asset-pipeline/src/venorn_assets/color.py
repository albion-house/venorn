"""Color measurements shared by the stages."""

from __future__ import annotations

import numpy as np


def hue_saturation_value(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Hue in degrees, and saturation and value between 0 and 1, for an RGB image."""
    scaled = rgb.astype(np.float32) / 255.0
    high, low = scaled.max(axis=-1), scaled.min(axis=-1)
    spread = high - low
    saturation = np.where(high > 0, spread / np.maximum(high, 1e-6), 0)
    red, green, blue = scaled[..., 0], scaled[..., 1], scaled[..., 2]
    safe = np.maximum(spread, 1e-6)
    hue = np.select(
        [high == red, high == green],
        [((green - blue) / safe) % 6, (blue - red) / safe + 2],
        default=(red - green) / safe + 4,
    )
    return hue * 60.0, saturation, high


def to_hex(color: np.ndarray) -> str:
    red, green, blue = (int(round(float(v))) for v in color[:3])
    return f"#{red:02x}{green:02x}{blue:02x}"
