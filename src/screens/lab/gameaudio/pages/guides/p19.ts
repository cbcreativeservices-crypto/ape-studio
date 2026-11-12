/**
 * Screen guide — page 19, "Testing and fault finding". Pure data (the guide test loads it under
 * node). Voice: to the student, about THIS screen.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G19: ScreenGuide = {
  intro: {
    learning: 'How sound is tested inside a game: repeat the situation, read the log, compare it with the picture, then repair and test again.',
    start: 'Open TEST and try each action while nothing is wrong, reading the log each time. Then start fault 1 on its card in step 4 and repeat the action.',
  },
  seeing: [
    'The scene is a test room. FAULTS counts the faults that are in now, and FIXED counts the ones you have repaired on this visit.',
    'Step 4 has one card for each of the five faults. The activity log sits under the first fault that is still in.',
    'A log line marked FAULT is the audio side reporting that it could not do what was asked.',
  ],
  control: [
    'TEST opens the actions that reproduce a symptom: the door, GUIDE LINE, STEP · GUIDE and STEP · YOU, GENERATOR 1, and ADD GENERATOR 2 with its REMOVE GENERATOR 2.',
    'STONE PATH and WORKSHOP, in the same tray, put you in one of two places. With the door closed you stop at the door.',
    'FIX opens the five settings. Each has two values, and a filled dot marks the one that is in now. Tap the other value to change it.',
    'On each card, the start button puts one wrong setting in, and the hint button gives one hint at a time.',
    'LEVEL is the lab’s playback level, on the slider.',
  ],
  changes: [
    'Starting a fault changes one setting and nothing you can see. The symptom appears only when you repeat the right action.',
    'A card turns to FIXED after its symptom has happened and its setting is right again. Fault 5 also needs the stray loop stopped.',
    'After a repair, the same action prints the normal pattern again: GAME lines, then START.',
  ],
  teaches: [
    'A sound that is good by itself can still fail in the game: a missing file, wrong routing, a wrong scope or missing cleanup.',
    'A picture that changed is not proof that a sound played. A START line shows it started; your ears confirm it reached you.',
    'A test is useful when the situation can be repeated exactly, before and after the repair.',
  ],
  tryThis: [
    'Start fault 1 and press the door key in TEST. Find the FAULT line and read the file name it gives. Then compare the two files in FIX.',
    'Start fault 4, choose STONE PATH and press STEP · GUIDE. Read the surface in the first GAME line, then look at the floor under the guide.',
    'After fault 5 shows, read PLAYING. It still counts the generator loop, although the second machine has left the picture.',
  ],
};
