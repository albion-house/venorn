## 1. Turning the view with the pen

- [x] 1.1 Put a button that turns the view in the pen's strip, and let a press go to the camera while it is pressed. Verify: in a 375 by 812 touch window with the skull filling the screen, a one-finger drag of 200 pixels across the skull with the button pressed turns the camera 89° and lays no glitter. Before the change, a drag of 160 pixels laid 19 dabs and turned it 0°. With a mouse at 1280 by 800, a drag of 160 pixels turns it 72°. At 375 pixels wide the strip's eight buttons run from 12 to 363 pixels, 39 pixels wide, and at 360 from 12 to 358.
- [x] 1.2 Release the button when an ink or the pen is chosen. Verify: after choosing an ink, the same drag lays 17 dabs and the camera keeps its angle to a tenth of a degree, and with a mouse it lays 89 dabs. Choosing the pen again releases the button.
- [ ] 1.3 Turn the view with one finger on a real phone. Verify: codekiln says it works.

## 2. Color

- [x] 2.1 Weight the color turn by chroma and by darkness next to the thing's typical value. Verify: in pictures read from the canvas of a red butterfly turned 180°, the wings go from hue 1° to 175° and the body stays at 3°, from (47, 3, 1) to (45, 4, 3). Before the change the body went to 173°. A dark green bead turned 120° goes from hue 128° to 254°, near the 263° it reached before the change, and its highlight stays grey, from (143, 145, 134) to (144, 143, 135).

## 3. Rabbit

- [x] 3.1 Draw the rabbit as a lit card that faces the camera. Verify: the rabbit's mean color read from the canvas, as it looks out of the socket, was (235, 217, 190) at midday and at dusk, from the front and from behind. Now it is (234, 211, 179) from the front at midday, (191, 175, 149) from the front at dusk with the sun low behind the skull, and (249, 210, 166) from behind at dusk with the low sun on it. Pictures of it bounding across the meadow show its poses and its tip as before.

## 4. Layers whose ends join

- [ ] 4.1 Cut the far layer, the ground layer and the cutout so their ends join, and write `layers/joins.png`. Verify: unit tests, and a look at `layers/joins.png`.
- [ ] 4.2 Mark the joined layers in the manifest and repeat them without mirroring in the viewer. Verify: pictures read from the canvas beside the painting's edges show no mirror image in the forest or the meadow.
