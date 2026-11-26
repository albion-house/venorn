"""Cut the ground layer into paper plants.

The ground layer is painted as bright plants on a dark base. Removing the base
leaves the plants as an ornate cutout. Each stem that reaches the bottom of the
image is a root, and everything that grows from a root becomes one plant.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from PIL import Image
from scipy import ndimage

from .color import hue_saturation_value
from .isolate import bleed_edges

# The base the plants are painted on: darker than this, in this hue range.
BASE_VALUE = 0.42
BASE_HUE = (85.0, 185.0)
# Scraps of cutout smaller than this many pixels are thrown away.
MIN_SCRAP = 80
# Roots closer together than this many pixels are one root.
ROOT_GAP = 10
# A piece that is not joined to any root goes to the nearest plant within this many pixels.
ADOPT_REACH = 25
# A part of the cutout at least this many pixels from any edge is inside a flower head.
HEAD_RADIUS = 8
# A plant has to stand at least this tall, as a share of the ground layer's height.
MIN_HEIGHT = 0.3
# Sprites are enlarged by this factor so their edges stay smooth up close.
ENLARGE = 3


@dataclass
class Plant:
    picture: Image.Image
    # Size in source pixels, and where the root sits along the width, from 0 to 1.
    width: int
    height: int
    root: float


def cut_out(rgb: np.ndarray, ground: np.ndarray) -> np.ndarray:
    """Mark the plants in the ground layer, leaving out the dark base they are painted on."""
    hue, _, value = hue_saturation_value(rgb)
    base = ground & (value < BASE_VALUE) & (hue > BASE_HUE[0]) & (hue < BASE_HUE[1])
    plants = ndimage.binary_opening(ground & ~ndimage.binary_opening(base, iterations=1), iterations=1)
    labels, count = ndimage.label(plants)
    sizes = ndimage.sum(plants, labels, range(1, count + 1))
    return np.isin(labels, 1 + np.nonzero(sizes >= MIN_SCRAP)[0])


def base_color(rgb: np.ndarray, ground: np.ndarray, cutout: np.ndarray) -> np.ndarray:
    """The color of the base the plants are painted on."""
    base = ground & ~cutout
    return np.median(rgb[base if base.any() else ground], axis=0)


def split(cutout: np.ndarray) -> np.ndarray:
    """Number each pixel of the cutout by the root it grows from. 0 marks pixels that belong to no plant."""
    height, width = cutout.shape
    bottom = np.nonzero(cutout.any(axis=1))[0].max()
    at_bottom = cutout[max(0, bottom - 3) : bottom + 1].any(axis=0)

    labels = np.zeros((height, width), dtype=np.int32)
    root = 0
    last = -ROOT_GAP - 1
    for column in np.nonzero(at_bottom)[0]:
        if column - last > ROOT_GAP:
            root += 1
        last = column
        labels[max(0, bottom - 3) : bottom + 1, column][cutout[max(0, bottom - 3) : bottom + 1, column]] = root

    # Each root's number spreads along the cutout, one pixel a round, until the plants meet.
    while True:
        spread = ndimage.maximum_filter(labels, size=3)
        grow = cutout & (labels == 0) & (spread > 0)
        if not grow.any():
            break
        labels[grow] = spread[grow]

    loose = cutout & (labels == 0)
    if loose.any() and (labels > 0).any():
        distance, nearest = ndimage.distance_transform_edt(labels == 0, return_indices=True)
        adopt = loose & (distance <= ADOPT_REACH)
        labels[adopt] = labels[nearest[0][adopt], nearest[1][adopt]]

    # A flower head is one piece. Where two plants meet inside a head, the whole head goes
    # to the plant that holds most of it.
    heads, count = ndimage.label(_thick(cutout))
    for head, window in enumerate(ndimage.find_objects(heads), start=1):
        inside = heads[window] == head
        owners = labels[window][inside]
        owners = owners[owners > 0]
        if len(owners):
            labels[window][inside] = np.bincount(owners).argmax()
    return labels


def _thick(cutout: np.ndarray) -> np.ndarray:
    """The parts of the cutout that are wide in every direction: flower heads, as opposed to stems and leaves."""
    core = ndimage.distance_transform_edt(cutout) >= HEAD_RADIUS
    return cutout & (ndimage.distance_transform_edt(~core) <= HEAD_RADIUS + 2)


def _sprite(rgb: np.ndarray, mask: np.ndarray) -> Image.Image:
    """An enlarged RGBA picture of the masked pixels with a softened edge."""
    alpha = ndimage.gaussian_filter(mask.astype(np.float32), 0.7)
    pixels = bleed_edges(np.dstack([rgb, np.rint(alpha * 255).astype(np.uint8)]))
    picture = Image.fromarray(pixels)
    return picture.resize((picture.width * ENLARGE, picture.height * ENLARGE), Image.LANCZOS)


def plants(rgb: np.ndarray, cutout: np.ndarray) -> list[Plant]:
    """Cut each plant out as its own picture, tallest first."""
    labels = split(cutout)
    layer_height = np.ptp(np.nonzero(cutout.any(axis=1))[0]) + 1
    found = []
    for label, window in enumerate(ndimage.find_objects(labels), start=1):
        if window is None:
            continue
        rows, columns = window
        if rows.stop - rows.start < MIN_HEIGHT * layer_height:
            continue
        pad = 3
        rows = slice(max(0, rows.start - pad), min(labels.shape[0], rows.stop + pad))
        columns = slice(max(0, columns.start - pad), min(labels.shape[1], columns.stop + pad))
        mask = labels[rows, columns] == label
        root_columns = np.nonzero(mask[-pad - 4 :].any(axis=0))[0]
        root = float(root_columns.mean() / mask.shape[1]) if len(root_columns) else 0.5
        found.append(
            Plant(
                picture=_sprite(rgb[rows, columns], mask),
                width=mask.shape[1],
                height=mask.shape[0],
                root=round(root, 3),
            )
        )
    return sorted(found, key=lambda plant: plant.height * plant.width, reverse=True)


def strip(rgb: np.ndarray, cutout: np.ndarray, rows: tuple[int, int]) -> Image.Image:
    """The whole cutout as one long picture, for wrapping around the scene."""
    alpha = ndimage.gaussian_filter(cutout.astype(np.float32), 0.7, mode="nearest")
    pixels = np.dstack([rgb, np.rint(alpha * 255).astype(np.uint8)])[rows[0] : rows[1]]
    return Image.fromarray(bleed_edges(pixels))
