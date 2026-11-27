## Context

codekiln tried the published game on an iPhone and asked for steps in the ⋯ menu for adding the game as an app, starting with Chrome on iOS, and for the models to stay on the phone after the first download. codekiln later asked that a person who adds the game to a home screen see the original painting, as marketing for Fawnicorn's art.

What the site does today, measured on 2026-11-26:

- `index.html` has no manifest and an empty icon. Added to a home screen, the game opens as a browser tab.
- GitHub Pages answers every file with `Cache-Control: max-age=600` and an `ETag`. After ten minutes the browser asks the server about each file again, and it may clear its cache whenever it needs room. The asset set is 120 files and 25 MB since #45 added `original.jpg`.
- The menu button and the status line stand at `top: 10px`, and Done, which #46 added at the top right while a thing is selected, at `top: 8px`. #38 kept the controls inside the safe area at the left and right with `--left` and `--right`, but not at the top. In Safari's browser window the safe-area inset at the top is 0, so this did not show.

## Goals / Non-Goals

**Goals:**

- The game can be added to the home screen of an iPhone, iPad or Android phone and to a computer's Dock or app list, and it then opens as an app, with an icon cut from the painting.
- The menu says how to do that in the browser the page is open in, in steps that match the browser maker's help pages.
- After the first visit, opening the game downloads nothing from the asset set until a new asset set is published, and the game opens offline.
- A new build of the site shows on the next visit.
- In an iPhone app the menu button, the status line, the menu, Done and the wheel stay clear of the status bar and the Dynamic Island.

**Non-Goals:**

- None.

## Decisions

### The icons and launch screens are the painting itself

The icons are a square of the original painting, unaltered: the whole width of the image, 1086 pixels, from 300 pixels below its top. The square holds the whole skull, most of the horn, a strip of the pink sky above the forest and the tops of the meadow's flowers. Five squares were compared at 180 and 60 pixels. Closer squares on the face read as bone with decorations at 60 pixels. The full-width square reads as a unicorn skull because the horn crosses it.

- `icon-192.png` and `icon-512.png` are the manifest's icons. `apple-touch-icon.png` is 180 pixels for iOS, which fills a clear part of an icon with black, so the icons are opaque.
- `icon-maskable-512.png` is the same width from 340 pixels down. Android may cut a maskable icon down to a circle 80% of its width. In that circle are the eye socket, the lower horn and most of the cranium. The snout's tip and the back of the skull fall outside it. The painting is narrower than the skull is long, so no square of it holds the whole skull inside the circle with the painting around it.
- The browser tab's icon is `icon-192.png`.
- iOS shows a launch screen only when a picture matches the screen's size and scale exactly. There are seven, upright, for the iPhone 17, 17 Pro and 16 Pro (402 by 874 points), the 17 Pro Max and 16 Pro Max (440 by 956), the Air (420 by 912), the 16, 15, 15 Pro and 14 Pro (393 by 852), the 16 Plus, 15 Plus, 15 Pro Max and 14 Pro Max (430 by 932), the 17e, 16e, 14, 13, 13 Pro, 12 and 12 Pro (390 by 844), and the 14 Plus, 13 Pro Max and 12 Pro Max (428 by 926). The pixel sizes are the ones [App Store Connect lists for screenshots](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/) of those iPhones, at a scale of 3. Each shows the whole painting at 86% of the screen's width, in the middle. Above it the background takes the mean color of the painting's top 40 rows, `#1764a8`, below it the mean of its bottom 40 rows, `#536325`, and the two meet in a gradient behind the painting.
- The manifest's `background_color` and `theme_color` are `#0458a1`, the top of the painting's sky, which the scene's backdrop and the page's background already use. Android's splash screen is that blue with the icon, and the page under it is the same blue before the scene draws.

`mise //venorn-asset-pipeline:app-images` makes all eleven pictures. It reads the image's address and checksum from `sources/veneration-ornamentation/source.toml`, uses the pipeline's downloaded copy or downloads it again, and stops if the checksum does not match. It is a Python script that uv runs with Pillow alone, so it needs neither the pipeline's models nor its full environment. The PNGs have 256 colors with dithering and the launch screens are JPEGs at quality 72. Together they take 2.2 MB, committed under `venorn-game-client/public/app/`, so the site's build needs no Python.

### The manifest and the tags iOS reads

`public/manifest.webmanifest` has `name` "venorn: Veneration, Ornamentation", with the comma as Fawnicorn writes the title, `short_name` "venorn", and a `description` that credits Fawnicorn's painting. `id`, `start_url` and `scope` are `./`, which the browser resolves against the manifest's address, so the site works at https://albion-house.github.io/venorn/ and at the root of `vite preview`. `display` is `standalone`. `fullscreen` would hide Android's status bar, but iOS treats it as `standalone`, and the clock and the battery do no harm to a calm game. The manifest sets no orientation, since the game works upright and on its side.

