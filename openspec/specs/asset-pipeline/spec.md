# asset-pipeline Specification

## Purpose

Turn a declared source image into the 3D models the game shows, each with the criteria the game needs to place and adjust it.

## Requirements

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
- **THEN** the manifest lists each layer with its picture, its edges in the structure's model units, its distance from the structure and the line of its top edge
- **AND** the manifest gives the backdrop's colors by height and the level and color of the ground
- **AND** the manifest lists the ground's cutout and each plant with its picture, its size and where its root is

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

### Requirement: Scene layers

For a source that declares a scene, the pipeline SHALL split the image around the structure into a ground layer, a floating layer, a far layer and a backdrop. The far layer SHALL carry on behind the floating layer, the structure and the ground. The pipeline SHALL cut the ground layer free of its dark base and split it into separate plants. It SHALL write pictures of the layers and of the plants for a person to check.

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

#### Scenario: Meadow is cut into paper plants

- **WHEN** the layers stage runs on the `veneration-ornamentation` source
- **THEN** the meadow is also written with its dark base cut away, leaving the leaves, stems and flowers
- **AND** each plant that grows from a stem at the bottom of the image is written as its own picture, with its root recorded

#### Scenario: Flower head stays whole

- **WHEN** two plants meet inside one flower head
- **THEN** the whole head belongs to one of them

#### Scenario: Source declares no scene

- **WHEN** the layers stage runs on a source with no scene
- **THEN** the stage reports that and the build carries on

### Requirement: Kinds found by their paint

A source SHALL be able to declare a kind that is found by its paint: the patches of the structure that carry paint in a declared hue range, each with the colored parts it touches. Things of other kinds, and holes in the structure that show the same hue from behind, SHALL stay out of a painted instance.

#### Scenario: Sprigs are found on the skull

- **WHEN** the catalog stage runs on the `veneration-ornamentation` source
- **THEN** the catalog lists sprigs: the yellow-green stems and leaves painted on the bone
- **AND** no sprig includes a candy, a capsule, a bead or a butterfly

#### Scenario: Hole in the structure is not paint

- **WHEN** the meadow shows dark green through the skull's nose opening
- **THEN** no sprig is found there

### Requirement: Painted things carry other things

A painted kind SHALL be able to name the kinds it carries. An instance of a carried kind that sits on a painted instance SHALL become part of it and SHALL leave the catalog as a thing of its own.

#### Scenario: Flower on a stem joins the sprig

- **WHEN** a flower sits at the end of a painted stem
- **THEN** the sprig's outline includes the flower
- **AND** the catalog lists no separate flower there

#### Scenario: Flower apart from any stem stays pinned

- **WHEN** a flower sits on bare bone
- **THEN** the catalog lists it as a flower

### Requirement: Painted models lie flat and their carried parts rise

The model of a painted kind SHALL be nearly flat where the paint is and SHALL rise where the things it carries are. Its natural size SHALL be the instance's own size in the source image.

#### Scenario: Sprig's flowers stand out from its stems

- **WHEN** the lift stage makes a sprig's model
- **THEN** the flowers rise several times as far as the stems and leaves

#### Scenario: Large and small sprigs keep their sizes

- **WHEN** the source image has a long vine and a short sprig
- **THEN** the vine's model has a larger natural size than the sprig's
