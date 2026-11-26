## Context

The music came in with the `add-scene-response` change, now archived. codekiln listened to it on 2026-11-26 and asked for three changes in [Listen to the music, the glitter and the pen · Issue #26](https://github.com/albion-house/venorn/issues/26): keep the music playing in a background tab, make the wind pick up and die away in gusts and sound less like water, and put the clouds at different depths, each with a sound.

## Goals / Non-Goals

**Goals:**

- A player who switches to another tab still hears the things play, at the balance codekiln liked.
- The wind is heard as gusts of air, not as running water.
- Moving the camera shows clouds in front of the skull and behind it, and each layer of clouds can be told apart by ear.

**Non-Goals:**

none

## Decisions

### The sound keeps its own time

A timer runs four times a second. Each time, it schedules on the audio clock every note due in the next two seconds, and the wind's gusts for the same stretch. The draw loop still hands the music the things, the level and the camera, and a thing swells and draws its line in the first frame after its note starts.

A hidden page still runs its timers. Chrome runs them without throttling while the page has made a sound in the last 30 seconds, and the wind keeps the page from being silent. Otherwise Chrome runs them once a second, so two seconds of notes scheduled ahead are enough. [Heavy throttling of chained JS timers beginning in Chrome 88](https://developer.chrome.com/blog/timer-throttling-in-chrome-88) describes these rules.

A note more than 1.5 seconds overdue is passed over, as before, for a page that was frozen. A thing removed before its note starts makes no sound.

### Gusts

One function of time gives the gusts, and both the meadow's sway and the wind's sound use it. It adds three sine waves of about 30, 12 and 5 seconds. The two slower ones are skewed, so they rise faster than they fall. A smooth step shapes the sum, so the gust is 0 in a lull and 1 at the height of a strong gust.

Over 20 minutes, computed from the function: a gust passes 0.5 about 4.7 times a minute, 4 to 23 seconds after the one before. Its peak ranges from 0.36 to 0.99, and lulls below 0.1 fill 30% of the time. The old sine wave passed 0.5 three times a minute, every 20 seconds, and every peak was 1.

The meadow's vertex shader computes the same function, delayed by how far down the wind each plant stands, so a gust crosses the meadow.

### The wind's sound

Rendered for two minutes, the old wind's loudness stayed within 7.5 dB, and 57% of its power was below 260 Hz. Steady, low, broad noise is what a stream or a waterfall sounds like. The new wind:

- Plays pink noise from two loops, of 7.3 and 11.9 seconds, so that neither is heard repeating.
- Has a rush of air between 200 Hz and a cutoff that rises from 380 Hz in a lull to 1080 Hz at the height of a gust. In a lull the rush is a sixth as loud as at the height of a gust.
- Has two whistles, narrow bands of noise whose pitch rises with the gust, from 300 to 900 Hz and from 430 to 1260 Hz. They fall silent in a lull.
- Rustles leaves, a band of noise around 5.6 kHz that sounds only in the stronger part of a gust and flutters ten times a second.
- Sends the whistles and the leaves in from the left as a gust picks up and out to the right as it dies away, the way the meadow's wind blows.

Its mean loudness is what the old wind's was, so the balance against the music holds.

### Banks of clouds

The banks are cut from the floating layer's picture in the browser. The picture's opaque parts are labelled at a quarter of its size, and the pieces that do not touch an edge of the picture are kept. Each piece is cut out with its own mask, so no part of its neighbors shows. A piece is drawn as a sprite, which always faces the camera, like the rabbit.

- The near bank: 8 pieces on a circle 4 world units from the middle of the skull, at the height of the skull's upper half and above it. It goes once around the scene in 10 minutes. From the front view the camera stands 9 units away, so pieces on the near side of the circle are in front of the skull and pieces on the far side are behind it.
- The middle bank: 10 larger pieces on a circle 14 units from the middle, higher up. It goes the other way, once around in 20 minutes.
- The far layer stays where it is, 26 units away.

A piece fades as the camera comes within 1.5 units of it, as the plants thin out. The banks are not rings, so how far the camera can pull back stays the same.

### Sounds of the clouds

Each layer has its own kind of sound, all on notes of the music's scale, D major pentatonic:

- The far layer: a low hush, noise through narrow bands on D3 and A3, that swells and fades over about 40 seconds. It sounds the same from everywhere.
- The middle bank: a soft chord of sine tones, one note for each piece, heard from where the piece is. Each tone swells and fades on its own slow loop.
- The near bank: a high, airy whistle for each piece, noise through a narrow band on a high note, heard from where the piece is. As the bank turns, a whistle passes from one side to the other, and it is louder with the camera near.

The cloud sounds start with the wind. From the front view each is quieter than a thing's note.

## Risks / Trade-offs

- Nobody has heard the result. The levels are set from loudness measured in rendered sound.
- A hidden tab cannot be made in headless Chrome: every page there reports itself visible and keeps drawing, even behind another tab or in a minimized window. The checks hold the draw loop with `window.venorn.hold(true)` and slow the timers to once a second instead.
- The clouds add three sounds that never stop. With the wind, that is a lot of sound that is always on, so each cloud sound is quiet and swells and fades.
- From some views a near piece can cover the tip of the horn.

## Resolved Questions

None.

## Open Questions

### 1 - Should the cloud sounds start with the wind, or come in with the music as things are placed?

> Context from the drafting agent, for question 1.
>
> They start with the wind, at the first tap, because the clouds are part of the scene and not of the decoration. Tying them to the music's level would leave a new game with only the wind, as it is now.

<ANSWER_HERE>

### 2 - May clouds of the near bank pass in front of the skull's face, or only around it?

> Context from the drafting agent, for question 2.
>
> The near bank's pieces sit at the height of the skull's upper half and above it, so from the front they pass over the top of the skull and the horn. Pieces lower down would cross the face and hide the things on it for a while.

<ANSWER_HERE>
