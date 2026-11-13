/**
 * Screen guide — page 16, "The game mix". Pure data (the guide test loads it under
 * node). Voice: to the student, about THIS screen. The duck's amounts quoted
 * here are pinned to the model's table by test/gameAudioChD.test.ts.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G16: ScreenGuide = {
  intro: {
    learning: 'How a game mix is organized: sounds feed buses, each bus has its own level, and other buses turn down while a line is spoken.',
    start: 'Open SOUNDS and switch on SCENE, GENERATOR 1 and MUSIC. Press GUIDE LINE and watch DUCK: DUCKING while the line speaks, READY when it ends.',
  },
  seeing: [
    'You are looking down on the courtyard and the workshop. Rings mark each sounding source; on a silenced bus a source keeps one still, dashed ring.',
    'The strip under the picture has a meter per bus. It shows the level, the fader as a white tick, and the duck as an amber band.',
    'DUCK shows READY, DUCKING or OFF. Beside it is the chosen bus: its gain (fader plus duck), MUTED, or SILENT when another bus is soloed.',
  ],
  control: [
    'BUS is one key with two jobs. Tap it to choose a bus, then move the slider to set that bus between −24 and +6 dB.',
    'SOUNDS opens the sound sources: SCENE, GENERATOR 1 and MUSIC, the two lines, and the ALARM with its VISUAL CUE.',
    'GUIDE LINE is on the dialogue bus and starts the duck. CHAT LINE is on the chat bus and does not.',
    'MIX opens DUCK ON and DUCK OFF, and a MUTE chip and a SOLO chip for each of the six buses.',
  ],
  changes: [
    'A line on the dialogue bus starts the duck: music drops 10 dB, ambience 8 dB and effects 5 dB. They return when the last line ends.',
    'With DUCK OFF chosen, a line turns nothing down.',
    'A bus fader, MUTE or SOLO changes only that one group. A quiet bus still plays.',
    'With ALARM and VISUAL CUE on, a warning sign with the word OVERHEAT stands by the generator.',
  ],
  teaches: [
    'A bus groups sounds of one kind: one control changes them all.',
    'Audio flows from a sound to its bus, the master and the output. Control tells that path what to do: a duck carries no audio.',
    'Raising the master keeps the balance and uses up headroom.',
    'This duck is event-driven: it follows a line’s start and end, not the audio’s loudness.',
    'An important sound can also be shown, so it does not depend on hearing.',
  ],
  tryThis: [
    'Switch on SCENE, GENERATOR 1 and MUSIC, then press GUIDE LINE. Watch DUCK change to DUCKING and back to READY, and three meters dip in the strip.',
    'Tap BUS and choose MUSIC. Pull its fader down to −12 dB. Then solo AMBIENCE in MIX: the music readout changes from a level to SILENT.',
    'Switch ALARM on with VISUAL CUE off, then switch the cue on. Look at the generator in the picture each time.',
  ],
};