`index.html` links the manifest, the icons and the launch screens, and sets `theme-color`, `apple-mobile-web-app-title` "venorn", `mobile-web-app-capable` with `apple-mobile-web-app-capable`, and `apple-mobile-web-app-status-bar-style` `black-translucent`. With that status bar the page reaches under the status bar, the scene's sky shows behind the clock, and the clock is drawn in white on it. Vite rewrites the links' root paths to the relative base.

### The page keeps its controls inside the safe area at the top

`--top` is the larger of 10 pixels and `env(safe-area-inset-top)`, the same rule #38 made for the sides. The menu button and the status line stand at `--top`, and the menu 48 pixels below it. Done stands at the larger of 8 pixels and the inset, so it is level with the menu button in a browser and 2 pixels lower than level in the app, where level would put its top 2 pixels inside the inset. In an iPhone 17 app the inset is 62, so they move to 62 pixels down. Everywhere else the inset at the top is 0 and nothing moves.

The wheel used to keep 50 pixels at the top free for the button and the status line. It now starts below the menu button's box, read from the page, which is 50 pixels where the inset is 0 and 102 in the app. That is one line in `src/ui.ts`.

The menu has nine items since #45 added About and this change adds one at the end. On a phone on its side, 339 pixels tall, it is 324 pixels tall and ran 43 pixels past the page's foot. It now ends above the safe area at the bottom and scrolls, with `touch-action: pan-y` as the strip has on a phone on its side.

### The menu's last item shows the steps for this browser

The item's words and the steps depend on the browser, which `src/install.ts` tells from the user agent string. Safari on an iPad says it is a Mac, so a Mac with a touch screen counts as an iPad. The steps follow these help pages, read with curl on 2026-11-26:

- Chrome on an iPhone or iPad, "Add to Home Screen": tap Share at the right of the address bar, find and tap Add to Home Screen, change the name if you like, and tap Add. From Google's [Use web apps, iPhone & iPad](https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DiOS) and [Create shortcuts for websites in Chrome](https://support.google.com/chrome/answer/15085120?hl=en&co=GENIE.Platform%3DiOS). Google says the shortcut opens as an app when the site is a web app, which the manifest makes it.
- Safari on an iPhone or iPad, "Add to Home Screen": tap the Page Menu button, then Share, or the Share button with the Bottom or Top tab layout; scroll down and tap Add to Home Screen, or add it with Edit Actions; turn on Open as Web App and tap Add. From Apple's [Turn a website into an app in Safari on iPhone](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios), in the iOS 27 guide.
- Another browser on an iPhone or iPad: open the page in Safari or Chrome and choose the item there.
- Chrome on Android, "Add to Home Screen": tap More at the right of the address bar, then Install and create shortcut, then Install. From [Use web apps, Android](https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DAndroid).
- Chrome on a computer, "Install as an app": More at the top right, then Cast, save, and share, then Install page as app, or the Install button at the right of the address bar. From [Use web apps, Computer](https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DDesktop).
- Safari on a Mac, "Add to Dock": Share in the toolbar, then Add to Dock, or File > Add to Dock, then Add. It needs macOS Sonoma 14 or later. From Apple's [Turn a website into an app in Safari on Mac](https://support.apple.com/guide/safari/add-to-dock-ibrw9e991864/mac) and [Use Safari web apps on Mac](https://support.apple.com/en-us/104996).
- Any other browser, "Install as an app": open the page in Chrome, or in Safari on an iPhone, iPad or Mac.

Chrome, and other browsers built on it, fire `beforeinstallprompt` when a site can be installed. The page keeps that event, and the steps then have an Install button that opens Chrome's own prompt. Keeping the event also stops Chrome on Android from showing its own install bar at the foot of the page, so the menu and Chrome's menu are the ways in. After `appinstalled` the item is hidden.

The steps open in a `<dialog>` that the page makes when it is first needed, so `index.html`'s body gains only the menu item. A tap outside the panel or Close closes it, and keys pressed in it do not reach the game. Opened as an installed app, which `display-mode: standalone` or iOS's `navigator.standalone` tells, the page hides the item.

