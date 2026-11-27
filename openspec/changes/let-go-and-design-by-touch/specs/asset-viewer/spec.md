## ADDED Requirements

### Requirement: Done lets go of the selected thing

While a thing is selected, a button labelled Done SHALL be on the screen. Pressing it SHALL let go of the thing and close the design bar.

#### Scenario: Done while zoomed in

- **WHEN** a person on a phone zooms in until the skull fills the screen, places a butterfly and presses Done
- **THEN** nothing is selected and the ring and the Done button are gone

### Requirement: A flick lets go of the selected thing

A flick that starts on the selected thing SHALL let go of it and leave it where it was. A slower drag that starts on it SHALL carry it over the structure as before.

#### Scenario: Flick the selected thing

- **WHEN** a person flicks a selected butterfly quickly to one side
- **THEN** nothing is selected
- **AND** the butterfly is where it was before the flick

#### Scenario: Carry the selected thing

- **WHEN** a person drags a selected butterfly slowly across the skull and stops before lifting the finger
- **THEN** the butterfly is where the finger stopped and is still selected

### Requirement: A tap with the wheel open lets go

With the selected thing's wheel open, a tap on the thing or on a bare part of the structure SHALL let go of the thing and place nothing. With the wheel closed, as after placing, a tap on a bare part of the structure SHALL place the chosen thing. A tap away from the structure and the Escape key SHALL let go as before.

#### Scenario: Tap the skull with the wheel open

- **WHEN** a person taps a placed thing to open its wheel and then taps a bare part of the skull
- **THEN** nothing is selected and no thing is placed

#### Scenario: Tap the thing again

- **WHEN** a person taps a placed thing to open its wheel and taps the thing again
- **THEN** nothing is selected

#### Scenario: Placing a row

- **WHEN** a person taps three bare spots on the skull one after another
- **THEN** three things are placed and the last one is selected

### Requirement: Camera after letting go

Once nothing is selected, a one-finger drag SHALL turn the camera and two fingers SHALL zoom it, wherever they are on the screen.

#### Scenario: Camera over the skull after letting go

- **WHEN** a person zoomed in on the skull lets go of a thing, drags one finger from where the thing is, and pinches over it
- **THEN** the camera turns and then zooms
- **AND** the thing keeps its place and its size

### Requirement: Design bar in view and large enough for a finger

Every control in the design bar SHALL be at least 44 by 44 points. On a phone 402 points wide, held upright or on its side, every setting the selected thing's criteria allow, Mirror, Reset and Close SHALL be in view without scrolling sideways.

#### Scenario: Butterfly's design bar upright

- **WHEN** a person on a phone held upright opens the design bar on a pinned butterfly
- **THEN** Size, Turn, Color, Lift, Tilt, Depth, Wrap, Fold, Mirror, Reset and Close are all in view, each at least 44 by 44 points

#### Scenario: Butterfly's design bar on a phone's side

- **WHEN** a person on a phone on its side opens the design bar on a pinned butterfly
- **THEN** the same controls are all in view in the panel at the lower left, each at least 44 by 44 points

### Requirement: Selected thing clear of the open design bar

When the design bar opens over the selected thing, the camera SHALL pan until the thing is in view clear of the bar. The bar SHALL stay where it stands.

#### Scenario: Thing on the jaw

- **WHEN** a person on a phone held upright opens the design bar on a butterfly on the jaw, in the front view
- **THEN** the butterfly and its ring are above the bar

### Requirement: Design bar shows each value

Each setting in the design bar SHALL show its current value, and the value SHALL follow every change from the slider, the step buttons, a gesture or a key.

#### Scenario: Value under the setting

- **WHEN** a person opens the design bar on a butterfly at its natural size and then pinches it larger
- **THEN** Size shows 1.00× and then the larger size

### Requirement: Design bar slider and steps

The slider SHALL answer a press anywhere along a row 44 points tall and follow the finger until it lifts. A minus and a plus button beside it SHALL step the chosen setting. With a mouse the slider SHALL answer a click and a drag, and with the keyboard the arrow keys SHALL step it. Close SHALL close the bar and keep the thing selected.

#### Scenario: Drag the slider

- **WHEN** a person puts a finger on the slider's thumb with Size chosen and drags it a third of the way along
- **THEN** the size changes by about a third of its range

#### Scenario: Step

- **WHEN** that person presses the plus button
- **THEN** the size grows to the next whole step of 0.05

#### Scenario: Mouse and keys

- **WHEN** a person on a computer clicks the slider and presses the right arrow key
- **THEN** the chosen setting steps up and the variation stays the same
