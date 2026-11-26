## Why

Decorating the skull changes nothing around it. codekiln wants the scene to answer the player: the meadow starts low and grows as things are placed, little surprises happen now and then, and music comes in that the placed things play. codekiln described these on 2026-11-26 and said all of it is tentative.

## What Changes

What exists now: the meadow stands at full height from the start, and placing a thing plays a pin sound.

This change proposes:

- The pipeline finds named places on the bare structure and writes them to the manifest. The painting declares two: the eye socket, a hollow, and the horn, a spike.
- The viewer keeps one number for how lush the scene is. It rises with the number of things on the structure and is full at 24.
- The meadow starts as low shoots. Its plants grow from their roots, its rings of cut paper rise out of the ground, and it sways further as it grows.
- Placing a thing lets out a puff of glitter from the horn's tip. The puff is larger the more things are on the skull.
- Three or more things in a row along the horn set off a long burst of rainbow glitter, at most once in five minutes.
- A rabbit comes out of the eye socket when the sixth thing is placed, and now and then after that. It bounds away toward the gap in the forest, and a flock of birds crosses the gap.
- Ambient music fades in as things are placed. Each placed thing plays a note of its own from where it sits, louder when the camera is near, and it pulses and is joined to the next thing by a line as it sounds.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `asset-pipeline`: a source declares named places on its structure, and the manifest lists those found.
- `asset-viewer`: the scene grows with the decoration, glitter and a rabbit answer it, and the placed things play music.

## Impact

- `venorn-asset-pipeline/` gains `features.py`, and the isolate stage runs the detector once more for each declared feature.
- `venorn-game-client/` gains `src/surprises.ts` and `src/music.ts`. `src/meadow.ts` gains a growth uniform, and `src/scene.ts` tells where the nearest gap in the far layer is.

## Citations

- [My/Principle/Declarative over Imperative](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Principle___Declarative%20over%20Imperative.md)
