/**
 * Screen guide — page 20, "Finding your way in the tools". Pure data (the
 * guide test loads it under node). Voice: to the student, about THIS screen.
 * The display is the tool-window screen (scene/hud/cToolsStage); the dock
 * is WINDOW, TOOL, SCENE, SPEED, SOUND and ■ STOP.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G20: ScreenGuide = {
  intro: {
    learning: 'The kinds of window most game audio tools have, and the closest name four tools give to each idea of this lab.',
    start: 'Slide WINDOW to light each window in turn. Choose a TOOL to see its names. Then read the name cards. The six checks at the end complete this page.',
  },
  seeing: [
    'The display is one simplified tool screen, not a real product. Its eight numbered windows are the kinds most game audio tools have.',
    'The windows are alive: they show what the scene is playing, the music’s bars, the bus meters and the newest log line.',
    'In the well, each number has a line, and twelve cards give each idea’s closest name in four tools.',
  ],
  control: [
    'WINDOW is the slider. At its left end all eight windows are even; each step lights the next window and gives it the room.',
    'TOOL opens ANY TOOL, WWISE, FMOD STUDIO, UNITY and UNREAL ENGINE. The windows then print that tool’s names.',
    'SCENE opens the door, GENERATOR 1, STEP, MUSIC and the GUIDE LINE. SPEED changes the generator’s speed.',
    'At the end, tap an answer in each of the six CHECK YOURSELF cards. A wrong answer explains itself, and you can answer again.',
  ],
  changes: [
    'A lit window prints each idea’s name, then the chosen tool’s own name for it.',
    'A dashed ring means that tool has no single name for the idea. On the cards, the words beside the dash say what to look for instead.',
    'Start a sound in SCENE and the windows follow it: the event list marks it, the mixer’s meters move, the profiler prints the line.',
  ],
  teaches: [
    'Tools differ in names and layout, but the same eight kinds of window return in each of them.',
    'A name on a card is the closest idea in that tool, not an exact equal. The tools organize these ideas differently.',
    'Some names belong to one tool only. Game Syncs and RTPC are Wwise’s words.',
    'Middleware is optional. A game engine has audio of its own.',
  ],
  tryThis: [
    'Light window 3, GAME INFO. Choose WWISE, then FMOD STUDIO. Read how the name of the surface choice changes.',
    'Light window 6, the mixer. In SCENE, switch GENERATOR 1 on and move SPEED. Watch which meter moves.',
    'Choose UNITY and light each window. Where a ring is dashed, read that card’s line to see what to look for instead.',
  ],
};
