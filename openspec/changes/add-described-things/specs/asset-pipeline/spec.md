## ADDED Requirements

### Requirement: Model from one described image

The pipeline SHALL turn one image of one thing and its description into a model, a preview and adjustment criteria that validate against the adjustment schema. The criteria SHALL record the description. The thing SHALL take its thickness, natural size and criteria from the nearest of the source's pinned kinds. When the image's border is one flat color, the pipeline SHALL outline the thing by keying that color out. Otherwise it SHALL find the thing from its description.

#### Scenario: Thing on a plain ground

- **WHEN** the pipeline lifts an image of a red butterfly on a plain paper-colored ground, described as "a red butterfly"
- **THEN** it writes a GLB model, a preview and criteria that validate against the schema
- **AND** the criteria record the description "a red butterfly"
- **AND** the criteria carry the butterfly kind's fold range

#### Scenario: Thing on a busy background

- **WHEN** the pipeline lifts a square of the painting around a yellow candy, with the bone and other things around it, described as "a yellow wrapped candy"
- **THEN** the preview shows the candy alone, without the bone or the other things

### Requirement: Lifting process keeps its models loaded

The pipeline SHALL offer a process that loads its models once, warms each of them, and then lifts each image it receives on the same Mac. Once it reports that it is ready, it SHALL lift an image on a plain ground within 1 second and any other image within 5 seconds, on an Apple M2 Pro with 16 GB.

#### Scenario: Lifts after the process is ready

- **WHEN** the lifting process has reported that it is ready and receives the plain butterfly stand-in, then the painted candy stand-in
- **THEN** it returns the butterfly's model, preview and criteria within 1 second
- **AND** it returns the candy's within 5 seconds
