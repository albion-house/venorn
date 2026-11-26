## ADDED Requirements

### Requirement: Scene grows with the decoration

The meadow SHALL start as low shoots and SHALL grow as things are placed on the structure, reaching its full height when 24 things are placed. Each plant SHALL grow from its root in its own turn, and the rings of cut paper SHALL rise out of the ground. The meadow SHALL sway further as it grows. The growth SHALL follow a change in the number of things over a few seconds, and the meadow SHALL shrink again when things are removed.

#### Scenario: New game

- **WHEN** a person opens the viewer
- **THEN** the plants around the skull stand at about a sixth of their full size
- **AND** the ground between them is in view

#### Scenario: Two dozen things

- **WHEN** 24 things are on the skull and a few seconds have passed
- **THEN** the meadow stands at its full height, as it does in the painting

#### Scenario: Things are cleared

- **WHEN** a person presses "Clear" with a grown meadow
- **THEN** the meadow shrinks back to low shoots over a few seconds

### Requirement: Glitter from the spike

When the asset set names a spike on the structure, placing a thing SHALL let out a puff of glitter from the spike's tip, larger the more things are on the structure, with a sound of small bright notes. Flecks of glitter SHALL flash as they fall and SHALL vanish when they reach the ground.

#### Scenario: First thing is placed

- **WHEN** a person places the first thing on the skull
- **THEN** a few flecks of one color rise from the tip of the horn and fall

#### Scenario: Asset set names no spike

- **WHEN** the manifest lists no spike
- **THEN** placing a thing lets out no glitter and raises no error

### Requirement: Burst of glitter for a row on the spike

When three or more things lie along the spike, and more than lay there before, a burst of rainbow glitter SHALL come from the spike's tip for about three seconds, and the status line SHALL say how many are in a row. A burst SHALL come at most once in five minutes.

#### Scenario: Three in a row on the horn

- **WHEN** a person places a third thing along the horn
- **THEN** glitter in the colors of the rainbow pours from the tip of the horn for about three seconds
- **AND** the status line reads "3 in a row on the horn"

#### Scenario: Fourth thing a moment later

- **WHEN** a person places a fourth thing along the horn within five minutes of a burst
- **THEN** no second burst comes

#### Scenario: Thing is dragged onto the horn

- **WHEN** a person drags a thing to join two others along the horn
- **THEN** the burst comes when the drag ends

### Requirement: Rabbit from the hollow

When the asset set names a hollow on the structure, a rabbit SHALL come out of it the first time six things are on the structure. The rabbit SHALL look around, bound down in front of the structure, around its end and away toward the gap in the far layer nearest to where the camera looks, and a flock SHALL cross that gap within five seconds. After the first rabbit, placing a thing SHALL now and then bring another, no sooner than 100 seconds after the last. Only one rabbit SHALL be out at a time.

#### Scenario: Sixth thing is placed

- **WHEN** a person places the sixth thing on the skull
- **THEN** a rabbit appears in the eye socket, looks left and right, and bounds away across the meadow

#### Scenario: Camera is behind the skull

- **WHEN** a rabbit comes while the camera looks at the far side of the skull
- **THEN** the rabbit comes out of the eye socket on that side

#### Scenario: Rabbit is already out

- **WHEN** a thing is placed while a rabbit is bounding away
- **THEN** no second rabbit appears

### Requirement: Music from the placed things

Each thing on the structure SHALL play a note of its own that comes around on a loop of its own length. Each category SHALL have its own voice, and of two things in one category the one higher on the structure SHALL NOT play the lower note by more than two steps of the scale. A thing placed alone SHALL sound within a second. The music's level SHALL rise from silence with the number of things placed, with a low drone under the notes, and the "Sound" switch SHALL silence it.

#### Scenario: Nothing is placed

- **WHEN** nothing is on the skull
- **THEN** no music plays

#### Scenario: First thing is placed

- **WHEN** a person places the first thing
- **THEN** its note sounds quietly within a second
- **AND** the same note sounds again some seconds later

#### Scenario: Many things are placed at once

- **WHEN** a person presses "Arrange as painted"
- **THEN** the things' first notes are spread out over their loops and do not all sound together

#### Scenario: Thing on the horn

- **WHEN** a jewel near the tip of the horn and a jewel on the jaw both sound
- **THEN** the jewel on the horn plays the higher note

### Requirement: Things sound from where they sit

A thing's note SHALL come from the thing's place in the scene: louder with the camera near the thing, quieter with it far, and to the left or right as the thing is.

#### Scenario: Camera moves close to a thing

- **WHEN** a thing sounds with the camera two world units from it, and again with the camera nine units from it
- **THEN** the first note is several times louder than the second

### Requirement: Things show the music

While a thing's note rings, the thing SHALL swell and glow, most at the start of the note. A line SHALL draw itself from the thing that sounded before to the thing that sounds now, and then fade.

#### Scenario: Two things sound in turn

- **WHEN** one thing sounds and then another
- **THEN** the second thing swells and glows
- **AND** a line arcs from the first thing to the second and fades over a few seconds

#### Scenario: Sound is switched off

- **WHEN** the "Sound" switch is off
- **THEN** the things still swell and the lines still draw
