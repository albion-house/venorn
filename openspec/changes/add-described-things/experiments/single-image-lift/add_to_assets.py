"""Add the models lift_one.py made to an exported asset set, as a sixth category in the dock.

The asset set is the one `mise //venorn-asset-pipeline:build` exports. Running
the script again replaces the category it added before. Run the build again to
undo it.

    uv run --project venorn-asset-pipeline python \
        openspec/changes/add-described-things/experiments/single-image-lift/add_to_assets.py MODELS_DIR
"""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

from venorn_assets.criteria import validate
from venorn_assets.export import client_assets_dir
from venorn_assets.source import load_source

KIND = "described"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("models", type=Path, help="directory lift_one.py wrote its models to")
    args = parser.parse_args()

    assets = client_assets_dir(load_source("veneration-ornamentation"))
    manifest_path = assets / "manifest.json"
    manifest = json.loads(manifest_path.read_text())

    entries = []
    for path in sorted(args.models.glob("*.adjust.json")):
        record = json.loads(path.read_text())
        validate(record)
        for name in (record["model"], f"{record['id']}.png", path.name):
            shutil.copy2(args.models / name, assets / name)
        entries.append(
            {"id": record["id"], "model": record["model"], "criteria": path.name, "preview": f"{record['id']}.png"}
        )

    manifest["kinds"] = [kind for kind in manifest["kinds"] if kind["id"] != KIND]
    manifest["kinds"].append({"id": KIND, "role": "pinned", "models": entries})
    manifest["categories"] = [category for category in manifest["categories"] if category["id"] != KIND]
    manifest["categories"].append({"id": KIND, "name": "Described", "kinds": [KIND]})
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"added {len(entries)} described things to {manifest_path}")


if __name__ == "__main__":
    main()
