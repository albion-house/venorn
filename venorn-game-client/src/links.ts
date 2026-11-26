// Lines that join one sounding thing to the next, so the music can be seen.

import * as THREE from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

export interface End {
  point: THREE.Vector3;
  normal: THREE.Vector3;
}

export interface Links {
  group: THREE.Group;
  /** Draw a line from one thing to another, starting now. */
  connect(from: End, to: End, seconds: number): void;
  update(seconds: number, width: number, height: number): void;
  /** How many lines are showing, for a test to read. */
  showing(): number;
}

// The most lines showing at once, and the pieces each line is drawn in.
const POOL = 8;
const PIECES = 28;
// A line takes this long to reach the second thing, then this long to fade.
const DRAW = 0.9;
const FADE = 3.4;

export function buildLinks(structureSize: number): Links {
  const group = new THREE.Group();
  const lines = Array.from({ length: POOL }, () => {
    const geometry = new LineGeometry();
    geometry.setPositions(new Float32Array((PIECES + 1) * 3));
    const material = new LineMaterial({
      color: 0xfff1c9,
      linewidth: 2.5,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const line = new Line2(geometry, material);
    line.visible = false;
    line.frustumCulled = false;
    line.renderOrder = 4;
    group.add(line);
    return { line, geometry, material, from: -Infinity };
  });
  let turn = 0;
  const start = new THREE.Vector3();
  const end = new THREE.Vector3();
  const over = new THREE.Vector3();
  const along = new THREE.Vector3();

  return {
    group,
    connect(from: End, to: End, seconds: number): void {
      const slot = lines[turn];
      turn = (turn + 1) % POOL;
      // The line leaves each thing just off the surface and arcs out between them.
      start.copy(from.point).addScaledVector(from.normal, 0.02 * structureSize);
      end.copy(to.point).addScaledVector(to.normal, 0.02 * structureSize);
      over.addVectors(from.normal, to.normal);
      if (over.lengthSq() < 0.05) over.addVectors(start, end);
      over
        .normalize()
        .multiplyScalar(0.3 * start.distanceTo(end) + 0.04 * structureSize)
        .addScaledVector(start, 0.5)
        .addScaledVector(end, 0.5);
      const points = new Float32Array((PIECES + 1) * 3);
      for (let i = 0; i <= PIECES; i++) {
        const t = i / PIECES;
        along
          .copy(start)
          .multiplyScalar((1 - t) * (1 - t))
          .addScaledVector(over, 2 * t * (1 - t))
          .addScaledVector(end, t * t);
        points.set([along.x, along.y, along.z], i * 3);
      }
      slot.geometry.setPositions(points);
      slot.from = seconds;
    },
    update(seconds: number, width: number, height: number): void {
      for (const slot of lines) {
        const since = seconds - slot.from;
        slot.line.visible = since >= 0 && since < DRAW + FADE;
        if (!slot.line.visible) continue;
        slot.geometry.instanceCount = Math.max(1, Math.ceil(Math.min(1, since / DRAW) * PIECES));
        slot.material.opacity = 0.85 * (1 - THREE.MathUtils.smoothstep(since, DRAW, DRAW + FADE));
        slot.material.resolution.set(width, height);
      }
    },
    showing: () => lines.filter((slot) => slot.line.visible).length,
  };
}
