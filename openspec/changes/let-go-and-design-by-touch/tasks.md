## 1. Letting go

- [ ] 1.1 Show Done at the top right while a thing is selected, and let go when it is pressed. Verify: in a 402 by 874 touch window zoomed in until the skull fills the screen, Done lets go of a butterfly just placed, and the status line keeps clear of it.
- [ ] 1.2 With the wheel open, let go on a tap on the selected thing or on a bare part of the skull, and place nothing. Verify: in the same window, both taps let go and the count of things stays the same. Three taps on bare spots place three things.
- [ ] 1.3 Let go on a flick that starts on the selected thing, put the thing back, and slide the ring off. Verify: a quick flick lets go and leaves the thing where it was, and a slow drag carries it and keeps it selected.
- [ ] 1.4 Check the camera after letting go. Verify: after each of Done, the flick and the two taps, one finger dragged from where the thing is turns the camera, and a pinch over it zooms the camera, with the thing's place and size unchanged.

## 2. Design bar

- [ ] 2.1 Lay the settings out in a grid of cells at least 46 by 44, each with its value under its name, with Reset and Close at the end of the last row. Verify: on a butterfly at 402 by 874, at 874 by 339 with the insets of a phone on its side, and at 1280 by 800, every control is at least 44 by 44 and in view, and nothing scrolls sideways.
- [ ] 2.2 Replace the browser's slider with one drawn by the page, 44 tall, with a minus and a plus button that step the setting and repeat when held. Verify: a touch drag of the thumb a third of the way along changes the size by about a third of its range, a press beside the track takes the slider, plus steps to the next whole 0.05, and on the computer a mouse drag, the arrow keys and Escape work.
- [ ] 2.3 Keep the wheel above the open design bar. Verify: with the bar open upright, no wheel button overlaps it.

## 3. Checks

- [ ] 3.1 Run `mise run check` and `mise //venorn-game-client:build`. Verify: both pass.
- [ ] 3.2 Try the change on a real phone. Verify: codekiln says letting go and the design bar work with a finger.
