/**
 * Screen guide — page 10, "Loops, ambience and zones". Pure data (the guide
 * test loads it under node). Voice: to the student, about THIS screen.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G10: ScreenGuide = {
  intro: {
    learning: 'How background sound is built. A loop needs a prepared join, a bed has no position, and spot sounds break the repetition. Each zone crossing is one crossfade.',
    start: 'Open SOUNDS, switch SCENE on and choose OPEN DOOR, then close the tray. Press STEP until you pass through the doorway, and find the ZONE line in the log.',
  },
  seeing: [
    'Two zones, joined by one door. Streaks over the courtyard and a band in the workshop show each bed while it plays.',
    'The strip under the picture shows each bed’s level, its loop with a play position, and the join.',
    'ZONE shows COURTYARD or WORKSHOP. BEDS counts the copies of the two beds that are playing: 2 in a clean scene.',
    'The log on this page shows only STATE, MIX, FAULT and NOTE lines.',
  ],
  control: [
    'FACING turns you, from 0° to 360°; 0° is toward the top of the picture. STEP walks one step the way you face.',
    'SOUNDS opens a tray. Its SCENE chip switches the two beds and the fountain on or off. OPEN DOOR is beside it.',
    'In the same tray, ONCE, WITH THE SCENE and ON EVERY UPDATE choose when a bed starts. A ✓ marks the rule in use: IN PROJECT, or IN BUILD once a fault has shown itself.',
    'WIND FILE chooses the courtyard wind: PREPARED LOOP or RAW CUT.',
  ],
  changes: [
    'With the scene running, a crossing prints one ZONE line: the wind fades down while the room tone fades up, over 1.5 seconds.',
    'RAW CUT prints a MIX line. The courtyard bed starts again with that file, and its level jumps at the join every 10 seconds. The strip under the picture counts JUMPS.',
    'If a bed starts again as you step inside one zone, BEDS, PLAYING and VOICES climb, and a FAULT line counts copies.',
  ],
  teaches: [
    'A loop repeats, so its join has to be prepared. A fade does not repair a join that was cut badly.',
    'A bed has no position. A local emitter, such as the fountain, has one. Spot sounds, such as the birds, keep a bed from sounding the same on every pass.',
    'A bed starts once. Here both beds start with the scene and crossfade at the doorway.',
  ],
  tryThis: [
    'Cross the doorway four times. Count the ZONE lines in the log: one for each crossing, and no FAULT line, because no bed started again.',
    'Choose RAW CUT in the courtyard and watch JUMPS under the picture. Then walk into the workshop: the wind bar falls to zero, so its jump is not heard.',
  ],
};
