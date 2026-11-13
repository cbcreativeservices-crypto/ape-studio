/**
 * Screen guide — page 22, "Capstone and free play". Pure data (the guide
 * test loads it under node). Voice: to the student, about THIS screen. Every
 * key it names is a label in p22Capstone.tsx or on the shared rack.
 *
 * The page is a brief (audit 2, L-04): the guide says what to build and
 * where help is, and names keys only to say what each tray holds.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G22: ScreenGuide = {
  intro: {
    learning: 'How this lab’s ideas work together in one scene: events, layers, zones, a mix that protects speech, music on the bar, and a visual cue.',
    start: 'Read the seven goals in step 4 and plan which sound each one needs. Then build the scene in any order. SHOW A HINT gives the keys for one goal when you ask.',
  },
  seeing: [
    'You are looking down on the courtyard and the workshop, with every sound of the lab ready and none running.',
    'SURFACE names what is under your feet. MUSIC shows OFF, CALM or ALERT. The strip under the picture shows the bus meters, or the music’s bars while you use the MUSIC tray.',
    'In the well are seven goals, a hint button, and a summary card that lists your choices and what you have connected.',
  ],
  control: [
    'MOVE opens STEP FORWARD and three places to go. Its slider turns you through a full circle, once you close the tray.',
    'SOUNDS opens the door, SCENE, GENERATOR 1, the GUIDE LINE, the ALARM and its VISUAL CUE, and CLEAN SCENE. Its slider is the generator’s speed, from 0 to 100%, once you close the tray.',
    'While the MOVE or SOUNDS tray is open, the slider still controls what it did before. The tray’s title says so.',
    'MUSIC opens the music switch, two layers, STINGER and the mood.',
    'REPORT opens SHARE SUMMARY, then PLATFORM and LISTENING. These choices do not change the sound.',
  ],
  changes: [
    'A goal is marked done when the scene has done the thing, not when you press a key. With the sound off the scene still runs and the goals still count.',
    'The log shows each request and its answer. A step prints its surface and its take. The door prints its two layers.',
    'A music change waits for the next bar. A guide line ducks the other buses while it speaks.',
  ],
  teaches: [
    'One scene uses every idea together: events start sounds, switches and parameters steer them, buses group them, and a state changes many of them together.',
    'A request and its result are two different things. The log is where the result is read.',
    'An important sound can have a second way to reach the player, such as a sign in the picture.',
  ],
  tryThis: [
    'With SCENE on and the door open, walk through the doorway. Find the STATE line that begins ZONE, then walk back out and find the second one.',
    'Switch the music on and choose ALERT. The line under the chips says PENDING and when the change lands. Then it says nothing is waiting.',
    'When all seven goals are done, change one thing at a time. Close the door while the generator runs, then read what the log says.',
  ],
};
