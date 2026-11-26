// The scene around the structure: a sky dome, the far and floating layers
// wrapped around the scene, the ground the structure rests on, a sun and birds.

import * as THREE from "three";
import type { Layer, SceneLayers } from "./types";

export interface Surroundings {
  group: THREE.Group;
  sun: THREE.DirectionalLight;
  /** The nearest that a layer wrapped around the scene comes to the middle. */
  innerRadius: number;
  update(seconds: number): void;
}

// The sun goes once around the sky in this many seconds.
const DAY = 600;
// The floating layer goes once around the scene in this many seconds.
const DRIFT = 1500;
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

/**
 * Wrap one layer's picture around the scene. The picture repeats around the
 * circle, every second copy mirrored so the copies join. One copy faces the
 * front view at the size and place it has in the source image.
 */
function buildRing(
  layer: Layer,
  texture: THREE.Texture,
  radius: number,
  structureSize: number,
  viewDistance: number,
): THREE.Mesh {
  // A layer behind the structure is seen from inside its ring, a layer around the structure from outside.
  const inside = radius > viewDistance;
  const grow = inside ? (viewDistance + radius) / viewDistance : (viewDistance - radius) / viewDistance;
  const width = (layer.right - layer.left) * structureSize * grow;
  const copies = Math.max(2, 2 * Math.round(TURN / (width / radius) / 2));
  const middle = ((layer.left + layer.right) / 2) * structureSize * grow;
  const facing = inside ? Math.PI + middle / radius : middle / radius;

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.MirroredRepeatWrapping;
  texture.repeat.x = copies;
  texture.anisotropy = 8;

  const height = (layer.top - layer.bottom) * structureSize * grow;
  const geometry = new THREE.CylinderGeometry(radius, radius, height, copies * 24, 1, true, facing - TURN / copies / 2);
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, fog: false });
  if (layer.role === "ground") {
    material.alphaTest = 0.5;
  } else {
    material.transparent = true;
    material.depthWrite = false;
  }
  const ring = new THREE.Mesh(geometry, material);
  ring.position.y = ((layer.top + layer.bottom) / 2) * structureSize * grow;
  // Seen from inside, a ring shows its picture mirrored, so it is flipped back.
  if (inside) ring.scale.x = -1;
  return ring;
}

/** The ground: flat under the structure, then falling away so the far layer stands right behind the ground layer. */
function buildGround(
  scene: SceneLayers,
  flatRadius: number,
  outerRadius: number,
  structureSize: number,
  viewDistance: number,
): THREE.Mesh {
  const level = scene.ground.y * structureSize;
  // Past the flat part, the ground follows the front view's line of sight, so the front view sees it edge on.
  const fall = (radius: number): number => (level * (viewDistance + radius)) / (viewDistance + flatRadius);
  const profile = [
    new THREE.Vector2(0, level),
    new THREE.Vector2(flatRadius, level),
    new THREE.Vector2(outerRadius, fall(outerRadius)),
  ];
  const ground = new THREE.Mesh(
    new THREE.LatheGeometry(profile, 96),
    new THREE.MeshStandardMaterial({ color: scene.ground.color, roughness: 1, side: THREE.DoubleSide }),
  );
  ground.receiveShadow = true;
  return ground;
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

interface Bird {
  body: THREE.Group;
  wings: [THREE.Mesh, THREE.Mesh];
  offset: number;
  height: number;
  beat: number;
}

/** A small flock that circles the scene behind the far layer. */
function buildBirds(radius: number): Bird[] {
  const wing = new THREE.PlaneGeometry(1, 0.28);
  wing.translate(0.5, 0, 0);
  const ink = new THREE.MeshBasicMaterial({ color: 0x1d2433, side: THREE.DoubleSide, fog: false });
  const birds: Bird[] = [];
  for (let i = 0; i < 5; i++) {
    const body = new THREE.Group();
    const left = new THREE.Mesh(wing, ink);
    const right = new THREE.Mesh(wing, ink);
    right.scale.x = -1;
    body.add(left, right);
    body.scale.setScalar(radius * 0.012);
    body.renderOrder = -8;
    birds.push({
      body,
      wings: [left, right],
      offset: i * 0.035 + (i % 2) * 0.012,
      height: radius * (0.2 + 0.025 * ((i * 3) % 5)),
      beat: 5 + (i % 3),
    });
  }
  return birds;
}

export async function buildSurroundings(
  scene: SceneLayers,
  assets: string,
  structureSize: number,
  viewDistance: number,
): Promise<Surroundings> {
  const group = new THREE.Group();
  group.add(buildSky(scene, structureSize, viewDistance));

  const loader = new THREE.TextureLoader();
  const groundLayer = scene.layers.find((layer) => layer.role === "ground");
  // The ground layer stands in a ring just outside the structure.
  const groundRadius = 0.62 * structureSize;
  let drifting: THREE.Mesh | undefined;
  let innerRadius = Infinity;
  let outerRadius = groundRadius * 4;

  const order: Record<Layer["role"], number> = { far: -5, floating: -4, ground: 0 };
  for (const layer of scene.layers) {
    const texture = await loader.loadAsync(assets + layer.image);
    const radius = layer.role === "ground" ? groundRadius : layer.distance * structureSize;
    const ring = buildRing(layer, texture, radius, structureSize, viewDistance);
    ring.renderOrder = order[layer.role];
    group.add(ring);
    if (layer.role !== "ground") {
      innerRadius = Math.min(innerRadius, radius);
      outerRadius = Math.max(outerRadius, radius);
    }
    if (layer.motion === "drift") drifting = ring;
  }
  if (groundLayer) group.add(buildGround(scene, groundRadius, outerRadius + 4, structureSize, viewDistance));

  const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const reach = structureSize * 0.9;
  Object.assign(sun.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 1, far: 60 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  group.add(sun, sun.target);
  const disc = buildSunDisc();
  group.add(disc);

  const birds = buildBirds(outerRadius + 10);
  for (const bird of birds) group.add(bird.body);

  const high = new THREE.Color(0xfff6e6);
  const low = new THREE.Color(0xffc890);
  const direction = new THREE.Vector3();

  function update(seconds: number): void {
    // The sun starts high in front of the structure, to its left, and circles the sky.
    const around = -0.6 + (seconds / DAY) * TURN;
    const up = THREE.MathUtils.degToRad(34 + 20 * Math.cos((seconds / DAY) * TURN));
    direction.set(Math.sin(around) * Math.cos(up), Math.sin(up), Math.cos(around) * Math.cos(up));
    sun.position.copy(direction).multiplyScalar(30);
    sun.color.lerpColors(low, high, THREE.MathUtils.smoothstep(up, 0.25, 0.8));
    disc.position.copy(direction).multiplyScalar(380);

    if (drifting) drifting.rotation.y = (seconds / DRIFT) * TURN;

    for (const bird of birds) {
      const along = 2.4 + (seconds / 140) * TURN + bird.offset;
      const radius = outerRadius + 10;
      const bob = Math.sin(seconds * 0.4 + bird.offset * 40);
      bird.body.position.set(Math.sin(along) * radius, bird.height + bob, Math.cos(along) * radius);
      bird.body.rotation.y = along;
      const flap = 0.5 * Math.sin(seconds * bird.beat + bird.offset * 90);
      bird.wings[0].rotation.z = flap;
      bird.wings[1].rotation.z = -flap;
    }
  }
  update(0);

  return { group, sun, innerRadius, update };
}
