// Surprises that answer the player's decorating: glitter from a spike on the
// structure, and a rabbit that comes out of a hollow and bounds away.

import * as THREE from "three";
import type { Feature } from "./types";

export interface Surprises {
  group: THREE.Group;
  /** The names of the spike and the hollow the surprises start from, when the structure has them. */
  spike?: string;
  hollow?: string;
  /** A few sparkles from the spike's tip. strength runs from 0 to 1. */
  puff(strength: number): void;
  /** A long burst of rainbow glitter from the spike's tip. */
  spew(): void;
  /**
   * Send a rabbit out of the hollow on the camera's side of the structure. It
   * bounds away toward a direction on the ground, given as an angle from the front.
   */
  rabbit(camera: THREE.Camera, toward: number | undefined): boolean;
  /** How many of these points on the structure lie along the spike. */
  alongSpike(points: THREE.Vector3[]): number;
  update(seconds: number, camera: THREE.PerspectiveCamera, viewHeight: number): void;
  /** What is under way, for a test to read. */
  state(): { flecks: number; spewing: boolean; rabbit?: THREE.Vector3 };
}

export interface SurprisesOptions {
  structure: THREE.Mesh;
  structureSize: number;
  /** Half the structure's depth, in world units. */
  halfDepth: number;
  features: Feature[];
  /** The height of the ground at a distance from the middle of the scene. */
  heightAt(radius: number): number;
  /** How far from the middle the rabbit runs before it is gone. */
  reach: number;
}

// The most flecks of glitter in the air at once.
const CAPACITY = 3200;
// Glitter falls slowly: gravity pulls it down and the air holds it back.
const GRAVITY = 1.6;
const DRAG = 1.2;
// A spew lasts this long and lets out this many flecks a second.
export const SPEW_SECONDS = 3.2;
const SPEW_RATE = 420;
// A thing counts as on the spike when it is this near the spike's axis, in structure
// lengths, and at least this far along it from the base.
const ON_SPIKE = 0.08;
const PAST_BASE = 0.15;

// The rabbit's length, in structure lengths.
const RABBIT = 0.11;
// The rabbit looks out of the hollow for this long, then goes.
const PEEK = 0.8;
const FIRST_HOP = 0.5;
const HOP = 0.34;

const GLITTER_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  attribute float aFade;
  uniform float uTime;
  uniform float uScale;
  varying vec3 vColor;
  varying float vFlash;
  varying float vFade;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    // Each fleck turns in the light: it flashes for a moment, then dims.
    float turn = sin(uTime * (9.0 + aSeed * 14.0) + aSeed * 90.0);
    vFlash = smoothstep(0.75, 1.0, turn);
    vFade = aFade;
    vColor = color;
    gl_PointSize = aSize * aFade * (0.6 + 0.4 * turn * turn + 0.5 * vFlash) * uScale / -mvPosition.z;
  }
`;

const GLITTER_FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vFlash;
  varying float vFade;
  void main() {
    // A fleck is a small diamond, brightest in the middle.
    vec2 point = gl_PointCoord * 2.0 - 1.0;
    float edge = abs(point.x) + abs(point.y);
    if (edge > 1.0 || vFade <= 0.0) discard;
    vec3 shade = mix(vColor, vec3(1.0), clamp(vFlash * 0.65 + (1.0 - edge) * 0.1, 0.0, 1.0));
    gl_FragColor = vec4(shade, min(1.0, vFade * 1.6));
    #include <colorspace_fragment>
  }
`;

class Glitter {
  readonly points: THREE.Points;
  alive = 0;
  private readonly position = new Float32Array(CAPACITY * 3).fill(-9999);
  private readonly velocity = new Float32Array(CAPACITY * 3);
  private readonly color = new Float32Array(CAPACITY * 3);
  private readonly size = new Float32Array(CAPACITY);
  private readonly seed = new Float32Array(CAPACITY);
  private readonly fade = new Float32Array(CAPACITY);
  private readonly age = new Float32Array(CAPACITY);
  // How long each fleck lasts. Zero marks a fleck that is not in the air.
  private readonly life = new Float32Array(CAPACITY);
  private readonly uniforms = { uTime: { value: 0 }, uScale: { value: 1 } };
  private readonly geometry = new THREE.BufferGeometry();
  private cursor = 0;

