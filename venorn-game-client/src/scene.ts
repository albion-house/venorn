// The scene around the structure: a sky dome, the far and floating layers
// wrapped around the scene, a sun and birds. meadow.ts builds the ground.

import * as THREE from "three";
import type { Layer, SceneLayers } from "./types";

export interface Surroundings {
  group: THREE.Group;
  sun: THREE.DirectionalLight;
  /** How near and how far the layers wrapped around the scene stand from the middle. */
  innerRadius: number;
  outerRadius: number;
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
  // The ring is seen from inside. A picture that far away has to be larger to look the size it is in the image.
  const grow = (viewDistance + radius) / viewDistance;
  const width = (layer.right - layer.left) * structureSize * grow;
  const copies = Math.max(2, 2 * Math.round(TURN / (width / radius) / 2));
  const middle = ((layer.left + layer.right) / 2) * structureSize * grow;
  const facing = Math.PI + middle / radius;

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.MirroredRepeatWrapping;
  texture.repeat.x = copies;
  texture.anisotropy = 8;

  const height = (layer.top - layer.bottom) * structureSize * grow;
  const geometry = new THREE.CylinderGeometry(radius, radius, height, copies * 24, 1, true, facing - TURN / copies / 2);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    fog: false,
    transparent: true,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(geometry, material);
  ring.position.y = ((layer.top + layer.bottom) / 2) * structureSize * grow;
  // Seen from inside, a ring shows its picture mirrored, so it is flipped back.
  ring.scale.x = -1;
  return ring;
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
  let drifting: THREE.Mesh | undefined;
  let innerRadius = Infinity;
  let outerRadius = 0;

  // The ground layer is the meadow's to build. The far and floating layers wrap around the scene.
  const order = { far: -5, floating: -4 };
  for (const layer of scene.layers) {
    if (layer.role === "ground") continue;
    const texture = await loader.loadAsync(assets + layer.image);
    const radius = layer.distance * structureSize;
    const ring = buildRing(layer, texture, radius, structureSize, viewDistance);
    ring.renderOrder = order[layer.role];
    group.add(ring);
    innerRadius = Math.min(innerRadius, radius);
    outerRadius = Math.max(outerRadius, radius);
    if (layer.motion === "drift") drifting = ring;
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

  return { group, sun, innerRadius, outerRadius, update };
}
