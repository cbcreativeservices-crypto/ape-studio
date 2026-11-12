/**
 * Screen guide — page 4, "Kinds of games". Pure data (the guide test loads
 * it under node). Voice: to the student, about THIS screen.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G04: ScreenGuide = {
  intro: {
    learning: 'Genre, perspective and play mode are separate choices, and the listener does not have to be where the visible character is.',
    start: 'Open LISTENER and switch GENERATOR 1 on. Move FACING to 0°, read GEN PAN, then choose OVERHEAD CAMERA and read it again. Open GAMES to compare kinds of game.',
  },
  seeing: [
    'You’re looking down on the scene, the way a strategy game shows its map. The amber wedge on YOU marks the listener. In the overhead view a camera in the middle takes its place.',
    'LISTENER names whose ears are in use. GEN PAN shows how far left or right the generator sits for that listener.',
    'The card in step 2 is the kind of game you picked.',
  ],
  control: [
    'FACING turns YOU through a full circle, in steps of 5°. At 0° you face up the picture.',
    'LISTENER opens a tray: YOUR EARS or OVERHEAD CAMERA, and GENERATOR 1 to give yourself a sound to listen to. The chosen ears show a ✓.',
    'GAMES opens twelve kinds of game. Pick one: its description appears at the top of the tray, above the chips.',
  ],
  changes: [
    'With your ears, GEN PAN follows FACING: as you turn, the generator moves from one side to the other.',
    'From the camera the generator sits nearer the center, because the camera is high above the scene. FACING no longer changes GEN PAN.',
    'Level follows the listener too. For the camera, each sound is as loud as its distance from the middle of the scene makes it.',
  ],
  teaches: [
    'Direction and distance are measured from the listener, not from the character on screen.',
    'A team chooses where the listener goes. In an overhead game it is often with the camera.',
    'Kinds of game differ in which sounds matter most. All kinds are built from the same parts.',
    'With several players, the team also decides who hears each sound.',
  ],
  tryThis: [
    'As YOUR EARS, move FACING to 0° and read GEN PAN: far to the right. Choose OVERHEAD CAMERA and it moves toward the center.',
    'With OVERHEAD CAMERA chosen, move FACING from end to end. YOU turn in the picture and GEN PAN does not move.',
    'Open STRATEGY and RACING in GAMES. One listens from the camera; the other follows one engine sound for the whole race.',
  ],
};
