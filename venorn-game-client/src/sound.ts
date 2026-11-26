// The game's sounds, all made in the browser. A browser lets a page make
// sound only after a tap, a click or a key press, so nothing plays before that.

import { buildWind, type Wind } from "./wind";

let context: AudioContext | undefined;
let master: GainNode | undefined;
let wanted = true;

let wind: Wind | undefined;

/** The one output every sound goes through, so one switch silences them all. */
function output(): { context: AudioContext; master: GainNode } {
  context ??= new AudioContext();
  if (!master) {
    master = context.createGain();
    master.gain.value = wanted ? 1 : 0;
    master.connect(context.destination);
  }
  return { context, master };
}

/** The audio context and the output every sound goes through, once a tap, a click or a key press has started them. */
export function bus(): { context: AudioContext; master: GainNode } | undefined {
  return context && master ? { context, master } : undefined;
}

/** Switch every sound on or off. */
export function setSound(on: boolean): void {
  wanted = on;
  if (!context || !master) return;
  master.gain.linearRampToValueAtTime(on ? 1 : 0, context.currentTime + 0.4);
}

/** Start the wind. Call this from a tap, a click or a key press. */
export function startWind(): void {
  const { context, master } = output();
  void context.resume();
  if (wind) return;
  // The gusts follow the draw loop's clock, so the wind sounds with the meadow's sway.
  wind = buildWind(context, master, () => performance.now() / 1000);
  wind.schedule();
}

/** Set the wind ahead on the audio clock. Call it from a timer, which a hidden page still runs. */
export function scheduleWind(): void {
  wind?.schedule();
}

/** A pin going in: a short click over a soft thud. */
export function playPin(): void {
  const { context, master } = output();
  const now = context.currentTime;

  const length = Math.floor(context.sampleRate * 0.03);
  const noise = context.createBuffer(1, length, context.sampleRate);
  const samples = noise.getChannelData(0);
  for (let i = 0; i < length; i++) {
    samples[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2;
  }
  const click = context.createBufferSource();
  click.buffer = noise;
  const band = context.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 2600;
  const clickGain = context.createGain();
  clickGain.gain.value = 0.5;
  click.connect(band).connect(clickGain).connect(master);
  click.start(now);

  const thud = context.createOscillator();
  thud.frequency.setValueAtTime(190, now);
  thud.frequency.exponentialRampToValueAtTime(80, now + 0.09);
  const thudGain = context.createGain();
  thudGain.gain.setValueAtTime(0.35, now);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  thud.connect(thudGain).connect(master);
  thud.start(now);
  thud.stop(now + 0.13);
}

/** A pin coming out: a soft, rising pop. */
export function playRemove(): void {
  const { context, master } = output();
  const now = context.currentTime;
  const pop = context.createOscillator();
  pop.frequency.setValueAtTime(160, now);
  pop.frequency.exponentialRampToValueAtTime(420, now + 0.07);
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  pop.connect(gain).connect(master);
  pop.start(now);
  pop.stop(now + 0.11);
}

/**
 * A bird calling from far off: two or three short notes that fall in pitch,
 * with a faint echo. across places it from -1 at the left to 1 at the right.
 */
export function playBirdCall(across: number): void {
  if (!context || !master) return;
  const pan = context.createStereoPanner();
  pan.pan.value = across * 0.8;
  const echo = context.createDelay();
  echo.delayTime.value = 0.21;
  const echoGain = context.createGain();
  echoGain.gain.value = 0.3;
  pan.connect(master);
  pan.connect(echo).connect(echoGain).connect(master);

  const pitch = 2300 + Math.random() * 1100;
  const notes = 2 + Math.floor(Math.random() * 2);
  for (let note = 0; note < notes; note++) {
    const at = context.currentTime + note * (0.16 + Math.random() * 0.05);
    const voice = context.createOscillator();
    voice.frequency.setValueAtTime(pitch * 1.22, at);
    voice.frequency.exponentialRampToValueAtTime(pitch, at + 0.06);
    voice.frequency.exponentialRampToValueAtTime(pitch * 0.82, at + 0.14);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.07, at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.15);
    voice.connect(gain).connect(pan);
    voice.start(at);
    voice.stop(at + 0.17);
  }
}

/**
 * Glitter: a scatter of small, bright pings. strength runs from 0 for a few
 * sparkles to 1 for a burst, and the pings are spread over the given seconds.
 */
export function playGlitter(strength: number, seconds = 0.5): void {
  if (!context || !master) return;
  // Notes of a pentatonic scale, high up, so any of them sound well together.
  const notes = [1568, 1760, 2093, 2349, 2637, 3136, 3520, 4186];
  const pings = Math.round(3 + 22 * strength * Math.max(1, seconds));
  for (let ping = 0; ping < pings; ping++) {
    const at = context.currentTime + Math.random() * seconds;
    const voice = context.createOscillator();
    voice.type = "sine";
    voice.frequency.value = notes[Math.floor(Math.random() * notes.length)] * (Math.random() < 0.3 ? 2 : 1);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.012 + 0.03 * strength * Math.random(), at + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.25 + Math.random() * 0.35);
    const pan = context.createStereoPanner();
    pan.pan.value = Math.random() * 1.2 - 0.6;
    voice.connect(gain).connect(pan).connect(master);
    voice.start(at);
    voice.stop(at + 0.65);
  }
}
