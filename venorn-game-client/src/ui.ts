// The controls drawn over the scene: the dock of categories, the strip of
// variations, the wheel around a selected thing and the design bar.

import type { Placed } from "./placement";
import type { Range, Settings } from "./types";

export interface Choice {
  id: string;
  preview: string;
}

export interface Category {
  id: string;
  name: string;
  choices: Choice[];
  /** Buttons shown after the variations, such as a pen's undo. A button that stays pressed says so. */
  actions?: { label: string; preview: string; act: () => void; pressed?: () => boolean }[];
}

export interface OnScreen {
  x: number;
  y: number;
  radius: number;
}

export type WheelAction = "kind" | "variation" | "design" | "remove";
type NumberSetting = keyof Omit<Settings, "mirror">;

const dock = document.querySelector<HTMLElement>("#dock")!;
const strip = document.querySelector<HTMLElement>("#strip")!;
const ring = document.querySelector<HTMLElement>("#ring")!;
const wheel = document.querySelector<HTMLElement>("#wheel")!;
const design = document.querySelector<HTMLElement>("#design")!;
const status = document.querySelector<HTMLElement>("#status")!;
const more = document.querySelector<HTMLElement>("#more")!;
const menu = document.querySelector<HTMLElement>("#menu")!;

// The wheel's buttons sit this far from its middle, at the least and at the most.
const REACH = [78, 130];
// Room the wheel leaves for the status line above and the dock, strip and design bar below.
const ABOVE = 50;
const BELOW = 230;

let shown = -1;
// The setting the design bar's slider changes, and the slider itself while the bar is open.
let active: NumberSetting = "scale";
let slider: { key: NumberSetting; input: HTMLInputElement } | undefined;

export function say(message: string): void {
  status.textContent = message;
}

function tile(choice: Choice, label: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.title = label;
  button.setAttribute("aria-label", label);
  const image = document.createElement("img");
  image.src = choice.preview;
  image.alt = "";
  button.append(image);
  return button;
}

/** One round button for each category, numbered as the keys that choose it. */
export function buildDock(categories: Category[], onChoose: (index: number) => void): void {
  dock.replaceChildren(
    ...categories.map((category, index) => {
      const button = tile(category.choices[0], `${category.name} (${index + 1})`);
      button.setAttribute("aria-pressed", "false");
      const key = document.createElement("span");
      key.className = "key";
      key.textContent = String(index + 1);
      button.append(key);
      button.addEventListener("click", () => onChoose(index));
      return button;
    }),
  );
}

/** Mark a category as chosen and lay its variations out in the strip. */
export function showCategory(
  categories: Category[],
  index: number,
  variation: number,
  onVariation: (variation: number) => void,
): void {
  [...dock.children].forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
  if (shown !== index) {
    shown = index;
    strip.classList.toggle("fit", (categories[index].actions?.length ?? 0) > 0);
    strip.replaceChildren(
      ...categories[index].choices.map((choice, i) => {
        const button = tile(choice, `${categories[index].name} ${i + 1}`);
        button.setAttribute("role", "option");
        button.addEventListener("click", () => onVariation(i));
        return button;
      }),
      ...(categories[index].actions ?? []).map((action) => {
        const button = tile({ id: action.label, preview: action.preview }, action.label);
        button.addEventListener("click", action.act);
        return button;
      }),
    );
  }
  showVariation(categories, index, variation);
}

/** Mark one variation of the shown category, and show it on the category's button. */
export function showVariation(categories: Category[], index: number, variation: number): void {
  dock.children[index].querySelector("img")!.src = categories[index].choices[variation].preview;
  const { choices, actions = [] } = categories[index];
  // While a button such as the pen's turn is pressed, it is marked in place of the variation.
  const held = actions.some((action) => action.pressed?.());
  [...strip.children].forEach((button, i) => {
    button.setAttribute("aria-selected", String(i === variation && !held));
    const pressed = actions[i - choices.length]?.pressed;
    if (pressed) button.setAttribute("aria-pressed", String(pressed()));
  });
  strip.children[variation]?.scrollIntoView({ block: "nearest", inline: "center" });
}

export function onWheel(act: (action: WheelAction) => void): void {
  for (const button of wheel.querySelectorAll("button")) {
    button.addEventListener("click", () => act(button.dataset.action as WheelAction));
  }
}

