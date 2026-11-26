## 1. Named places on the structure

- [x] 1.1 Let a source declare features of its structure, and find them on the bare structure with the detector. Verify: unit tests load the painting's socket and horn, place a hollow in the middle of its box and run a spike from the structure to its far end.
- [x] 1.2 Write the features to the manifest in model units. Verify: `manifest.json` lists `socket` at (0.094, -0.114) with radius 0.06 and `horn` from a base at (-0.047, -0.014) to a tip at (-0.387, 0.500).

## 2. Growing meadow

- [x] 2.1 Grow the plants from their roots and raise the rings out of the ground by one growth value, and sway further with it. Verify: pictures read from the canvas show low shoots at the start and a full thicket with 15 things placed.
- [x] 2.2 Follow the number of things on the structure. Verify: after 4 things and 14 seconds the lushness is 0.17, and after 15 things it is 0.62.

## 3. Surprises

- [x] 3.1 Let out a puff of glitter from the spike's tip for each thing placed. Verify: five things placed leave about 100 flecks in the air.
- [x] 3.2 Set off a burst of rainbow glitter when three things lie along the spike. Verify: the third jewel placed along the horn starts a burst and the status line reads "3 in a row on the horn", the fourth starts none, and 1.5 seconds into the burst more than 700 flecks are in the air.
- [x] 3.3 Send a rabbit out of the hollow with the sixth thing, toward the nearest gap in the far layer. Verify: pictures read from the canvas show the rabbit in the socket, in front of the jaw and at the skull's end, and five seconds later it is 8.5 world units behind the skull.

## 4. Music

- [ ] 4.1 Fade in ambient music with the number of things placed, with a note from each thing in turn.
- [ ] 4.2 Play each thing's note from where it sits, louder when the camera is near.
- [ ] 4.3 Pulse a thing as it sounds and join it to the next thing by a line.
- [ ] 4.4 Listen with codekiln and adjust. Verify: codekiln says the music and the surprises are right for now.
