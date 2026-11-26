"""Find named places on the bare structure, such as an eye socket or a horn.

The game's surprises start from these places.
"""

from __future__ import annotations

import numpy as np
from PIL import Image

from . import models
from .source import Feature

# The detector is asked for less certainty here than for things, because a place
# on the structure is part of it and stands out less than a thing on it.
THRESHOLD = 0.2
# A box that covers more of the structure's box than this is the structure itself.
MAX_SHARE = 0.6
# A spike's base is taken from the pixels this far from its tip, as a share of its length.
BASE_BAND = 0.85


def locate(feature: Feature, box: tuple[float, float, float, float], mask: np.ndarray) -> dict:
    """Describe a feature found in a box of the image, in image pixels. mask is the whole structure."""
    x0, y0, x1, y1 = box
    if feature.shape == "hollow":
        return {
            "id": feature.id,
            "shape": "hollow",
            "center": [round((x0 + x1) / 2, 1), round((y0 + y1) / 2, 1)],
            "radius": round(min(x1 - x0, y1 - y0) / 2, 1),
        }

    # A spike's tip is its point farthest from the middle of the structure, and
    # its base is where the far end of the box meets the structure.
    rows, columns = np.nonzero(mask)
    middle = np.array([columns.mean(), rows.mean()])
    inside = (columns >= x0) & (columns <= x1) & (rows >= y0) & (rows <= y1)
    points = np.stack([columns[inside], rows[inside]], axis=1).astype(float)
    tip = points[np.argmax(np.linalg.norm(points - middle, axis=1))]
    from_tip = np.linalg.norm(points - tip, axis=1)
    base = points[from_tip >= BASE_BAND * from_tip.max()].mean(axis=0)
    return {
        "id": feature.id,
        "shape": "spike",
        "tip": [round(float(tip[0]), 1), round(float(tip[1]), 1)],
        "base": [round(float(base[0]), 1), round(float(base[1]), 1)],
    }


def find_features(
    bare: Image.Image, mask: np.ndarray, crop: tuple[int, int, int, int], features: tuple[Feature, ...]
) -> list[dict]:
    """Look for each declared feature on the bare structure. A feature that is not found is left out."""
    picture = bare.crop(crop)
    whole = picture.width * picture.height
    found = []
    for feature in features:
        boxes = [
            (score, box)
            for _, score, box in models.detect(picture, [feature.prompt], THRESHOLD, THRESHOLD)
            if (box[2] - box[0]) * (box[3] - box[1]) < MAX_SHARE * whole
        ]
        if not boxes:
            print(f"isolate: found no {feature.id} ({feature.prompt}) on the structure")
            continue
        _, (x0, y0, x1, y1) = max(boxes)
        found.append(locate(feature, (x0 + crop[0], y0 + crop[1], x1 + crop[0], y1 + crop[1]), mask))
    return found
