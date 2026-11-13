/**
 * Screen guide — page 4, "Kinds of games". Pure data (the guide test loads
 * it under node). Voice: to the student, about THIS screen.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G04: ScreenGuide = {
  intro: {
    learning: 'Genre, perspective and play mode are separate choices, and the listener does not have to be where the visible character is.',
    start: 'Open GAMES and pick a kind of game: the scene shows one thing it cares about. Then open LISTENER, switch GENERATOR 1 on, move FACING to 0° and compare GEN PAN for YOUR EARS and OVERHEAD CAMERA.',
  },
  seeing: [
    'You are looking down on the scene, the way a strategy game shows its map. The amber wedge on YOU marks the listener. With the overhead camera, the mark CAMERA · LISTENER in the middle takes its place.',
    'LISTENER names whose ears are in use. GEN PAN shows how far left or right the generator sits for that listener.',
    'The card in step 2 is the kind of game you picked, with the sounds it often puts first.',
  ],
  control: [
    'FACING turns YOU through a full circle, in steps of 5°. At 0° you face the top of the picture.',
    'LISTENER opens a tray: YOUR EARS or OVERHEAD CAMERA, and GENERATOR 1 to give yourself a sound to listen to. The chosen ears show a ✓.',
    'GAMES opens twelve kinds of game. A pick starts the scene again and shows one thing that kind cares about. The line at the top of the tray says what you are seeing.',
  ],
  changes: [
    'With your ears, GEN PAN follows FACING: as you turn, the generator moves from one side to the other.',
    'From the camera the generator sits nearer the center, because the camera is high above the scene. FACING no longer changes GEN PAN.',
    'Level follows the listener too. For the camera, each sound is as loud as its distance from the middle makes it. YOUR ring turns gray and dashed: you are not listening.',
  ],
  teaches: [
    'Direction and distance are measured from the listener, not from the character on screen.',
    'A team chooses where the listener goes. In an overhead game it is often with the camera.',
    'Kinds of game differ in which sounds matter most. All kinds are built from the same parts.',
  ],
  tryThis: [
    'As YOUR EARS, move FACING to 0° and read GEN PAN: far to the right. Choose OVERHEAD CAMERA and it moves toward the center.',
    'With OVERHEAD CAMERA chosen, move FACING from end to end. YOU turn in the picture and GEN PAN does not move.',
    'In GAMES pick STRATEGY: the camera becomes the listener. Then pick RACING: the generator keeps playing while its SPEED rises, as an engine would.',
  ],
};
