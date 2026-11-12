/**
 * Screen guide — page 5, "Kinds of game sound". Pure data (the guide test
 * loads it under node). Voice: to the student, about THIS screen.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G05: ScreenGuide = {
  intro: {
    learning: 'The families of game sound and what each is for, and why a sound’s importance comes from its message, not from its loudness or its family.',
    start: 'Open PLAY, switch SCENE on and try each sound. Then switch ALARM on, open SOLO and pick AMBIENCE, then EFFECTS, to find which category holds the alarm.',
  },
  seeing: [
    'Rings around the fountain, the door, the crate and the generator show each sound where you stand: bluer when faint, toward red when loud.',
    'SOLO names the category that is playing alone, and ALARM says whether the overheat alarm is running.',
    'When the guide speaks, the words appear in a caption above the activity log.',
  ],
  control: [
    'LEVEL sets how loud the whole lab plays, whichever family is sounding. It is the slider you get when this page opens.',
    'PLAY opens a tray. SCENE and ALARM keep running until you switch them off. STEP, OPEN DOOR (then CLOSE DOOR), CRATE, GUIDE LINE and INTERFACE each play once per press.',
    'SOLO plays one category alone: AMBIENCE, EFFECTS, DIALOGUE or INTERFACE. OFF brings every category back. A category is also called a bus.',
  ],
  changes: [
    'STEP and the door each add two GAME lines, the trigger and then the event, and START lines after them. The door and CRATE start two parts each: the main sound, then a secondary detail.',
    'A solo silences every other category. Their sounds still run and are still counted in PLAYING.',
    'The alarm is far from you and, with the door closed, behind a wall. So it is quiet where you stand.',
  ],
  teaches: [
    'Sounds are grouped by job: background beds, local sources, movement, actions, impacts, dialogue, interface, music and voice chat.',
    'One designed sound can be several files and several voices.',
    'Importance comes from what a sound tells the player. A quiet sound from the world can matter more than a loud one.',
  ],
  tryThis: [
    'Switch ALARM on, then solo AMBIENCE. The wind and the fountain stay and the alarm is gone: it belongs to the EFFECTS category.',
    'Press OPEN DOOR and count the START lines in the log. The second one, the rattle, is marked “1 s later”.',
    'Switch SCENE on, press STEP several times and watch the fountain’s rings. Their color changes as your distance from it changes.',
  ],
};
