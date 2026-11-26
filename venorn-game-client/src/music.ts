// Ambient music that the placed things play. Each thing has a note of its own
// that comes around on a slow loop, like tape loops of different lengths. The
// note sounds from where the thing sits, so it is louder with the camera near.

import * as THREE from "three";

/** A placed thing as the music sees it. */
export interface Emitter {
  /** Stays the same for as long as the thing is on the structure. */
  key: object;
  position: THREE.Vector3;
  /** Which voice plays the thing's note. */
  timbre: number;
  /** How high on the structure the thing sits, from 0 to 1. Higher things play higher notes. */
  height: number;
}

export interface Sounded {
  key: object;
  /** How long the note rings, in seconds. */
  seconds: number;
}

export interface Music {
  /**
   * Call once a frame. level runs from 0 for silence to 1. Returns the things
   * whose notes began in this frame.
   */
  update(seconds: number, emitters: Emitter[], level: number, camera: THREE.Camera): Sounded[];
}

// The notes the things choose from: D major pentatonic over three octaves.
const SCALE = [146.83, 164.81, 185.0, 220.0, 246.94, 293.66, 329.63, 369.99, 440.0, 493.88, 587.33, 659.25, 739.99, 880.0];
// A thing's loop is between these lengths, in seconds.
const LOOP: [number, number] = [11, 28];
// With more things than this on the structure, every loop is stretched, so the music does not crowd.
const FULL = 14;
// The most notes that ring at once.
const VOICES = 16;
// A note is at full strength with the camera this close, in world units, and falls away beyond it.
const NEAR = 2.2;
const FALL = 1.4;

interface Partial {
  ratio: number;
  level: number;
  type: OscillatorType;
}

interface Timbre {
  partials: Partial[];
  attack: number;
  release: number;
  // Octaves above or below the thing's note.
  octave: number;
  // A low-pass filter's cutoff as a multiple of the note, or none.
  soften?: number;
}

const TIMBRES: Timbre[] = [
  // Air: a slow swell with a faint octave.
  { partials: [{ ratio: 1, level: 1, type: "sine" }, { ratio: 2, level: 0.22, type: "sine" }], attack: 1.4, release: 5, octave: 0 },
  // Bell: struck, with the uneven overtones of metal.
  {
    partials: [
      { ratio: 1, level: 1, type: "sine" },
      { ratio: 2.76, level: 0.3, type: "sine" },
      { ratio: 5.4, level: 0.1, type: "sine" },
    ],
    attack: 0.012,
    release: 5,
    octave: 0,
  },
  // Mallet: a soft, low knock.
  { partials: [{ ratio: 1, level: 1, type: "triangle" }], attack: 0.03, release: 3.6, octave: -1, soften: 3 },
  // Glass: struck and high.
  {
    partials: [
      { ratio: 1, level: 0.8, type: "sine" },
      { ratio: 3, level: 0.2, type: "sine" },
      { ratio: 4.2, level: 0.08, type: "sine" },
    ],
    attack: 0.012,
    release: 6,
    octave: 1,
  },
  // Pad: two voices a little apart in pitch, with one an octave below.
  {
    partials: [
      { ratio: 1, level: 0.6, type: "triangle" },
      { ratio: 1.006, level: 0.6, type: "triangle" },
      { ratio: 0.5, level: 0.4, type: "sine" },
    ],
    attack: 2.2,
    release: 6,
    octave: 0,
    soften: 2.5,
  },
];

/** A number from 0 to 1 that is always the same for the same place. */
function hash(position: THREE.Vector3, salt: number): number {
  const mixed = Math.sin(position.x * 12.9898 + position.y * 78.233 + position.z * 37.719 + salt) * 43758.5453;
  return mixed - Math.floor(mixed);
}

/** The note and voice a thing plays: its pitch in hertz and how long it rings. */
export function noteFor(emitter: Emitter): { frequency: number; timbre: Timbre; seconds: number } {
  const timbre = TIMBRES[((emitter.timbre % TIMBRES.length) + TIMBRES.length) % TIMBRES.length];
  // Height picks the note, and where the thing sits moves it a step or two.
  const span = SCALE.length - 3;
  const step = Math.round(THREE.MathUtils.clamp(emitter.height, 0, 1) * (span - 1)) + Math.floor(hash(emitter.position, 1) * 3);
  return {
    frequency: SCALE[Math.min(SCALE.length - 1, step)] * 2 ** timbre.octave,
    timbre,
    seconds: timbre.attack + timbre.release,
  };
}

/** A long, soft echo made from fading noise. */
function buildEcho(context: BaseAudioContext): ConvolverNode {
  const seconds = 5;
  const length = Math.floor(context.sampleRate * seconds);
  const impulse = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const samples = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      samples[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3.2;
    }
  }
  const echo = context.createConvolver();
  echo.buffer = impulse;
  return echo;
}

/**
 * Build the music on an audio context. Notes go to the destination through a
 * shared echo. Nothing sounds until update is called with things and a level.
 */
