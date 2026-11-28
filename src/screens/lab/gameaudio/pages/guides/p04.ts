/**
 * Screen guide — "Kinds of games" (the learner's page 4). Pure data (the guide
 * test loads it under node). Voice: to the student, about THIS screen.
 *
 * Since 2026-11-14 this page holds ONE lesson (owner's decision 5). The lines
 * about the listener went with that lesson to guides/p23.ts.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G04: ScreenGuide = {
  intro: {
    learning: 'Genre, perspective and play mode are three separate choices, and each kind of game puts different sounds first.',
    start: 'Open GAMES and pick a kind of game. The scene starts again and shows one thing that kind cares about. Read its card in step 2, then pick two more.',
  },
  seeing: [
    'You look down on the scene, as on a strategy game’s map.',
    'Step 2’s card is the kind of game you picked, with the sounds it often puts first.',
    'LISTENER names whose ears are in use. One kind of game hands them to a camera; the next page is about that.',
  ],
  control: [
    'GAMES opens twelve kinds of game. A pick starts the scene again and shows one thing that kind cares about. The line at the top of the tray says what you are seeing.',
    'LEVEL is the lab’s playback level, on the slider. It is the first key on this page.',
  ],
  changes: [
    'Each pick empties the scene and runs one short demonstration: a door, a footstep, a burst of impacts, a warning with a sign.',
    'The GAMES key counts the kinds you have seen on this visit.',
  ],
  teaches: [
    'What the player does, where the camera is, and who plays are separate choices. A puzzle can be played in first person, and a racing game can be seen from above.',
    'Kinds of game differ in which sounds matter most. All kinds are built from the same parts.',
  ],
  tryThis: [
    'In GAMES pick STRATEGY: the camera becomes the listener. Then pick RACING: the generator starts at high speed, and its rings crowd close.',
    'Pick HORROR and read its card. Which sounds does that kind of game often put first?',
  ],
};
