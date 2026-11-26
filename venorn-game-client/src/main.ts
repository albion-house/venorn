import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";
import { applySettings, createPlaced, throb, type Placed } from "./placement";
import { playPin } from "./sound";
import type { Criteria, Manifest, Range, Settings } from "./types";

const ASSET_SET = "veneration-ornamentation";
const ASSETS = `${import.meta.env.BASE_URL}assets/${ASSET_SET}/`;
// The structure's longer side in world units.
const STRUCTURE_SIZE = 4;
// How far the camera may turn from straight ahead.
const TURN_SIDEWAYS = THREE.MathUtils.degToRad(8);
const TURN_UP_DOWN = THREE.MathUtils.degToRad(4);

THREE.Mesh.prototype.raycast = acceleratedRaycast;

interface Loaded {
  criteria: Criteria;
  mesh: THREE.Mesh;
  preview: string;
}

const canvas = document.querySelector<HTMLCanvasElement>("#scene")!;
const tray = document.querySelector<HTMLElement>("#tray")!;
const adjustPanel = document.querySelector<HTMLElement>("#adjust")!;
const status = document.querySelector<HTMLElement>("#status")!;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0xc9b79a, 1.5));
const sun = new THREE.DirectionalLight(0xfff1d6, 1.6);
sun.position.set(-3, 4, 6);
scene.add(sun);

const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
const controls = new OrbitControls(camera, canvas);
controls.enablePan = false;
controls.enableDamping = true;
controls.minAzimuthAngle = -TURN_SIDEWAYS;
controls.maxAzimuthAngle = TURN_SIDEWAYS;
controls.minPolarAngle = Math.PI / 2 - TURN_UP_DOWN;
controls.maxPolarAngle = Math.PI / 2 + TURN_UP_DOWN;

const raycaster = new THREE.Raycaster();
raycaster.firstHitOnly = true;
const loader = new GLTFLoader();
const models = new Map<string, Loaded>();
const placed: { thing: Placed; pinnedAt: number }[] = [];
let structure: THREE.Mesh;
let manifest: Manifest;
let bareTexture: THREE.Texture | null = null;
let paintedTexture: THREE.Texture | undefined;
let chosen: string | undefined;
let selected: Placed | undefined;

async function loadMesh(file: string): Promise<THREE.Mesh> {
  const gltf = await loader.loadAsync(ASSETS + file);
  let mesh: THREE.Mesh | undefined;
  gltf.scene.traverse((node) => {
    if (!mesh && (node as THREE.Mesh).isMesh) mesh = node as THREE.Mesh;
  });
  if (!mesh) throw new Error(`${file} holds no mesh`);
  return mesh;
}

function resize(): void {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  // Back the camera off until the structure fits the shorter side of the window.
  const half = (STRUCTURE_SIZE / 2) * 1.2;
  const distance = half / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / Math.min(1, camera.aspect);
  camera.position.setLength(distance);
  controls.minDistance = distance * 0.35;
  controls.maxDistance = distance * 1.2;
}

function say(message: string): void {
  status.textContent = message;
}

function choose(id: string): void {
  chosen = id;
  for (const button of tray.querySelectorAll("button")) {
    button.setAttribute("aria-pressed", String(button.dataset.id === id));
  }
  say(`Tap the skull to pin ${id}`);
}

function buildTray(): void {
  for (const kind of manifest.kinds) {
    for (const entry of kind.models) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.id = entry.id;
      button.title = entry.id;
      button.setAttribute("aria-pressed", "false");
      const image = document.createElement("img");
      image.src = ASSETS + entry.preview;
      image.alt = entry.id;
      button.append(image);
      button.addEventListener("click", () => choose(entry.id));
      tray.append(button);
    }
  }
}

