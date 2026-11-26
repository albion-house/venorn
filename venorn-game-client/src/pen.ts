// A glitter pen: strokes of small flecks laid on the structure's surface. The
// flecks catch the light as the camera moves.

import * as THREE from "three";

export interface Ink {
  id: string;
  name: string;
  /** A color for one-color ink, or none for ink that runs through the rainbow along the stroke. */
  color?: number;
}

export const INKS: Ink[] = [
  { id: "gold", name: "Gold", color: 0xf2bb3c },
  { id: "silver", name: "Silver", color: 0xd9e2ec },
  { id: "rose", name: "Rose", color: 0xff6fa5 },
  { id: "aqua", name: "Aqua", color: 0x3fd0de },
  { id: "violet", name: "Violet", color: 0x9f7bff },
  { id: "rainbow", name: "Rainbow" },
];

export interface Spot {
  point: THREE.Vector3;
  normal: THREE.Vector3;
}

/** A stroke as it was drawn: its ink, and each spot the pen passed, with null where the pen lifted. */
export interface Stroke {
  ink: Ink;
  spots: (Spot | null)[];
}

export interface Pen {
  group: THREE.Group;
  /** Start a stroke at a spot on the structure, with one of the inks. */
  begin(spot: Spot, ink: Ink): void;
  /** Carry the stroke on to another spot. */
  draw(spot: Spot): void;
  /** Lift the pen off the structure without ending the stroke, as when the pointer leaves the structure. */
  lift(): void;
  end(): void;
  /** Take back the last stroke. Says whether there was one. */
  undo(): boolean;
  clear(): void;
  /** The strokes drawn so far, oldest first. */
  strokes(): Stroke[];
  /** Draw strokes again from the spots the pen passed, as when a saved skull is brought back. */
  redraw(strokes: Stroke[]): void;
  update(seconds: number, light: THREE.Vector3): void;
  /** How many strokes and how many dabs are drawn, for a test to read. */
  count(): { strokes: number; dabs: number };
}

// The most dabs the pen can lay down.
const CAPACITY = 12000;
// A dab's radius and how far it sits off the surface, in structure lengths.
const RADIUS = 0.011;
const OFF = 0.004;
// Dabs are laid this far apart, as a share of their radius.
const SPACING = 0.4;
// Two spots farther apart than this, in structure lengths, are not joined: the pointer crossed a gap.
const GAP = 0.12;
// The rainbow ink goes once through its colors over this length of stroke, in structure lengths.
const RAINBOW = 0.6;
// A fleck of glitter is this large, in world units.
const FLECK = 0.012;

const VERTEX = /* glsl */ `
  attribute vec3 aColor;
  varying vec2 vDisc;
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying vec3 vColor;
  void main() {
    vDisc = position.xy;
    vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * vec3(0.0, 0.0, 1.0));
    vColor = aColor;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uLight;
  uniform float uFleck;
  varying vec2 vDisc;
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying vec3 vColor;
  float hash(vec3 point) {
    return fract(sin(dot(point, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }
  // Two layers of flecks, each turned its own way, so the flecks do not line up in rows.
  const mat3 TURN_A = mat3(0.80, 0.36, -0.48, -0.60, 0.48, -0.64, 0.0, 0.80, 0.60);
  const mat3 TURN_B = mat3(0.36, -0.80, 0.48, 0.48, 0.60, 0.64, -0.80, 0.0, 0.60);
  // A fleck's own three numbers: they set its place in the dab, its tilt and its brightness.
  vec3 fleckAt(vec3 at, mat3 turn, float size) {
    vec3 fleck = floor(turn * at / size);
    return vec3(hash(fleck), hash(fleck + 17.0), hash(fleck + 43.0));
  }
  void main() {
    vec3 under = fleckAt(vWorld, TURN_A, uFleck);
    vec3 over = fleckAt(vWorld, TURN_B, uFleck * 0.62);
    // The brighter of the two flecks at a point lies on top.
    vec3 own = under.y > over.y ? under : over;
    // Flecks thin out toward the rim of a dab, which leaves the stroke a ragged edge.
    if (length(vDisc) + (own.x - 0.5) * 0.5 > 0.9) discard;
    vec3 tilt = normalize(vNormal + (own - 0.5) * 1.3);
    vec3 view = normalize(cameraPosition - vWorld);
    float glint = pow(max(dot(reflect(-uLight, tilt), view), 0.0), 40.0);
    float twinkle = smoothstep(0.93, 1.0, sin(uTime * (1.5 + own.y * 3.0) + own.z * 40.0));
    vec3 shade = vColor * (0.4 + 0.65 * own.y) + vec3(glint * 1.4 + twinkle * 0.5);
    gl_FragColor = vec4(shade, 1.0);
    #include <colorspace_fragment>
  }
`;

