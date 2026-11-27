## Why

The game was tried in Xcode's iPhone 17 simulator turned on its side, in Safari. Safari's bar takes about 63 points at the top, which leaves the page 874 by 339 points. Two problems showed there. The dock and the strip at the bottom cover the lower half of the skull and its whole jaw, so the thing being decorated cannot be seen or tapped there. The wheel has no room between the status line and the bars, so it shifts inward as a whole and can cover the selected thing, and a button can reach under the Dynamic Island. `fix-simulator-problems` named the second problem in its risks and left it. A phone on its side is a natural way to hold it for a game, so play should work there before more is added.

## What Changes

What exists now:

- The dock and the strip are rows at the bottom of the page in every window. At 874 by 339, with the safe-area inset of 21 at the bottom, they take the bottom 153 points. In the front view the strip covers 20% of the skull's box and the dock 21%, and a tap on the jaw lands on the dock.
- The wheel keeps 50 points at the top free for the status line and 230 at the bottom for the dock, the strip and the design bar. That leaves 59 points in a 339-point page, so at every spot the whole wheel shifts inward. A thing in the middle of the skull has the Design button on top of it, and Kind goes off the top of the page.
- The wheel keeps 5 points from the window's edges, not from the safe area.

This change proposes:

- On a window wider than it is tall and at most 500 points tall, the strip stands in a column down the left side and scrolls up and down, and the dock stands in two columns at the lower right. The middle is left for the skull. The design bar opens as a panel at the lower left, in place of the strip.
- On such a window the wheel keeps clear of the strip, the dock and the open panel. Where no single arc around the thing holds all four buttons, two stand on each of two sides, in the same order clockwise.
- In every window the wheel keeps its buttons inside the safe area.
- A phone held upright and a computer's window keep their layout. Their safe area reaches the edges, so the wheel lays out as before.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `asset-viewer`: the controls stand beside the skull on a wide, short screen, and the wheel keeps clear of the controls and the safe area.

## Impact

- `venorn-game-client/`: `src/style.css`, `src/ui.ts` and `index.html`. The camera, the saved skull, the pipeline and the asset set do not change.

## Citations

None.
