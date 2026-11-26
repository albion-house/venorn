// Keeps the decorated skull in the browser, so that it is there when the page
// opens again. A browser may refuse storage, as a private window can, so every
// read and write may fail, and the game goes on without it.

import * as THREE from "three";
import type { Placed } from "./placement";
import type { Spot } from "./pen";
import type { Criteria, Settings } from "./types";

/** One thing on the structure. Places are in the structure's model units. */
export interface SavedThing {
  /** The model's id in the asset set it was placed from. */
  model: string;
  kind: string;
  /** The painted thing the model was cut from: the source image and the thing's box in it. */
  from?: { image: string; box: number[] };
  point: number[];
  normal: number[];
  settings: Partial<Settings>;
}

/** One stroke of the pen: its ink, and each spot the pen passed as [x, y, z, nx, ny, nz], or null where it lifted. */
export interface SavedStroke {
  ink: string;
  spots: (number[] | null)[];
}

export interface SavedSkull {
  version: 1;
  things: SavedThing[];
  strokes: SavedStroke[];
}

// A saved thing is the same painted thing as a model when their boxes in the source image overlap this much.
const SAME_THING = 0.5;
const NUMBER_SETTINGS = ["scale", "spin", "standoff", "tilt", "depth", "hue", "conform", "fold", "bend"] as const;

/** Where a skull is kept: the one on the structure now, or the last one cleared away. */
export function storageKey(assetSet: string, slot: "skull" | "last-skull"): string {
  return `venorn:${assetSet}:${slot}`;
}

export function isBare(skull: SavedSkull): boolean {
  return skull.things.length === 0 && skull.strokes.length === 0;
}

/** The skull kept under a key, or none if nothing is kept, the browser refuses storage or the record is damaged. */
export function readSkull(key: string): SavedSkull | undefined {
  try {
    const text = window.localStorage.getItem(key);
    return text === null ? undefined : parseSkull(JSON.parse(text));
  } catch {
    return undefined;
  }
}

/** Keep a skull under a key, or forget the key. Says whether the browser took it. */
export function writeSkull(key: string, skull: SavedSkull | undefined): boolean {
  try {
    if (skull) window.localStorage.setItem(key, JSON.stringify(skull));
    else window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function numbers(value: unknown, length: number): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === length &&
    value.every((entry) => typeof entry === "number" && Number.isFinite(entry))
  );
}

/** A saved skull from a parsed record. Entries that are not whole are left out. */
export function parseSkull(record: unknown): SavedSkull | undefined {
  if (!record || typeof record !== "object") return undefined;
  const { version, things, strokes } = record as Record<string, unknown>;
  if (version !== 1) return undefined;
  return {
    version: 1,
    things: Array.isArray(things) ? things.flatMap((thing) => parseThing(thing) ?? []) : [],
    strokes: Array.isArray(strokes) ? strokes.flatMap((stroke) => parseStroke(stroke) ?? []) : [],
  };
}

function parseThing(record: unknown): SavedThing | undefined {
  if (!record || typeof record !== "object") return undefined;
  const { model, kind, from, point, normal, settings } = record as Record<string, unknown>;
  if (typeof model !== "string" || typeof kind !== "string" || !numbers(point, 3) || !numbers(normal, 3)) {
    return undefined;
  }
  const thing: SavedThing = { model, kind, point, normal, settings: {} };
  const source = from as { image?: unknown; box?: unknown } | undefined;
  if (source && typeof source.image === "string" && numbers(source.box, 4)) {
    thing.from = { image: source.image, box: source.box };
  }
  const chosen = (settings ?? {}) as Record<string, unknown>;
  for (const key of NUMBER_SETTINGS) {
    const value = chosen[key];
    if (typeof value === "number" && Number.isFinite(value)) thing.settings[key] = value;
  }
  if (typeof chosen.mirror === "boolean") thing.settings.mirror = chosen.mirror;
  return thing;
}

function parseStroke(record: unknown): SavedStroke | undefined {
  if (!record || typeof record !== "object") return undefined;
  const { ink, spots } = record as Record<string, unknown>;
  if (typeof ink !== "string" || !Array.isArray(spots)) return undefined;
  const kept = spots.filter((spot): spot is number[] | null => spot === null || numbers(spot, 6));
  return kept.some((spot) => spot !== null) ? { ink, spots: kept } : undefined;
}

function round(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function saveThing(thing: Placed, structureSize: number): SavedThing {
  const { criteria, point, normal, settings } = thing;
  const saved: SavedThing = {
    model: criteria.id,
    kind: criteria.kind,
    point: point.toArray().map((value) => round(value / structureSize, 5)),
    normal: normal.toArray().map((value) => round(value, 4)),
    settings: { mirror: settings.mirror },
  };
  if (criteria.source && numbers(criteria.source.box, 4)) {
    saved.from = { image: criteria.source.image, box: [...criteria.source.box] };
  }
  for (const key of NUMBER_SETTINGS) saved.settings[key] = round(settings[key], 4);
  return saved;
}

export function saveStroke(ink: string, spots: (Spot | null)[], structureSize: number): SavedStroke {
  return {
    ink,
    spots: spots.map((spot) =>
      spot
        ? [
            ...spot.point.toArray().map((value) => round(value / structureSize, 5)),
            ...spot.normal.toArray().map((value) => round(value, 4)),
          ]
        : null,
    ),
  };
}

/** A saved spot of a stroke in world units. */
export function spotFrom(saved: number[], structureSize: number): Spot {
  return {
    point: new THREE.Vector3(saved[0], saved[1], saved[2]).multiplyScalar(structureSize),
    normal: new THREE.Vector3(saved[3], saved[4], saved[5]).normalize(),
  };
}

/** How much two boxes overlap: the area they share over the area they cover together. */
function overlap(a: number[], b: number[]): number {
  const width = Math.min(a[2], b[2]) - Math.max(a[0], b[0]);
  const height = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
  if (width <= 0 || height <= 0) return 0;
  const area = (box: number[]): number => (box[2] - box[0]) * (box[3] - box[1]);
  const shared = width * height;
  return shared / (area(a) + area(b) - shared);
}

/**
 * The model a saved thing is now, or none if the asset set no longer has it.
 * The pipeline numbers its models anew on each build, so a thing cut from the
 * painting is found by where it was painted: the model of the same kind whose
 * box in the same source image overlaps the saved one most, by at least half.
 * A thing that was not cut from a source image is found by its model's id.
 */
export function findModel(saved: SavedThing, models: Criteria[]): Criteria | undefined {
  const sameKind = models.filter((criteria) => criteria.kind === saved.kind);
  const from = saved.from;
  if (!from) return sameKind.find((criteria) => criteria.id === saved.model);
  let best: Criteria | undefined;
  let bestOverlap = SAME_THING;
  for (const criteria of sameKind) {
    if (criteria.source?.image !== from.image || !numbers(criteria.source.box, 4)) continue;
    const shared = overlap(criteria.source.box, from.box);
    if (shared >= bestOverlap) {
      best = criteria;
      bestOverlap = shared;
    }
  }
  return best;
}