  constructor() {
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.position, 3));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(this.color, 3));
    this.geometry.setAttribute("aSize", new THREE.BufferAttribute(this.size, 1));
    this.geometry.setAttribute("aSeed", new THREE.BufferAttribute(this.seed, 1));
    this.geometry.setAttribute("aFade", new THREE.BufferAttribute(this.fade, 1));
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: GLITTER_VERTEX,
      fragmentShader: GLITTER_FRAGMENT,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
    });
    this.points = new THREE.Points(this.geometry, material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
  }

  /** Let out flecks from a point, along a direction, each with a hue from 0 to 1. */
  emit(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    count: number,
    speed: [number, number],
    spread: number,
    hue: () => number,
  ): void {
    const tint = new THREE.Color();
    const way = new THREE.Vector3();
    for (let fleck = 0; fleck < count; fleck++) {
      const i = this.cursor;
      this.cursor = (i + 1) % CAPACITY;
      if (this.life[i] === 0) this.alive++;
      way.randomDirection();
      this.position.set([origin.x + way.x * 0.03, origin.y + way.y * 0.03, origin.z + way.z * 0.03], i * 3);
      way.multiplyScalar(spread).add(direction).normalize();
      way.multiplyScalar(speed[0] + (speed[1] - speed[0]) * Math.random());
      this.velocity.set([way.x, way.y, way.z], i * 3);
      tint.setHSL(hue(), 1, 0.56);
      this.color.set([tint.r, tint.g, tint.b], i * 3);
      this.size[i] = 0.035 + 0.05 * Math.random();
      this.seed[i] = Math.random();
      this.fade[i] = 1;
      this.age[i] = 0;
      this.life[i] = 2.6 + 3 * Math.random();
    }
    for (const name of ["position", "color", "aSize", "aSeed", "aFade"]) {
      this.geometry.getAttribute(name).needsUpdate = true;
    }
  }

  update(step: number, seconds: number, viewScale: number, heightAt: (radius: number) => number): void {
    this.uniforms.uTime.value = seconds;
    this.uniforms.uScale.value = viewScale;
    this.points.visible = this.alive > 0;
    if (this.alive === 0 || step <= 0) return;
    const slowed = Math.exp(-DRAG * step);
    const { position, velocity } = this;
    for (let i = 0; i < CAPACITY; i++) {
      if (this.life[i] === 0) continue;
      const at = i * 3;
      this.age[i] += step;
      const landed = position[at + 1] < heightAt(Math.hypot(position[at], position[at + 2]));
      if (this.age[i] >= this.life[i] || landed) {
        this.life[i] = 0;
        this.fade[i] = 0;
        position[at + 1] = -9999;
        this.alive--;
        continue;
      }
      // Each fleck flutters a little as it falls.
      const flutter = seconds * 5 + this.seed[i] * 40;
      velocity[at] = velocity[at] * slowed + Math.sin(flutter) * 0.9 * step;
      velocity[at + 1] = velocity[at + 1] * slowed - GRAVITY * step;
      velocity[at + 2] = velocity[at + 2] * slowed + Math.cos(flutter * 1.3) * 0.9 * step;
      position[at] += velocity[at] * step;
      position[at + 1] += velocity[at + 1] * step;
      position[at + 2] += velocity[at + 2] * step;
      this.fade[i] = 1 - (this.age[i] / this.life[i]) ** 3;
    }
    this.geometry.getAttribute("position").needsUpdate = true;
    this.geometry.getAttribute("aFade").needsUpdate = true;
  }
}

type Blob = [x: number, y: number, rx: number, ry: number, turn: number];

// The rabbit as overlapping ovals, facing right, in a frame 256 wide and 192 high.
// Stretched out in the air:
const LEAP: { body: Blob[]; ear: Blob; eye: [number, number]; tail: [number, number] } = {
  body: [
    [48, 122, 40, 10, -15],
    [22, 136, 16, 6, -5],
    [84, 100, 36, 32, 0],
    [126, 96, 58, 27, -6],
    [166, 94, 26, 24, 0],
    [206, 112, 34, 7, 15],
    [200, 70, 24, 18, -12],
    [184, 36, 9, 30, -28],
    [174, 44, 8, 26, -45],
  ],
  ear: [184, 38, 4.5, 21, -28],
  eye: [208, 66],
  tail: [48, 84],
};
// Gathered up on the ground:
const TUCK: typeof LEAP = {
  body: [
    [96, 148, 40, 9, 0],
    [92, 108, 38, 36, 0],
    [128, 104, 48, 32, -4],
    [160, 106, 24, 26, 0],
    [170, 140, 9, 22, 8],
    [186, 78, 24, 18, -8],
    [178, 40, 9, 30, -10],
    [166, 46, 8, 27, -24],
  ],
  ear: [178, 42, 4.5, 21, -10],
  eye: [194, 74],
  tail: [52, 104],
};
const FRAME = [256, 192];

