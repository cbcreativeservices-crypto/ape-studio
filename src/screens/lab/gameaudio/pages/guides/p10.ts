/**
 * Screen guide — "Ambience and zones" (the learner's page 11). Pure data (the
 * guide test loads it under node). Voice: to the student, about THIS screen.
 *
 * Since 2026-11-14 this page holds ONE lesson (owner's decision 5). The lines
 * about the loop's join went with that lesson to guides/p24.ts.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G10: ScreenGuide = {
  intro: {
    learning: 'How background sound is built. A bed has no position, spot sounds break the repetition, and each zone crossing is one crossfade.',
    start: 'Open SOUNDS, switch SCENE on and choose OPEN DOOR, then close the tray. Press STEP until you pass through the doorway, and find the ZONE line in the log.',
  },
  seeing: [
    'Two zones, joined by one door. Streaks over the courtyard and a band in the workshop show each bed while it plays.',
    'The strip under the picture shows each bed’s level and how many copies of it are playing.',
    'ZONE shows COURTYARD or WORKSHOP. BEDS counts the copies of the two beds that are playing: 2 in a clean scene.',
    'The log on this page shows only STATE, MIX, FAULT and NOTE lines.',
  ],
  control: [
    'FACING turns you, from 0° to 360°; 0° is toward the top of the picture. STEP walks one step the way you face.',
    'SOUNDS opens a tray. Its SCENE chip switches the two beds and the fountain on or off. OPEN DOOR is beside it.',
    'In the same tray, ONCE, WITH THE SCENE and ON EVERY UPDATE choose when a bed starts. A ✓ marks the rule in use: IN PROJECT, or IN BUILD once a fault has shown itself.',
  ],
  changes: [
    'With the scene running, a crossing prints one ZONE line: the wind fades down while the room tone fades up, over 1.5 seconds.',
    'If a bed starts again as you step inside one zone, BEDS, PLAYING and VOICES climb, and a FAULT line counts copies.',
  ],
  teaches: [
    'A bed has no position. A local emitter, such as the fountain, has one. Spot sounds, such as the birds, keep a bed from sounding the same on every pass.',
    'A bed starts once. Here both beds start with the scene and crossfade at the doorway.',
  ],
  tryThis: [
    'Cross the doorway four times. Count the ZONE lines in the log: one for each crossing, and no FAULT line, because no bed started again.',
    'Stand in the workshop and read the strip: the wind bar is at zero and the room tone is up. Step back out and watch the two swap.',
  ],
};
