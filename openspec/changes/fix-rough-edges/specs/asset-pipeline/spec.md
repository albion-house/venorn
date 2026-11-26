## ADDED Requirements

### Requirement: Layers whose ends join

The layers stage SHALL cut the far layer, the ground layer and the ground's cutout so that each picture's right end carries on into its left start. It SHALL overlap the picture's two ends and join them along the path where they look most alike. The manifest SHALL mark each layer cut this way. The stage SHALL write a picture of copies of each joined layer side by side for a person to check.

#### Scenario: Forest copies side by side

- **WHEN** the layers stage runs on the `veneration-ornamentation` source
- **THEN** `layers/joins.png` shows three copies of the forest, the meadow and the cutout meadow side by side
- **AND** no copy is a mirror image of the one beside it

#### Scenario: Manifest marks the joined layers

- **WHEN** the export stage runs after the layers stage
- **THEN** the manifest marks the forest, the meadow and the cutout meadow as joining at their ends
- **AND** the clouds carry no mark
