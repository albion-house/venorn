## Context

The pipeline's stages were written for one painting that holds many things. The catalog stage runs the detector over overlapping tiles of the whole painting, the isolate stage paints every thing out of the skull, and each run rebuilds all 34 models and the scene layers. A described thing is one image of one thing, and the player is waiting for it.

The experiment in `experiments/single-image-lift/` ran stand-ins cut from the painting through the stages one image needs and timed each stage. Its `README.md` has the numbers and a picture of described things pinned in the viewer.

## Goals / Non-Goals

**Goals:**

- A described thing is pinned within a few seconds of its image arriving.
- A described thing is the same kind of asset as the painting's things: a GLB model, a preview and adjustment criteria. The viewer places and adjusts it with the controls it already has.
- The lift runs on the Mac with the open-weights models the build already uses.

**Non-Goals:**

none

## Decisions

### One image takes a short path through the stages

The lift runs these steps on an image and its description:

1. Outline the thing. Grounding DINO looks for the description in the whole image and the best box is kept, then SAM outlines the thing in the box. The largest piece of the outline is kept and its holes are filled.
2. Cut it out with the crop, enlargement to 384 pixels and soft edge that the isolate stage gives each thing.
3. Name the nearest of the painting's five pinned kinds with SigLIP.
4. Make the model with the relief backend: a depth estimate, the height maps and the textured mesh.
5. Write the GLB, the preview and the criteria, and check the criteria against the schema.

The fetch and layers stages are skipped, and so are the parts of the catalog and isolate stages that serve the whole painting. In a process that has its models loaded, the steps take a median of 2.54 seconds, of which the detector takes 1.35 and SAM 0.74. Grounding DINO runs on the CPU because the Apple GPU backend lacks some of its operators.

### A plain ground is keyed out

When the image's border is one flat color, the lift reads that color from the border and takes every pixel far from it as part of the thing. The detector and SAM are skipped, and the lift takes 0.38 seconds. An image with any other background takes the detector path.

Giving SAM a box the size of the frame is not a way to skip the detector: on a plain stand-in it outlined the whole ground.

### The nearest kind lends size, thickness and criteria

The kind SigLIP names gives the described thing its thickness and criteria from `source.toml`, such as a butterfly's fold, and its natural size from that kind's first model. The player resizes and adjusts it afterwards within those ranges. Open question 5 asks whether a described thing should borrow these from the nearest kind.

### A process on the Mac keeps the models loaded

A new process for each image took 10 to 31 seconds, most of it spent importing PyTorch, loading the models and making the first call to each model. A task, `mise //venorn-asset-pipeline:serve`, starts a process that loads the four models, sends one stand-in through to warm each of them, and then reports that it is ready. It listens on this Mac only. Each request carries an image and its description, and the answer carries the model, the preview and the criteria.

The dev and phone servers pass requests under `/lift` to the process, so the page reaches it at the address it was loaded from, on the Mac and on a phone.

### A described thing's criteria record its description

The criteria's `source` names the image file and gives the thing's box and angle in it, as for a thing from the painting. `source.instance` holds the described thing's id, and a new `source.description` holds the words the player typed or spoke. Described models are written under `venorn-asset-pipeline/build/described/`.

### The viewer adds a model while it runs

The viewer loads the asset set once at start. It gains a way to add a model it receives from `/lift`, with its criteria and preview, and pin it at the spot the player pressed. The experiment did this by adding the models to the exported manifest before the page loaded, and the viewer placed and adjusted them like any other thing.

## Risks / Trade-offs

- Keying was tried only on plain stand-ins made from the catalog's outlines, so it recovers those outlines by construction. A generated image may have a shadow or a gradient behind the thing, and the shadow would become part of the model.
- The stand-ins are things from the painting, and the classifier named the right kind for each of them. A thing unlike the five kinds still gets one of their sizes and criteria.
- The relief backend swells the cutout and mirrors its front onto its back, as it does for the painting's things.
- The process holds about 3.4 GB of memory on a 16 GB Mac that also runs the browser.
- A site published on GitHub Pages has no process to reach, so described things work only from the Mac's dev and phone servers.
- Described things last until the page closes, like every placed thing. [Rough edges in the scene and the models · Issue #29](https://github.com/albion-house/venorn/issues/29) lists saving a decorated skull.

## Resolved Questions

### 1 - Can the pipeline turn one new image into a pinnable model with adjustment criteria in a few seconds?

Yes, in a process that keeps its models loaded. On this Mac it took a median of 2.54 seconds per image with the detector and SAM, and 0.38 seconds when the ground was keyed out. A new process for each image took 10 to 31 seconds. The experiment in `experiments/single-image-lift/` used things cut from the painting and called no image generator.

## Open Questions

### 2 - How does a described thing join the five categories in the dock?

> Context from the drafting agent, for question 2.
>
> In the experiment the described things became a sixth category, "Described", on the key `6`, and the glitter pen's key became `7`. With such a category chosen, a press on the skull could open the text box at that spot, and the strip could hold the things described so far.
>
> The classifier also names the nearest of the five kinds for each described thing, so a described butterfly could join Butterflies instead. A press would then need another way to open the text box.

<ANSWER_HERE>

### 3 - How should voice input work?

> Context from the drafting agent, for question 3.
>
> On a phone, the keyboard that opens for a text box offers dictation, so a text box gives voice input there with no more work.
>
> Chrome and Safari offer speech recognition to a page. It was not tried, and what each browser sends off the device was not checked.
>
> The Hugging Face cache on this Mac holds MLX copies of Whisper large-v3 and large-v3-turbo. The lifting process could transcribe with them, but the pipeline has no package that runs them, and that was not tried.

<ANSWER_HERE>

### 4 - Where does the image come from?

> Context from the drafting agent, for question 4.
>
> Issue #27 names ChatGPT driven through Claude in Chrome, a generative model on the Mac first, and a hosted service when the Mac is not enough. It also says the game runs on codekiln's machine with their own API key.
>
> Claude in Chrome drives a browser on the Mac, so the game would hand the description to an agent and receive an image file back. How long ChatGPT takes to make an image was not measured.
>
> The Hugging Face cache on this Mac holds no text-to-image model. The TRELLIS.2 weights there make 3D models from an image.
>
> Whichever source makes the image, asking it for one thing on a flat plain ground lets the lift key the ground out, in 0.4 seconds where the detector path takes 2.5. The request would also ask for the painting's style.

<ANSWER_HERE>

### 5 - Should a described thing take its size, thickness and criteria from the nearest of the five kinds?

> Context from the drafting agent, for question 5.
>
> The experiment does this, and each stand-in got the right kind, with the classifier at 0.82 to 1.0. A thing unlike all five, such as a key or a shell, would still get the size and criteria of one of them. The player could set the size afterwards with the resize the viewer already has, or the description could carry a size word.

<ANSWER_HERE>

### 6 - Should described things keep the relief backend if TRELLIS.2 makes the skull?

> Context from the drafting agent, for question 6.
>
> The relief backend makes a described thing's model in about 0.2 seconds: the depth estimate, the height maps and the mesh. The README of the TRELLIS.2 port in [Run TRELLIS.2 on this Mac to make the skull's model · Issue #5](https://github.com/albion-house/venorn/issues/5) reports 21 minutes for one textured generation on a 16 GB M2 Pro, the chip in this Mac.

<ANSWER_HERE>
