## Context

[Issue #29](https://github.com/albion-house/venorn/issues/29) lists rough edges found while building. This change takes four of them: the camera with the pen on a phone, the color setting, the rabbit's light, and the mirrored copies of the forest and the meadow. The rest of the issue stays open: the far side of the skull, the opening ground, saving a skull, the size of the built script and the frame rate.

## Goals / Non-Goals

**Goals:**

- One finger can always turn the camera, whatever is chosen in the dock.
- Turning a thing's color changes what a person sees as its color, and leaves its dark markings and its white and grey parts alone.
- The rabbit belongs to the scene's light.
- Where copies of the forest and the meadow meet, nothing shows a mirror image.

**Non-Goals:**

- Joining the clouds at their ends. [Issue #26](https://github.com/albion-house/venorn/issues/26) is changing the cloud layers.

## Decisions

### A button in the strip turns the view

With the pen chosen, the strip holds the inks, a button with circling arrows that turns the view, and the arrow that takes back a stroke. While the button is pressed, a press anywhere goes to the camera, so one finger turns it and two fingers zoom and pan. Choosing an ink, choosing the pen again or leaving the pen releases the button. While the button is pressed it is marked in place of the ink.

The pen's strip now holds eight buttons, which at 46 pixels each do not fit a phone's width. A strip with buttons after its variations lets them shrink to as little as 38 pixels, so on a 360-pixel screen none is scrolled out of sight. The categories of things keep their size.

Holding a finger still before dragging was the other way considered. The diorama's first version removed a thing when a finger was held on it, and `add-decoration-play` removed that because it was hard to discover and went off by accident while a thing was being dragged. A held finger at the start of a stroke would turn the camera by accident in the same way.

### Color turns by how colored a part is

The color setting still turns each color about the grey axis, which keeps its lightness. The turned color is mixed with the original by a weight that is the product of two parts:

- Greyness: the weight falls from 1 to 0 as the color's chroma, its largest channel less its smallest in sRGB, falls from 0.16 to 0.06.
- Darkness: the weight falls from 1 to 0 as the color's largest channel falls from 0.8 to 0.55 of the thing's typical value.

A thing's typical value is the median of the largest channel over the opaque pixels of its texture whose chroma is above 0.16. The viewer works it out once for each model when it first places one. A measure that is the same for every thing would not do: a red butterfly's body has the same value and chroma as a dark green bead, and only the bead should turn.

### The rabbit is a lit card

The rabbit was a sprite, which three.js draws without light. It is now a flat card that faces the camera each frame, drawn with the same lit material as the paper plants: it takes the sun and the sky, receives shadows, and shows 0.3 of its own color in shade so it never goes dull. It keeps its pictures, its poses and its path.

### The pipeline joins a layer's ends

A layer is cut to 80% of its width. The 20% at its right end is laid over its start, and a path from the top of the picture to the bottom chooses, row by row, where the right end gives way to the start. The path is the one along which the two ends differ least, in color and in transparency, and it moves at most one pixel sideways from one row to the next. The two are blended across four pixels on either side of it. Each copy around the ring then carries on into the next without a mirror.

The far layer's skyline is measured on the cut picture, so the gaps the birds cross are still found. The front copy stands where the painting has the picture's first 80%, so the front view still lines up with the painting except near its two edges.

Each joined layer is marked `"repeat": "plain"` in the manifest. The viewer repeats a marked layer with plain wrapping and any number of copies, and an unmarked one with mirrored wrapping and an even number of copies, as before. An asset set built before this change carries no marks and looks as it did.

This was done in the pipeline because the pipeline makes the layer pictures and writes check pictures of them, and the viewer then only chooses how to repeat a picture.

## Risks / Trade-offs

- Each copy of the forest and the meadow is a fifth narrower, so there are more copies around the scene: 15 of the forest in place of 12. They repeat without mirroring, which is harder to see.
- Where the two ends of a picture differ everywhere along the path, the join shows as a soft seam a few pixels wide.
- A color between dark and bright is partly turned, which mixes it toward grey.
- The rabbit is darker with the sun behind it, as the plants are.

## Resolved Questions

None.

## Open Questions

### 1 - Should the clouds join at their ends the same way?

> Context from the drafting agent, for question 1.
>
> The clouds still repeat mirrored. [Issue #26](https://github.com/albion-house/venorn/issues/26) is changing the cloud layers, so this change left them alone. The layers stage can join any layer by adding it to the list it cuts.

<ANSWER_HERE>

### 2 - Is a button in the strip the right way to turn the view with the pen?

> Context from the drafting agent, for question 2.
>
> The button needs a tap before turning and a tap on an ink after. Holding a finger still before dragging was set aside for the reason under "A button in the strip turns the view". Neither has been tried on a real phone.

<ANSWER_HERE>
