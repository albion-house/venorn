## Why

The viewer was made for judging models: a tray of twenty of them and a panel of sliders. codekiln wants it to play as a decoration game. The skull starts bare, the player chooses among many butterflies, candies, pills, jewels and flowers, and each one is shaped with the same few moves on a phone and on a laptop.

## What Changes

What exists now: one tray lists every model, a tap pins the chosen one, and a selected thing shows a slider for every adjustment. Holding a finger on a thing removes it.

This change proposes:

- The pipeline makes more models of each kind: 34 where it made 20.
- A source groups its kinds into named categories. The painting has five: butterflies, candies, pills, jewels and flowers. Flowers holds the pinned flowers and the painted sprigs.
- Every model's criteria gain a color range, which turns the model's colors around the color wheel.
- The viewer shows the categories in a dock along the bottom, numbered 1 to 5 for the number keys, and the chosen category's variations in a strip above it.
- A placed thing is selected. Dragging it moves it over the skull, a pinch or a scroll resizes it, and a twist or a Shift+scroll turns it. Choosing another category or variation changes the selected thing where it is.
- Tapping a placed thing opens a wheel around it with four buttons: Kind, Variation, Design and Remove.
- Design opens a bar with one chip for each adjustment and one slider for the chosen chip, so the skull stays in view on a phone.
- The views and switches move behind one menu button.
- **BREAKING**: holding a finger on a thing no longer removes it, and the arrow keys no longer pan. The wheel's Remove button and the Delete key remove a thing, and the left and right arrow keys step through variations.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `asset-pipeline`: a source groups its kinds into categories, the manifest lists them, and criteria carry a color range.
- `asset-viewer`: categories and variations, a selected thing with gestures and keys, an adjustment wheel and a design bar replace the tray and the slider panel.

## Impact

- `venorn-asset-pipeline/sources/veneration-ornamentation/source.toml` declares more exemplars and the five categories.
- `venorn-asset-pipeline/schemas/adjustment.schema.json` requires `adjust.hue`.
- An exported asset set grows from 22 MB to 26 MB.
- `venorn-game-client/` gains `src/ui.ts` and `src/gestures.ts`, and `index.html` and `src/style.css` are rewritten around the dock.

## Citations

- [My/Principle/Simplify/Create Uniform Interfaces](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Principle___Simplify___Create%20Uniform%20Interfaces.md)
- [My/Principle/Declarative over Imperative](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Principle___Declarative%20over%20Imperative.md)
