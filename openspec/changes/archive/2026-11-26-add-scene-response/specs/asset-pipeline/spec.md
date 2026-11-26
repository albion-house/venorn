## ADDED Requirements

### Requirement: Named places on the structure

A source SHALL be able to declare features of its structure, each with an id, a prompt for the detector and a shape that is a hollow or a spike. The pipeline SHALL look for each feature on the bare structure and SHALL write those it finds to the manifest's structure entry, in the structure's model units: a hollow by its middle and its radius, and a spike by its tip and its base. A feature that is not found SHALL be left out, and the pipeline SHALL say so and carry on.

#### Scenario: Socket and horn are found

- **WHEN** the pipeline runs on the `veneration-ornamentation` source
- **THEN** the manifest lists a hollow named `socket` inside the skull's outline
- **AND** it lists a spike named `horn` whose tip is the highest point of the structure and whose base is near the middle of the skull

#### Scenario: Detector answers with the whole structure

- **WHEN** the detector's best box for a feature covers more than six tenths of the structure
- **THEN** that box is not used for the feature

#### Scenario: Feature is not found

- **WHEN** the detector finds nothing for a declared feature
- **THEN** the manifest leaves that feature out
- **AND** the rest of the pipeline runs as before

#### Scenario: Shape is not known

- **WHEN** a source declares a feature with a shape other than hollow or spike
- **THEN** the pipeline stops and names the shapes it knows