function pin(id: string, point: THREE.Vector3, normal: THREE.Vector3, settings?: Partial<Settings>): Placed {
  const { criteria, mesh } = models.get(id)!;
  const thing = createPlaced(criteria, mesh, point, normal, STRUCTURE_SIZE);
  Object.assign(thing.settings, settings);
  applySettings(thing, structure, STRUCTURE_SIZE);
  scene.add(thing.group);
  placed.push({ thing, pinnedAt: performance.now() / 1000 });
  return thing;
}

function unpin(thing: Placed): void {
  scene.remove(thing.group);
  thing.mesh.geometry.dispose();
  placed.splice(
    placed.findIndex((entry) => entry.thing === thing),
    1,
  );
  if (selected === thing) select(undefined);
}

function clamp(value: number, range: Range): number {
  return Math.min(range.max, Math.max(range.min, value));
}

/** Put every thing where the painting has it. */
function arrangeAsPainted(): void {
  while (placed.length > 0) unpin(placed[0].thing);
  const turn: Record<string, number> = {};
  const origin = new THREE.Vector3();
  const toward = new THREE.Vector3(0, 0, -1);
  for (const spot of manifest.arrangement) {
    const kind = manifest.kinds.find((entry) => entry.id === spot.kind);
    if (!kind) continue;
    turn[kind.id] = (turn[kind.id] ?? -1) + 1;
    const entry = kind.models[turn[kind.id] % kind.models.length];
    const { criteria } = models.get(entry.id)!;

    origin.set(spot.x * STRUCTURE_SIZE, spot.y * STRUCTURE_SIZE, 50);
    raycaster.set(origin, toward);
    const hit = raycaster.intersectObject(structure, false)[0];
    if (!hit?.face) continue;
    pin(entry.id, hit.point, hit.face.normal.clone().transformDirection(structure.matrixWorld), {
      scale: clamp(spot.size / criteria.size.natural, criteria.adjust.scale),
      spin: clamp(spot.angle - criteria.source.angle, criteria.adjust.spin),
    });
  }
  say(`Arranged ${placed.length} things as painted`);
}

function slider(label: string, range: Range, value: number, onInput: (value: number) => void): HTMLLabelElement {
  const row = document.createElement("label");
  const input = document.createElement("input");
  input.type = "range";
  input.min = String(range.min);
  input.max = String(range.max);
  input.step = String((range.max - range.min) / 200);
  input.value = String(value);
  input.addEventListener("input", () => onInput(Number(input.value)));
  row.append(label, input);
  return row;
}

/** Show the adjustments the selected thing's criteria allow. */
function select(thing: Placed | undefined): void {
  selected = thing;
  adjustPanel.replaceChildren();
  adjustPanel.hidden = !thing;
  if (!thing) return;

  const { criteria, settings } = thing;
  const change = (key: keyof Omit<Settings, "mirror">) => (value: number) => {
    settings[key] = value;
    applySettings(thing, structure, STRUCTURE_SIZE);
  };
  const heading = document.createElement("h2");
  heading.textContent = `${criteria.id} (${criteria.role})`;
  adjustPanel.append(heading);

  const { adjust, attach } = criteria;
  const ranges: [string, keyof Omit<Settings, "mirror">, Range][] = [
    ["Size", "scale", adjust.scale],
    ["Turn", "spin", adjust.spin],
    ["Lift", "standoff", attach.standoff],
    ["Tilt", "tilt", adjust.tilt],
    ["Wrap", "conform", adjust.conform],
  ];
  if (adjust.bend.enabled && adjust.bend.max) {
    ranges.push(["Bend", "bend", { default: 0, min: -adjust.bend.max, max: adjust.bend.max }]);
  }
  for (const [label, key, range] of ranges) {
    // A range with one value is fixed by the criteria, so it gets no slider.
    if (range.max > range.min) adjustPanel.append(slider(label, range, settings[key], change(key)));
  }

  if (adjust.mirror) {
    const row = document.createElement("label");
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = settings.mirror;
    box.addEventListener("change", () => {
      settings.mirror = box.checked;
      applySettings(thing, structure, STRUCTURE_SIZE);
    });
    row.append("Mirror", box);
    adjustPanel.append(row);
  }

  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "Remove";
  remove.addEventListener("click", () => unpin(thing));
  adjustPanel.append(remove);
}

