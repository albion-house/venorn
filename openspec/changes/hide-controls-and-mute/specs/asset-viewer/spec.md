## ADDED Requirements

### Requirement: The controls can be hidden to look at the structure

A "Hide the controls" item in the menu, a swipe on the dock or the strip toward the edge of the screen they stand at, and the H key SHALL hide the dock, the strip and the status line, and let go of a selected thing. While they are hidden, one finger SHALL turn the camera, two fingers SHALL zoom and pan, and no press SHALL select, move, draw or place. A tap on the scene, a button that stands where the dock was, the menu's item, the H key and the Escape key SHALL bring them back.

#### Scenario: Swipe the dock away

- **WHEN** a person on a phone held upright swipes down on the dock
- **THEN** the dock, the strip and the status line are gone
- **AND** a button to bring them back stands where the dock was
- **AND** the chosen category is the same as before the swipe

#### Scenario: Look at the skull

- **WHEN** the controls are hidden and a person drags across the skull and pinches over it
- **THEN** the camera turns and zooms
- **AND** nothing is placed, selected or drawn

#### Scenario: Hide with a thing selected

- **WHEN** a thing is selected and a person swipes down on the strip
- **THEN** the controls are hidden and nothing is selected
- **AND** the thing is where it was

#### Scenario: Bring the controls back

- **WHEN** the controls are hidden and a person taps the skull
- **THEN** the dock, the strip and the status line are back
- **AND** no thing is placed

#### Scenario: Phone on its side

- **WHEN** a person holds a phone on its side and swipes the dock toward the right edge
- **THEN** the controls are hidden and the button that brings them back stands at the lower right

### Requirement: A mute button

A button at the top of the screen, and the M key, SHALL switch every sound off and on. The button SHALL show whether the sound is off. The choice SHALL be kept for the next visit.

#### Scenario: Mute

- **WHEN** a person presses the mute button
- **THEN** every sound goes quiet and the button shows the sound is off

#### Scenario: Muted on the next visit

- **WHEN** a person who muted the sound opens the game again
- **THEN** the button shows the sound is off and no sound plays

#### Scenario: Done beside the mute button

- **WHEN** a thing is selected
- **THEN** Done stands beside the mute button and neither covers the other or the status line

## MODIFIED Requirements

### Requirement: Living scene

The floating layer SHALL drift slowly around the scene while its parts flow their own ways, so its shapes change. A sun SHALL circle the sky, and the light and the shadows SHALL follow it. Now and then a flock of birds SHALL cross a gap between the masses of the far layer, calling as it goes. A wind SHALL sound from the first tap, click or key press, louder in the meadow's gusts. The mute button SHALL switch every sound off and on.

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

- **WHEN** a person presses the mute button
- **THEN** the wind, the clouds, the bird calls and the pin sounds go quiet
