// Adding the game to a home screen or the Dock, and keeping it on the device.
//
// The last item in the menu shows how to add the game as an app in the browser the page is open in. A
// service worker keeps the asset set and the page, so the game opens without downloading the models
// again, and opens offline.

/** The browsers the menu has steps for. The steps follow each browser maker's help pages. */
export type Browser =
  | "chrome-ios"
  | "safari-ios"
  | "other-ios"
  | "chrome-android"
  | "chrome-computer"
  | "safari-mac"
  | "other";

interface Steps {
  /** The menu item's words. */
  label: string;
  /** What each step asks the person to do. */
  steps: string[];
  /** A line under the steps. */
  note?: string;
}

// Chrome's install prompt, which Chrome and other Chromium browsers offer before a person installs.
interface InstallPrompt extends Event {
  prompt(): Promise<void>;
}

// An app added from Safari keeps its storage apart from Safari's, and one added from Chrome on an iPhone
// apart from Chrome's, so a skull decorated in the browser stays there.
const APART = "The app keeps its own storage, so it starts with a bare skull. The skull decorated here stays here.";

const STEPS: Record<Browser, Steps> = {
  // https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DiOS
  "chrome-ios": {
    label: "Add to Home Screen",
    steps: [
      "Tap Share, at the right of the address bar.",
      "Find Add to Home Screen in the list and tap it.",
      "Change the name if you like, then tap Add.",
    ],
    note: APART,
  },
  // https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios
  "safari-ios": {
    label: "Add to Home Screen",
    steps: [
      "Tap the Page Menu button, then Share. With Safari's Bottom or Top tab layout, tap the Share button instead.",
      "Scroll down and tap Add to Home Screen. If it isn't there, tap Edit Actions at the bottom of the list, then Add to Home Screen.",
      "Turn on Open as Web App, then tap Add.",
    ],
    note: APART,
  },
  "other-ios": {
    label: "Add to Home Screen",
    steps: ["Open this page in Safari or Chrome, then choose Add to Home Screen in this menu again."],
  },
  // https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DAndroid
  "chrome-android": {
    label: "Add to Home Screen",
    steps: [
      "Tap More ⋮, at the right of the address bar.",
      "Tap Install and create shortcut, then Install.",
      "Follow the steps on the screen.",
    ],
  },
  // https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DDesktop
  "chrome-computer": {
    label: "Install as an app",
    steps: [
      "Click More ⋮ at the top right of Chrome.",
      "Choose Cast, save, and share, then Install page as app.",
      "Follow the steps on the screen.",
    ],
    note: "Chrome may also show an Install button at the right of the address bar.",
  },
  // https://support.apple.com/guide/safari/add-to-dock-ibrw9e991864/mac and https://support.apple.com/en-us/104996
  "safari-mac": {
    label: "Add to Dock",
    steps: ["Click Share in Safari's toolbar, then choose Add to Dock. Or choose File > Add to Dock.", "Click Add."],
    note: `This needs macOS Sonoma 14 or later. ${APART}`,
  },
  other: {
    label: "Install as an app",
    steps: ["Open this page in Chrome, or in Safari on an iPhone, iPad or Mac, and choose this item again."],
  },
};

