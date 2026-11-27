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
const letGo = document.querySelector<HTMLElement>("#let-go")!;
// An empty box over the screen's safe area, which leaves out a notch, an island and rounded corners.
const safe = document.querySelector<HTMLElement>("#safe")!;
// A wide, short window, such as a phone on its side. The stylesheet puts the strip and the dock at the sides
// there. This is the same test as the stylesheet's.
const sideways = window.matchMedia("(orientation: landscape) and (max-height: 500px)");

// The wheel's buttons sit this far from the thing's middle, at the least and at the most. Where they do
// not fit on the screen at the most, they may go as far as the last number.
const REACH = [78, 130, 180];
// A wheel button's width, and the room kept between two buttons and between a button and the screen's edge.
const BUTTON = 62;
const BETWEEN = 6;
const MARGIN = 5;
// Room the wheel leaves for the status line and the menu button above, and for the dock, strip and design bar
// below when they stand at the bottom.
const ABOVE = 50;
const BELOW = 230;
// The wheel's buttons in order around it, clockwise, and the angles they take when there is room all around.
const WHEEL_ORDER: WheelAction[] = ["kind", "variation", "design", "remove"];
const AROUND = [-90, 0, 90, 180];

// The ring slides away this fast after a flick, in milliseconds, and fades as it goes.
const AWAY = 260;

// How far one press of a step button or an arrow key changes each setting in the design bar, and how each
// setting's value is written under its name.
const STEP: Record<NumberSetting, number> = {
  scale: 0.05,
  spin: 5,
  hue: 10,
  standoff: 0.02,
  tilt: 2,
  depth: 0.05,
  conform: 0.02,
  fold: 2,
  bend: 0.02,
};
const MINUS = "\u2212";
const written = (value: number, digits: number, plus = false): string =>
  `${value < 0 ? MINUS : plus && value > 0 ? "+" : ""}${Math.abs(value).toFixed(digits)}`;
const degrees = (value: number): string => `${written(Math.round(value), 0)}°`;
const percent = (value: number): string => `${written(Math.round(value * 100), 0)}%`;
const SHOW: Record<NumberSetting, (value: number) => string> = {
  scale: (value) => `${written(value, 2)}×`,
  spin: degrees,
  hue: (value) => `${written(Math.round(value), 0, true)}°`,
  standoff: percent,
  tilt: degrees,
  depth: (value) => `${written(value, 2)}×`,
  conform: percent,
  fold: degrees,
  bend: (value) => `${written(Math.round(value * 100), 0, true)}%`,
};
// The slider's thumb is this wide. A press this near its middle carries it from where it is.
const THUMB = 28;
const GRAB = 22;
// Holding a step button steps again after this many milliseconds, and then every REPEAT_EVERY.
const REPEAT_AFTER = 400;
const REPEAT_EVERY = 80;

let shown = -1;
// The setting the design bar's slider changes, and the bar while it is open.
let active: NumberSetting = "scale";
let bar: { thing: Placed; draw: () => void } | undefined;

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

/** Show the button that lets go of the selected thing while one is selected. */
export function showLetGo(on: boolean): void {
  letGo.hidden = !on;
}

export function onLetGo(act: () => void): void {
  letGo.addEventListener("click", act);
}

/** After a flick, slide a copy of the ring off by some pixels and fade it out. */
export function sendAway(at: OnScreen, by: { x: number; y: number }): void {
  const ghost = document.createElement("div");
  ghost.className = "ring-away";
  ghost.style.width = ghost.style.height = `${at.radius * 2}px`;
  document.body.append(ghost);
  const from = `translate(${at.x - at.radius}px, ${at.y - at.radius}px)`;
  const to = `translate(${at.x - at.radius + by.x}px, ${at.y - at.radius + by.y}px) scale(0.6)`;
  ghost
    .animate([{ transform: from, opacity: 1 }, { transform: to, opacity: 0 }], { duration: AWAY, easing: "ease-out" })
    .finished.finally(() => ghost.remove());
}

