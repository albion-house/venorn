// Tells apart the ways a person touches the scene: a tap, a drag on a thing,
// two fingers on a thing, a scroll over a thing, and everything else, which
// moves the camera.

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
  deselect(): void;
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
  /** A gesture on a thing has started or ended. */
  shaping(on: boolean): void;
}

// A press that moves less than this many pixels is a tap.
const TAP_SLOP = 6;
// Two fingers or a scroll within this many pixels of the selected thing act on it.
const REACH = 110;

interface Spread {
  distance: number;
  angle: number;
}

function spread(a: { x: number; y: number }, b: { x: number; y: number }): Spread {
  return { distance: Math.hypot(b.x - a.x, b.y - a.y), angle: Math.atan2(b.y - a.y, b.x - a.x) };
}

export function watchGestures(scene: Scene): void {
  const { canvas } = scene;
  const pointers = new Map<number, { x: number; y: number }>();
  let down: { x: number; y: number; button: number; thing?: Placed } | undefined;
  let mode: "camera" | "move" | "shape" | "paint" = "camera";
  let moved = false;
  let last: Spread | undefined;

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
      if (pointers.size === 1 && event.button === 0 && scene.painting()) {
        // With a pen chosen, a press on the structure starts a stroke. A press anywhere else moves the camera,
        // and so does every press while the pen is put aside to turn the view.
        down = { x: event.clientX, y: event.clientY, button: event.button };
        moved = false;
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
          thing: scene.thingAt(event.clientX, event.clientY),
        };
        moved = false;
        if (event.button === 0 && down.thing && down.thing === scene.selected()) {
          // Dragging the selected thing moves it. Dragging anything else moves the camera,
          // so a skull covered in things can still be turned.
          mode = "move";
          scene.cameraEnabled(false);
          canvas.setPointerCapture(event.pointerId);
        }
        return;
      }
      moved = true;
      if (mode === "paint") {
        // A second finger ends the stroke, and the two fingers zoom and pan.
        scene.strokeEnd();
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
    if (mode === "paint") scene.strokeEnd();
    else if (tapped && down && scene.painting()) {
      // With a pen chosen, a tap off the structure does nothing.
    } else if (tapped && down) {
      if (down.button === 2) {
        if (down.thing) scene.remove(down.thing);
      } else if (down.button === 0 && down.thing) {
        scene.press(down.thing);
      } else if (down.button === 0) {
        const hit = scene.surfaceAt(down.x, down.y);
        if (hit) scene.place(hit);
        else scene.deselect();
      }
    }
    mode = "camera";
    down = undefined;
    last = undefined;
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
