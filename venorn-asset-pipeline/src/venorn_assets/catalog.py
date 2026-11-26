"""Find the structure and every thing on it, and record where each one is."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

from . import models
from .source import Source

# Small things are looked for in overlapping tiles so the detector sees them enlarged.
TILE = 448
STRIDE = 320
# A box this close to a tile edge is probably cut off. A neighboring tile sees it whole.
EDGE_MARGIN = 3
# A detail box larger than this share of its tile is a group of things, or the structure itself.
MAX_TILE_SHARE = 0.30
MIN_SIDE = 12
# A thing the classifier is less sure of than this is left out of the catalog.
MIN_KIND_CONFIDENCE = 0.6

COLORS = {
    "butterfly": (255, 64, 64),
    "candy": (255, 160, 0),
    "capsule": (0, 200, 255),
    "bead": (80, 120, 255),
    "flower": (60, 220, 90),
}


@dataclass
class Instance:
    id: str
    kind: str
    box: list[int]
    score: float
    kind_confidence: float
    mask_quality: float
    area: int
    centroid: list[float]
    angle: float
    mask: str


def _tiles(width: int, height: int) -> list[tuple[int, int, int, int]]:
    def starts(length: int) -> list[int]:
        if length <= TILE:
            return [0]
        positions = list(range(0, length - TILE, STRIDE))
        positions.append(length - TILE)
        return positions

    return [(x, y, min(x + TILE, width), min(y + TILE, height)) for y in starts(height) for x in starts(width)]


def _iou(a: tuple[float, ...], b: tuple[float, ...]) -> float:
    x0, y0 = max(a[0], b[0]), max(a[1], b[1])
    x1, y1 = min(a[2], b[2]), min(a[3], b[3])
    overlap = max(0.0, x1 - x0) * max(0.0, y1 - y0)
    union = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - overlap
    return overlap / union if union > 0 else 0.0


def _principal_angle(mask: np.ndarray) -> float:
    """Angle of the mask's long axis in degrees, counterclockwise from the image's x axis."""
    ys, xs = np.nonzero(mask)
    if len(xs) < 3:
        return 0.0
    points = np.stack([xs - xs.mean(), -(ys - ys.mean())])
    values, vectors = np.linalg.eigh(np.cov(points))
    axis = vectors[:, int(np.argmax(values))]
    angle = float(np.degrees(np.arctan2(axis[1], axis[0])))
    return ((angle + 90.0) % 180.0) - 90.0


def find_structure(image: Image.Image, source: Source) -> np.ndarray:
    """Outline the structure by joining the best match for each of its prompts."""
    prompts = list(source.structure.prompts)
    found = models.detect(image, prompts, threshold=0.25, text_threshold=0.2)
    boxes = []
    for prompt in prompts:
        matches = sorted((f for f in found if f[0] == prompt), key=lambda f: f[1], reverse=True)
        if not matches:
            print(f"catalog: found no separate {prompt}")
            continue
        boxes.append(matches[0][2])
        print(f"catalog: structure part {prompt} at {[round(v) for v in matches[0][2]]} score {matches[0][1]:.2f}")
    if not boxes:
        raise SystemExit(f"catalog: found none of {prompts} in the image")
    masks, _ = models.segment(image, boxes)
    joined = np.any(masks, axis=0)
    joined = ndimage.binary_fill_holes(ndimage.binary_closing(joined, iterations=3))
    # Keep the largest connected piece.
    labels, count = ndimage.label(joined)
    if count > 1:
        sizes = ndimage.sum(joined, labels, range(1, count + 1))
        joined = labels == (int(np.argmax(sizes)) + 1)
    return joined


def find_things(
    image: Image.Image, source: Source, on: np.ndarray
) -> list[tuple[str, float, tuple, np.ndarray, float, float]]:
    """Find every instance of every kind. Returns (kind, score, box, mask, mask quality, kind confidence)."""
    width, height = image.size
    prompts = [kind.prompt for kind in source.kinds]
    kind_by_prompt = {kind.prompt: kind.id for kind in source.kinds}
    near_structure = ndimage.binary_dilation(on, iterations=6)

    candidates = []
    for x0, y0, x1, y1 in _tiles(width, height):
        if not near_structure[y0:y1, x0:x1].any():
            continue
        tile = image.crop((x0, y0, x1, y1))
        tile_area = (x1 - x0) * (y1 - y0)
        kept = []
        for prompt, score, box in models.detect(tile, prompts, threshold=0.22, text_threshold=0.2):
            bx0, by0, bx1, by1 = box
            w, h = bx1 - bx0, by1 - by0
            if w < MIN_SIDE or h < MIN_SIDE or w * h > MAX_TILE_SHARE * tile_area:
                continue
            cut_off = (
                (bx0 < EDGE_MARGIN and x0 > 0)
                or (by0 < EDGE_MARGIN and y0 > 0)
                or (bx1 > (x1 - x0) - EDGE_MARGIN and x1 < width)
                or (by1 > (y1 - y0) - EDGE_MARGIN and y1 < height)
            )
            if cut_off:
                continue
            kept.append((prompt, score, box))
        if not kept:
            continue

        # Segment at twice the size so thin parts such as antennae survive.
        enlarged = tile.resize((tile.width * 2, tile.height * 2), Image.LANCZOS)
        masks, qualities = models.segment(enlarged, [tuple(v * 2 for v in box) for _, _, box in kept])
        for (prompt, score, box), mask, quality in zip(kept, masks, qualities, strict=True):
            small = np.asarray(Image.fromarray(mask.astype(np.uint8) * 255).resize(tile.size, Image.BOX)) > 127
            full = np.zeros((height, width), dtype=bool)
            full[y0:y1, x0:x1] = small
            global_box = (box[0] + x0, box[1] + y0, box[2] + x0, box[3] + y0)
            candidates.append((kind_by_prompt[prompt], score, global_box, full, quality))
        print(f"catalog: tile at ({x0}, {y0}) has {len(kept)} candidates")

    # The same thing shows up in several tiles and sometimes under two prompts. Keep the best-scoring one.
    candidates.sort(key=lambda c: c[1], reverse=True)
    chosen: list[tuple] = []
    for candidate in candidates:
        _, _, box, mask, _ = candidate
        area = int(mask.sum())
        if area < MIN_SIDE * MIN_SIDE // 2:
            continue
        ys, xs = np.nonzero(mask)
        if not near_structure[int(ys.mean()), int(xs.mean())]:
            continue
        duplicate = False
        for other in chosen:
            if _iou(box, other[2]) > 0.45:
                duplicate = True
                break
            shared = int((mask & other[3]).sum())
            if shared > 0.5 * min(area, int(other[3].sum())):
                duplicate = True
                break
        if not duplicate:
            chosen.append(candidate)

    # The detector finds things well but confuses their names, so a classifier names each one.
    crops = []
    for _, _, box, _, _ in chosen:
        x0, y0, x1, y1 = (int(round(v)) for v in box)
        crops.append(image.crop((max(0, x0 - 6), max(0, y0 - 6), min(width, x1 + 6), min(height, y1 + 6))))
    probabilities = models.classify(crops, [kind.looks_like for kind in source.kinds])
    named = []
    for (_, score, box, mask, quality), row in zip(chosen, probabilities, strict=True):
        best = int(np.argmax(row))
        if row[best] < MIN_KIND_CONFIDENCE:
            continue
        named.append((source.kinds[best].id, score, box, mask, quality, float(row[best])))
    return named


def catalog(source: Source) -> None:
    image = Image.open(source.image_path).convert("RGB")
    out = source.stage_dir("catalog")
    mask_dir = out / "masks"
    mask_dir.mkdir(exist_ok=True)
    for stale in mask_dir.glob("*.png"):
        stale.unlink()

    structure = find_structure(image, source)
    Image.fromarray(structure.astype(np.uint8) * 255).save(out / "structure-mask.png")
    ys, xs = np.nonzero(structure)
    structure_box = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]

    things = find_things(image, source, structure)
    instances: list[Instance] = []
    counters: dict[str, int] = {}
    for kind, score, _, mask, quality, confidence in sorted(things, key=lambda t: (t[0], -t[1])):
        counters[kind] = counters.get(kind, 0) + 1
        instance_id = f"{kind}-{counters[kind]:03d}"
        ys, xs = np.nonzero(mask)
        Image.fromarray(mask.astype(np.uint8) * 255).save(mask_dir / f"{instance_id}.png")
        instances.append(
            Instance(
                id=instance_id,
                kind=kind,
                box=[int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1],
                score=round(score, 4),
                kind_confidence=round(confidence, 4),
                mask_quality=round(quality, 4),
                area=int(mask.sum()),
                centroid=[round(float(xs.mean()), 2), round(float(ys.mean()), 2)],
                angle=round(_principal_angle(mask), 1),
                mask=f"masks/{instance_id}.png",
            )
        )

    record = {
        "source": source.name,
        "image": {"width": image.width, "height": image.height},
        "structure": {"id": source.structure.id, "box": structure_box, "mask": "structure-mask.png"},
        "instances": [asdict(instance) for instance in instances],
    }
    (out / "catalog.json").write_text(json.dumps(record, indent=2) + "\n")
    _draw_overlay(image, structure, instances).save(out / "overlay.png")

    summary = ", ".join(f"{count} {kind}" for kind, count in sorted(counters.items()))
    print(f"catalog: found {summary or 'nothing'}. See {out / 'overlay.png'}")


def _draw_overlay(image: Image.Image, structure: np.ndarray, instances: list[Instance]) -> Image.Image:
    """A picture of what was found, for a person to check."""
    overlay = image.convert("RGBA")
    outline = structure ^ ndimage.binary_erosion(structure, iterations=2)
    tint = np.zeros((image.height, image.width, 4), dtype=np.uint8)
    tint[outline] = (255, 255, 255, 255)
    overlay = Image.alpha_composite(overlay, Image.fromarray(tint))
    draw = ImageDraw.Draw(overlay)
    for instance in instances:
        color = COLORS.get(instance.kind, (255, 0, 255))
        draw.rectangle(instance.box, outline=color, width=2)
        draw.text((instance.box[0] + 2, instance.box[1] - 11), instance.id, fill=color)
    return overlay.convert("RGB")