/** A tap selects the thing under it, or pins the chosen kind to the structure. */
function tap(event: PointerEvent): void {
  const bounds = canvas.getBoundingClientRect();
  const pointer = new THREE.Vector2(
    ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
    -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
  );
  raycaster.setFromCamera(pointer, camera);

  const onThing = raycaster.intersectObjects(
    placed.map((entry) => entry.thing.mesh),
    false,
  )[0];
  if (onThing) {
    select(placed.find((entry) => entry.thing.mesh === onThing.object)!.thing);
    return;
  }

  const hit = raycaster.intersectObject(structure, false)[0];
  if (!hit?.face) {
    select(undefined);
    return;
  }
  if (!chosen) {
    say("Choose a thing from the tray first");
    return;
  }
  const normal = hit.face.normal.clone().transformDirection(structure.matrixWorld);
  select(pin(chosen, hit.point, normal));
  playPin();
  say(`Pinned ${chosen}`);
}

function watchTaps(): void {
  let downAt: { x: number; y: number } | undefined;
  canvas.addEventListener("pointerdown", (event) => {
    downAt = { x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener("pointerup", (event) => {
    // A press that moved was a drag to turn the camera.
    if (downAt && Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y) < 6) tap(event);
    downAt = undefined;
  });
}

async function start(): Promise<void> {
  manifest = await (await fetch(`${ASSETS}manifest.json`)).json();
  document.title = `venorn: ${manifest.title}`;

  structure = await loadMesh(manifest.structure.model);
  structure.scale.setScalar(STRUCTURE_SIZE);
  structure.geometry.boundsTree = new MeshBVH(structure.geometry);
  scene.add(structure);
  structure.updateMatrixWorld(true);
  const material = structure.material as THREE.MeshStandardMaterial;
  bareTexture = material.map;

  await Promise.all(
    manifest.kinds.flatMap((kind) =>
      kind.models.map(async (entry) => {
        const [criteria, mesh] = await Promise.all([
          fetch(ASSETS + entry.criteria).then((response) => response.json() as Promise<Criteria>),
          loadMesh(entry.model),
        ]);
        models.set(entry.id, { criteria, mesh, preview: entry.preview });
      }),
    ),
  );

  buildTray();
  watchTaps();
  document.querySelector("#arrange")!.addEventListener("click", arrangeAsPainted);
  document.querySelector("#clear")!.addEventListener("click", () => {
    while (placed.length > 0) unpin(placed[0].thing);
    say("");
  });
  document.querySelector<HTMLInputElement>("#painted")!.addEventListener("change", async (event) => {
    if (!paintedTexture) {
      paintedTexture = await new THREE.TextureLoader().loadAsync(ASSETS + manifest.structure.painted);
      paintedTexture.flipY = false;
      paintedTexture.colorSpace = THREE.SRGBColorSpace;
    }
    material.map = (event.target as HTMLInputElement).checked ? paintedTexture : bareTexture;
    material.needsUpdate = true;
  });

  camera.position.set(0, 0, 1);
  resize();
  window.addEventListener("resize", resize);
  say("Choose a thing from the tray, then tap the skull");

  renderer.setAnimationLoop((milliseconds) => {
    const seconds = milliseconds / 1000;
    for (const { thing, pinnedAt } of placed) throb(thing, seconds, performance.now() / 1000 - pinnedAt);
    controls.update();
    renderer.render(scene, camera);
  });

  // Lets a test or the browser console drive the page.
  Object.assign(window, { venorn: { manifest, models, placed, choose, arrangeAsPainted, structure, camera, scene } });
}

start().catch((error: unknown) => {
  console.error(error);
  say(`Could not start: ${error instanceof Error ? error.message : String(error)}`);
});
