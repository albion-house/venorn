## 1. Measure

- [x] 1.1 Time the stages one image needs, on stand-ins cut from the painting. Verify: `experiments/single-image-lift/README.md` records a median of 2.54 s per image in a process with its models loaded, 0.38 s with the ground keyed out, and 10 to 31 s for a new process.
- [x] 1.2 Pin models made from single images in the viewer. Verify: with the models added as a sixth category, the dock lists "Described (6)", four described things are pinned to the cheek with `6` and a click each, and a picture read from the canvas shows them.

## 2. Lift one image

- [ ] 2.1 Add the single-image lift to the pipeline: outline the thing with the detector and SAM, cut it out, name the nearest kind, and write the relief model, preview and criteria. Verify: unit tests pass with `mise run check`, and the painted butterfly stand-in comes out as a model whose criteria pass the schema.
- [ ] 2.2 Key out a flat ground when the image's border is one color. Verify: the plain stand-ins take the keyed path and the painted ones the detector path, and a contact sheet of the eight cutouts shows each thing whole and without its ground.
- [ ] 2.3 Add `source.description` to the adjustment schema and write the description into a described thing's criteria. Verify: a unit test validates a described thing's criteria, and `mise //venorn-asset-pipeline:build` still exports the painting's 34 models.

## 3. Lifting process

- [ ] 3.1 Add `mise //venorn-asset-pipeline:serve`, which loads the four models, warms each with a stand-in, reports that it is ready, and lifts each image posted to it on this Mac. Verify: after it reports ready, lifting a painted stand-in takes about 2.5 s and a plain one about 0.4 s, as in the experiment.
- [ ] 3.2 Pass requests under `/lift` from the dev and phone servers to the process. Verify: a request from the page served by `mise //venorn-game-client:dev` returns the model, preview and criteria of a stand-in.

## 4. Viewer

- [ ] 4.1 Add a model returned by `/lift` to the running page and pin it at a spot on the skull. Verify: a script posts a stand-in, pins the result to the cheek, and a picture read from the canvas shows it beside the painting's things.
