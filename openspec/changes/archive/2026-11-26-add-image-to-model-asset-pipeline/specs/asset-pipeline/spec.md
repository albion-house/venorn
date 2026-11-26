## Purpose

Turn a declared source image into the 3D models the game shows, each with the criteria the game needs to place and adjust it.

## ADDED Requirements

### Requirement: Declared source image

A source SHALL be declared in one file that names the image by URL and checksum, the structure that things are pinned to, and each kind of thing to look for. The pipeline SHALL refuse an image whose checksum differs from the declared one.

#### Scenario: Image matches its checksum

- **WHEN** the fetch stage downloads an image whose checksum equals the declared checksum
- **THEN** the image is stored in the pipeline's cache

#### Scenario: Image differs from its checksum

- **WHEN** the fetch stage downloads an image whose checksum differs from the declared checksum
- **THEN** the pipeline stops and reports both checksums
- **AND** nothing is stored in the cache

### Requirement: Catalog of the things in the image

The pipeline SHALL record the outline of the structure and, for every instance it finds of a declared kind, the instance's kind, outline, position, size and long-axis angle. It SHALL write a picture that marks what it found, for a person to check.

#### Scenario: Painting is cataloged

- **WHEN** the catalog stage runs on the `veneration-ornamentation` source
- **THEN** the catalog names the skull as the structure
- **AND** the catalog lists instances of butterfly, candy, capsule, bead and flower
- **AND** an overlay picture shows a labeled box around each instance

### Requirement: Bare structure

The pipeline SHALL produce the structure twice: as painted, and bare, with the things on it cleared and the cleared areas filled from the surface around them.

#### Scenario: Things are cleared from the skull

- **WHEN** the isolate stage runs on the `veneration-ornamentation` source
- **THEN** a painted cutout and a bare cutout of the skull exist with the same outline
- **AND** the bare cutout shows bone where the painted cutout shows a cataloged instance

### Requirement: Models of the structure and of each kind

The pipeline SHALL write a GLB model of the bare structure, and a GLB model for as many instances of each kind as the source declares. Every model SHALL have a longer side of one unit, its anchor at the origin and its front facing +z.

#### Scenario: Models are written for the declared exemplars

- **WHEN** the lift stage runs on a source that declares two exemplars of a kind
- **THEN** two GLB models of that kind exist
- **AND** each model is one unit long on its longer side

#### Scenario: Exemplars of one kind differ

- **WHEN** a kind has instances of several colors and the source declares more than one exemplar
- **THEN** the models chosen for the kind differ in color

### Requirement: Adjustment criteria for each model

Every model of a kind SHALL have a criteria file that validates against the adjustment schema. The file SHALL state the model's natural size relative to the structure, how it attaches, and the range allowed for scale, spin, standoff, tilt, conform, bend and mirror.

#### Scenario: Pinned kind

- **WHEN** a kind is declared with the role `pinned`
- **THEN** its criteria attach the model with a visible pin and allow a standoff above the surface
- **AND** its criteria turn bending off

#### Scenario: Printed kind

- **WHEN** a kind is declared with the role `printed`
- **THEN** its criteria place the model in the surface with no pin and no standoff
- **AND** its criteria allow bending along a cubic Bezier curve

#### Scenario: Kind overrides a default

- **WHEN** a source declares an adjustment value for a kind
- **THEN** that value replaces the role's default for that field
- **AND** every other field keeps the role's default

### Requirement: Asset set with a manifest

The pipeline SHALL export one source's models, criteria and preview pictures to one directory with a manifest. The manifest SHALL list the structure, the kinds with their models, and an arrangement: the position, size and angle of each cataloged instance in the structure's model units.

#### Scenario: Asset set is exported

- **WHEN** the export stage runs
- **THEN** the game client's asset directory holds the manifest and every file the manifest names
- **AND** every criteria file in the set validates against the adjustment schema

### Requirement: Stages run alone or together

Each stage SHALL be a mise task that reads the files the stage before it wrote. One task SHALL run every stage in order.

#### Scenario: One stage is rerun

- **WHEN** a person changes a kind's thickness in the source declaration and runs the lift and export tasks
- **THEN** new models are written from the existing catalog and cutouts

#### Scenario: Every stage runs from a clean checkout

- **WHEN** a person runs the build task with no cached source image and no earlier output
- **THEN** the image is downloaded and an asset set is exported

### Requirement: Default run needs no account

The pipeline's default configuration SHALL run on the developer's machine with openly licensed model weights and SHALL need no account or API key.

#### Scenario: Build with no API keys set

- **WHEN** the build task runs with no API key in the environment
- **THEN** the pipeline downloads any missing model weights and exports an asset set
