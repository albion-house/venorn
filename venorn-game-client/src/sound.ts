// The game's sounds, all made in the browser.

let context: AudioContext | undefined;
let wind: GainNode | undefined;

/** A pin going in: a short click over a soft thud. */
export function playPin(): void {
  context ??= new AudioContext();
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
  click.connect(band).connect(clickGain).connect(context.destination);
  click.start(now);

  const thud = context.createOscillator();
  thud.frequency.setValueAtTime(190, now);
  thud.frequency.exponentialRampToValueAtTime(80, now + 0.09);
  const thudGain = context.createGain();
  thudGain.gain.setValueAtTime(0.35, now);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  thud.connect(thudGain).connect(context.destination);
  thud.start(now);
  thud.stop(now + 0.13);
}

/** A pin coming out: a soft, rising pop. */
export function playRemove(): void {
  context ??= new AudioContext();
  const now = context.currentTime;
  const pop = context.createOscillator();
  pop.frequency.setValueAtTime(160, now);
  pop.frequency.exponentialRampToValueAtTime(420, now + 0.07);
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  pop.connect(gain).connect(context.destination);
  pop.start(now);
  pop.stop(now + 0.11);
}

/** The clouds, far off: low, slowly swelling wind. Browsers allow sound only after a tap or click. */
export function setWind(on: boolean): void {
  context ??= new AudioContext();
  if (!wind) {
    const seconds = 6;
    const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
    const samples = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < samples.length; i++) {
      // Each sample leans on the one before it, which takes the hiss out of the noise.
      last = 0.985 * last + 0.015 * (Math.random() * 2 - 1);
      samples[i] = last * 6;
    }
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const low = context.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 420;
    const swell = context.createOscillator();
    swell.frequency.value = 0.07;
    const swellDepth = context.createGain();
    swellDepth.gain.value = 160;
    swell.connect(swellDepth).connect(low.frequency);
    wind = context.createGain();
    wind.gain.value = 0;
    noise.connect(low).connect(wind).connect(context.destination);
    noise.start();
    swell.start();
  }
  void context.resume();
  wind.gain.linearRampToValueAtTime(on ? 0.12 : 0, context.currentTime + 1.5);
}
