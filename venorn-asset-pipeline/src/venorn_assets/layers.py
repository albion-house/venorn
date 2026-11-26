"""Split the scene around the structure into layers.

Four layers come out of the image, from front to back:

- the ground, a band along the bottom that the structure rests in
- the floating layer, the textured things in front of the backdrop
- the far layer, the background pixels in a declared hue range
- the backdrop, a smooth vertical gradient
"""

from __future__ import annotations

import json

import numpy as np
from PIL import Image
from scipy import ndimage

from . import models
from .bare import fill
from .color import hue_saturation_value, to_hex
from .isolate import bleed_edges
from .source import Source

# Background with less local contrast than this is flat: the backdrop shows through there.
FLAT = 18.0
MIN_FLAT_PIXELS = 400
# The flat areas are widened by this many pixels, up to the edge of the textured things beside them.
FLAT_REACH = 6
MIN_FLOATING_PIXELS = 150
# Floating things in this painting are blue. A patch with less blue than this share is something else.
MIN_BLUE_SHARE = 0.35
BLUE_HUE = (178.0, 265.0)
# Gaps in the far layer narrower than twice this many pixels are joined up behind the floating layer.
FAR_GAP = 45
# An outline can stop this many pixels short of the image's sides.
EDGE = 6
# The structure's soft edge reaches this many pixels past its outline.
SOFT_EDGE = 16


def _close(mask: np.ndarray, reach: int) -> np.ndarray:
    """Close gaps up to twice reach pixels wide. The mask keeps its pixels along the image's edges."""
    grown = ndimage.binary_dilation(mask, iterations=reach)
    return ndimage.binary_erosion(grown, iterations=reach, border_value=1)


def find_ground(image: Image.Image, structure: np.ndarray) -> np.ndarray:
    """Outline the band along the bottom of the image, starting a little above the structure's lowest point."""
    rows = np.nonzero(structure.any(axis=1))[0]
    top = rows.max() - 0.1 * (rows.max() - rows.min())
    masks, _ = models.segment(image, [(0, float(top), image.width, image.height)])
    ground = ndimage.binary_fill_holes(masks[0])
    # The outline stops short of the image's sides. Carry it to them, so copies of the layer join.
    ground[:, :EDGE] |= ground[:, EDGE : EDGE + 1]
    ground[:, -EDGE:] |= ground[:, -EDGE - 1 : -EDGE]
    return ground


def find_flat(rgb: np.ndarray, open_background: np.ndarray) -> np.ndarray:
    """Mark the flat, untextured areas of the background, where the backdrop shows through."""
    gray = rgb.astype(np.float32).mean(axis=-1)
    rough = ndimage.uniform_filter(ndimage.generic_gradient_magnitude(gray, ndimage.sobel), 13)
    flat = ndimage.binary_opening(open_background & (rough < FLAT), iterations=4)
    labels, count = ndimage.label(flat)
    sizes = ndimage.sum(flat, labels, range(1, count + 1))
    return np.isin(labels, 1 + np.nonzero(sizes >= MIN_FLAT_PIXELS)[0])


def fit_backdrop(rgb: np.ndarray, flat: np.ndarray) -> np.ndarray:
    """One color for each row of the backdrop, from the flat pixels in that row.

    The gradient runs from the top of the image to its brightest row, the horizon, and holds that color below.
    """
    height = rgb.shape[0]
    found = np.full((height, 3), np.nan, dtype=np.float32)
    for row in range(height):
        if flat[row].sum() > 25:
            found[row] = np.median(rgb[row][flat[row]], axis=0)
    known = np.nonzero(~np.isnan(found[:, 0]))[0]
    every = np.arange(height)
    colors = np.stack([np.interp(every, known, found[known, c]) for c in range(3)], axis=1)
    colors = ndimage.gaussian_filter1d(colors, max(1.0, height / 100), axis=0, mode="nearest")

    horizon = int(known[np.argmax(colors[known].sum(axis=1))])
    colors[horizon:] = colors[horizon]
    return colors


