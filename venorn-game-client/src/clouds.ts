// Clouds at more depths than the wrapped layer. Pieces cut from the floating
// layer's picture stand in a near bank around the structure and a middle bank
// farther out, and each layer of clouds has a sound of its own.

import * as THREE from "three";
import { rampAhead } from "./ahead";

const TURN = Math.PI * 2;
// The picture is labelled at this fraction of its size to find its separate clouds.
const LABEL_SCALE = 0.25;
// A piece covers at least this share of the labelled picture.
const SMALLEST = 0.002;
// A piece fades out as the camera comes within this many world units of it.
const FADE: [number, number] = [0.3, 1.5];

/** One bank of clouds: pieces on a circle around the middle of the scene. */
export interface BankOptions {
  pieces: number;
  /** The circle's radius in world units. */
  radius: number;
  /** The lowest and highest a piece stands, in world units. */
  low: number;
  high: number;
  /** The narrowest and widest a piece is, in world units. */
  narrow: number;
  wide: number;
  /** Seconds to go once around the scene. A negative number goes the other way. */
  turn: number;
  seed: number;
}

export const NEAR_BANK: BankOptions = { pieces: 8, radius: 4, low: 0.2, high: 1.1, narrow: 0.9, wide: 1.4, turn: 600, seed: 11 };
export const MIDDLE_BANK: BankOptions = { pieces: 10, radius: 14, low: 2, high: 5, narrow: 2.5, wide: 4, turn: -1200, seed: 23 };

export interface Bank {
  options: BankOptions;
  group: THREE.Group;
  sprites: THREE.Sprite[];
  /** Where piece number index is at a moment, in world units. */
  placeAt(index: number, seconds: number, into: THREE.Vector3): THREE.Vector3;
}

export interface Clouds {
  group: THREE.Group;
  banks: Bank[];
  update(seconds: number, camera: THREE.Camera): void;
}

/** A small, stable random number generator. */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/**
 * Cut the separate clouds out of a picture. A cloud is a patch of opaque pixels
 * that does not touch the picture's edge. Each comes back on a canvas of its own,
 * with its neighbors cleared away, largest first.
 */