export function buildPen(structure: THREE.Mesh, structureSize: number): Pen {
  const group = new THREE.Group();
  const radius = RADIUS * structureSize;
  const colors = new THREE.InstancedBufferAttribute(new Float32Array(CAPACITY * 3), 3);
  const geometry = new THREE.CircleGeometry(1, 10);
  geometry.setAttribute("aColor", colors);
  const uniforms = {
    uTime: { value: 0 },
    uLight: { value: new THREE.Vector3(0, 1, 0) },
    uFleck: { value: FLECK },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    side: THREE.DoubleSide,
    // The ink lies on the surface, so it is drawn a little toward the camera to stay in front of it.
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const dabs = new THREE.InstancedMesh(geometry, material, CAPACITY);
  dabs.count = 0;
  dabs.frustumCulled = false;
  group.add(dabs);

  const raycaster = new THREE.Raycaster();
  raycaster.firstHitOnly = true;
  // Each stroke's first dab, and what is needed to draw it again.
  const strokes: (Stroke & { from: number })[] = [];
  let ink: Ink | undefined;
  let last: Spot | undefined;
  // How far the pen has travelled in this stroke, and how far since its last dab.
  let travelled = 0;
  let owed = 0;

  const FRONT = new THREE.Vector3(0, 0, 1);
  const matrix = new THREE.Matrix4();
  const facing = new THREE.Quaternion();
  const size = new THREE.Vector3(radius, radius, radius);
  const at = new THREE.Vector3();
  const tint = new THREE.Color();
  const point = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const above = new THREE.Vector3();

  function dab(where: THREE.Vector3, facingOut: THREE.Vector3): void {
    if (!ink || dabs.count >= CAPACITY) return;
    const index = dabs.count;
    matrix.compose(
      at.copy(where).addScaledVector(facingOut, OFF * structureSize),
      facing.setFromUnitVectors(FRONT, facingOut),
      size,
    );
    dabs.setMatrixAt(index, matrix);
    if (ink.color === undefined) tint.setHSL(travelled / (RAINBOW * structureSize), 0.95, 0.58);
    else tint.set(ink.color);
    colors.setXYZ(index, tint.r, tint.g, tint.b);
    dabs.count = index + 1;
    dabs.instanceMatrix.needsUpdate = true;
    colors.needsUpdate = true;
  }

  const copy = (spot: Spot): Spot => ({ point: spot.point.clone(), normal: spot.normal.clone() });

  const pen: Pen = {
    group,
    begin(spot: Spot, chosen: Ink): void {
      ink = chosen;
      strokes.push({ from: dabs.count, ink: chosen, spots: [copy(spot)] });
      travelled = 0;
      owed = 0;
      last = copy(spot);
      dab(spot.point, spot.normal);
    },
    draw(spot: Spot): void {
      if (!ink) return;
      // A stroke taken back while it was drawn has no record left to add to.
      strokes[strokes.length - 1]?.spots.push(copy(spot));
      if (!last || last.point.distanceTo(spot.point) > GAP * structureSize) {
        // The pen comes down again after a lift or a jump across a gap.
        last = { point: spot.point.clone(), normal: spot.normal.clone() };
        dab(spot.point, spot.normal);
        return;
      }
      const length = last.point.distanceTo(spot.point);
      const step = SPACING * radius;
      let along = step - owed;
      while (along <= length) {
        const share = along / length;
        point.lerpVectors(last.point, spot.point, share);
        normal.lerpVectors(last.normal, spot.normal, share).normalize();
        // A straight line between two spots cuts across a curved surface, so each dab is put back on it.
        raycaster.set(above.copy(point).addScaledVector(normal, 0.05 * structureSize), normal.clone().negate());
        const hit = raycaster.intersectObject(structure, false)[0];
        if (hit && hit.distance < 0.1 * structureSize) point.copy(hit.point);
        travelled += step;
        dab(point, normal);
        along += step;
      }
      owed = length - (along - step);
      last.point.copy(spot.point);
      last.normal.copy(spot.normal);
    },
    lift(): void {
      const spots = strokes[strokes.length - 1]?.spots;
      if (ink && spots && spots[spots.length - 1] !== null) spots.push(null);
      last = undefined;
    },
    end(): void {
      ink = undefined;
      last = undefined;
    },
    undo(): boolean {
      const stroke = strokes.pop();
      if (!stroke) return false;
      dabs.count = stroke.from;
      return true;
    },
    clear(): void {
      strokes.length = 0;
      dabs.count = 0;
    },
    strokes: () => strokes.map(({ ink, spots }) => ({ ink, spots })),
    redraw(drawn: Stroke[]): void {
      for (const { ink: chosen, spots } of drawn) {
        const start = spots.findIndex((spot) => spot !== null);
        if (start < 0) continue;
        pen.begin(spots[start]!, chosen);
        for (const spot of spots.slice(start + 1)) {
          if (spot) pen.draw(spot);
          else pen.lift();
        }
        pen.end();
      }
    },
    update(seconds: number, light: THREE.Vector3): void {
      uniforms.uTime.value = seconds;
      uniforms.uLight.value.copy(light).normalize();
    },
    count: () => ({ strokes: strokes.length, dabs: dabs.count }),
  };
  return pen;
}

const RAINBOW_STOPS = ["#ff5a7a", "#ffd166", "#5ee08a", "#5ab8ff", "#b98bff"];

function picture(body: string): string {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${body}</svg>`)}`;
}

/** A small picture of a stroke of an ink, for the dock and the strip. */
export function inkPicture(ink: Ink): string {
  const stops = RAINBOW_STOPS.map(
    (color, index) => `<stop offset="${index / (RAINBOW_STOPS.length - 1)}" stop-color="${color}"/>`,
  ).join("");
  const stroke = ink.color === undefined ? "url(#rainbow)" : `#${ink.color.toString(16).padStart(6, "0")}`;
  return picture(
    `<defs><linearGradient id="rainbow" x1="0" x2="1">${stops}</linearGradient></defs>` +
      `<path d="M6 30c6-14 12-14 18-4s12 8 18-8" fill="none" stroke="${stroke}" stroke-width="7" stroke-linecap="round"/>` +
      `<path d="M36 30l1.6 4.4L42 36l-4.4 1.6L36 42l-1.6-4.4L30 36l4.4-1.6z" fill="#fff"/>` +
      `<path d="M12 9l1 2.8 2.8 1-2.8 1-1 2.8-1-2.8-2.8-1 2.8-1z" fill="#fff"/>`,
  );
}

/** A small picture of two arrows circling a point, for the button that turns the view. */
export function turnPicture(): string {
  const line = `fill="none" stroke="#f6efe0" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"`;
  return picture(
    `<circle cx="24" cy="24" r="4.5" fill="#f6efe0"/>` +
      `<path d="M9 21a15 15 0 0 1 26-9" ${line}/><path d="M37 4v9h-9" ${line}/>` +
      `<path d="M39 27a15 15 0 0 1-26 9" ${line}/><path d="M11 44v-9h9" ${line}/>`,
  );
}

/** A small picture of an arrow turning back, for the undo button. */
export function undoPicture(): string {
  return picture(
    `<path d="M16 20h14a9 9 0 0 1 0 18H18" fill="none" stroke="#f6efe0" stroke-width="4.5" stroke-linecap="round"/>` +
      `<path d="M22 11l-10 9 10 9" fill="none" stroke="#f6efe0" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  );
}
