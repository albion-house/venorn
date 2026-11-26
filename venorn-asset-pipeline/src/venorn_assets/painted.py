"""Find the things that are painted on the structure.

A painted thing is a patch of the structure that carries paint in a declared
hue range, such as green stems and leaves, together with whatever colored
parts it touches, such as the flowers on those stems.
"""

from __future__ import annotations

import colorsys

import numpy as np
from scipy import ndimage

from .color import hue_saturation_value

# Pixels this close to the structure's outline pick up the colors behind it, so they are left out.
OUTLINE_MARGIN = 8
# A painted thing has at least this many pixels of paint in its hue, and this many pixels in all.
MIN_PAINT = 120
MIN_SIZE = 500
# Parts of a painted thing less than twice this many pixels apart are joined.
JOIN = 3
# Paint is at least this saturated and this bright. The structure's own surface is paler.
PAINT_SATURATION = 0.45
PAINT_VALUE = 0.5
# A carried thing joins paint that comes within this many pixels of it.
CARRY_REACH = 9


def _structure_hue(rgb: np.ndarray, structure: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray, float]:
    """Hue, saturation and value of every pixel, and how far each hue is from the structure's own."""
    hue, saturation, value = hue_saturation_value(rgb)
    base = tuple(float(np.median(rgb[..., channel][structure])) / 255.0 for channel in range(3))
    base_hue = colorsys.rgb_to_hsv(*base)[0] * 360.0
    return hue, saturation, value, base_hue


def find_painted(
    rgb: np.ndarray,
    structure: np.ndarray,
    hue_range: tuple[float, float],
    carried: np.ndarray,
    others: np.ndarray,
) -> list[np.ndarray]:
    """Outline each painted thing.

    carried marks the things a painted thing may carry, such as flowers.
    others marks the things on the structure that belong to no painted thing.
    """
    inner = ndimage.binary_erosion(structure, iterations=OUTLINE_MARGIN)
    free = inner & ~ndimage.binary_dilation(others, iterations=3)
    hue, saturation, value, base_hue = _structure_hue(rgb, structure)

    # Paint is bright. A hole in the structure can show the same hue from behind, but dark.
    paint = free & (hue > hue_range[0]) & (hue < hue_range[1]) & (saturation > PAINT_SATURATION) & (value > PAINT_VALUE)
    paint = ndimage.binary_opening(paint, iterations=1)
    # Colored parts with no outline of their own, such as buds, join the paint they touch.
    # The structure's own shadows are close to its hue, so they stay out.
    hue_distance = np.abs((hue - base_hue + 180.0) % 360.0 - 180.0)
    loose = free & (hue_distance > 40.0) & (saturation > 0.3)
    marks = paint | (carried & free) | ndimage.binary_opening(loose, iterations=1)

    # A carried thing joins the paint it sits beside, across the gap its own soft edge leaves.
    near = ndimage.binary_dilation(marks, iterations=JOIN) | ndimage.binary_dilation(
        carried & free, iterations=CARRY_REACH
    )
    labels, _ = ndimage.label(near)
    found = []
    for label, window in enumerate(ndimage.find_objects(labels), start=1):
        patch = (labels[window] == label) & marks[window]
        if patch.sum() < MIN_SIZE or (patch & paint[window]).sum() < MIN_PAINT:
            continue
        # A leaf's pale middle is paint too. Closing the outline takes it in.
        patch = ndimage.binary_fill_holes(ndimage.binary_closing(patch, iterations=2)) & free[window]
        mask = np.zeros_like(structure)
        mask[window] = patch
        found.append(mask)
    return sorted(found, key=lambda mask: int(mask.sum()), reverse=True)


def carried_by(mask: np.ndarray, painted: list[np.ndarray]) -> bool:
    """Whether a thing sits on one of the painted things, with most of it inside."""
    size = int(mask.sum())
    return size > 0 and any(int((mask & thing).sum()) > 0.5 * size for thing in painted)
