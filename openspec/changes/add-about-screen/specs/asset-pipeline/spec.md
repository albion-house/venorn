## ADDED Requirements

### Requirement: The work in the asset set

A source MAY declare the work its image comes from: the title as the artist writes it, the artist's name, a link to the work's page and a description of the image. The export SHALL write the title, the artist and the link into the manifest, and SHALL write a copy of the source image into the asset set, at most 1200 pixels on its longer side, with its size and description in the manifest. A source that does not declare the artist or the link SHALL export without them.

#### Scenario: Painting is exported with its work

- **WHEN** the export stage runs on the `veneration-ornamentation` source
- **THEN** the manifest gives the title "Veneration, Ornamentation", the artist "Fawnicorn" and the link https://fawnicorn.com/personal-art/veneration-ornamentation/
- **AND** the asset set holds a JPEG copy of the painting 1200 pixels tall, whose width and height the manifest gives

#### Scenario: Small image

- **WHEN** a source's image is smaller than 1200 pixels on its longer side
- **THEN** the copy keeps the image's size
