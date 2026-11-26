## 1. Closed models

- [x] 1.1 Give each part of a cutout a round cross-section from the largest disc that fits it. Verify: a unit test checks a wide disc with a thin bar.
- [x] 1.2 Build closed meshes with a mirrored back, resting on the anchor plane. Verify: unit tests check the doubled mesh, the back's facing and the rest position.
- [x] 1.3 Make the skull a closed model with a mirrored far side. Verify: the skull shows a far side when the camera is behind it.
- [x] 1.4 Add depth to every kind's criteria and fold to the butterfly's, and let a kind override how it attaches. Verify: unit tests cover depth, fold and an attachment override, and the schema validates the exported files.

## 2. Scene layers

- [x] 2.1 Declare the scene's four layers in `source.toml`. Verify: a unit test loads the scene.
- [x] 2.2 Outline the ground, pick the far layer by hue, find the flat backdrop and sort the textured background. Verify: unit tests cover the flat sky, the fitted gradient and a floating patch, and `layers/check.png` shows the painting split.
- [x] 2.3 Carry the far layer on behind the clouds, the skull and the meadow. Verify: a unit test fills behind a structure, and `layers/check.png` shows a forest with no hole.
- [x] 2.4 Export the layers into the manifest and add the `layers` task. Verify: `mise //venorn-asset-pipeline:build` writes the scene into `manifest.json`.

## 3. Camera and gestures

- [x] 3.1 Free the camera's turn, zoom toward the pointer, and pan. Verify: scripted wheel and key events zoom from 9 to 1.4 world units and move the target, and the turn has no sideways limit.
- [x] 3.2 Remove a thing with a right click or a held finger, and keep a right drag for panning. Verify: a right click and a held touch each remove one thing, and a right drag removes none.
- [x] 3.3 Place, wrap and fold things on any side of the skull, with depth and fold controls. Verify: a candy pins to the far side facing away from the skull, a fully wrapped flower sits within 0.006 world units of the surface everywhere, and the lowest depth makes a flower a tenth as thick.

## 4. Scene in the viewer

- [x] 4.1 Wrap the layers around the scene, paint the sky dome and shape the ground. Verify: the front view matches the painting, and the scene surrounds the skull from the back and from above.
- [x] 4.2 Cast shadows from a sun that circles the sky, drift the clouds, fly birds behind the forest and add the wind sound. Verify: after a scripted minute the cloud ring has turned and the sun has moved.

## 5. Paper meadow

- [x] 5.1 Cut the meadow free of its dark base and split it into plants by their roots, keeping each flower head whole. Verify: unit tests cover the cutout, the roots and a shared flower head, and `layers/plants.png` shows ten plants.
- [x] 5.2 Export the cutout and the plants in the manifest. Verify: `manifest.json` lists the cutout and each plant with its size and root.
- [x] 5.3 Stand the plants in a thicket around the skull and wrap rings of cut paper out to the horizon. Verify: pictures read from the canvas show the skull in the thicket from the front, the side and above, with the teeth and jaw in view from the front.
- [x] 5.4 Sway the paper in a wind, soften and fade it with distance, and give cut edges a pale rim. Verify: between two moments 1.3 seconds apart, 39% of the pixels in the meadow change and 0.6% of the pixels above it do.

## 6. Scene life and views

- [x] 6.1 Add "Rear view", and pin each thing's mirror image on the far side in "Arrange as painted". Verify: the rear view puts the camera at the front view's distance behind the skull, and the arrangement pins 144 things.
- [x] 6.2 Flow the cloud picture so the clouds slither. Verify: with the ring's drift cancelled, 10.6% of the sky's pixels differ between two moments.
- [x] 6.3 Record the forest's top edge in the manifest and fly a flock through its dip now and then, with calls. Verify: a unit test covers the top edge, the birds show only in the gap in a picture read from the canvas, one crossing makes four calls, and three flocks cross in two minutes.
- [x] 6.4 Rebuild the wind from three bands of noise that follow the meadow's gusts, start it with the first tap, and put every sound behind one "Sound" switch. Verify: the switch is on by default and toggles, and the page raises no errors.
- [ ] 6.5 Listen to the wind and the bird calls and adjust them. Verify: codekiln says they sound right.

## 7. Carried over from the first change

- [ ] 7.1 Try the viewer on a phone: pin, adjust, remove, turn, zoom and pan by touch. Verify: each works on a real phone over the local network, with the skull visible while adjusting.
- [ ] 7.2 Look through `catalog/overlay.png`, `isolated/sheet.png`, `layers/check.png` and `layers/plants.png` with codekiln, and note which kinds, exemplars and layer rules to change.
- [ ] 7.3 Answer the open questions in `design.md`.
