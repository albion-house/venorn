import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";
import { applySettings, createPlaced, throb, type Placed } from "./placement";
import { buildSurroundings, type Surroundings } from "./scene";
import { playPin, playRemove, setWind } from "./sound";
import type { Criteria, Manifest, Range, Settings } from "./types";

const ASSET_SET = "veneration-ornamentation";
const ASSETS = `${import.meta.env.BASE_URL}assets/${ASSET_SET}/`;
// The structure's longer side in world units.
const STRUCTURE_SIZE = 4;
// How far the camera stands from the structure in the front view. The layers are laid out for this distance.
const VIEW_DISTANCE = 9;
// The camera may dip this far below level before the ground gets in the way.
const BELOW_LEVEL = THREE.MathUtils.degToRad(6);
// How far the point the camera looks at may be moved from the middle of the structure.
const PAN_REACH = STRUCTURE_SIZE * 0.8;
const HOLD_TO_REMOVE_MS = 550;
const TAP_SLOP = 6;

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

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0xc9b79a, 1.3));

const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 1000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.screenSpacePanning = true;
controls.zoomToCursor = true;
controls.minDistance = STRUCTURE_SIZE * 0.12;
controls.minPolarAngle = 0.05;
controls.maxPolarAngle = Math.PI / 2 + BELOW_LEVEL;
controls.listenToKeyEvents(window);

const raycaster = new THREE.Raycaster();
raycaster.firstHitOnly = true;
const loader = new GLTFLoader();
const models = new Map<string, Loaded>();
const placed: { thing: Placed; pinnedAt: number }[] = [];
let structure: THREE.Mesh;
let manifest: Manifest;
let surroundings: Surroundings | undefined;
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

/** How far back the camera stands to fit the structure in the window. */
function frontDistance(): number {
  return VIEW_DISTANCE / Math.min(1, camera.aspect * 1.1);
}

function resize(): void {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  // The camera stays inside the layers that are wrapped around the scene.
  const inside = (surroundings?.innerRadius ?? VIEW_DISTANCE * 4) * 0.85;
  controls.maxDistance = Math.max(inside - PAN_REACH, frontDistance() * 1.05);
}

/** Look at the structure straight on, as the painting does. */
function frontView(): void {
  controls.target.set(0, 0, 0);
  camera.position.set(0, 0, Math.min(frontDistance(), controls.maxDistance));
  controls.update();
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
    ["Depth", "depth", adjust.depth],
    ["Wrap", "conform", adjust.conform],
  ];
  if (adjust.fold) ranges.push(["Fold", "fold", adjust.fold]);
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
  remove.addEventListener("click", () => takeOff(thing));
  adjustPanel.append(remove);
}

function takeOff(thing: Placed): void {
  const id = thing.criteria.id;
  unpin(thing);
  playRemove();
  say(`Removed ${id}`);
}

function aim(event: { clientX: number; clientY: number }): void {
  const bounds = canvas.getBoundingClientRect();
  raycaster.setFromCamera(
    new THREE.Vector2(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    ),
    camera,
  );
}

/** The pinned thing under the pointer, unless the structure is in front of it. */
function thingUnder(event: { clientX: number; clientY: number }): Placed | undefined {
  aim(event);
  const onThing = raycaster.intersectObjects(
    placed.map((entry) => entry.thing.mesh),
    false,
  )[0];
  if (!onThing) return undefined;
  const onStructure = raycaster.intersectObject(structure, false)[0];
  if (onStructure && onStructure.distance < onThing.distance - 0.02 * STRUCTURE_SIZE) return undefined;
  return placed.find((entry) => entry.thing.mesh === onThing.object)!.thing;
}

