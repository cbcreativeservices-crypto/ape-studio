/**
 * Screen guide — page 16, "The game mix". Pure data (the guide test loads it under
 * node). Voice: to the student, about THIS screen. The duck's amounts quoted
 * here are pinned to the model's table by test/gameAudioChD.test.ts.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G16: ScreenGuide = {
  intro: {
    learning: 'How a game mix is organized: sounds feed buses, each bus has its own level, and other buses turn down while a line is spoken.',
    start: 'Open SCENE and switch on SCENE, GENERATOR 1 and MUSIC. Press GUIDE LINE and read the activity log: DUCK on when the line starts, DUCK off when it ends.',
  },
  seeing: [
    'You’re looking down on the courtyard and the workshop. Rings mark each source that is sounding.',
    'DUCK shows READY, DUCKING or OFF. The readout beside it is the bus you chose: its level right now, or MUTED, or SILENT when another bus is soloed.',
    'A source on a silenced bus keeps one still, dashed ring. With ALARM and VISUAL CUE on, a warning sign with the word OVERHEAT stands by the generator.',
  ],
  control: [
    'BUS is one key with two jobs. Tap it to choose a bus, then move the slider to set that bus between −24 and +6 dB.',
    'SCENE opens the sound sources: SCENE, GENERATOR 1 and MUSIC, and the ALARM with its VISUAL CUE.',
    'GUIDE LINE, in the same tray, is on the dialogue bus and starts the duck. CHAT LINE is on the chat bus and does not.',
    'MIX opens DUCK ON and DUCK OFF, and a MUTE chip and a SOLO chip for each of the six buses.',
  ],
  changes: [
    'A line on the dialogue bus starts the duck: music drops 10 dB, ambience 8 dB and effects 5 dB, and the log prints DUCK on. They return when the last line ends.',
    'Choosing DUCK OFF prints a SETTING line. After that a line dips nothing, and no DUCK on is printed.',
    'A bus fader, MUTE or SOLO changes only that one group. Each change prints a MIX line.',
  ],
  teaches: [
    'A bus groups sounds of one kind: one control changes them all.',
    'Audio flows from a sound to its bus, the master and the output. Control tells that path what to do: a duck carries no audio.',
    'Raising the master keeps the balance and uses up headroom.',
    'This duck is event-driven: it follows a line’s start and end, not the audio’s loudness.',
    'An important sound can also be shown, so it does not depend on hearing.',
  ],
  tryThis: [
    'Start SCENE, GENERATOR 1 and MUSIC, then press GUIDE LINE. Watch DUCK change to DUCKING and back to READY, and find the two DUCK lines in the log.',
    'Tap BUS and choose MUSIC. Pull its fader down to −12 dB. Then solo AMBIENCE in MIX: the music readout changes from a level to SILENT.',
    'Switch ALARM on with VISUAL CUE off, then switch the cue on. Look at the generator in the picture each time.',
  ],
};
