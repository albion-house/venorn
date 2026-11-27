## Why

codekiln asked for two things while trying the game. [Issue #48](https://github.com/albion-house/venorn/issues/48): a way to dismiss the controls at the bottom of the screen, to just look at the skull. Upright on a phone, the dock, the strip and the status line cover the bottom quarter of the scene and a line at the top. [Issue #49](https://github.com/albion-house/venorn/issues/49): a mute button. Today the only switch for the sound is "Sound", the second-to-last item in the ⋯ menu, two taps away.

## What Changes

What exists now:

- The dock of categories, the strip of variations and the status line are always on the screen.
- "Sound", a tick box in the ⋯ menu, switches every sound off and on. It is on at every visit.

This change proposes:

- **Hiding the controls.** A Hide the controls item in the ⋯ menu, a swipe on the dock or the strip toward the edge they stand at, or the H key hides the dock, the strip and the status line. Hiding lets go of a selected thing.
- **While they are hidden:** one finger turns the view, two fingers zoom, and a tap places nothing. The ⋯ menu and the mute button stay.
- **Bringing them back:** a tap on the scene, a small button where the dock was, the menu's item (now Show the controls), or H or Escape.
- **A mute button** at the top right, level with the ⋯ button, with a speaker that shows a cross when the sound is off. The M key does the same. The choice is remembered for the next visit. The menu's "Sound" tick box goes, and Done now stands to the left of the mute button.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `asset-viewer`: the controls can be hidden to look at the skull, and a button on the screen mutes the sound.

## Impact

- `venorn-game-client/`: `index.html`, `src/style.css`, `src/ui.ts`, `src/main.ts` and `src/gestures.ts`. The camera, the saved skull, the pipeline and the asset set do not change.

## Citations

None.
