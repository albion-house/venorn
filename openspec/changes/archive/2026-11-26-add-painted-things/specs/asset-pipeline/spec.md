## ADDED Requirements

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
