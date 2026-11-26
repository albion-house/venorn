# asset-viewer Specification

## Purpose

Show an exported asset set in the browser so a person can judge the models and try pinning them to the structure within their adjustment criteria.

## Requirements

### Requirement: Asset set is shown

The viewer SHALL load an asset set's manifest and show the bare structure and a tray with a preview of each model in the set.

#### Scenario: Viewer opens after an export

- **WHEN** a person opens the viewer after the pipeline has exported the `veneration-ornamentation` asset set
- **THEN** the bare skull appears
- **AND** the tray shows a preview of each model

### Requirement: Pinning with a tap

A tap or click on the structure SHALL pin the model chosen in the tray at that spot, on any side of the structure, at its natural size, facing along the surface. A pinned thing SHALL stand off the surface on its pin and cast a shadow. A pin sound SHALL play, and the pin head of a pinned thing SHALL throb.

#### Scenario: Candy is pinned

- **WHEN** a person chooses a candy in the tray and taps the skull
- **THEN** the candy appears at the tapped spot, raised on a gold pin, with its shadow on the skull
- **AND** a pin sound plays

#### Scenario: Drag is not a tap

- **WHEN** a person presses the skull, drags and releases
- **THEN** the camera turns and nothing is pinned

#### Scenario: Candy is pinned to the far side

- **WHEN** a person turns the camera to the far side of the skull and taps it
- **THEN** the chosen model is pinned there, facing away from the skull

### Requirement: Adjustments stay within the criteria

Selecting a pinned thing SHALL offer a control for each adjustment its criteria allow, limited to the allowed range. An adjustment the criteria fix at one value SHALL have no control.

#### Scenario: Pinned candy is selected

- **WHEN** a person taps a pinned candy
- **THEN** controls appear for size, turn, lift, tilt, depth, wrap and mirror
- **AND** no control appears for fold or bend

#### Scenario: Printed flower is selected

- **WHEN** a person taps a thing of a printed kind, such as a printed flower
- **THEN** controls appear for size, turn, depth, bend and mirror
- **AND** no control appears for lift, tilt or wrap

#### Scenario: Pinned butterfly is selected

- **WHEN** a person taps a pinned butterfly
- **THEN** a fold control appears with the candy's controls

#### Scenario: Depth presses a thing flat

- **WHEN** a person moves a thing's depth control to its lowest value
- **THEN** the thing becomes nearly flat

### Requirement: Arrangement from the painting

The viewer SHALL place a model at every position in the manifest's arrangement, sized and turned as the arrangement records, and SHALL place its mirror image at the matching position on the far side of the structure.

#### Scenario: Skull is arranged as painted

- **WHEN** a person presses "Arrange as painted"
- **THEN** one thing appears on the near side of the skull for each entry in the arrangement
- **AND** its mirror image appears on the far side

### Requirement: Touch and mouse

The viewer SHALL be usable with touch and with a mouse. On a narrow screen the tray SHALL run along the bottom and scroll sideways.

#### Scenario: Viewer on a phone-sized screen

- **WHEN** the viewer is opened in a window narrower than 640 pixels
- **THEN** the tray runs along the bottom edge
- **AND** a tap on the skull pins the chosen model

### Requirement: Wrapped things follow the surface

A thing whose wrap is at its fullest SHALL lie on the surface of the structure across its whole area, on any side of the structure, and SHALL keep its shape as seen from straight above its anchor.

#### Scenario: Flower is wrapped across a ridge

- **WHEN** a person moves a flower's wrap control to its highest value where the skull's surface changes height
- **THEN** every part of the flower rests on the surface

### Requirement: Free camera

The camera SHALL turn all the way around the structure and up over it. It SHALL zoom in toward the point under the pointer until a single pinned thing fills the view, and SHALL pan. A "Front view" control SHALL return it to the view of the painting, and a "Rear view" control SHALL show the far side straight on.

#### Scenario: Person turns to the far side

- **WHEN** a person drags sideways until the camera has turned half way around
- **THEN** the far side of the skull is in view

#### Scenario: Person asks for the rear view

- **WHEN** a person presses "Rear view"
- **THEN** the camera looks straight at the far side of the skull from the front view's distance

#### Scenario: Person zooms in

- **WHEN** a person scrolls or pinches inward over a pinned thing
- **THEN** the camera moves toward that thing

#### Scenario: Person pans

- **WHEN** a person drags with the right mouse button, drags with two fingers, or presses an arrow key
- **THEN** the view moves sideways without turning

#### Scenario: Camera stays above the ground and inside the scene

- **WHEN** a person drags downward or zooms out as far as the camera goes
- **THEN** the camera stops a few degrees below level and inside the layers wrapped around the scene

### Requirement: Removing a pinned thing

A right click on a pinned thing SHALL remove it. On a touch screen, pressing a pinned thing and holding still SHALL remove it. A sound SHALL play when a thing is removed.

