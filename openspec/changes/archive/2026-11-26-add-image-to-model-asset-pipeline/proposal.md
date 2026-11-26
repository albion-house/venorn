## Why

The game shows a skull and the things a player pins to it, so it needs 3D models of both before any scene or pinning work can start. The models should come from the painting itself, through a process that can be run again on another image.

## What Changes

The repository holds a mise monorepo, OpenSpec and two empty project directories. This change adds:

- A pipeline in `venorn-asset-pipeline/` that takes a source image and writes a GLB model for the structure (the skull and horn) and for each kind of thing found on it.
- A source declaration, `sources/<name>/source.toml`, that names the image by URL and checksum and lists the kinds of things to look for.
- Adjustment criteria: a JSON file beside each model that says how the model attaches to the structure and how far a player may resize, turn, lift, tilt, wrap, bend and mirror it. A JSON Schema defines the format.
- A bare version of the structure, with everything on it painted out, because the game opens on a bare skull.
- A manifest for each asset set that lists the models and records where each thing sits in the painting.
- An asset viewer in `venorn-game-client/` that loads an asset set, lets a person pin a model to the structure with a tap, and offers the adjustments the model's criteria allow.

The pipeline's first way of turning a cutout into a model is a relief: the painted pixels become the front of a shallow model whose height comes from a depth estimate. `design.md` asks which generative image-to-3D model should be added beside it.

## Capabilities

### New Capabilities

- `asset-pipeline`: turning a declared source image into models, adjustment criteria and a manifest.
- `asset-viewer`: loading an asset set in the browser and pinning its models to the structure within their adjustment criteria.

### Modified Capabilities

None.

## Impact

- `venorn-asset-pipeline/` becomes a Python project managed by uv. It depends on torch, transformers, trimesh, scipy, numpy, pillow and jsonschema, and downloads four open-weights models from Hugging Face on first run.
- `venorn-game-client/` becomes a Vite and TypeScript project that depends on three and three-mesh-bvh.
- Git ignores the downloaded source image, the pipeline's working files and the exported asset sets. A clone has no models until the pipeline runs.

## Citations

- [My/Pref/Dev/mise](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Pref___Dev___mise.md)
- [My/Pref/Dev/mise/Tasks](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Pref___Dev___mise___Tasks.md)
- [My/Pref/Dev/Tool/PL/Py](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Pref___Dev___Tool___PL___Py.md)
- [My/Pref/Dev/Tool/PL/JS/Package Manager](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Pref___Dev___Tool___PL___JS___Package%20Manager.md)
- [My/Pref/Dev/Tool/Prefer Open Source](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Pref___Dev___Tool___Prefer%20Open%20Source.md)
- [My/Principle/CLI/Centricity/Offline Tools](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Principle___CLI___Centricity___Offline%20Tools.md)
- [My/Principle/Declarative over Imperative](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Principle___Declarative%20over%20Imperative.md)
