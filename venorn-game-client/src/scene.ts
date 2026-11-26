// The scene around the structure: a sky dome, the far and floating layers
// wrapped around the scene, banks of clouds, a sun and birds. meadow.ts builds the ground.

import * as THREE from "three";
import { buildClouds, type Clouds } from "./clouds";
import type { Layer, SceneLayers } from "./types";

export interface Surroundings {
  group: THREE.Group;
  sun: THREE.DirectionalLight;
  /** How near and how far the layers wrapped around the scene stand from the middle. */
  innerRadius: number;
  outerRadius: number;
  /** The banks of clouds cut from the floating layer, if there is one. */
  clouds?: Clouds;
  update(seconds: number, camera: THREE.Camera): void;
  /** The direction of the gap in the far layer nearest to where the camera looks, as an angle from the front. */
  gapNear(camera: THREE.Camera): number | undefined;
  /** Bring the next flock forward, so that it crosses no later than this moment. */
  flockBy(seconds: number): void;
}

// The sun goes once around the sky in this many seconds.
const DAY = 600;
// The floating layer goes once around the scene in this many seconds.
const DRIFT = 1500;
// A flock crosses a gap in the far layer in this many seconds.
const CROSSING = 13;
// Seconds between one flock and the next: at least the first number, at most the sum.
const QUIET: [number, number] = [22, 30];
const TURN = Math.PI * 2;

/** Elevation in radians of a height on the structure's plane, as seen from the front view. */
function elevation(height: number, structureSize: number, viewDistance: number): number {
  return Math.atan((height * structureSize) / viewDistance);
}

/** A dome painted with the backdrop's gradient. Above the image's top and below its horizon the end colors hold. */
function buildSky(scene: SceneLayers, structureSize: number, viewDistance: number): THREE.Mesh {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 1024;
  const context = canvas.getContext("2d")!;
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  const stops = scene.backdrop.stops.map(
    ([height, color]) => [0.5 - elevation(height, structureSize, viewDistance) / Math.PI, color] as const,
  );
  gradient.addColorStop(0, stops[0][1]);
  for (const [at, color] of stops) gradient.addColorStop(THREE.MathUtils.clamp(at, 0, 1), color);
  gradient.addColorStop(1, stops[stops.length - 1][1]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(400, 32, 48),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, depthWrite: false, fog: false }),
  );
  dome.renderOrder = -10;
  return dome;
}

interface Ring {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  radius: number;
  copies: number;
  // The angle the first copy starts at, and how much larger than the image the picture is drawn.
  start: number;
  grow: number;
  mirrored: boolean;
}

/**
 * Wrap one layer's picture around the scene. The picture repeats around the
 * circle as it is when its ends join, and otherwise with every second copy
 * mirrored so the copies join. One copy faces the front view at the size and
 * place it has in the source image.
 */
function buildRing(
  layer: Layer,
  texture: THREE.Texture,
  radius: number,
  structureSize: number,
  viewDistance: number,
): Ring {
  // The ring is seen from inside. A picture that far away has to be larger to look the size it is in the image.
  const grow = (viewDistance + radius) / viewDistance;
  const width = (layer.right - layer.left) * structureSize * grow;
  const mirrored = layer.repeat !== "plain";
  // Mirrored copies come in pairs.
  const pair = mirrored ? 2 : 1;
  const copies = Math.max(2, pair * Math.round(TURN / (width / radius) / pair));
  const middle = ((layer.left + layer.right) / 2) * structureSize * grow;
  const start = Math.PI + middle / radius - TURN / copies / 2;

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = mirrored ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
  texture.repeat.x = copies;
  texture.anisotropy = 8;

  const height = (layer.top - layer.bottom) * structureSize * grow;
  const geometry = new THREE.CylinderGeometry(radius, radius, height, copies * 24, 1, true, start);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    fog: false,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = ((layer.top + layer.bottom) / 2) * structureSize * grow;
  // Seen from inside, a ring shows its picture mirrored, so it is flipped back.
  mesh.scale.x = -1;
  return { mesh, material, radius, copies, start, grow, mirrored };
}