export function createMusic(context: BaseAudioContext, destination: AudioNode): Music {
  // Everything the things play passes through one level, an echo and a limiter.
  const level = context.createGain();
  level.gain.value = 0;
  const limiter = context.createDynamicsCompressor();
  // The limiter acts only on a crowd of near notes, so a single thing still gets louder as the camera nears it.
  limiter.threshold.value = -6;
  limiter.ratio.value = 8;
  const wet = context.createGain();
  wet.gain.value = 0.9;
  level.connect(limiter);
  level.connect(buildEcho(context)).connect(wet).connect(limiter);
  limiter.connect(destination);

  // A low drone under the notes: the scale's first note, its fifth and its octave.
  const drone = context.createGain();
  drone.gain.value = 0;
  const droneTone = context.createBiquadFilter();
  droneTone.type = "lowpass";
  droneTone.frequency.value = 420;
  droneTone.connect(drone).connect(level);
  for (const [frequency, strength] of [
    [73.42, 0.5],
    [110.0, 0.32],
    [146.83, 0.18],
    [147.4, 0.14],
  ]) {
    const voice = context.createOscillator();
    voice.type = "triangle";
    voice.frequency.value = frequency;
    const part = context.createGain();
    part.gain.value = strength;
    voice.connect(part).connect(droneTone);
    voice.start();
  }

  const loops = new WeakMap<object, { next: number; period: number }>();
  const position = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const up = new THREE.Vector3();
  let ringing = 0;

  function listen(camera: THREE.Camera): void {
    camera.getWorldPosition(position);
    camera.getWorldDirection(forward);
    up.copy(camera.up).applyQuaternion(camera.quaternion);
    const listener = context.listener;
    if (listener.positionX) {
      listener.positionX.value = position.x;
      listener.positionY.value = position.y;
      listener.positionZ.value = position.z;
      listener.forwardX.value = forward.x;
      listener.forwardY.value = forward.y;
      listener.forwardZ.value = forward.z;
      listener.upX.value = up.x;
      listener.upY.value = up.y;
      listener.upZ.value = up.z;
    } else {
      // Older browsers set the listener with these two calls.
      listener.setPosition(position.x, position.y, position.z);
      listener.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
    }
  }

  function play(emitter: Emitter): number {
    const { frequency, timbre, seconds } = noteFor(emitter);
    // A context that has not been started by a tap would hold its notes and play them all at once later.
    const stopped = context instanceof AudioContext && context.state !== "running";
    if (stopped || ringing >= VOICES) return seconds;
    const now = context.currentTime + 0.02;
    const place = context.createPanner();
    place.panningModel = "equalpower";
    place.distanceModel = "inverse";
    place.refDistance = NEAR;
    place.rolloffFactor = FALL;
    place.positionX.value = emitter.position.x;
    place.positionY.value = emitter.position.y;
    place.positionZ.value = emitter.position.z;
    place.connect(level);

    let into: AudioNode = place;
    if (timbre.soften) {
      const soft = context.createBiquadFilter();
      soft.type = "lowpass";
      soft.frequency.value = frequency * timbre.soften;
      soft.connect(place);
      into = soft;
    }
    let last: OscillatorNode | undefined;
    for (const partial of timbre.partials) {
      const voice = context.createOscillator();
      voice.type = partial.type;
      voice.frequency.value = frequency * partial.ratio;
      // Overtones die away sooner than the note itself, as they do in a struck bell.
      const release = timbre.release / Math.max(1, partial.ratio) ** 0.6;
      const swell = context.createGain();
      swell.gain.setValueAtTime(0.0001, now);
      swell.gain.linearRampToValueAtTime(0.3 * partial.level, now + timbre.attack);
      swell.gain.exponentialRampToValueAtTime(0.0001, now + timbre.attack + release);
      voice.connect(swell).connect(into);
      voice.start(now);
      voice.stop(now + timbre.attack + release + 0.05);
      last ??= voice;
    }
    ringing++;
    last?.addEventListener("ended", () => {
      ringing--;
      place.disconnect();
    });
    return seconds;
  }

  return {
    update(seconds: number, emitters: Emitter[], strength: number, camera: THREE.Camera): Sounded[] {
      listen(camera);
      const soon = context.currentTime;
      level.gain.setTargetAtTime(2.6 * strength, soon, 1.5);
      drone.gain.setTargetAtTime(0.018 * strength * strength, soon, 3);

      const sounded: Sounded[] = [];
      const crowd = Math.max(1, emitters.length / FULL);
      const fresh = emitters.filter((emitter) => !loops.has(emitter.key)).length;
      for (const emitter of emitters) {
        let loop = loops.get(emitter.key);
        if (!loop) {
          const period = LOOP[0] + (LOOP[1] - LOOP[0]) * Math.random();
          // A thing placed alone sounds right away. Things placed together start spread out.
          const wait = fresh <= 2 ? 0.3 + 0.6 * Math.random() : Math.random() * period * crowd;
          loop = { next: seconds + wait, period };
          loops.set(emitter.key, loop);
        }
        if (seconds < loop.next) continue;
        const late = seconds - loop.next;
        loop.next = seconds + loop.period * crowd * (0.92 + 0.16 * Math.random());
        // After the page was hidden, every loop is overdue at once. Those notes are passed over.
        if (late > 1.5) {
          loop.next = seconds + Math.random() * loop.period * crowd;
          continue;
        }
        if (strength > 0.01) sounded.push({ key: emitter.key, seconds: play(emitter) });
      }
      return sounded;
    },
  };
}
