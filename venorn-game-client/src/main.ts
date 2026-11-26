import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";
import { watchGestures, type Hit } from "./gestures";
import { buildCloudSound, type CloudSound } from "./clouds";
import { buildLinks, type Links } from "./links";
import { createMusic, type Music } from "./music";
import { applySettings, createPlaced, defaultSettings, settingsWithin, swell, throb, type Placed } from "./placement";
import { buildMeadow, type Meadow } from "./meadow";
import { buildPen, inkPicture, INKS, turnPicture, undoPicture, type Pen, type Stroke } from "./pen";
import {
  findModel,
  isBare,
  readSkull,
  saveStroke,
  saveThing,
  spotFrom,
  storageKey,
  writeSkull,
  type SavedSkull,
} from "./save";
import { buildSurroundings, type Surroundings } from "./scene";
import { bus, playBirdCall, playGlitter, playPin, playRemove, scheduleWind, setSound, startWind } from "./sound";
import { buildSurprises, SPEW_SECONDS, type Surprises } from "./surprises";
import type { Criteria, Manifest, Range, Settings } from "./types";
import * as ui from "./ui";
import { say } from "./ui";

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
// One press of an arrow key resizes a thing by this factor, and one press of a bracket turns it this far.
const KEY_RESIZE = 1.08;
const KEY_TURN = 15;
// The scene is fully lush once this many things are on the structure, and it follows them over a few seconds.
const LUSH_AT = 24;
const LUSH_SECONDS = 2.5;
// The first rabbit comes when this many things are on the structure. After it, a rabbit
// may come when a thing is placed, at this chance, and no sooner than this many seconds after the last.
const RABBIT_AT = 6;
const RABBIT_CHANCE = 0.3;
const RABBIT_REST = 100;
// This many things along the spike set off a spew of glitter, at most once in this many seconds.
const IN_A_ROW = 3;
const SPEW_REST = 300;
// The skull is saved this many milliseconds after its last change, so a drag is saved once, when it ends.
const SAVE_AFTER = 400;
// Where the browser keeps the skull on the structure, and the last one cleared away.
const SKULL_KEY = storageKey(ASSET_SET, "skull");
const LAST_KEY = storageKey(ASSET_SET, "last-skull");
// The ring around a selected thing is at least this many pixels in radius.
const MIN_RING = 16;
// A tap this many pixels from the middle of a thing still counts as a tap on it.
const NEAR_MISS = 14;
// The sound's timer runs this often, in milliseconds.
const SOUND_TICK = 250;

THREE.Mesh.prototype.raycast = acceleratedRaycast;

interface Loaded {
  criteria: Criteria;
  mesh: THREE.Mesh;
  preview: string;
}

const canvas = document.querySelector<HTMLCanvasElement>("#scene")!;
// A mouse or trackpad, as against a finger.
const precise = window.matchMedia("(pointer: fine)").matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
// three.js no longer has soft shadow maps and uses these in their place.
renderer.shadowMap.type = THREE.PCFShadowMap;
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

const raycaster = new THREE.Raycaster();
raycaster.firstHitOnly = true;
const loader = new GLTFLoader();
const models = new Map<string, Loaded>();
// soundedAt and rings say when the thing's note last began and how long it rings, in the draw loop's seconds.
const placed: { thing: Placed; pinnedAt: number; soundedAt: number; rings: number }[] = [];
let structure: THREE.Mesh;
let manifest: Manifest;
let surroundings: Surroundings | undefined;
let meadow: Meadow | undefined;
let surprises: Surprises | undefined;
let music: Music | undefined;
let cloudSound: CloudSound | undefined;
let pen: Pen | undefined;
// The id of the category that holds the pen's inks in place of models.
const PEN = "pen";
// The moment of the pen's last sound, so that a long stroke makes a few sounds and not hundreds.
let penSounded = 0;
// The pen is put aside and a drag turns the camera, even on the structure, which may fill the screen.
let turning = false;
let links: Links | undefined;
// The thing whose note sounded last. The next note's line starts from it.
let lastSounded: (typeof placed)[number] | undefined;
// The lowest and highest points of the structure, for turning a thing's height into a pitch.
let low = 0;
let high = 1;
// How lush the scene is, from 0 at the start to 1, and the last moment that was drawn.
let lush = 0;
let clock = 0;
let rabbits = 0;
// The first rabbit comes with the sixth thing on the skull, and later ones by chance.
let firstRabbitDue = true;
let lastRabbit = -Infinity;
let lastSpew = -Infinity;
let rowBest = 0;
let bareTexture: THREE.Texture | null = null;
let paintedTexture: THREE.Texture | undefined;
// Where across the view each bird call came from, kept so a test can count them.
const birdCalls: number[] = [];

