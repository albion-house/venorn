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

The dock along the bottom holds the five categories: butterflies, candies, pills, jewels and flowers. The strip above it holds the variations of the chosen category. A placed thing is selected, and a dashed ring marks it.

| To | With a mouse and keys | With touch |
| --- | --- | --- |
| Choose a category | Click it in the dock, or press `1` to `5` | Tap it in the dock |
| Choose a variation | Click it in the strip, or press the left or right arrow | Tap it in the strip |
| Place a thing | Click the skull | Tap the skull |
| Select a thing and open its wheel | Click it | Tap it |
| Move the selected thing | Drag it | Drag it |
| Resize the selected thing | Scroll over it, or press the up or down arrow | Pinch it |
| Turn the selected thing | Shift+scroll over it, or press `[` or `]` | Twist it with two fingers |
| Change the selected thing's kind or variation | Choose a category or a variation, or press Kind or Variation on the wheel | The same |
| Change its color, lift, tilt, depth, wrap, fold or bend | Press Design on the wheel | The same |
| Remove a thing | Right-click it, press Delete, or press Remove on the wheel | Press Remove on the wheel |
| Clear the selection | Click the sky, or press Escape | Tap the sky |
| Turn the camera | Drag anywhere but the selected thing | Drag with one finger |
| Zoom | Scroll | Pinch |
| Pan | Right-drag or Shift+drag | Drag with two fingers |

The button in the top left corner opens the menu: Front view, Rear view, Arrange as painted, Clear, Painted skull and Sound.

The scene answers the decorating:

- The meadow starts as low shoots and grows to its full height by the time 24 things are on the skull.
- Each thing placed lets out a puff of glitter from the tip of the horn. Three or more things in a row along the horn set off a burst of rainbow glitter, at most once in five minutes.
- A rabbit comes out of the eye socket with the sixth thing, and now and then after that, and bounds away toward the gap in the forest.

## Working on venorn

Each piece of work starts as an OpenSpec change under `openspec/changes/`. Read `AGENTS.md` before changing the repository.
