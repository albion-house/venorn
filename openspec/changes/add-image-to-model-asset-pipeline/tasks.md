## 1. Source declaration and fetch

- [x] 1.1 Create the uv project in `venorn-asset-pipeline/` with a `venorn-assets` command. Verify: `uv run venorn-assets --help` lists the stages.
- [x] 1.2 Declare the painting in `sources/veneration-ornamentation/source.toml` with its URL, checksum, structure and kinds. Verify: the unit test that loads the source passes.
- [x] 1.3 Add the fetch stage, which downloads the image and refuses a checksum mismatch. Verify: `mise //venorn-asset-pipeline:fetch` saves the image into `.cache/`.

## 2. Catalog

- [x] 2.1 Detect the structure in the whole image and outline it. Verify: `catalog/structure-mask.png` covers the skull and horn.
- [x] 2.2 Detect the kinds in overlapping tiles, outline each one, and keep each thing once. Verify: unit tests cover the tiling and the long-axis angle.
- [x] 2.3 Name each crop with the classifier and drop the ones it is unsure of. Verify: `catalog/overlay.png` labels candies as candy and capsules as capsule.
- [x] 2.4 Write `catalog.json` with each instance's kind, box, outline, position, size and angle. Verify: the file lists instances of all five kinds.

## 3. Isolate

- [x] 3.1 Choose each kind's exemplars: well-identified instances that differ in color. Verify: `isolated/sheet.png` shows exemplars of different colors within a kind.
- [x] 3.2 Cut out each exemplar, enlarged, with a smooth outline. Verify: `isolated/sheet.png`.
- [x] 3.3 Clear the things from the structure and fill the gaps to make the bare cutout. Verify: a unit test fills a vivid mark on plain bone, and `isolated/skull.png` shows bare bone.

## 4. Lift and adjustment criteria

- [x] 4.1 Build a textured mesh from a cutout and a height map, with the model conventions in `design.md`. Verify: unit tests check the unit size, the origin, the facing and the GLB export.
- [x] 4.2 Estimate height for small things and for the structure with the relief backend. Verify: the models show depth in the viewer.
- [x] 4.3 Write `schemas/adjustment.schema.json` and produce criteria from role defaults, kind overrides and measurements. Verify: unit tests cover both roles, overrides and a failing record.
- [x] 4.4 Write a GLB and a criteria file for each exemplar, and a GLB of the bare structure. Verify: `mise //venorn-asset-pipeline:lift` reports each model.

## 5. Export and tasks

- [x] 5.1 Export the asset set with a manifest and the arrangement into the game client. Verify: `mise //venorn-asset-pipeline:export` writes `manifest.json` and validates every criteria file.
- [x] 5.2 Add a mise file task for each stage, for `build`, and for `lint`, `test` and `check`. Verify: `mise tasks --all` lists them and `mise //venorn-asset-pipeline:check` passes.
- [x] 5.3 Run every stage from a clean state. Verify: `mise //venorn-asset-pipeline:build` exports the asset set after the cache and the build directory are deleted.

## 6. Viewer

- [x] 6.1 Set up `venorn-game-client/` with Vite, TypeScript and three.js, and tasks for `install`, `dev`, `check` and `build`. Verify: `mise //venorn-game-client:build` writes `dist/`.
- [x] 6.2 Load the manifest, show the bare structure, and limit the camera's turn. Verify: the bare skull appears in the browser and a drag turns it a few degrees.
- [x] 6.3 Pin the chosen model with a tap, with a pin sound and a throbbing pin head. Verify: tapping the skull in the browser pins the chosen model.
- [x] 6.4 Build the adjustment controls from the selected thing's criteria. Verify: a pinned candy and a printed flower show the controls their criteria allow.
- [x] 6.5 Project printed things onto the surface and arrange the skull as painted. Verify: "Arrange as painted" places one thing per arrangement entry.
- [ ] 6.6 Try the viewer on a phone: pin, adjust and turn the camera by touch. At phone width in a desktop browser the tray and pinning work, and the adjustment panel covers the lower half of the skull. Verify: each works on a real phone over the local network, with the skull visible while adjusting.

## 7. Review

- [ ] 7.1 Look through `catalog/overlay.png`, `isolated/sheet.png` and the viewer with codekiln, and note which kinds and exemplars to change.
- [ ] 7.2 Answer the open questions in `design.md`.
