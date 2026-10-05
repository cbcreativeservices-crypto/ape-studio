/**
 * C15 SARASWATI VEENA — the pages' words, built by the strings copy
 * (starting-points voice; no sources, brands or badges). The live page's
 * monitor is a SIDE-FILL on a stand: a mic looking down at the veena has its
 * rear toward the ceiling and the side, where a pattern's rejection can
 * reach — a floor wedge in front sits at its side, beyond any null.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { stringsCopy } from '../shared/guitars/stringsCopy.ts';
import { familyWords, type Noun } from '../shared/guitars/stringsContent.ts';
import { C15_BUILT, C15_SHIELD } from './geometry.ts';

export const VEENA_N: Noun = { one: 'veena', the: 'the veena', player: 'veena player' };
const g = C15_BUILT.scene.veena!;

const base = stringsCopy({
  n: VEENA_N,
  subject: { veena: 'a player seated cross-legged with a Saraswati veena' },
  variantKey: 'INSTRUMENT',
  variantShort: { veena: 'Saraswati veena' },
  figureLabel: 'Front view of a player seated cross-legged with a Saraswati veena: the large carved resonator on the floor at the player’s right, the long neck across the lap to the left with brass frets on black wax, four melody strings and three tala strings along the side, the small gourd under the neck on the left thigh, and the carved, gilded yali head at the neck’s end.',
  partsIdle: 'The fingers pluck a melody string; the string vibrates against the broad bridge; the bridge drives the top plate over the big resonator; the plate makes most of the sound — the next page shows how.',
  radiator: 'top plate',
  strikes: [
    { id: 'near', label: 'CLOSE TO THE BRIDGE', mm: 60, blurb: 'About 6 cm from the bridge — the brightest place.' },
    { id: 'usual', label: 'NEAR THE NECK’S START', mm: 150, blurb: 'Where the plate meets the neck — the plucking fingers’ usual place, drawn as a typical one.' },
    { id: 'middle', label: 'THE MIDDLE', mm: g.nut / 2, blurb: 'The exact middle of the open string.' },
  ],
  strikeDefault: 'usual',
  striker: 'FINGER',
  strikerPhrase: 'finger',
  soundReveal: 'The strings move very little air on their own: the broad bridge drives the TOP PLATE over the big resonator, and the plate makes most of the sound.',
  soundAfter: 'Then the strings, the plate and the resonator’s air keep ringing together — the BODY of the note — with the bridge’s buzz on top.',
  shapesNote2: 'This is an ideal string between rigid ends. A real veena string vibrates against its broad, flat bridge, which adds a buzzing brightness the ideal string does not have — set by the player, never by a mic. The gamakas pull the string sideways, changing its pitch as it rings.',
  coupledNote: 'The plate bows in and out round the bridge over the resonator’s air — a simplified picture of the lowest motion. The gourd under the neck is a support, not a second main soundboard.',
  setting: {
    kitA11y: 'The veena player from above, seated cross-legged on a rug: the resonator on the floor at the right, the neck across the lap to the left; a mridangam player beside, a tanpura player behind.',
    kitIdle: 'The space round a seated veena player is theirs: the plucking hand over the plate, the little finger on the tala strings, the left hand travelling a long neck and pulling strings for gamakas, the crossed legs and the gourd on the thigh.',
    leftHanded: 'A left-handed player may hold the veena mirrored: the neck goes the other way, and so does everything that keeps clear of it.',
    stageA11y: 'A concert stage from above: the veena player on a rug, a mridangam beside, a tanpura behind, a side-fill monitor on a stand at the player’s right, the PA at the front corners and the audience edge.',
    studioA11y: 'A studio room from above: the veena player on a rug, no monitors, the walls round them.',
    stageIdle: 'A side-fill on a stand, a percussionist beside, the PA facing out. Use only the monitor level the player needs.',
    studioIdle: 'No monitors. A quiet room lets the veena’s decay and the drone strings be part of the picture.',
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'Which veena — a Saraswati veena, or another form? Ask for low and high melody, gamakas, open drone strokes, quiet articulation, the strongest strokes and a full decay. Hear it unamplified, and ask which buzz and drone balance are intended. Sit them in their normal posture before any stand moves — never ask them to turn the veena for the mic.' },
      { title: 'NAME EVERY PATH', text: 'A microphone in the room hears the air round the veena. A built-in pickup or a contact sensor is a separate electrical path, with its own device and wiring instructions. Label each one for what it is.' },
    ],
  },
  workedZone: { veena: 'plate' },
  workedLine: 'This starting point sits near {line}, above the plate and in front of it.',
  workedAim: 'Aim at a broad area of the plate between the bridge and the body — the lab counts it while the mic’s axis, followed in, meets the plate within about 7 cm of {head} — not straight at one bridge point.',
  clearWhat: 'the plucking hand and arm, the left hand along the neck, the gourd on the thigh, the yali and the player’s view',
  placementReveal: 'Toward the bridge tends to bring more of each note’s start, and maybe more click or buzz; a broad view of the plate, more body; farther back, more of the room and the ensemble. Every veena and room differs, so “it depends on this veena” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear, not a promised result.',
  typeNotes: {
    sdcCard: 'Ideas to try: begin over the plate, out of the hand’s reach; then change one thing — turn a little toward the bridge, or come back a little — and listen to melody, a gamaka, a tala stroke and a decay each time.',
    instDynCard: 'Ideas to try with a dynamic: over the plate on a stage; watch the proximity bass if you come closer.',
  },
  learnSeparate: 'Distance from the plate, position along the veena and angle are separate variables: change one at a time and compare at matched levels. Distances are measured to the mic’s FRONT, square to the plate, and rounded to about 5 mm.',
  learnTendencies: 'Over the plate between the bridge and the body is a starting blend; turned toward the bridge, more articulation; closer, more local colour and movement; farther back in a good room, more of the room. A second mic toward the drone side is optional — check it in mono.',
  context: {
    zone: 'plate',
    shield: C15_SHIELD,
    plan: { u0: -1800, u1: 1300, v0: -700, v1: 1100 },
    side: { u0: -1800, u1: 1300, v0: -1000, v1: 340 },
    frontIds: ['wedge'],
    looking: 'From above · mic over the plate',
    points: [
      { title: 'LOOKING DOWN', text: 'A mic over the veena looks down at the plate, so its rear faces the ceiling and the sides. A side-fill at head height can sit in its rejection; a floor wedge in front sits at its side, where no null reaches.' },
      { title: 'ONE MIC FIRST', text: 'Live, start with one directional mic and the nearest safe view of the plate that represents the music. A second live mic must justify its extra spill.' },
      { title: 'STUDIO', text: 'Hear the plate start before adding channels; compare a farther view if the room helps. Include the melody and the drone — one bass note does not represent the instrument.' },
      { title: 'A PICKUP', text: 'A built-in pickup is labelled separately and tested in the actual rig — its level, its input and its feedback — and it does not exactly represent the air sound.' },
    ],
    body: 'With a monitor on the side, a pattern’s rejection is a tool to aim — and patterns reject least at low frequencies.',
    studioId: 'vn.ctx.studio',
    studioPrompt: 'A quiet studio, solo veena: what do you hear before adding a second mic?',
    studioNote: 'In a quiet room a farther view blends the veena with the room. Repeated trials are practical when the player stops. Switch back to LIVE for the side-fill exercise.',
  },
  twoMic: {
    A: 'plate',
    B: 'bridge',
    learn: [
      'A second veena mic — toward the drone side, or a pair from the front — is optional, for a stated purpose. Keep the plate mic as the main sound; keep the second only if it adds tala articulation or space the music needs.',
      'When it goes in: solo each, then hear the pair in MONO at matched levels — the attack, the sustained melody and the drone. Move or rebalance the second mic if the body or decay turns hollow; polarity is a test, not a cure for all timing differences.',
    ],
  },
  practice: { prefix: 'vn', mixedIntro: 'Three cards from earlier pages, mixed: a reference point, a pattern’s null, and polarity versus delay.' },
  words: familyWords(VEENA_N),
});

export const C15_COPY: LessonCopy = {
  ...base,
  context: {
    ...base.context,
    target: 'sidefill',
    targetWord: 'side-fill',
    prompt: 'The side-fill stays where the player needs it. Turn the MIC (AIM) or change its PATTERN until the side-fill sits in the rejection — while the mic still looks down at the veena.',
    activityDone: 'done — the side-fill sat in a null by your aim or pattern',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). Looking down at the veena, its rear faces the ceiling — the side-fill sits toward the rear and the side.',
  },
  sound: {
    ...base.sound,
    cells: [
      { k: 'STRING', at: ['PULLED', 'SWINGING', 'SWINGING', 'SWINGING'], flex: 1.1 },
      { k: 'TOP PLATE', at: ['AT REST', 'BARELY', 'DRIVEN', 'RADIATING'], flex: 1.2 },
      { k: 'SOUND', at: ['—', 'FAINT', 'BUILDING', 'LEAVING'], flex: 1 },
    ],
    looking: { veena: 'From above · the top plate and the strings' },
  },
};