/** Draw the ring around the selected thing, and the wheel around it when the wheel is open. */
export function placeSelection(at: OnScreen | undefined, open: boolean): void {
  ring.hidden = !at;
  wheel.hidden = !at || !open;
  if (!at) return;
  ring.style.width = ring.style.height = `${at.radius * 2}px`;
  ring.style.transform = `translate(${at.x - at.radius}px, ${at.y - at.radius}px)`;
  if (!open) return;

  const layout = layWheel(at);
  wheel.style.transform = `translate(${layout.x}px, ${layout.y}px)`;
  for (const button of wheel.querySelectorAll<HTMLElement>("button")) {
    const angle = (layout.angles[WHEEL_ORDER.indexOf(button.dataset.action as WheelAction)] * Math.PI) / 180;
    button.style.transform = `translate(${layout.reach * Math.cos(angle)}px, ${layout.reach * Math.sin(angle)}px)`;
  }
}

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Where the wheel's buttons may stand: inside a room, and clear of the controls in it. The room is the
 * safe area below the status line. When the dock, the strip and the design bar stand at the bottom, the room
 * ends above them. On a wide, short window they stand at the sides, and the wheel keeps clear of each one.
 */
function wheelRoom(): { room: Box; controls: Box[] } {
  const area = safe.getBoundingClientRect();
  const room = { left: area.left, top: Math.max(area.top, ABOVE), right: area.right, bottom: area.bottom };
  if (!sideways.matches) {
    // The open design bar can stand taller than the room kept below, so the wheel also keeps above it.
    const open = design.hidden ? Infinity : design.getBoundingClientRect().top;
    return { room: { ...room, bottom: Math.min(room.bottom, window.innerHeight - BELOW, open) }, controls: [] };
  }
  // The open design panel takes the strip's place.
  const controls = (design.hidden ? [strip, dock] : [design, dock]).map((element) => element.getBoundingClientRect());
  return { room, controls };
}

/**
 * Where the wheel's buttons go. They stand around the thing's middle, clear of the thing, so a finger
 * on the thing reaches the thing. Near an edge of the screen they gather on the side that has room,
 * in the same order. Where no one side has room for all four, two stand on each of two sides.
 * Angles are in degrees, clockwise from the right.
 */
