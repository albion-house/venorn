## Why

codekiln played the published game on an iPhone and asked for two things:

> Can you make it so the three dots menu has an instruction on how to add it as an app if you are in chrome? I'm thinking of the share sheet -> add to home page PWA with chrome in ios (maybe also in macbook; haven't checked that one).

> Can you make it so the models are cached locally after first downloaded?

Later codekiln added that a person who adds the game to a home screen should see the original painting, as marketing for Fawnicorn's art. A game a person comes back to belongs on the home screen, and it should open without downloading 25 MB of models each time. Issue #44 records both requests.

## What Changes

What exists now:

- The site has no web app manifest and no icon. `index.html` sets an empty icon. Added to an iPhone's home screen, the game opens as a Safari tab with a picture of the page as its icon.
- The asset set, 119 files and 25 MB, is kept only by the browser's own cache. GitHub Pages sends `Cache-Control: max-age=600`, so after ten minutes the browser asks the server about each file again, and it may drop the files whenever it needs room. Offline the game does not open.
- The menu button and the status line stand 10 pixels from the top of the page, and Done, which #46 added at the top right, 8 pixels. In an iPhone app opened from the home screen the page reaches under the status bar, so they would sit under the clock and the Dynamic Island.

This change proposes:

- A web app manifest, icons cut from the painting, iPhone launch screens that show the whole painting, and the meta tags iOS reads, so the game opens as an app from a home screen or the Dock.
- A last item in the ⋯ menu that shows how to add the game as an app in the browser the page is open in: Chrome or Safari on an iPhone or iPad, Chrome on a computer, Safari on a Mac, and Chrome on Android. Where Chrome offers its own install prompt, the steps have an Install button. In the installed app the item is hidden.
- A service worker that keeps the asset set on the device after the first download until a new asset set is published, keeps the page and its scripts, and lets the game open offline.
- The menu button, the status line, the menu and Done stay inside the safe area at the top, and the wheel stays below the menu button.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-publishing`: the published site can be installed as an app, keeps its asset set on the device, and opens offline.
- `asset-viewer`: the menu shows how to add the game as an app, and the controls at the top stay inside the safe area.

## Impact

- `venorn-game-client/`: `index.html`, `vite.config.ts`, `src/main.ts` (one call), `src/style.css`, `src/ui.ts` (the top of the wheel's room), `src/vite-env.d.ts`, and new files `src/install.ts`, `public/sw.js`, `public/manifest.webmanifest` and `public/app/`.
- `venorn-asset-pipeline/mise-tasks/app-images`: a task that makes the icons and launch screens from the source painting.
- The asset set, the pipeline's stages and the saved skull do not change.

## Citations

None.
