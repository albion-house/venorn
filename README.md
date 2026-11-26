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

# Build the client and serve it to a phone, over Tailscale or the local network
mise //venorn-game-client:phone

# Lint, test and type-check every project, and validate the OpenSpec changes
mise //:check
```

The pipeline downloads about 3 GB of model weights from Hugging Face the first time it runs.

The `phone` task prints the addresses to open. It serves the built site, so run it again after a change.

## On a phone

A phone on the same local network as this Mac can open the addresses the `phone` task prints under "local network". Some networks keep the devices on them apart, and campus and office networks often do. On such a network the page never loads, and Tailscale is the way through. `albion-house/killbox` reaches its multiplayer server the same way.

Set Tailscale up once:

1. On this Mac, turn Tailscale on from its menu bar icon, or run `tailscale up`.
2. On the phone, install Tailscale from the App Store. Open it, choose "Get Started", accept the prompt to install a VPN configuration, and log in with the same account as this Mac.
3. In the Tailscale app on the phone, check that this Mac is listed and the switch is on.

Then, each time:

1. Run `mise //venorn-game-client:phone`.
2. On the phone, open the address the task prints under "Tailscale".

`tailscale status` on this Mac lists the devices in the tailnet and says which are connected.

## In the viewer

The dock along the bottom holds the five categories (butterflies, candies, pills, jewels and flowers) and a glitter pen. The strip above it holds the variations of the chosen category. A placed thing is selected, and a dashed ring marks it.

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
| Draw with the glitter pen | Press `6` or click the pen in the dock, pick an ink in the strip, and drag on the skull | Tap the pen in the dock, pick an ink, and drag on the skull |
| Take back a stroke | Press `Z`, or click the arrow at the end of the strip | Tap the arrow at the end of the strip |
| Turn the camera | Drag anywhere but the selected thing | Drag with one finger |
| Zoom | Scroll | Pinch |
| Pan | Right-drag or Shift+drag | Drag with two fingers |

The button in the top left corner opens the menu: Front view, Rear view, Arrange as painted, Clear, Painted skull and Sound.

The scene answers the decorating:

- The meadow starts as low shoots and grows to its full height by the time 24 things are on the skull.
- Each thing placed lets out a puff of glitter from the tip of the horn. Three or more things in a row along the horn set off a burst of rainbow glitter, at most once in five minutes.
- A rabbit comes out of the eye socket with the sixth thing, and now and then after that, and bounds away toward the gap in the forest.
- Music fades in as things are placed. Each thing plays a note of its own on a slow loop, higher for a thing higher on the skull, and louder with the camera near it. A thing swells as it sounds, and a line joins it to the thing that sounded before.

## Working on venorn

`STATUS.md` says what is built, what is waiting on a decision and what is not built yet.

Each piece of work starts as an OpenSpec change under `openspec/changes/`. Read `AGENTS.md` before changing the repository.
