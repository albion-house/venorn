## Why

The player can place things on the skull but cannot draw on it. The premise of the game includes painting on the skull, and on 2026-11-26 codekiln suggested a glitter pen as a first way to do it. The idea is tentative.

## What Changes

What exists now: the dock holds the five categories of things, and every press on the skull places or selects a thing.

This change proposes:

- A glitter pen sits in the dock after the categories, with the key `6`.
- With the pen chosen, the strip holds six inks: gold, silver, rose, aqua, violet and rainbow. A button at the end of the strip takes back the last stroke, and so does the `Z` key.
- A drag on the skull draws a stroke of glitter that follows the surface, on any side. A tap leaves a dot. A drag that starts off the skull turns the camera, and two fingers zoom and pan.
- The glitter is made of flecks that catch the light as the camera and the sun move.
- "Clear" removes the strokes with the things.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `asset-viewer`: a pen draws strokes of glitter on the structure.

## Impact

- `venorn-game-client/` gains `src/pen.ts`. `src/gestures.ts` gains a drawing gesture, and a category in the dock can carry buttons of its own after its variations.
- The strokes are not saved. They last until the page is closed.

## Citations

- [My/Principle/Simplify/Create Uniform Interfaces](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Principle___Simplify___Create%20Uniform%20Interfaces.md)