// The five groups the player chooses from, the group now shown, and the variation chosen in each.
let categories: ui.Category[] = [];
const homes = new Map<string, { category: number; variation: number }>();
let category = 0;
const variation: number[] = [];
let selected: Placed | undefined;
let wheelOpen = false;
let designOpen = false;
// A drag, pinch or twist on a thing is under way, so the wheel stays out of the way.
let shaping = false;
// Things whose shape is recomputed before the next frame is drawn.
const stale = new Set<Placed>();
let onScreen: ui.OnScreen | undefined;
// The last skull cleared away, which the menu can bring back.
let lastSkull: SavedSkull | undefined;
// A saved skull is being put on the structure, so its things are not saved again as they go on.
let restoring = false;
let saveTimer: number | undefined;
// The browser refused to keep the skull, and the player has been told.
let refused = false;

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

/** Look at the structure straight on: from the front, as the painting does, or from behind. */
function lookFrom(side: 1 | -1): void {
  controls.target.set(0, 0, 0);
  camera.position.set(0, 0, side * Math.min(frontDistance(), controls.maxDistance));
  controls.update();
}

function frontView(): void {
  lookFrom(1);
}

/** The model the next tap on the structure places. */
function currentId(): string {
  return categories[category].choices[variation[category]].id;
}

/** Whether the pen is chosen in the dock. */
function painting(): boolean {
  return categories[category]?.id === PEN;
}

function undoStroke(): void {
  const undone = pen?.undo() ?? false;
  if (undone) changed();
  say(undone ? "Took back the last stroke" : "No stroke to take back");
}

/** Put the pen aside so a drag turns the camera, or take it up again. */
function turnView(): void {
  turning = !turning;
  ui.showVariation(categories, category, variation[category]);
  if (turning) say(`Drag to turn the view. ${precise ? "Click" : "Tap"} an ink to draw again`);
  else say("Drag on the skull to draw");
}

/** Show a category in the dock and its variations in the strip. */
function show(index: number): void {
  category = index;
  ui.showCategory(categories, category, variation[category], chooseVariation);
}

/** Choose a category. A selected thing turns into that category's current variation. */
function chooseCategory(index: number): void {
  if (!categories[index]) return;
  turning = false;
  if (categories[index].id === PEN) {
    // The pen draws on the structure, so no thing stays selected while it is chosen.
    select(undefined);
    show(index);
    say(`Glitter pen: drag on the skull to draw. ${precise ? "Press Z" : "Tap the arrow"} to take back a stroke`);
    return;
  }
  show(index);
  if (selected) swap(selected, currentId());
  else say(`${categories[index].name}: ${precise ? "click" : "tap"} the skull to place one`);
}

/** Choose a variation of the category shown. A selected thing turns into it. */
function chooseVariation(index: number): void {
  const count = categories[category].choices.length;
  variation[category] = ((index % count) + count) % count;
  // Choosing an ink takes the pen up again.
  if (turning) say("Drag on the skull to draw");
  turning = false;
  ui.showVariation(categories, category, variation[category]);
  if (selected && !painting()) swap(selected, currentId());
}

function stepVariation(by: number): void {
  chooseVariation(variation[category] + by);
}

function clamp(value: number, range: Range): number {
  return Math.min(range.max, Math.max(range.min, value));
}

/**
 * Pin a model to the structure. A thing brought back from a saved skull does not
 * throb as a new pin does, and keeps the slow pulse of an old one.
 */
function pin(
  id: string,
  point: THREE.Vector3,
  normal: THREE.Vector3,
  settings?: Partial<Settings>,
  restored = false,
): Placed {
  const { criteria, mesh } = models.get(id)!;
  const thing = createPlaced(criteria, mesh, point, normal, STRUCTURE_SIZE);
  Object.assign(thing.settings, settings);
  applySettings(thing, structure, STRUCTURE_SIZE);
  scene.add(thing.group);
  placed.push({ thing, pinnedAt: restored ? -Infinity : performance.now() / 1000, soundedAt: -Infinity, rings: 1 });
  changed();
  return thing;
}

