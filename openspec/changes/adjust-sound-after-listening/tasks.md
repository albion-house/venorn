## 1. Sound in a background tab

- [ ] 1.1 Show why the music stops in a background tab. Verify: with the page held by `window.venorn.hold(true)`, a script counts the notes started in a minute and finds none, while the audio context runs and the wind sounds.
- [ ] 1.2 Schedule the notes ahead from a timer, and keep the swell and the lines in the draw loop. Verify: notes started in a minute with the page held, and with the timers slowed to once a second, are about as many as with the page drawing, and the music is as loud against the wind.
- [ ] 1.3 Pass over notes that are long overdue, and silence the note of a thing removed before it sounds. Verify: after the timer is stopped for ten seconds no crowd of notes starts, and a thing removed within two seconds of its note sounds no note.

## 2. Gusts

- [ ] 2.1 Make one gust function for the meadow and the wind, with uneven gusts and lulls. Verify: over 20 minutes of the function, the number of gusts a minute, the gaps between them, the spread of their peaks and the share of lulls.
- [ ] 2.2 Rebuild the wind's sound and schedule its gusts ahead from the timer. Verify: two minutes of the old and the new wind are rendered with an OfflineAudioContext and compared by their range of loudness, the gusts heard a minute and the share of loudness below 260 Hz, and the new wind's mean loudness is near the old.
- [ ] 2.3 Keep the meadow swaying with the gusts. Verify: pictures read from the canvas in a lull and in a gust show the plants moving more in the gust.

## 3. Clouds at three depths

- [ ] 3.1 Cut pieces from the floating layer's picture in the browser. Verify: the number of pieces cut, and a picture of them.
- [ ] 3.2 Stand a near bank and a middle bank of pieces around the scene and turn them slowly. Verify: from the front view a picture read from the canvas shows pieces in front of the skull and behind it, and the share of the skull they cover.
- [ ] 3.3 Fade a piece as the camera comes close. Verify: a piece's opacity with the camera on it and 1.5 units from it.
- [ ] 3.4 Make a sound for each layer of clouds. Verify: rendered with an OfflineAudioContext, each layer's loudness from the front view is below a thing's note, the layers differ in pitch, and a near piece's whistle is louder with the camera near it.

## 4. Checks and listening

- [ ] 4.1 Run the client's type check and the repository's check. Verify: `mise //venorn-game-client:check` and `mise run check` pass, and the page raises no errors.
- [ ] 4.2 Listen with codekiln and adjust. Verify: codekiln says the music carries on in a background tab, the wind gusts and sounds like air, and the clouds' depths and sounds are right for now.
