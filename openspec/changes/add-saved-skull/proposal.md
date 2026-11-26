## Why

Nothing is kept after the page closes. A player who reloads the page, or comes back the next day, finds a bare skull. The game is about building a shrine, so the shrine has to outlast one visit. codekiln filed this as [#32 Keep a decorated skull after the page closes](https://github.com/albion-house/venorn/issues/32), split from [#29 Rough edges in the scene and the models](https://github.com/albion-house/venorn/issues/29).

## What Changes

What exists now: the placed things and the pen's strokes live only in the page. "Clear" removes them all with one press, and "Arrange as painted" replaces them, and neither can be undone.

This change proposes:

- The viewer saves the skull in the browser a moment after each change: each thing's model, where it is pinned, its size, turn, color and other settings, and each stroke's ink and path.
- When the page opens, the saved skull is put back and the status line says so.
- "Clear" and "Arrange as painted" keep the skull they replace as the last skull. A new button in the menu, "Bring back the last skull", puts it back and keeps the skull it replaces in its place.
- A saved thing whose model the asset set no longer has is left out, and the status line says how many were left out.
- The meadow stands at the height of the restored skull from the first frame. Restoring lets out no glitter, sets off no burst and sends no rabbit.
- When the browser refuses storage, as a private window can, the game works as before, and the status line says once that the skull will be gone when the page closes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `asset-viewer`: the decorated skull is saved in the browser and put back when the page opens, and "Clear" can be undone.

## Impact

- `venorn-game-client/` gains `src/save.ts`. `src/pen.ts` keeps each stroke's ink and path so that it can draw the stroke again. `src/main.ts` saves after each change and restores the skull when the page opens. `index.html` gains the "Bring back the last skull" button.
- A saved skull stays in one browser on one device, and each asset set has its own.

## Citations

- [My/Principle/Make the Right Thing Easy and the Wrong Thing Hard](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Principle___Make%20the%20Right%20Thing%20Easy%20and%20the%20Wrong%20Thing%20Hard.md)
- [My/Principle/Simplify/Minimize Surface Area](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Principle___Simplify___Minimize%20Surface%20Area.md)
