## ADDED Requirements

### Requirement: Wheel clear of the selected thing

The wheel's buttons SHALL stand outside the selected thing's ring on the screen, so that a finger on a thing whose ring is smaller than 86 pixels in radius reaches the thing and not a button. Near an edge of the screen the buttons SHALL gather on the side that has room, keep their order around the thing, and stay whole on the screen, clear of the status line, the dock, the strip and the design bar. Only in a corner with no room around the thing MAY the wheel move inward as a whole.

#### Scenario: Small thing low on a phone

- **WHEN** a person on a phone held upright taps a small thing low on the skull to open its wheel
- **THEN** no button covers the thing or its ring
- **AND** all four buttons are on the screen above the dock and the strip

#### Scenario: Pinch with the wheel open

- **WHEN** a person pinches that thing with its wheel open
- **THEN** the thing grows or shrinks and the design bar stays closed

### Requirement: A zoom with the pen leaves no glitter

With the pen chosen, a stroke SHALL be taken back when a second finger comes down within half a second of the first and before the first has gone 20 pixels. The two fingers SHALL zoom and pan. The saved skull SHALL NOT keep the stroke. A stroke that has gone further or lasted longer SHALL stay when a second finger ends it.

#### Scenario: Pinch to zoom on the skull

- **WHEN** a person with the pen chosen puts two fingers on the skull and spreads them
- **THEN** the camera zooms
- **AND** no glitter is left where the first finger landed, on the skull or in the saved skull

#### Scenario: Stroke before a zoom

- **WHEN** a person draws a stroke with one finger and then puts down a second finger to zoom
- **THEN** the stroke stays

### Requirement: Status line follows the selection

When the selected thing is let go, the status line SHALL say what it says when the chosen category is picked with nothing selected. A message about what just happened, such as a thing removed, SHALL replace it.

#### Scenario: Tap off the skull

- **WHEN** a person places a thing and then taps the sky
- **THEN** the status line no longer says how to drag, pinch and twist the thing
- **AND** it says how to place a thing of the chosen category

### Requirement: Clouds above the painting's top

Where the asset set has a floating layer of clouds that flows, the viewer SHALL show painted clouds above the top of its picture, so that a tall screen sees no band of bare sky above the clouds when the camera turns or tilts. A wide screen's front view SHALL look as it did.

#### Scenario: Tall screen, camera turned and tilted

- **WHEN** a person on a phone held upright turns the camera with one finger and tilts it to look up
- **THEN** clouds reach the top of the screen

#### Scenario: Wide screen from the front

- **WHEN** the viewer opens on a 1280 by 800 window
- **THEN** the front view looks as it did before this change

### Requirement: Controls clear of a notch

The menu button, the menu and the status line SHALL stay inside the screen's safe area at the left and the right. Where the safe area reaches the edges, as on a phone held upright and on a computer, they SHALL keep their places.

#### Scenario: Phone on its side

- **WHEN** a person turns a phone with a Dynamic Island on its side, either way
- **THEN** the menu button and the status line are clear of the island

#### Scenario: Phone held upright

- **WHEN** a person holds the same phone upright
- **THEN** the menu button and the status line are where they were before this change
