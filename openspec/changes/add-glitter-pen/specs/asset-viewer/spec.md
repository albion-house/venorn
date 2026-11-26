## ADDED Requirements

### Requirement: Glitter pen in the dock

The dock SHALL hold a glitter pen after the categories, chosen by its button or by the next number key. With the pen chosen, the strip SHALL show the pen's inks and a button that takes back the last stroke, and nothing SHALL be selected. The left and right arrow keys SHALL step through the inks.

#### Scenario: Pen is chosen with a key

- **WHEN** a person presses `6` in the viewer of the `veneration-ornamentation` asset set
- **THEN** the pen is marked in the dock
- **AND** the strip shows gold, silver, rose, aqua, violet and rainbow inks and a button to take back a stroke

#### Scenario: Thing was selected

- **WHEN** a person chooses the pen while a thing is selected
- **THEN** the thing stays as it is and is no longer selected

#### Scenario: Kind on the wheel

- **WHEN** a person presses Kind on a thing's wheel again and again
- **THEN** the thing goes through the categories of things and never becomes the pen

### Requirement: Drawing on the structure

With the pen chosen, a drag that starts on the structure SHALL draw a stroke of the chosen ink that follows the surface under the pointer, on any side of the structure, and SHALL NOT turn the camera. A tap on the structure SHALL leave a dot. A drag that starts off the structure SHALL turn the camera and draw nothing. A second finger SHALL end the stroke, and the two fingers SHALL zoom and pan.

#### Scenario: Stroke across the cheek

- **WHEN** a person with the pen chosen drags across the skull's cheek
- **THEN** a line of glitter lies on the bone along the path of the pointer
- **AND** the camera has not moved

#### Scenario: Drag from the sky

- **WHEN** a person with the pen chosen drags starting on the sky
- **THEN** the camera turns and no stroke is drawn

#### Scenario: Rainbow ink

- **WHEN** a person draws a long stroke with the rainbow ink
- **THEN** the stroke's color runs through the rainbow along its length

#### Scenario: Stroke on the far side

- **WHEN** a person turns the camera to the far side of the skull and draws
- **THEN** the stroke lies on the far side and does not appear on the near side

### Requirement: Glitter catches the light

A stroke SHALL be made of small flecks of the ink's color in differing brightness. Flecks SHALL flash as the camera or the sun moves, and some SHALL twinkle with the camera still.

#### Scenario: Camera moves past a stroke

- **WHEN** the camera moves to one side of a stroke
- **THEN** different flecks flash than before

### Requirement: Taking strokes back

The strip's button and the `Z` key SHALL take back the last stroke while the pen is chosen. "Clear" SHALL remove every stroke along with every thing.

#### Scenario: Last stroke is taken back

- **WHEN** a person draws two strokes and presses `Z`
- **THEN** the second stroke is gone and the first remains

#### Scenario: Nothing to take back

- **WHEN** a person presses `Z` with no strokes drawn
- **THEN** the status line says there is no stroke to take back

#### Scenario: Skull is cleared

- **WHEN** a person presses "Clear"
- **THEN** the strokes and the things are all removed
