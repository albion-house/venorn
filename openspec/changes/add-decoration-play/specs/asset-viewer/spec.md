## REMOVED Requirements

### Requirement: Removing a pinned thing

**Reason**: Holding a finger on a thing was hard to discover and went off by accident while a thing was being dragged.

**Migration**: "Removing a thing" keeps the right click and adds the wheel's Remove button and the Delete key.

## MODIFIED Requirements

### Requirement: Asset set is shown

The viewer SHALL load an asset set's manifest and show the bare structure with nothing on it. It SHALL show a dock with one button for each category in the manifest, and a strip with a preview of each model in the chosen category.

#### Scenario: Viewer opens after an export

- **WHEN** a person opens the viewer after the pipeline has exported the `veneration-ornamentation` asset set
- **THEN** the bare skull appears with nothing on it
- **AND** the dock shows five categories, numbered 1 to 5, with the first one chosen
- **AND** the strip shows a preview of each butterfly

### Requirement: Pinning with a tap

A tap or click on the structure SHALL pin the chosen variation of the chosen category at that spot, on any side of the structure, at its natural size, facing along the surface. The new thing SHALL be selected. A pinned thing SHALL stand off the surface on its pin and cast a shadow. A pin sound SHALL play, and the pin head of a pinned thing SHALL throb.

#### Scenario: Candy is pinned

- **WHEN** a person chooses the candies and taps the skull
- **THEN** a candy appears at the tapped spot, raised on a gold pin, with its shadow on the skull
- **AND** the candy is selected
- **AND** a pin sound plays

#### Scenario: Drag is not a tap

- **WHEN** a person presses the skull, drags and releases
- **THEN** the camera turns and nothing is pinned

#### Scenario: Candy is pinned to the far side

- **WHEN** a person turns the camera to the far side of the skull and taps it
- **THEN** the chosen model is pinned there, facing away from the skull

### Requirement: Adjustments stay within the criteria

The design bar SHALL offer one chip for each adjustment the selected thing's criteria allow, and one slider for the chosen chip, limited to the allowed range. An adjustment the criteria fix at one value SHALL have no chip. A gesture or a key that changes an adjustment SHALL stop at the same limits.

#### Scenario: Pinned candy is selected

- **WHEN** a person opens the design bar on a pinned candy
- **THEN** chips appear for size, turn, color, lift, tilt, depth, wrap and mirror
- **AND** no chip appears for fold or bend

#### Scenario: Printed flower is selected

- **WHEN** a person opens the design bar on a thing of a printed kind, such as a sprig
- **THEN** chips appear for size, turn, color, depth, bend and mirror
- **AND** no chip appears for lift, tilt or wrap

#### Scenario: Pinned butterfly is selected

- **WHEN** a person opens the design bar on a pinned butterfly
- **THEN** a fold chip appears with the candy's chips

#### Scenario: Depth presses a thing flat

- **WHEN** a person moves a thing's depth slider to its lowest value
- **THEN** the thing becomes nearly flat

#### Scenario: Color turns a thing's colors

- **WHEN** a person moves a red butterfly's color slider a third of the way around the color wheel
- **THEN** the butterfly's wings change hue and keep their lightness

#### Scenario: Pinch stops at the largest size

- **WHEN** a person keeps spreading two fingers on the selected thing
- **THEN** the thing stops growing at the largest scale its criteria allow

### Requirement: Touch and mouse

The viewer SHALL be usable with touch and with a mouse. The dock and the strip SHALL sit along the bottom edge at every window size, and the strip SHALL scroll sideways when its variations do not fit. The design bar SHALL leave the selected thing in view.

#### Scenario: Viewer on a phone-sized screen

- **WHEN** the viewer is opened in a window narrower than 640 pixels
- **THEN** the dock and the strip run along the bottom edge
- **AND** a tap on the skull pins the chosen model
- **AND** the open design bar covers less than a fifth of the window's height

### Requirement: Free camera

The camera SHALL turn all the way around the structure and up over it. It SHALL zoom in toward the point under the pointer until a single pinned thing fills the view, and SHALL pan. A "Front view" control SHALL return it to the view of the painting, and a "Rear view" control SHALL show the far side straight on.

#### Scenario: Person turns to the far side

- **WHEN** a person drags sideways until the camera has turned half way around
- **THEN** the far side of the skull is in view

#### Scenario: Person asks for the rear view

- **WHEN** a person presses "Rear view"
- **THEN** the camera looks straight at the far side of the skull from the front view's distance

#### Scenario: Person zooms in

- **WHEN** a person scrolls or pinches inward away from the selected thing
- **THEN** the camera moves toward the point under the pointer

#### Scenario: Person pans

- **WHEN** a person drags with the right mouse button or drags with two fingers away from the selected thing
- **THEN** the view moves sideways without turning

#### Scenario: Camera stays above the ground and inside the scene

- **WHEN** a person drags downward or zooms out as far as the camera goes
- **THEN** the camera stops a few degrees below level and inside the layers wrapped around the scene

## ADDED Requirements

### Requirement: Categories and variations

A dock button or a number key SHALL choose a category, and the strip SHALL then show that category's variations. A strip button or the left and right arrow keys SHALL choose a variation. With a thing selected, choosing a category or a variation SHALL change that thing into the chosen model where it is, keeping its size, turn, color and mirroring as far as the new model's criteria allow.

