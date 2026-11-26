## Why

The game only runs on this Mac. A phone reaches it over the local network or over Tailscale, and nobody has tried it on a real phone yet ([issue #25](https://github.com/albion-house/venorn/issues/25)). codekiln made the repository public and asked for the game to be on GitHub Pages ([issue #28](https://github.com/albion-house/venorn/issues/28)). With a public address, any phone or computer can open it, which lets the game be tried by the people it is for.

## What Changes

What exists now:

- `mise //venorn-game-client:build` writes a static site to `venorn-game-client/dist/`. It already uses a relative base, so it loads from any path.
- Git ignores the exported asset set in `venorn-game-client/public/assets/`, 25 MB. Only a checkout that has run the pipeline has it, and the pipeline needs about 3 GB of model weights.
- The repository has no workflows and no Pages site.

This change proposes:

- A GitHub Actions workflow builds the client on each push to `main` that touches it, and publishes `dist/` at https://albion-house.github.io/venorn/. A pull request that touches the client builds it without publishing.
- The asset set is a file attached to a GitHub release. `venorn-game-client/mise.toml` names the release and the file's checksum.
- `mise //venorn-game-client:fetch-assets` downloads that file, checks it and unpacks it into `public/assets/`. The workflow runs it, and a checkout that has not run the pipeline can run it too.
- `mise //venorn-game-client:publish-assets` attaches a newly exported asset set to a new release and points `mise.toml` at it.

## Capabilities

### New Capabilities

- `site-publishing`: the built client is published on GitHub Pages, with the asset set taken from a release.

### Modified Capabilities

None.

## Impact

- New: `.github/workflows/pages.yml`, `venorn-game-client/mise-tasks/fetch-assets` and `venorn-game-client/mise-tasks/publish-assets`.
- `venorn-game-client/mise.toml` gains `VENORN_ASSETS_TAG` and `VENORN_ASSETS_SHA256`.
- The repository's Pages setting builds from GitHub Actions.
- The game's code, the pipeline and the asset set do not change.

## Citations

None.
