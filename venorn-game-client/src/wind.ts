// The wind in the meadow: when it gusts, and how it sounds. The plants sway and
// the wind sounds with the same gusts.

import { AHEAD, rampAhead } from "./ahead";

// Gusts come from three waves of about 30, 12 and 5 seconds: their pace in radians
// a second, their phase, their strength and their skew. A skewed wave rises faster
// than it falls, so a gust picks up quickly and dies away slowly.
const WAVES: [number, number, number, number][] = [
  [0.21, 0, 0.5, 0.7],
  [0.53, 2, 0.32, 0.6],
  [1.3, 0.4, 0.18, 0],
];
// The sum of the waves is a lull below the first number and the height of a strong gust above the second.
const LULL = -0.5;
const PEAK = 0.9;
/** A gust reaches a plant this many seconds later for each world unit the plant stands down the wind. */
export const GUST_LAG = 0.71;

function smoothstep(from: number, to: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

/** How hard the wind blows at the middle of the scene: 0 in a lull, 1 at the height of a strong gust. */
export function gustAt(seconds: number): number {
  let sum = 0;
  for (const [pace, phase, strength, skew] of WAVES) {
    const angle = seconds * pace + phase;
    sum += strength * Math.sin(angle + skew * Math.sin(angle));
  }
  return smoothstep(LULL, PEAK, sum);
}

const float = (value: number): string => (Number.isInteger(value) ? value.toFixed(1) : String(value));

/** gustAt for a shader, made from the same waves. */
export const GUST_GLSL = /* glsl */ `
float gustAt(float seconds) {
  float sum = 0.0;
  float angle;
  ${WAVES.map(
    ([pace, phase, strength, skew]) =>
      `angle = seconds * ${float(pace)} + ${float(phase)}; sum += ${float(strength)} * sin(angle + ${float(skew)} * sin(angle));`,
  ).join("\n  ")}
  return smoothstep(${float(LULL)}, ${float(PEAK)}, sum);
}
`;

// The wind's levels are set this often, in seconds.
const STEP = 0.1;

export interface Wind {
  /**
   * Set the wind's levels on the audio clock from where they were last set up
   * to this many seconds ahead. Call it from a timer, which a hidden page still runs.
   */
  schedule(ahead?: number): void;
}

/** Noise that is louder in the low notes, as moving air is. */
function pinkNoise(context: BaseAudioContext, seconds: number): AudioBuffer {
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * seconds), context.sampleRate);
  const samples = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.963 * b1 + white * 0.2965164;
    b2 = 0.57 * b2 + white * 1.0526913;
    samples[i] = b0 + b1 + b2 + white * 0.1848;
    peak = Math.max(peak, Math.abs(samples[i]));
  }
  for (let i = 0; i < samples.length; i++) samples[i] /= peak;
  return buffer;
}

/**
 * Build the wind on an audio context: a soft rush of low air, two whistles whose
 * pitch rises with a gust, and leaves that rustle in the stronger part of one. A
 * gust comes in from the left and dies away to the right, the way the meadow's
 * wind blows. clock gives the meadow's time in seconds, which picks the gust.
 */
export function buildWind(context: BaseAudioContext, destination: AudioNode, clock: () => number): Wind {
  // Two loops of noise of different lengths, so that neither is heard repeating.
  const sources = [7.3, 11.9].map((seconds) => {
    const source = context.createBufferSource();
    source.buffer = pinkNoise(context, seconds);
    source.loop = true;
    source.start();
    return source;
  });

  // The rush is kept off the lowest notes, whose steady roar sounds like falling water.
  const rushFloor = context.createBiquadFilter();
  rushFloor.type = "highpass";
  rushFloor.frequency.value = 200;
  rushFloor.Q.value = 0.6;
  const rushTone = context.createBiquadFilter();
  rushTone.type = "lowpass";
  rushTone.Q.value = 0.7;
  const rush = context.createGain();
  sources[0].connect(rushFloor).connect(rushTone).connect(rush).connect(destination);

  // The whistles and the leaves pass from one side to the other with each gust.
  const across = context.createStereoPanner();
  across.connect(destination);
  const whistles = [
    { source: sources[1], q: 9, from: 300, to: 900, level: 1.6, rise: 1.6 },
    { source: sources[0], q: 14, from: 430, to: 1260, level: 1.1, rise: 2.2 },
  ].map((whistle) => {
    const tone = context.createBiquadFilter();
    tone.type = "bandpass";
    tone.Q.value = whistle.q;
    const gain = context.createGain();
    whistle.source.connect(tone).connect(gain).connect(across);
    return { ...whistle, tone, gain };
  });

  const leafTone = context.createBiquadFilter();
  leafTone.type = "bandpass";
  leafTone.frequency.value = 5600;
  leafTone.Q.value = 0.8;
  const leaves = context.createGain();
  sources[1].connect(leafTone).connect(leaves).connect(across);

  const params = [rush.gain, rushTone.frequency, across.pan, leaves.gain, ...whistles.flatMap((w) => [w.gain.gain, w.tone.frequency])];

  /** Every level at one moment of the meadow's time, in the order of params. */
  function levels(seconds: number): number[] {
    const gust = gustAt(seconds);
    // A gust that is picking up comes from the left, and one that is dying away goes to the right.
    const rising = (gustAt(seconds + 0.5) - gustAt(seconds - 0.5)) * 4;
    const flutter = 0.45 + 0.55 * Math.random();
    return [
      0.06 + 0.28 * gust,
      380 + 700 * gust,
      -0.6 * Math.tanh(rising),
      0.05 * smoothstep(0.4, 0.95, gust) * flutter,
      ...whistles.flatMap((w) => [w.level * gust ** w.rise, w.from + (w.to - w.from) * gust]),
    ];
  }

  const schedule = rampAhead(context, params, levels, clock, STEP);
  return { schedule: (ahead = AHEAD) => schedule(ahead) };
}
