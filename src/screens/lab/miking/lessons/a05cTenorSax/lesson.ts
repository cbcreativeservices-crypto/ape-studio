/**
 * A05c TENOR SAXOPHONE — the lesson as DATA, on the shared saxophone family
 * (lessons/shared/sax/saxLesson.ts). Words: the owner's lesson (docs/labs/
 * miking/source_text/Tenor-Saxophone-Miking-Technique-Research.txt, "L<n>"
 * in COMMENTS only) with the fixes in CORRECTIONS_LOG.md (SX-01 …) applied.
 * Research: docs/labs/miking/tenor_sax/ and the family keys in
 * alto_sax/SOURCES.md.
 *
 * What is the tenor's own: a larger, lower-sitting horn (L7) — distance grows
 * with the horn (Hill, S-SAX); the farther, body-directed start a third of
 * the way up, and the seated right-elbow height, are Sweetwater's own words
 * (2024 archive), not Dave Martin's (SX-03); its lowest note sounds A♭2,
 * about 104 Hz; the bell cuts in near 1.8 kHz (UNSW-SAX).
 */
import type { Lesson } from '../../engine/model/types.ts';
import { buildSaxLesson, saxSetupTasks, saxWedges } from '../shared/sax/saxLesson.ts';
import { MOUTH_HEIGHT } from '../shared/sax/saxPosture.ts';
import { TENOR_SAX } from './geometry.ts';
import { TENOR_ZONES } from './model.ts';

