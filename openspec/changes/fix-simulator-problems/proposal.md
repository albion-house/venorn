## Why

The game was tried by touch in Xcode's iPhone 17 simulator, held upright at 402 by 874 points. [The comment on issue #25](https://github.com/albion-house/venorn/issues/25#issuecomment-7204288883) lists four problems. Turned on its side, at 874 by 402, the simulator showed a fifth. Three get in the way of play on a phone, one leaves a wrong hint on the screen, and one shows bare sky every time the camera turns on a tall screen. All five came out of the same check and each is small, so they go together.

## What Changes

What exists now:

- The wheel's buttons stand 78 pixels from the selected thing. Near an edge of the screen the whole wheel shifts inward, so a button can sit on top of a small thing. On a phone held upright the skull sits low on the screen, where the wheel shifts up and its Design button covers the thing. A finger that lands there presses the button, not the thing.
- With the pen chosen, the first finger of a two-finger zoom starts a stroke, and the second finger ends it. The stroke stays as a dab of glitter where the first finger landed, and it is saved with the skull.
- The status line keeps saying "Drag it to move it, pinch to resize, twist to turn" after the thing is let go.
- The wrapped layer of clouds ends at the top of the painting, and the sky dome above it is one flat blue. A tall screen sees over the clouds once the camera turns or tilts: the top fifth of the screen is bare blue.
- The menu button and the status line sit 10 and 60 pixels from the left edge. A phone on its side has its Dynamic Island or notch at one side, and the button sits under it.

This change proposes:

- The wheel's buttons stand around the thing's middle, at least as far out as the thing's size on the screen plus a button's width. Near an edge they gather on the side that has room, in the same order.
- A stroke is taken back when a second finger comes down within half a second of the first, before the first has gone 20 pixels. The skull is saved again without it.
- Letting go of the selected thing puts the status line back to the hint for the chosen category.
- The clouds carry on above the top of the painting: the ring is taller, and above the picture's top it shows the picture's upper part again, moved along the ring, fading in across the edge and out toward the ring's top.
- The menu button and the status line stay inside the screen's safe area on both sides. On a phone held upright and on a computer the safe area reaches the edges, so they stay where they are.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `asset-viewer`: the wheel stands clear of the selected thing, a zoom with the pen leaves no glitter, the status line follows the selection, the clouds reach above the painting's top, and the menu button and status line keep clear of a notch.

## Impact

- `venorn-game-client/`: `src/ui.ts`, `src/style.css`, `src/gestures.ts`, `src/pen.ts`, `src/main.ts` and `src/scene.ts`. A saved skull keeps its form. The pipeline and the asset set do not change.

## Citations

None.
