## 1. More models in five categories

- [x] 1.1 Declare more exemplars of each kind. Verify: the export holds 34 models: 3 butterflies, 6 candies, 6 capsules, 6 beads, 6 flowers and 7 sprigs.
- [x] 1.2 Let a source group its kinds into categories, and write them to the manifest. Verify: a unit test loads the painting's five categories in order, and `manifest.json` lists them.
- [x] 1.3 Add a hue range to every model's criteria. Verify: a unit test checks the range for both roles, and every exported criteria file validates.

## 2. Controls

- [x] 2.1 Replace the tray with the dock and the strip, and move the views and switches into a menu. Verify: the page opens with nothing on the skull, five dock buttons and three butterflies in the strip.
- [x] 2.2 Select a placed thing, mark it with a ring, and make the dock and strip follow it. Verify: after a tap in the middle of the skull one thing is placed and selected, with a ring and no wheel.
- [x] 2.3 Change a selected thing's category and variation in place. Verify: pressing `3` turns a selected `butterfly-01` into `capsule-01` with one thing on the skull, and the right arrow turns it into `capsule-02`.
- [x] 2.4 Move, resize and turn the selected thing by drag, scroll, pinch, twist and keys. Verify: a scroll of 200 raises the scale from 1 to 1.49, a Shift+scroll of 120 turns it 30 degrees, a drag of 120 by 60 pixels moves it 0.42 world units over the surface, and the camera stays at its place through all three. Two fingers spread from 40 to 63 pixels raise the scale by 1.58 and their 18 degree twist turns it 18 degrees.
- [x] 2.5 Open a wheel on a tapped thing with Kind, Variation, Design and Remove. Verify: the four buttons sit 78 pixels above, right of, below and left of the thing, Kind turns a capsule into `bead-01` and Variation turns that into `bead-02`.
- [x] 2.6 Show the design as a bar of chips with one slider, and add the color adjustment. Verify: a jewel's bar lists Size, Turn, Color, Lift, Tilt, Depth, Wrap and Mirror, and the color slider at 120 turns the thing's tint by 2.1 radians.
- [x] 2.7 Remove a thing by right click, by the wheel and by the Delete key. Verify: each removes one thing, and Escape closes the design bar and then clears the selection.

## 3. On a phone-sized screen

- [x] 3.1 Check the controls in a window 375 pixels wide. Verify: the dock, the strip, the wheel and the design bar are all in view around a selected butterfly, and the skull is not covered.
- [ ] 3.2 Try the game on a real phone: place, move, pinch, twist, open the wheel and the design bar, and turn the camera. Verify: each works on a phone over the local network.

## 4. Carried over

- [ ] 4.1 Look through `catalog/overlay.png`, `isolated/sheet.png`, `layers/check.png` and `layers/plants.png` with codekiln, and note which kinds, exemplars and layer rules to change.
- [ ] 4.2 Answer the open questions in `design.md`.
