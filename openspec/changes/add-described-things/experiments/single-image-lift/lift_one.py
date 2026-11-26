"""Turn single images of one thing into pinnable models, and time each stage.

The stand-ins come from cut_standins.py. Every image runs through the same
stages in one process, so the first image pays for loading the models and the
rest show what a process that keeps the models loaded would take.

Run from the repository root, after `mise //venorn-asset-pipeline:build`:

    uv run --project venorn-asset-pipeline python \
        openspec/changes/add-described-things/experiments/single-image-lift/lift_one.py \
        STANDINS_DIR/standins.json --out OUT_DIR --repeat 3
"""
# ruff: noqa: E402

from __future__ import annotations

import time

STARTED = time.perf_counter()

import argparse
import json
import statistics
import warnings
from contextlib import contextmanager
from functools import wraps
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageFilter
from scipy import ndimage

from venorn_assets import models, relief
from venorn_assets.catalog import _principal_angle
from venorn_assets.criteria import criteria_for
from venorn_assets.isolate import TARGET_SIDE, _crop_box, bleed_edges
from venorn_assets.lift import THING_CELLS, _alpha_centroid
from venorn_assets.source import load_source

IMPORTED = time.perf_counter()
warnings.filterwarnings("ignore", category=FutureWarning)

# A pixel this far from the ground color, in RGB units, belongs to the thing when the ground is keyed out.
KEY_DISTANCE = 40.0
STAGES = ("detect", "segment", "cut", "classify", "depth", "heights", "mesh", "write")
spent: dict[str, float] = {}


@contextmanager
def stage(name: str):
    began = time.perf_counter()
    yield
    spent[name] = spent.get(name, 0.0) + time.perf_counter() - began


def timed(name: str, function):
    @wraps(function)
    def run(*args, **kwargs):
        with stage(name):
            return function(*args, **kwargs)

    return run


# relief.thing_heights estimates depth through models.depth, so the depth estimate is timed apart from the height maps.
models.depth = timed("depth", models.depth)


