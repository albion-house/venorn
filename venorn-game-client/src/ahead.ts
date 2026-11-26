// Sound that follows the scene is set ahead on the audio clock from a timer,
// because a browser stops drawing a page it is not showing but still runs its timers.

/** How far ahead of the audio clock the sound is set, in seconds. A hidden page's timers run at least once a second. */
export const AHEAD = 2;

/**
 * Keep audio params set ahead of the audio clock from a function of the scene's
 * time, which clock gives in seconds. Returns a function to call from a timer.
 * Each call sets the params a step at a time from where they were last set up to
 * ahead seconds past the audio clock.
 */
export function rampAhead(
  context: BaseAudioContext,
  params: AudioParam[],
  values: (seconds: number) => number[],
  clock: () => number,
  step: number,
): (ahead?: number) => void {
  // The audio clock's time up to which the params are set.
  let until = -Infinity;
  return (ahead = AHEAD) => {
    const now = context.currentTime;
    const offset = clock() - now;
    if (until < now) {
      // The first time, or after the page was frozen: start again from now.
      const start = values(now + offset);
      params.forEach((param, i) => {
        param.cancelScheduledValues(now);
        param.setValueAtTime(start[i], now);
      });
      until = now;
    }
    while (until + step <= now + ahead) {
      until += step;
      const next = values(until + offset);
      params.forEach((param, i) => param.linearRampToValueAtTime(next[i], until));
    }
  };
}