/** Which browser a user agent string names. An iPad's Safari names a Mac, and only its touch screen tells it apart. */
export function browserOf(agent: string, touchPoints: number): Browser {
  if (/iPhone|iPad|iPod/.test(agent) || (/Macintosh/.test(agent) && touchPoints > 1)) {
    if (/CriOS\//.test(agent)) return "chrome-ios";
    if (/Version\/[\d.]+ (Mobile\/\w+ )?Safari\//.test(agent) && !/EdgiOS\//.test(agent)) return "safari-ios";
    return "other-ios";
  }
  const chrome = /Chrome\//.test(agent) && !/Edg\/|EdgA\/|OPR\/|SamsungBrowser\/|YaBrowser\//.test(agent);
  if (/Android/.test(agent)) return chrome ? "chrome-android" : "other";
  if (chrome) return "chrome-computer";
  if (/Macintosh/.test(agent) && /Version\/[\d.]+ Safari\//.test(agent)) return "safari-mac";
  return "other";
}

/** The game was opened from its icon on a home screen, in the Dock or as an installed app. */
function installed(): boolean {
  const modes = ["standalone", "fullscreen", "minimal-ui", "window-controls-overlay"];
  return (
    modes.some((mode) => window.matchMedia(`(display-mode: ${mode})`).matches) ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Show the steps for this browser in the menu, and keep the game on the device. */
export function setUpApp(): void {
  keepOnDevice();
  const item = document.querySelector<HTMLButtonElement>("#install");
  if (!item) return;
  if (installed()) {
    item.hidden = true;
    return;
  }
  const browser = browserOf(navigator.userAgent, navigator.maxTouchPoints);
  item.textContent = STEPS[browser].label;
  item.hidden = false;

  let prompt: InstallPrompt | undefined;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    prompt = event as InstallPrompt;
  });
  window.addEventListener("appinstalled", () => {
    item.hidden = true;
    prompt = undefined;
    document.querySelector<HTMLDialogElement>("#install-steps")?.close();
  });
  item.addEventListener("click", () => showSteps(browser, prompt, () => (prompt = undefined)));
}

/** A panel with the steps, and an Install button where the browser offers its own prompt. */
function showSteps(browser: Browser, prompt: InstallPrompt | undefined, used: () => void): void {
  const { label, steps, note } = STEPS[browser];
  let panel = document.querySelector<HTMLDialogElement>("#install-steps");
  if (!panel) {
    panel = document.createElement("dialog");
    panel.id = "install-steps";
    // A tap outside the panel closes it, and keys pressed in it do not reach the game.
    panel.addEventListener("click", (event) => {
      if (event.target === panel) panel!.close();
    });
    panel.addEventListener("keydown", (event) => event.stopPropagation());
    document.body.append(panel);
  }
  const box = document.createElement("div");
  const heading = document.createElement("h2");
  heading.textContent = label;
  const list = document.createElement("ol");
  for (const step of steps) list.append(Object.assign(document.createElement("li"), { textContent: step }));
  box.append(heading, list);
  if (note) box.append(Object.assign(document.createElement("p"), { textContent: note }));
  const buttons = document.createElement("div");
  buttons.className = "buttons";
  if (prompt) {
    const install = Object.assign(document.createElement("button"), {
      type: "button",
      textContent: "Install",
      className: "primary",
    });
    install.addEventListener("click", async () => {
      panel!.close();
      used();
      await prompt.prompt();
    });
    buttons.append(install);
  }
  const close = Object.assign(document.createElement("button"), { type: "button", textContent: "Close" });
  close.addEventListener("click", () => panel!.close());
  buttons.append(close);
  box.append(buttons);
  panel.replaceChildren(box);
  panel.showModal();
}

/**
 * Register the service worker that keeps the asset set and the page. The live-reload server registers
 * none, so a change shows at once while working on the game.
 */
function keepOnDevice(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  const workers = navigator.serviceWorker;
  // A worker for a new asset set or a new sw.js takes over from the last one. The page reloads once, so
  // the game's code and the asset set come from the same release.
  const replacing = Boolean(workers.controller);
  let reloading = false;
  workers.addEventListener("controllerchange", () => {
    if (!replacing || reloading) return;
    reloading = true;
    window.location.reload();
  });
  const key = encodeURIComponent(`${__VENORN_ASSETS_TAG__ || "untagged"}-${__VENORN_ASSETS_SUM__}`);
  const base = import.meta.env.BASE_URL;
  workers
    .register(`${base}sw.js?assets=${key}`, { scope: base })
    .then(() => workers.ready)
    .then((registration) => registration.active?.postMessage("keep-assets"))
    .catch((error: unknown) => console.warn("The game could not be kept for offline use.", error));
  // An installed app asks the browser not to clear its storage when the device runs short of space.
  if (installed()) void navigator.storage?.persist?.();
}
