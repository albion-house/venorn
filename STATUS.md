# Status

Where venorn stands as of 2026-11-26, what waits on codekiln, and what was discussed but is not built. `README.md` describes the game and how to run it, and `openspec/` holds the proposals and designs.

## Built and merged

| What | Pull request |
| --- | --- |
| Asset pipeline: the painting becomes a bare skull, models with adjustment criteria (34 since #16), and scene layers | [#2](https://github.com/albion-house/venorn/pull/2), [#4](https://github.com/albion-house/venorn/pull/4) |
| Diorama scene: free camera, layers, a meadow of cut paper, clouds that slither, birds, wind | [#4](https://github.com/albion-house/venorn/pull/4), [#8](https://github.com/albion-house/venorn/pull/8), [#10](https://github.com/albion-house/venorn/pull/10) |
| Painted sprigs whose flowers stand out from the bone | [#12](https://github.com/albion-house/venorn/pull/12) |
| Serving the built game to a phone | [#14](https://github.com/albion-house/venorn/pull/14), [#24](https://github.com/albion-house/venorn/pull/24) |
| Decoration play: five categories in a dock, variations in a strip, a wheel on each thing, gestures and keys | [#16](https://github.com/albion-house/venorn/pull/16) |
| The scene answers: a meadow that grows, glitter from the horn, a rabbit from the eye socket | [#18](https://github.com/albion-house/venorn/pull/18) |
| Ambient music that the placed things play | [#20](https://github.com/albion-house/venorn/pull/20) |
| Glitter pen | [#22](https://github.com/albion-house/venorn/pull/22) |
| The decorated skull and its pen strokes are kept in the browser and come back when the page opens. Clear and Arrange as painted can be undone | [#33](https://github.com/albion-house/venorn/pull/33) |
| A button in the pen's strip lets one finger turn the view, the color setting leaves dark and grey parts alone, the rabbit is lit, and the forest, meadow and cutout layers join at their ends instead of repeating in mirror image | [#35](https://github.com/albion-house/venorn/pull/35) |
| The music keeps playing in a background tab, the wind gusts, and clouds stand at three depths, each with a sound of its own | [#36](https://github.com/albion-house/venorn/pull/36) |
| How long the pipeline takes on one new image, and a proposal for described things | [#34](https://github.com/albion-house/venorn/pull/34) |
| Fixes for what the simulator showed: the wheel's buttons stay off a small selected thing, a zoom with the pen leaves no glitter, the status line follows the selection, the clouds reach above the top of the painting, and the menu button and status line keep clear of a notch | [#38](https://github.com/albion-house/venorn/pull/38) |
| The game is published at https://albion-house.github.io/venorn/ on every push to `main` that touches the client. The asset set comes from a GitHub release, and `fetch-assets` gets it without running the pipeline | [#39](https://github.com/albion-house/venorn/pull/39) |
| On a phone on its side the strip stands down the left side and the dock at the lower right, the design bar opens as a panel at the lower left, and the wheel keeps clear of them and of the safe area | [#41](https://github.com/albion-house/venorn/pull/41) |
| The game opens on an About screen with Fawnicorn's painting, its title as the artist writes it, a link to the painting's page and the build's version. About, first in the menu, opens it again. The asset set carries a copy of the painting and the title, artist and page | [#45](https://github.com/albion-house/venorn/pull/45) |
| A selected thing is let go with Done at the top right, a flick on it, or a tap with its wheel open. The design bar lays its settings out in a grid of 44-point cells that show their values, with a slider drawn by the page between a minus and a plus button. The camera pans when the bar opens over the thing | [#46](https://github.com/albion-house/venorn/pull/46) |

Every feature after the pipeline is a first version. codekiln called the ideas behind them tentative.

## How each was checked

- The pipeline has 54 unit tests. `mise run check` runs them and validates every OpenSpec change, and it passes.
- The viewer was checked with scripted pointer, wheel, key and touch events in a desktop browser, at laptop size and at 375 by 812, and with pictures read from the canvas. Each OpenSpec change's `tasks.md` records the measurements.
- The game was tried by touch in Xcode's iPhone 17 simulator, in Safari. [The comment on #25](https://github.com/albion-house/venorn/issues/25#issuecomment-7204288883) lists what works and the problems seen. The simulator draws with the Mac's graphics chip, so it says nothing about a phone's speed. The fixes in #38 were checked with scripted touch in headless Chrome, with the phone's safe-area insets faked, and then in the simulator, upright and on its side ([comment on #25](https://github.com/albion-house/venorn/issues/25#issuecomment-7205796448)).
- The published site was opened in Chrome on the Mac and in the simulator, where a tap placed a butterfly.
- The layout for a phone on its side in #41 was checked with scripted touch in headless Chrome at 874 by 339, the simulator's page in Safari, with the safe-area insets faked for the island at either side. It has not been tried in the simulator.
- The About screen in #45 was checked on the built site with scripted touch in headless Chrome at 402 by 874 and at 874 by 339, with the safe-area insets faked, and with a mouse at 1280 by 800. It has not been tried in the simulator.
- Letting go and the design bar in #46 were checked with scripted touch in headless Chrome at 402 by 874 and at 874 by 339, with the safe-area insets faked, and with a mouse at 1280 by 800. They have not been tried in the simulator.
- Not checked on any real phone. codekiln listened to the music from #20 and asked for the changes in #36. Nobody has heard #36. The frame rate has not been measured.

## Waiting on codekiln

| What | Where |
| --- | --- |
| Try the game on a real phone at https://albion-house.github.io/venorn/. Tailscale is no longer needed for it | [#25](https://github.com/albion-house/venorn/issues/25) |
| Listen to the music in a background tab, the gusting wind and the clouds' sounds | [#26](https://github.com/albion-house/venorn/issues/26), task 4.2 in `openspec/changes/adjust-sound-after-listening/tasks.md` |
| Access to the DINOv3 weights on Hugging Face, which TRELLIS.2 needs. The request is pending, and the port is not to be cloned until it can be used | [#5](https://github.com/albion-house/venorn/issues/5) |
| Look through the pipeline's check pictures and say which kinds, exemplars and layer rules to change | `openspec/changes/add-decoration-play/tasks.md`, task 4.1 |
| Answer the open questions | below |

### Open questions

Each has background and a place for an answer in its `design.md`.

- `openspec/changes/add-decoration-play/design.md`: whether the game stays on three.js used directly, and whether Kind, Variation, Design and Remove are the right buttons for the wheel.
- `openspec/changes/archive/2026-11-26-add-scene-response/design.md`: which achievements set off the burst of glitter, and how often a rabbit comes. The change was archived with these two still open.
- `openspec/changes/add-glitter-pen/design.md`: whether the pen gets more widths and other kinds of paint.
- `openspec/changes/add-saved-skull/design.md`: whether a restored skull's meadow grows in from low shoots, whether a restored skull counts as past the first rabbit, and whether the game keeps more than one skull.
- `openspec/changes/fix-rough-edges/design.md`: whether the clouds join at their ends the same way, and whether a button in the strip is the right way to turn the view with the pen.
- `openspec/changes/adjust-sound-after-listening/design.md`: whether the cloud sounds start with the wind or come in with the music, and whether near clouds may pass in front of the skull's face.
- `openspec/changes/fix-simulator-problems/design.md`: whether half a second and 20 pixels tell the start of a zoom from a short stroke, and whether the clouds above the top of the painting look right.
- `openspec/changes/fix-landscape-layout/design.md`: whether the strip and the dock stand on opposite sides or together, and whether four buttons in one arc start from the one nearest Kind's usual place.
- `openspec/changes/add-about-screen/design.md`: whether the About screen opens on every load or only on a first visit, and whether Start waits until the scene has loaded.
- `openspec/changes/let-go-and-design-by-touch/design.md`: whether Done belongs at the top right, whether a flick is told from a drag at the right speed, whether a tap on the skull with a wheel open lets go or places a thing, and whether the open design bar takes the strip's place upright.
- `openspec/changes/add-described-things/design.md`: how a described thing joins the five categories in the dock, how voice input works, where the image comes from, whether a described thing takes its size and criteria from the nearest kind, and whether described things keep the relief models if TRELLIS.2 makes the skull.

## Discussed and not built

| What | Issue |
| --- | --- |
| Type or dictate what belongs on a spot, generate an image of it and pin the model made from it. `openspec/changes/add-described-things/` has the proposal and the timing: a process that keeps its models loaded turns one image into a model in about 2.5 seconds | [#27](https://github.com/albion-house/venorn/issues/27) |
| A generative image-to-3D model for the skull and the things. Today's models are swollen from the painting's cutouts and shaped by a depth estimate | [#5](https://github.com/albion-house/venorn/issues/5) |
| Painting beyond the glitter pen: more widths, a brush | [#30](https://github.com/albion-house/venorn/issues/30) |
| More achievements than three things in a row on the horn | open question in the archived `add-scene-response` |
| Choosing the seam where the two sides of the skull meet. codekiln raised it and set it aside | [#29](https://github.com/albion-house/venorn/issues/29) |
| Decorating the ground around the skull, as an altar or a shrine | none yet |
| A hosted generative service, to come in when the model on the Mac is not enough | none yet |

## Rough edges

[#29](https://github.com/albion-house/venorn/issues/29) lists them. Still open: the skull's far side repeats its near side, the forest is soft where the skull was painted out of it, the opening ground is nearly bare, and the built script is large.

The simulator showed four more, listed in the comment on #25, and a fifth with the phone on its side. #38 fixes all five. With the phone on its side the bars also covered the lower half of the skull and left the wheel no room. #41 puts the strip and the dock at the sides there and keeps the wheel clear of them and of the safe area.

## OpenSpec changes still open

| Change | Tasks left |
| --- | --- |
| `add-decoration-play` | 3.2 real phone, 4.1 check pictures, 4.2 open questions |
| `add-glitter-pen` | 2.6 draw with a finger on a real phone |
| `add-saved-skull` | 4.4 reload on a real phone |
| `fix-rough-edges` | 1.3 turn the view with one finger on a real phone |
| `adjust-sound-after-listening` | 4.2 listen and adjust |
| `fix-simulator-problems` | 6.1 try the fixes on a real phone. The simulator check is done |
| `fix-landscape-layout` | 4.1 try the layout in the simulator on its side, turned both ways, and on a real phone |
| `add-about-screen` | 3.2 look at the About screen on a phone, upright and on its side |
| `let-go-and-design-by-touch` | 3.2 try letting go and the design bar on a real phone and in the simulator |
| `add-described-things` | every task: lifting one image, a process that keeps the models loaded, and pinning a model the page receives |

Archive a change with `openspec archive <name>` once its tasks are checked.

## Picking the work up

1. Read `AGENTS.md`, then this file.
2. `mise //venorn-asset-pipeline:build` makes the asset set, which git ignores. It takes one and a half to two minutes once the model weights are downloaded. Run it again after a change to the pipeline, then `mise //venorn-game-client:publish-assets` to put the new set on the published site. `mise //venorn-game-client:fetch-assets` downloads the published set in place of running the pipeline. Pass `--force` to replace a set that is already there, as after `mise.toml` names a new one.
3. `mise //venorn-game-client:dev` serves the game at `http://localhost:5183`. `mise //venorn-game-client:phone` builds it and serves it to a phone.
4. To check the viewer from a script, call `window.venorn.hold(true)`, then `window.venorn.draw(seconds)` for each frame, and read the canvas.
5. Xcode and an iOS 27.2 simulator are set up on the Mac. With the phone task running, the simulator's Safari opens the game at `http://localhost:5190`. The browser keeps a saved skull for each address, so port 5183, port 5190 and https://albion-house.github.io/venorn/ keep separate skulls.