def detect_one(image: Image.Image, description: str) -> tuple[float, tuple[float, ...]] | None:
    """The detector's best box for the description, in image pixels."""
    processor, model, device = models._detector()
    text = description.lower().rstrip(" .") + " ."
    inputs = processor(images=image, text=text, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = model(**inputs)
    result = processor.post_process_grounded_object_detection(
        outputs, inputs.input_ids, threshold=0.2, text_threshold=0.2, target_sizes=[image.size[::-1]]
    )[0]
    if len(result["scores"]) == 0:
        return None
    best = int(result["scores"].argmax())
    return float(result["scores"][best]), tuple(float(v) for v in result["boxes"][best].tolist())


def key_out_ground(image: Image.Image) -> np.ndarray:
    """Outline the thing by its difference from the plain ground, read from the image's border."""
    pixels = np.asarray(image).astype(np.float32)
    rim = max(2, round(0.02 * max(image.size)))
    border = np.concatenate(
        [
            pixels[:rim].reshape(-1, 3),
            pixels[-rim:].reshape(-1, 3),
            pixels[:, :rim].reshape(-1, 3),
            pixels[:, -rim:].reshape(-1, 3),
        ]
    )
    ground = np.median(border, axis=0)
    mask = np.linalg.norm(pixels - ground, axis=2) > KEY_DISTANCE
    return ndimage.binary_opening(mask, iterations=1)


def largest_piece(mask: np.ndarray) -> np.ndarray:
    labels, count = ndimage.label(ndimage.binary_fill_holes(mask))
    if count <= 1:
        return labels > 0
    sizes = ndimage.sum(labels > 0, labels, range(1, count + 1))
    return labels == int(np.argmax(sizes)) + 1


def lift_one(image_path: Path, description: str, key: bool, out: Path, natural: dict[str, float]) -> dict:
    source = load_source("veneration-ornamentation")
    pinned = [kind for kind in source.kinds if kind.role == "pinned" and kind.find == "detector"]
    image = Image.open(image_path).convert("RGB")
    item_id = f"described-{image_path.stem}"
    spent.clear()

    score, quality = None, None
    if key:
        with stage("segment"):
            mask = largest_piece(key_out_ground(image))
    else:
        with stage("detect"):
            found = detect_one(image, description)
        inset = 0.02 * max(image.size)
        score, box = found if found else (None, (inset, inset, image.width - inset, image.height - inset))
        with stage("segment"):
            masks, qualities = models.segment(image, [box])
            mask = largest_piece(masks[0])
            quality = qualities[0]

    with stage("cut"):
        ys, xs = np.nonzero(mask)
        outline = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
        crop = _crop_box(outline, image.width, image.height)
        scale = TARGET_SIDE / max(crop[2] - crop[0], crop[3] - crop[1])
        size = (round((crop[2] - crop[0]) * scale), round((crop[3] - crop[1]) * scale))
        context = image.crop(crop).resize(size, Image.LANCZOS)
        alpha_image = Image.fromarray(mask.astype(np.uint8) * 255).crop(crop).resize(size, Image.BICUBIC)
        alpha_image = alpha_image.filter(ImageFilter.GaussianBlur(max(scale, 1.0) * 0.6))
        alpha_image = alpha_image.point(lambda v: 0 if v < 96 else min(255, (v - 96) * 4))
        cutout = context.convert("RGBA")
        cutout.putalpha(alpha_image)

    # The nearest kind lends the described thing its thickness, its size and its criteria.
    with stage("classify"):
        probabilities = models.classify([context], [kind.looks_like for kind in pinned])[0]
        kind = pinned[int(np.argmax(probabilities))]

    alpha = np.asarray(cutout)[..., 3] / 255.0
    began, depth_before = time.perf_counter(), spent.get("depth", 0.0)
    front, back = relief.thing_heights(context, alpha, kind.thickness)
    spent["heights"] = time.perf_counter() - began - (spent["depth"] - depth_before)

    with stage("mesh"):
        texture = Image.fromarray(bleed_edges(np.asarray(cutout)))
        anchor = _alpha_centroid(alpha)
        mesh, mesh_scale = relief.build_mesh(texture, front, anchor, THING_CELLS, back=back, rest_on_back=True)

    with stage("write"):
        mesh.export(out / f"{item_id}.glb")
        cutout.save(out / f"{item_id}.png")
        on = alpha > 0.5
        ys, xs = np.nonzero(on)
        record = criteria_for(
            item_id=item_id,
            kind="described",
            role="pinned",
            model=f"{item_id}.glb",
            size={
                "natural": natural.get(kind.id, 0.08),
                "aspect": round(float((np.ptp(xs) + 1) / (np.ptp(ys) + 1)), 3),
                "thickness": round(float((front.max() + back.max()) * mesh_scale), 4),
            },
            overrides=kind.criteria,
            source={"image": image_path.name, "instance": item_id, "box": outline, "angle": _principal_angle(mask)},
            lift={
                "backend": relief.NAME,
                "models": [
                    *(() if key else (models.DETECTOR_ID, models.SEGMENTER_ID)),
                    models.CLASSIFIER_ID,
                    models.DEPTH_ID,
                ],
            },
        )
        (out / f"{item_id}.adjust.json").write_text(json.dumps(record, indent=2) + "\n")

    return {
        "image": image_path.name,
        "description": description,
        "stages": {name: round(spent.get(name, 0.0), 4) for name in STAGES},
        "total": round(sum(spent.values()), 4),
        "detector_score": None if score is None else round(score, 3),
        "mask_quality": None if quality is None else round(quality, 3),
        "nearest_kind": kind.id,
        "nearest_kind_probability": round(float(probabilities.max()), 3),
        "vertices": len(mesh.vertices),
        "model": f"{item_id}.glb",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("standins", type=Path, help="standins.json written by cut_standins.py")
    parser.add_argument("--out", type=Path, required=True, help="directory for the models and timings.json")
    parser.add_argument("--only", action="append", default=[], help="lift only this stand-in image; repeatable")
    parser.add_argument("--repeat", type=int, default=1, help="how many times to lift every image")
    parser.add_argument(
        "--key",
        action="store_true",
        help="outline the thing by keying out a plain ground, with no detector or segmenter",
    )
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    listing = json.loads(args.standins.read_text())
    if args.only:
        listing = [entry for entry in listing if entry["image"] in args.only]
    source = load_source("veneration-ornamentation")
    natural = {}
    for kind in source.kinds:
        made = source.build_dir / "models" / f"{kind.id}-01.adjust.json"
        if made.exists():
            natural[kind.id] = json.loads(made.read_text())["size"]["natural"]

    loads = {}
    loaders = (
        ("classifier", models._classifier),
        ("depth", models._depth),
        *(() if args.key else (("segmenter", models._segmenter), ("detector", models._detector))),
    )
    for name, load in loaders:
        began = time.perf_counter()
        load()
        loads[name] = round(time.perf_counter() - began, 3)

    runs = []
    for repeat in range(args.repeat):
        for entry in listing:
            run = lift_one(args.standins.parent / entry["image"], entry["description"], args.key, args.out, natural)
            run["repeat"] = repeat
            runs.append(run)
            print(
                f"{entry['image']:>22} pass {repeat}: {run['total']:.2f} s "
                + " ".join(f"{name} {run['stages'][name]:.2f}" for name in STAGES)
                + f" -> {run['nearest_kind']} ({run['nearest_kind_probability']:.2f})"
            )

    report = {
        "device": models.accelerator(),
        "torch": torch.__version__,
        "key": args.key,
        "imports": round(IMPORTED - STARTED, 3),
        "loads": loads,
        "runs": runs,
    }
    first, rest = runs[0], runs[1:]
    print(f"imports {report['imports']:.2f} s, loads " + ", ".join(f"{k} {v:.2f} s" for k, v in loads.items()))
    print(f"first image {first['total']:.2f} s")
    if rest:
        print(
            f"later images: median {statistics.median(r['total'] for r in rest):.2f} s, "
            + ", ".join(f"{name} {statistics.median(r['stages'][name] for r in rest):.3f}" for name in STAGES)
        )
    (args.out / "timings.json").write_text(json.dumps(report, indent=2) + "\n")


if __name__ == "__main__":
    main()
