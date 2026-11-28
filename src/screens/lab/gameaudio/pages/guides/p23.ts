/**
 * Screen guide — "Whose ears: the listener" (the learner's page 5; the file's
 * number is its name, see pages/index.ts). Pure data (the guide test loads it
 * under node). Voice: to the student, about THIS screen.
 *
 * Its lines are the listener lines of the old "Kinds of games" guide, moved
 * here with the lesson on 2026-11-14 (owner's decision 5).
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G23: ScreenGuide = {
  intro: {
    learning: 'The listener, the game’s ears, does not have to be where the visible character is. Direction and level are measured from the listener.',
    start: 'Open LISTENER and switch GENERATOR 1 on. Move FACING to 0° and read GEN PAN. Then choose OVERHEAD CAMERA and read it again.',
  },
  seeing: [
    'The amber wedge on YOU marks the listener. With the overhead camera, the mark CAMERA · LISTENER in the middle takes its place.',
    'LISTENER names whose ears are in use. GEN PAN shows how far left or right the generator sits for that listener; — means it is not played.',
  ],
  control: [
    'FACING turns YOU through a full circle, in steps of 5°. At 0° you face the top of the picture.',
    'LISTENER opens a tray: YOUR EARS or OVERHEAD CAMERA, and GENERATOR 1 to give yourself a sound to listen to. The chosen ears show a ✓.',
  ],
  changes: [
    'With your ears, GEN PAN follows FACING: as you turn, the generator moves from one side to the other.',
    'From the camera, left and right follow the picture, so FACING no longer changes GEN PAN. At 0° the generator sits nearer the center.',
    'Level follows the listener too. For the camera, each sound is as loud as its distance from the middle makes it. YOUR ring turns gray and dashed: you are not listening.',
  ],
  teaches: [
    'Direction and distance are measured from the listener, not from the character on screen.',
    'A team chooses where the listener goes. In an overhead game it is often with the camera.',
  ],
  tryThis: [
    'As YOUR EARS, move FACING to 0° and read GEN PAN: far to the right. Choose OVERHEAD CAMERA and it moves toward the center.',
    'With OVERHEAD CAMERA chosen, move FACING from end to end. YOU turn in the picture and GEN PAN does not move.',
  ],
};