function discard(thing: Placed): void {
  scene.remove(thing.group);
  thing.mesh.geometry.dispose();
  (thing.mesh.material as THREE.Material).dispose();
  stale.delete(thing);
}

function unpin(thing: Placed): void {
  discard(thing);
  placed.splice(
    placed.findIndex((entry) => entry.thing === thing),
    1,
  );
  if (selected === thing) select(undefined);
  changed();
}

/** Turn a placed thing into another model, where it is. */
function swap(thing: Placed, id: string): void {
  const entry = placed.find((candidate) => candidate.thing === thing);
  if (!entry || thing.criteria.id === id) return;
  const { criteria, mesh } = models.get(id)!;
  const next = createPlaced(criteria, mesh, thing.point, thing.normal, STRUCTURE_SIZE);
  // The new thing keeps the old one's size, turn and color as far as its own criteria allow.
  next.settings.scale = clamp(thing.settings.scale, criteria.adjust.scale);
  next.settings.spin = clamp(thing.settings.spin, criteria.adjust.spin);
  next.settings.hue = clamp(thing.settings.hue, criteria.adjust.hue);
  next.settings.mirror = thing.settings.mirror && criteria.adjust.mirror;
  applySettings(next, structure, STRUCTURE_SIZE);
  discard(thing);
  scene.add(next.group);
  entry.thing = next;
  changed();
  if (selected === thing) {
    selected = next;
    showDesign();
  }
}

/** Select a thing, or nothing. The dock and strip follow the thing selected. */
function select(thing: Placed | undefined, openWheel = false): void {
  selected = thing;
  wheelOpen = !!thing && openWheel;
  if (!thing) designOpen = false;
  showDesign();
  if (!thing) return;
  const home = homes.get(thing.criteria.id)!;
  variation[home.category] = home.variation;
  show(home.category);
}

/** Open the design bar on the selected thing, or close it. */
function showDesign(): void {
  const thing = designOpen ? selected : undefined;
  ui.showDesign(thing, {
    change: () => thing && markChanged(thing),
    reset: () => {
      if (!thing) return;
      Object.assign(thing.settings, defaultSettings(thing.criteria));
      reshape(thing);
    },
    close: () => {
      designOpen = false;
      showDesign();
    },
  });
}

/** Recompute a thing's shape before the next frame, and save the skull once the changes stop. */
function markChanged(thing: Placed): void {
  stale.add(thing);
  changed();
}

/** Recompute a thing's shape before the next frame, and keep the design bar in step. */
function reshape(thing: Placed): void {
  markChanged(thing);
  if (designOpen && thing === selected) ui.refreshDesign(thing);
}

function resizeThing(thing: Placed, factor: number): void {
  thing.settings.scale = clamp(thing.settings.scale * factor, thing.criteria.adjust.scale);
  reshape(thing);
}

function turnThing(thing: Placed, degrees: number): void {
  const range = thing.criteria.adjust.spin;
  const span = range.max - range.min;
  let spin = thing.settings.spin + degrees;
  // A range that covers the whole circle wraps around.
  if (span >= 360) spin = range.min + ((((spin - range.min) % span) + span) % span);
  thing.settings.spin = clamp(spin, range);
  reshape(thing);
}

/**
 * Let the placed things play: each one's note comes around on its own loop, the
 * thing swells and glows as it sounds, and a line joins it to the one before.
 */
function playMusic(seconds: number): void {
  const audio = bus();
  if (audio && !music) music = createMusic(audio.context, audio.master);
  // The music comes in sooner than the meadow grows, so the first few things can be heard.
  const sounded =
    music?.update(
      placed.map((entry) => ({
        key: entry,
        position: entry.thing.point,
        timbre: homes.get(entry.thing.criteria.id)!.category,
        height: (entry.thing.point.y - low) / (high - low),
      })),
      lush ** 0.6,
      camera,
    ) ?? [];
  for (const note of sounded) {
    const entry = note.key as (typeof placed)[number];
    entry.soundedAt = seconds;
    entry.rings = note.seconds;
    if (lastSounded && lastSounded !== entry && placed.includes(lastSounded)) {
      links?.connect(lastSounded.thing, entry.thing, seconds);
    }
    lastSounded = entry;
  }
  for (const entry of placed) {
    // A quick swell as the note begins, dying away as it rings.
    const since = seconds - entry.soundedAt;
    const amount = since < 0 || since > entry.rings ? 0 : Math.min(1, since / 0.15) * (1 - since / entry.rings) ** 2;
    swell(entry.thing, amount);
  }
  links?.update(seconds, renderer.domElement.width, renderer.domElement.height);
}

