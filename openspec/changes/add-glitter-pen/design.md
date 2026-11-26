## Context

The dock, the strip and the gestures were built for placing things. The pen is the first tool that is not a thing, and it uses the same dock and strip: the pen is chosen like a category, and its inks are chosen like variations.

## Goals / Non-Goals

**Goals:**

- Drawing feels direct: the stroke appears under the pointer, on the surface.
- The pen is chosen and its ink changed with the controls the player already knows.
- The camera can still be moved while the pen is chosen.

**Non-Goals:**

none

## Decisions

### Strokes are dabs laid on the surface

A stroke is a row of small discs, each laid on the structure where the pointer's ray meets it and turned to face along the surface's normal. A disc is 0.011 structure lengths in radius, sits 0.004 off the surface, and discs are spaced 0.4 radii apart. Between two pointer positions the discs are placed along a straight line and each is put back on the surface with a ray, because a straight line cuts across a curved surface.

Painting into the skull's texture was the alternative. The model's far side repeats the near side's texture, so paint on one side would appear on both. Discs on the surface avoid that, work on any side, and can be taken back one stroke at a time.

All discs are instances of one mesh, with room for 12,000. A stroke across the whole skull takes about 230.

### Glitter is made in the fragment shader

Each point of a disc belongs to a fleck, found by dividing space into small cells. Two layers of cells, turned different ways and of different sizes, keep the flecks from lining up in rows. A fleck has its own tilt and brightness. It glints when its tilt reflects the sun toward the camera, and now and then it twinkles by itself. Flecks thin out toward the rim of a disc, which gives a stroke a ragged edge.

The rainbow ink sets each disc's hue from how far the pen has travelled in the stroke, going once through the colors every 0.6 structure lengths.

### The pen in the dock

The pen is a category in the dock whose choices are inks and which carries a button of its own, for taking back a stroke. Choosing the pen clears the selection. Selecting a thing shows that thing's category, which puts the pen away.

The wheel's Kind button steps through the categories of things and passes over the pen.

### Drawing and the camera

With the pen chosen, a press on the structure starts a stroke and the camera's turning is switched off until the press ends. The camera keeps receiving the pointers, so a second finger still zooms and pans, and it ends the stroke. A press off the structure turns the camera as usual.

If the pointer leaves the structure during a stroke, the pen lifts and comes down again where the pointer returns. Two pointer positions more than 0.12 structure lengths apart are not joined.

## Risks / Trade-offs

- With the pen chosen and the skull filling a phone's screen, one finger cannot turn the camera. Two fingers still zoom and pan, and choosing a category brings turning back.
- A press on a placed thing draws under it while the pen is chosen.
- Strokes do not count toward the scene's lushness or the music.
- The pen has one width.

## Resolved Questions

None.

## Open Questions

### 1 - Should the pen have more than one width, and other kinds of paint?

> Context from the drafting agent, for question 1.
>
> The first version has one width and one kind of ink, glitter, in six colors. The premise also mentions painting on the skull more generally.

<ANSWER_HERE>
