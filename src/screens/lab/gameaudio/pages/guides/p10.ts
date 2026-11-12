/**
 * Screen guide — page 10, "Loops, ambience and zones". Pure data (the guide
 * test loads it under node). Voice: to the student, about THIS screen.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G10: ScreenGuide = {
  intro: {
    learning: 'How background loops work. A loop needs a prepared join. Each zone has one bed, and each crossing between zones is one cross-fade.',
    start: 'Open SCENE, switch SCENE on and choose OPEN DOOR, then close the tray. Press STEP until you pass through the doorway, and find the ZONE line in the log.',
  },
  seeing: [
    'The courtyard and the workshop are two zones, with one door in the wall between them. Rings mark the fountain while it plays.',
    'The wedge in front of you shows which way you face. STEP moves you that way.',
    'ZONE shows YARD or ROOM. WIND FILE shows LOOP or RAW. PLAYING counts every loop and one-shot that is playing.',
    'The log on this page shows only STATE, MIX and FAULT lines.',
  ],
  control: [
    'FACING turns you, from 0° to 360°; 0° is up the picture. STEP walks one step the way you face.',
    'SCENE opens a tray. Its SCENE chip switches the two beds and the fountain on or off. OPEN DOOR is beside it.',
    'COURTYARD and WORKSHOP take you straight to that zone when the door is open.',
    'PREPARED LOOP and RAW CUT choose the courtyard wind file. ONCE, WITH THE SCENE and ON EVERY UPDATE choose when a bed starts.',
    'In the tray, a ✓ marks each choice in use.',
  ],
  changes: [
    'With the scene running, a crossing prints one ZONE line: the wind fades down while the room tone fades up, or the reverse.',
    'RAW CUT prints a MIX line that names the wind file setting. The courtyard bed stops and starts again with that file, and its level jumps at the join every 10 seconds.',
    'With ON EVERY UPDATE, each step inside a zone starts that zone’s bed again, so PLAYING and VOICES climb.',
  ],
  teaches: [
    'A loop repeats, so its join has to be prepared. A fade does not repair a join that was cut badly.',
    'A bed has no position. A local emitter, such as the fountain, has one, and its level follows distance.',
    'A bed starts once. Here both beds start with the scene and cross-fade at the doorway. Position updates inside a zone start nothing.',
    'A change of zone can keep some sounds, fade others and load new ones.',
  ],
  tryThis: [
    'Cross the doorway four times. Count the ZONE lines in the log: one for each crossing, and no FAULT line, because no bed started again.',
    'Choose RAW CUT in the courtyard and count ten seconds between jumps. Then walk into the workshop: the jump is gone, because that bed is now at zero level.',
  ],
};
