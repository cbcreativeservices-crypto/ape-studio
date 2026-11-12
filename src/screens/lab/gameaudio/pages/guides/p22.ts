/**
 * Screen guide — page 22, "Capstone and free play". Pure data (the guide
 * test loads it under node). Voice: to the student, about THIS screen. Every
 * key it names is a label in p22Capstone.tsx or on the shared rack.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G22: ScreenGuide = {
  intro: {
    learning: 'How this lab’s ideas work together in one scene: events, layers, zones, a mix that protects speech, music on the bar, and a visual cue.',
    start: 'Open WORLD, switch SCENE on and press OPEN DOOR. Then open MOVE and press STEP FORWARD into the workshop. Each goal is marked done when it really happens in the scene.',
  },
  seeing: [
    'You’re looking down on the courtyard and the workshop, with every sound of the lab ready and none running.',
    'SURFACE names what is under your feet. MUSIC shows OFF, CALM or ALERT.',
    'In the well are seven goals and a summary card that lists your choices and what you have wired.',
  ],
  control: [
    'MOVE opens STEP FORWARD and three places to go. Close the tray and its slider turns you through a full circle.',
    'WORLD opens the door, SCENE, GENERATOR 1, the GUIDE LINE, the ALARM and its VISUAL CUE, and CLEAN SCENE. Close the tray and its slider is the generator’s speed, from 0 to 100%.',
    'MUSIC opens the music switch, STINGER, the mood and two layers.',
    'SETUP opens PLATFORM and LISTENING with one test for each, and SHARE SUMMARY. These choices do not change the sound.',
  ],
  changes: [
    'A goal is marked done when the scene has done the thing, not when you press a key. With the sound off the scene still runs and the goals still count.',
    'The log shows each request and its answer: the surface and take of a step, the two layers of the door, one ZONE line for a crossing.',
    'A music change waits for the next bar. A guide line ducks the other buses while it speaks.',
  ],
  teaches: [
    'One scene uses every idea together: events start sounds, switches and parameters steer them, buses group them, and a state changes many of them together.',
    'A request and its result are two different things. The log is where the result is read.',
    'An important sound can have a second way to reach the player, such as a sign in the picture.',
  ],
  tryThis: [
    'With SCENE on and the door open, press STEP FORWARD until you cross the doorway. Find the one ZONE line in the log, then walk back out and find the second.',
    'Switch the music on and choose ALERT. The line under the chips says a change is waiting for the next bar. When it lands, the line says nothing is waiting.',
    'When all seven goals are done, change one thing at a time, such as closing the door while the generator runs, and read what the log says.',
  ],
};
