## 1. Turning the view with the pen

- [x] 1.1 Put a button that turns the view in the pen's strip, and let a press go to the camera while it is pressed. Verify: in a 375 by 812 touch window with the skull filling the screen, a one-finger drag of 200 pixels across the skull with the button pressed turns the camera 89° and lays no glitter. Before the change, a drag of 160 pixels laid 19 dabs and turned it 0°. With a mouse at 1280 by 800, a drag of 160 pixels turns it 72°. At 375 pixels wide the strip's eight buttons run from 12 to 363 pixels, 39 pixels wide, and at 360 from 12 to 358.
- [x] 1.2 Release the button when an ink or the pen is chosen. Verify: after choosing an ink, the same drag lays 17 dabs and the camera keeps its angle to a tenth of a degree, and with a mouse it lays 89 dabs. Choosing the pen again releases the button.
- [ ] 1.3 Turn the view with one finger on a real phone. Verify: codekiln says it works.

## 2. Color

- [x] 2.1 Weight the color turn by chroma and by darkness next to the thing's typical value. Verify: in pictures read from the canvas of a red butterfly turned 180°, the wings go from hue 1° to 175° and the body stays at 3°, from (47, 3, 1) to (45, 4, 3). Before the change the body went to 173°. A dark green bead turned 120° goes from hue 128° to 254°, near the 263° it reached before the change, and its highlight stays grey, from (143, 145, 134) to (144, 143, 135).

## 3. Rabbit

- [x] 3.1 Draw the rabbit as a lit card that faces the camera. Verify: the rabbit's mean color read from the canvas, as it looks out of the socket, was (235, 217, 190) at midday and at dusk, from the front and from behind. Now it is (234, 211, 179) from the front at midday, (191, 175, 149) from the front at dusk with the sun low behind the skull, and (249, 210, 166) from behind at dusk with the low sun on it. Pictures of it bounding across the meadow show its poses and its tip as before.

## 4. Layers whose ends join

- [x] 4.1 Cut the far layer, the ground layer and the cutout so their ends join, and write `layers/joins.png`. Verify: four new unit tests pass, 50 in all. On the painting, each picture goes from 1086 to 869 pixels wide, and the path runs between columns 0 and 176 of the 217 overlapped for the forest, 0 and 64 for the meadow and 80 and 130 for the cutout. `layers/joins.png` shows three copies of each with no mirror image. Beside a straight cut, which shows as a vertical line where the trees and the flowers stop, the forest's join shows as a soft slanting edge in its lower half.
- [x] 4.2 Mark the joined layers in the manifest and repeat them without mirroring in the viewer. Verify: the manifest marks the forest, the meadow and the cutout `"repeat": "plain"` and leaves the clouds unmarked. Pictures read from the canvas with the camera turned 20° to the right show the forest's tree beside the skull whole, where the old asset set showed it as a mirror image of itself, and the rings of cut paper show no mirrored pair of flowers. With the old asset set the viewer repeats every layer mirrored, as before. The flock still crosses the same gap, at 0.033 across, and calls four times in its first 25 seconds.
