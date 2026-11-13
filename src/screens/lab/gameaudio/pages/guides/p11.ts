/**
 * Screen guide — page 11, "Emitters and distance". Pure data (the guide test
 * loads it under node). Voice: to the student, about THIS screen.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G11: ScreenGuide = {
  intro: {
    learning: 'How a game places a sound: an emitter, a listener, and a distance rule with a minimum and a maximum. Left and right pan is not complete 3D.',
    start: 'Open SOURCES, switch GENERATOR 1 and SCENE on and press OPEN DOOR. Move FACING and press STEP, and watch DISTANCE and PAN. Then turn your back to the source and read PAN again.',
  },
  seeing: [
    'You are looking down on the scene. Two dashed rings surround the source you chose: MIN, where it is at full level, and MAX, where it becomes silent.',
    'A dotted line joins that source to you, and the wedge shows which way you face.',
    'DISTANCE and PAN are worked out from the scene’s own positions, for the source you chose.',
  ],
  control: [
    'FACING turns you, in steps of 5°. The slider controls it when the page opens.',
    'STEP walks you 0.7 m the way you face. If a wall, the closed door or the edge of the scene stops you, a NOTE in the log says why.',
    'SOURCES chooses which source the rings and the readouts measure, GENERATOR 1 or FOUNTAIN. It also switches GENERATOR 1 and SCENE on and off, and holds the door key.',
    'On the SOURCES key, NONE, GEN 1, SCENE or BOTH tells you what is switched on. GEN 1 is short for GENERATOR 1.',
  ],
  changes: [
    'Inside MIN the level is full. Beyond it the level drops 6 dB each time the distance doubles. Over the last fifth of the way to MAX it also fades, to silence at MAX.',
    'PAN follows the angle between your facing and the source. Straight ahead and straight behind both pan to the center.',
    'Past MAX a loop becomes virtual: STATUS on the card says so, and the picture keeps one dashed gray ring.',
  ],
  teaches: [
    'A positioned sound needs an emitter, where it comes from, and a listener: where it is heard from, and which way that listener faces.',
    'An attenuation curve is a design choice. A real game draws its own for each sound.',
    'Some sources aim their sound in one direction. That is cone attenuation.',
    'Pan and level cannot tell front from back or above from below.',
  ],
  tryThis: [
    'Choose FOUNTAIN and walk toward it. At half the DISTANCE the level on the card is 6 dB higher. Start closer than 7 m and stop before the MIN ring: the rule holds between the two.',
    'Move FACING until DIRECTION on the card says “straight behind”. PAN comes back close to the center, as it does when the source is ahead of you.',
    'In the courtyard, with GENERATOR 1 on and straight behind you, press STEP until STATUS reads VIRTUAL. Turn around and walk back: the log says it is played again.',
  ],
};
