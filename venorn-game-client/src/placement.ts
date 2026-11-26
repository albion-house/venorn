// Shapes a model onto the structure from its adjustment criteria and the player's settings.

import * as THREE from "three";
import type { Criteria, Settings } from "./types";

export interface Placed {
  criteria: Criteria;
  group: THREE.Group;
  mesh: THREE.Mesh;
  /** How far the thing's colors are turned around the color wheel, in radians. */
  tint: { value: number };
  pinHead?: THREE.Mesh;
  pinStem?: THREE.Mesh;
  /** Vertex positions of the model as the pipeline made it. */
  rest: Float32Array;
  /** Where the thing meets the structure, and the structure's normal there. */
  point: THREE.Vector3;
  normal: THREE.Vector3;
  settings: Settings;
}

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const WORLD_FRONT = new THREE.Vector3(0, 0, 1);
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
    depth: adjust.depth.default,
    hue: adjust.hue.default,
    conform: adjust.conform.default,
    fold: adjust.fold?.default ?? 0,
    bend: 0,
    mirror: false,
  };
}

export function createPlaced(
  criteria: Criteria,
  source: THREE.Mesh,
  point: THREE.Vector3,
  normal: THREE.Vector3,
  structureSize: number,
): Placed {
  const geometry = source.geometry.clone();
  const tint = { value: 0 };
  const mesh = new THREE.Mesh(geometry, tinted(source.material as THREE.MeshStandardMaterial, tint));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const group = new THREE.Group();
  group.add(mesh);

  const placed: Placed = {
    criteria,
    group,
    mesh,
    tint,
    rest: Float32Array.from(geometry.getAttribute("position").array),
    point: point.clone(),
    normal: normal.clone(),
    settings: defaultSettings(criteria),
  };

  if (criteria.attach.pin.visible) {
    const radius = 0.0045 * structureSize;
    placed.pinHead = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), PIN_GOLD.clone());
    placed.pinStem = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.22, radius * 0.22, 1, 8), PIN_GOLD);
    placed.pinHead.castShadow = true;
    group.add(placed.pinHead, placed.pinStem);
  }
  return placed;
}

/** A copy of a model's material whose colors can be turned around the color wheel. */
function tinted(base: THREE.MeshStandardMaterial, tint: { value: number }): THREE.MeshStandardMaterial {
  const material = base.clone();
  // The thing glows in this color while its note sounds.
  material.emissive.set(0xffdca8);
  material.emissiveIntensity = 0;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTint = tint;
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uTint;")
      .replace(
        "#include <map_fragment>",
        /* glsl */ `#include <map_fragment>
        {
          // Turn the color about the gray axis, which keeps its lightness.
          const vec3 gray = vec3(0.57735);
          float turn = cos(uTint);
          diffuseColor.rgb = diffuseColor.rgb * turn + cross(gray, diffuseColor.rgb) * sin(uTint)
            + gray * dot(gray, diffuseColor.rgb) * (1.0 - turn);
        }`,
      );
  };
  // Every tinted material compiles to the same program, so they share one.
  material.customProgramCacheKey = () => "venorn-tinted";
  return material;
}

/** Recompute every vertex from the model's rest shape, its spot on the structure and the settings. */
export function applySettings(placed: Placed, structure: THREE.Mesh, structureSize: number): void {
  const { criteria, settings, point, rest } = placed;
  placed.tint.value = THREE.MathUtils.degToRad(settings.hue);
  const size = criteria.size.natural * structureSize * settings.scale;
  const standoff = settings.standoff * size;

  // A frame on the surface: right and top lie in it, out points away from it.
  // On a surface that faces straight up or down, top leans toward the front of the scene.
  const out = placed.normal.clone();
  const reference = Math.abs(out.dot(WORLD_UP)) > 0.95 ? WORLD_FRONT : WORLD_UP;
  const right = new THREE.Vector3().crossVectors(reference, out).normalize();
  const top = new THREE.Vector3().crossVectors(out, right).normalize();
  const inward = out.clone().negate();
  const tilt = THREE.MathUtils.degToRad(settings.tilt);
  const lean = out.clone().applyAxisAngle(right, -tilt);
  const leanTop = top.clone().applyAxisAngle(right, -tilt);

  const spin = THREE.MathUtils.degToRad(settings.spin);
  const cos = Math.cos(spin);
  const sin = Math.sin(spin);
  const fold = Math.tan(THREE.MathUtils.degToRad(settings.fold));

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
  const onPlane = new THREE.Vector3();
  const above = new THREE.Vector3();
  for (let i = 0; i < rest.length; i += 3) {
    let x = rest[i];
    let y = rest[i + 1];
    const along = long === 0 ? x : y;
    // Folding lifts both ends of the long axis, the way a pinned butterfly holds its wings.
    const z = (rest[i + 2] * settings.depth + Math.abs(along) * fold) * size;
    const offset = bendAt(along) - bendAtAnchor;
    if (long === 0) y += offset;
    else x += offset;
    if (settings.mirror) x = -x;
    const across = (x * cos - y * sin) * size;
    const upward = (x * sin + y * cos) * size;

    rigid
      .copy(point)
      .addScaledVector(right, across)
      .addScaledVector(leanTop, upward)
      .addScaledVector(lean, z + standoff);

    if (settings.conform > 0) {
      // Each vertex sinks straight down onto the surface under it, so the thing keeps
      // its shape as seen from above its anchor.
      onPlane.copy(point).addScaledVector(right, across).addScaledVector(top, upward);
      above.copy(onPlane).addScaledVector(out, structureSize);
      raycaster.set(above, inward);
      const hit = raycaster.intersectObject(structure, false)[0];
      if (hit) {
        hit.point.addScaledVector(out, z + standoff + 0.0015 * structureSize);
        rigid.lerp(hit.point, settings.conform);
      }
    }
    positions.setXYZ(i / 3, rigid.x, rigid.y, rigid.z);
  }
  positions.needsUpdate = true;
  placed.mesh.geometry.computeVertexNormals();
  placed.mesh.geometry.computeBoundingBox();
  placed.mesh.geometry.computeBoundingSphere();

  if (placed.pinHead && placed.pinStem) {
    const reach = standoff + criteria.size.thickness * settings.depth * size + 0.004 * structureSize;
    placed.pinHead.position.copy(point).addScaledVector(lean, reach);
    placed.pinStem.position.copy(point).addScaledVector(lean, reach / 2);
    placed.pinStem.scale.set(1, reach, 1);
    placed.pinStem.quaternion.setFromUnitVectors(WORLD_UP, lean);
  }
}

/** Swell a thing about the spot it sits on and make it glow. amount runs from 0 to 1. */
export function swell(placed: Placed, amount: number): void {
  const grown = 1 + 0.14 * amount;
  placed.group.scale.setScalar(grown);
  placed.group.position.copy(placed.point).multiplyScalar(1 - grown);
  (placed.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3 * amount;
}

/** A pin throbs for a few seconds after it goes in, then keeps a slow pulse. */
export function throb(placed: Placed, seconds: number, sincePinned: number): void {
  if (!placed.pinHead) return;
  const fresh = Math.max(0, 1 - sincePinned / 4);
  const beat = (Math.sin(seconds * (3 + 5 * fresh)) + 1) / 2;
  placed.pinHead.scale.setScalar(1 + (0.12 + 0.5 * fresh) * beat);
  (placed.pinHead.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2 + (0.5 + 1.5 * fresh) * beat;
}