An app added from Safari, on an iPhone or a Mac, keeps its storage apart from Safari's. [WebKit's tracking prevention page](https://webkit.org/tracking-prevention/) says a home screen web app's data "is kept isolated from Safari", and [Use Safari web apps on Mac](https://support.apple.com/en-us/104996) says a Dock app "shares no browsing history, cookies, website data, or settings with Safari". Chrome on an iPhone adds the app through the same WebKit. So the steps for those three end with a line that the app starts with a bare skull and the skull decorated in the browser stays there. An app installed from Chrome on a computer or Android uses Chrome's storage for the site and shows the same skull.

### A service worker keeps the asset set and the page

`public/sw.js` is a plain file of about 150 lines, so the change adds no dependency. Workbox would precache the build's files from a list that a Vite plugin writes, but the game has two built files, and the asset set comes from a release outside the build.

- The page registers `sw.js` with the scope `./` only in a built site. The live-reload server registers none, so a change shows at once while working. `localhost`, where the `phone` task serves the built site to the simulator, counts as secure, so the worker runs there too. A phone that opens the site's address on the local network over plain HTTP has no service workers.
- The asset set under `assets/veneration-ornamentation/` comes from a cache, `venorn-assets-<key>`, once a file is in it. A missing file comes from the network, asking the server whether it changed, since the browser's own cache may still hold a file of the last asset set for ten minutes, and is kept.
- Once the worker runs, the page asks it to keep the whole asset set. It reads `manifest.json` and downloads every file the manifest names that is not kept yet, four at a time, so the first visit keeps all 120 files even though the page asked for most of them before the worker could see the requests. `original.jpg` is among them.
- The page itself comes from the network, so a new build shows on the next visit, and a copy is kept for offline use.
- Vite's built script and stylesheet have a hash in their names and never change under one name, so they come from the cache. Each new copy of the page names the ones it uses, and the cache drops the others, so old builds do not pile up.
- Other files, such as the manifest and the icons, come from the network when there is one and from the cache offline.
- Other GitHub Pages sites share the origin `albion-house.github.io`, so every cache name starts with `venorn-`, the worker deletes only its own, and its scope is `/venorn/`.

### The asset set's key is its release tag and a checksum

`vite.config.ts` writes in `__VENORN_ASSETS_TAG__`, which the About screen already shows, and `__VENORN_ASSETS_SUM__`, the first 12 hex digits of a SHA-256 over the asset set's file names and contents in `public/assets/`, read at build time. The page registers `sw.js?assets=<tag>-<sum>`. A new key is a new worker, and on activating it deletes every `venorn-assets-` cache with another key. On the published site the key changes when a new asset set is published, as the tag does. The checksum also changes when the pipeline exports a changed set on the Mac under the same tag, which the tag alone would miss. Without it, the simulator at `localhost:5190` would keep showing the models from before the export. Reading 25 MB takes a fraction of a second at the start of a build.

### A new worker takes over at once, and the page reloads once

A new worker skips waiting and claims the open pages. When it takes over a page that an older worker controlled, the page reloads once. The older worker answered that page's first requests from the last asset set, so without the reload the new build's code would run with the last asset set for that visit. The new worker installs in about a second, while the About screen is open, so the reload comes before the first tap on Start in most visits. The saved skull is in the browser's storage, so a reload keeps it.

### Persistent storage for the installed app

Opened as an installed app, the page calls `navigator.storage.persist()`, so the browser does not clear the cache when the device runs short of space. In a browser tab it does not ask, since Firefox would show a prompt for it.

## Risks / Trade-offs

- In Safari's browser window, WebKit deletes a site's storage, service worker caches included, after seven days of Safari use without a visit to the site, as [Full Third-Party Cookie Blocking and More](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/) describes. The home screen app is exempt. So in a Safari tab the asset set is kept until a new set is published or until seven days of Safari use without the game.
- The first visit downloads the asset set through the page, and the worker then asks the server about each file again. On GitHub Pages those questions are answered "not modified" from the page's own download in most cases.
- The page reloads once, a second or two after opening, when a new asset set is published.
- The user agent string decides the steps. A browser that copies another's string gets that browser's steps. Chrome on an iPad may ask for the desktop site and say it is Safari on a Mac with a touch screen, and it would then get Safari's steps.
- Launch screens cover seven iPhone sizes held upright. On other screens, and on a phone on its side, iOS shows the page's background color while the game loads.
- The icons and launch screens add 2.2 MB of pictures to git.
- Nobody has added the game to a real phone's home screen or opened it in the iOS simulator as an app. The steps match the help pages as they read on 2026-11-26.

## Resolved Questions

### 1 - What do the app's icon and launch screen show?

The original painting, unaltered. codekiln asked that a person who adds the game to a home screen see the original version of the painting, since it is marketing for Fawnicorn's art. The icon is a square of the painting, and the launch screen shows all of it.

### 2 - What is the installed app called, and how is the artist credited?

The manifest's name is "venorn: Veneration, Ornamentation", with the title as Fawnicorn writes it. The description credits Fawnicorn's painting, and the artist is named only as Fawnicorn. The home screen label is "venorn".

## Open Questions

### 3 - Should the menu item stay in the installed app and say the game is installed?

> Context from the drafting agent, for question 3.
>
> The item is hidden when the game runs as an installed app. Keeping it with "Installed" would tell a person why the steps are gone, and could say that the app keeps its own skull. It would also take a line in a menu that already scrolls on a phone on its side.

<ANSWER_HERE>

### 4 - Should the page reload by itself when a new asset set arrives?

> Context from the drafting agent, for question 4.
>
> Today the page reloads once, a second or two after opening, when a new worker takes over. The other way is to keep the visit going with the last asset set and use the new one from the next visit, which mixes new code with the last models for one visit.

<ANSWER_HERE>

### 5 - Should launch screens cover a phone on its side, iPads and older iPhones?

> Context from the drafting agent, for question 5.
>
> Each launch screen is about 260 KB. A phone on its side needs seven more, and the iPhone SE, the mini and the iPads more again. Without one, iOS shows the page's blue while the game loads.

<ANSWER_HERE>
