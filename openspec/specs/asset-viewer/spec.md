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

### Requirement: Front view with a small turn

The camera SHALL face the structure from the front. It SHALL turn at most 8 degrees to either side and at most 4 degrees up or down.

#### Scenario: Person drags as far as the camera goes

- **WHEN** a person drags across the scene past the camera's limit
- **THEN** the camera stops turning at the limit
- **AND** the back of the structure stays out of view

### Requirement: Pinning with a tap

A tap or click on the structure SHALL pin the model chosen in the tray at that spot, at its natural size, facing along the surface. A pin sound SHALL play, and the pin head of a pinned thing SHALL throb.

#### Scenario: Candy is pinned

- **WHEN** a person chooses a candy in the tray and taps the skull
- **THEN** the candy appears at the tapped spot with a gold pin head
- **AND** a pin sound plays

#### Scenario: Drag is not a tap

- **WHEN** a person presses the skull, drags and releases
- **THEN** the camera turns and nothing is pinned

### Requirement: Adjustments stay within the criteria

Selecting a pinned thing SHALL offer a control for each adjustment its criteria allow, limited to the allowed range. An adjustment the criteria fix at one value SHALL have no control.

#### Scenario: Pinned candy is selected

- **WHEN** a person taps a pinned candy
- **THEN** controls appear for size, turn, lift, tilt, wrap and mirror
- **AND** no control appears for bend

#### Scenario: Printed flower is selected

- **WHEN** a person taps a printed flower
- **THEN** controls appear for size, turn, bend and mirror
- **AND** no control appears for lift, tilt or wrap

### Requirement: Printed things follow the surface

A printed thing SHALL lie on the surface of the structure across its whole area and SHALL keep its shape as seen from the front.

#### Scenario: Flower is printed across a ridge

- **WHEN** a person places a printed flower where the skull's surface changes height
- **THEN** every part of the flower rests on the surface

### Requirement: Arrangement from the painting

The viewer SHALL place a model at every position in the manifest's arrangement, sized and turned as the arrangement records.

#### Scenario: Skull is arranged as painted

- **WHEN** a person presses "Arrange as painted"
- **THEN** one thing appears on the skull for each entry in the arrangement

### Requirement: Touch and mouse

The viewer SHALL be usable with touch and with a mouse. On a narrow screen the tray SHALL run along the bottom and scroll sideways.

#### Scenario: Viewer on a phone-sized screen

- **WHEN** the viewer is opened in a window narrower than 640 pixels
- **THEN** the tray runs along the bottom edge
- **AND** a tap on the skull pins the chosen model
