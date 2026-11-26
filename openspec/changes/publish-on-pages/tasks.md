## 1. Asset set

- [x] 1.1 Add `fetch-assets`, `publish-assets` and the `VENORN_ASSETS_TAG` and `VENORN_ASSETS_SHA256` pins in `venorn-game-client/mise.toml`. Verify: `publish-assets` created the release `assets-veneration-ornamentation-20261126-2350` with a 25 MB `veneration-ornamentation.tar.gz` and rewrote the two pins, keeping the comment above them. With the asset set removed from a worktree, `fetch-assets` unpacked 119 files that `diff -r` finds identical to the pipeline's export, with no macOS `._` files. Run again, it left them alone and pointed to `--force`.
- [x] 1.2 Check that a wrong checksum stops `fetch-assets`. Verify: run with `VENORN_ASSETS_SHA256` set to 64 zeros and `--force`, the task exited 1, printed the downloaded and expected checksums, and left all 119 files as `diff -r` found them before.

## 2. Workflow

- [ ] 2.1 Add `.github/workflows/pages.yml`. Verify: the pull request's run builds the site and skips the deploy job.
- [ ] 2.2 Set the repository's Pages source to GitHub Actions. Verify: the Pages settings page shows "GitHub Actions" as the source.
- [ ] 2.3 Merge and deploy. Verify: the run on `main` deploys, https://albion-house.github.io/venorn/ answers, and its `assets/veneration-ornamentation/manifest.json` loads.

## 3. Check the site

- [ ] 3.1 Open the published game. Verify: in a desktop browser and in the iPhone 17 simulator, the skull, the meadow and the dock show, and a tap places a thing.

## 4. Documents

- [ ] 4.1 Describe the site, the two tasks and how to publish a new asset set in `README.md`, and update `STATUS.md`. Verify: `mise run check` passes.