/**
 * Make a layer's picture flow. Each part of the picture is pulled its own way
 * by a slow, smooth field, so neighboring clouds slither differently.
 */
function slither(ring: Ring, time: { value: number }): void {
  ring.material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time;
    shader.uniforms.uAround = { value: ring.copies * 2 };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        /* glsl */ `#include <common>
        uniform float uTime;
        uniform float uAround;
        // Smooth noise that joins up with itself once around the ring.
        float flowNoise(vec2 point, float around) {
          vec2 cell = floor(point);
          vec2 blend = fract(point);
          blend = blend * blend * (3.0 - 2.0 * blend);
          vec2 next = cell + 1.0;
          cell.x = mod(cell.x, around);
          next.x = mod(next.x, around);
          float a = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
          float b = fract(sin(dot(vec2(next.x, cell.y), vec2(127.1, 311.7))) * 43758.5453);
          float c = fract(sin(dot(vec2(cell.x, next.y), vec2(127.1, 311.7))) * 43758.5453);
          float d = fract(sin(dot(next, vec2(127.1, 311.7))) * 43758.5453);
          return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
        }`,
      )
      .replace(
        "#include <map_fragment>",
        /* glsl */ `
        vec2 flowAt = vMapUv * vec2(2.0, 2.6);
        vec2 slow = vec2(
          flowNoise(flowAt + vec2(uTime * 0.021, uTime * 0.013), uAround),
          flowNoise(flowAt + vec2(31.0 - uTime * 0.017, 12.3 + uTime * 0.011), uAround)) - 0.5;
        vec2 quick = vec2(
          flowNoise(flowAt * 3.0 + vec2(uTime * 0.06, 0.0), uAround * 3.0),
          flowNoise(flowAt * 3.0 + vec2(7.0, uTime * 0.05), uAround * 3.0)) - 0.5;
        vec4 sampledDiffuseColor = texture2D(map, vMapUv + slow * vec2(0.085, 0.04) + quick * vec2(0.014, 0.009));
        // The picture ends at the top of the image, so what the image cut off fades out there.
        sampledDiffuseColor.a *= smoothstep(1.0, 0.93, vMapUv.y);
        diffuseColor *= sampledDiffuseColor;`,
      );
  };
}

function buildSunDisc(): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d")!;
  const glow = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  glow.addColorStop(0, "rgba(255, 250, 225, 1)");
  glow.addColorStop(0.18, "rgba(255, 240, 190, 0.95)");
  glow.addColorStop(0.4, "rgba(255, 220, 160, 0.3)");
  glow.addColorStop(1, "rgba(255, 220, 160, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const disc = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthWrite: false, fog: false }));
  disc.scale.setScalar(60);
  disc.renderOrder = -9;
  return disc;
}

/** A gap between two masses of the far layer: its direction from the middle of the scene, its floor and its rim. */
interface Gap {
  angle: number;
  floor: number;
  rim: number;
}

/** Find the deepest dip in the far layer's top edge, once for each copy of the picture around the ring. */
function findGaps(layer: Layer, ring: Ring, structureSize: number): Gap[] {
  const edge = layer.skyline ?? [];
  if (edge.length < 3) return [];
  let best = 0;
  let depth = -Infinity;
  let rim = 0;
  for (let i = 1; i < edge.length - 1; i++) {
    const left = Math.max(...edge.slice(0, i).map((point) => point[1]));
    const right = Math.max(...edge.slice(i + 1).map((point) => point[1]));
    const lower = Math.min(left, right);
    if (lower - edge[i][1] > depth) {
      depth = lower - edge[i][1];
      best = i;
      rim = lower;
    }
  }
  if (depth <= 0) return [];
  const across = (edge[best][0] - layer.left) / (layer.right - layer.left);
  const gaps: Gap[] = [];
  for (let copy = 0; copy < ring.copies; copy++) {
    const within = ring.mirrored && copy % 2 === 1 ? 1 - across : across;
    gaps.push({
      // The ring is flipped, so its angles run the other way around the scene.
      angle: -(ring.start + ((copy + within) * TURN) / ring.copies),
      floor: edge[best][1] * structureSize * ring.grow,
      rim: rim * structureSize * ring.grow,
    });
  }
  return gaps;
}

