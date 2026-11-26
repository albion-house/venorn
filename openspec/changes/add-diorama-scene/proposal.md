## Why

codekiln tried the first viewer and asked for five changes: the pinned things should come off the skull in 3D, the skull should be fully 3D so the camera can turn all the way around it, getting closer and panning should be easier, a right click should remove a pinned thing, and the scene should have its layers.

## What Changes

The pipeline makes relief models with no back, and the viewer holds the camera within a few degrees of the front. This change turns the scene into a diorama:

- The pipeline makes closed models. Each part of a cutout swells as far as it is wide, so a capsule is round and the horn is a cone. The far side of the skull mirrors the near side.
- Pinned things stand off the skull on their pins and cast shadows. A butterfly holds its wings up. A new Depth adjustment makes a thing deeper or presses it flat.
- A new pipeline stage splits the painting around the skull into four layers: the meadow, the clouds, the forest and the sky.
- The viewer stands the meadow in a ring around the skull, wraps the clouds and the forest around the scene, and paints the sky on a dome. The clouds drift, a sun circles the sky, birds fly behind the forest, and a quiet wind can be switched on.
- **BREAKING** The camera turns all the way around the skull and up over it. It zooms in close and pans.
- A right click removes a pinned thing. On a touch screen, pressing and holding it does the same.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `asset-pipeline`: models are closed, criteria gain depth and fold, and a scene of layers is produced and exported.
- `asset-viewer`: the camera is free, pinned things can be removed with a gesture, and the scene's layers surround the structure.

## Impact

- `venorn-asset-pipeline/` gains a `layers` stage and task. The models' vertex counts double.
- `venorn-game-client/` gains the scene around the structure, shadows and the wind sound.
- An exported asset set grows from 10 MB to 16 MB.

## Citations

- [My/Pref/Dev/mise/Tasks](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Pref___Dev___mise___Tasks.md)
- [My/Pref/Dev/Tool/Prefer Open Source](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Pref___Dev___Tool___Prefer%20Open%20Source.md)
- [My/Pref/Dev/Tool/Prefer Well-Maintained Projects](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Pref___Dev___Tool___Prefer%20Well-Maintained%20Projects.md)
- [My/Principle/Declarative over Imperative](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Principle___Declarative%20over%20Imperative.md)
