// The meadow: paper plants standing in a thicket around the structure, and
// layers of cut paper wrapped around it out to the horizon, all moving in a wind.

import * as THREE from "three";
import type { Plant, SceneLayers } from "./types";

export interface Meadow {
  group: THREE.Group;
  update(seconds: number): void;
}

const TURN = Math.PI * 2;
// The ground is flat this far from the middle, in structure lengths, then falls away.
const FLAT = 0.62;
// How much the ground drops for each unit away from the flat part. From the front
// view this leaves the far meadow in sight as a band under the far layer.
const FALL = 0.11;
// Plants stand in a thicket out to this many structure lengths.
const THICKET = 1.9;
// Single plants thin out between the thicket and this many structure lengths.
const SCATTER = 3.6;
// The wind blows along this direction on the ground.
const WIND = new THREE.Vector2(1, 0.35).normalize();

interface PaperUniforms {
  uTime: { value: number };
}

interface PaperOptions {
  // Extra softness for the whole picture, in mipmap levels.
  soft: number;
  // How far the top of the paper swings in the wind, in world units.
  sway: number;
  // Whether each instance curls and leans a little differently.
  bendy: boolean;
}

/** A small, stable random number generator, so the meadow grows the same way every time. */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

const SWAY_VERTEX = /* glsl */ `
  vec3 transformed = vec3(position);
  float paperHeight = uv.y;
  #ifdef USE_INSTANCING
    vec3 paperOrigin = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec3 paperAcross = instanceMatrix[0].xyz;
    vec3 paperThrough = instanceMatrix[2].xyz;
  #else
    vec3 paperOrigin = (modelMatrix * vec4(position.x, 0.0, position.z, 1.0)).xyz;
    vec3 paperAcross = vec3(1.0, 0.0, 0.0);
    vec3 paperThrough = vec3(0.0, 0.0, 1.0);
  #endif
  float paperSeed = fract(sin(dot(paperOrigin.xz, vec2(12.9898, 78.233))) * 43758.5453);
  #ifdef PAPER_BENDY
    // Every plant's paper curls and leans a little differently.
    float paperCurl = (paperSeed - 0.5) * 0.9;
    float paperLean = (fract(paperSeed * 7.13) - 0.5) * 0.5;
    transformed.z += paperCurl * transformed.x * transformed.x * (0.5 + paperHeight) + paperLean * paperHeight * paperHeight;
  #endif
  // Gusts travel across the meadow, and each plant swings in its own time.
  float paperAlong = dot(paperOrigin.xz, uWind);
  float paperGust = 0.55 + 0.45 * sin(uTime * 0.31 + paperAlong * 0.22);
  float paperSwing = paperHeight * paperHeight * paperGust
    * (sin(uTime * 1.25 + paperAlong * 0.9 + paperSeed * 6.283) + 0.35 * sin(uTime * 2.9 + paperSeed * 40.0));
  vec3 paperPush = vec3(uWind.x, 0.0, uWind.y) * paperSwing * uSway;
  transformed.x += dot(paperPush, paperAcross) / dot(paperAcross, paperAcross);
  transformed.z += dot(paperPush, paperThrough) / dot(paperThrough, paperThrough);
`;

const WHERE_VERTEX = /* glsl */ `
  #include <project_vertex>
  vec4 paperWorld = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    paperWorld = instanceMatrix * paperWorld;
  #endif
  paperWorld = modelMatrix * paperWorld;
  vPaperRadius = length(paperWorld.xz);
  vPaperView = -mvPosition.z;
`;

const PAPER_FRAGMENT = /* glsl */ `
  #ifdef USE_MAP
    // Paper far from the middle of the scene is out of focus and fades into the haze.
    float paperFar = smoothstep(uBlur.x, uBlur.y, vPaperRadius);
    float paperBias = uSoft + uBlur.z * paperFar;
    vec4 sampledDiffuseColor = texture2D(map, vMapUv, paperBias);
    // The cut edge of the paper catches the light on one side and is in shade on the other.
    float paperEdge = sampledDiffuseColor.a - texture2D(map, vMapUv + uTexel * vec2(-1.5, 1.5), paperBias).a;
    sampledDiffuseColor.rgb = mix(sampledDiffuseColor.rgb, vec3(1.0, 0.96, 0.88), clamp(paperEdge * 1.5, 0.0, 0.55));
    sampledDiffuseColor.rgb *= 1.0 - clamp(-paperEdge * 1.2, 0.0, 0.3);
    sampledDiffuseColor.rgb = mix(sampledDiffuseColor.rgb, uHaze, paperFar * 0.6);
    // Paper right in front of the camera thins out, so it does not block the view.
    sampledDiffuseColor.a *= smoothstep(uFade.x, uFade.y, vPaperView);
    diffuseColor *= sampledDiffuseColor;
  #endif
`;

