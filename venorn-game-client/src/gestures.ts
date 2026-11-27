// Tells apart the ways a person touches the scene: a tap, a drag on a thing,
// a flick on a thing, two fingers on a thing, a scroll over a thing, and
// everything else, which moves the camera.

import type * as THREE from "three";
import type { Placed } from "./placement";

export interface Hit {
  point: THREE.Vector3;
  normal: THREE.Vector3;
}

export interface Scene {
  canvas: HTMLCanvasElement;
  thingAt(x: number, y: number): Placed | undefined;
  surfaceAt(x: number, y: number): Hit | undefined;
  selected(): Placed | undefined;
  /** Where the selected thing is on the screen, and about how large it looks. */
  selectedOnScreen(): { x: number; y: number; radius: number } | undefined;
  /** A thing was tapped: select it and open its wheel. */
  press(thing: Placed): void;
  /** Whether the selected thing's wheel is open and in view. */
  wheelShown(): boolean;
  /** Let go of the selected thing. A flick sends its ring away by some pixels across and down. */
  deselect(away?: { x: number; y: number }): void;
  place(hit: Hit): void;
  move(thing: Placed, hit: Hit): void;
  /** Multiply the thing's size, or turn it by some degrees, within what its criteria allow. */
  resize(thing: Placed, factor: number): void;
  turn(thing: Placed, degrees: number): void;
  remove(thing: Placed): void;
  cameraEnabled(on: boolean): void;
  /** Whether a pen is chosen, so a drag on the structure draws. */
  painting(): boolean;
  /** Whether the pen is put aside so that a drag turns the camera, even on the structure. */
  turning(): boolean;
  /** Stop or allow a one-finger drag turning the camera. Two fingers still zoom and pan. */
  cameraTurns(on: boolean): void;
  strokeBegin(hit: Hit): void;
  strokeDraw(hit: Hit): void;
  /** The pointer left the structure in the middle of a stroke. */
  strokeLift(): void;
  strokeEnd(): void;
  /** End the stroke and take it back: it was only the first finger of a zoom. */
  strokeCancel(): void;
  /** A gesture on a thing has started or ended. */
  shaping(on: boolean): void;
  /** Whether the controls are hidden so that the player can look at the skull. */
  looking(): boolean;
  /** Bring the hidden controls back. */
  showControls(): void;
}

// A press that moves less than this many pixels is a tap.
const TAP_SLOP = 6;
// Two fingers or a scroll within this many pixels of the selected thing act on it.
const REACH = 110;
// With the pen chosen, a stroke is taken back when a second finger comes down within this many milliseconds
// of the first, before the first has gone this many pixels. The stroke was only the start of a zoom.
const ZOOM_START_TIME = 500;
const ZOOM_START_SLOP = 20;
// A drag on the selected thing is a flick, which lets the thing go, when the finger has gone at least
// FLICK_SLOP pixels within FLICK_TIME milliseconds and lifts going at least FLICK_SPEED pixels a millisecond,
// measured over its last FLICK_WINDOW milliseconds. A person carrying a thing slows down where they aim.
const FLICK_SLOP = 30;
const FLICK_TIME = 300;
const FLICK_SPEED = 0.6;
const FLICK_WINDOW = 80;
// The ring slides this many milliseconds' worth of the flick's speed before it fades, at most FLICK_THROW pixels.
const FLICK_GLIDE = 120;
const FLICK_THROW = 160;

interface Spread {
  distance: number;
  angle: number;
}

function spread(a: { x: number; y: number }, b: { x: number; y: number }): Spread {
  return { distance: Math.hypot(b.x - a.x, b.y - a.y), angle: Math.atan2(b.y - a.y, b.x - a.x) };
}

interface Sample {
  x: number;
  y: number;
  time: number;
}

/**
 * How fast a drag was going when the finger lifted, in pixels a millisecond across and down, if it was a flick:
 * far enough, soon enough and fast enough at the end.
 */
