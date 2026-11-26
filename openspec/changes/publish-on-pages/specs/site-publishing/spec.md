## ADDED Requirements

### Requirement: Published site

A push to `main` that changes the client SHALL build it and publish it on GitHub Pages at https://albion-house.github.io/venorn/, with the asset set that `venorn-game-client/mise.toml` names. A pull request that changes the client SHALL build it without publishing it.

#### Scenario: Merge to main

- **WHEN** a pull request that changes `venorn-game-client/` is merged to `main`
- **THEN** the Pages workflow builds the client and deploys it
- **AND** https://albion-house.github.io/venorn/ shows the skull in the meadow with the dock of things to pin

#### Scenario: Pull request

- **WHEN** a pull request changes `venorn-game-client/`
- **THEN** the Pages workflow builds the client and does not deploy it

### Requirement: Asset set from a release

`mise //venorn-game-client:fetch-assets` SHALL download the asset set from the GitHub release that `VENORN_ASSETS_TAG` names, SHALL check it against `VENORN_ASSETS_SHA256`, and SHALL unpack it into `venorn-game-client/public/assets/`. It SHALL leave an asset set that is already there unless given `--force`, and SHALL stop without changing anything when the checksum does not match.

#### Scenario: Fresh checkout

- **WHEN** a person runs `mise //venorn-game-client:fetch-assets` in a checkout without an asset set
- **THEN** `public/assets/veneration-ornamentation/` holds the same files the pipeline exported for that release

#### Scenario: Wrong checksum

- **WHEN** the downloaded file does not match `VENORN_ASSETS_SHA256`
- **THEN** the task fails and says so
- **AND** an asset set that was already there is unchanged

### Requirement: Publishing a new asset set

`mise //venorn-game-client:publish-assets` SHALL attach the asset set in `venorn-game-client/public/assets/` to a new GitHub release that is not marked latest, and SHALL write the release's tag and the file's checksum into `venorn-game-client/mise.toml`.

#### Scenario: New export

- **WHEN** a person runs `publish-assets` after the pipeline exports a new asset set
- **THEN** a new release holds the packed set
- **AND** `VENORN_ASSETS_TAG` and `VENORN_ASSETS_SHA256` in `venorn-game-client/mise.toml` name it
