## Context

[Issue #42](https://github.com/albion-house/venorn/issues/42) records what codekiln found on a real iPhone. `add-decoration-play` set up the selection, the wheel and the design bar, `fix-simulator-problems` put the wheel's buttons around the thing, and `fix-landscape-layout` stood the bars at the sides of a phone on its side. This change keeps every bar where it stands and changes how a selection is let go and what the design bar holds.

## Goals / Non-Goals

**Goals:**

- A person who has selected a thing can let go of it without being told how, zoomed in or not, and then turn and zoom the camera over the skull.
- Placing several things in a row still takes one tap each.
- Every setting in the design bar can be seen and pressed with a finger, and its value can be read.
- The mouse and the keys work as before.

**Non-Goals:**

- None.

## Decisions

### Four ways to let go

A thumb that wants to move on from a thing does one of a few things: it looks for a button that says so, it flicks the thing away, it taps the thing again, or it taps beside it. Each of these now lets go. The button is there for the person who looks before touching. The other three are near the thing, where the thumb already is.

**Done at the top right.** While a thing is selected, a button labelled Done stands at the top right of the screen, 44 points tall, level with the menu button. Pressing it lets go of the thing and closes the design bar. The bottom of the screen belongs to the dock, the strip and the design bar, upright and on a phone's side, and the wheel's room is between them and the status line. The top right is free in both layouts and is where iOS puts Done. It is a reach for one thumb on a tall phone, so it is not the only way. The status line stops short of it.

**A flick sends the selection away.** codekiln asked for the equivalent of swiping it away. A drag that starts on the selected thing still carries it. A flick is told apart from that drag by how it ends: a person carrying a thing slows down where they aim and lifts a still finger, while a flick lifts a finger that is still going fast. A drag on the selected thing counts as a flick when the finger has gone at least 30 pixels within 300 milliseconds and is going at least 0.6 pixels a millisecond over its last 80 milliseconds. The thing goes back where the finger found it, and the ring slides off in the flick's direction and fades over a quarter of a second, so the person sees what the flick did.

A flick lets go and does not remove. On a phone a swipe often deletes, and a person who flicks to delete and finds the thing still there loses nothing. A thing removed by a flick meant for letting go would be lost, since removing cannot be taken back.

**With the wheel open, a tap lets go.** A tap on the selected thing opens its wheel, as now. A second tap on the thing closes the wheel and lets go. A tap on a bare part of the skull while the wheel is open does the same and places nothing, the way a tap beside a menu on a phone closes the menu and does not act on what is under it. A tap on another thing selects that thing.

Placing does not open the wheel, so after placing, the thing has only its ring, and a tap on the skull places the next thing. A row of things still takes one tap each. A tap on the sky and the Escape key still let go.

**Then the camera.** Only a selected thing takes a drag or a pinch from the camera. Once nothing is selected, one finger turns the camera and two fingers zoom and pan anywhere, over the skull and over the thing just let go. Nothing in the camera changes for this.

Other ways that were weighed:

- A swipe anywhere on the screen. A one-finger drag off the thing turns the camera, so a swipe there cannot also let go.
- A long press. It is hidden, and `add-decoration-play` took a long press away from removing because it went off by accident during drags.
- Letting go as soon as the camera turns. A person who turns the camera to see a thing from the side would lose it.
- A smaller reach for two fingers, so that a pinch away from the thing zooms. Zoomed in, the thing is large, and a pinch on it needs room around it. The person still could not tap anywhere to let go.
- A fifth button on the wheel. The wheel only opens after a tap on the thing, not after placing, and its layout is built for four buttons.

### The design bar in rows

The settings stand in a grid of cells at least 46 points wide and 44 tall, as many to a row as fit: seven upright on a 402-point phone, eight on a computer, four in the panel on a phone's side. A butterfly's eight settings, Mirror, Reset and Close take two rows upright and three rows on its side. Reset and Close end the last row, at its right, so they are in the same place for every thing. Nothing scrolls sideways.

Each setting shows its value under its name: size and depth as a multiple, turn, tilt, fold and color in degrees, lift and bend as a share of the thing's size, wrap as a share of a full wrap, and Mirror as on or off. The chosen setting has a gold edge, and the values change as the slider, a key, a pinch or a twist changes them.

### A slider drawn by the page

Under the grid is a row 44 points tall: a minus button, the slider, and a plus button. The slider is a track with a filled part up to a round thumb 28 points across, and a small mark at the setting's default. A press anywhere along the row takes the slider. A press within 22 points of the thumb carries the thumb from where it is, so a finger that lands near it does not make it jump. A press farther away puts the thumb under the finger and carries it from there. The slider holds on to the finger until it lifts, wherever the finger goes.

The browser's own slider is pressed only where it is drawn, and making it 44 points tall takes separate styling of its thumb and track for each browser engine. A slider drawn by the page answers the same way in every browser, and has room for the mark at the default. It has the slider role, its range, its value and its value as text, for a screen reader.

The minus and plus buttons step the setting by a set amount: 0.05 for size and depth, 5° for turn, 10° for color, 2° for tilt and fold, and 2% for lift, wrap and bend. A step lands on a whole number of steps, so steps from a dragged value come to round values. Holding a button steps again after 0.4 seconds and then every 80 milliseconds.

The slider takes the keyboard when it is clicked or reached with Tab. The arrow keys step it, Page Up and Page Down step it ten times, and Home and End go to the ends. While it has the keyboard the left and right arrows do not choose a variation. Escape still closes the bar, then lets go.

The bar's own Done is now Close. It closes the bar and keeps the thing selected. The new Done at the top right lets go of the thing, and two buttons named Done with different results would be confusing.

### Room for the taller bar

Upright the bar is about 150 points tall, under a fifth of an 874-point screen. Its bottom stays where it was, above the strip, so it grows upward by about 65 points. The wheel kept 230 points at the bottom for the bars. It now also keeps above the open design bar, so its buttons do not stand on the bar.

## Risks / Trade-offs

- Upright, the open design bar reaches up to the bottom of the jaw in the front view. With the 34-point inset at the bottom of a phone, it covers about the lowest 40 points of the jaw. A thing pinned there can be behind the open bar.
- With the wheel open, placing a thing on the skull takes two taps: one to let go and one to place.
- A fast, short drag of the selected thing that ends while the finger is still going fast counts as a flick, and the thing goes back.
- On a phone's side the slider is 104 points wide in the 220-point panel, so the same drag changes the value more there. The minus and plus buttons make the fine changes.
- Done at the top right sits under the status bar if the game is opened from the home screen, where the page reaches the top of the screen. The menu button has the same problem today.

## Resolved Questions

### 1 - May the bars move to make room for a taller design bar?

No. codekiln's brief for #42 keeps the bars where they stand and changes the design bar's contents and the gestures. `fix-landscape-layout` had just placed the bars on a phone's side.

## Open Questions

### 2 - Is the top right the right place for Done?

> Context from the drafting agent, for question 2.
>
> The top right is free in both layouts and is where iOS puts Done, but one thumb on a tall phone reaches it with a stretch. The flick and the taps with the wheel open are near the thumb. Done could instead stand near the ring, which would follow the thing and could cover other things, or replace the status line.

<ANSWER_HERE>

### 3 - Is a flick told apart from a drag at the right speed?

> Context from the drafting agent, for question 3.
>
> A flick is a drag on the selected thing of at least 30 pixels, within 300 milliseconds, going at least 0.6 pixels a millisecond over its last 80 milliseconds. The numbers were checked only with scripted touch in a desktop browser. A slower flick on a real phone would carry the thing in place of letting it go, and a quicker carry would be taken for a flick.

<ANSWER_HERE>

### 4 - With the wheel open, should a tap on the skull let go, or place a thing as before?

> Context from the drafting agent, for question 4.
>
> Letting go is what a menu on a phone does when a person taps beside it, and it is what a person zoomed in on the skull needs. It costs a second tap for a person who opened a wheel and then wants to place a new thing.

<ANSWER_HERE>

### 5 - Upright, should the open design bar take the strip's place, as it does on a phone's side?

> Context from the drafting agent, for question 5.
>
> The bar would then stand about 60 points lower and clear the jaw in the front view. The strip would hide while the bar is open, so choosing a variation would mean closing the bar first. This change keeps the bars where they stand.

<ANSWER_HERE>
