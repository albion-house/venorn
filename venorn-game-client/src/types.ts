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
    conform: Range;
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
}

// What the player has chosen for one thing on the structure.
export interface Settings {
  scale: number;
  spin: number;
  standoff: number;
  tilt: number;
  conform: number;
  bend: number;
  mirror: boolean;
}
