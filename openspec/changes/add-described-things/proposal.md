## Why

The premise of the game has the player press a spot on the skull, type or speak what belongs there, and see a thing made from that description pinned to the spot. Today the player chooses only among the 34 models cut from the painting. [Described things: type or dictate what belongs on a spot · Issue #27](https://github.com/albion-house/venorn/issues/27) records what codekiln has said about it so far.

A full pipeline run takes about 85 seconds, so the issue left open whether one new image could become a model in a few seconds. The experiment in `experiments/single-image-lift/` measured it: a process that keeps the models loaded makes a pinnable model with adjustment criteria from one image in about 2.5 seconds, and in about 0.4 seconds when the thing is on a plain ground. That makes the pipeline side of described things the next step. How the image is made, how voice works and where a described thing sits in the dock wait on codekiln.

## What Changes

What exists now: the pipeline makes models only from the painting, in one run that rebuilds every model. The viewer loads that asset set once, and its dock holds five categories of things and a glitter pen.

This change proposes:

- The pipeline lifts one image of one thing into a model with adjustment criteria and a preview. It outlines the thing, names the nearest of the painting's five pinned kinds, and makes the model with the relief backend, as it does for the painting's things.
- When the image's border is one flat color, the pipeline keys the ground out. Otherwise the detector finds the thing from its description.
- A process on the Mac loads the models once, warms each of them, and lifts each image it is sent. The page reaches it through the server that serves the page.
- A described thing's criteria record its description.
- The viewer can add a model it receives while running and pin it at the spot the player pressed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `asset-pipeline`: one described image becomes a model with adjustment criteria, and a process keeps the models loaded to do it quickly.

The viewer's requirements for described things follow from the answers to the open questions in `design.md`.

## Impact

- `venorn-asset-pipeline/` gains the single-image lift and a task that starts the lifting process. The process holds about 3.4 GB of memory, or 1.7 GB if it only keys out plain grounds.
- `venorn-asset-pipeline/schemas/adjustment.schema.json` gains `source.description`.
- `venorn-game-client/vite.config.ts` passes requests under `/lift` to the process, for the dev and phone servers. A site published on GitHub Pages has no process to reach.
- Described models are written under `venorn-asset-pipeline/build/described/`, which git ignores, and last in the page until it closes, like every placed thing.

## Citations

- [My/Principle/Simplify/Create Uniform Interfaces](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Principle___Simplify___Create%20Uniform%20Interfaces.md)
- [My/Principle/Simplify/Minimize Surface Area](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Principle___Simplify___Minimize%20Surface%20Area.md)
