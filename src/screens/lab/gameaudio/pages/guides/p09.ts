/**
 * Screen guide — page 9, "Variation and layers". Pure data (the guide test
 * loads it under node). Voice: to the student, about THIS screen.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G09: ScreenGuide = {
  intro: {
    learning: 'Why a sound that repeats needs several takes. How a choice with no immediate repeat hides the repetition. How one event can play more than one layer.',
    start: 'Open SETUP and choose VARIATION OFF. Close the tray and press STEP four times. Then choose VARIATION ON, step again, and compare the numbers in the strip of takes.',
  },
  seeing: [
    'You stand on one surface, and each STEP is one foot contact there. Rings show the footstep at your feet.',
    'VARIATION shows ON or OFF. LAST TAKE shows the number of the take that played last.',
    'The strip in the lesson shows the takes in order, oldest on the left. A tile marked SAME repeats the take before it.',
  ],
  control: [
    'STEP sends one foot contact for you, in place, so the surface stays the same.',
    'SETUP opens a tray. VARIATION ON uses every take. VARIATION OFF plays the first take only.',
    'AVOID REPEAT ON stops the same take from playing twice in a row. AVOID REPEAT OFF allows it.',
    'RATTLE ON and RATTLE OFF add or remove the door’s second layer. OPEN DOOR, in the same row, posts the door event.',
    'LEVEL sets how loud the lab plays these steps. In the tray, a ✓ marks each setting in use.',
  ],
  changes: [
    'With variation off, every START line reads take 1 of 4 and the strip shows one number.',
    'With it on, the take changes from step to step, and each step also gets a slightly different level and pitch.',
    'With the rattle layer on, one door event prints two START lines: the door, then the latch one second later.',
    'Each change in SETUP prints a MIX line that names the setting and its new value.',
  ],
  teaches: [
    'The ear notices an exact repeat immediately. Several takes, chosen with no immediate repeat, remove that effect.',
    'A random container picks a take at random. A sequence container plays the takes in a set order.',
    'In many engines a pitch change is a change of playback speed, so the length changes with it.',
    'Layers belong to one event. A second layer is not a second trigger from the game.',
  ],
  tryThis: [
    'Choose VARIATION ON and AVOID REPEAT OFF. Press STEP until a tile in the strip is marked SAME: the same take played twice in a row.',
    'Open the door with RATTLE ON, then with RATTLE OFF. Count the START lines above each line that reads EVENT Play_Door.',
  ],
};
