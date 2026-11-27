## Why

The game is public at https://albion-house.github.io/venorn/, and it is made from Fawnicorn's painting "Veneration, Ornamentation". A person who opens it lands in the scene with no word of where its look comes from. [Issue #43](https://github.com/albion-house/venorn/issues/43) asks for the painting, its title and a link to it, when the game opens and from the menu. Now that anyone can open the game, the first thing they see should say what it is made from.

## What Changes

What exists now:

- The game opens straight into the scene. Nothing in it names the painting or its artist.
- The ⋯ menu holds Front view, Rear view, Arrange as painted, Clear, Painted skull and Sound.
- `source.toml` and the manifest write the title as "Veneration Ornamentation". The artist's page writes it with a comma, "Veneration, Ornamentation". The browser tab reads "venorn: Veneration Ornamentation".
- The asset set holds the models, their previews and the scene's layers, and no copy of the painting.
- Nothing in the game says which build it is or which asset set it loaded.

This change proposes:

- `source.toml` gives the title as the artist writes it, the artist's name, a link to the painting's page and a short description of the painting. The export writes them into the manifest, with a copy of the painting 1200 pixels on its longer side.
- An About screen opens when the game loads and from "About", the first item in the ⋯ menu. It shows the title, "by Fawnicorn", the painting and a link to the painting's page that opens in a new tab. A button starts the game or returns to it, and its tap lets the sound start. Escape closes it too.
- At the bottom of the About screen, in small type: the commit the site was built from, linked to it on GitHub, the build date in UTC and the asset set's release tag, linked to the release.
- The browser tab reads "venorn: Veneration, Ornamentation".

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `asset-pipeline`: the asset set carries the work's title, artist, page and a smaller copy of its image.
- `asset-viewer`: an About screen shows the painting, its title, its artist, a link to it and the build's version.

## Impact

- `venorn-asset-pipeline/`: `sources/veneration-ornamentation/source.toml`, `src/venorn_assets/source.py`, `src/venorn_assets/export.py` and the unit tests. The new asset set adds `original.jpg`, adds three fields to the manifest and puts the comma in its title. The other files stay as they were.
- `venorn-game-client/`: a new `src/about.ts`, the About screen and menu item in the body of `index.html`, its styles in `src/style.css`, a few lines in `src/main.ts` and `src/types.ts`, and the version in `vite.config.ts` and `src/vite-env.d.ts`. `mise.toml` names the new asset set's release.

## Citations

None.
