## REMOVED Requirements

### Requirement: Front view with a small turn

**Reason**: codekiln asked for the camera to turn all the way around a fully 3D skull.

**Migration**: The "Free camera" requirement replaces it. The "Front view" button returns to the view this requirement described.

### Requirement: Printed things follow the surface

**Reason**: Following the surface is now an adjustment any thing can have, on any side of the structure.

**Migration**: The "Wrapped things follow the surface" requirement replaces it.

## MODIFIED Requirements

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

The camera SHALL turn all the way around the structure and up over it. It SHALL zoom in toward the point under the pointer until a single pinned thing fills the view, and SHALL pan. A "Front view" control SHALL return it to the view of the painting.

#### Scenario: Person turns to the far side

- **WHEN** a person drags sideways until the camera has turned half way around
- **THEN** the far side of the skull is in view

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

The floating layer SHALL drift slowly around the scene. A sun SHALL circle the sky, and the light and the shadows SHALL follow it. Birds SHALL fly behind the far layer. A "Cloud sound" control SHALL switch a quiet wind on and off.

#### Scenario: Clouds drift

- **WHEN** a minute passes
- **THEN** the clouds have moved sideways against the forest

#### Scenario: Shadows follow the sun

- **WHEN** the sun has moved
- **THEN** the shadows of the skull and of the pinned things have moved with it

#### Scenario: Cloud sound is switched on

- **WHEN** a person ticks "Cloud sound"
- **THEN** a quiet wind fades in