export function layWheel(at: OnScreen): { x: number; y: number; reach: number; angles: number[] } {
  const { room, controls } = wheelRoom();
  const half = BUTTON / 2 + MARGIN;
  const fits = (x: number, y: number): boolean =>
    x - half >= room.left &&
    x + half <= room.right &&
    y - half >= room.top &&
    y + half <= room.bottom &&
    controls.every(
      (box) => x + half <= box.left || x - half >= box.right || y + half <= box.top || y - half >= box.bottom,
    );
  const fitsFrom = (x: number, y: number, reach: number, angle: number): boolean => {
    const radians = (angle * Math.PI) / 180;
    return fits(x + reach * Math.cos(radians), y + reach * Math.sin(radians));
  };
  const fitsAt = (reach: number, angle: number): boolean => fitsFrom(at.x, at.y, reach, angle);
  const step = 3;
  const first = Math.min(REACH[1], Math.max(REACH[0], at.radius + 44));
  const reaches: number[] = [];
  for (let reach = first; reach <= REACH[2]; reach += 6) reaches.push(reach);
  // Neighboring buttons need this many degrees between them so that they do not touch.
  const least = (reach: number): number =>
    (2 * Math.asin(Math.min(1, (BUTTON + BETWEEN) / (2 * reach))) * 180) / Math.PI;
  // The runs of angles at which a button is whole on the screen, going clockwise, longest first.
  const arcs = (reach: number): { start: number; length: number }[] => {
    const free = Array.from({ length: 360 / step }, (_, i) => fitsAt(reach, i * step));
    const runs: { start: number; length: number }[] = [];
    for (let i = 0; i < free.length; i++) {
      if (!free[i] || free[(i - 1 + free.length) % free.length]) continue;
      let count = 0;
      while (count < free.length && free[(i + count) % free.length]) count++;
      runs.push({ start: i * step, length: (count - 1) * step });
    }
    return runs.sort((a, b) => b.length - a.length);
  };

  for (const reach of reaches) {
    if (AROUND.every((angle) => fitsAt(reach, angle))) return { x: at.x, y: at.y, reach, angles: AROUND };
    // All four along the longest arc, spread evenly.
    const best = arcs(reach)[0] ?? { start: 0, length: -1 };
    const spacing = Math.min(90, best.length / 3);
    if (spacing >= least(reach)) {
      const start = best.start + (best.length - spacing * 3) / 2;
      return { x: at.x, y: at.y, reach, angles: AROUND.map((_, i) => start + i * spacing) };
    }
  }
  // In a band too short for an arc of four, such as a phone on its side, the buttons split between the two
  // longest arcs, two in each or three and one, in the same order clockwise.
  for (const reach of reaches) {
    const angles = splitWheel(arcs(reach), least(reach));
    if (angles) return { x: at.x, y: at.y, reach, angles };
  }
  // In a corner with no room around the thing, the wheel shifts inward as a whole and stays on the screen. Where
  // the controls stand at the sides, it goes to the nearest place at which all four buttons are clear of them.
  // In a short room it draws its buttons in, so that it fits between the room's top and bottom.
  const reach = Math.min(first, Math.max(REACH[0], (room.bottom - room.top) / 2 - half));
  const edge = reach + half;
  const within = (value: number, low: number, high: number): number =>
    low > high ? (low + high) / 2 : Math.min(high, Math.max(low, value));
  const whole = (x: number, y: number): boolean => AROUND.every((angle) => fitsFrom(x, y, reach, angle));
  let middle = {
    x: within(at.x, room.left + edge, room.right - edge),
    y: within(at.y, room.top + edge, room.bottom - edge),
  };
  if (!whole(middle.x, middle.y)) {
    let nearest = Infinity;
    for (let x = room.left + edge; x <= room.right - edge; x += 6) {
      for (let y = room.top + edge; y <= room.bottom - edge; y += 6) {
        const away = Math.hypot(x - at.x, y - at.y);
        if (away < nearest && whole(x, y)) {
          nearest = away;
          middle = { x, y };
        }
      }
    }
  }
  return { ...middle, reach, angles: AROUND };
}

/**
 * Four angles in two arcs, at least `least` degrees apart all the way around, or nothing if the arcs are too
 * short. Each arc holds its buttons spread evenly about its middle, at most 90° apart. Of the ways to split
 * them, the one whose closest pair is farthest apart wins. Kind goes to the button that leaves the four
 * nearest their usual places: Kind above, Variation to the right, Design below and Remove to the left.
 */