#### Scenario: Key chooses a category

- **WHEN** a person with nothing selected presses `3`
- **THEN** the third category is marked in the dock and the strip shows its variations
- **AND** the next tap on the skull places a thing of that category

#### Scenario: Arrow key steps through variations

- **WHEN** a person presses the right arrow key at the last variation of a category
- **THEN** the first variation is chosen

#### Scenario: Selected thing changes category

- **WHEN** a person selects a butterfly and presses `3`
- **THEN** the butterfly becomes a pill at the same spot
- **AND** the count of things on the skull stays the same

#### Scenario: Selected thing keeps its size

- **WHEN** a person doubles a thing's size and then chooses another variation
- **THEN** the new model is at twice its natural size

### Requirement: Selected thing

One thing at most SHALL be selected, and a ring SHALL mark it while it is in view. Placing a thing or tapping a placed thing SHALL select it, and the dock and the strip SHALL then show its category and variation. A tap that lands just beside a small thing SHALL count as a tap on it. A tap away from the structure or the Escape key SHALL clear the selection.

#### Scenario: Dock follows the selection

- **WHEN** a person with the butterflies chosen taps a placed jewel
- **THEN** the jewels are marked in the dock and that jewel's variation is marked in the strip

#### Scenario: Tap beside a small thing

- **WHEN** a person taps 10 pixels from the middle of a placed thing that is 30 pixels across
- **THEN** that thing is selected and nothing new is placed

#### Scenario: Tap on the sky

- **WHEN** a person taps the sky
- **THEN** nothing is selected and the ring is gone

#### Scenario: Selected thing is on the far side

- **WHEN** the camera turns until the skull hides the selected thing
- **THEN** the ring is not drawn

### Requirement: Gestures on the selected thing

A drag that starts on the selected thing SHALL move it over the structure's surface. A pinch near it or a scroll over it SHALL resize it. A twist near it, or a scroll over it with Shift or Alt held, SHALL turn it. The camera SHALL stay still during these gestures. A drag that starts anywhere else SHALL move the camera. The up and down arrow keys SHALL resize the selected thing, and `[` and `]` SHALL turn it.

#### Scenario: Drag moves the selected thing

- **WHEN** a person drags the selected thing across the skull
- **THEN** the thing follows the pointer over the surface and faces along the surface where it stops
- **AND** the camera has not moved

#### Scenario: Drag on another thing turns the camera

- **WHEN** a person drags starting on a placed thing that is not selected
- **THEN** the camera turns and the thing stays where it was

#### Scenario: Scroll resizes

- **WHEN** a person scrolls up over the selected thing
- **THEN** the thing grows and the camera does not zoom

#### Scenario: Shift and scroll turn

- **WHEN** a person scrolls over the selected thing with Shift held
- **THEN** the thing turns and keeps its size

#### Scenario: Pinch and twist

- **WHEN** a person puts two fingers on the selected thing, spreads them and twists them clockwise
- **THEN** the thing grows by the ratio the fingers spread and turns clockwise by the angle they twisted

### Requirement: Adjustment wheel

Tapping a placed thing SHALL open a wheel of four buttons around it: Kind, Variation, Design and Remove. Kind SHALL change the thing to the next category, and Variation to the next variation of its category. Design SHALL open or close the design bar. The whole wheel SHALL stay on the screen, and it SHALL hide while the thing is dragged, pinched or twisted. Placing a thing SHALL NOT open the wheel.

#### Scenario: Tap opens the wheel

- **WHEN** a person taps a placed thing
- **THEN** four buttons appear above, right of, below and left of the thing

#### Scenario: Kind steps to the next category

- **WHEN** a person presses Kind on a pill's wheel
- **THEN** the pill becomes a jewel at the same spot

#### Scenario: Thing near the edge of the screen

- **WHEN** the selected thing is at the edge of the screen
- **THEN** all four buttons are inside the screen

#### Scenario: Thing is placed

- **WHEN** a person taps a bare part of the skull
- **THEN** the new thing has a ring and no wheel

### Requirement: Removing a thing

A right click on a placed thing SHALL remove it. The wheel's Remove button SHALL remove the selected thing, and so SHALL the Delete key and the Backspace key. A sound SHALL play when a thing is removed.

#### Scenario: Right click removes a thing

- **WHEN** a person right-clicks a placed thing
- **THEN** the thing is removed and no browser menu opens

#### Scenario: Right drag pans

- **WHEN** a person presses the right mouse button on a placed thing, drags and releases
- **THEN** the view pans and the thing stays

#### Scenario: Remove on the wheel

- **WHEN** a person taps a placed thing and presses Remove
- **THEN** the thing is removed and the wheel closes

### Requirement: Menu of views and switches

"Front view", "Rear view", "Arrange as painted", "Clear", "Painted skull" and "Sound" SHALL sit in a menu that one button opens and closes.

#### Scenario: Menu is opened

- **WHEN** a person presses the menu button
- **THEN** the six controls appear

#### Scenario: View is chosen

- **WHEN** a person presses "Rear view" in the menu
- **THEN** the camera moves to the rear view and the menu closes
