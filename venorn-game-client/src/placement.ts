// Shapes a model onto the structure from its adjustment criteria and the player's settings.

import * as THREE from "three";
import type { Criteria, Settings } from "./types";

export interface Placed {
  criteria: Criteria;
  group: THREE.Group;
  mesh: THREE.Mesh;
  pinHead?: THREE.Mesh;
  pinStem?: THREE.Mesh;
  /** Vertex positions of the model as the pipeline made it. */
  rest: Float32Array;
  /** Where the thing meets the structure, and the structure's normal there. */
  point: THREE.Vector3;
  normal: THREE.Vector3;
  settings: Settings;
}

const FAR = 100;
const TOWARD_STRUCTURE = new THREE.Vector3(0, 0, -1);
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const PIN_GOLD = new THREE.MeshStandardMaterial({
  color: 0xd9a441,
  emissive: 0xffc04d,
  emissiveIntensity: 0.2,
  metalness: 0.6,
  roughness: 0.35,
});

const raycaster = new THREE.Raycaster();
raycaster.firstHitOnly = true;

export function defaultSettings(criteria: Criteria): Settings {
  const { adjust, attach } = criteria;
  return {
    scale: adjust.scale.default,
    spin: adjust.spin.default,
    standoff: attach.standoff.default,
    tilt: adjust.tilt.default,
    conform: adjust.conform.default,
    bend: 0,
    mirror: false,
  };
}

/** The structure's surface straight behind a point, as seen from the front. */
function surfaceDepth(structure: THREE.Mesh, x: number, y: number): number | undefined {
  raycaster.set(new THREE.Vector3(x, y, FAR), TOWARD_STRUCTURE);
  return raycaster.intersectObject(structure, false)[0]?.point.z;
}

export function createPlaced(
  criteria: Criteria,
  source: THREE.Mesh,
  point: THREE.Vector3,
  normal: THREE.Vector3,
  structureSize: number,
): Placed {
  const geometry = source.geometry.clone();
  const mesh = new THREE.Mesh(geometry, source.material);
  const group = new THREE.Group();
  group.add(mesh);

  const placed: Placed = {
    criteria,
    group,
    mesh,
    rest: Float32Array.from(geometry.getAttribute("position").array),
    point: point.clone(),
    normal: normal.clone(),
    settings: defaultSettings(criteria),
  };

  if (criteria.attach.pin.visible) {
    const radius = 0.006 * structureSize;
    placed.pinHead = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), PIN_GOLD.clone());
    placed.pinStem = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.22, radius * 0.22, 1, 8), PIN_GOLD);
    group.add(placed.pinHead, placed.pinStem);
  }
  return placed;
}

/** Recompute every vertex from the model's rest shape, its spot on the structure and the settings. */
export function applySettings(placed: Placed, structure: THREE.Mesh, structureSize: number): void {
  const { criteria, settings, point, rest } = placed;
  const size = criteria.size.natural * structureSize * settings.scale;
  const standoff = settings.standoff * size;

  // A frame on the surface: right and top lie in it, out points away from it.
  const out = placed.normal.clone();
  const right = new THREE.Vector3().crossVectors(WORLD_UP, out).normalize();
  const top = new THREE.Vector3().crossVectors(out, right).normalize();
  const tilt = THREE.MathUtils.degToRad(settings.tilt);
  out.applyAxisAngle(right, -tilt);
  top.applyAxisAngle(right, -tilt);

  const spin = THREE.MathUtils.degToRad(settings.spin);
  const cos = Math.cos(spin);
  const sin = Math.sin(spin);

  // Bending moves both inner control points of a cubic Bezier off the long axis by the same amount.
  const long = criteria.size.aspect >= 1 ? 0 : 1;
  let low = Infinity;
  let high = -Infinity;
  for (let i = long; i < rest.length; i += 3) {
    low = Math.min(low, rest[i]);
    high = Math.max(high, rest[i]);
  }
  const bendAt = (along: number): number => {
    const t = (along - low) / (high - low);
    return 3 * t * (1 - t) * settings.bend;
  };
  const bendAtAnchor = bendAt(0);

  const positions = placed.mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
  const rigid = new THREE.Vector3();
  for (let i = 0; i < rest.length; i += 3) {
    let x = rest[i];
    let y = rest[i + 1];
    const z = rest[i + 2] * size;
    const offset = bendAt(long === 0 ? x : y) - bendAtAnchor;
    if (long === 0) y += offset;
    else x += offset;
    if (settings.mirror) x = -x;
    const across = (x * cos - y * sin) * size;
    const upward = (x * sin + y * cos) * size;

    rigid
      .copy(point)
      .addScaledVector(right, across)
      .addScaledVector(top, upward)
      .addScaledVector(out, z + standoff);

    if (settings.conform > 0) {
      // Seen from the front, the thing keeps its shape while each vertex sinks onto the surface behind it.
      const px = point.x + across;
      const py = point.y + upward;
      const depth = surfaceDepth(structure, px, py);
      if (depth !== undefined) {
        rigid.lerp(new THREE.Vector3(px, py, depth + z + standoff + 0.0015 * structureSize), settings.conform);
      }
    }
    positions.setXYZ(i / 3, rigid.x, rigid.y, rigid.z);
  }
  positions.needsUpdate = true;
  placed.mesh.geometry.computeVertexNormals();
  placed.mesh.geometry.computeBoundingBox();
  placed.mesh.geometry.computeBoundingSphere();

  if (placed.pinHead && placed.pinStem) {
    const reach = standoff + criteria.size.thickness * size + 0.004 * structureSize;
    placed.pinHead.position.copy(point).addScaledVector(out, reach);
    placed.pinStem.position.copy(point).addScaledVector(out, reach / 2);
    placed.pinStem.scale.set(1, reach, 1);
    placed.pinStem.quaternion.setFromUnitVectors(WORLD_UP, out);
  }
}

/** A pin throbs for a few seconds after it goes in, then keeps a slow pulse. */
export function throb(placed: Placed, seconds: number, sincePinned: number): void {
  if (!placed.pinHead) return;
  const fresh = Math.max(0, 1 - sincePinned / 4);
  const beat = (Math.sin(seconds * (3 + 5 * fresh)) + 1) / 2;
  placed.pinHead.scale.setScalar(1 + (0.12 + 0.5 * fresh) * beat);
  (placed.pinHead.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2 + (0.5 + 1.5 * fresh) * beat;
}