/** How lush the scene is on its way to being, from the number of things on the structure. */
function lushness(): number {
  return Math.min(1, placed.length / LUSH_AT);
}

/** Things lined up along the spike set off a spew of glitter. */
function checkRow(): void {
  if (!surprises?.spike) return;
  const row = surprises.alongSpike(placed.map((entry) => entry.thing.point));
  const grew = row >= IN_A_ROW && row > rowBest;
  rowBest = row;
  const now = performance.now() / 1000;
  if (!grew || now - lastSpew < SPEW_REST) return;
  lastSpew = now;
  surprises.spew();
  playGlitter(1, SPEW_SECONDS);
  say(`${row} in a row on the ${surprises.spike}`);
}

function sendRabbit(): boolean {
  if (!surprises?.rabbit(camera, surroundings?.gapNear(camera))) return false;
  rabbits++;
  firstRabbitDue = false;
  lastRabbit = performance.now() / 1000;
  // A flock crosses the gap the rabbit is making for.
  surroundings?.flockBy(clock + 5);
  return true;
}

/** The scene answers a thing being placed: a puff of glitter, and now and then something more. */
function decorated(): void {
  const strength = lushness();
  surprises?.puff(strength);
  playGlitter(strength * 0.5);
  checkRow();
  const now = performance.now() / 1000;
  const due =
    firstRabbitDue ? placed.length >= RABBIT_AT : now - lastRabbit >= RABBIT_REST && Math.random() < RABBIT_CHANCE;
  if (due) sendRabbit();
}

function takeOff(thing: Placed): void {
  unpin(thing);
  playRemove();
  say("Removed");
}

function clear(): void {
  while (placed.length > 0) unpin(placed[0].thing);
  pen?.clear();
  changed();
}

/** The skull on the structure as it is saved: its things and its strokes. */
function snapshot(): SavedSkull {
  return {
    version: 1,
    things: placed.map(({ thing }) => saveThing(thing, STRUCTURE_SIZE)),
    strokes: (pen?.strokes() ?? []).map((stroke) => saveStroke(stroke.ink.id, stroke.spots, STRUCTURE_SIZE)),
  };
}

/** Save the skull now. A bare skull leaves nothing saved. */
function saveNow(): void {
  window.clearTimeout(saveTimer);
  saveTimer = undefined;
  const skull = snapshot();
  if (writeSkull(SKULL_KEY, isBare(skull) ? undefined : skull) || refused) return;
  refused = true;
  say("This browser is not keeping the skull, so it will be gone when the page closes");
}

/** The skull has changed: save it once the changes stop. */
function changed(): void {
  if (restoring) return;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveNow, SAVE_AFTER);
}

/**
 * Put a saved skull on the structure in place of the one there. A saved thing whose
 * model the asset set no longer has is left out. Returns how many were left out.
 * The scene takes the skull in without answering it: no glitter, no burst and no rabbit.
 */
function restore(skull: SavedSkull): number {
  restoring = true;
  clear();
  const all = [...models.values()].map((entry) => entry.criteria);
  let missing = 0;
  for (const saved of skull.things) {
    const criteria = findModel(saved, all);
    if (!criteria) {
      missing++;
      continue;
    }
    const point = new THREE.Vector3().fromArray(saved.point).multiplyScalar(STRUCTURE_SIZE);
    const normal = new THREE.Vector3().fromArray(saved.normal).normalize();
    pin(criteria.id, point, normal, settingsWithin(criteria, saved.settings), true);
  }
  const strokes: Stroke[] = skull.strokes.flatMap((stroke) => {
    const ink = INKS.find((candidate) => candidate.id === stroke.ink);
    return ink ? [{ ink, spots: stroke.spots.map((spot) => spot && spotFrom(spot, STRUCTURE_SIZE)) }] : [];
  });
  pen?.redraw(strokes);
  restoring = false;
  // A row that was already on the spike is not a new one.
  rowBest = surprises?.spike ? surprises.alongSpike(placed.map((entry) => entry.thing.point)) : 0;
  if (placed.length >= RABBIT_AT) firstRabbitDue = false;
  return missing;
}

