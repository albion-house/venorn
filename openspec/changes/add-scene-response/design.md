## Context

The viewer has a living scene: wind in a paper meadow, clouds that slither, a sun that circles and birds that cross a gap in the forest. None of it depends on what the player does. This change ties the scene to the number of things on the skull.

## Goals / Non-Goals

**Goals:**

- A player who has placed a few things sees and hears that the scene has changed.
- Surprises are rare enough to stay surprises.
- The viewer learns where the socket and the horn are from the manifest, not from code written for this skull.

**Non-Goals:**

none

## Decisions

### Named places come from the source

`source.toml` lists features of the structure. Each has an id, a prompt for the detector and a shape. The isolate stage runs the detector on the bare structure, because the things in the painting cover the socket and part of the horn. It keeps the best box that covers less than 60% of the structure, since the detector often answers a prompt with the whole skull.

A hollow is written as the middle and half the shorter side of its box. A spike's tip is the point of the structure inside the box that is farthest from the structure's middle, and its base is the average of the structure's points in the box that are farthest from the tip.

On the bare skull, "hole" finds the eye socket with a score of 0.54 and "unicorn horn" finds the horn with 0.27. "eye socket" and "horn" each return the whole skull. The threshold for features is 0.2, lower than for things.

### One number for lushness

Lushness is the number of things on the structure divided by 24, and no more than 1. The scene moves toward it with a time constant of 2.5 seconds, so a placed thing is followed by a few seconds of growth. Removing things lowers it again.

### Growth is done in the paper's vertex shader

Every plant takes its turn from a random number made from where it stands. A plant that has not grown is 16% of its size and is scaled about its root. The rings of cut paper cannot be scaled sideways, so they sink into the ground until a fifth of their height shows, and rise one stretch after another. The sway is multiplied by a factor from 0.4 to 1.3 with lushness.

### Glitter

Glitter is one set of 3,200 points, moved on the processor each frame: gravity, drag, and a small flutter for each fleck. A fleck is a diamond that flashes white as it turns, lasts 2.6 to 5.6 seconds and ends early when it reaches the ground.

A puff is 6 to 50 flecks of one hue, by lushness. A spew lets out 420 flecks a second for 3.2 seconds, and its hue runs through the rainbow as it goes.

The spew is set off when the count of things along the spike reaches three or more and is higher than it was, and at least five minutes have passed since the last spew. A thing is along the spike when it is within 0.08 structure lengths of the line from base to tip and past the first 15% of that line.

### Rabbit

The rabbit is a sprite with four pictures drawn on a canvas from overlapping ovals: leaping and gathered, facing right and left. Cut paper suits the meadow, and a sprite always faces the camera.

It starts in the hollow on the camera's side of the structure, looks around for 0.8 seconds, and bounds along a curve: down in front of the structure, around its end, and away toward the gap in the far layer nearest to where the camera looks. Each bound is a little longer and higher than the last. The run ends at 60% of the far layer's distance, by which time the meadow hides it. A flock is brought forward to cross the gap within five seconds.

The first rabbit comes with the sixth thing. After that, placing a thing brings one with a chance of 0.3, no sooner than 100 seconds after the last.

### Music

The music follows the way Brian Eno built "Music for Airports": single notes on loops of different lengths, so the pattern never quite repeats. Each thing has a loop of 11 to 28 seconds. With more than 14 things, every loop is stretched by the same factor, so the music stays sparse however many things there are. At most 16 notes ring at once.

A thing's note comes from the D major pentatonic scale. Its height on the structure picks the note, and its place moves it up by as much as two steps. Its category picks one of five voices made from a few oscillators: air, bell, mallet, glass and pad. A drone on D and A lies under the notes.

Each note passes through a panner at the thing's place, with the listener at the camera. A note is at full strength within 2.2 world units and falls away with distance, so from the front view a note is about a fifth as strong as from close by. All notes share one echo, made from five seconds of fading noise, and a limiter.

The music's level is lushness raised to the power 0.6, so the first few things can already be heard.

The draw loop's clock decides when a note is due, and the audio clock only places the note. The things swell and the lines draw even when the sound is off or the browser has not yet allowed sound.

### Lines between things

A line is drawn from the thing that sounded before to the thing that sounds now, as a curve that arcs away from the surface. It draws itself in 0.9 seconds and fades over 3.4. Eight lines can show at once.

## Risks / Trade-offs

- A new game shows a nearly bare ground. The first few things have little effect on the meadow, because each plant waits for its turn.
- The horn's score from the detector is low. Another painting may need another prompt, or a feature may be left out, in which case its surprise does not happen.
- The rabbit is unlit, so it stays pale at dusk.
- Nobody has listened to the music yet. Its levels were set from numbers: a rendered note's loudness near and far, and against the drone.

## Resolved Questions

None.

## Open Questions

### 1 - Which achievements should set off the burst of glitter?

> Context from the drafting agent, for question 1.
>
> codekiln suggested "lining up several things on the horn or something". The first version counts three or more things along the horn. Other candidates: one thing of each category, a thing on every tooth, or both eye sockets filled.

<ANSWER_HERE>

### 2 - How often should a rabbit come?

> Context from the drafting agent, for question 2.
>
> The first rabbit comes with the sixth thing, so that a new player sees it. Later rabbits come at a chance of 0.3 for each thing placed, at least 100 seconds apart.

<ANSWER_HERE>
