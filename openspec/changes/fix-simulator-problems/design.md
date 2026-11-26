## Context

[The comment on issue #25](https://github.com/albion-house/venorn/issues/25#issuecomment-7204288883) lists what the iPhone 17 simulator showed. This change takes its four problems and the one seen with the simulator on its side. The horn that shows as two halves from the front stays as codekiln left it, in [issue #29](https://github.com/albion-house/venorn/issues/29).

## Goals / Non-Goals

**Goals:**

- A finger on the selected thing always reaches the thing, with its wheel open.
- A two-finger zoom with the pen chosen leaves nothing behind.
- The status line says what can be done now.
- A tall screen sees painted clouds wherever it sees sky above the meadow.
- On a phone on its side, the menu button and the status line can be seen and pressed.

**Non-Goals:**

- None.

## Decisions

### The wheel's buttons stand clear of the thing

Two ways were considered: keep the buttons off the thing, or let a second finger cancel a button press and go to the thing. A second finger only helps a pinch. A tap or a drag on a thing under a button still presses the button, and the thing stays hidden. So the buttons stay off the thing.

The buttons stand around the thing's middle. Their distance is the thing's radius on the screen plus 44 pixels, between 78 and 130 pixels, as before, so a button's inner edge is 13 pixels outside the dashed ring. When all four fit on the screen at their usual places, Kind above, Variation to the right, Design below and Remove to the left, they go there. Otherwise the viewer finds the longest arc around the thing at which a button is whole on the screen, clear of the status line above and of the dock, the strip and the design bar below. It spreads the four buttons evenly along that arc, as much as 90° apart, in the same order clockwise. Two buttons need a gap of 6 pixels, which sets the least angle between them. If the arc is too short at 130 pixels, the buttons may stand as far as 180 pixels out. In a corner where even that leaves no arc, the whole wheel shifts inward as it did before.

A thing larger than 86 pixels in radius has its buttons over its rim, as before. Its middle stays free.

### A stroke that only starts a zoom is taken back

The pen still lays a dab the moment a finger touches the structure, so drawing answers at once. When a second finger arrives, the gesture code looks at how long ago the first finger came down and how far it has gone. Within 500 milliseconds and under 20 pixels, the stroke was only the start of a zoom: the pen takes it back and the two fingers zoom and pan. Otherwise the stroke stays, as before.

The pen takes back only the stroke being drawn. If that stroke was already taken back with the arrow, nothing else goes. The skull may have been saved while the dab was down, when a save from the last change fell due, so taking a stroke back saves the skull again.

### Letting go of the thing restores the hint

Selecting nothing after a thing was selected sets the status line to the chosen category's hint, the line a person sees on choosing that category: "Butterflies: tap the skull to place one", or the pen's hint. A message that follows in the same step, such as "Removed" or "Cleared", replaces it.

### The cloud ring carries on above the painting's top

The wrapped cloud layer stands 0.6 of its picture's height taller. Up to the picture's top it shows the picture as before, with the same fade at its top edge. Above the edge the shader draws the picture's upper part again, 0.37 of a copy along the ring so that the two do not line up, behind the picture. It fades in over the top 5% of the picture and out over the upper half of the new part. The new part flows with the same slow field as the rest, so the two flow together.

Three other ways were tried:

- A high bank of cloud pieces above the ring. Even at 60 pieces it left most of the top band bare, and denser banks cost more draw calls.
- The picture mirrored above its top. It filled the band but showed pairs of clouds joined at the edge like a reflection.
- A darker gradient toward the top of the dome. It did not change how bare the band looked.

The new part begins above what a wide screen's front view reaches, so that view does not change.

### The menu button and the status line keep to the safe area

The page already asks the phone to fill the whole screen, with `viewport-fit=cover`. The stylesheet sets the room at the left as the larger of 10 pixels and the safe-area inset at the left, and the same at the right. The menu button and the menu stand that far from the left edge, and the status line runs from 50 pixels past it to that far from the right edge. iOS reports insets at both sides of a phone on its side, so the button and the line keep clear of the island whichever way the phone is turned. A phone held upright reports no inset at its sides, and a computer none at all, so they keep their places.

## Risks / Trade-offs

- With the skull low on a phone's screen, the wheel opens with its buttons above and beside the thing, and Kind is no longer always on top. The order around the thing stays the same.
- A short stroke that ends in a zoom within half a second is lost. A person who means a dot lifts the finger first, and a lifted dot stays.
- Some clouds above the painting's top are the pale, lit clouds from the middle of the painting's sky. Near the top edge the old and new clouds fade across each other, which looks like a band of thinner cloud.
- A phone on its side is 402 points tall. The 230 pixels kept for the dock, the strip and the design bar leave no band tall enough for the wheel, so there the wheel shifts inward as a whole, as it did before, and a button can still cover the thing.
- A wheel button can still reach under a notch on a phone on its side. The wheel keeps 5 pixels from the window's edges, not from the safe area.

## Resolved Questions

None.

## Open Questions

### 1 - Is half a second and 20 pixels the right line between the start of a zoom and a short stroke?

> Context from the drafting agent, for question 1.
>
> The numbers are a guess and were checked only with scripted touch in a desktop browser. In the simulator both fingers of a pinch come down together. On a real phone a person may put the second finger down more slowly. A longer time takes back more strokes that a person meant.

<ANSWER_HERE>

### 2 - Do the clouds above the painting's top look right?

> Context from the drafting agent, for question 2.
>
> They are the painting's upper clouds again, moved along the ring. A sparser sky or a different part of the picture could go there instead.

<ANSWER_HERE>
