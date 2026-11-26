## Context

The viewer listed every model in one tray and showed a selected thing's adjustments as a column of sliders. On a phone the column covered the skull. The painting holds many more butterflies, candies, pills, beads and flowers than the twenty models the pipeline exported.

codekiln described the controls they want on 2026-11-26 and said that all of it is tentative. This change builds a first version to try.

## Goals / Non-Goals

**Goals:**

- One set of controls that works with a finger and with a mouse and keyboard.
- Changing a thing's kind, variation and design after it is placed, as easily as before.
- Size, turn and position changed by touching the thing itself.

**Non-Goals:**

none

## Decisions

### Categories come from the source

`source.toml` lists the categories in the order of the number keys, each with the kinds it holds. The pipeline refuses a source whose categories leave a kind out or name it twice. A source with no categories gets one category for each kind. The viewer builds its dock from the manifest and knows nothing about butterflies or pills.

### Dock, strip and selection

The dock holds one round button for each category, with its number. The strip above it holds the chosen category's variations. The model the next tap places is the chosen variation of the chosen category.

A placed thing is selected, and a dashed ring marks it. The dock and strip follow the selection: selecting a jewel shows the jewels and marks that jewel's variation. Choosing a category or a variation while a thing is selected changes that thing where it is, and it keeps its size, turn, color and mirroring as far as the new model's criteria allow. With nothing selected, the same choice sets what the next tap places.

### Gestures act on the selected thing only

A drag that starts on the selected thing moves it over the surface. A drag that starts anywhere else turns the camera, including a drag that starts on another thing. A skull covered in things can still be turned this way, and a thing is never moved by accident.

Two fingers near the selected thing resize and turn it, and two fingers elsewhere zoom and pan the camera. A scroll over the selected thing resizes it, and with Shift or Alt held it turns it. A trackpad pinch arrives as a scroll with Ctrl held and resizes in smaller steps.

A tap that lands within 14 pixels of the middle of a thing counts as a tap on it, because a thing on a phone can be 30 pixels across.

### Wheel

Tapping a placed thing opens four round buttons around it: Kind above, Variation to the right, Design below and Remove to the left. Kind steps to the next category and Variation to the next variation, so each tap shows a change. The wheel hides while the thing is dragged, pinched or twisted. Near an edge of the screen the buttons gather on the side of the thing that has room, so that all four stay in view and none covers the thing. `fix-simulator-problems` describes how.

Placing a thing selects it but does not open the wheel, so a row of things can be placed with one tap each.

### Design bar

Design opens a bar above the strip: a row of chips, one for each adjustment the thing's criteria allow, and one slider for the chosen chip. The bar is about 90 pixels high, so the thing stays in view while it changes. The bar opens on the adjustment that was changed last.

### Color

The color adjustment turns a model's colors around the gray axis in the fragment shader, which keeps light colors light and dark colors dark. Every placed thing has its own copy of the material and shares one compiled program.

### Keys

- `1` to `5` choose a category.
- Left and right arrows step through variations.
- Up and down arrows resize the selected thing, and `[` and `]` turn it.
- Delete or Backspace removes the selected thing.
- Escape closes the menu, then the design bar, then clears the selection.

## Risks / Trade-offs

- A drag on an unselected thing turns the camera, so moving a thing takes a tap first. The tap also opens the wheel, which hides again when the drag starts.
- Kind and Variation step forward only. Reaching the variation before the current one takes a tap in the strip or the left arrow key.
- The color adjustment turns every color of a model, so a butterfly's dark body changes with its wings.

## Resolved Questions

### 1 - Where should generated models be stored?

In GitHub releases, one for each exported asset set, and not in git or git LFS. `venorn-game-client/mise.toml` names the release the GitHub Pages site is built with. codekiln asked on 2026-11-26 for the game to be deployed with a sensible approach and left the choice to the drafting agent. `openspec/changes/publish-on-pages/` has the reasons.

## Open Questions

### 2 - Should the game stay on three.js used directly?

> Context from the drafting agent, for question 2.
>
> The viewer uses three.js with no framework. React Three Fiber would fit a React interface, and Babylon.js is the main alternative engine. The models are standard GLB files and load in any of them.

<ANSWER_HERE>

### 3 - Are Kind, Variation, Design and Remove the right buttons for the wheel?

> Context from the drafting agent, for question 3.
>
> codekiln suggested kind, variation and design buttons and said the idea was tentative. Remove was added because holding a finger on a thing no longer removes it. Kind and Variation each step forward by one. The alternative is for each to open a small chooser.

<ANSWER_HERE>