function without(missing: number): string {
  return missing === 0 ? "" : ` without ${missing} ${missing === 1 ? "thing" : "things"} this asset set no longer has`;
}

/** Set the last skull, which the menu can bring back, or none. */
function setLastSkull(skull: SavedSkull | undefined): void {
  lastSkull = skull && !isBare(skull) ? skull : undefined;
  document.querySelector<HTMLElement>("#bring-back")!.hidden = !lastSkull;
}

/** Keep a skull as the last skull, in the browser too. */
function putAside(skull: SavedSkull): void {
  setLastSkull(skull);
  writeSkull(LAST_KEY, lastSkull);
}

/** Start over with a bare skull. The skull that was there can be brought back from the menu. */
function clearSkull(): void {
  const skull = snapshot();
  if (isBare(skull)) {
    say("");
    return;
  }
  putAside(skull);
  clear();
  saveNow();
  say("Cleared. The menu can bring the skull back");
}

/** Bring back the last skull cleared away. The skull it replaces becomes the last skull, so nothing is lost. */
function bringBack(): void {
  if (!lastSkull) return;
  const replaced = snapshot();
  const missing = restore(lastSkull);
  putAside(replaced);
  saveNow();
  say(
    `Brought back the last skull${without(missing)}` +
      (lastSkull ? ". The menu can bring back the one it replaced" : ""),
  );
}

/** Put every thing where the painting has it, and its mirror image on the far side. */
function arrangeAsPainted(): void {
  const before = snapshot();
  const kept = !isBare(before);
  if (kept) putAside(before);
  clear();
  const turn: Record<string, number> = {};
  const origin = new THREE.Vector3();
  const toward = new THREE.Vector3();
  for (const spot of manifest.arrangement) {
    const kind = manifest.kinds.find((entry) => entry.id === spot.kind);
    if (!kind) continue;
    turn[kind.id] = (turn[kind.id] ?? -1) + 1;
    const entry = kind.models[turn[kind.id] % kind.models.length];
    const { criteria } = models.get(entry.id)!;
    const scale = clamp(spot.size / criteria.size.natural, criteria.adjust.scale);
    const spin = clamp(spot.angle - criteria.source.angle, criteria.adjust.spin);

    for (const side of [1, -1]) {
      origin.set(spot.x * STRUCTURE_SIZE, spot.y * STRUCTURE_SIZE, side * 50);
      raycaster.set(origin, toward.set(0, 0, -side));
      const hit = raycaster.intersectObject(structure, false)[0];
      if (!hit?.face) continue;
      const normal = hit.face.normal.clone().transformDirection(structure.matrixWorld);
      // On the far side the thing is flipped and turned the other way, as a mirror would show it.
      pin(entry.id, hit.point, normal, side === 1 ? { scale, spin } : { scale, spin: -spin, mirror: true });
    }
  }
  say(
    `Arranged ${placed.length} things as painted, on both sides` +
      (kept ? ". The menu can bring back the skull you had" : ""),
  );
  decorated();
}

const seen = new THREE.Vector3();
const sight = new THREE.Vector3();

function aim(x: number, y: number): void {
  const bounds = canvas.getBoundingClientRect();
  raycaster.setFromCamera(
    new THREE.Vector2(((x - bounds.left) / bounds.width) * 2 - 1, -((y - bounds.top) / bounds.height) * 2 + 1),
    camera,
  );
}

