## Why

[Issue #29, rough edges in the scene and the models](https://github.com/albion-house/venorn/issues/29), lists things seen while building that nobody has fixed. Four of them get in the way of play or show up in every view: the camera cannot be turned with the pen on a phone, the color setting turns parts that should stay as they are, the rabbit does not follow the light, and the forest and the meadow show mirror images where their copies meet. Fixing them makes the game that exists now feel finished before more is added to it.

## What Changes

What exists now:

- With the pen chosen, a press on the skull draws, and only a press off the skull turns the camera. When the skull fills a phone's screen, one finger cannot turn the camera.
- The color setting turns every color of a thing about the color wheel, so a butterfly's dark body turns with its wings.
- The rabbit is drawn without light. It stays pale when the sun is low and orange.
- The forest and the rings of cut paper repeat around the scene with every second copy mirrored. Shapes repeat in mirror image where copies meet.

This change proposes:

- The strip holds a button that turns the view while the pen is chosen. With it pressed, one finger turns the camera from anywhere, and choosing an ink brings drawing back.
- The color setting turns only a thing's colored parts. Parts that are dark next to the thing's own colors, and parts that are nearly grey, keep their color.
- The rabbit is lit by the sun and the sky like the paper meadow.
- The pipeline cuts the forest and the meadow so that each picture's end carries on into its start, and the viewer repeats them without mirroring. The clouds keep their mirrored copies.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `asset-viewer`: the pen can turn the view, the color setting spares dark and grey parts, the rabbit is lit, and layers that join repeat without mirroring.
- `asset-pipeline`: the far and ground layers are cut so that their ends join, and the manifest says which layers join that way.

## Impact

- `venorn-game-client/`: `src/gestures.ts`, `src/main.ts`, `src/ui.ts`, `src/pen.ts`, `src/placement.ts`, `src/surprises.ts`, `src/meadow.ts` and `src/scene.ts`. The change to `src/scene.ts` is a few lines in the function that wraps a layer around the scene.
- `venorn-asset-pipeline/`: `layers.py` and `export.py`. The layers stage writes one more check picture, `layers/joins.png`. An asset set built before this change still works: its layers carry no mark and repeat mirrored as before.

## Citations

None.
