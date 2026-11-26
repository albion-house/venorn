// The sound of a pin going in: a short click over a soft thud.

let context: AudioContext | undefined;

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
