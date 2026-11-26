## Context

See `proposal.md` for why the pipeline comes before the scene and the pinning.

The source painting is 1086 by 1536 pixels. The skull and horn fill most of it, and about seventy small things sit on them. The small things measure between 12 and 115 pixels on their longer side.

The game is seen from the front. The camera turns a few degrees and the far side of the skull is never visible, so a model needs a convincing front and some depth.

The pipeline was developed and run on an Apple M2 Pro with 16 GB of memory and no API keys.

## Goals / Non-Goals

**Goals:**

- One command turns a declared image into models, adjustment criteria and a manifest.
- Each stage leaves files a person can look at, so a wrong result can be traced to the stage that produced it.
- The way a cutout becomes a model can be swapped, so a generative image-to-3D model can be added beside the first backend.
- The adjustment criteria carry what the game needs to place a model and to limit how a player changes it.

**Non-Goals:**

- Environment layers: the meadow, clouds, forest and sky as separate models with the areas behind the skull filled in.
- A new pinnable thing made from a typed or spoken description.
- Models that hold up when seen from the side or from behind.
- The game published on GitHub Pages.

## Decisions

### Stages that read and write files

The pipeline runs five stages in order: fetch, catalog, isolate, lift and export. Each stage reads what the stage before it wrote under `build/<source>/` and writes its own directory there. A stage can be rerun alone after a change to `source.toml`, and each stage writes a picture for a person to check: `catalog/overlay.png` shows what was found and `isolated/sheet.png` shows the cutouts.

Every stage is a mise file task in `venorn-asset-pipeline/mise-tasks/`, and `build` runs all of them. A full run on the painting takes about a minute once the model weights are downloaded.

### The source declaration

`sources/<name>/source.toml` names the image by URL and SHA-256 checksum, so the painting stays out of git and a changed image is noticed. It names the structure and lists the kinds of things to find. Each kind has a detector prompt, a description for the classifier, a role, a number of exemplars to turn into models, and a relief thickness.

A kind's role is `pinned` or `printed`. A pinned thing is solid and held on with a pin, such as a candy. A printed thing is a flat motif that follows the surface, such as the flowers that look printed onto the bone.

### Finding things: detect, outline, then name

Grounding DINO looks for the kinds' prompts in overlapping 448-pixel tiles, which enlarges the small things for the detector. SAM outlines the thing in each box. SigLIP 2 then names each crop by comparing it with the kinds' descriptions.

The naming step exists because the detector found the things reliably and named them poorly. In the first run it labeled the wrapped candies as flowers and the capsules as candy. The classifier sorted the same crops into the right kinds.

A thing seen in two tiles or under two prompts is kept once. A thing the classifier is less than 60% sure of is left out of the catalog.

### The bare structure

The game opens on a bare skull, and the painting shows a decorated one. The isolate stage clears every cataloged instance from the skull, along with every pixel whose color is far from the bone's own color, which catches stems, pins and things the detector missed. It fills the cleared areas with color blended in from the bone around them.

The cleared share of the skull is 48%. The fill is smooth, so the filled bone has no cracks or grain.

### Lifting backends, starting with relief

A lifting backend takes a cutout with transparency and returns a mesh. The first backend, `relief`, keeps the painted pixels as the texture on the model's front and raises them into a shallow shape. The height blends a depth estimate from Depth Anything V2 with a rounded profile that swells from the outline toward the middle. The texture's alpha channel draws the outline, so the edge stays as smooth as the cutout.

Relief suits the front view. The front of each model is the painting itself, and the depth gives real shading and parallax when the camera turns.

Relief is reconstruction from a depth estimate. It is the part of the pipeline that a generative image-to-3D model would replace or join. Open question 1 covers that choice.

### Model conventions

A model's longer side is one unit. Its anchor, the point that meets the structure, is the origin. +x is right, +y is up and +z faces the viewer. The game multiplies by the model's natural size to get its size on the structure.

### Adjustment criteria

Each model of a kind has a `<id>.adjust.json` file. Its values come from three places: defaults for the kind's role, overrides the kind declares in `source.toml`, and measurements from the painting.

- `size.natural` is the kind's median size in the painting as a fraction of the structure's longer side.
- `attach` says whether a pin holds the model above the surface or the model lies in the surface, and how far it may stand off.
- `adjust` gives a default, minimum and maximum for scale, spin, tilt and conform, says whether the model may bend along a cubic Bezier curve, and says whether it may be mirrored.

`schemas/adjustment.schema.json` describes every field, and the lift and export stages validate each file against it.