/** Four pictures of a cut paper rabbit, side by side: leaping and gathered, facing right and then left. */
function drawRabbits(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = FRAME[0] * 4;
  canvas.height = FRAME[1];
  const context = canvas.getContext("2d")!;
  const oval = ([x, y, rx, ry, turn]: Blob): void => {
    context.beginPath();
    context.ellipse(x, y, rx, ry, THREE.MathUtils.degToRad(turn), 0, Math.PI * 2);
    context.fill();
  };
  [LEAP, TUCK, LEAP, TUCK].forEach((pose, frame) => {
    context.save();
    if (frame < 2) context.translate(frame * FRAME[0], 0);
    else {
      context.translate((frame + 1) * FRAME[0], 0);
      context.scale(-1, 1);
    }
    // The shaded edge of the paper, then the paper itself.
    context.fillStyle = "#b99a78";
    context.save();
    context.translate(2, 3);
    pose.body.forEach(oval);
    oval([pose.tail[0], pose.tail[1], 14, 13, 0]);
    context.restore();
    context.fillStyle = "#fbf3e4";
    pose.body.forEach(oval);
    context.fillStyle = "#ffffff";
    oval([pose.tail[0], pose.tail[1], 14, 13, 0]);
    context.fillStyle = "#f0b3aa";
    oval(pose.ear);
    context.fillStyle = "#3a2a26";
    oval([pose.eye[0], pose.eye[1], 3.4, 3.4, 0]);
    context.restore();
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  // The pictures share one sheet, so the texture is not blended down across them.
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.repeat.x = 0.25;
  return texture;
}

interface Hop {
  from: THREE.Vector3;
  to: THREE.Vector3;
  height: number;
  at: number;
  seconds: number;
}

export function buildSurprises(options: SurprisesOptions): Surprises {
  const { structure, structureSize, heightAt } = options;
  const group = new THREE.Group();
  const raycaster = new THREE.Raycaster();
  raycaster.firstHitOnly = true;

  const spike = options.features.find((feature) => feature.shape === "spike");
  const hollow = options.features.find((feature) => feature.shape === "hollow");
  const tip = new THREE.Vector3();
  const base = new THREE.Vector3();
  const axis = new THREE.Vector3(0, 1, 0);
  if (spike) {
    tip.set(spike.tip[0], spike.tip[1], 0).multiplyScalar(structureSize);
    base.set(spike.base[0], spike.base[1], 0).multiplyScalar(structureSize);
    axis.copy(tip).sub(base).normalize();
  }

  const glitter = new Glitter();
  group.add(glitter.points);
  let spewUntil = -Infinity;
  let spewStarts = false;
  let owed = 0;
  let last = 0;

  const texture = drawRabbits();
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, color: 0xf6eee0, alphaTest: 0.4, transparent: true }),
  );
  // The rabbit's length is about nine tenths of a picture's width, and its feet are near the bottom.
  const width = (RABBIT * structureSize) / 0.9;
  const size = new THREE.Vector2(width, (width * FRAME[1]) / FRAME[0]);
  sprite.center.set(0.5, 0.2);
  sprite.visible = false;
  group.add(sprite);
  let run: { start: THREE.Vector3; hops: Hop[]; from: number | undefined } | undefined;
  const right = new THREE.Vector3();
  const stride = new THREE.Vector3();

  function onGround(x: number, z: number): THREE.Vector3 {
    return new THREE.Vector3(x, heightAt(Math.hypot(x, z)), z);
  }

  function rabbit(camera: THREE.Camera, toward: number | undefined): boolean {
    if (!hollow || run) return false;
    // The hollow on the side of the structure that the camera is on.
    const side = camera.position.z >= 0 ? 1 : -1;
    raycaster.set(
      new THREE.Vector3(hollow.center[0] * structureSize, hollow.center[1] * structureSize, side * 50),
      new THREE.Vector3(0, 0, -side),
    );
    const hit = raycaster.intersectObject(structure, false)[0];
    if (!hit) return false;
    const start = hit.point.clone();
    start.z += side * 0.03 * structureSize;

    // Down in front of the structure, around its end, and away toward the gap.
    const angle = toward ?? (side > 0 ? Math.PI : 0);
    const away = new THREE.Vector2(Math.sin(angle), Math.cos(angle));
    const end = Math.abs(away.x) > 0.25 ? Math.sign(away.x) : 1;
    const front = side * (options.halfDepth + 0.18 * structureSize);
    const path = new THREE.CatmullRomCurve3(
      [
        onGround(start.x + end * 0.05 * structureSize, front),
        onGround(end * 0.62 * structureSize, front * 0.9),
        onGround(end * 0.8 * structureSize, 0),
        onGround(away.x * 1.6 * structureSize + end * 0.4 * structureSize, away.y * 1.6 * structureSize),
        onGround(away.x * options.reach, away.y * options.reach),
      ],
      false,
      "centripetal",
    );
    const length = path.getLength();
    const hops: Hop[] = [{ from: start, to: path.getPointAt(0), height: 0.09 * structureSize, at: 0, seconds: FIRST_HOP }];
    let along = 0;
    let reach = 0.17 * structureSize;
    while (along < length) {
      const next = Math.min(length, along + reach);
      const from = path.getPointAt(along / length);
      const to = path.getPointAt(next / length);
      // The curve cuts corners between its points, so each landing is put back on the ground.
      from.y = heightAt(Math.hypot(from.x, from.z));
      to.y = heightAt(Math.hypot(to.x, to.z));
      const before = hops[hops.length - 1];
      hops.push({
        from,
        to,
        height: Math.min(0.16, 0.08 + 0.012 * hops.length) * structureSize,
        at: before.at + before.seconds,
        seconds: HOP,
      });
      along = next;
      reach = Math.min(0.4 * structureSize, reach * 1.1);
    }
    run = { start, hops, from: undefined };
    return true;
  }

  function moveRabbit(seconds: number, camera: THREE.Camera): void {
    if (!run) return;
    run.from ??= seconds;
    const since = seconds - run.from;
    sprite.visible = true;
    let frame = 1;
    let facing = 1;
    if (since < PEEK) {
      // The rabbit grows out of the hollow and looks around.
      sprite.position.copy(run.start);
      sprite.scale.set(size.x, size.y, 1).multiplyScalar(THREE.MathUtils.smoothstep(since, 0, 0.35));
      sprite.material.rotation = 0;
      facing = Math.sin(since * 9) > 0 ? 1 : -1;
    } else {
      const hop = run.hops.find((candidate) => since - PEEK < candidate.at + candidate.seconds);
      if (!hop) {
        sprite.visible = false;
        run = undefined;
        return;
      }
      const through = (since - PEEK - hop.at) / hop.seconds;
      sprite.position.lerpVectors(hop.from, hop.to, through);
      sprite.position.y += hop.height * 4 * through * (1 - through);
      sprite.scale.set(size.x, size.y, 1);
      frame = through > 0.12 && through < 0.88 ? 0 : 1;
      // The rabbit faces the way it is going across the screen, and tips up and down with each bound.
      stride.subVectors(hop.to, hop.from);
      right.setFromMatrixColumn(camera.matrixWorld, 0);
      facing = stride.dot(right) >= 0 ? 1 : -1;
      const rise = hop.height * 4 * (1 - 2 * through) + stride.y;
      sprite.material.rotation = facing * Math.atan2(rise, Math.hypot(stride.x, stride.z)) * 0.6;
    }
    texture.offset.x = (frame + (facing > 0 ? 0 : 2)) * 0.25;
  }

  return {
    group,
    spike: spike?.id,
    hollow: hollow?.id,
    puff(strength: number): void {
      if (!spike) return;
      const hue = Math.random();
      glitter.emit(tip, axis, Math.round(6 + 44 * strength), [0.5, 1.2 + 1.3 * strength], 0.6, () => hue + Math.random() * 0.2);
    },
    spew(): void {
      if (spike) spewStarts = true;
    },
    rabbit,
    alongSpike(points: THREE.Vector3[]): number {
      if (!spike) return 0;
      const length = tip.distanceTo(base);
      const offset = new THREE.Vector3();
      return points.filter((point) => {
        const along = offset.subVectors(point, base).dot(axis) / length;
        if (along < PAST_BASE || along > 1.05) return false;
        return offset.addScaledVector(axis, -along * length).length() < ON_SPIKE * structureSize;
      }).length;
    },
    update(seconds: number, camera: THREE.PerspectiveCamera, viewHeight: number): void {
      // A page that was hidden comes back after a long gap. The glitter carries on from where it was.
      const step = THREE.MathUtils.clamp(seconds - last, 0, 0.1);
      last = seconds;
      if (spewStarts) {
        spewStarts = false;
        spewUntil = seconds + SPEW_SECONDS;
      }
      if (seconds < spewUntil) {
        // The colors run through the rainbow as the spew goes on.
        owed += SPEW_RATE * step;
        const flecks = Math.floor(owed);
        owed -= flecks;
        const band = (spewUntil - seconds) * 0.5;
        glitter.emit(tip, axis, flecks, [1.2, 3.4], 0.45, () => band + Math.random() * 0.14);
      }
      // A fleck's size is in world units, and this turns it into pixels at a distance of one unit.
      const viewScale = viewHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
      glitter.update(step, seconds, viewScale, heightAt);
      moveRabbit(seconds, camera);
    },
    state: () => ({
      flecks: glitter.alive,
      spewing: last < spewUntil,
      rabbit: run && sprite.visible ? sprite.position.clone() : undefined,
    }),
  };
}
