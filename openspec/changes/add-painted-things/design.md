## Context

See `proposal.md` for what codekiln asked for.

The pipeline already has a `printed` role: a model that wraps onto the surface, has no pin, and can bend. Since the flowers became pinned, no kind used it. The viewer's code for it is unchanged.

The painted plants were never in the catalog. The detector finds flower heads and not the stems they grow on.

## Goals / Non-Goals

**Goals:**

- The painted plants are found without a detector prompt for each one.
- A flower at the end of a painted stem is part of the plant.
- On the skull the stems look painted on and the flowers stand out.

**Non-Goals:**

- Painting on the skull with a brush.
- Joining the pieces of one long vine into a single plant.

## Decisions

### Found by paint

On the skull the stems and leaves are a saturated yellow-green, with hues from 44 to 170 degrees. The bone is paler and its hue sits just below that range, and the bone's own shadows are orange. A painted kind declares its hue range, and the finder takes the bright, saturated pixels of the skull in that range.

Other colored parts with no outline of their own, such as lavender buds, join the paint they touch. The finder leaves out a margin of 8 pixels inside the skull's outline, where the colors behind the skull bleed in, and it leaves out dark pixels, so the meadow seen through the nose opening is not paint.

Each connected patch with enough paint is one painted thing. The leaves' pale middles are taken in by closing the outline.

### Carried things

A painted kind names the kinds it carries. The sprig carries flowers. A flower joins paint that comes within 9 pixels of it, which covers the gap that the flower's soft edge leaves. A flower with most of its outline inside a sprig leaves the catalog, so "Arrange as painted" does not place it twice.

Candies, capsules, beads and butterflies are kept out of every sprig, with a margin of 3 pixels around each.

### Flat paint, raised flowers

The relief backend already swells each part as far as it is wide, so a thin stem rises little and a round flower rises a lot. For a painted kind, the pixels in the paint's hue also give up three quarters of their height. On a jaw sprig enlarged to size 1.6, the flowers stand 0.079 world units off the bone and the stems 0.004.

A painted model has no back, since it lies on the surface.

### Sizes

Pinned kinds take the median size of their instances, since one candy is much like another. Painted things differ: the painting's longest painted plant is 150 pixels long and its shortest 48. Each painted model keeps its own size.

## Risks / Trade-offs

- The finder depends on the paint's color. → Another painting needs its own hue range, and paint close to the structure's own hue cannot be found this way.
- The long vine on the jaw comes out as separate sprigs, because its stems have gaps. → Each piece still places where the painting has it.
- The dried flower heads of the yarrow near the eye are close to the bone's color and are not picked up.
- Fourteen flowers that were pinned things are now parts of sprigs. → The tray still has four pinned flowers.

## Resolved Questions

None yet.

## Open Questions

None.
