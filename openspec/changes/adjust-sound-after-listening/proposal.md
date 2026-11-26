## Why

codekiln listened to the music on 2026-11-26 and wrote down what they heard in [Listen to the music, the glitter and the pen · Issue #26](https://github.com/albion-house/venorn/issues/26). The balance of the notes and the five voices are right, and a thing is clearly louder with the camera near it. Three things are not right:

- With the tab in the background, only the wind is heard. The things stop playing.
- The wind rises and falls on one even beat, and it sounds too much like water.
- The clouds are one layer behind the skull and make no sound. codekiln would like layers of clouds in the foreground and the background, each with a sound of its own.

A player who leaves the game open in another tab hears noise and no music, so that comes first. The wind and the clouds are heard all the time, so they come next.

## What Changes

What exists now:

- The draw loop decides when each thing's note is due. A browser stops drawing a page it does not show, so in a background tab no note starts, while the wind and the drone go on.
- The wind is three bands of noise whose levels follow one sine wave of about 20 seconds. The meadow sways on the same wave.
- The clouds are one picture wrapped around the scene 26 world units from the skull, behind it from every side. They make no sound.

This change proposes:

- The sound keeps time with a timer that a hidden page still runs, and schedules each note ahead on the audio clock. In a background tab the things play as they do in front, at the same level against the wind.
- Gusts come at uneven times and strengths. Each picks up and dies away, with lulls between. The meadow sways with the same gusts.
- The wind is rebuilt to sound like moving air: less low rumble, a breathy whistle that rises in pitch with each gust, leaves that rustle only in gusts, and gusts that pass from one side to the other.
- Two banks of clouds cut from the cloud picture join the wrapped layer. A near bank circles the skull slowly, with some of its clouds in front of the skull and some behind it. A middle bank stands between the skull and the far layer.
- Each layer of clouds has a sound of its own: the far layer a low hush, the middle bank a soft chord, and each cloud of the near bank a high, airy whistle heard from where it is.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `asset-viewer`: the sound carries on in a background tab, the wind gusts, and the clouds stand at three depths, each with a sound.

## Impact

- `venorn-game-client/` gains `src/wind.ts`, which holds the gusts and the wind's sound, and `src/clouds.ts`, which holds the banks of clouds and their sounds.
- `src/music.ts` schedules notes ahead. `src/main.ts` runs the timer. `src/meadow.ts` takes its gusts from `src/wind.ts`, and `src/scene.ts` adds the banks.
- The pipeline and the manifest do not change. The banks are cut from the floating layer's picture in the browser.

## Citations

- [My/Principle/Problem/Solving/3 - Incremental and Iterative Improvement](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Principle___Problem___Solving___3%20-%20Incremental%20and%20Iterative%20Improvement.md)
- [My/Principle/Simplify/Don't Repeat Yourself DRY](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Principle___Simplify___Don't%20Repeat%20Yourself%20DRY.md)
