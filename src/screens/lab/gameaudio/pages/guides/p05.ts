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
    'Rings around each source show its sound where you stand: bluer when faint, toward red when loud.',
    'SOLO names the category that is playing alone, and ALARM says whether the overheat alarm is running. The strip under the picture lights each kind of sound while it plays.',
    'When the guide speaks, the words appear at the top of the PLAY tray and in a caption above the activity log.',
  ],
  control: [
    'LEVEL sets how loud the whole lab plays, whichever family is sounding. The slider controls it when the page opens.',
    'PLAY opens a tray. Its top shows the newest log lines. SCENE and ALARM keep running until you switch them off. STEP (a step in place), OPEN DOOR (then CLOSE DOOR), CRATE, GUIDE LINE and INTERFACE play once per press.',
    'SOLO plays one category alone: AMBIENCE, EFFECTS, DIALOGUE or INTERFACE. Its key reads ON while one is soloed. OFF brings every category back.',
  ],
  changes: [
    'STEP and the door each add two GAME lines: what happened, then the event. START lines follow. The door and CRATE start two parts each: the main sound, then a secondary detail.',
    'A solo silences every other category. Their sounds still run and are still counted in PLAYING.',
    'The alarm is far from you, so it is quieter than the fountain where you stand. With the door closed the wall also makes it duller.',
  ],
  teaches: [
    'Sounds are grouped by job: background beds, local sources, movement, actions, impacts, dialogue, interface, music and voice chat.',
    'One designed sound can be several files and several voices.',
    'Importance comes from what a sound tells the player. A quiet sound from the world can matter more than a loud one.',
  ],
  tryThis: [
    'Switch ALARM on, then solo AMBIENCE. The wind and the fountain stay and the alarm is gone: it belongs to the EFFECTS category.',
    'Press OPEN DOOR and count the START lines in the log. The second one, the rattle, is marked “1 s later”.',
    'Switch SCENE on and press GUIDE LINE. While the guide speaks, the fountain’s rings turn bluer: the mix turns the ambience down for the words.',
  ],
};
