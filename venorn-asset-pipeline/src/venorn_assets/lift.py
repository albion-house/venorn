"""Turn each cutout into a GLB model, and write adjustment criteria beside each pinnable one."""

from __future__ import annotations

import json
import statistics

import numpy as np
from PIL import Image

from . import models, relief
from .criteria import criteria_for
from .isolate import bleed_edges
from .source import Source

STRUCTURE_CELLS = 220
THING_CELLS = 64


def _alpha_centroid(alpha: np.ndarray) -> tuple[float, float]:
    ys, xs = np.nonzero(alpha > 0.5)
    return float(xs.mean()), float(ys.mean())


def lift(source: Source) -> None:
    catalog = json.loads((source.stage_dir("catalog") / "catalog.json").read_text())
    isolated_dir = source.stage_dir("isolated")
    isolated = json.loads((isolated_dir / "isolated.json").read_text())
    out = source.stage_dir("models")
    for stale in (*out.glob("*.glb"), *out.glob("*.json"), *out.glob("*.png")):
        stale.unlink()

    instances = {instance["id"]: instance for instance in catalog["instances"]}
    x0, y0, x1, y1 = catalog["structure"]["box"]
    structure_long = max(x1 - x0, y1 - y0)
    # The size a kind has in the painting: the median longer side of its instances.
    natural = {
        kind.id: statistics.median(
            max(i["box"][2] - i["box"][0], i["box"][3] - i["box"][1]) / structure_long
            for i in catalog["instances"]
            if i["kind"] == kind.id
        )
        for kind in source.kinds
        if any(i["kind"] == kind.id for i in catalog["instances"])
    }
    lift_record = {"backend": relief.NAME, "models": [models.DEPTH_ID]}

    structure = {}
    for item in isolated["items"]:
        cutout = Image.open(isolated_dir / f"{item['id']}.png")
        context = Image.open(isolated_dir / f"{item['id']}.context.png").convert("RGB")
        alpha = np.asarray(cutout)[..., 3] / 255.0
        texture = Image.fromarray(bleed_edges(np.asarray(cutout)))

        if item["role"] == "structure":
            height = relief.structure_height(context, alpha, source.structure.thickness)
            # The structure's origin is the middle of its outline, so placements can be given relative to it.
            ys, xs = np.nonzero(alpha > 0.5)
            anchor = ((xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2)
            mesh, scale = relief.build_mesh(texture, height, anchor, STRUCTURE_CELLS)
            mesh.export(out / f"{item['id']}.glb")
            painted = Image.open(isolated_dir / f"{item['id']}.painted.png")
            Image.fromarray(bleed_edges(np.asarray(painted))).save(out / f"{item['id']}.painted.png")
            structure = {
                "id": item["id"],
                "model": f"{item['id']}.glb",
                "painted": f"{item['id']}.painted.png",
                "thickness": round(float(height.max() * scale), 4),
                # Where the origin sits in the source image, and how many model units one source pixel is.
                "origin": [round(item["crop"][0] + anchor[0], 2), round(item["crop"][1] + anchor[1], 2)],
                "scale": scale,
                "lift": lift_record,
            }
            print(f"lift: {item['id']} has {len(mesh.vertices)} vertices")
            continue

        kind = source.kind(item["kind"])
        height = relief.thing_height(context, alpha, kind.thickness)
        anchor = _alpha_centroid(alpha)
        mesh, scale = relief.build_mesh(texture, height, anchor, THING_CELLS)
        mesh.export(out / f"{item['id']}.glb")
        cutout.save(out / f"{item['id']}.png")

        instance = instances[item["instance"]]
        ys, xs = np.nonzero(alpha > 0.5)
        record = criteria_for(
            item_id=item["id"],
            kind=kind.id,
            role=kind.role,
            model=f"{item['id']}.glb",
            size={
                "natural": round(natural[kind.id], 4),
                "aspect": round(float((np.ptp(xs) + 1) / (np.ptp(ys) + 1)), 3),
                "thickness": round(float(height.max() * scale), 4),
            },
            overrides=kind.adjust,
            source={
                "image": source.name,
                "instance": instance["id"],
                "box": instance["box"],
                "angle": instance["angle"],
            },
            lift=lift_record,
        )
        (out / f"{item['id']}.adjust.json").write_text(json.dumps(record, indent=2) + "\n")
        print(f"lift: {item['id']} has {len(mesh.vertices)} vertices")

    (out / "structure.json").write_text(json.dumps(structure, indent=2) + "\n")