def find_floating(
    rgb: np.ndarray, open_background: np.ndarray, flat: np.ndarray, ground: np.ndarray
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Sort the textured background, which is everything the backdrop does not show through.

    Returns the floating mask, the ground with the patches that belong to it,
    and the leftover patches that are neither, such as a pin beside the structure.
    """
    textured = open_background & ~ndimage.binary_dilation(flat, iterations=FLAT_REACH)
    textured = ndimage.binary_opening(textured, iterations=2)

    hue, saturation, _ = hue_saturation_value(rgb)
    blue = (hue >= BLUE_HUE[0]) & (hue <= BLUE_HUE[1]) & (saturation > 0.15)
    near_ground = ndimage.binary_dilation(ground, iterations=8)

    labels, count = ndimage.label(textured)
    floating = np.zeros_like(textured)
    leftover = np.zeros_like(textured)
    grown_ground = ground.copy()
    slices = ndimage.find_objects(labels)
    for label in range(1, count + 1):
        window = slices[label - 1]
        patch = labels[window] == label
        if blue[window][patch].mean() >= MIN_BLUE_SHARE and patch.sum() >= MIN_FLOATING_PIXELS:
            floating[window] |= patch
        elif near_ground[window][patch].any():
            # A flower head that rises above the ground's outline belongs to the ground.
            grown_ground[window] |= patch
        else:
            leftover[window] |= patch
    return floating, grown_ground, leftover


def far_extent(far: np.ndarray, floating: np.ndarray, in_front: np.ndarray) -> np.ndarray:
    """The far layer plus the areas where it carries on behind other things.

    Behind the floating layer, the far layer fills the gaps between its own
    masses. Behind the structure and the ground, it fills everything under its
    top edge. Where the structure hides the top edge itself, the edge is drawn
    straight across from one side of the structure to the other.
    """
    height, width = far.shape
    pad = FAR_GAP + 2
    grown = np.pad(far, pad, mode="edge")
    reachable = ndimage.distance_transform_edt(~grown) <= FAR_GAP
    joined = (ndimage.distance_transform_edt(reachable) > FAR_GAP)[pad:-pad, pad:-pad]
    extent = far | (joined & floating)

    columns = np.arange(width)
    top = np.where(extent.any(axis=0), extent.argmax(axis=0), height)
    hidden_top = in_front[np.clip(top - 1, 0, height - 1), columns]
    seen = (top < height) & ~hidden_top
    top = np.interp(columns, columns[seen], top[seen])
    below_top = np.arange(height)[:, None] >= top[None, :]
    extent |= in_front & below_top

    walled = np.pad(extent, 1, constant_values=True)
    walled[0, :] = False
    return ndimage.binary_fill_holes(walled)[1:-1, 1:-1]


def _plate(rgb: np.ndarray, mask: np.ndarray, rows: tuple[int, int]) -> Image.Image:
    """An RGBA picture of one layer, cropped to its rows, with its edge colors spread outward."""
    # The softened edge stops at the sides of the image, where the viewer joins one copy of the picture to the next.
    alpha = ndimage.gaussian_filter(mask.astype(np.float32), 1.2, mode="nearest")
    pixels = np.dstack([rgb, np.rint(alpha * 255).astype(np.uint8)])[rows[0] : rows[1]]
    return Image.fromarray(bleed_edges(pixels))


def _rows(mask: np.ndarray) -> tuple[int, int]:
    used = np.nonzero(mask.any(axis=1))[0]
    return int(used.min()), int(used.max()) + 1


def layers(source: Source) -> None:
    out = source.stage_dir("layers")
    for stale in (*out.glob("*.png"), *out.glob("*.json")):
        stale.unlink()
    if source.scene is None:
        print(f"layers: {source.name} declares no scene layers")
        return
    scene = source.scene

    catalog_dir = source.stage_dir("catalog")
    record = json.loads((catalog_dir / "catalog.json").read_text())
    image = Image.open(source.image_path).convert("RGB")
    rgb = np.asarray(image)
    height, width = rgb.shape[:2]

    structure = np.asarray(Image.open(catalog_dir / record["structure"]["mask"]).convert("L")) > 127
    things = np.zeros_like(structure)
    for instance in record["instances"]:
        things |= np.asarray(Image.open(catalog_dir / instance["mask"]).convert("L")) > 127
    # Widened so the soft edge around the structure stays out of the layers.
    in_front = ndimage.binary_dilation(structure | things, iterations=SOFT_EDGE)

    ground = find_ground(image, structure)
    background = ~in_front & ~ground

    hue, saturation, _ = hue_saturation_value(rgb)
    in_hue = (hue > scene.far_hue[0]) & (hue < scene.far_hue[1]) & (saturation > 0.18)
    far = _close(ndimage.binary_opening(background & in_hue, iterations=1), 2) & background

    flat = find_flat(rgb, background & ~far)
    backdrop = fit_backdrop(rgb, flat)
    floating, ground, leftover = find_floating(rgb, background & ~far, flat, ground)
    floating &= ~ground

    far_alpha = far_extent(far, floating | leftover, in_front | ground)
    far_rgb = fill(rgb, far_alpha & ~far, far)

    plates = {
        scene.ground_id: (rgb, ground),
        scene.floating_id: (rgb, floating),
        scene.far_id: (far_rgb, far_alpha),
    }
    boxes = {}
    for layer_id, (pixels, mask) in plates.items():
        rows = _rows(mask)
        _plate(pixels, mask, rows).save(out / f"{layer_id}.png")
        boxes[layer_id] = [0, rows[0], width, rows[1]]

    ground_rows = np.nonzero(structure.any(axis=1))[0]
    ground_row = int(ground_rows.max() - 0.04 * (ground_rows.max() - ground_rows.min()))
    ground_hue = (hue > 62) & (hue < 178) & ground
    ground_color = np.median(rgb[ground_hue if ground_hue.any() else ground], axis=0)

    step = max(1, height // 64)
    result = {
        "source": source.name,
        "image": {"width": width, "height": height},
        "layers": [
            {
                "id": scene.far_id,
                "role": "far",
                "image": f"{scene.far_id}.png",
                "box": boxes[scene.far_id],
                "distance": scene.far_distance,
                "motion": "still",
            },
            {
                "id": scene.floating_id,
                "role": "floating",
                "image": f"{scene.floating_id}.png",
                "box": boxes[scene.floating_id],
                "distance": scene.floating_distance,
                "motion": scene.floating_motion,
            },
            {
                "id": scene.ground_id,
                "role": "ground",
                "image": f"{scene.ground_id}.png",
                "box": boxes[scene.ground_id],
                "distance": 0.0,
                "motion": "still",
            },
        ],
        "backdrop": {
            "id": scene.backdrop_id,
            "rows": [[row, to_hex(backdrop[row])] for row in (*range(0, height, step), height - 1)],
        },
        "ground": {"row": ground_row, "color": to_hex(ground_color)},
    }
    (out / "layers.json").write_text(json.dumps(result, indent=2) + "\n")
    _check_picture(rgb, backdrop, far_rgb, far_alpha, floating, ground).save(out / "check.png")

    shares = ", ".join(
        f"{name} {mask.mean():.0%}"
        for name, mask in ((scene.far_id, far), (scene.floating_id, floating), (scene.ground_id, ground))
    )
    print(f"layers: {shares} of the image. See {out / 'check.png'}")


def _check_picture(
    rgb: np.ndarray,
    backdrop: np.ndarray,
    far_rgb: np.ndarray,
    far_alpha: np.ndarray,
    floating: np.ndarray,
    ground: np.ndarray,
) -> Image.Image:
    """The source, the backdrop with only the far layer, and the backdrop with every layer, for a person to check."""
    width = rgb.shape[1]
    sky = np.repeat(backdrop[:, None, :], width, axis=1).astype(np.uint8)
    with_far = sky.copy()
    with_far[far_alpha] = far_rgb[far_alpha]
    stacked = with_far.copy()
    stacked[floating] = rgb[floating]
    stacked[ground] = rgb[ground]
    row = np.concatenate([rgb, with_far, stacked], axis=1)
    return Image.fromarray(row).resize((row.shape[1] // 2, row.shape[0] // 2), Image.LANCZOS)