export const A05C_LESSON: Lesson = buildSaxLesson({
  id: 'A05c',
  pfx: 'ts',
  title: 'Tenor Saxophone',
  subtitle: 'Above the bell, a third of the way up from farther off, or a clip',
  F: TENOR_SAX,
  short: 'tenor',
  Short: 'Tenor',
  zones: TENOR_ZONES,
  use: { worked: 'ts.above', live: 'ts.above', twoA: 'ts.above', twoB: 'ts.third', twoBType: 'roomLdc' },
  orient: [
    { title: 'WHAT IT IS', text: 'The tenor saxophone, pitched in B♭, is the alto’s larger, lower cousin: a longer conical tube, a neck with a gentle rise before it turns down, the bow and an upturned bell. Its body sits lower and farther to the player’s right than an alto’s.', src: 'Y-HUB-SAX' },
    { title: 'WHERE YOU MEET IT', text: 'Jazz, rock and roll, soul, funk and pop, big-band sections and solo features — on stage and in the studio. This lesson covers both.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'A big, warm, versatile voice — from breathy ballads to honking solos. Ask what the part needs: a natural, coherent horn, a warm body, or a bright, direct lead.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'About 86 cm tall on its strap. Its lowest note sounds an A♭ near 104 Hz. Seated in a section its bell sits close to the chair; standing, it hangs at the hip.', src: 'DPA-TABLE' },
  ],
  place3: {
    prompt: 'A seated tenor, a mic 30 to 60 cm off: why try it about level with the player’s right elbow?',
    options: ['It looks across the body and bell, not at the breath', 'It keeps the mic below the music on the player’s stand', 'It gives the strongest signal for setting the gain'],
    correct: 'It looks across the body and bell, not at the breath',
    explain: 'Seated, the tenor’s body and bell sit low beside the player; a mic about level with the right elbow, aimed a third of the way up the horn, looks across the holes and the bell rather than at the mouthpiece. A place to begin — then move it and listen.',
    why: {
      'It keeps the mic below the music on the player’s stand': 'Sight lines matter, but the height is chosen for what the mic hears of the horn.',
      'It gives the strongest signal for setting the gain': 'Level comes from the gain. The height is chosen for what the mic hears of the horn.',
    },
  },
  mic4: {
    prompt: 'A wireless clip pack cuts below about 80 Hz. The tenor’s lowest note sounds near 104 Hz. What follows?',
    options: ['The cut sits below its lowest note; still check the low line', 'It will cut the tenor’s lowest notes, so switch it off for good', 'It removes the high harmonics that the bell carries out'],
    correct: 'The cut sits below its lowest note; still check the low line',
    explain: 'The tenor’s lowest fundamental, about 104 Hz, is above an 80 Hz cut — though not by much. Listen to the real low line with the cut in and out; the cut is there for handling noise.',
    why: {
      'It will cut the tenor’s lowest notes, so switch it off for good': 'At about 104 Hz the tenor’s lowest note sits above 80 Hz. Compare by ear rather than removing the cut by habit.',
      'It removes the high harmonics that the bell carries out': 'A low cut removes lows, not highs. The bell’s harmonics are far above 80 Hz.',
    },
  },
  q1: {
    prompt: 'Which way does the tenor’s bell point?',
    options: ['Up and forward, curving back up beside the body', 'Down and forward, straight along the line of the body', 'Back toward the player, under the right arm'],
    correct: 'Up and forward, curving back up beside the body',
    explain: 'Like the alto, the tenor’s tube turns at the bow and the bell rises up and forward beside the body — lower down, because the horn is bigger.',
    why: {
      'Down and forward, straight along the line of the body': 'That is the straight soprano. The tenor’s bell curves back up at the bow.',
      'Back toward the player, under the right arm': 'The bell opens up and forward, away from the player.',
    },
  },
  setup: (R) => saxSetupTasks('ts', 'tenor', R),
  neighbours: [
    { id: 'n1', label: 'an alto beside (the next horn in the section)', short: 'ALTO', note: 'In a section the next horn sits close: a close mic on this tenor hears it too — more so from the side.', prov: { kind: 'illustrative', reason: 'a typical big-band sax row' }, tag: 'SPILL', scene: 'kit' },
    { id: 'n2', label: 'the baritone at the end of the row', short: 'BARITONE', note: 'The big horn beside: loud and low. Every sax mic in a section hears the horns either side of it.', prov: { kind: 'illustrative', reason: 'a typical big-band sax row' }, tag: 'SPILL', scene: 'kit' },
  ],
  stage: 'LIVE: monitors on the floor feed the players, the PA faces the audience, and the band is loud. A closer, aimed mic improves the direct sound against the spill — at the cost of a narrower zone; a clip on the bell moves with a player who sways.',
  studio: 'STUDIO: no wedges, a room that may sound good, and repeated trials when the player stops. The tenor is a big horn: a little distance — a third of the way up, from 30 to 60 cm — lets its holes and bell blend.',
  placementReveal: 'Toward the key stack tends to bring warmth and more key noise; toward the bell, focus and honk; farther, more of the whole horn and the room. Horns and players vary, so “it depends on this horn” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear.',
  typeNotes: {
    instDynCard: 'Ideas to try: begin a few centimetres above the bell, aimed at the holes; then move one thing at a time — toward the bell, toward the holes, a little farther — and play low and high notes each time.',
    saxDynSuper: 'The same places as the cardioid dynamic; its tighter pattern hears less of the stage, and its least-sensitive directions sit toward the rear, off to each side.',
    roomLdc: 'Ideas to try: begin 30–60 cm from the bell, aimed a third of the way up the horn (seated: about level with the right elbow); in a good room try over the player’s shoulder too.',
    saxClip: 'Ideas to try with a clip: keep it on the rim where it is made to go, and change only the capsule’s angle — between the bell and the keys for balance, into the bell for more bite.',
  },
  learnIntro: 'What you just did, in words. After our research, each blue zone is where we recommend you begin with that kind of mic, measured from the part it names — the bell, the tone holes, a third of the way up the horn. They are starting points, not rules; the bigger the horn, the more a little distance helps it blend. Move from there and listen: there is no single right answer.',
  wedges: saxWedges(MOUTH_HEIGHT.standing, 1000, 220),
  accuracyExtra: 'The tenor is drawn about 86 cm tall with a 14 cm bell.',
  contextBoxes: { plan: { u0: -500, u1: 1750, v0: -700, v1: 1100 }, side: { u0: -500, u1: 1750, v0: -350, v1: 1650 } },
});
