## 1. Wheel

- [x] 1.1 Stand the wheel's buttons around the selected thing, clear of its ring, and gather them on the side that has room near an edge. Verify: in a 402 by 874 touch window, a butterfly with a ring 16 pixels in radius was placed at four spots low on the skull and at its sides. Before the change a button overlapped its ring at all four, by 7 to 46 pixels, and at two of them the button covered the thing's middle. After it, every button stands at least 31 pixels outside the ring, whole on the screen above the bottom 230 pixels, and at least 8 pixels from the next. A pinch up and down on the thing at the bottom of the skull, with the wheel open, left its size at 1 before the change and took it to 2.5 after. Laid out for rings of 16, 40 and 80 pixels at every 8 pixels across a 402 by 874 and a 1280 by 800 window, no button covers a ring or leaves its room.

## 2. Pen

- [x] 2.1 Take back a stroke when a second finger comes down within 500 milliseconds of the first and before it has gone 20 pixels, and save the skull again. Verify: in a 402 by 874 touch window with the pen chosen, a second finger 80 milliseconds after the first, spread to zoom, took the camera from 17.8 to 3.9 units away. Before the change it left 1 stroke of 1 dab, which was saved. After it, there is no stroke and nothing is saved. A zoom begun 200 milliseconds after a stroke: the save fell due while the dab was down and held 2 strokes, and after the zoom the saved skull holds 1. A stroke that went 60 pixels before the second finger keeps its 39 dabs, one held still for 0.7 seconds keeps its dab, and a one-finger stroke lays 66 dabs and leaves the camera still.

## 3. Status line

- [x] 3.1 Put the status line back to the chosen category's hint when the selected thing is let go. Verify: on a 402 by 874 touch window, a tap on the sky after placing a butterfly left "Drag it to move it, pinch to resize, twist to turn. Tap it for more" before the change, and gives "Butterflies: tap the skull to place one" after it. On a 1280 by 800 window, Escape after placing a jewel gives "Jewels: click the skull to place one". Remove on the wheel still says "Removed", and choosing the pen gives the pen's hint.

## 4. Sky

- [x] 4.1 Carry the cloud ring on above the picture's top. Verify: in a 402 by 874 touch window, one finger turned the camera 82° and tilted it 6° below level. The top 328 of the picture's 1748 rows were the bare sky color before the change, and none are after it. In five views set by script, turned up to 150° and tilted up to 6° below level, the bare rows at the top went from 28 to 361 before the change to none after it. On a 1280 by 800 window, no pixel of the front view or of a view turned 150° at level differs from before by more than 24 in any channel. Views tilted up differ only in their top 105 and 213 rows, which were bare sky.

## 5. Landscape

- [x] 5.1 Keep the menu button, the menu and the status line inside the safe area at the left and the right. Verify: in an 874 by 402 touch window with insets of 62 at the left and right and 20 at the bottom, faked through the browser's `Emulation.setSafeAreaInsetsOverride`, the menu button and the menu go from 10 to 62 pixels from the left, and the status line from 60 to 112, ending 62 from the right edge in place of 10. With an inset at only one side, only that side moves. A 402 by 874 window with insets of 62 at the top and 34 at the bottom, and a 1280 by 800 window, keep the button at 10 and the status line at 60.

## 6. Simulator and phone

- [ ] 6.1 Try the five fixes in the iPhone 17 simulator, upright and on its side, and on a real phone. Verify: codekiln says they work.