/** A tap selects the thing under it, or pins the chosen kind to the structure. */
function tap(event: PointerEvent): void {
  const thing = thingUnder(event);
  if (thing) {
    select(thing);
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
  say(`Pinned ${chosen}. Right-click it, or press and hold, to remove it`);
}

/** Tell taps, right-clicks and long presses apart from the drags that move the camera. */
function watchPointer(): void {
  let down: { x: number; y: number; button: number } | undefined;
  let hold: number | undefined;
  let held = false;
  const moved = (event: PointerEvent): boolean =>
    !down || Math.hypot(event.clientX - down.x, event.clientY - down.y) >= TAP_SLOP;

  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  canvas.addEventListener("pointerdown", (event) => {
    down = { x: event.clientX, y: event.clientY, button: event.button };
    held = false;
    window.clearTimeout(hold);
    if (event.pointerType !== "mouse") {
      // A finger held still on a pinned thing removes it.
      hold = window.setTimeout(() => {
        const thing = thingUnder(event);
        if (!thing) return;
        held = true;
        navigator.vibrate?.(15);
        takeOff(thing);
      }, HOLD_TO_REMOVE_MS);
    }
  });
  canvas.addEventListener("pointermove", (event) => {
    if (moved(event)) window.clearTimeout(hold);
  });
  canvas.addEventListener("pointercancel", () => {
    window.clearTimeout(hold);
    down = undefined;
  });
  canvas.addEventListener("pointerup", (event) => {
    window.clearTimeout(hold);
    const still = !moved(event);
    const button = down?.button;
    down = undefined;
    if (!still || held) return;
    if (button === 2) {
      const thing = thingUnder(event);
      if (thing) takeOff(thing);
    } else if (button === 0) {
      tap(event);
    }
  });
}

async function start(): Promise<void> {
  manifest = await (await fetch(`${ASSETS}manifest.json`)).json();
  document.title = `venorn: ${manifest.title}`;

  structure = await loadMesh(manifest.structure.model);
  structure.scale.setScalar(STRUCTURE_SIZE);
  structure.geometry.boundsTree = new MeshBVH(structure.geometry);
  structure.castShadow = true;
  structure.receiveShadow = true;
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

  if (manifest.scene) {
    surroundings = await buildSurroundings(manifest.scene, ASSETS, STRUCTURE_SIZE, VIEW_DISTANCE);
    scene.add(surroundings.group);
  } else {
    const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
    sun.position.set(-3, 4, 6);
    scene.add(sun);
    scene.background = new THREE.Color(0x6f93c9);
  }

  buildTray();
  watchPointer();
  document.querySelector("#arrange")!.addEventListener("click", arrangeAsPainted);
  document.querySelector("#clear")!.addEventListener("click", () => {
    while (placed.length > 0) unpin(placed[0].thing);
    say("");
  });
  document.querySelector("#front")!.addEventListener("click", frontView);
  document.querySelector<HTMLInputElement>("#painted")!.addEventListener("change", async (event) => {
    if (!paintedTexture) {
      paintedTexture = await new THREE.TextureLoader().loadAsync(ASSETS + manifest.structure.painted);
      paintedTexture.flipY = false;
      paintedTexture.colorSpace = THREE.SRGBColorSpace;
    }
    material.map = (event.target as HTMLInputElement).checked ? paintedTexture : bareTexture;
    material.needsUpdate = true;
  });
  document.querySelector<HTMLInputElement>("#sound")!.addEventListener("change", (event) => {
    setWind((event.target as HTMLInputElement).checked);
  });

  resize();
  frontView();
  window.addEventListener("resize", resize);
  say("Choose a thing from the tray, then tap the skull. Drag to look around");

  const reach = new THREE.Vector3(PAN_REACH, PAN_REACH, PAN_REACH);
  const farthest = reach.clone().negate();
  const draw = (seconds: number): void => {
    for (const { thing, pinnedAt } of placed) throb(thing, seconds, performance.now() / 1000 - pinnedAt);
    surroundings?.update(seconds);
    controls.target.clamp(farthest, reach);
    controls.update();
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop((milliseconds) => draw(milliseconds / 1000));

  // Lets a test or the browser console drive the page. A browser stops drawing a page
  // it is not showing, so a test calls draw itself.
  Object.assign(window, {
    venorn: { manifest, models, placed, choose, arrangeAsPainted, frontView, structure, camera, controls, scene, draw },
  });
}

start().catch((error: unknown) => {
  console.error(error);
  say(`Could not start: ${error instanceof Error ? error.message : String(error)}`);
});
