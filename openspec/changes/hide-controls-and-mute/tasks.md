## 1. Hiding the controls

- [x] 1.1 Hide the dock, the strip and the status line from the menu, a swipe toward their edge or H, letting go of a selected thing, and show a button where the dock was. Verify: in the iPhone 17 simulator, 402 by 874, Safari, a swipe of 50 points down that starts on the pill in the dock hid all three, showed the chevron button at the bottom middle, and left Butterflies chosen. The menu's Hide the controls did the same. With a placed butterfly selected, a swipe of 57 points down on the strip's second variation hid them, took away the ring and Done, and left the butterfly red and where it was. On its side, 874 by 402, the button stands at the lower right where the dock was, and a swipe of 68 points right on the dock hid them.
- [x] 1.2 While hidden, let one finger turn the camera and two zoom, and place nothing. Verify: in the simulator, with Butterflies chosen, a drag of 110 points across the skull turned the view and placed nothing, and a pinch from 58 to 258 points apart zoomed in until the skull filled the screen. The ⋯ button and the mute button stayed.
- [x] 1.3 Bring the controls back on a tap on the scene, the chevron button, the menu's item, H or Escape. Verify: in the simulator a tap on the skull brought them back and placed nothing, and the status line read the hint for Butterflies. The chevron button brought them back upright and on its side. In a desktop browser, H hid them and the menu item read Show the controls, 1 changed nothing while hidden, and Escape brought them back.

## 2. Mute button

- [x] 2.1 Put a mute button at the top right, move Done beside it and take "Sound" out of the menu. Verify: in the simulator the button stands level with the ⋯ button and shows a crossed speaker once pressed. With a thing selected, Done stands to its left, and the status line wraps short of Done. The menu lists About, Front view, Rear view, Hide the controls, Arrange as painted, Clear, Painted skull and Add to Home Screen.
- [x] 2.2 Keep the choice for the next visit, and put it back before the sound can start. Verify: after a reload in the simulator the button showed the crossed speaker behind the About screen and after Start. In a desktop browser M muted and set `venorn:muted` to 1, and M again turned the sound on and removed it.

## 3. Checks

- [x] 3.1 Run `mise run check` and `mise //venorn-game-client:build`. Verify: both pass.
- [ ] 3.2 Try the change on a real phone. Verify: codekiln says hiding the controls and the mute button work with a finger.
