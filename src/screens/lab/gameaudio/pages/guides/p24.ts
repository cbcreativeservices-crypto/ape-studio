/**
 * Screen guide — "Loops and their joins" (the learner's page 12; the file's
 * number is its name, see pages/index.ts). Pure data (the guide test loads it
 * under node). Voice: to the student, about THIS screen.
 *
 * Its lines are the loop lines of the old "Loops, ambience and zones" guide,
 * moved here with the lesson on 2026-11-14 (owner's decision 5).
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G24: ScreenGuide = {
  intro: {
    learning: 'A loop repeats, so the join where its end meets its start has to be prepared. A fade does not repair a join that was cut badly.',
    start: 'Switch SCENE on, then open WIND and choose RAW CUT. Watch JUMPS in the strip under the picture: it counts each time the wind passes its join.',
  },
  seeing: [
    'The strip draws each bed’s level, its loop with a play position, and the join.',
    'WIND shows which file the courtyard wind is playing: LOOP, or RAW CUT.',
    'Choosing a file prints a MIX line in the log, which here leaves out the START and STOP lines.',
  ],
  control: [
    'LEVEL is the lab’s playback level, on the slider when this page opens.',
    'SCENE switches the two beds and the fountain on or off.',
    'WIND chooses the courtyard wind’s file: PREPARED LOOP or RAW CUT.',
  ],
  changes: [
    'RAW CUT prints a MIX line. The courtyard bed starts again with that file, and its level jumps at the join every 10 seconds. The strip under the picture counts JUMPS.',
    'PREPARED LOOP starts the bed again with the blended file: the play position passes the join and the level does not jump.',
  ],
  teaches: [
    'The join is a moment inside the file. Nothing done at a doorway or on a fader removes a jump that is cut into it.',
    'A looping file is prepared for looping: its end is blended into its start.',
  ],
  tryThis: [
    'Choose RAW CUT and count with the strip: you see the jump come back every 10 seconds, as often as the file repeats.',
    'With RAW CUT playing, press ■ STOP, then switch SCENE on again. The count of JUMPS starts from the new start of the bed.',
  ],
};
