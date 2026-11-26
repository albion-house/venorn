# Status

Where venorn stands as of 2026-11-26, what waits on codekiln, and what was discussed but is not built. `README.md` describes the game and how to run it, and `openspec/` holds the proposals and designs.

## Built and merged

| What | Pull request |
| --- | --- |
| Asset pipeline: the painting becomes a bare skull, 34 models with adjustment criteria, and scene layers | [#2](https://github.com/albion-house/venorn/pull/2), [#4](https://github.com/albion-house/venorn/pull/4) |
| Diorama scene: free camera, layers, a meadow of cut paper, clouds that slither, birds, wind | [#4](https://github.com/albion-house/venorn/pull/4), [#8](https://github.com/albion-house/venorn/pull/8), [#10](https://github.com/albion-house/venorn/pull/10) |
| Painted sprigs whose flowers stand out from the bone | [#12](https://github.com/albion-house/venorn/pull/12) |
| Serving the built game to a phone | [#14](https://github.com/albion-house/venorn/pull/14), [#24](https://github.com/albion-house/venorn/pull/24) |
| Decoration play: five categories in a dock, variations in a strip, a wheel on each thing, gestures and keys | [#16](https://github.com/albion-house/venorn/pull/16) |
| The scene answers: a meadow that grows, glitter from the horn, a rabbit from the eye socket | [#18](https://github.com/albion-house/venorn/pull/18) |
| Ambient music that the placed things play | [#20](https://github.com/albion-house/venorn/pull/20) |
| Glitter pen | [#22](https://github.com/albion-house/venorn/pull/22) |

Every feature after the pipeline is a first version. codekiln called the ideas behind them tentative.

## How each was checked

- The pipeline has 46 unit tests, and `mise run check` passes.
- The viewer was checked with scripted pointer, wheel and key events in a desktop browser, at laptop size and at 375 by 812, and with pictures read from the canvas. Each OpenSpec change's `tasks.md` records the measurements.
- Not checked on any real phone. Not checked by ear: nobody has heard the music, the glitter or the pen. The frame rate has not been measured.

## Waiting on codekiln

| What | Where |
| --- | --- |
| Turn Tailscale on on the Mac and set it up on the phone, then try the game | [#25](https://github.com/albion-house/venorn/issues/25) |
| Open Xcode once so its first-launch setup finishes. Claude can then try the game in an iPhone simulator | [#25](https://github.com/albion-house/venorn/issues/25) |
| Listen to the music, the glitter and the pen | [#26](https://github.com/albion-house/venorn/issues/26) |
| Access to the DINOv3 weights on Hugging Face, which TRELLIS.2 needs. The request is pending, and the port is not to be cloned until it can be used | [#5](https://github.com/albion-house/venorn/issues/5) |
| Look through the pipeline's check pictures and say which kinds, exemplars and layer rules to change | `openspec/changes/add-decoration-play/tasks.md`, task 4.1 |
| Answer the open questions | below |

### Open questions

Each has background and a place for an answer in its `design.md`.

- `openspec/changes/add-decoration-play/design.md`: where generated models are stored, whether the game stays on three.js used directly, and whether Kind, Variation, Design and Remove are the right buttons for the wheel.
- `openspec/changes/add-scene-response/design.md`: which achievements set off the burst of glitter, and how often a rabbit comes.
- `openspec/changes/add-glitter-pen/design.md`: whether the pen gets more widths and other kinds of paint.

## Discussed and not built

| What | Issue |
| --- | --- |
| Type or dictate what belongs on a spot, generate an image of it and pin the model made from it | [#27](https://github.com/albion-house/venorn/issues/27) |
| A generative image-to-3D model for the skull and the things. Today's models are swollen from the painting's cutouts and shaped by a depth estimate | [#5](https://github.com/albion-house/venorn/issues/5) |
| Publishing on GitHub Pages from a subdirectory | [#28](https://github.com/albion-house/venorn/issues/28) |
| Painting beyond the glitter pen: more widths, a brush | [#30](https://github.com/albion-house/venorn/issues/30) |
| More achievements than three things in a row on the horn | open question in `add-scene-response` |
| Choosing the seam where the two sides of the skull meet. codekiln raised it and set it aside | [#29](https://github.com/albion-house/venorn/issues/29) |
| Decorating the ground around the skull, as an altar or a shrine | none yet |
| Saving a decorated skull. Nothing is kept after the page closes | [#29](https://github.com/albion-house/venorn/issues/29) |
| A hosted generative service, to come in when the model on the Mac is not enough | none yet |

## Rough edges

[#29](https://github.com/albion-house/venorn/issues/29) lists them: the skull's far side repeats its near side, mirrored copies show where the rings and the forest are tiled, the opening ground is nearly bare, and the built script is large.

## OpenSpec changes still open

| Change | Tasks left |
| --- | --- |
| `add-decoration-play` | 3.2 real phone, 4.1 check pictures, 4.2 open questions |
| `add-scene-response` | 4.4 listen and adjust |
| `add-glitter-pen` | 2.6 draw with a finger on a real phone |

Archive a change with `openspec archive <name>` once its tasks are checked.

## Picking the work up

1. Read `AGENTS.md`, then this file.
2. `mise //venorn-asset-pipeline:build` makes the asset set, which git ignores. It takes about 85 seconds once the model weights are downloaded.
3. `mise //venorn-game-client:dev` serves the game at `http://localhost:5183`. `mise //venorn-game-client:phone` builds it and serves it to a phone.
4. To check the viewer from a script, call `window.venorn.hold(true)`, then `window.venorn.draw(seconds)` for each frame, and read the canvas.
