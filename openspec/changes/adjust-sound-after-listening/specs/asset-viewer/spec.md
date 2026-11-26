## MODIFIED Requirements

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
- **THEN** the forest and the wrapped layer of clouds are behind the skull from every side

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
- **THEN** the wind, the clouds, the bird calls and the pin sounds go quiet

## ADDED Requirements

### Requirement: Gusts of wind

Gusts SHALL come at uneven times and with uneven strength, each picking up and dying away, with lulls between them. The plants SHALL sway and the wind SHALL sound with the same gusts. In a gust the wind SHALL whistle higher and pass from one side to the other.

#### Scenario: Gusts come and go

- **WHEN** a few minutes pass
- **THEN** several gusts pick up and die away, some stronger than others and at uneven times
- **AND** between them are spells when the wind is low and the plants barely move

#### Scenario: Gust picks up

- **WHEN** a gust picks up
- **THEN** the wind's whistle rises in pitch as the plants bend further

### Requirement: Sound carries on in a background tab

While the page is hidden, the things' music, the wind's gusts and the clouds' sounds SHALL carry on as they do while it is shown, at the same levels. When the page is shown again, the notes SHALL carry on from where they are, without a crowd of notes at once.

#### Scenario: Person switches to another tab

- **WHEN** a person with things on the skull switches to another tab
- **THEN** the things' notes keep coming at about the same rate, and as loud against the wind as before

#### Scenario: Page is not drawn

- **WHEN** a script stops the page drawing with `window.venorn.hold(true)`
- **THEN** the things' notes keep starting

#### Scenario: Person comes back

- **WHEN** the person comes back to the tab
- **THEN** the things swell and the lines draw with the notes that start from then on

### Requirement: Clouds at different depths

When the asset set has a floating layer, the viewer SHALL cut pieces from its picture and stand them at two more depths: a near bank around the structure and a middle bank between the structure and the far layer. From the front view some pieces of the near bank SHALL be in front of the structure and some behind it. The banks SHALL go slowly around the scene at their own paces, the middle bank the other way from the near one. A piece SHALL fade as the camera comes close to it.

#### Scenario: Front view

- **WHEN** the viewer opens on the `veneration-ornamentation` asset set
- **THEN** clouds stand in front of the top of the skull, behind it, and farther back against the forest

#### Scenario: Camera turns

- **WHEN** a person turns the camera a few degrees
- **THEN** the near clouds move across the skull, and the near, middle and far clouds shift by different amounts

#### Scenario: Camera flies into a cloud

- **WHEN** the camera goes into a cloud of the near bank
- **THEN** the cloud fades and the view stays clear

### Requirement: Sounds of the clouds

Each layer of clouds SHALL have a sound of its own, from the first tap, click or key press: the wrapped layer a low hush heard the same everywhere, the middle bank a soft chord, and each piece of the near bank a high whistle heard from where the piece is. From the front view each cloud sound SHALL be quieter than a thing's note.

#### Scenario: Near cloud passes in front

- **WHEN** a piece of the near bank passes in front of the skull
- **THEN** its whistle passes from one side to the other

#### Scenario: Camera nears a cloud

- **WHEN** the camera comes close to a piece of the near bank
- **THEN** its whistle is louder than it was from the front view
