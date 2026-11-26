## ADDED Requirements

### Requirement: Categories of kinds

A source SHALL group its kinds into named categories, in the order a player chooses them. Every kind SHALL be in exactly one category. A source that declares no categories SHALL get one category for each kind.

#### Scenario: Painting has five categories

- **WHEN** the `veneration-ornamentation` source is loaded
- **THEN** its categories are butterflies, candies, pills, jewels and flowers, in that order
- **AND** the flowers category holds the flower kind and the sprig kind

#### Scenario: Kind is left out of every category

- **WHEN** a source declares categories that leave one of its kinds out
- **THEN** the pipeline stops and says that every kind has to be in one category

## MODIFIED Requirements

### Requirement: Adjustment criteria for each model

Every model of a kind SHALL have a criteria file that validates against the adjustment schema. The file SHALL state the model's natural size relative to the structure, how it attaches, and the range allowed for scale, spin, standoff, tilt, depth, hue, conform, bend and mirror. A kind that declares a fold SHALL have a fold range as well.

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

#### Scenario: Colors can be turned

- **WHEN** criteria are written for a model of either role
- **THEN** they carry a hue range from 180 degrees one way around the color wheel to 180 degrees the other way, with a default of no turn

### Requirement: Asset set with a manifest

The pipeline SHALL export one source's models, criteria, preview pictures and scene layers to one directory with a manifest. The manifest SHALL list the structure, the kinds with their models, the categories with their kinds, an arrangement, and the scene. The arrangement SHALL give the position, size and angle of each cataloged instance in the structure's model units.

#### Scenario: Asset set is exported

- **WHEN** the export stage runs
- **THEN** the game client's asset directory holds the manifest and every file the manifest names
- **AND** every criteria file in the set validates against the adjustment schema

#### Scenario: Scene is exported

- **WHEN** the export stage runs on a source that declares a scene
- **THEN** the manifest lists each layer with its picture, its edges in the structure's model units, its distance from the structure and the line of its top edge
- **AND** the manifest gives the backdrop's colors by height and the level and color of the ground
- **AND** the manifest lists the ground's cutout and each plant with its picture, its size and where its root is

#### Scenario: Categories are exported

- **WHEN** the export stage runs on the `veneration-ornamentation` source
- **THEN** the manifest lists the five categories in the source's order, each with its name and its kinds
