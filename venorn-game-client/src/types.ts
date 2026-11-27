// The files the asset pipeline exports. The pipeline's
// schemas/adjustment.schema.json describes the criteria fields.

export interface Range {
  default: number;
  min: number;
  max: number;
}

export interface Criteria {
  id: string;
  kind: string;
  role: "pinned" | "printed";
  model: string;
  size: { natural: number; aspect: number; thickness: number };
  attach: {
    mode: "pin" | "print";
    anchor: [number, number, number];
    standoff: Range;
    pin: { visible: boolean };
  };
  adjust: {
    scale: Range;
    spin: Range;
    tilt: Range;
    depth: Range;
    hue: Range;
    conform: Range;
    fold?: Range;
    bend: { enabled: boolean; curve?: "cubic-bezier"; max?: number };
    mirror: boolean;
  };
  source: { image: string; instance: string; box: number[]; angle: number };
}

export interface ModelEntry {
  id: string;
  model: string;
  criteria: string;
  preview: string;
}

export interface Manifest {
  source: string;
  // The work the asset set is made from, as its artist presents it, for the About screen. An asset set
  // exported before the About screen has no artist, page or original.
  title: string;
  artist?: string | null;
  page?: string | null;
  // A smaller copy of the work's image, its size in pixels and what it shows.
  original?: { image: string; width: number; height: number; description: string };
  structure: { id: string; model: string; painted: string; thickness: number; features?: Feature[] };
  kinds: { id: string; role: "pinned" | "printed"; models: ModelEntry[] }[];
  // The groups the player chooses from, in the order of the number keys.
  categories: { id: string; name: string; kinds: string[] }[];
  arrangement: { kind: string; x: number; y: number; size: number; angle: number }[];
  scene: SceneLayers | null;
}

// A named place on the structure, in its model units: a hollow such as an eye
// socket, or a spike such as a horn.
export type Feature =
  | { id: string; shape: "hollow"; center: [number, number]; radius: number }
  | { id: string; shape: "spike"; tip: [number, number]; base: [number, number] };

// One layer of the scene around the structure. Its edges are where the layer
// sits in the source image, in the structure's model units. distance is how
// far from the structure the layer stands, in structure lengths.
export interface Layer {
  id: string;
  role: "far" | "floating" | "ground";
  image: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
  distance: number;
  motion: "still" | "drift";
  // The layer's top edge as points across the image: where it is, and how high.
  skyline: [number, number][];
  // "plain" when the picture's ends join, so its copies repeat as they are. Otherwise every second copy is mirrored.
  repeat?: "plain";
}

export interface SceneLayers {
  layers: Layer[];
  // The backdrop's color at each height, from the top of the image down to its horizon.
  backdrop: { id: string; stops: [number, string][] };
  ground: {
    y: number;
    color: string;
    // The ground layer with its dark base cut away: one long picture, placed like a layer.
    cutout: { image: string; left: number; right: number; top: number; bottom: number; repeat?: "plain" };
    plants: Plant[];
  };
}

// One plant cut from the ground layer. Sizes are in the structure's model units.
// root is where the stem meets the ground, along the picture's width from 0 to 1.
export interface Plant {
  id: string;
  image: string;
  width: number;
  height: number;
  root: number;
}

// What the player has chosen for one thing on the structure.
export interface Settings {
  scale: number;
  spin: number;
  standoff: number;
  tilt: number;
  depth: number;
  hue: number;
  conform: number;
  fold: number;
  bend: number;
  mirror: boolean;
}
