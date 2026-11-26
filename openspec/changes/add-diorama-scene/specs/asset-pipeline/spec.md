## MODIFIED Requirements

### Requirement: Models of the structure and of each kind

The pipeline SHALL write a GLB model of the bare structure, and a GLB model for as many instances of each kind as the source declares. Every model of a pinned kind and the model of the structure SHALL be closed, so it can be seen from any side. Every model SHALL have a longer side of one unit and its front facing +z. A kind's model SHALL rest its back on the plane z = 0 with its anchor at the origin.

#### Scenario: Models are written for the declared exemplars

- **WHEN** the lift stage runs on a source that declares two exemplars of a kind
- **THEN** two GLB models of that kind exist
- **AND** each model is one unit long on its longer side

#### Scenario: Exemplars of one kind differ

- **WHEN** a kind has instances of several colors and the source declares more than one exemplar
- **THEN** the models chosen for the kind differ in color

#### Scenario: Each part is as deep as it is wide

- **WHEN** the lift stage runs on the `veneration-ornamentation` source
- **THEN** a capsule's model has a round cross-section
- **AND** the skull's horn is about as deep as it is wide along its whole length

#### Scenario: Structure has a far side

- **WHEN** the skull's model is looked at from behind
- **THEN** it shows a far side that mirrors the near side

### Requirement: Adjustment criteria for each model

Every model of a kind SHALL have a criteria file that validates against the adjustment schema. The file SHALL state the model's natural size relative to the structure, how it attaches, and the range allowed for scale, spin, standoff, tilt, depth, conform, bend and mirror. A kind that declares a fold SHALL have a fold range as well.

#### Scenario: Pinned kind

- **WHEN** a kind is declared with the role `pinned`
- **THEN** its criteria attach the model with a visible pin and stand it off the surface by default
- **AND** its criteria turn bending off

#### Scenario: Printed kind

- **WHEN** a kind is declared with the role `printed`
- **THEN** its criteria place the model in the surface with no pin and no standoff
- **AND** its criteria allow bending along a cubic Bezier curve

#### Scenario: Kind overrides a default

- **WHEN** a source declares an adjustment or attachment value for a kind
- **THEN** that value replaces the role's default for that field
- **AND** every other field keeps the role's default

#### Scenario: Butterfly folds its wings

- **WHEN** the `veneration-ornamentation` source declares a fold for the butterfly kind
- **THEN** a butterfly's criteria carry the declared fold range
- **AND** a candy's criteria carry no fold

### Requirement: Asset set with a manifest

The pipeline SHALL export one source's models, criteria, preview pictures and scene layers to one directory with a manifest. The manifest SHALL list the structure, the kinds with their models, an arrangement, and the scene. The arrangement SHALL give the position, size and angle of each cataloged instance in the structure's model units.

#### Scenario: Asset set is exported

- **WHEN** the export stage runs
- **THEN** the game client's asset directory holds the manifest and every file the manifest names
- **AND** every criteria file in the set validates against the adjustment schema

#### Scenario: Scene is exported

- **WHEN** the export stage runs on a source that declares a scene
- **THEN** the manifest lists each layer with its picture, its edges in the structure's model units and its distance from the structure
- **AND** the manifest gives the backdrop's colors by height and the level and color of the ground

## ADDED Requirements

### Requirement: Scene layers

For a source that declares a scene, the pipeline SHALL split the image around the structure into a ground layer, a floating layer, a far layer and a backdrop. The far layer SHALL carry on behind the floating layer, the structure and the ground. The pipeline SHALL write a picture of the layers for a person to check.

#### Scenario: Painting is split into layers

- **WHEN** the layers stage runs on the `veneration-ornamentation` source
- **THEN** the meadow, the clouds and the forest are each written as a picture with a transparent surround
- **AND** the sky is described as a gradient from its top color down to its horizon color

#### Scenario: Flat sky stays out of the clouds

- **WHEN** a flat area of sky has a different color from the rest of its row
- **THEN** it belongs to the backdrop

#### Scenario: Forest has no hole where the skull was

- **WHEN** the forest layer is looked at alone
- **THEN** the forest fills the area the skull, the horn and the meadow covered in the painting

#### Scenario: Source declares no scene

- **WHEN** the layers stage runs on a source with no scene
- **THEN** the stage reports that and the build carries on