interface Bird {
  body: THREE.Group;
  wings: [THREE.Mesh, THREE.Mesh];
  // Where the bird flies in the flock: behind the leader, and above or below it, from -1 to 1.
  behind: number;
  level: number;
  beat: number;
}

function buildBirds(size: number): Bird[] {
  const wing = new THREE.PlaneGeometry(1, 0.28);
  wing.translate(0.5, 0, 0);
  const ink = new THREE.MeshBasicMaterial({ color: 0x1d2433, side: THREE.DoubleSide, fog: false });
  const places: [number, number][] = [
    [0, 0],
    [1, 0.5],
    [1.2, -0.6],
    [2.1, 0.9],
    [2.4, -0.2],
    [3.2, 0.4],
  ];
  return places.map(([behind, level], index) => {
    const body = new THREE.Group();
    const left = new THREE.Mesh(wing, ink);
    const right = new THREE.Mesh(wing, ink);
    right.scale.x = -1;
    body.add(left, right);
    body.scale.setScalar(size);
    body.renderOrder = -8;
    body.visible = false;
    return { body, wings: [left, right], behind, level, beat: 6 + (index % 3) };
  });
}

/** A small, stable random number generator. */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export interface SurroundingsOptions {
  /** Called when a bird calls: where it is across the view, from -1 at the left to 1 at the right. */
  onBirdCall?: (across: number) => void;
}

