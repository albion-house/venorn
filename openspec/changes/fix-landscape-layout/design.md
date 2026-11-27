## Context

Turned on its side in Safari, the iPhone 17 simulator gives the page 874 by 339 points. iOS reports a safe-area inset at each side, wherever the Dynamic Island is, and one at the bottom for the home indicator. This change takes them as 62 at the sides, the guess `fix-simulator-problems` made, and 21 at the bottom. Neither was read from the simulator. `fix-simulator-problems` kept the menu button and the status line inside those insets. Its design lists two risks that this change takes up: the wheel has no band tall enough on a phone on its side, and a wheel button can reach under the island.

Measured at 874 by 339 before this change, in the front view: the skull's box runs from 319 to 555 across and from 37 to 303 down. The strip runs from 186 to 240 down and the dock from 248 to 318, so they cover the skull from 186 down: 20% of its box behind the strip and 21% behind the dock.

## Goals / Non-Goals

**Goals:**

- On a phone on its side, the whole skull shows in the front view, and every part of it can be tapped.
- The controls are easy to reach with the thumbs of a phone held in both hands.
- The wheel stands clear of the selected thing there too, and its buttons stay out of the safe-area insets.
- A phone held upright and a computer's window look and work as they did.

**Non-Goals:**

- None.

## Decisions

### The strip and the dock stand at the sides of a wide, short window

Three ways were considered.

- Frame the camera so the skull sits above the bars. The band between the status line and the strip is 136 points tall, so the skull would be about 120 points tall, half its size now. Things on it would be too small to tap and drag.
- Put the dock and the strip in one column at one side. Six round buttons and the strip's tiles do not fit one above the other in 339 points. Two columns at one side would push the free area off the middle, so the camera would need an offset to center the skull.
- Put the strip down the left side and the dock at the lower right. This is the choice.

A phone on its side is held in both hands, with the thumbs near the lower corners. The strip stands under the left thumb and the dock under the right, so each thumb reaches its controls without the hand changing its hold. The middle stays free, and either thumb taps the skull there. The camera does not change: its front view already fits the skull to the window's height, so with the bars out of the middle the skull shows whole and keeps its size.

- The strip starts below the menu button and scrolls up and down when its tiles do not fit, as the 13 flowers and the pen's 8 tiles do. Choosing a variation scrolls it into view, as choosing one sideways did. It is anchored at the bottom, near the thumb.
- The dock's six buttons stand in two columns of three, 52 points across in place of 54 or 58. The numbers read in rows of two, so the pen, number 6, sits at the corner.
- The menu opens over the strip.

The layout changes when the window is wider than tall and at most 500 points tall. A phone on its side in a browser is about 320 to 440 points tall. A tablet on its side and a laptop's window are taller and keep the bars at the bottom. A computer's window made shorter than 500 points also gets the side layout, where bars at the bottom would cover the skull too.

### The design bar opens as a panel at the lower left

At the bottom of the middle the design bar is 83 points tall. It would cover the jaw, and with it open the wheel would have a band of about 110 points for the middles of its buttons. A version that opened the bar at the top or the bottom, away from the selected thing, was tried. With the bar open, a third to two fifths of the spots on the screen still left the wheel no arc, and the bar at the top covered the horn.

The bar opens as a panel 220 points wide at the lower left, in place of the strip, so the middle keeps its full height for the skull and the wheel. At 874 by 339 the panel ends at 282, left of the skull's box at 319. Its settings wrap into rows, four rows for a butterfly's eleven, above the slider. The panel lets what is behind it show through, so the strip is hidden while the panel is open. The wheel's Variation button still steps through the variations.

### The wheel keeps to a room and clear of the controls in it

Before this change the wheel kept 50 points at the top and 230 at the bottom free, measured from the window's edges. Now its room is the safe area, below the 50 points of the status line and the menu button. When the dock, the strip and the design bar stand at the bottom, the room also ends 230 points above the bottom, as before. On a wide, short window the wheel instead keeps clear of the boxes of the strip and the dock, or of the panel and the dock while the panel is open, read from the page.

The safe area comes from an empty element placed with the `env(safe-area-inset-*)` values, whose box the wheel reads. This keeps the buttons out of the island on either side and off the home indicator. Where the insets are 0, as on a computer and on a phone held upright in Safari, the room is the same as before, so the wheel lays out the same.

The wheel tries, as before, all four buttons at their usual places, then all four spread along the longest arc at which a button fits, at reaches from the thing's radius plus 44 up to 180. Two steps follow before the last resort.

- Two arcs. In a band too short for one arc of four, the buttons split between the two longest arcs, two in each, or three and one, whichever keeps the closest pair farthest apart. Kind goes to the button that leaves all four nearest their usual places, so in a short band Kind stands above to the right, Variation below to the right, Design below to the left and Remove above to the left. This step runs only after one arc has failed at every reach, so where one arc worked before it still does.
- The last resort shifts the whole wheel inward, as before. It now shifts to the nearest place at which all four buttons are clear of the controls and inside the room, and in a short room it draws its buttons in to fit between the room's top and bottom. With no controls in the room, as when the bars stand at the bottom, the nearest such place is where the old shift put the wheel.

## Risks / Trade-offs

- In the top corners of a wide, short window, beside the menu button above the strip or the panel and above the dock, the status line, the screen's edge and the dock leave no arc. The wheel shifts there as a whole, to the nearest place clear of the controls, and its buttons stand away from the thing. No part of the skull is there in the front view.
- The strip and the dock no longer sit together. A person learns that the column at the left belongs to the category chosen at the right.
- The panel covers the strip while it is open.
- The horn's tip, at 37 points from the top, reaches 8 points into the status line's box, below its text.
- A short window on a computer, under 500 points, also gets the side layout.

## Resolved Questions

None.

## Open Questions

### 1 - Should the strip and the dock stand on opposite sides, or together at one side?

> Context from the drafting agent, for question 1.
>
> Opposite sides give each thumb one column and keep the skull in the middle without moving the camera. Together at the right, one thumb would reach both, the other hand would only hold the phone, and the camera would need an offset to center the skull in the space left.

<ANSWER_HERE>

### 2 - Should four buttons in one arc also start from the button nearest Kind's usual place?

> Context from the drafting agent, for question 2.
>
> When the buttons split between two arcs, Kind goes to the button nearest the top. When all four fit in one arc, Kind takes the arc's first place counter-clockwise, as `fix-simulator-problems` made it. Below a thing low on the jaw, for example, Kind stands to its lower left and Remove to its lower right. Starting from the button nearest the top would put Kind above the thing more often, but would change where the buttons stand on a phone held upright too.

<ANSWER_HERE>
