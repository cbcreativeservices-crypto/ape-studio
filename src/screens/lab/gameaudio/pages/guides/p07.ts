/**
 * Screen guide — page 7, "Events and instances". Pure data (the guide test
 * loads it under node). Voice: to the student, about THIS screen.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G07: ScreenGuide = {
  intro: {
    learning: 'How one event serves many objects. Each start makes its own playing instance with its own values, and a loop plays until something stops it.',
    start: 'Open MACHINES, choose ADD GENERATOR 2 and switch both generators on. Move SPEED 2 only, then compare GEN 1 and GEN 2 in the readouts.',
  },
  seeing: [
    'The workshop holds one generator, and a second one after you add it. Rings around a generator mean its instance is playing.',
    'GEN 1 and GEN 2 show each generator: NONE, OFF, or ON with its own speed.',
    'PLAYING counts instances. VOICES counts the sound files those instances are playing at this moment: each running generator uses two, a hum and a fan.',
  ],
  control: [
    'SPEED 1 and SPEED 2 each set one generator’s speed, from 0 to 100%. SPEED 2 is locked until a second generator is in the scene.',
    'MACHINES opens a tray. GENERATOR 1 and GENERATOR 2 each switch one generator on or off; the chip shows ON or OFF.',
    'ADD GENERATOR 2 places the second generator. REMOVE GENERATOR 2 takes it out of the scene.',
    'Under WHEN A GENERATOR IS REMOVED, choose STOP ITS LOOP or LEAVE IT PLAYING. A ✓ marks the rule in use.',
  ],
  changes: [
    'Each start prints the same event name in the log again and adds 1 to PLAYING.',
    'Moving one SPEED prints a VALUE line for that generator only. The number on the other SPEED key does not move.',
    'Switching a generator off fades its instance and releases its voices. With STOP ITS LOOP, a removal does the same. With LEAVE IT PLAYING, the loop plays on.',
  ],
  teaches: [
    'An event is a definition. A playing instance is one use of it, owned by one object.',
    'Values such as speed are stored on the instance, so two objects that share an event can differ.',
    'A one-shot ends by itself. A loop needs a stop, and removing an object includes stopping its sounds.',
    'One instance can use more than one voice.',
  ],
  tryThis: [
    'Switch both generators on. Set SPEED 1 low and SPEED 2 high, then switch GENERATOR 2 off: the low hum goes on, and PLAYING drops by 1.',
    'Choose LEAVE IT PLAYING, switch generator 2 on and remove it. Read the FAULT line, then press ■ STOP and choose STOP ITS LOOP again.',
  ],
};