export async function buildSurroundings(
  scene: SceneLayers,
  assets: string,
  structureSize: number,
  viewDistance: number,
  options: SurroundingsOptions = {},
): Promise<Surroundings> {
  const group = new THREE.Group();
  group.add(buildSky(scene, structureSize, viewDistance));

  const loader = new THREE.TextureLoader();
  const time = { value: 0 };
  let drifting: THREE.Mesh | undefined;
  let clouds: Clouds | undefined;
  let innerRadius = Infinity;
  let outerRadius = 0;
  let gaps: Gap[] = [];

  // The ground layer is the meadow's to build. The far and floating layers wrap around the scene.
  const order = { far: -5, floating: -4 };
  for (const layer of scene.layers) {
    if (layer.role === "ground") continue;
    const texture = await loader.loadAsync(assets + layer.image);
    const radius = layer.distance * structureSize;
    const ring = buildRing(layer, texture, radius, structureSize, viewDistance);
    ring.mesh.renderOrder = order[layer.role];
    group.add(ring.mesh);
    innerRadius = Math.min(innerRadius, radius);
    outerRadius = Math.max(outerRadius, radius);
    if (layer.motion === "drift") {
      drifting = ring.mesh;
      slither(ring, time);
    }
    if (layer.role === "floating" && !clouds) {
      // The banks are not rings, so they leave the camera's reach as it is.
      clouds = buildClouds(texture.image as HTMLImageElement);
      group.add(clouds.group);
    }
    if (layer.role === "far") gaps = findGaps(layer, ring, structureSize);
  }

  const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  // Shadows are drawn for the structure and the thicket right around it.
  const reach = structureSize * 1.15;
  Object.assign(sun.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 1, far: 60 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  group.add(sun, sun.target);
  const disc = buildSunDisc();
  group.add(disc);

  // Birds fly just behind the far layer, so they show only where it dips.
  const flightRadius = outerRadius + 3;
  const birds = buildBirds(flightRadius * 0.016);
  for (const bird of birds) group.add(bird.body);
  const next = random(7);
  let flight: { gap: Gap; from: number; way: number; height: number; calls: number[] } | undefined;
  let nextFlight = 5;

  const high = new THREE.Color(0xfff6e6);
  const low = new THREE.Color(0xffc890);
  const direction = new THREE.Vector3();
  const looking = new THREE.Vector3();
  const flock = new THREE.Vector3();

  function nearestGap(camera: THREE.Camera): Gap {
    camera.getWorldDirection(looking);
    const facing = Math.atan2(looking.x, looking.z);
    const turnTo = (angle: number): number => Math.abs(((angle - facing + Math.PI * 3) % TURN) - Math.PI);
    return gaps.reduce((nearest, candidate) => (turnTo(candidate.angle) < turnTo(nearest.angle) ? candidate : nearest));
  }

  function startFlight(seconds: number, camera: THREE.Camera): void {
    // The flock crosses the gap nearest to where the camera is looking.
    const gap = nearestGap(camera);
    flight = {
      gap,
      from: seconds,
      way: next() < 0.5 ? -1 : 1,
      height: gap.floor + (gap.rim - gap.floor) * (0.3 + 0.3 * next()),
      calls: [0.3, 0.42, 0.55, 0.7].map((at) => at + (next() - 0.5) * 0.08),
    };
    for (const bird of birds) bird.body.visible = true;
  }

  function fly(seconds: number, camera: THREE.Camera): void {
    if (!flight) {
      if (gaps.length > 0 && seconds >= nextFlight) startFlight(seconds, camera);
      return;
    }
    const progress = (seconds - flight.from) / CROSSING;
    if (progress >= 1) {
      for (const bird of birds) bird.body.visible = false;
      flight = undefined;
      nextFlight = seconds + QUIET[0] + QUIET[1] * next();
      return;
    }
    // The flock starts behind one mass of the far layer, crosses the gap, and goes behind the next.
    const sweep = (TURN / gaps.length) * 0.9;
    const spacing = birds[0].body.scale.x * 2.4;
    for (const bird of birds) {
      const along = flight.gap.angle + flight.way * ((progress - 0.5) * sweep - (bird.behind * spacing) / flightRadius);
      const bob = Math.sin(seconds * 0.9 + bird.behind * 3) * spacing * 0.2;
      bird.body.position.set(
        Math.sin(along) * flightRadius,
        flight.height + bird.level * spacing * 0.6 + bob,
        Math.cos(along) * flightRadius,
      );
      bird.body.rotation.y = along;
      const flap = 0.55 * Math.sin(seconds * bird.beat + bird.behind * 2);
      bird.wings[0].rotation.z = flap;
      bird.wings[1].rotation.z = -flap;
    }
    if (flight.calls.length > 0 && progress >= flight.calls[0]) {
      flight.calls.shift();
      flock.copy(birds[0].body.position).project(camera);
      options.onBirdCall?.(THREE.MathUtils.clamp(flock.x, -1, 1));
    }
  }

  function update(seconds: number, camera: THREE.Camera): void {
    time.value = seconds;
    // The sun starts high in front of the structure, to its left, and circles the sky.
    const around = -0.6 + (seconds / DAY) * TURN;
    const up = THREE.MathUtils.degToRad(34 + 20 * Math.cos((seconds / DAY) * TURN));
    direction.set(Math.sin(around) * Math.cos(up), Math.sin(up), Math.cos(around) * Math.cos(up));
    sun.position.copy(direction).multiplyScalar(30);
    sun.color.lerpColors(low, high, THREE.MathUtils.smoothstep(up, 0.25, 0.8));
    disc.position.copy(direction).multiplyScalar(380);

    if (drifting) drifting.rotation.y = (seconds / DRIFT) * TURN;
    clouds?.update(seconds, camera);
    fly(seconds, camera);
  }

  return {
    group,
    sun,
    innerRadius,
    outerRadius,
    clouds,
    update,
    gapNear: (camera) => (gaps.length > 0 ? nearestGap(camera).angle : undefined),
    flockBy: (seconds) => {
      if (!flight) nextFlight = Math.min(nextFlight, seconds);
    },
  };
}