### Manifest and arrangement

The export stage copies one source's models, criteria and previews into `venorn-game-client/public/assets/<source>/` with a `manifest.json`. The manifest also records the arrangement: where each cataloged instance sits on the structure, its size and its angle. With the arrangement the game can rebuild the painting from the models.

### Models that run on this machine

The default pipeline uses four open-weights models from Hugging Face. All four are Apache-2.0 licensed and download without an account.

| Step | Model |
| --- | --- |
| Detect | [IDEA-Research/grounding-dino-base](https://huggingface.co/IDEA-Research/grounding-dino-base) |
| Outline | [facebook/sam-vit-base](https://huggingface.co/facebook/sam-vit-base) |
| Name | [google/siglip2-base-patch16-224](https://huggingface.co/google/siglip2-base-patch16-224) |
| Depth | [depth-anything/Depth-Anything-V2-Small-hf](https://huggingface.co/depth-anything/Depth-Anything-V2-Small-hf) |

### The viewer

The viewer is the first page of `venorn-game-client/`, written in TypeScript with three.js. It loads a manifest, shows the bare structure and puts the models in a tray. A tap pins the chosen model. The viewer reads the model's criteria to place it and to build the adjustment controls.

A printed thing is projected onto the structure from the front, so it keeps its shape as the painting shows it while every vertex rests on the surface. three-mesh-bvh makes the many surface lookups fast enough to run while a slider moves.

## Risks / Trade-offs

- The models are reliefs with no back. → The camera's turn limit keeps the back out of view. Turning the skull all the way around needs full 3D models.
- The small things are enlarged four to ten times from the painting, so their textures are soft up close. → Open question 2 asks about redrawing them at higher resolution.
- An outline can be wrong. In this run the purple thistle's outline covers only its fringe, and one bead exemplar is a flower with a bead-like center. → `catalog/overlay.png` and `isolated/sheet.png` show these to a person. Excluding an instance by hand is not supported yet.
- The bare skull still shows faint traces: a dried flower head near the eye socket and some pin specks. → A generative fill would remove them and restore bone texture.
- The color rule that clears the skull assumes a pale structure with colorful things on it. → A different painting may need a different rule.
- The kinds and their prompts in `source.toml` are written by a person looking at the image. → A vision model could draft them.

## Resolved Questions

None yet.

## Open Questions

### 1 - Which generative model should turn cutouts into full 3D models, and where should it run?

> Context from the drafting agent, for question 1.
>
> The relief backend reconstructs depth. A generative image-to-3D model would produce a complete shape, including the sides and back.
>
> On this 16 GB M2 Pro, [lyonsno/trellis2mlx](https://github.com/lyonsno/trellis2mlx) reports a full TRELLIS.2 generation in 21 minutes with 6.75 GB of peak memory. The thirteen small models would take about four and a half hours. That repository is new and has a single maintainer. [shivampkumar/trellis-mac](https://github.com/shivampkumar/trellis-mac), a second port, recommends 24 GB of memory.
>
> [TripoSR](https://github.com/VAST-AI-Research/TripoSR) is MIT licensed and runs in seconds, with coarser results. It is not published as a package, so using it means keeping a copy of its source.
>
> A hosted service runs TRELLIS.2 or Hunyuan3D in under a minute per model and needs an API key and payment.
>
> My recommendation: add a hosted backend for the pinned kinds once you have chosen a service, and keep relief for the printed kinds and the structure.

<ANSWER_HERE>

### 2 - Which image model should redraw cutouts at higher resolution and draw new things from a description?

> Context from the drafting agent, for question 2.
>
> The same model could do both jobs: sharpen a 40-pixel cutout into a clean picture before it is lifted, and draw a new thing in the painting's style from the player's typed or spoken words. The plan runs this on your machine with your API key.

<ANSWER_HERE>

### 3 - Where should generated models be stored?

> Context from the drafting agent, for question 3.
>
> Git ignores the exported asset sets today, so a clone runs the pipeline to get them. One export of the painting is 10 MB. GitHub Pages can only serve files that are in the deployed site, so publishing needs the models in git, in git LFS, or copied in by the deploy workflow from storage outside the repository.

<ANSWER_HERE>

### 4 - Should the game stay on three.js used directly?

> Context from the drafting agent, for question 4.
>
> The viewer uses three.js with no framework. React Three Fiber would fit a React interface, and Babylon.js is the main alternative engine. The models are standard GLB files and load in any of them.

<ANSWER_HERE>
