/**
 * Screen guide — page 1, "Welcome and safe listening". Pure data (the guide
 * test loads it under node). Voice: to the student, about THIS screen.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G01: ScreenGuide = {
  intro: {
    learning: 'How a game asks for sound, and how the audio side answers. How each page is laid out. The safe way to start any sound: low first, then up slowly.',
    start: 'Move LEVEL down to 40% or lower, turn SOUND on, then switch SCENE on. Raise LEVEL slowly until the scene is comfortable, and find ■ STOP at the end of the dock.',
  },
  seeing: [
    'You are looking down on a courtyard and a workshop. The figure marked YOU is the player, and the amber wedge marks the listener.',
    'LEVEL and SCENE show your two controls. PLAYING and VOICES count what is sounding now, and SOUND says whether you can hear it.',
    'The strip under the picture has a bar for each background sound. LEVEL moves every bar.',
    'The activity log lists each request and each answer, newest first.',
  ],
  control: [
    'LEVEL sets how loud the lab plays, from 0 to 100%. It is the lab’s own level; your device’s volume control is separate.',
    'SCENE starts or stops the background: the courtyard wind, the workshop’s room tone and the fountain. While it runs, a bird calls now and then.',
    'SOUND turns the lab’s sound on or off. ■ STOP stops everything that is playing.',
  ],
  changes: [
    'Switching SCENE on adds three GAME lines and three START lines to the log. PLAYING shows 3, and 4 for a moment when a bird calls.',
    'The room tone runs at zero level while the listener is outside. This scene still counts it. A real engine usually does not.',
    'Switching SOUND off stops everything, like ■ STOP. A scene started with SOUND off still runs, and each START line says so.',
  ],
  teaches: [
    'Game audio is every sound a game makes, and it is interactive: it reacts to what the player does.',
    'A game measures each sound against a listener, a pair of virtual ears placed in the scene.',
    'A sound you have not heard yet can be louder than you expect. So the level goes down before the sound starts and comes up slowly after.',
  ],
  tryThis: [
    'Set LEVEL to 20%, switch SCENE on, then raise LEVEL a little at a time. Stop at the first level where the fountain is clear.',
    'Switch SCENE on with SOUND off and read the log. Every START line is marked “not heard: sound is off”.',
    'Press ■ STOP while the scene runs. PLAYING drops to 0 immediately and the log prints STOP ALL.',
  ],
};
