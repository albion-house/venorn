"""Cut stand-ins for generated images out of the painting.

Each stand-in is a square around one thing the catalog found, enlarged to
1024 pixels. "painted" keeps the bone and the neighboring things around it.
"plain" keeps only the thing, on a plain paper-colored ground, which is what
an image generator asked for one thing on a plain background would return.

Run after `mise //venorn-asset-pipeline:build`, from the repository root:

    uv run --project venorn-asset-pipeline python \
        openspec/changes/add-described-things/experiments/single-image-lift/cut_standins.py OUT_DIR
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image

from venorn_assets.source import load_source

# Catalog instances to cut out, with the description a player might have typed for each.
STANDINS = {
    "butterfly-002": "a red butterfly",
    "candy-011": "a yellow wrapped candy",
    "flower-007": "a blue flower",
    "bead-018": "a blue jewel",
}
SIDE = 1024
MARGIN = 0.35
PAPER = (238, 230, 214)


def square_around(box: list[int], width: int, height: int) -> tuple[int, int, int, int]:
    x0, y0, x1, y1 = box
    side = round(max(x1 - x0, y1 - y0) * (1 + 2 * MARGIN))
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    left = min(max(0, round(cx - side / 2)), width - side)
    top = min(max(0, round(cy - side / 2)), height - side)
    return left, top, left + side, top + side


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("out", type=Path, help="directory to write the stand-ins to")
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    source = load_source("veneration-ornamentation")
    catalog_dir = source.build_dir / "catalog"
    catalog = json.loads((catalog_dir / "catalog.json").read_text())
    instances = {instance["id"]: instance for instance in catalog["instances"]}
    painting = Image.open(source.image_path).convert("RGB")

    listing = []
    for instance_id, description in STANDINS.items():
        instance = instances[instance_id]
        square = square_around(instance["box"], painting.width, painting.height)
        painted = painting.crop(square).resize((SIDE, SIDE), Image.LANCZOS)
        mask = Image.open(catalog_dir / instance["mask"]).convert("L").crop(square).resize((SIDE, SIDE), Image.BICUBIC)
        plain = Image.composite(painted, Image.new("RGB", (SIDE, SIDE), PAPER), mask)
        kind = instance["kind"]
        for ground, picture in (("painted", painted), ("plain", plain)):
            path = args.out / f"{kind}-{ground}.png"
            picture.save(path)
            listing.append({"image": path.name, "description": description, "ground": ground, "from": instance_id})
            print(f"cut {path}")
    (args.out / "standins.json").write_text(json.dumps(listing, indent=2) + "\n")


if __name__ == "__main__":
    main()