function splitWheel(runs: { start: number; length: number }[], least: number): number[] | undefined {
  if (runs.length < 2) return undefined;
  const spread = (run: { start: number; length: number }, count: number): number[] | undefined => {
    if (count === 1) return [run.start + run.length / 2];
    const spacing = Math.min(90, run.length / (count - 1));
    if (spacing < least) return undefined;
    const start = run.start + (run.length - spacing * (count - 1)) / 2;
    return Array.from({ length: count }, (_, i) => start + i * spacing);
  };
  let best: { angles: number[]; closest: number } | undefined;
  for (const count of [2, 3, 1]) {
    const one = spread(runs[0], count);
    const other = spread(runs[1], 4 - count);
    if (!one || !other) continue;
    const angles = [...one, ...other].map((angle) => ((angle % 360) + 360) % 360).sort((a, b) => a - b);
    const closest = Math.min(...angles.map((angle, i) => (i === 3 ? angles[0] + 360 : angles[i + 1]) - angle));
    if (closest >= least && (!best || closest > best.closest)) best = { angles, closest };
  }
  if (!best) return undefined;
  const { angles } = best;
  const apart = (a: number, b: number): number => Math.abs(((a - b + 540) % 360) - 180);
  const turns = [0, 1, 2, 3].map((turn) => AROUND.map((_, i) => angles[(turn + i) % 4]));
  const off = (angles: number[]): number => angles.reduce((sum, angle, i) => sum + apart(angle, AROUND[i]), 0);
  return turns.reduce((a, b) => (off(b) < off(a) ? b : a));
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

/** A button in the design bar's grid, with its name and, under it, a value that changes. */
function cell(name: string, act: () => void, withValue = true): { button: HTMLButtonElement; value: HTMLElement } {
  const button = document.createElement("button");
  button.type = "button";
  const label = document.createElement("span");
  label.className = "name";
  label.textContent = name;
  const value = document.createElement("span");
  value.className = "value";
  button.append(label);
  if (withValue) button.append(value);
  button.addEventListener("click", act);
  return { button, value };
}

function part(className: string): HTMLElement {
  const element = document.createElement("div");
  element.className = className;
  return element;
}

/**
 * Show the design bar for a thing, or hide it: a grid with a button for each setting its criteria allow, each
 * showing its value, and under it one slider for the setting that is chosen, between a minus and a plus button.
 */
export function showDesign(
  thing: Placed | undefined,
  on: { change: () => void; reset: () => void; close: () => void },
): void {
  design.replaceChildren();
  bar = undefined;
  design.hidden = !thing;
  if (!thing) return;

  const allowed = ranges(thing);
  const grid = part("settings");
  const cells = new Map<NumberSetting, { button: HTMLButtonElement; value: HTMLElement }>();
  for (const [name, key] of allowed) {
    const entry = cell(name, () => {
      active = key;
      draw();
    });
    cells.set(key, entry);
    grid.append(entry.button);
  }
  const mirror = thing.criteria.adjust.mirror
    ? cell("Mirror", () => {
        thing.settings.mirror = !thing.settings.mirror;
        on.change();
        draw();
      })
    : undefined;
  if (mirror) {
    mirror.button.classList.add("switch");
    grid.append(mirror.button);
  }
  // Reset and Close end the last row, at its right, for every thing.
  const reset = cell("Reset", on.reset, false).button;
  reset.classList.add("reset");
  const close = cell("Close", on.close, false).button;
  close.classList.add("close");
  grid.append(reset, close);

  const slider = part("slider");
  slider.setAttribute("role", "slider");
  slider.tabIndex = 0;
  const track = part("track");
  track.append(part("fill"), part("mark"));
  slider.append(track, part("thumb"));

  const chosen = (): [string, NumberSetting, Range] => allowed.find((entry) => entry[1] === active) ?? allowed[0];
  const share = (value: number, range: Range): number =>
    Math.min(1, Math.max(0, (value - range.min) / (range.max - range.min)));
  const set = (value: number): void => {
    const [, key, range] = chosen();
    const next = Number(Math.min(range.max, Math.max(range.min, value)).toFixed(6));
    if (next === thing.settings[key]) return;
    thing.settings[key] = next;
    on.change();
    draw();
  };
  // Step by a number of steps, landing on a whole number of steps.
  const step = (count: number): void => {
    const [, key] = chosen();
    const size = STEP[key];
    const steps = thing.settings[key] / size;
    set((count > 0 ? Math.floor(steps + 1e-6) + count : Math.ceil(steps - 1e-6) + count) * size);
  };
  const stepButton = (text: string, by: number): HTMLButtonElement => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `step ${by > 0 ? "more" : "less"}`;
    button.textContent = text;
    let timer: number | undefined;
    const stop = (): void => {
      window.clearTimeout(timer);
      timer = undefined;
    };
    const repeat = (delay: number): void => {
      timer = window.setTimeout(() => {
        step(by);
        repeat(REPEAT_EVERY);
      }, delay);
    };
    button.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      stop();
      step(by);
      repeat(REPEAT_AFTER);
    });
    for (const type of ["pointerup", "pointerleave", "pointercancel"]) button.addEventListener(type, stop);
    // Enter or Space on the button steps once. A pointer has stepped already.
    button.addEventListener("click", (event) => {
      if (event.detail === 0) step(by);
    });
    return button;
  };
  const less = stepButton(MINUS, -1);
  const more = stepButton("+", 1);
  const row = part("slide");
  row.append(less, slider, more);

  // A press near the thumb carries it from where it is. A press farther along puts it under the finger.
  let grab: { pointer: number; offset: number } | undefined;
  const valueAt = (x: number): number => {
    const box = slider.getBoundingClientRect();
    const [, , range] = chosen();
    return range.min + share(x - box.left - THUMB / 2, { default: 0, min: 0, max: box.width - THUMB }) * (range.max - range.min);
  };
  slider.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const box = slider.getBoundingClientRect();
    const [, key, range] = chosen();
    const thumb = box.left + THUMB / 2 + share(thing.settings[key], range) * (box.width - THUMB);
    grab = { pointer: event.pointerId, offset: Math.abs(event.clientX - thumb) <= GRAB ? event.clientX - thumb : 0 };
    slider.setPointerCapture(event.pointerId);
    slider.focus({ preventScroll: true });
    event.preventDefault();
    set(valueAt(event.clientX - grab.offset));
  });
  slider.addEventListener("pointermove", (event) => {
    if (grab?.pointer === event.pointerId) set(valueAt(event.clientX - grab.offset));
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    slider.addEventListener(type, (event) => {
      if (grab?.pointer === (event as PointerEvent).pointerId) grab = undefined;
    });
  }
  slider.addEventListener("keydown", (event) => {
    const [, , range] = chosen();
    const by: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 };
    if (event.key in by) step(by[event.key]);
    else if (event.key === "Home") set(range.min);
    else if (event.key === "End") set(range.max);
    else return;
    event.preventDefault();
  });

  function draw(): void {
    if (!thing) return;
    const [name, key, range] = chosen();
    for (const [other, entry] of cells) {
      entry.button.setAttribute("aria-pressed", String(other === key));
      entry.value.textContent = SHOW[other](thing.settings[other]);
    }
    if (mirror) {
      mirror.button.setAttribute("aria-pressed", String(thing.settings.mirror));
      mirror.value.textContent = thing.settings.mirror ? "on" : "off";
    }
    const value = thing.settings[key];
    slider.style.setProperty("--at", String(share(value, range)));
    slider.style.setProperty("--default", String(share(range.default, range)));
    slider.setAttribute("aria-label", name);
    slider.setAttribute("aria-valuemin", String(range.min));
    slider.setAttribute("aria-valuemax", String(range.max));
    slider.setAttribute("aria-valuenow", String(value));
    slider.setAttribute("aria-valuetext", SHOW[key](value));
    less.setAttribute("aria-label", `${name} down`);
    more.setAttribute("aria-label", `${name} up`);
  }

  design.append(grid, row);
  // The bar opens on the setting the player last changed, if this thing has it.
  if (!allowed.some((entry) => entry[1] === active)) active = allowed[0][1];
  bar = { thing, draw };
  draw();
}

/** Where the open design bar is on the screen. */
export function designBox(): DOMRect | undefined {
  return design.hidden ? undefined : design.getBoundingClientRect();
}

/** Show the thing's settings in the design bar after a gesture, a key or Reset changed them. */
export function refreshDesign(thing: Placed): void {
  if (bar?.thing === thing) bar.draw();
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
