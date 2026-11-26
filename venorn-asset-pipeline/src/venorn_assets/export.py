"""Gather the models into an asset set with a manifest, where the game client can load it."""

from __future__ import annotations

import json
import os
import shutil
from pathlib import Path

from .criteria import validate
from .source import Source


def client_assets_dir(source: Source) -> Path:
    override = os.environ.get("VENORN_ASSETS_EXPORT_DIR")
    base = Path(override) if override else source.root.parent / "venorn-game-client" / "public" / "assets"
    return base / source.name


def export(source: Source) -> None:
    catalog = json.loads((source.stage_dir("catalog") / "catalog.json").read_text())
    models_dir = source.stage_dir("models")
    structure = json.loads((models_dir / "structure.json").read_text())
    origin_x, origin_y = structure["origin"]
    scale = structure["scale"]

    kinds = []
    for kind in source.kinds:
        entries = []
        for path in sorted(models_dir.glob(f"{kind.id}-*.adjust.json")):
            record = json.loads(path.read_text())
            validate(record)
            entries.append(
                {"id": record["id"], "model": record["model"], "criteria": path.name, "preview": f"{record['id']}.png"}
            )
        if entries:
            kinds.append({"id": kind.id, "role": kind.role, "models": entries})

    # Where each thing sits in the painting, in the structure's model units.
    arrangement = [
        {
            "kind": instance["kind"],
            "x": round((instance["centroid"][0] - origin_x) * scale, 4),
            "y": round((origin_y - instance["centroid"][1]) * scale, 4),
            "size": round(
                max(instance["box"][2] - instance["box"][0], instance["box"][3] - instance["box"][1]) * scale, 4
            ),
            "angle": instance["angle"],
        }
        for instance in catalog["instances"]
    ]

    def across(pixel: float) -> float:
        return round((pixel - origin_x) * scale, 4)

    def upward(row: float) -> float:
        return round((origin_y - row) * scale, 4)

    # The layers around the structure, placed in the structure's model units.
    scene = None
    layers_dir = source.stage_dir("layers")
    if (layers_dir / "layers.json").exists():
        found = json.loads((layers_dir / "layers.json").read_text())
        scene = {
            "layers": [
                {
                    "id": layer["id"],
                    "role": layer["role"],
                    "image": f"layer-{layer['id']}.png",
                    "left": across(layer["box"][0]),
                    "right": across(layer["box"][2]),
                    "top": upward(layer["box"][1]),
                    "bottom": upward(layer["box"][3]),
                    "distance": layer["distance"],
                    "motion": layer["motion"],
                    # The layer's top edge, as points across the image.
                    "skyline": [[across(column), upward(row)] for column, row in layer.get("skyline", [])],
                }
                for layer in found["layers"]
            ],
            "backdrop": {
                "id": found["backdrop"]["id"],
                "stops": [[upward(row), color] for row, color in found["backdrop"]["rows"]],
            },
            "ground": {
                "y": upward(found["ground"]["row"]),
                "color": found["ground"]["color"],
                # The ground layer with its dark base cut away, whole and as separate plants.
                "cutout": {
                    "image": f"layer-{found['ground']['cutout']['image']}",
                    "left": across(found["ground"]["cutout"]["box"][0]),
                    "right": across(found["ground"]["cutout"]["box"][2]),
                    "top": upward(found["ground"]["cutout"]["box"][1]),
                    "bottom": upward(found["ground"]["cutout"]["box"][3]),
                },
                "plants": [
                    {
                        "id": plant["id"],
                        "image": f"{plant['id']}.png",
                        "width": round(plant["width"] * scale, 4),
                        "height": round(plant["height"] * scale, 4),
                        "root": plant["root"],
                    }
                    for plant in found["ground"]["plants"]
                ],
            },
        }

    manifest = {
        "source": source.name,
        "title": source.title,
        "structure": {
            "id": structure["id"],
            "model": structure["model"],
            "painted": structure["painted"],
            "thickness": structure["thickness"],
        },
        "kinds": kinds,
        "arrangement": arrangement,
        "scene": scene,
    }

    out = client_assets_dir(source)
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    for path in (*models_dir.glob("*.glb"), *models_dir.glob("*.adjust.json"), *models_dir.glob("*.png")):
        shutil.copy2(path, out / path.name)
    if scene is not None:
        for layer in scene["layers"]:
            shutil.copy2(layers_dir / f"{layer['id']}.png", out / layer["image"])
        cutout = scene["ground"]["cutout"]["image"]
        shutil.copy2(layers_dir / cutout.removeprefix("layer-"), out / cutout)
        for plant in scene["ground"]["plants"]:
            shutil.copy2(layers_dir / plant["image"], out / plant["image"])
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")

    total = sum(len(kind["models"]) for kind in kinds)
    megabytes = sum(p.stat().st_size for p in out.iterdir()) / 1_000_000
    print(f"export: wrote the structure and {total} models ({megabytes:.1f} MB) to {out}")
