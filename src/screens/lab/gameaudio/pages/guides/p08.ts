/**
 * Screen guide — page 8, "Triggers, states, switches". Pure data (the guide
 * test loads it under node). Voice: to the student, about THIS screen.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G08: ScreenGuide = {
  intro: {
    learning: 'The four kinds of information a game sends to its sound: triggers, switches, parameters and states. Some belong to one object, and some to the whole game.',
    start: 'Open STEP and press STEP: YOU, then STEP: GUIDE. Choose GRAVEL, then press both again. Watch YOUR FLOOR change while GUIDE FLOOR stays the same.',
  },
  seeing: [
    'YOUR FLOOR and GUIDE FLOOR show each character’s surface switch: the stone path, the gravel, or the wood floor.',
    'The strip under the picture shows the four kinds as they are sent. MOOD is printed on the picture, which gets a border while it is ALERT.',
    'The table in the lesson has one row for each object: its own local value, and the one global state, MOOD, repeated on every row.',
  ],
  control: [
    'STEP opens a tray. STEP: YOU and STEP: GUIDE each send one foot contact for that character. OPEN DOOR is beside them.',
    'In the tray, STONE PATH, GRAVEL and WORKSHOP move you to that surface. You can enter the workshop only when the door is open.',
    'Tap SPEED to switch GENERATOR 1 on or off, then move the slider from 0 to 100%.',
    'MOOD sets the state of the whole game: CALM or ALERT.',
    'SCOPE sets the surface switch FOR EACH CHARACTER (LOCAL) or FOR EVERYONE (GLOBAL).',
  ],
  changes: [
    'Each step prints two GAME lines: the trigger, with the character and its switch value, and then the event. This log leaves out START lines.',
    'Moving yourself changes YOUR FLOOR only. The guide’s switch stays, because a switch is held by each object.',
    'A new MOOD prints one STATE line, and the table shows it on every row.',
  ],
  teaches: [
    'A trigger is one thing that happens. A switch is a choice held by each object. A parameter is a changing number. A state is a mode for the whole game.',
    'Scope is the question to ask of any game value: does it belong to one object, or to everything?',
    'Game Syncs, RTPC and Switch Group are Wwise’s names. Other tools use their own names for the same ideas.',
  ],
  tryThis: [
    'Stand in the WORKSHOP and step as both characters. Both switches read wood, yet they are two switches: move to GRAVEL and only yours changes.',
    'Set SPEED with GENERATOR 1 off, then switch it on. The table’s speed did not change: the value is kept on the generator.',
  ],
};
