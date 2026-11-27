## 1. The work in the asset set

- [ ] 1.1 Give `source.toml` the title as the artist writes it, the artist, the painting's page and a description of the painting, and read them in `source.py`. Verify: a unit test reads "Veneration, Ornamentation", "Fawnicorn" and the page from the source.
- [ ] 1.2 Write them into the manifest at export, with a copy of the image at most 1200 pixels on its longer side. Verify: unit tests export a made-up source with and without an artist and a page, and a small image keeps its size. `mise //venorn-asset-pipeline:export` writes `original.jpg` 1200 pixels tall and the four entries in the manifest.
- [ ] 1.3 Run the pipeline and compare the asset set with the published one. Verify: `diff -r` against the set that `fetch-assets` downloads shows only the manifest's new entries and `original.jpg`.
- [ ] 1.4 Publish the new asset set. Verify: `publish-assets` makes a new release and rewrites `venorn-game-client/mise.toml`, and `fetch-assets --force` downloads a set equal to the export.

## 2. About screen

- [ ] 2.1 Add the About screen, opened as a modal dialog as soon as the manifest arrives, and "About" as the menu's first item. Verify: in headless Chrome with touch at 402 by 874, with and without insets of 62 at the top and 34 at the bottom, at 874 by 339 with an inset of 62 at one side or both and 21 at the bottom, and with a mouse at 1280 by 800, the screen shows the title, "by Fawnicorn", the painting and the link inside the safe area without scrolling. On a window too short for it, a finger drag scrolls it to the button.
- [ ] 2.2 Start the game and the sound from its button, keep keys on the screen, and close it with Escape. Verify: focus is on the button when the screen opens. A number key pressed on it leaves the category as it was. After Start the page's audio is running and a tap on the skull places a thing. About in the menu opens the screen again, and Escape closes it with the thing still on the skull. Start pressed while the models load shows "Loading…" until the scene is ready.
- [ ] 2.3 Show the version at its foot. Verify: the built site's About screen gives the short commit, linked to the commit, the build day in UTC and the asset set's tag, linked to its release. The dev server says "dev" in place of the day.

## 3. Published site

- [ ] 3.1 Build the pull request with the Pages workflow. Verify: the workflow downloads the new asset set and builds the site.
- [ ] 3.2 Open the About screen on a phone, upright and on its side, after the merge. Verify: codekiln says it reads well and the link opens the painting's page.