function flick(path: Sample[]): { x: number; y: number } | undefined {
  const first = path[0];
  const last = path[path.length - 1];
  if (!first || path.length < 2) return undefined;
  if (last.time - first.time > FLICK_TIME) return undefined;
  if (Math.hypot(last.x - first.x, last.y - first.y) < FLICK_SLOP) return undefined;
  // The last sample from before the window, or the first one there is.
  let from = path.length - 2;
  while (from > 0 && last.time - path[from].time < FLICK_WINDOW) from--;
  const start = path[from];
  const time = Math.max(last.time - start.time, 1);
  const velocity = { x: (last.x - start.x) / time, y: (last.y - start.y) / time };
  return Math.hypot(velocity.x, velocity.y) >= FLICK_SPEED ? velocity : undefined;
}

export function watchGestures(scene: Scene): void {
  const { canvas } = scene;
  const pointers = new Map<number, { x: number; y: number }>();
  let down: { x: number; y: number; button: number; time: number; thing?: Placed } | undefined;
  // How far the first finger has gone from where it came down.
  let farthest = 0;
  let mode: "camera" | "move" | "shape" | "paint" = "camera";
  let moved = false;
  let last: Spread | undefined;
  // Where a drag on the selected thing has been, and where the thing was when it began, so a flick can put it back.
  let path: Sample[] = [];
  let from: Hit | undefined;

  const reaches = (x: number, y: number): boolean => {
    const at = scene.selectedOnScreen();
    return !!at && Math.hypot(x - at.x, y - at.y) < Math.max(REACH, at.radius * 1.5);
  };

  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  // These listeners run before the camera's, so a gesture on a thing can keep the camera still.
  canvas.addEventListener(
    "pointerdown",
    (event) => {
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      // While the controls are hidden, every press turns, zooms or pans the camera, and a tap brings the controls back.
      if (pointers.size === 1 && event.button === 0 && scene.painting() && !scene.looking()) {
        // With a pen chosen, a press on the structure starts a stroke. A press anywhere else moves the camera,
        // and so does every press while the pen is put aside to turn the view.
        down = { x: event.clientX, y: event.clientY, button: event.button, time: event.timeStamp };
        moved = false;
        farthest = 0;
        const hit = scene.turning() ? undefined : scene.surfaceAt(event.clientX, event.clientY);
        if (hit) {
          mode = "paint";
          scene.cameraTurns(false);
          scene.strokeBegin(hit);
        }
        return;
      }
      if (pointers.size === 1) {
        down = {
          x: event.clientX,
          y: event.clientY,
          button: event.button,
          time: event.timeStamp,
          thing: scene.looking() ? undefined : scene.thingAt(event.clientX, event.clientY),
        };
        moved = false;
        if (event.button === 0 && down.thing && down.thing === scene.selected()) {
          // Dragging the selected thing carries it, and a flick lets it go. Dragging anything else turns the
          // camera, so a skull covered in things can still be turned.
          mode = "move";
          path = [{ x: event.clientX, y: event.clientY, time: event.timeStamp }];
          from = { point: down.thing.point.clone(), normal: down.thing.normal.clone() };
          scene.cameraEnabled(false);
          canvas.setPointerCapture(event.pointerId);
        }
        return;
      }
      moved = true;
      if (mode === "paint") {
        // A second finger ends the stroke, and the two fingers zoom and pan. A stroke that had barely
        // begun was only the first finger of the zoom, so it is taken back.
        const begun = down && event.timeStamp - down.time <= ZOOM_START_TIME && farthest < ZOOM_START_SLOP;
        if (begun) scene.strokeCancel();
        else scene.strokeEnd();
        mode = "camera";
        return;
      }
      const [first, second] = [...pointers.values()];
      if (scene.selected() && (mode === "move" || reaches((first.x + second.x) / 2, (first.y + second.y) / 2))) {
        // Two fingers on the selected thing resize and turn it.
        mode = "shape";
        last = spread(first, second);
        scene.cameraEnabled(false);
        scene.shaping(true);
      }
    },
    { capture: true },
  );

  canvas.addEventListener(
    "pointermove",
    (event) => {
      const pointer = pointers.get(event.pointerId);
      if (!pointer) return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      if (down && pointers.size === 1) farthest = Math.max(farthest, Math.hypot(pointer.x - down.x, pointer.y - down.y));
      if (down && !moved && Math.hypot(pointer.x - down.x, pointer.y - down.y) >= TAP_SLOP) {
        moved = true;
        if (mode === "move") scene.shaping(true);
      }
      if (!moved) return;

      if (mode === "paint") {
        const hit = scene.surfaceAt(pointer.x, pointer.y);
        if (hit) scene.strokeDraw(hit);
        else scene.strokeLift();
      } else if (mode === "move" && down?.thing && pointers.size === 1) {
        path.push({ x: pointer.x, y: pointer.y, time: event.timeStamp });
        const hit = scene.surfaceAt(pointer.x, pointer.y);
        if (hit) scene.move(down.thing, hit);
      } else if (mode === "shape" && pointers.size >= 2 && last) {
        const [first, second] = [...pointers.values()];
        const now = spread(first, second);
        const thing = scene.selected();
        if (thing) {
          scene.resize(thing, now.distance / Math.max(last.distance, 1));
          const twist = ((now.angle - last.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
          // A clockwise twist on the screen turns the thing clockwise.
          scene.turn(thing, (-twist * 180) / Math.PI);
        }
        last = now;
      }
    },
    { capture: true },
  );

  const release = (event: PointerEvent): void => {
    pointers.delete(event.pointerId);
    if (pointers.size > 0) return;
    const tapped = down && !moved && event.type === "pointerup";
    const flung =
      mode === "move" && moved && event.type === "pointerup"
        ? flick([...path, { x: event.clientX, y: event.clientY, time: event.timeStamp }])
        : undefined;
    if (mode === "paint") scene.strokeEnd();
    else if (flung && down?.thing && from) {
      // A flick sends the selection away. The thing goes back where the finger found it.
      scene.move(down.thing, from);
      const glide = (length: number): number => Math.max(-FLICK_THROW, Math.min(FLICK_THROW, length * FLICK_GLIDE));
      scene.deselect({ x: glide(flung.x), y: glide(flung.y) });
    } else if (tapped && down && scene.looking()) {
      if (down.button === 0) scene.showControls();
    } else if (tapped && down && scene.painting()) {
      // With a pen chosen, a tap off the structure does nothing.
    } else if (tapped && down) {
      if (down.button === 2) {
        if (down.thing) scene.remove(down.thing);
      } else if (down.button === 0 && down.thing) {
        // A second tap on the selected thing closes its wheel and lets it go.
        if (down.thing === scene.selected() && scene.wheelShown()) scene.deselect();
        else scene.press(down.thing);
      } else if (down.button === 0) {
        // With a wheel open, a tap on the bare structure closes it and lets the thing go, as a tap beside a menu
        // closes the menu. With only the ring, as after placing, it places the next thing.
        const hit = scene.wheelShown() ? undefined : scene.surfaceAt(down.x, down.y);
        if (hit) scene.place(hit);
        else scene.deselect();
      }
    }
    mode = "camera";
    down = undefined;
    last = undefined;
    path = [];
    from = undefined;
    scene.cameraEnabled(true);
    scene.cameraTurns(true);
    scene.shaping(false);
  };
  canvas.addEventListener("pointerup", release, { capture: true });
  canvas.addEventListener("pointercancel", release, { capture: true });

  // A scroll over the selected thing resizes it. With Shift or Alt held, it turns it.
  canvas.addEventListener(
    "wheel",
    (event) => {
      const thing = scene.selected();
      if (!thing || !reaches(event.clientX, event.clientY)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.shiftKey || event.altKey) scene.turn(thing, (event.deltaY + event.deltaX) * 0.25);
      // A pinch on a trackpad arrives as a scroll with Ctrl held, in much smaller steps.
      else scene.resize(thing, Math.exp(-event.deltaY * (event.ctrlKey ? 0.012 : 0.002)));
    },
    { capture: true, passive: false },
  );
}