export function cutPieces(image: HTMLImageElement | HTMLCanvasElement | ImageBitmap, most = 24): HTMLCanvasElement[] {
  const width = Math.ceil(image.width * LABEL_SCALE);
  const height = Math.ceil(image.height * LABEL_SCALE);
  const small = document.createElement("canvas");
  small.width = width;
  small.height = height;
  const smallContext = small.getContext("2d", { willReadFrequently: true })!;
  smallContext.drawImage(image, 0, 0, width, height);
  const alpha = smallContext.getImageData(0, 0, width, height).data;

  // Label each patch of opaque pixels, joining pixels that share a side.
  const labels = new Int32Array(width * height);
  const patches: { label: number; area: number; left: number; top: number; right: number; bottom: number }[] = [];
  const stack: number[] = [];
  for (let start = 0; start < labels.length; start++) {
    if (labels[start] !== 0 || alpha[start * 4 + 3] <= 128) continue;
    const patch = { label: patches.length + 1, area: 0, left: width, top: height, right: 0, bottom: 0 };
    labels[start] = patch.label;
    stack.push(start);
    while (stack.length > 0) {
      const at = stack.pop()!;
      const x = at % width;
      const y = (at - x) / width;
      patch.area++;
      patch.left = Math.min(patch.left, x);
      patch.right = Math.max(patch.right, x);
      patch.top = Math.min(patch.top, y);
      patch.bottom = Math.max(patch.bottom, y);
      for (const next of [x > 0 ? at - 1 : -1, x < width - 1 ? at + 1 : -1, y > 0 ? at - width : -1, y < height - 1 ? at + width : -1]) {
        if (next < 0 || labels[next] !== 0 || alpha[next * 4 + 3] <= 128) continue;
        labels[next] = patch.label;
        stack.push(next);
      }
    }
    patches.push(patch);
  }

  const kept = patches
    .filter((patch) => patch.left > 0 && patch.top > 0 && patch.right < width - 1 && patch.bottom < height - 1)
    .filter((patch) => patch.area >= SMALLEST * width * height)
    .sort((one, other) => other.area - one.area)
    .slice(0, most);

  const scale = 1 / LABEL_SCALE;
  return kept.map((patch) => {
    // The patch and one labelled pixel around it, so the cloud's own soft edge is kept.
    const left = patch.left - 1;
    const top = patch.top - 1;
    const across = patch.right - patch.left + 3;
    const down = patch.bottom - patch.top + 3;
    const mask = document.createElement("canvas");
    mask.width = across;
    mask.height = down;
    const maskContext = mask.getContext("2d")!;
    const pixels = maskContext.createImageData(across, down);
    for (let y = 0; y < down; y++) {
      for (let x = 0; x < across; x++) {
        let inside = false;
        for (let dy = -1; dy <= 1 && !inside; dy++) {
          for (let dx = -1; dx <= 1 && !inside; dx++) {
            const sx = left + x + dx;
            const sy = top + y + dy;
            inside = sx >= 0 && sy >= 0 && sx < width && sy < height && labels[sy * width + sx] === patch.label;
          }
        }
        if (inside) pixels.data[(y * across + x) * 4 + 3] = 255;
      }
    }
    maskContext.putImageData(pixels, 0, 0);

    const piece = document.createElement("canvas");
    piece.width = Math.round(across * scale);
    piece.height = Math.round(down * scale);
    const context = piece.getContext("2d")!;
    context.drawImage(image, left * scale, top * scale, piece.width, piece.height, 0, 0, piece.width, piece.height);
    context.globalCompositeOperation = "destination-in";
    context.imageSmoothingEnabled = true;
    context.drawImage(mask, 0, 0, piece.width, piece.height);
    return piece;
  });
}

function buildBank(pieces: HTMLCanvasElement[], options: BankOptions, offset: number): Bank {
  const group = new THREE.Group();
  const next = random(options.seed);
  const angles: number[] = [];
  const heights: number[] = [];
  const sprites: THREE.Sprite[] = [];
  for (let index = 0; index < options.pieces; index++) {
    const canvas = pieces[(index + offset) % pieces.length];
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, fog: false }));
    const wide = options.narrow + (options.wide - options.narrow) * next();
    // Every second piece is mirrored, so a picture used twice does not look the same.
    sprite.scale.set(wide * (index % 2 === 0 ? 1 : -1), (wide * canvas.height) / canvas.width, 1);
    angles.push(((index + 0.25 + 0.5 * next()) / options.pieces) * TURN);
    heights.push(options.low + (options.high - options.low) * next());
    sprites.push(sprite);
    group.add(sprite);
  }
  return {
    options,
    group,
    sprites,
    placeAt(index, seconds, into) {
      const angle = angles[index] + (seconds / options.turn) * TURN;
      return into.set(Math.sin(angle) * options.radius, heights[index], Math.cos(angle) * options.radius);
    },
  };
}

/** Stand the banks of clouds cut from the floating layer's picture around the scene. */
export function buildClouds(image: HTMLImageElement | HTMLCanvasElement | ImageBitmap): Clouds {
  const pieces = cutPieces(image);
  const group = new THREE.Group();
  const banks = pieces.length === 0 ? [] : [buildBank(pieces, NEAR_BANK, 0), buildBank(pieces, MIDDLE_BANK, NEAR_BANK.pieces)];
  for (const bank of banks) group.add(bank.group);
  const seen = new THREE.Vector3();
  return {
    group,
    banks,
    update(seconds, camera) {
      for (const bank of banks) {
        bank.sprites.forEach((sprite, index) => {
          bank.placeAt(index, seconds, sprite.position);
          // A piece fades as the camera comes close to it, so the view stays clear.
          const away = camera.getWorldPosition(seen).distanceTo(sprite.position);
          (sprite.material as THREE.SpriteMaterial).opacity = THREE.MathUtils.smoothstep(away, FADE[0], FADE[1]);
        });
      }
    },
  };
}

