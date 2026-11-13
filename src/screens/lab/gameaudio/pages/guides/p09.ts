/**
 * Screen guide — page 9, "Variation and layers". Pure data (the guide test
 * loads it under node). Voice: to the student, about THIS screen.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G09: ScreenGuide = {
  intro: {
    learning: 'Why a sound that repeats needs several takes. How a choice with no immediate repeat hides the repetition. How one event can play more than one layer.',
    start: 'Open SETUP and switch VARIATION off. Close the tray and press STEP four times. Then switch VARIATION on, step again, and compare the takes in the strip under the picture.',
  },
  seeing: [
    'You stand on one surface, and each STEP is one foot contact there. Rings show the footstep at your feet.',
    'VARIATION shows ON or OFF. LAST TAKE shows the number of the take that played last.',
    'The strip under the picture shows the last eight takes, newest on the right: taller is louder, higher is a higher pitch. SAME TAKE joins a take that repeats.',
  ],
  control: [
    'STEP sends one foot contact for you, in place, so the surface stays the same.',
    'OPEN DOOR posts the door event. After a press the key reads CLOSE DOOR.',
    'SETUP opens a tray. VARIATION switches between every take and the first take only. AVOID REPEAT stops a take from playing twice in a row.',
    'RATTLE, in the same tray, adds or removes the door’s second layer. Each chip says ON or OFF.',
    'LEVEL sets how loud the lab plays these steps. The slider controls it when the page opens.',
  ],
  changes: [
    'With variation off, every START line reads take 1 of 4, and the strip joins every step as SAME TAKE.',
    'With it on, the take changes from step to step, and each step also gets a slightly different level and pitch.',
    'With the rattle on, one door event prints two START lines: the door, then the latch one second later.',
    'Each change in SETUP prints a MIX line that names the setting and its new value.',
  ],
  teaches: [
    'The ear notices an exact repeat immediately. Several takes, chosen with no immediate repeat, remove that effect.',
    'A random container picks a take at random. A sequence container plays the takes in a set order. These are Wwise’s names.',
    'In many engines a pitch change is a change of playback speed, so the length changes with it.',
    'Layers belong to one event. A second layer is not a second trigger from the game.',
  ],
  tryThis: [
    'Keep VARIATION on and switch AVOID REPEAT off. Press STEP until the strip under the picture shows SAME TAKE: one take played twice in a row.',
    'Open the door with RATTLE on, then close it with RATTLE off. Count the START lines above each line that reads EVENT Play_Door.',
  ],
};