class Paper {
  readonly time: PaperUniforms = { uTime: { value: 0 } };
  private readonly haze: THREE.Color;
  private readonly blur: THREE.Vector3;

  constructor(haze: THREE.Color, blurFrom: number, blurTo: number) {
    this.haze = haze;
    this.blur = new THREE.Vector3(blurFrom, blurTo, 3.2);
  }

  /** A lit paper material for one picture, and the material that draws its shadow. */
  materials(texture: THREE.Texture, options: PaperOptions): { paper: THREE.Material; shadow: THREE.Material } {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const size = texture.image as { width: number; height: number };
    const uniforms = {
      ...this.time,
      uWind: { value: WIND },
      uSway: { value: options.sway },
      uSoft: { value: options.soft },
      uBlur: { value: this.blur },
      uHaze: { value: this.haze },
      uTexel: { value: new THREE.Vector2(1 / size.width, 1 / size.height) },
      uFade: { value: new THREE.Vector2(0.25, 1.1) },
    };
    const declare = /* glsl */ `
      uniform float uTime; uniform vec2 uWind; uniform float uSway;
      varying float vPaperRadius; varying float vPaperView;
    `;
    const defines = options.bendy ? { PAPER_BENDY: "" } : {};

    const paper = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 1,
      metalness: 0,
      side: THREE.DoubleSide,
      // Soft edges without sorting: the picture's transparency thins out each pixel's coverage.
      alphaToCoverage: true,
    });
    paper.defines = { ...paper.defines, ...defines };
    paper.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", `#include <common>\n${declare}`)
        .replace("#include <begin_vertex>", SWAY_VERTEX)
        .replace("#include <project_vertex>", WHERE_VERTEX);
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          uniform float uSoft; uniform vec3 uBlur; uniform vec3 uHaze; uniform vec2 uTexel; uniform vec2 uFade;
          varying float vPaperRadius; varying float vPaperView;`,
        )
        .replace("#include <map_fragment>", PAPER_FRAGMENT)
        // The picture's own colors show through in shade, so the paper never goes dull.
        .replace("#include <emissivemap_fragment>", "totalEmissiveRadiance = diffuseColor.rgb * 0.3;");
    };

    const shadow = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map: texture,
      alphaTest: 0.5,
    });
    shadow.defines = { ...shadow.defines, ...defines };
    shadow.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", `#include <common>\nuniform float uTime; uniform vec2 uWind; uniform float uSway;`)
        .replace("#include <begin_vertex>", SWAY_VERTEX);
    };
    return { paper, shadow };
  }
}

/** The ground: flat under the structure, then falling away on every side. */
function groundHeight(radius: number, level: number, flat: number): number {
  return level - FALL * Math.max(0, radius - flat);
}

function buildGround(scene: SceneLayers, flat: number, outer: number, level: number): THREE.Mesh {
  const profile = [
    new THREE.Vector2(0, level),
    new THREE.Vector2(flat, level),
    new THREE.Vector2(outer, groundHeight(outer, level, flat)),
  ];
  const ground = new THREE.Mesh(
    new THREE.LatheGeometry(profile, 96),
    new THREE.MeshStandardMaterial({ color: scene.ground.color, roughness: 1, side: THREE.DoubleSide }),
  );
  ground.receiveShadow = true;
  return ground;
}

/** One long picture of the meadow wrapped around the scene as a ring of cut paper. */
function buildRing(
  texture: THREE.Texture,
  paper: Paper,
  radius: number,
  base: number,
  width: number,
  height: number,
  turn: number,
): THREE.Mesh {
  const copies = Math.max(2, 2 * Math.round(TURN / (width / radius) / 2));
  const own = texture.clone();
  own.wrapS = THREE.MirroredRepeatWrapping;
  own.repeat.x = copies;
  own.needsUpdate = true;
  const geometry = new THREE.CylinderGeometry(radius, radius, height, copies * 16, 6, true, turn);
  const { paper: material } = paper.materials(own, { soft: 0, sway: height * 0.05, bendy: false });
  const ring = new THREE.Mesh(geometry, material);
  ring.position.y = base + height / 2;
  ring.receiveShadow = true;
  return ring;
}

interface Spot {
  x: number;
  z: number;
  radius: number;
  // 0 right beside the structure, rising to 1 a little way off.
  clear: number;
}

