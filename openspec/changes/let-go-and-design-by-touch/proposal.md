## Why

codekiln tried the published game on a real iPhone, and it works well. [Issue #42](https://github.com/albion-house/venorn/issues/42) names the two things that got in the way of a finger. Zoomed in on the skull, there is no way to let go of a selected thing, so the camera cannot be turned or zoomed over the skull near it. The design bar is a sideways-scrolling row of small pills and one thin slider that shows no value. Both are in the middle of ordinary play, so they come before new things to place.

## What Changes

What exists now:

- A tap on a thing selects it and opens its wheel. A tap on the skull places a new thing, which is selected with a ring and no wheel. Only a tap off the skull, on the sky, or the Escape key lets go.
- While a thing is selected, a one-finger drag that starts on it carries it over the skull, and two fingers within 110 pixels of it, or within one and a half times its size on the screen, resize and turn it. Zoomed in, the thing is large and the skull fills the screen, so there is no sky to tap, and a pinch near the thing resizes it in place of zooming the camera. A tap on the skull places another thing.
- The design bar holds one pill for each setting, Mirror, Reset and Done, in a row that scrolls sideways. Upright on a 402-point phone, Wrap, Fold, Mirror, Reset and Done are past the right edge. The pills are 31 points tall. The slider is the browser's own, 28 points tall, and shows no value.

This change proposes:

- A Done button at the top right while a thing is selected. It lets go of the thing.
- A flick on the selected thing sends the selection away: the ring slides off in the flick's direction and fades, and the thing stays where it was.
- With the wheel open, a tap on the selected thing or on a bare part of the skull closes the wheel and lets go, and places nothing. With only the ring, after placing, a tap on the skull places the next thing, as now.
- Once a thing is let go, one finger turns the camera and two fingers zoom anywhere, over the skull and over the thing.
- The design bar lays its settings out in rows, every one in view, each at least 44 by 44 points and showing its value under its name. Under them, a slider drawn by the page fills a row 44 points tall that a finger can press anywhere along, between a minus and a plus button that step the setting. The bar's own Done becomes Close.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `asset-viewer`: a selected thing can be let go with a button, a flick or a tap with the wheel open, and the design bar suits a finger.

## Impact

- `venorn-game-client/`: `src/gestures.ts`, `src/main.ts`, `src/ui.ts`, `src/style.css` and `index.html`. The layout of the bars, the camera, the saved skull, the pipeline and the asset set do not change.

## Citations

None.