// The notes the clouds sound on, all from the music's scale, D major pentatonic.
const HUSH = [146.83, 220.0];
const CHORD = [369.99, 440.0, 493.88, 587.33, 659.25];
const WHISTLE = [1174.66, 1318.51, 1479.98, 1760.0, 1975.53];
/** How loud each layer of clouds is: the wrapped layer's hush, the middle bank's chord and the near bank's whistles. */
export const CLOUD_LEVELS = { hush: 0.6, chord: 0.01, whistle: 1 };
const STEP = 0.25;

export interface CloudSound {
  /** Set the clouds' sound ahead on the audio clock. Call it from a timer, which a hidden page still runs. */
  schedule(ahead?: number): void;
}

function noise(context: BaseAudioContext, seconds: number): AudioBuffer {
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * seconds), context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  return buffer;
}

/** How a sound swells and fades on a loop of its own: from 0 to 1 and back, resting at 0 for a while. */
function breath(seconds: number, period: number, phase: number): number {
  return Math.max(0, Math.sin((seconds / period) * TURN + phase)) ** 2;
}

/**
 * The clouds' sounds: a low hush for the wrapped layer that is the same from
 * everywhere, a soft chord from the middle bank and a high whistle from each piece
 * of the near bank, each heard from where its piece is. clock gives the scene's
 * time in seconds, which places the pieces.
 */
export function buildCloudSound(
  context: BaseAudioContext,
  destination: AudioNode,
  banks: Bank[],
  clock: () => number,
  levels = CLOUD_LEVELS,
): CloudSound {
  const source = context.createBufferSource();
  source.buffer = noise(context, 6.1);
  source.loop = true;
  source.start();

  const hush = context.createGain();
  hush.connect(destination);
  for (const frequency of HUSH) {
    const band = context.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = frequency;
    band.Q.value = 30;
    source.connect(band).connect(hush);
  }

  const params: AudioParam[] = [hush.gain];
  const voices: { bank: Bank; index: number; level: number; period: number; phase: number }[] = [];
  const near = banks[0];
  const middle = banks[1];
  for (const bank of [near, middle]) {
    if (!bank) continue;
    const whistles = bank === near;
    bank.sprites.forEach((_, index) => {
      const place = context.createPanner();
      place.panningModel = "equalpower";
      place.distanceModel = "inverse";
      place.refDistance = whistles ? 1.5 : bank.options.radius;
      place.rolloffFactor = whistles ? 1.4 : 1;
      place.connect(destination);
      const gain = context.createGain();
      gain.gain.value = 0;
      gain.connect(place);
      const notes = whistles ? WHISTLE : CHORD;
      const frequency = notes[index % notes.length];
      if (whistles) {
        // Breath across a bottle: noise through a narrow band.
        const band = context.createBiquadFilter();
        band.type = "bandpass";
        band.frequency.value = frequency;
        band.Q.value = 40;
        source.connect(band).connect(gain);
      } else {
        const tone = context.createOscillator();
        tone.frequency.value = frequency;
        tone.connect(gain);
        tone.start();
      }
      params.push(gain.gain, place.positionX, place.positionY, place.positionZ);
      voices.push({
        bank,
        index,
        level: whistles ? levels.whistle : levels.chord,
        period: 24 + 17 * ((index * 0.618) % 1),
        phase: index * 2.4,
      });
    });
  }

  const at = new THREE.Vector3();
  const schedule = rampAhead(
    context,
    params,
    (seconds) => [
      levels.hush * (0.35 + 0.65 * breath(seconds, 40, 0)),
      ...voices.flatMap((voice) => {
        voice.bank.placeAt(voice.index, seconds, at);
        return [voice.level * breath(seconds, voice.period, voice.phase), at.x, at.y, at.z];
      }),
    ],
    clock,
    STEP,
  );
  return { schedule };
}
