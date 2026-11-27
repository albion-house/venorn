# venorn

A calm browser game about adorning a skull in a meadow. The player pins candies, capsules, butterflies, beads and flowers to a unicorn skull, building a small shrine.

Play it at https://albion-house.github.io/venorn/.

The game takes its look from the Fawnicorn painting [Veneration, Ornamentation](https://fawnicorn.com/personal-art/veneration-ornamentation/): a decorated skull lying in a flowering meadow, with a forest and curling clouds behind it.

## Layout

| Directory | What it holds |
| --- | --- |
| `venorn-asset-pipeline/` | Python pipeline that turns a source image into 3D models, each with adjustment criteria, into the layers of the scene around them, and into a smaller copy of the image for the About screen |
| `venorn-game-client/` | TypeScript and three.js web client. Its build output is the GitHub Pages site |
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

# Download the asset set the published site is built with, in place of running the pipeline
mise //venorn-game-client:fetch-assets

# Open the scene in a browser and pin things to the skull
mise //venorn-game-client:dev

# Build the client and serve it to a phone, over Tailscale or the local network
mise //venorn-game-client:phone

# Make the app icons and iPhone launch screens from the painting
mise //venorn-asset-pipeline:app-images

# Lint, test and type-check every project, and validate the OpenSpec changes
mise //:check
```

The pipeline downloads about 3 GB of model weights from Hugging Face the first time it runs. To play or work on the client without it, run `fetch-assets` instead.

## Publishing

`.github/workflows/pages.yml` builds the client on every push to `main` that touches it and publishes it at https://albion-house.github.io/venorn/. A pull request that touches the client gets a build, without the deploy.

Git ignores the asset set, so the workflow downloads it from a GitHub release. `VENORN_ASSETS_TAG` and `VENORN_ASSETS_SHA256` in `venorn-game-client/mise.toml` name the release and the file's checksum. After the pipeline exports a new asset set:

1. Run `mise //venorn-game-client:publish-assets`. It attaches the set to a new release and rewrites those two lines.
2. Commit `venorn-game-client/mise.toml` and merge it to `main`. The push publishes the site with the new set.

A checkout that already has an asset set keeps it when `mise.toml` names a new one. `mise //venorn-game-client:fetch-assets --force` replaces it.

The site has a web app manifest, so it can be added to a home screen or the Dock as an app. Its icons and iPhone launch screens are cut from the painting by `mise //venorn-asset-pipeline:app-images` and kept in git under `venorn-game-client/public/app/`.

A service worker, `venorn-game-client/public/sw.js`, keeps the asset set on the device after the first visit and lets the game open offline. It keeps the set under the release tag and a checksum of the files, so a browser downloads the set again after `publish-assets` and the merge, and after the pipeline exports a changed set into a local build. The page itself comes from the network when there is one, so a new build shows on the next visit. The dev server registers no service worker.

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

The game opens on the About screen: the painting, its title, "by Fawnicorn", a link to the painting's page and, in small type, the commit and asset set the site was built from. Pressing Start or Escape closes it, and About in the menu opens it again.

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
| Turn the camera with the pen chosen | Click the circling arrows in the strip and drag. Click an ink to draw again | Tap the circling arrows in the strip and drag with one finger. Tap an ink to draw again |
| Turn the camera | Drag anywhere but the selected thing | Drag with one finger |
| Zoom | Scroll | Pinch |
| Pan | Right-drag or Shift+drag | Drag with two fingers |
| Hide the controls to look at the skull | Press `H`, or Hide the controls in the menu. Press `H` or Escape, or click the scene, to bring them back | Swipe the dock or the strip toward the edge of the screen, or Hide the controls in the menu. Tap the scene, or the arrow where the dock was, to bring them back |
| Mute | Press `M`, or click the speaker at the top right | Tap the speaker at the top right |

The button in the top left corner opens the menu: About, Front view, Rear view, Hide the controls, Arrange as painted, Clear, Painted skull, and a last item that shows how to add the game as an app in the browser in use. It reads "Add to Home Screen" on a phone, "Add to Dock" in Safari on a Mac and "Install as an app" elsewhere, and it is hidden in the installed app. An app added from Safari, or from Chrome on an iPhone, keeps its own storage, so it starts with a bare skull.

The speaker at the top right mutes every sound, and the browser remembers it for the next visit.

The browser keeps the decorated skull, its things and its strokes, and puts it back when the page opens again. "Clear" and "Arrange as painted" keep the skull they replace, and "Bring back the last skull" in the menu puts it back. A browser that refuses storage, as a private window can, keeps nothing after the page closes, and the status line says so.

The scene answers the decorating:

- The meadow starts as low shoots and grows to its full height by the time 24 things are on the skull.
- Each thing placed lets out a puff of glitter from the tip of the horn. Three or more things in a row along the horn set off a burst of rainbow glitter, at most once in five minutes.
- A rabbit comes out of the eye socket with the sixth thing, and now and then after that, and bounds away toward the gap in the forest.
- Music fades in as things are placed. Each thing plays a note of its own on a slow loop, higher for a thing higher on the skull, and louder with the camera near it. A thing swells as it sounds, and a line joins it to the thing that sounded before.

## Working on venorn

`STATUS.md` says what is built, what is waiting on a decision and what is not built yet.

Each piece of work starts as an OpenSpec change under `openspec/changes/`. Read `AGENTS.md` before changing the repository.
