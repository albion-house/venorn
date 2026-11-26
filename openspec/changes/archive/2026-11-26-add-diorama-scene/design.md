## Context

See `proposal.md` for what codekiln asked for after trying the first viewer.

The first pipeline raised each cutout into a relief with no back, which only held up from the front. A free camera needs models that look right from every side, and a scene that surrounds the skull.

The work stays on this Mac, an M2 Pro with 16 GB of memory, with no API key.

## Goals / Non-Goals

**Goals:**

- The skull and the pinned things are closed models that can be seen from any side.
- Pinned things read as solid objects standing off the skull.
- The camera turns freely, comes in close and pans.
- The painting's meadow, clouds, forest and sky surround the skull, and from the front they line up as they do in the painting.

**Non-Goals:**

- Models made by a generative image-to-3D model. Open question 1 covers what running one on this Mac needs.
- Cutouts redrawn at higher resolution before they are lifted.
- Plants with depth of their own. Each plant is a flat cutout.

## Decisions

### Closed models by swelling

Each part of a cutout swells as far as it is wide. For every pixel the pipeline finds the largest disc that fits inside the outline and covers the pixel, and gives the pixel the height of a circle of that radius. A capsule comes out with a round cross-section, a candy's twisted ends stay thin, and the horn becomes a cone.

A kind's `thickness` caps the swelling as a fraction of the thing's shorter side, so a butterfly stays a thin plate. A depth estimate still shapes the front. The back mirrors the front's outline with no depth detail, and carries the same painted texture.

A kind's model rests its back on the plane z = 0, so a standoff lifts the whole thing off the surface.

### A mirrored far side for the skull

The painting shows the skull from one side. A skull is close to symmetric, so the far side mirrors the near side across the skull's middle plane. The depth estimate sets how far each part stands out from that plane, and the swelling rule caps it, so thin parts such as the horn and the jaw stay round.

Seen from the top the skull is narrower than a real skull. A generative model would give a truer shape.

### Things that come off the skull

A pinned thing's default standoff rose from 0.04 to 0.12 of its own size, the pin's stem shows in the gap, and the sun casts each thing's shadow onto the skull. A butterfly's criteria carry a fold, which lifts both ends of its long axis so the wings rise from the body. Every thing's criteria carry a depth range, which multiplies the model's thickness.

Flowers are a pinned kind now. Their wrap range runs up to 1, so a player can still press one onto the bone, and their depth can drop until the flower is nearly flat.

### Finding the layers

The `layers` stage works on the image with the skull, the cataloged things and a 16-pixel margin around them left out.

- The ground is outlined by SAM inside a box that starts a little above the skull's lowest point. Flower heads that rise above that outline are added to it.
- The far layer is every background pixel in the hue range the source declares, which is green for the forest.
- The backdrop shows wherever the rest of the background is flat. The pipeline measures local contrast, and the sky is flat where the clouds are textured. One color per row, taken from the flat pixels, gives the gradient down to the horizon.
- The floating layer is the textured background that is mostly blue.

A first version told clouds from sky by color distance to the row's sky color. The sky is lighter beside the horn than elsewhere in its row, so flat patches of sky landed in the cloud layer. Local contrast separates them cleanly.

### The far layer carries on behind things

The forest is hidden by the clouds, the skull and the meadow. Without filling, the forest layer would show a skull-shaped hole as soon as the camera moves. Behind a cloud, the forest fills the gaps between its own masses. Behind the skull and the meadow, it fills everything under its top edge, and where the horn hides that edge the edge is drawn straight across. The filled areas take a blend of the forest colors around them.

### A diorama of rings

Each layer's picture is wrapped around the scene on a cylinder and repeated, with every second copy mirrored so the copies join. One copy faces the front view at the size and place it has in the painting, so the front view reproduces the painting.

- The clouds and the forest stand at the distances the source declares, 6.5 and 8.5 skull lengths.
- The sky is a dome painted with the backdrop's gradient.
- The meadow is described under "A meadow of cut paper".

The clouds' ring turns once in 25 minutes. A sun circles the sky once in 10 minutes and the scene's light follows it.

### Clouds that slither

codekiln asked for organic changes in the clouds, so they slither differently from one another. The cloud picture is read through a slow, smooth flow field. Each part of the sky is pulled its own way by up to 4% of the picture's width, and a finer, quicker field adds a small wobble. The field joins up with itself around the ring. After the ring has turned by two copies of the picture, a tenth of the sky's pixels differ from the last time.

The image cuts some clouds off at its top edge. They fade out there.

### Birds through the gap

