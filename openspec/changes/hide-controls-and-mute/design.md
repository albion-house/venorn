## Context

[Issue #48](https://github.com/albion-house/venorn/issues/48) and [issue #49](https://github.com/albion-house/venorn/issues/49) are codekiln's. `let-go-and-design-by-touch` put Done at the top right and gave the selection a flick, and `fix-landscape-layout` stood the dock and the strip at the sides of a phone on its side. This change leaves the bars where they stand.

## Goals / Non-Goals

**Goals:**

- A person can clear the screen down to the scene with one gesture or two taps, look around it, and get the controls back without being told how.
- Looking at the skull cannot change it.
- The sound can be muted with one tap from anywhere in the game, and stays muted on the next visit.

**Non-Goals:**

- Hiding the ⋯ button. It holds About, the views and Show the controls, and it is small.

## Decisions

### Three ways to hide, five to bring back

**Hide.** The menu item is there for the person who looks for it. On a phone the swipe is the gesture that dismisses things: a finger on the dock or the strip that goes 40 points toward the edge they stand at, and at least twice as far as across, hides them. Upright that is down. On a phone on its side the dock stands at the right and the strip at the left, so it is right on the dock and left on the strip. The strip scrolls sideways when upright and up and down on a phone's side, and the swipe goes the other way, so the two do not meet. A finger that swiped may lift over a button, and the click that follows is dropped. On a computer, H hides.

**While hidden.** The dock and the strip slide 60 points toward their edge and fade over 220 milliseconds, and the status line fades. A selected thing is let go first, so no ring, wheel or design bar is left over the scene. One finger turns the view and two zoom and pan, over the skull and over the things on it. No press selects, carries or draws, and a tap places nothing.

**Bring back.** A tap anywhere on the scene brings the controls back, the way a tap on a photo brings back the bars around it. A 44-point round button with an upward chevron stands where the dock was, at the bottom middle upright and at the lower right on a phone's side, for the person who does not think to tap. The menu's item reads Show the controls while they are hidden. On a computer, H and Escape bring them back. The keys that choose a kind or a variation wait until the controls are back, so the scene stays as it is.

### A mute button at the top right

The button is 40 points round, the size and the panel color of the ⋯ button, at the top right, level with it. It shows a speaker with two waves, and a speaker with a cross when the sound is off. It is a toggle button labelled Mute, pressed when the sound is off. M does the same on a computer.

The top right was Done's, and it is the one free corner in both layouts. The mute button takes the corner and Done stands 48 points to its left while a thing is selected. The status line stops short of both.

The choice is kept in the browser's storage under `venorn:muted`, for every asset set, and it is put back before the sound can start, so a person who muted is not met with sound. A browser that refuses storage forgets it at the end of the visit.

The menu's "Sound" tick box is taken out. Two switches for one sound would have to agree.

## Risks / Trade-offs

- **The swipe is hidden.** Nothing on the screen says the dock can be swiped. The menu item and H are there for that, and the swipe is what a phone user tries.
- **A tap brings the controls back.** A person who taps while looking expecting to place a thing sees the controls come back instead, and the next tap places it.
- **A remembered mute can look like a broken game.** A person who muted last week and forgot may hear nothing. The crossed speaker at the top right says why.
- **Spec order.** `adjust-sound-after-listening` also changes the Living scene requirement. This change's copy of it starts from that one, with the clouds in its scenario, and should be archived after it. `add-decoration-play`'s Menu of views and switches requirement still names "Sound". It is not in the main spec yet, so it is fixed when that change is archived.

## Open Questions

1. Should the controls come back on their own after some time with no touch?
2. Should a phone's shake or a two-finger tap also hide them?
3. Should the mute be remembered, or should every visit start with the sound on as before?
