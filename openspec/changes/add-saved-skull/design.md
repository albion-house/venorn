## Context

The viewer holds the placed things in a list in `main.ts` and the pen's dabs in one instanced mesh in `pen.ts`. Both are gone when the page closes. The asset pipeline rebuilds the asset set, and on each build it numbers the models of a kind anew: `bead-01` is the best-ranked bead of that build, and the ranking changes when the detector, the number of exemplars or the colors change.

## Goals / Non-Goals

**Goals:**

- A player who closes the page and opens it again finds the skull as they left it.
- No single press loses a decorated skull.
- The game works the same when the browser refuses storage.

**Non-Goals:**

none

## Decisions

### What is saved

The skull is one JSON record in `localStorage` under `venorn:<asset set>:skull`, with `version: 1`. It holds:

- For each thing: the model's id and kind, the painted thing the model was cut from (the source image and the thing's box in it), the point and normal where it is pinned, and every setting: size, turn, lift, tilt, depth, color, wrap, fold, bend and mirror.
- For each stroke: the ink's id, and each spot the pen passed as a point and a normal, with `null` where the pen lifted.

Points are in the structure's model units, so a change to the structure's size in the scene does not move them. They are rounded to five decimals and normals to four.

A stroke is saved as the spots the pointer passed, not as its dabs. Drawing the spots through the pen again lays the same dabs in the same colors, including the rainbow's, and needs fewer numbers: three strokes of 197 dabs were saved as 43 spots. Five things and those three strokes take 3,711 characters, and the 138 things of "Arrange as painted" take 41,270.

The selection, the chosen category and ink, the camera, and the "Painted skull" and "Sound" switches are not saved.

### When it is saved

The skull is saved 400 milliseconds after the last change, so a drag is saved once, when it ends. A change is a thing placed, removed or turned into another model, a thing moved, resized, turned or changed in the design bar, a stroke ended or taken back, and "Clear". A change still waiting is saved when the page is hidden or closed. A bare skull removes the record.

### Finding a saved thing's model

A saved thing is matched by the painted thing it was cut from: among the models of the same kind cut from the same source image, the one whose box overlaps the saved box most, by at least half of the area the two boxes cover together. A saved thing with no source box, such as a model made some other way in the future, is matched by its model's id. A saved thing with no match is left out, and the status line says how many were left out.

The id alone would bring back another painted thing after a build that ranks the models differently. The box changes only if the detector draws it differently. A candy's box moved 3 pixels right and 3 down still overlaps its old box by 0.8.

A restored thing's settings are held to the ranges its criteria allow now. Mirror is kept as saved, because "Arrange as painted" mirrors the far side's things whatever their criteria say.

### Storage that fails

Every read and write is wrapped in try/catch. A read that fails counts as nothing saved. A record that does not parse, or has another version, is ignored. In a record that parses, each thing or stroke that is not whole is left out by itself, and a stroke whose ink the pen no longer has is left out. When a write fails, the game goes on, and the status line says once: "This browser is not keeping the skull, so it will be gone when the page closes". The last skull is held in the page as well as in storage, so "Clear" can be undone in a page that cannot save.

### Starting over

"Clear" keeps the skull it removes as the last skull, under `venorn:<asset set>:last-skull`, and the menu then shows "Bring back the last skull". That button puts the last skull on the structure and keeps the skull it replaces as the last skull, so a second press undoes the first and nothing is lost. "Arrange as painted" keeps the skull it replaces the same way. A bare skull is never kept as the last skull, so pressing "Clear" on a bare skull keeps the last skull there was.

A question before clearing was the other way to prevent an accident. It asks on every clear, it does not cover "Arrange as painted", and a person who answers it by mistake still loses the skull. The kept skull covers both buttons, and it can be brought back after a reload.

### How the scene takes in a restored skull

When the page opens with a saved skull:

- The meadow stands at the growth for the restored number of things from the first frame, so the scene looks as it did when the page closed. It does not grow in from low shoots.
- Restoring lets out no puff of glitter, sets off no burst and sends no rabbit, because none of these is called while a skull is restored.
- The number of things along the spike after a restore becomes the count a new row must beat, so a burst needs one more thing along the spike than were restored.
- The first rabbit is meant to come with the sixth thing on the skull. A restored skull of six or more things counts as past it, so later rabbits come by the usual chance of 0.3 for each thing placed, at least 100 seconds apart. A restored skull of fewer things brings the first rabbit with the sixth thing in all.
- Restored pins keep the slow pulse of an old pin and do not throb as a new pin does for its first four seconds.
- Each restored thing's first note comes at a random moment within its loop, as for things arranged together, so the notes do not all sound at once. The browser allows sound only after the first tap or key press, and the music's level then rises over a few seconds.

"Bring back the last skull" follows the same rules, except for the meadow: it grows or shrinks toward the new number of things over a few seconds, as it does when things are placed or removed.

## Risks / Trade-offs

- A saved thing that is left out is dropped from the record at the next save. An older build opened after a newer one loses the things the older build has no models for, and a record of a later version is overwritten by the first change.
- If the structure's model changes shape between builds, things and strokes keep their saved places and may stand off the new surface or sink into it.
- A browser keeps about 5 MB for a page. A skull covered in slow strokes, with many more spots than dabs, could pass that. The write then fails and the status line says so.
- The saved skull stays in one browser on one device.
- Pictures read from the canvas before and after a reload differ in single glints along the strokes, because the rounded spots move the flecks by a small fraction of their size.

## Resolved Questions

None.

## Open Questions

### 1 - Should a restored skull's meadow grow in from low shoots?

> Context from the drafting agent, for question 1.
>
> The first version stands the meadow at the growth for the restored things from the first frame, so the scene looks as it did when the page closed. Growing it from low shoots over a few seconds would show the scene answering the skull again, and the opening would look nearly bare for a moment.

<ANSWER_HERE>

### 2 - Should a restored skull count as past the first rabbit?

> Context from the drafting agent, for question 2.
>
> The first version says yes when six or more things are restored, so a returning player does not get the first rabbit again on every visit. With no, the first thing placed after each reload of a skull of six or more things would bring a rabbit.

<ANSWER_HERE>

### 3 - Should the game keep more than one skull?

> Context from the drafting agent, for question 3.
>
> The first version saves one skull, and "Clear" keeps one more that the menu can bring back. A row of saved skulls, each shown by a small picture, would let a player start a new skull without putting the old one at risk.

<ANSWER_HERE>
