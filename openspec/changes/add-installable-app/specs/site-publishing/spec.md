## ADDED Requirements

### Requirement: Installable as an app

The published site SHALL have a web app manifest that names the game "venorn: Veneration, Ornamentation", credits Fawnicorn's painting, opens the game standalone at the site's own path, and lists icons of 192 and 512 pixels and a maskable icon of 512 pixels. Its icons and the 180-pixel Apple touch icon SHALL be squares of the original painting, unaltered. The page SHALL link iPhone launch screens that show the whole painting.

#### Scenario: Manifest and icons

- **WHEN** a browser opens https://albion-house.github.io/venorn/
- **THEN** the manifest it links loads, its start address and scope are https://albion-house.github.io/venorn/, and each icon it lists loads at the size it names

#### Scenario: Added to an iPhone's home screen

- **WHEN** a person adds the game to an iPhone's home screen and opens it from there
- **THEN** the game opens without the browser's bars, with a square of the painting as its icon

### Requirement: Asset set kept on the device

After the first visit, the site SHALL serve every file of the asset set from storage on the device, without asking the server, until a new asset set is published. A build with a new asset set SHALL replace the kept set, and the old one SHALL be deleted. A new build of the page SHALL show on the next visit.

#### Scenario: Second visit

- **WHEN** a person opens the game a second time
- **THEN** no request for a file of the asset set reaches the server

#### Scenario: New asset set

- **WHEN** a build with a new asset set is published and a person opens the game
- **THEN** the game shows the new asset set
- **AND** the device keeps only the new asset set

### Requirement: Opens offline

Once the game has been opened with a network, it SHALL open without one, with the skull, the scene and the dock of things.

#### Scenario: Offline

- **WHEN** a person who has opened the game before opens it with no network
- **THEN** the About screen shows the painting, and after Start the skull in the meadow and the dock of things appear
