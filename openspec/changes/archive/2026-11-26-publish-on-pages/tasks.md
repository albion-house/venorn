## 1. Asset set

- [x] 1.1 Add `fetch-assets`, `publish-assets` and the `VENORN_ASSETS_TAG` and `VENORN_ASSETS_SHA256` pins in `venorn-game-client/mise.toml`. Verify: `publish-assets` created the release `assets-veneration-ornamentation-20261126-2350` with a 25 MB `veneration-ornamentation.tar.gz` and rewrote the two pins, keeping the comment above them. With the asset set removed from a worktree, `fetch-assets` unpacked 119 files that `diff -r` finds identical to the pipeline's export, with no macOS `._` files. Run again, it left them alone and pointed to `--force`.
- [x] 1.2 Check that a wrong checksum stops `fetch-assets`. Verify: run with `VENORN_ASSETS_SHA256` set to 64 zeros and `--force`, the task exited 1, printed the downloaded and expected checksums, and left all 119 files as `diff -r` found them before.

## 2. Workflow

- [x] 2.1 Add `.github/workflows/pages.yml`. Verify: run 45913545670 on pull request #39 downloaded the asset set from the release, type-checked and built the site, uploaded `dist/`, and skipped the deploy job.
- [x] 2.2 Set the repository's Pages source to GitHub Actions. Verify: the Pages settings page shows "GitHub Actions" as the source, and the Pages API reports `build_type` `workflow` and the address https://albion-house.github.io/venorn/.
- [x] 2.3 Merge and deploy. Verify: run 45913640863 on `main` built and deployed. https://albion-house.github.io/venorn/ answers 200 with the same script name as the local build, `assets/veneration-ornamentation/manifest.json` answers 200, and `skull.glb` answers 200 as `model/gltf-binary`, 3,828,264 long.

## 3. Check the site

- [x] 3.1 Open the published game. Verify: in Chrome on the Mac and in Safari in the iPhone 17 simulator, the skull, the meadow, the forest, the clouds and the dock show. In the simulator a tap on the skull placed a butterfly and the status line gave the hint for moving it.

## 4. Documents

- [x] 4.1 Describe the site, the two tasks and how to publish a new asset set in `README.md`, and update `STATUS.md`. Verify: `mise run check` passes.
