## ADDED Requirements

### Requirement: Turning the view with the pen chosen

With the pen chosen, the strip SHALL hold a button that turns the view. While it is pressed, a drag with one finger or the mouse SHALL turn the camera wherever it starts, including on the structure, and SHALL draw nothing. Choosing an ink or choosing the pen again SHALL release the button and bring drawing back.

#### Scenario: Skull fills a phone's screen

- **WHEN** a person with the pen chosen and the skull filling a phone's screen presses the strip's button for turning the view and drags across the skull with one finger
- **THEN** the camera turns
- **AND** no glitter is drawn

#### Scenario: Back to drawing

- **WHEN** a person who has pressed the button for turning the view chooses an ink and drags across the skull
- **THEN** a stroke of that ink is drawn and the camera stays still

### Requirement: Color turns the colored parts

The color adjustment SHALL turn the hue of a thing's colored parts. Parts that are much darker than the thing's own colors, and parts that are nearly grey, SHALL keep their color. A thing whose colors are all dark, such as a dark green bead, SHALL still turn.

#### Scenario: Butterfly's body keeps its color

- **WHEN** a person turns a red butterfly's color halfway around the color wheel
- **THEN** the wings turn blue-green
- **AND** the dark red body and the dark rims of the wings keep their color

#### Scenario: Dark bead turns

- **WHEN** a person turns a dark green bead's color a third of the way around the color wheel
- **THEN** the bead's green turns to another hue and its white highlight stays white

### Requirement: Rabbit in the light of the scene

The rabbit SHALL be lit by the sun and the sky in the way the paper meadow is lit. It SHALL take on the sun's color, and SHALL be darker when the sun is behind it.

#### Scenario: Sun low behind the skull

- **WHEN** a rabbit comes out at dusk while the camera looks at the skull from the front and the sun is low behind the skull
- **THEN** the rabbit is darker than a rabbit that comes out at midday

#### Scenario: Low sun on the rabbit

- **WHEN** a rabbit comes out at dusk on the side of the skull that the low sun shines on
- **THEN** the rabbit takes on the sun's orange

### Requirement: Layers whose ends join repeat as they are

The viewer SHALL repeat a layer that the manifest marks as joining at its ends as plain copies around the scene, with no copy mirrored. A layer without the mark SHALL repeat with every second copy mirrored, as before.

#### Scenario: Forest beside the painting

- **WHEN** the viewer opens on the `veneration-ornamentation` asset set built after this change and the camera turns a little to one side
- **THEN** the forest carries on past the edge of the painting with no tree beside its own mirror image

#### Scenario: Asset set built before this change

- **WHEN** the viewer opens an asset set whose layers carry no mark
- **THEN** the forest and the meadow repeat mirrored, as they did before
