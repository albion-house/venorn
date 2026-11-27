// The About screen: the painting the game is made from, its title, its artist and a link to the
// painting's page, with the build's version at its foot. It opens when the game loads and from "About"
// in the menu.

import type { Manifest } from "./types";

const REPOSITORY = "https://github.com/albion-house/venorn";

const about = document.querySelector<HTMLDialogElement>("#about")!;
const title = document.querySelector<HTMLElement>("#about-title")!;
const artist = document.querySelector<HTMLElement>("#about-artist")!;
const painting = document.querySelector<HTMLImageElement>("#about-painting")!;
const page = document.querySelector<HTMLAnchorElement>("#about-page")!;
const start = document.querySelector<HTMLButtonElement>("#about-start")!;
const version = document.querySelector<HTMLElement>("#about-version")!;

/**
 * Fill the About screen from the asset set's manifest and open it. onStart runs when its button is
 * pressed, a tap a browser lets start the sound. An asset set exported before the About screen has no
 * artist, page or painting, and the screen leaves them out.
 */
export function showAbout(manifest: Manifest, assets: string, onStart: () => void): void {
  title.textContent = manifest.title;
  artist.hidden = !manifest.artist;
  artist.textContent = manifest.artist ? `by ${manifest.artist}` : "";
  page.hidden = !manifest.page;
  if (manifest.page) {
    const host = new URL(manifest.page).host;
    const arrow = document.createElement("span");
    arrow.textContent = " ↗";
    arrow.setAttribute("aria-hidden", "true");
    page.href = manifest.page;
    page.replaceChildren(`See the original at ${host}`, arrow);
    page.setAttribute("aria-label", `See the original at ${host}, in a new tab`);
  }
  const original = manifest.original;
  painting.hidden = !original;
  if (original) {
    // The size is known before the picture arrives, so the screen keeps its room and does not jump.
    painting.width = original.width;
    painting.height = original.height;
    painting.alt = original.description;
    painting.src = assets + original.image;
  }
  showVersion();

  // Keys pressed on the screen stay on it, so they do not choose things or move the camera behind it.
  // Escape still closes it.
  about.addEventListener("keydown", (event) => event.stopPropagation());
  start.addEventListener("click", () => {
    onStart();
    about.close();
  });
  document.querySelector("#about-open")!.addEventListener("click", () => open("Back to the game"));
  open("Start");
}

function open(label: string): void {
  start.textContent = label;
  if (!about.open) about.showModal();
}

function link(text: string, href: string): HTMLAnchorElement {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.target = "_blank";
  anchor.rel = "noopener";
  anchor.textContent = text;
  return anchor;
}

/** The commit the site was built from, the day it was built and the asset set's release. vite.config.ts writes them in. */
function showVersion(): void {
  const commit = __VENORN_COMMIT__ && link(__VENORN_COMMIT__.slice(0, 7), `${REPOSITORY}/commit/${__VENORN_COMMIT__}`);
  const assets =
    __VENORN_ASSETS_TAG__ && link(__VENORN_ASSETS_TAG__, `${REPOSITORY}/releases/tag/${__VENORN_ASSETS_TAG__}`);
  // The dev server builds nothing, so it says so in place of a date.
  const parts = (__VENORN_BUILT__ ? [commit, `built ${__VENORN_BUILT__} UTC`, assets] : ["dev", commit, assets]).filter(
    (part): part is string | HTMLAnchorElement => Boolean(part),
  );
  version.replaceChildren("Version ", ...parts.flatMap((part, i) => (i === 0 ? [part] : [" · ", part])));
}
