"""Paint the things off the structure, leaving bare bone.

The areas to clear are the cataloged instances plus every pixel whose color is
far from the structure's own color, which catches stems, pins and anything the
detector missed. The cleared areas are filled with color blended in from the
bone around them.
"""

from __future__ import annotations

import colorsys

import numpy as np
from scipy import ndimage


def _hue_saturation_value(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
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


def find_additions(rgb: np.ndarray, structure: np.ndarray, cataloged: np.ndarray) -> np.ndarray:
    """Mark every pixel of the structure that is something added to it."""
    hue, saturation, value = _hue_saturation_value(rgb)

    # The structure's own color: the typical hue and saturation of the pixels no instance covers.
    plain = structure & ~cataloged
    base_red, base_green, base_blue = (float(np.median(rgb[..., c][plain])) / 255.0 for c in range(3))
    base_hue, base_saturation, _ = colorsys.rgb_to_hsv(base_red, base_green, base_blue)
    base_hue *= 360.0

    hue_distance = np.abs((hue - base_hue + 180.0) % 360.0 - 180.0)
    # Bright and strongly colored. The structure's own shadows are strongly colored too, but dark.
    vivid = (saturation > max(0.7, base_saturation + 0.3)) & (value > 0.6)
    off_hue = (hue_distance > 15.0) & (saturation > 0.12)
    colored = ndimage.binary_opening(structure & (vivid | off_hue), iterations=1)

    # Widen each area so the shadow a thing casts on the structure is cleared with it.
    additions = ndimage.binary_dilation(cataloged, iterations=7) | ndimage.binary_dilation(colored, iterations=5)
    return additions & structure


def fill(rgb: np.ndarray, hole: np.ndarray, usable: np.ndarray) -> np.ndarray:
    """Fill the hole with color blended in from the usable pixels around it, nearest first."""
    result = rgb.astype(np.float32)
    known = usable & ~hole
    for sigma in (2, 4, 8, 16, 32, 64, 128):
        todo = hole & ~known
        if not todo.any():
            break
        weight = ndimage.gaussian_filter(known.astype(np.float32), sigma)
        reachable = todo & (weight > 0.02)
        for channel in range(3):
            blurred = ndimage.gaussian_filter(result[..., channel] * known, sigma)
            result[..., channel][reachable] = blurred[reachable] / weight[reachable]
        known = known | reachable

    # Soften the seams between the passes without touching the bone that was kept.
    inside = hole & usable
    for _ in range(12):
        for channel in range(3):
            smoothed = ndimage.gaussian_filter(result[..., channel], 2.0)
            result[..., channel][inside] = smoothed[inside]
    return np.clip(np.rint(result), 0, 255).astype(np.uint8)
