## Context

The game takes its look from Fawnicorn's painting. The artist's page, https://fawnicorn.com/personal-art/veneration-ornamentation/, titles it "Veneration, Ornamentation", with a comma. `source.toml` names the full image by URL and checksum: 1086 by 1536 pixels, 692 KB. codekiln and Fawnicorn made the game together, so showing the painting raises no question of rights.

The page loads `manifest.json` first, then every model and layer, about 26 MB, and only then builds the scene. Until then the page shows the blue backdrop. A browser lets the page make sound only after a tap, a click or a key press, so the wind starts with the first one (`src/sound.ts`). The ⋯ menu is `<nav id="menu">` in `index.html`, and `src/ui.ts` closes it when any of its buttons is pressed. On a window wider than tall and at most 500 tall, #41 stands the strip down the left side and the dock at the lower right.

## Goals / Non-Goals

**Goals:**

- When the game loads, and when About is chosen from the menu, a person sees the painting, its title as the artist writes it, "by Fawnicorn" and a link to the painting's page.
- The painting comes from the asset set, and so do the title, the artist and the link.
- The screen fits a phone held upright, a phone on its side and a computer, and scrolls where it does not fit. It works by touch, mouse and keyboard.
- The tap that closes the screen lets the sound start.
- The screen shows which build of the site and which asset set the page is running.

**Non-Goals:**

- None.

## Decisions

### The work's details live in `source.toml` and travel in the manifest

`source.toml` gains `artist` and `page` beside `title`, and `title` takes the artist's spelling. The `[image]` table gains a `description` of what the painting shows, which the screen uses as the picture's text for a person who cannot see it. The export writes `title`, `artist` and `page` at the top of the manifest, and an `original` entry with the picture's file, width, height and description.

There is one title, so the browser tab, which `main.ts` builds from the manifest's title, reads "venorn: Veneration, Ornamentation" as well. The directory and the asset set keep the name `veneration-ornamentation`.

`artist`, `page` and the description are optional in `source.toml`. A source without them exports `null` or an empty description, and the screen leaves out what is missing. The screen also leaves out the picture when the manifest has no `original`, as in an asset set exported before this change. A checkout that already has an asset set keeps it until `fetch-assets --force` replaces it, so the game still starts there.

### A copy of the painting, 1200 pixels tall, goes into the asset set

The export writes `original.jpg`, 848 by 1200 pixels, at JPEG quality 85, progressive, with the source's color profile and without its camera data. It comes to 252 KB, against 692 KB for the full image.

The copy is in the same release as the models, so the page makes no request to fawnicorn.com on each load, does not depend on that address staying the same, and can be kept with the rest of the asset set for play without a network, as issue #44 plans. A phone held upright shows it 342 points wide, about 1030 pixels at three pixels to the point, so 848 by 1200 is about what that screen can show. A computer shows it up to 522 by 740 points, which at two pixels to the point is larger than the copy, so it is a little soft there.

### A native dialog, opened as modal

The screen is a `<dialog>` opened with `showModal()`. The browser then keeps taps and the keyboard's focus inside it, draws a backdrop over the scene, and closes it on Escape. Focus goes to its button, so Enter or Space starts the game. A key pressed on the screen stops there, so a number key does not choose a category behind it. A tap on the backdrop does nothing, so a stray tap does not close the screen.

### It opens as soon as the manifest arrives

`main.ts` opens the screen right after it reads the manifest, before the models load, so the screen covers the loading. The button works at once. Pressed before the scene is ready, it shows the backdrop with "Loading…" in the status line until the scene appears.

### The button starts the sound

The button reads "Start" when the game loads and "Back to the game" when About was chosen from the menu. Pressing it calls `startWind`, as the first tap in the scene does, so a person who taps Start hears the wind. Escape closes the screen without starting the sound, because a browser does not count Escape as a key press that may start sound. The first tap in the scene starts it, as before.

### Words above and below the painting on a tall screen, beside it on a wide one

On a screen taller than wide, the title, "by Fawnicorn", the painting, the link, the button and the version stand in one column, at most 520 wide. The painting takes the height the words leave, at least 220. On a screen wider than tall, which includes a computer's window, the painting stands at the left as tall as the screen allows, at least 200, and the words stand at the right, centered in its height, with the version at the foot. The screen keeps inside the safe area, so it stays clear of the island on a phone on its side, and it scrolls by itself when it is taller than the window.

### "About" is the menu's first item

It comes first so it is easy to find, and so the item for issue #44 can go at the end. Like the other items, it closes the menu.

### The version is written in at build time

`vite.config.ts` gives the client three constants through Vite's `define`.

- `__VENORN_COMMIT__`: `GITHUB_SHA` in the Pages workflow, otherwise `git rev-parse HEAD`. The screen shows its first seven characters, linked to the commit on GitHub. On a pull request, `GITHUB_SHA` is the commit GitHub makes to merge the pull request, which GitHub also shows.
- `__VENORN_BUILT__`: the day of the build in UTC. The dev server builds nothing, so it leaves this empty and the screen says "dev" in its place.
- `__VENORN_ASSETS_TAG__`: `VENORN_ASSETS_TAG`, which mise sets from `venorn-game-client/mise.toml` for every task. The screen shows it linked to its release. Issue #44 uses the same name.

The line reads, for example, "Version 1a2b3c4 · built 2026-11-27 UTC · assets-veneration-ornamentation-20261127-0040", in small type at 60% opacity. A build made with changes that are not committed shows the commit it started from.

## Risks / Trade-offs

- Every load starts on the About screen, so a returning player taps once more before playing. Open question 1 asks whether it should open only on a first visit.
- The asset set grows by 252 KB, about 1% of its 26 MB.
- On a computer at two pixels to the point the painting is shown larger than the copy, and looks a little soft.
- Escape, pressed first, closes the screen without starting the sound. The next tap starts it.

## Resolved Questions

### 1 - Which spelling of the title does a person see?

The artist's, "Veneration, Ornamentation", on the About screen and in the browser tab. `source.toml` carries it into the manifest, and the client shows the manifest's title.

### 2 - Where does the About screen load the painting from?

From the asset set, as a copy 1200 pixels tall that the export writes. The full image stays on fawnicorn.com, and the screen links to the painting's page there.

### 3 - May the game show the painting?

Yes. codekiln and Fawnicorn made the game together.

## Open Questions

### 1 - Should the About screen open on every load, or only on a person's first visit?

> Context from the drafting agent, for question 1.
>
> It opens on every load, as issue #43 asks. A returning player taps Start before each game. The browser already keeps the skull, and it could also keep that this person has seen the About screen, so later visits open straight into the scene. About would stay in the menu either way.

<ANSWER_HERE>

### 2 - Should Start wait until the scene has loaded?

> Context from the drafting agent, for question 2.
>
> Start works at once. Pressed before the scene is ready, it shows the blue backdrop and "Loading…" in the status line until the scene appears. In headless Chrome held to 20 Mbit/s with 60 ms of delay, the built site opened the About screen after 0.4 seconds, showed the painting after 0.6 and had the scene ready after 8.9. Start could instead read "Loading…" and work only once the scene is ready, so the About screen is the loading screen. Then a failure to load would have to be shown on the About screen, since the status line is behind it.

<ANSWER_HERE>
