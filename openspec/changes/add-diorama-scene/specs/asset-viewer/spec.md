## REMOVED Requirements

### Requirement: Front view with a small turn

**Reason**: codekiln asked for the camera to turn all the way around a fully 3D skull.

**Migration**: The "Free camera" requirement replaces it. The "Front view" button returns to the view this requirement described.

### Requirement: Printed things follow the surface

**Reason**: Following the surface is now an adjustment any thing can have, on any side of the structure.

**Migration**: The "Wrapped things follow the surface" requirement replaces it.

## MODIFIED Requirements

### Requirement: Arrangement from the painting

The viewer SHALL place a model at every position in the manifest's arrangement, sized and turned as the arrangement records, and SHALL place its mirror image at the matching position on the far side of the structure.

#### Scenario: Skull is arranged as painted

- **WHEN** a person presses "Arrange as painted"
- **THEN** one thing appears on the near side of the skull for each entry in the arrangement
- **AND** its mirror image appears on the far side

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

## ADDED Requirements

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
