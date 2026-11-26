## ADDED Requirements

### Requirement: Painted things on the structure

A thing of a printed kind SHALL lie on the surface of the structure with no pin, with its flat parts on the surface and its raised parts standing out. Its depth control SHALL set how far the raised parts stand out, and its bend control SHALL curve it along its length.

#### Scenario: Sprig is placed

- **WHEN** a person chooses a sprig in the tray and taps the skull
- **THEN** the sprig's stems and leaves lie on the bone and its flowers stand out from it
- **AND** no pin shows

#### Scenario: Depth makes the flowers stand out further

- **WHEN** a person moves a sprig's depth control to its highest value
- **THEN** the flowers stand about three times as far from the bone
- **AND** the stems stay on the bone

#### Scenario: Bend curves the sprig

- **WHEN** a person moves a sprig's bend control
- **THEN** the sprig curves along its length and stays on the surface

#### Scenario: Sprigs are arranged as painted

- **WHEN** a person presses "Arrange as painted"
- **THEN** a sprig lies at each place the painting has one, on both sides of the skull
