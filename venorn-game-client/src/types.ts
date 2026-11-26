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
  title: string;
  structure: { id: string; model: string; painted: string; thickness: number };
  kinds: { id: string; role: "pinned" | "printed"; models: ModelEntry[] }[];
  arrangement: { kind: string; x: number; y: number; size: number; angle: number }[];
  scene: SceneLayers | null;
}

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
}

export interface SceneLayers {
  layers: Layer[];
  // The backdrop's color at each height, from the top of the image down to its horizon.
  backdrop: { id: string; stops: [number, string][] };
  ground: { y: number; color: string };
}

// What the player has chosen for one thing on the structure.
export interface Settings {
  scale: number;
  spin: number;
  standoff: number;
  tilt: number;
  depth: number;
  conform: number;
  fold: number;
  bend: number;
  mirror: boolean;
}
