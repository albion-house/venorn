"""Cut the structure and the best instances of each kind out of the source image."""

from __future__ import annotations

import json
import math

import numpy as np
from PIL import Image, ImageFilter

from . import bare, features
from .source import Source

# Small things are enlarged until their longer side is about this many pixels.
TARGET_SIDE = 384
MARGIN = 0.15
# Instances the classifier is at least this sure of are preferred as models.
SURE = 0.9


def _rank(instance: dict) -> float:
    return instance["score"] * instance["kind_confidence"] * instance["mask_quality"] * math.sqrt(instance["area"])


def _choose(instances: list[dict], count: int, pixels: np.ndarray, catalog_dir) -> list[dict]:
    """Pick the instances to turn into models: well-identified ones, as different in color as possible."""
    sure = [i for i in instances if i["kind_confidence"] >= SURE]
    pool = sorted(sure if len(sure) >= count else instances, key=_rank, reverse=True)
    colors = {}
    for instance in pool:
        mask = np.asarray(Image.open(catalog_dir / instance["mask"]).convert("L")) > 127
        colors[instance["id"]] = pixels[mask].mean(axis=0)

    chosen = pool[:1]
    best_rank = _rank(pool[0])

    def appeal(candidate: dict) -> float:
        nearest = min(float(np.linalg.norm(colors[candidate["id"]] - colors[c["id"]])) for c in chosen)
        return (0.4 + _rank(candidate) / best_rank) * nearest

    while len(chosen) < min(count, len(pool)):
        chosen.append(max((i for i in pool if i not in chosen), key=appeal))
    return chosen


def _crop_box(box: list[int], width: int, height: int) -> tuple[int, int, int, int]:
    x0, y0, x1, y1 = box
    pad = max(6, round(MARGIN * max(x1 - x0, y1 - y0)))
    return max(0, x0 - pad), max(0, y0 - pad), min(width, x1 + pad), min(height, y1 + pad)


def isolate(source: Source) -> None:
    catalog_dir = source.stage_dir("catalog")
    record = json.loads((catalog_dir / "catalog.json").read_text())
    image = Image.open(source.image_path).convert("RGB")
    out = source.stage_dir("isolated")
    for stale in out.glob("*.png"):
        stale.unlink()

    items = []

    # The structure keeps its size in the source image. It is cut out twice:
    # as painted, and bare, with everything on it painted out.
    structure_mask = Image.open(catalog_dir / record["structure"]["mask"]).convert("L")
    crop = _crop_box(record["structure"]["box"], image.width, image.height)
    alpha = structure_mask.crop(crop).filter(ImageFilter.GaussianBlur(0.8))
    structure_id = record["structure"]["id"]

    pixels = np.asarray(image)
    on_structure = np.asarray(structure_mask) > 127
    cataloged = np.zeros_like(on_structure)
    for instance in record["instances"]:
        cataloged |= np.asarray(Image.open(catalog_dir / instance["mask"]).convert("L")) > 127
    additions = bare.find_additions(pixels, on_structure, cataloged)
    bare_image = Image.fromarray(bare.fill(pixels, additions, on_structure))

    for name, picture in ((structure_id, bare_image), (f"{structure_id}.painted", image)):
        cutout = picture.crop(crop).convert("RGBA")
        cutout.putalpha(alpha)
        cutout.save(out / f"{name}.png")
    bare_image.crop(crop).save(out / f"{structure_id}.context.png")
    items.append({"id": structure_id, "kind": structure_id, "role": "structure", "crop": list(crop), "scale": 1.0})
    print(f"isolate: cleared {additions.sum() / on_structure.sum():.0%} of the {structure_id} to make it bare")

    # Named places on the bare structure, for the game to start its surprises from.
    places = features.find_features(bare_image, on_structure, crop, source.structure.features)
    if places:
        print(f"isolate: found {', '.join(place['id'] for place in places)} on the {structure_id}")

    for kind in source.kinds:
        instances = [i for i in record["instances"] if i["kind"] == kind.id]
        if not instances:
            print(f"isolate: the catalog has no {kind.id}")
        for number, instance in enumerate(_choose(instances, kind.exemplars, pixels, catalog_dir), start=1):
            crop = _crop_box(instance["box"], image.width, image.height)
            scale = TARGET_SIDE / max(crop[2] - crop[0], crop[3] - crop[1])
            size = (round((crop[2] - crop[0]) * scale), round((crop[3] - crop[1]) * scale))
            context = image.crop(crop).resize(size, Image.LANCZOS)
            mask = Image.open(catalog_dir / instance["mask"]).convert("L").crop(crop)
            # Enlarging then blurring turns the stair-stepped mask edge into a smooth outline.
            alpha = mask.resize(size, Image.BICUBIC).filter(ImageFilter.GaussianBlur(scale * 0.6))
            alpha = alpha.point(lambda v: 0 if v < 96 else min(255, (v - 96) * 4))
            cutout = context.convert("RGBA")
            cutout.putalpha(alpha)

            item_id = f"{kind.id}-{number:02d}"
            cutout.save(out / f"{item_id}.png")
            context.save(out / f"{item_id}.context.png")
            items.append(
                {
                    "id": item_id,
                    "kind": kind.id,
                    "role": kind.role,
                    "instance": instance["id"],
                    "crop": list(crop),
                    "scale": round(scale, 4),
                }
            )

    record_out = {"source": source.name, "features": places, "items": items}
    (out / "isolated.json").write_text(json.dumps(record_out, indent=2) + "\n")
    _contact_sheet(out, [item["id"] for item in items if item["role"] != "structure"]).save(out / "sheet.png")
    print(f"isolate: cut out {len(items)} things. See {out / 'sheet.png'}")


def _contact_sheet(directory, ids: list[str]) -> Image.Image:
    """Every cutout on a gray card, for a person to check."""
    cell = TARGET_SIDE // 2 + 16
    columns = max(1, min(6, len(ids)))
    rows = max(1, math.ceil(len(ids) / columns))
    sheet = Image.new("RGB", (columns * cell, rows * cell), (150, 150, 150))
    for index, item_id in enumerate(ids):
        cutout = Image.open(directory / f"{item_id}.png")
        cutout.thumbnail((cell - 16, cell - 16), Image.LANCZOS)
        x = (index % columns) * cell + (cell - cutout.width) // 2
        y = (index // columns) * cell + (cell - cutout.height) // 2
        sheet.paste(cutout, (x, y), cutout)
    return sheet


def bleed_edges(rgba: np.ndarray, rounds: int = 12) -> np.ndarray:
    """Spread each cutout's edge color into the transparent area around it.

    A renderer blends neighboring texels, so transparent texels that hold
    unrelated colors would show up as a dark fringe around the cutout.
    """
    from scipy import ndimage

    color = rgba[..., :3].astype(np.float32)
    known = rgba[..., 3] > 127
    for _ in range(rounds):
        if known.all():
            break
        weights = ndimage.uniform_filter(known.astype(np.float32), size=3)
        spread = np.stack([ndimage.uniform_filter(color[..., c] * known, size=3) for c in range(3)], axis=-1)
        grow = (~known) & (weights > 0)
        color[grow] = spread[grow] / weights[grow][:, None]
        known = known | grow
    result = rgba.copy()
    result[..., :3] = np.clip(np.rint(color), 0, 255).astype(np.uint8)
    return result
