/**
 * Screen guide — page 2, "Sound that reacts". Pure data (the guide test
 * loads it under node). Voice: to the student, about THIS screen.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G02: ScreenGuide = {
  intro: {
    learning: 'How a game asks for sound: an event starts a sound, and a parameter changes a sound that is already playing, with nothing restarted.',
    start: 'Turn SOUND on, press OPEN DOOR, then switch GEN 1 on. Move the SPEED slider while the generator runs and read the activity log: no new START appears.',
  },
  seeing: [
    'You are looking down on a courtyard and a workshop. You are the figure on the stone path; the generator is in the workshop.',
    'Rings around the generator show its sound where you stand: bluer when faint, toward red when loud. They leave more often as SPEED rises.',
    'DOOR and SPEED show the scene. PLAYING counts instances, VOICES counts the sound files they are playing, and SOUND says whether you can hear them.',
  ],
  control: [
    'SPEED sets the generator’s speed value from 0 to 100%. The slider controls it when the page opens.',
    'OPEN DOOR posts the door event each time you press it; the key then shows CLOSE DOOR. Opening and closing each play their own take.',
    'GEN 1 starts and stops the generator (GENERATOR 1: the key is narrow, so its name is short).',
  ],
  changes: [
    'Each press of the door key adds two GAME lines: the door moved, then its event. START lines follow: the game asked by name, and the audio side answered.',
    'Moving SPEED while the generator runs updates one VALUE line, which counts the changes. The same instance keeps playing, so PLAYING does not change.',
  ],
  teaches: [
    'Most of a game’s sound cannot follow one fixed soundtrack, so it waits to be asked for.',
    'An event starts a sound. A parameter changes a value that a playing sound follows. Here the value is kept on the generator.',
    'A change of value restarts nothing, which is why it has no gap.',
  ],
  tryThis: [
    'Start the generator, then move SPEED from one end to the other. Count the START lines in the log before and after: the number stays the same.',
    'With the generator running, close the door and open it again. Listen to how the hum changes, then read the rings.',
  ],
};