The pipeline records the forest's top edge in the manifest. The viewer finds its deepest dip, which is the pink valley between the two tree masses, once for each copy of the forest around the ring. A flock of six birds flies just behind the forest, level with the lower part of the dip, so it shows only while it crosses the gap. Each flock crosses the gap nearest to where the camera is looking, in 13 seconds, and the next sets out 22 to 52 seconds later. The first sets out five seconds after the page opens.

A flock calls four times as it crosses. A call is two or three short falling notes with a faint echo, placed left or right by where the flock is in the view.

### Wind you can hear

The wind is one loop of noise heard through three filters: a low rush, the breath of moving air, and leaves. The meadow's gust strength sets all three, so the sound rises as the plants lean. A browser allows sound only after a tap, a click or a key press, so the wind starts with the first one. "Sound" switches every sound off and on.

### Both sides of the skull

"Rear view" looks straight at the far side. "Arrange as painted" pins each thing on the near side and its mirror image on the far side, flipped and turned the other way.

### A meadow of cut paper

codekiln asked for grass like layers of paper models: flowers that come out of the ground, soft dandelions, ornate cut shapes like laser-cut paper, a gentle wind, and a thicket that runs to the horizon and blurs.

The painted meadow is bright plants on a dark green base. The pipeline removes the base by its color, which leaves the leaves, stems and flowers as an ornate cutout. Each stem that reaches the bottom of the image is a root. A root's number spreads along the cutout until it meets the next plant, so everything joined to a stem becomes one plant. A flower head is kept whole: where two plants meet inside one, the head goes to the plant that holds most of it. The painting gives ten plants.

In the viewer each plant is a flat card that stands on its root. Near the skull the plants stand in crossed pairs, about seven hundred of them out to 1.9 skull lengths, and single plants thin out to 3.6 skull lengths. Plants right beside the skull are less than half size, so the teeth and jaw stay in view. Each card curls and leans by an amount taken from where it stands.

Behind the thicket, the whole meadow is wrapped around the scene in rings: two rings of the cutout near the skull, then rings of the painted meadow, each larger than the one before, out to the cloud layer. The ground is flat under the skull and falls 0.11 for every unit beyond that, so from the front view the far rings show as a band under the forest.

One shader draws all of it. The wind pushes each card's top by the square of its height, in gusts that travel across the meadow. Paper far from the skull is read from a blurrier copy of its picture and mixed toward the horizon's color. A pale rim on one side of every cut edge and a shaded rim on the other make the cards read as paper. Edges are softened by letting the picture's transparency thin each pixel's coverage, which needs no sorting. A card closer than about one unit to the camera thins out.

### A free camera

The camera turns without limit around the skull and from straight above down to 6 degrees below level, where the ground would get in the way. It zooms toward the point under the pointer, down to 0.12 skull lengths from its target. It pans with a right drag, a shift drag, two fingers or the arrow keys, and the point it looks at stays within 0.8 skull lengths of the skull's middle. It stays inside the cloud ring.

### Removal gestures

A right click that does not move removes the thing under it, and a right click that moves pans. A finger held still on a thing for 550 milliseconds removes it. Both play a short sound. The Remove button in the adjustment panel stays.

A thing that the skull hides from the camera cannot be selected or removed through the skull.

## Risks / Trade-offs

- The back of every model repeats the front's painting. → This suits candies, capsules, beads and butterflies. A thing with a distinct back needs a generative model.
- The filled parts of the forest are soft, and the drifting clouds uncover them. → A generative fill would paint real foliage there.
- The thicket is about 1,700 cards drawn in ten batches. → It has not been timed on a phone.
- The rule that cuts the meadow from its base assumes a dark green base. → Another painting may need another rule.
- The layer rules assume a blue floating layer and a far layer of one hue range. → Another painting may need other rules.
- A phone is untested. The gestures were checked with scripted mouse and touch events in a desktop browser.
- Nobody has listened to the wind or the bird calls. They were checked by counting the calls and by the page raising no errors.

## Resolved Questions

### 1 - Will you get access to the DINOv3 weights on Hugging Face, so TRELLIS.2 can run on this Mac?

codekiln asked for access on 2026-11-26. Meta reviews each request by hand, and this one is waiting for that review. Once it is approved, codekiln logs in on this Mac with `hf auth login`, and TRELLIS.2 runs on the bare skull first. [Run TRELLIS.2 on this Mac to make the skull's model · Issue #5](https://github.com/albion-house/venorn/issues/5) tracks the steps and describes the port.

## Open Questions

Questions 2 (where generated models are stored) and 3 (whether the game stays on three.js used directly) are carried into the `add-decoration-play` change, unanswered.