/** Where plants stand: close together near the structure, thinning out, and nowhere under the structure itself. */
function scatter(next: () => number, structureSize: number): Spot[] {
  const spots: Spot[] = [];
  const reach = SCATTER * structureSize;
  const dense = THICKET * structureSize;
  for (let i = 0; i < 2600; i++) {
    const radius = Math.sqrt(next()) * reach;
    const around = next() * TURN;
    const x = Math.cos(around) * radius;
    const z = Math.sin(around) * radius;
    // The structure lies along x, about half a structure length to each side and thin across.
    const beside = Math.hypot(x / (0.5 * structureSize), z / (0.26 * structureSize));
    if (beside < 1) continue;
    const keep = radius < dense ? 1 : 0.25 * (1 - (radius - dense) / (reach - dense)) + 0.05;
    if (next() < keep) spots.push({ x, z, radius, clear: THREE.MathUtils.smoothstep(beside, 1, 2.6) });
  }
  return spots;
}

export async function buildMeadow(
  scene: SceneLayers,
  assets: string,
  structureSize: number,
  outerRadius: number,
): Promise<Meadow> {
  const group = new THREE.Group();
  const level = scene.ground.y * structureSize;
  const flat = FLAT * structureSize;
  group.add(buildGround(scene, flat, outerRadius + 4, level));

  const horizon = new THREE.Color(scene.backdrop.stops[scene.backdrop.stops.length - 1][1]);
  const paper = new Paper(horizon, THICKET * structureSize, outerRadius * 0.8);
  const loader = new THREE.TextureLoader();
  const next = random(20261126);

  // Rings of cut paper, standing farther and farther out. The nearest are the ornate
  // cutout, and the far ones are the painted meadow, larger so they still read at a distance.
  const whole = scene.layers.find((layer) => layer.role === "ground");
  const cutout = scene.ground.cutout;
  const [cutoutPicture, wholePicture] = await Promise.all([
    loader.loadAsync(assets + cutout.image),
    whole ? loader.loadAsync(assets + whole.image) : undefined,
  ]);
  const width = (cutout.right - cutout.left) * structureSize;
  const height = (cutout.top - cutout.bottom) * structureSize;
  const rings: { radius: number; scale: number; picture: THREE.Texture }[] = [
    { radius: flat, scale: 1, picture: cutoutPicture },
    { radius: flat * 1.55, scale: 1.1, picture: cutoutPicture },
  ];
  for (let radius = flat * 2.4, scale = 1.3; radius < outerRadius * 0.86; radius *= 1.38, scale *= 1.22) {
    rings.push({ radius, scale, picture: wholePicture ?? cutoutPicture });
  }
  for (const { radius, scale, picture } of rings) {
    const base = groundHeight(radius, level, flat) - 0.02 * height;
    group.add(buildRing(picture, paper, radius, base, width * scale, height * scale, next() * TURN));
  }

  // Plants standing on their own roots: pairs of crossed cutouts in the thicket, single ones farther out.
  const spots = scatter(next, structureSize);
  const perPlant = new Map<Plant, THREE.Matrix4[]>();
  const plants = scene.ground.plants;
  const place = (plant: Plant, spot: Spot, facing: number, size: number): void => {
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(spot.x, groundHeight(spot.radius, level, flat) - 0.01, spot.z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, facing, (next() - 0.5) * 0.16)),
      new THREE.Vector3(plant.width * structureSize * size, plant.height * structureSize * size, 1),
    );
    perPlant.set(plant, [...(perPlant.get(plant) ?? []), matrix]);
  };
  for (const spot of spots) {
    // Plants beside the structure stay low, so they frame it without hiding it.
    const size = (0.4 + 0.6 * spot.clear) * (0.75 + 0.6 * next()) + 0.12 * (spot.radius / structureSize);
    const facing = next() * TURN;
    place(plants[Math.floor(next() * plants.length)], spot, facing, size);
    if (spot.radius < THICKET * structureSize) {
      place(plants[Math.floor(next() * plants.length)], spot, facing + TURN / 4 + (next() - 0.5) * 0.7, size);
    }
  }

  await Promise.all(
    [...perPlant].map(async ([plant, matrices]) => {
      const texture = await loader.loadAsync(assets + plant.image);
      const { paper: material, shadow } = paper.materials(texture, { soft: 0.6, sway: 0.07, bendy: true });
      // The card's bottom edge is the ground, and its root is the point it turns and stands on.
      const card = new THREE.PlaneGeometry(1, 1, 4, 6);
      card.translate(0.5 - plant.root, 0.5, 0);
      const stand = new THREE.InstancedMesh(card, material, matrices.length);
      matrices.forEach((matrix, index) => stand.setMatrixAt(index, matrix));
      stand.customDepthMaterial = shadow;
      stand.castShadow = true;
      stand.receiveShadow = true;
      // The wind moves every instance, so the set is never cut from view as a whole.
      stand.frustumCulled = false;
      group.add(stand);
    }),
  );

  return {
    group,
    update(seconds: number): void {
      paper.time.uTime.value = seconds;
    },
  };
}
