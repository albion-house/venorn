# venorn

A calm browser game about adorning a skull in a meadow. The player pins candies, capsules, butterflies, beads and flowers to a unicorn skull, building a small shrine.

The game takes its look from the Fawnicorn painting [Veneration Ornamentation](https://fawnicorn.com/assets/art/veneration-ornamentation.jpg): a decorated skull lying in a flowering meadow, with a forest and curling clouds behind it.

## Layout

| Directory | What it holds |
| --- | --- |
| `venorn-asset-pipeline/` | Python pipeline that turns a source image into 3D models, each with adjustment criteria, and into the layers of the scene around them |
| `venorn-game-client/` | TypeScript and three.js web client. Its build output is the future GitHub Pages site |
| `openspec/` | Specs, and the change proposals that precede each piece of work |

## Setting up

Install [mise](https://mise.jdx.dev/), then from the repository root:

```sh
mise trust
mise install --monorepo
```

## Tasks

List every task with `mise tasks --all`.

```sh
# Turn the source image into models, adjustment criteria and scene layers
mise //venorn-asset-pipeline:build

# Open the scene in a browser and pin things to the skull
mise //venorn-game-client:dev

# Build the client and serve it to a phone on the same network
mise //venorn-game-client:phone

# Lint, test and type-check every project, and validate the OpenSpec changes
mise //:check
```

The pipeline downloads about 3 GB of model weights from Hugging Face the first time it runs.

The `phone` task prints the addresses to open. It serves the built site, so run it again after a change. Any device on the same network can open the page while the task runs.

## In the viewer

| To | With a mouse | With touch |
| --- | --- | --- |
| Pin a thing | Choose it in the tray, then click the skull | Choose it in the tray, then tap the skull |
| Adjust a thing | Click it, then use the panel | Tap it, then use the panel |
| Remove a thing | Right-click it | Press and hold it |
| Turn the camera | Drag | Drag with one finger |
| Zoom | Scroll | Pinch |
| Pan | Right-drag, shift-drag or the arrow keys | Drag with two fingers |

## Working on venorn

Each piece of work starts as an OpenSpec change under `openspec/changes/`. Read `AGENTS.md` before changing the repository.