/** Draw the ring around the selected thing, and the wheel around it when the wheel is open. */
export function placeSelection(at: OnScreen | undefined, open: boolean): void {
  ring.hidden = !at;
  wheel.hidden = !at || !open;
  if (!at) return;
  ring.style.width = ring.style.height = `${at.radius * 2}px`;
  ring.style.transform = `translate(${at.x - at.radius}px, ${at.y - at.radius}px)`;
  if (!open) return;

  // The wheel stays whole on the screen even when the thing is near an edge.
  const reach = Math.min(REACH[1], Math.max(REACH[0], at.radius + 44));
  const edge = reach + 36;
  const within = (value: number, low: number, high: number): number =>
    low > high ? (low + high) / 2 : Math.min(high, Math.max(low, value));
  const x = within(at.x, edge, window.innerWidth - edge);
  const y = within(at.y, edge + ABOVE, window.innerHeight - edge - BELOW);
  wheel.style.setProperty("--reach", `${reach}px`);
  wheel.style.transform = `translate(${x}px, ${y}px)`;
}

function ranges(thing: Placed): [string, NumberSetting, Range][] {
  const { adjust, attach } = thing.criteria;
  const all: [string, NumberSetting, Range][] = [
    ["Size", "scale", adjust.scale],
    ["Turn", "spin", adjust.spin],
    ["Color", "hue", adjust.hue],
    ["Lift", "standoff", attach.standoff],
    ["Tilt", "tilt", adjust.tilt],
    ["Depth", "depth", adjust.depth],
    ["Wrap", "conform", adjust.conform],
  ];
  if (adjust.fold) all.push(["Fold", "fold", adjust.fold]);
  if (adjust.bend.enabled && adjust.bend.max) {
    all.push(["Bend", "bend", { default: 0, min: -adjust.bend.max, max: adjust.bend.max }]);
  }
  // A range with one value is fixed by the criteria, so it gets no slider.
  return all.filter(([, , range]) => range.max > range.min);
}

function chip(label: string, act: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", act);
  return button;
}

/**
 * Show the design bar for a thing, or hide it: one chip for each setting its
 * criteria allow, and one slider for the chip that is chosen.
 */
export function showDesign(
  thing: Placed | undefined,
  on: { change: () => void; reset: () => void; close: () => void },
): void {
  design.replaceChildren();
  slider = undefined;
  design.hidden = !thing;
  if (!thing) return;

  const allowed = ranges(thing);
  const chips = document.createElement("div");
  chips.className = "chips";
  const input = document.createElement("input");
  input.type = "range";
  const pressed = new Map<NumberSetting, HTMLButtonElement>();
  const choose = (key: NumberSetting): void => {
    const [label, , range] = allowed.find((entry) => entry[1] === key) ?? allowed[0];
    active = key;
    for (const [other, button] of pressed) button.setAttribute("aria-pressed", String(other === key));
    input.min = String(range.min);
    input.max = String(range.max);
    input.step = String((range.max - range.min) / 200);
    input.value = String(thing.settings[key]);
    input.setAttribute("aria-label", label);
    slider = { key, input };
  };
  input.addEventListener("input", () => {
    if (!slider) return;
    thing.settings[slider.key] = Number(input.value);
    on.change();
  });

  for (const [label, key] of allowed) {
    const button = chip(label, () => choose(key));
    pressed.set(key, button);
    chips.append(button);
  }
  if (thing.criteria.adjust.mirror) {
    const mirror = chip("Mirror", () => {
      thing.settings.mirror = !thing.settings.mirror;
      mirror.setAttribute("aria-pressed", String(thing.settings.mirror));
      on.change();
    });
    mirror.setAttribute("aria-pressed", String(thing.settings.mirror));
    mirror.dataset.switch = "mirror";
    chips.append(mirror);
  }
  chips.append(chip("Reset", on.reset), chip("Done", on.close));
  design.append(chips, input);
  // The bar opens on the setting the player last changed, if this thing has it.
  choose(allowed.some((entry) => entry[1] === active) ? active : allowed[0][1]);
}

/** Move the slider to the thing's settings after a gesture or a key changed them. */
export function refreshDesign(thing: Placed): void {
  if (slider) slider.input.value = String(thing.settings[slider.key]);
  design.querySelector("[data-switch=mirror]")?.setAttribute("aria-pressed", String(thing.settings.mirror));
}

/** The button that opens and closes the menu of views and switches. */
export function watchMenu(): void {
  more.addEventListener("click", () => {
    menu.hidden = !menu.hidden;
    more.setAttribute("aria-expanded", String(!menu.hidden));
  });
  menu.addEventListener("click", (event) => {
    if ((event.target as HTMLElement).tagName === "BUTTON") closeMenu();
  });
}

/** Close the menu. Says whether it was open. */
export function closeMenu(): boolean {
  const open = !menu.hidden;
  menu.hidden = true;
  more.setAttribute("aria-expanded", "false");
  return open;
}
