## 1. Saving and restoring

- [x] 1.1 Save each thing's model, painted source, spot and settings, and each stroke's ink and spots, 400 milliseconds after a change and when the page is hidden or closed. Verify: five things and three strokes of 197 dabs are saved as 43 spots and one lift in 3,711 characters 700 milliseconds after the last change, and two things placed just before the page closed, when nothing had been saved yet, are both there when it opens again.
- [x] 1.2 Put the saved skull back when the page opens. Verify: after a reload the five things have the same models and settings, one resized to 1.26 and turned 30 degrees and another turned 120.6 degrees in color and mirrored, and the strokes lay the same 197 dabs. Pictures read from the canvas before and after the reload differ in 149 of 1,024,000 pixels from the front: 125 are a bird whose flight depends on the frames drawn earlier, 23 are single glints along the strokes, and 1 is in the meadow. From the rear they differ in none. A bare skull's picture differs from the decorated one's in 75,096 pixels from the front and 57,965 from the rear.
- [x] 1.3 Find a saved thing's model by its painted source's box. Verify: a saved candy whose id is gone and whose box is 3 pixels off comes back as `candy-03`; a saved `candy-01` whose box lies elsewhere in the painting, and a saved dragon, are left out, and the status line says "without 2 things"; a bead saved with no source comes back by its id; a saved size of 99, turn of 500 and color of -999 come back as 2.5, 180 and -180.

## 2. Storage that fails

- [x] 2.1 Wrap every read and write in try/catch. Verify: with `localStorage` throwing a SecurityError, and again with `setItem` throwing a QuotaExceededError, the page opens with no error, two things are placed, cleared and brought back, the status line says "This browser is not keeping the skull, so it will be gone when the page closes" after the first save and not after the second, and a reload opens a bare skull.
- [x] 2.2 Ignore damaged records and damaged entries. Verify: a record of "{not json" and a record of version 2 each open a bare skull with no error, and the first thing placed then writes a whole record of version 1; a record of four things, two of them damaged, and three strokes, one with a damaged spot and one with an unknown ink, brings back two things and one stroke of 50 dabs.

## 3. Starting over

- [x] 3.1 Keep the skull that "Clear" removes, and bring it back from the menu. Verify: after "Clear" the saved skull is gone and the last skull holds 5 things and 3 strokes; after a reload the skull is bare, its picture differs from a bare skull's in 1 pixel, and the menu shows "Bring back the last skull"; pressing it brings back 5 things and 197 dabs, and its picture differs from the one before "Clear" in 148 pixels.
- [x] 3.2 Swap the two skulls, and keep the skull that "Arrange as painted" replaces. Verify: with a skull of 6 things cleared and 2 new things placed, the first press brings back 6 things and keeps the 2 as the last skull, and the second press brings back the 2 and keeps the 6; "Arrange as painted" over the 2 places 138 things and keeps the 2.
- [x] 3.3 Check a phone-sized window. Verify: at 375 by 812 pixels the menu's seven controls run from 58 to 341 pixels down, and the status line "Your skull is back. Clear, in the menu, starts a new one" fits between 60 and 365 pixels across.

## 4. The scene and a restored skull

- [x] 4.1 Stand the meadow at its growth and set nothing off. Verify: with 8 things restored, 3 of them along the horn, the lushness is 0.333 on the first frame, and on the first frame and 10 seconds later there are 0 flecks, no burst and no rabbit.
- [x] 4.2 Count the restored row and the first rabbit. Verify: after that restore, with chance held at 0.99, a ninth thing off the horn lets out 23 flecks and no burst, and a tenth on the horn sets off a burst with "4 in a row on the horn", and no rabbit comes; with 3 things restored, the rabbit comes with the sixth thing in all.
- [x] 4.3 Spread out the restored things' first notes. Verify: with ten things restored and sound started by a tap on the sky, one run's first note came 1.1 seconds later, and its 11 notes of the first 20 seconds came at 1.1, 3.2, 4.1, 5.3, 5.7, 11.8, 12.3, 15.0, 17.2, 17.6 and 19.3 seconds, no more than two in any one second.
- [ ] 4.4 Reload the game on a real phone, and clear and bring back a skull there. Verify: codekiln says it works.
