## Context

codekiln made the repository public on 2026-11-26 and asked for the game to be deployed to GitHub Pages "using a sensible approach". [Issue #28](https://github.com/albion-house/venorn/issues/28) said publishing was blocked on where the generated models live, which `openspec/changes/add-decoration-play/design.md` asked as open question 1. This change answers it.

## Goals / Non-Goals

**Goals:**

- The game is at https://albion-house.github.io/venorn/ and stays current with `main`.
- The repository does not carry the 25 MB asset set, or a new copy of it each time the pipeline runs.
- A person can get the asset set without running the pipeline.

**Non-Goals:**

None.

## Decisions

### GitHub Actions publishes the site

Pages can serve a branch as it is, or take a folder from a workflow. A branch would need the built site and the asset set committed to it. A workflow builds on a GitHub runner and hands Pages the `dist/` folder, so nothing built is committed. The workflow runs on pushes to `main` that touch `venorn-game-client/`, the root `mise.toml` or `mise.lock`, or the workflow, and on demand. Pull requests that touch the same paths run the build job only, so a broken build shows before it is merged.

The runner gets its tools from mise, at the versions in `mise.lock`. mise-action runs in `venorn-game-client/` without `--monorepo`, so it installs node, aube, vite and typescript and skips the pipeline's Python tools. The build is the same `mise //venorn-game-client:build` that runs on the Mac, type check included.

Each action is pinned to a commit, with its version in a comment. Every version was released at least five days before this change, as the root `mise.toml` asks of tools.

### The asset set lives in a release

[GitHub's Git LFS documentation](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage) says "Git LFS cannot be used with GitHub Pages sites". A workflow could still check out LFS files, but every checkout of a public repository would spend the account's LFS bandwidth, 10 GiB a month on the free plan. Committing the files directly would add the asset set to the history again each time the pipeline's output changes.

A file attached to a GitHub release stays out of the history. [GitHub's releases documentation](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) sets no limit on a release's total size or its bandwidth, only 2 GiB for each file. The asset set is packed as `veneration-ornamentation.tar.gz` and attached to a release tagged `assets-veneration-ornamentation-<UTC date and time>`, marked as not the latest release. `VENORN_ASSETS_TAG` and `VENORN_ASSETS_SHA256` in `venorn-game-client/mise.toml` name the release and the file's SHA-256, so a commit fixes which asset set the site is built with, and a changed file is caught.

### Two tasks move the asset set

`fetch-assets` downloads the file from the release's public address, compares its checksum and unpacks it into `public/assets/`. It leaves an asset set that is already there alone unless given `--force`, and on a checksum mismatch it stops before touching anything.

`publish-assets` packs the set the pipeline last exported, creates the release with `gh`, and writes the new tag and checksum into `mise.toml` with `mise set`. The person who ran it commits `mise.toml`, and the push publishes the site with the new set.

## Risks / Trade-offs

- A new asset set takes a manual step: run `publish-assets` and commit. Forgetting it leaves the site on the older set, which still matches the code that names it.
- The releases page lists asset sets, which are not releases of the game. Their notes say so, and none is marked latest.
- The site's address and the release's address are written as `albion-house/venorn`. Moving the repository means changing them.
- localStorage is kept per origin, so the saved skull on albion-house.github.io is separate from the one on this Mac's ports.

## Resolved Questions

### 1 - Where do the generated models live for the published site?

In a GitHub release, one release for each exported asset set, named by `venorn-game-client/mise.toml`. codekiln asked for a sensible approach and left the choice to the drafting agent.

## Open Questions

None.
