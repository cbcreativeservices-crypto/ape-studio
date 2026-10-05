/**
 * C03 RESONATOR GUITAR — the pages' words (starting-points voice; no
 * sources, brands or badges; "square-neck resonator", not a maker's name).
 */
import { stringsCopy } from '../shared/guitars/stringsCopy.ts';
import { familyWords, type Noun } from '../shared/guitars/stringsContent.ts';
import { C03_BUILT, C03_SHIELD } from './geometry.ts';

export const RESO: Noun = { one: 'resonator', the: 'the resonator', player: 'player' };
const g = C03_BUILT.scenes.lap.g;

export const C03_COPY = stringsCopy({
  n: RESO,
  subject: { lap: 'a seated player with a square-neck resonator face up across the lap', round: 'a seated player with a round-neck resonator held like a guitar' },
  variantKey: 'NECK',
  viewTag: { side: 'FROM THE AUDIENCE', top: 'FROM ABOVE' },
  variantShort: { lap: 'square neck, lap style', round: 'round neck, upright' },
  variantNotes: {
    lap: 'SQUARE NECK, LAP STYLE: the instrument lies face up, the player stops the strings with a steel bar. The side view shows it edge-on; the view from above shows its face.',
    round: 'ROUND NECK: held upright like a guitar, so the front view shows its face — and the player may turn it toward the room or another player.',
  },
  figureLabel: 'A resonator guitar and its player: the body with a round, perforated metal coverplate over the cone, two screened sound ports on the upper body, the strings over the coverplate to the neck and headstock.',
  partsIdle: 'The strings drive a bridge that sits on a thin metal cone; the cone, under the coverplate, makes most of the sound — the next page shows how.',
  radiator: 'top',
  strikes: [
    { id: 'bridge', label: 'NEAR THE BRIDGE', mm: 60, blurb: 'About 6 cm (2.4 in) from the bridge, at the coverplate.' },
    { id: 'cover', label: 'OVER THE COVERPLATE', mm: 110, blurb: 'Over the neck end of the coverplate, where many players pick.' },
    { id: 'neck', label: 'NECK END', mm: g.edge, blurb: 'Where the neck meets the body — a rounder, softer pluck.' },
    { id: 'middle', label: 'THE MIDDLE (12TH)', mm: g.L / 2, blurb: 'The exact middle of the open string, over the 12th fret.' },
  ],
  strikeDefault: 'cover',
  soundReveal: 'The strings do not drive a wooden top here: the bridge sits on a spun-metal CONE, and the cone works like a loudspeaker under the coverplate — a distinct, metallic voice.',
  soundAfter: 'Then the strings, the cone and the body ring on together — the BODY of the sound. The body, the ports, the coverplate, the bar and the player all shape what a mic hears.',
  shapesNote2: 'This is an ideal string between rigid ends. A real resonator string ends on a bridge that moves with the cone — and a steel bar, not a fret, sets the length in lap style.',
  coupledNote: 'In this simplified section the moving part round the bridge stands for the cone under the coverplate. The cone’s sound leaves through the coverplate’s holes and the body’s ports.',
  setting: {
    kitA11y: 'The player from above with the resonator: a chair behind, a DI box on the floor by the tail.',
    kitIdle: 'The space round a resonator player is theirs: the bar hand travelling the neck, the picking hand over the coverplate, and — lap style — their whole upper body leaning over the instrument.',
    leftHanded: 'Left-handed players hold it mirrored: the neck points the other way, and so does everything that keeps clear of it.',
    stageA11y: 'A small stage from above: the player with a floor wedge in front, a bass amp and a drum kit upstage, the PA at the front corners and the audience edge.',
    studioA11y: 'A studio room from above: the player on a rug, no monitors on the floor, the walls round them.',
    stageIdle: 'A wedge in front, the band behind, the PA facing out: in a bluegrass band the banjo and the voices are loud neighbours too.',
    studioIdle: 'No monitors on the floor. The room and a reflective floor are part of the picture now.',
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'Lap style or upright? Bar, slide or fingers, picks? What will they play, how loud, and how do they move or turn? Hear it unamplified from where the mic will go. Look at the resonator without opening it: one cone or three, the ports, the coverplate.' },
      { title: 'NEVER TOUCH THE CONE', text: 'The cone is delicate and its setup is model-specific. Never open the coverplate, adjust the cone, the bridge or a spider screw, or clamp anything to the coverplate to solve a mic problem. A rattle or a loose part: stop and ask the owner or a qualified repairer.' },
    ],
  },
  workedZone: { lap: 'cover.lap', round: 'cover.round' },
  workedAim: 'Face the coverplate and the upper body — the lab counts it while the mic’s axis, followed in, meets the body within about 17 cm of {head}. Aiming straight at the coverplate’s centre is one experiment, not a rule.',
  clearWhat: 'the bar hand, the picking hand, the player’s arms and their view of the neck',
  placementReveal: 'Closer to the cone region tends to give more of its distinct, metallic projection; farther back, a more combined sound. Resonators differ, so “it depends on this one” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear, not a promised result.',
  typeNotes: {
    sdcCard: 'Ideas to try: listen round the instrument first, then move a few centimetres at a time — toward the cone, toward the neck and strings, a little farther back.',
    instDynCard: 'Ideas to try with a dynamic: a robust close option on a loud stage. Watch the proximity bass and keep it off the coverplate.',
    clipCond: 'Ideas to try with a clip-on: the capsule toward the coverplate’s edge, never on the cone; check it is not all strings.',
  },
  learnSeparate: 'Distance, position and angle are separate variables: change one at a time. The resonator has no flat-top sound hole — the starting points are read from the coverplate. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.',
  learnTendencies: 'Toward the cone region: more resonator character; toward the neck and strings: more pick and slide, less cone; farther back: more of the whole instrument and the room. These are comparisons to make by ear, not guarantees.',
  context: {
    variant: 'lap',
    zone: 'cover.lap',
    shield: C03_SHIELD,
    plan: { u0: -800, u1: 1250, v0: -900, v1: 1600 },
    side: { u0: -800, u1: 1250, v0: -800, v1: 720 },
    frontIds: [],
    looking: 'From above · lap style, mic over the coverplate',
    points: [
      { title: 'A BOOM FROM THE SIDE', text: 'Lap style the coverplate faces up: bring a boom in from the side so the capsule sees the instrument without crossing the bar’s path or the picking hand.' },
      { title: 'THE PICKUP', text: 'On a loud stage a correctly installed pickup through its preamp or DI can carry the level, with a mic blended as feedback allows. A pickup — or an imaging pedal — is an electrical path, not a microphone.' },
      { title: 'SHARED OR CLOSE', text: 'A quiet acoustic band may share one or two mics and move in for solos; that needs choreography and a kind room. On a loud stage, close mics give more gain before feedback.' },
      { title: 'MOVEMENT', text: 'An upright player may turn toward the room or another player: mark a playing zone, or a clip that moves with the instrument.' },
    ],
    body: 'With a wedge in front, aim the pattern’s rejection at it by the mic’s actual pattern — a supercardioid hears a little straight behind, so a wedge right behind it can be a poor choice.',
    studioId: 'rs.ctx.studio',
    studioPrompt: 'A studio session: what could a second view add?',
    studioNote: 'In the studio, one reliable mic first; a second view (a closer cone view plus a farther overall one) only for a defined purpose. Switch back to LIVE for the wedge exercise.',
  },
  twoMic: {
    variant: 'round',
    A: 'cover.round',
    B: 'close.round',
    learn: [
      'A second view — a closer cone view plus a farther overall view, or the neck and strings plus the coverplate — is a choice for a defined purpose. Record one reliable mic first.',
      'When it goes in: listen to each alone, then combined at matched levels, and in mono. Different path lengths cancel some pitches; reposition and rebalance before assuming a polarity switch is the cure. A pickup alongside the mic needs the same check.',
    ],
  },
  practice: { prefix: 'rs', mixedIntro: 'Three cards from earlier pages, mixed: a reference point, a pattern’s null, and polarity versus delay.' },
  words: { ...familyWords(RESO), mountClip: 'Mount: a clip made for this body’s depth and edge — never on the cone or the coverplate, and only with the owner’s OK' },
});
