// Sound that follows the scene is set ahead on the audio clock from a timer,
// because a browser stops drawing a page it is not showing but still runs its timers.

/** How far ahead of the audio clock the sound is set, in seconds. A hidden page's timers run at least once a second. */
export const AHEAD = 2;