/** Where a thing is on the screen, unless it is out of view or behind the structure. */
function whereOnScreen(thing: Placed): ui.OnScreen | undefined {
  const sphere = thing.mesh.geometry.boundingSphere;
  if (!sphere) return undefined;
  seen.copy(sphere.center).project(camera);
  if (seen.z < -1 || seen.z > 1) return undefined;
  const away = camera.position.distanceTo(sphere.center);
  raycaster.set(camera.position, sight.copy(sphere.center).sub(camera.position).normalize());
  const hit = raycaster.intersectObject(structure, false)[0];
  if (hit && hit.distance < away - 0.05 * STRUCTURE_SIZE) return undefined;
  const bounds = canvas.getBoundingClientRect();
  const perUnit = bounds.height / 2 / (away * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  return {
    x: bounds.left + ((seen.x + 1) / 2) * bounds.width,
    y: bounds.top + ((1 - seen.y) / 2) * bounds.height,
    radius: Math.max(MIN_RING, sphere.radius * perUnit),
  };
}

/**
 * The pinned thing at a point on the screen, unless the structure is in front of it.
 * A point just beside a thing counts, so a small thing can be tapped with a finger.
 */
function thingAt(x: number, y: number): Placed | undefined {
  aim(x, y);
  const onThing = raycaster.intersectObjects(
    placed.map((entry) => entry.thing.mesh),
    false,
  )[0];
  if (onThing) {
    const onStructure = raycaster.intersectObject(structure, false)[0];
    if (!onStructure || onStructure.distance >= onThing.distance - 0.02 * STRUCTURE_SIZE) {
      return placed.find((entry) => entry.thing.mesh === onThing.object)!.thing;
    }
  }
  let nearest: Placed | undefined;
  let nearestBy = NEAR_MISS;
  for (const { thing } of placed) {
    const at = whereOnScreen(thing);
    if (!at) continue;
    const by = Math.hypot(x - at.x, y - at.y);
    if (by < nearestBy) {
      nearest = thing;
      nearestBy = by;
    }
  }
  return nearest;
}

/** The spot on the structure at a point on the screen. */
function surfaceAt(x: number, y: number): Hit | undefined {
  aim(x, y);
  const hit = raycaster.intersectObject(structure, false)[0];
  if (!hit?.face) return undefined;
  return { point: hit.point, normal: hit.face.normal.clone().transformDirection(structure.matrixWorld) };
}

function place(hit: Hit): void {
  select(pin(currentId(), hit.point, hit.normal));
  playPin();
  say(
    precise
      ? "Drag it to move it, scroll to resize, Shift+scroll to turn. Click it for more"
      : "Drag it to move it, pinch to resize, twist to turn. Tap it for more",
  );
  decorated();
}

function watchKeys(): void {
  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "z" && painting()) {
      undoStroke();
      event.preventDefault();
      return;
    }
    if (event.metaKey || event.ctrlKey) return;
    // A slider that has the keyboard keeps its arrow keys.
    if (event.target instanceof HTMLInputElement && event.key.startsWith("Arrow")) return;
    const digit = Number(event.key);
    if (Number.isInteger(digit) && digit >= 1 && event.key.length === 1) chooseCategory(digit - 1);
    else if (event.key === "ArrowRight") stepVariation(1);
    else if (event.key === "ArrowLeft") stepVariation(-1);
    else if (event.key === "Escape") {
      if (ui.closeMenu()) return;
      if (designOpen) {
        designOpen = false;
        showDesign();
      } else select(undefined);
    } else if (!selected) return;
    else if (event.key === "ArrowUp") resizeThing(selected, KEY_RESIZE);
    else if (event.key === "ArrowDown") resizeThing(selected, 1 / KEY_RESIZE);
    else if (event.key === "[") turnThing(selected, KEY_TURN);
    else if (event.key === "]") turnThing(selected, -KEY_TURN);
    else if (event.key === "Delete" || event.key === "Backspace") takeOff(selected);
    else return;
    event.preventDefault();
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
  categories = manifest.categories.map((group) => ({
    id: group.id,
    name: group.name,
    choices: group.kinds.flatMap((id) =>
      manifest.kinds
        .find((kind) => kind.id === id)!
        .models.map((entry) => ({ id: entry.id, preview: ASSETS + entry.preview })),
    ),
  }));
  categories.forEach((group, index) => {
    variation[index] = 0;
    group.choices.forEach((choice, at) => homes.set(choice.id, { category: index, variation: at }));
  });

  if (manifest.scene) {
    surroundings = await buildSurroundings(manifest.scene, ASSETS, STRUCTURE_SIZE, VIEW_DISTANCE, {
      onBirdCall: (across) => {
        birdCalls.push(across);
        playBirdCall(across);
      },
    });
    meadow = await buildMeadow(manifest.scene, ASSETS, STRUCTURE_SIZE, surroundings.outerRadius);
    scene.add(surroundings.group, meadow.group);
  } else {
    const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
    sun.position.set(-3, 4, 6);
    scene.add(sun);
    scene.background = new THREE.Color(0x6f93c9);
  }

  surprises = buildSurprises({
    structure,
    structureSize: STRUCTURE_SIZE,
    halfDepth: manifest.structure.thickness * STRUCTURE_SIZE,
    features: manifest.structure.features ?? [],
    heightAt: (radius) => meadow?.heightAt(radius) ?? -0.4 * STRUCTURE_SIZE,
    reach: (surroundings?.outerRadius ?? VIEW_DISTANCE * 3) * 0.6,
  });
  scene.add(surprises.group);
  links = buildLinks(STRUCTURE_SIZE);
  scene.add(links.group);
  const bounds = new THREE.Box3().setFromObject(structure);
  low = bounds.min.y;
  high = bounds.max.y;

  pen = buildPen(structure, STRUCTURE_SIZE);
  scene.add(pen.group);
  variation[categories.length] = 0;
  categories.push({
    id: PEN,
    name: "Glitter pen",
    choices: INKS.map((ink) => ({ id: `${PEN}:${ink.id}`, preview: inkPicture(ink) })),
    actions: [
      { label: "Turn the view", preview: turnPicture(), act: turnView, pressed: () => turning },
      { label: "Take back the last stroke", preview: undoPicture(), act: undoStroke },
    ],
  });

  ui.buildDock(categories, chooseCategory);
  show(0);
  ui.watchMenu();
  ui.onWheel((action) => {
    if (!selected) return;
    // Kind steps through the categories of things and passes over the pen.
    const kinds = categories.filter((group) => group.id !== PEN).length;
    if (action === "kind") chooseCategory((category + 1) % kinds);
    else if (action === "variation") stepVariation(1);
    else if (action === "remove") takeOff(selected);
    else {
      designOpen = !designOpen;
      showDesign();
    }
  });
  watchGestures({
    canvas,
    thingAt,
    surfaceAt,
    selected: () => selected,
    selectedOnScreen: () => onScreen,
    press: (thing) => select(thing, true),
    deselect: () => select(undefined),
    place,
    move: (thing, hit) => {
      thing.point.copy(hit.point);
      thing.normal.copy(hit.normal);
      markChanged(thing);
    },
    resize: resizeThing,
    turn: turnThing,
    remove: takeOff,
    cameraEnabled: (on) => {
      controls.enabled = on;
    },
    painting,
    turning: () => painting() && turning,
    cameraTurns: (on) => {
      controls.enableRotate = on;
    },
    strokeBegin: (hit) => {
      pen?.begin(hit, INKS[variation[category]]);
      playGlitter(0.03);
      penSounded = performance.now();
    },
    strokeDraw: (hit) => {
      pen?.draw(hit);
      if (performance.now() - penSounded > 350) {
        playGlitter(0.03);
        penSounded = performance.now();
      }
    },
    strokeLift: () => pen?.lift(),
    strokeEnd: () => {
      pen?.end();
      changed();
    },
    shaping: (on) => {
      // A thing that was dragged may now lie along the spike.
      if (shaping && !on) checkRow();
      shaping = on;
    },
  });
  watchKeys();
  document.querySelector("#arrange")!.addEventListener("click", arrangeAsPainted);
  document.querySelector("#clear")!.addEventListener("click", clearSkull);
  document.querySelector("#bring-back")!.addEventListener("click", bringBack);
  document.querySelector("#front")!.addEventListener("click", () => lookFrom(1));
  document.querySelector("#rear")!.addEventListener("click", () => lookFrom(-1));
  document.querySelector<HTMLInputElement>("#painted")!.addEventListener("change", async (event) => {
    if (!paintedTexture) {
      paintedTexture = await new THREE.TextureLoader().loadAsync(ASSETS + manifest.structure.painted);
      paintedTexture.flipY = false;
      paintedTexture.colorSpace = THREE.SRGBColorSpace;
    }
    material.map = (event.target as HTMLInputElement).checked ? paintedTexture : bareTexture;
    material.needsUpdate = true;
  });
  // The wind starts with the first tap, click or key press, which is when a browser allows sound.
  const sound = document.querySelector<HTMLInputElement>("#sound")!;
  sound.addEventListener("change", () => setSound(sound.checked));
  for (const gesture of ["pointerdown", "keydown"]) {
    window.addEventListener(gesture, startWind, { once: true });
  }

  resize();
  frontView();
  window.addEventListener("resize", resize);
  say(
    precise
      ? "Keys 1 to 5 pick a kind, the arrow keys a variation. Click the skull to place one"
      : "Pick a kind below, then tap the skull to place one. Drag to look around",
  );

  // The skull the player left is put back, and the scene stands as it was: the meadow grown, nothing set off.
  setLastSkull(readSkull(LAST_KEY));
  const saved = readSkull(SKULL_KEY);
  if (saved && !isBare(saved)) {
    const missing = restore(saved);
    lush = lushness();
    meadow?.setGrowth(lush);
    say(`Your skull is back${without(missing)}. Clear, in the menu, starts a new one`);
  }
  // A change still waiting to be saved is saved before the page goes.
  const flush = (): void => {
    if (saveTimer !== undefined) saveNow();
  };
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) flush();
  });

  const reach = new THREE.Vector3(PAN_REACH, PAN_REACH, PAN_REACH);
  const farthest = reach.clone().negate();
  const draw = (seconds: number): void => {
    // The scene grows toward its lushness a little each frame.
    const step = THREE.MathUtils.clamp(seconds - clock, 0, 0.1);
    clock = seconds;
    lush += (lushness() - lush) * (1 - Math.exp(-step / LUSH_SECONDS));
    meadow?.setGrowth(lush);
    for (const thing of stale) applySettings(thing, structure, STRUCTURE_SIZE);
    stale.clear();
    for (const { thing, pinnedAt } of placed) throb(thing, seconds, performance.now() / 1000 - pinnedAt);
    surroundings?.update(seconds, camera);
    meadow?.update(seconds);
    surprises?.update(seconds, camera, renderer.domElement.height);
    playMusic(seconds);
    pen?.update(seconds, surroundings?.sun.position ?? camera.position);
    controls.target.clamp(farthest, reach);
    controls.update();
    renderer.render(scene, camera);
    onScreen = selected && whereOnScreen(selected);
    ui.placeSelection(onScreen, wheelOpen && !shaping);
  };
  // A test holds the loop still and draws each frame itself, at the moments it chooses.
  let held = false;
  renderer.setAnimationLoop((milliseconds) => {
    if (!held) draw(milliseconds / 1000);
  });
  // A browser stops drawing a page it is not showing but still runs its timers, so the sound keeps time with one.
  window.setInterval(() => {
    music?.schedule();
    scheduleWind();
    // The clouds' sounds start with the wind.
    const audio = bus();
    const banks = surroundings?.clouds?.banks ?? [];
    if (audio && !cloudSound && banks.length > 0) {
      cloudSound = buildCloudSound(audio.context, audio.master, banks, () => performance.now() / 1000);
    }
    cloudSound?.schedule();
  }, SOUND_TICK);

  // Lets a test or the browser console drive the page. A browser stops drawing a page
  // it is not showing, so a test calls draw itself.
  Object.assign(window, {
    venorn: {
      manifest,
      models,
      placed,
      chooseCategory,
      chooseVariation,
      select,
      state: () => ({
        category,
        variation,
        selected,
        wheelOpen,
        designOpen,
        onScreen,
        lush,
        rowBest,
        rabbits,
        firstRabbitDue,
      }),
      surprises,
      clouds: surroundings?.clouds,
      links,
      pen,
      sendRabbit,
      music: () => music,
      sounding: () => placed.filter((entry) => clock - entry.soundedAt < entry.rings).length,
      hold: (on: boolean) => {
        held = on;
      },
      // Jump the scene to the lushness it is growing toward, or to a given one.
      settle: (to?: number) => {
        lush = to ?? lushness();
        meadow?.setGrowth(lush);
      },
      arrangeAsPainted,
      snapshot,
      save: saveNow,
      clearSkull,
      bringBack,
      frontView,
      lookFrom,
      structure,
      camera,
      controls,
      scene,
      draw,
      birdCalls,
    },
  });
}

start().catch((error: unknown) => {
  console.error(error);
  say(`Could not start: ${error instanceof Error ? error.message : String(error)}`);
});