#### Scenario: Right click removes a thing

- **WHEN** a person right-clicks a pinned thing
- **THEN** the thing is removed and no browser menu opens

#### Scenario: Right drag pans

- **WHEN** a person presses the right mouse button on a pinned thing, drags and releases
- **THEN** the view pans and the thing stays

#### Scenario: Press and hold removes a thing

- **WHEN** a person presses a pinned thing with a finger and holds still for about half a second
- **THEN** the thing is removed

### Requirement: Scene around the structure

When the asset set has a scene, the viewer SHALL wrap the floating and far layers around the scene at their distances and paint the backdrop on a dome. From the front view the far and floating layers SHALL line up as they do in the source image.

#### Scenario: Front view matches the painting

- **WHEN** the viewer opens on the `veneration-ornamentation` asset set
- **THEN** the skull has the clouds, the forest and the sky behind it, placed as in the painting

#### Scenario: Layers shift as the camera moves

- **WHEN** a person turns or pans the camera
- **THEN** the meadow, the clouds and the forest shift by different amounts

#### Scenario: Scene surrounds the skull

- **WHEN** a person turns the camera all the way around
- **THEN** the forest and the clouds are behind the skull from every side

### Requirement: Meadow of cut paper

The structure SHALL sit in a thicket of the ground's plants, each a flat cutout standing on its root and bent a little differently. Plants right beside the structure SHALL stay low. Rings of the cut-paper ground SHALL stand behind the thicket out to the far layer, and paper far from the structure SHALL be out of focus and faded. The plants SHALL sway in a wind.

#### Scenario: Skull sits in a thicket

- **WHEN** the viewer opens on the `veneration-ornamentation` asset set
- **THEN** dandelions, thistles, ferns and small flowers stand around the skull on every side
- **AND** the skull's teeth and jaw stay in view from the front

#### Scenario: Meadow runs to the horizon

- **WHEN** a person looks across the meadow from beside the skull
- **THEN** rows of cut paper stand one behind another out to the forest, softer and paler with distance

#### Scenario: Wind moves the plants

- **WHEN** a second passes
- **THEN** the tops of the plants have moved and their roots have stayed in place

#### Scenario: Plant in front of the camera

- **WHEN** the camera moves into a plant
- **THEN** the plant thins out and the view stays clear

### Requirement: Living scene

The floating layer SHALL drift slowly around the scene while its parts flow their own ways, so its shapes change. A sun SHALL circle the sky, and the light and the shadows SHALL follow it. Now and then a flock of birds SHALL cross a gap between the masses of the far layer, calling as it goes. A wind SHALL sound from the first tap, click or key press, louder in the meadow's gusts. A "Sound" control SHALL switch every sound off and on.

#### Scenario: Clouds drift

- **WHEN** a minute passes
- **THEN** the clouds have moved sideways against the forest

#### Scenario: Clouds slither

- **WHEN** the clouds have come back around to the same place
- **THEN** their shapes differ from the last time they were there

#### Scenario: Shadows follow the sun

- **WHEN** the sun has moved
- **THEN** the shadows of the skull and of the pinned things have moved with it

#### Scenario: Birds cross the gap

- **WHEN** a flock sets out
- **THEN** it comes out from behind one mass of the far layer, crosses the gap nearest to where the camera looks, and goes behind the next mass
- **AND** its calls are heard from the side of the view the flock is on

#### Scenario: Flocks come now and then

- **WHEN** a flock has crossed
- **THEN** the next one sets out between 22 and 52 seconds later

#### Scenario: Wind starts with the first tap

- **WHEN** a person first taps or clicks the page
- **THEN** the wind starts, and it rises and falls with the gusts that move the plants

#### Scenario: Sound is switched off

- **WHEN** a person unticks "Sound"
- **THEN** the wind, the bird calls and the pin sounds go quiet

### Requirement: Painted things on the structure

A thing of a printed kind SHALL lie on the surface of the structure with no pin, with its flat parts on the surface and its raised parts standing out. Its depth control SHALL set how far the raised parts stand out, and its bend control SHALL curve it along its length.

#### Scenario: Sprig is placed

- **WHEN** a person chooses a sprig in the tray and taps the skull
- **THEN** the sprig's stems and leaves lie on the bone and its flowers stand out from it
- **AND** no pin shows

#### Scenario: Depth makes the flowers stand out further

- **WHEN** a person moves a sprig's depth control to its highest value
- **THEN** the flowers stand about three times as far from the bone
- **AND** the stems stay on the bone

#### Scenario: Bend curves the sprig

- **WHEN** a person moves a sprig's bend control
- **THEN** the sprig curves along its length and stays on the surface

#### Scenario: Sprigs are arranged as painted

- **WHEN** a person presses "Arrange as painted"
- **THEN** a sprig lies at each place the painting has one, on both sides of the skull

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
