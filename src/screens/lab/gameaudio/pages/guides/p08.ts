/**
 * Screen guide — page 8, "Triggers, states, switches". Pure data (the guide
 * test loads it under node). Voice: to the student, about THIS screen.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G08: ScreenGuide = {
  intro: {
    learning: 'The four kinds of information a game sends to its sound: triggers, switches, parameters and states. Some belong to one object, and some to the whole game.',
    start: 'Open STEP and press STEP: YOU, then STEP: GUIDE. Choose GRAVEL, then press STEP: YOU and STEP: GUIDE again. Watch YOU ON change while GUIDE ON stays the same.',
  },
  seeing: [
    'You and the guide each stand on a surface: the stone path, the gravel, or the wood floor of the workshop.',
    'YOU ON and GUIDE ON show each character’s surface switch.',
    'The table in the lesson has one row for each object: its own local value, and the one global state, repeated on every row.',
  ],
  control: [
    'STEP opens a tray. STEP: YOU and STEP: GUIDE each send one foot contact for that character. OPEN DOOR is beside them.',
    'In the tray, STONE PATH, GRAVEL and WORKSHOP move you to that surface. You can enter the workshop only when the door is open.',
    'THE SURFACE SWITCH IS SET chooses FOR EACH CHARACTER or FOR EVERYONE. A ✓ marks the choice in use.',
    'Tap SPEED to switch GENERATOR 1 on or off, then move the slider from 0 to 100%.',
    'STATE sets the mood of the whole game: CALM or ALERT.',
  ],
  changes: [
    'Each step prints two GAME lines: the trigger, with the character and its switch value, and then the event. A START line follows.',
    'Moving yourself changes YOU ON only. The guide’s switch stays, because a switch is held by each object.',
    'A new state prints one STATE line, and the table shows it on every row.',
    'With FOR EVERYONE chosen, the guide’s steps use the surface under you.',
  ],
  teaches: [
    'A trigger is one thing that happens. A switch is a choice held by each object. A parameter is a changing number. A state is a mode for the whole game.',
    'Scope is the question to ask of any game value: does it belong to one object, or to everything?',
    'Real tools use their own names for these four ideas.',
  ],
  tryThis: [
    'Stand in the WORKSHOP and step as both characters. Both switches read wood, yet they are two switches: move to GRAVEL and only yours changes.',
    'Choose FOR EVERYONE, stand on GRAVEL and press STEP: GUIDE. Read the switch value in the log, then choose FOR EACH CHARACTER again.',
  ],
};
