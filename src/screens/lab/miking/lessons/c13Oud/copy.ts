/**
 * C13 OUD — the pages' words, built by the strings copy (starting-points
 * voice; no sources, brands or badges).
 */
import { stringsCopy } from '../shared/guitars/stringsCopy.ts';
import { familyWords, type Noun } from '../shared/guitars/stringsContent.ts';
import { OUD } from '../shared/lutes/luteSpec.ts';
import { C13_BUILT, C13_SHIELD } from './geometry.ts';

export const OUD_N: Noun = { one: 'oud', the: 'the oud', player: 'oud player' };
const g = C13_BUILT.scene.oud!;

export const C13_COPY = stringsCopy({
  n: OUD_N,
  subject: { oud: 'a seated player with an oud' },
  variantKey: 'INSTRUMENT',
  variantShort: { oud: 'oud' },
  figureLabel: 'Front view of a seated player with an oud: a pear-shaped face with three carved rosettes — a large one under the strings, two small ones low on the face — the bridge low on the face, eleven strings in six courses over a short, fretless neck, and the pegbox bent sharply back. The risha hand is over the strings near the bridge; the left hand is on the neck.',
  partsIdle: 'The risha plucks the strings; the strings drive the bridge; the bridge drives the face; the face, the bowl’s air and the rosettes make the sound — the next page shows how.',
  radiator: 'face',
  strikes: [
    { id: 'near', label: 'CLOSE TO THE BRIDGE', mm: 45, blurb: 'About 4.5 cm from the bridge — the brightest, most percussive place.' },
    { id: 'roses', label: 'OVER THE SMALL ROSES', mm: OUD.roseSmallX.mm, blurb: 'Over the small rosettes — the risha’s usual place, drawn as a typical one.' },
    { id: 'main', label: 'OVER THE MAIN ROSE', mm: OUD.roseMainX.mm, blurb: 'Over the main rosette — a rounder, softer place.' },
    { id: 'middle', label: 'THE MIDDLE', mm: g.nut / 2, blurb: 'The exact middle of the open string.' },
  ],
  strikeDefault: 'roses',
  striker: 'RISHA',
  strikerPhrase: 'risha',
  soundReveal: 'The strings move very little air on their own: the bridge rocking the FACE makes most of the sound, and the air in the deep bowl breathes out through the rosettes.',
  soundAfter: 'Then the strings, the face and the bowl’s air keep ringing together — the BODY of the note. The risha’s click is the start; the bloom is what follows.',
  shapesNote2: 'This is an ideal string between rigid ends. On a fretless neck the left hand can stop the string anywhere — even between the semitones — but every stopped length still has these whole-number shapes.',
  coupledNote: 'The face bows in and out round the bridge, and the bowl’s air moves through the rosettes — a simplified picture of the lowest motion. A close mic hears the part of the face, the rose or the strings it faces most.',
  setting: {
    kitA11y: 'The oud player from above, seated on a chair: the oud across the right thigh, its face to the audience, the neck to the player’s left; a vocal mic in front of the mouth, a frame-drum player beside.',
    kitIdle: 'The space round a seated oud player is theirs: the risha hand over the face, the left hand along a short neck, the pegbox swinging behind it, and the player’s view.',
    leftHanded: 'A left-handed player holds the oud mirrored: the neck points the other way, and so does everything that keeps clear of it.',
    stageA11y: 'A small stage from above: the oud player with a floor wedge in front, a frame-drum player beside, the PA at the front corners and the audience edge.',
    studioA11y: 'A studio room from above: the oud player on a chair, no monitors on the floor, the walls round them.',
    stageIdle: 'A wedge in front, percussion beside, the PA facing out. A frame drum close by is loud against an oud.',
    studioIdle: 'No monitors on the floor. The room is part of the picture now — and a good room is worth hearing.',
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'Which oud, which strings and risha, which phrase? Ask for low and high notes, quick risha strokes, tremolo, the slides and the loudest passage. Hear it unamplified from a normal listening place, and agree how much risha click and finger movement belong in the sound. Tuning and any change to the instrument are the player’s.' },
      { title: 'NAME EVERY PATH', text: 'A microphone in the room hears the air round the oud. A pickup — even a small clip-on one that looks like a mic — senses the instrument’s vibration: a separate electrical path. Label each one for what it is, and follow its own manual for power.' },
    ],
  },
  workedZone: { oud: 'upper' },
  workedLine: 'This starting point sits near {line}, out in front of the oud.',
  workedAim: 'Aim at the space between the main rose and the neck — the lab counts it while the mic’s axis, followed in, meets the face within about 11 cm of {head} — not straight into the rose.',
  clearWhat: 'the risha’s arc, the left hand along the neck, the pegbox and the player’s view',
  placementReveal: 'Toward the rose tends to bring more body and bloom; toward the neck, more string and finger detail; closer, more risha click and more proximity bass. Every oud and room differs, so “it depends on this oud” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear, not a promised result.',
  typeNotes: {
    sdcCard: 'Ideas to try: begin on the upper face, then change one thing — a little closer, a little toward the rose, a little toward the neck — and listen to the whole phrase each time.',
    instDynCard: 'Ideas to try with a dynamic: on a stage, close by the main rose and angled down; watch the bass that proximity adds, and any boom from the rose.',
  },
  learnSeparate: 'Distance, position along the oud and angle are separate variables: change one at a time and compare at matched levels. Distances are measured to the mic’s FRONT and rounded to about 5 mm.',
  learnTendencies: 'The upper face is a balanced start; closer adds definition and the risha’s click; at the main rose, body and bloom — and boom if you go too close. Farther back in a good room — try it by ear; no number here — the oud and the room blend.',
  context: {
    zone: 'upper',
    shield: C13_SHIELD,
    plan: { u0: -700, u1: 1300, v0: -700, v1: 1500 },
    side: { u0: -700, u1: 1300, v0: -700, v1: 760 },
    frontIds: ['voice'],
    looking: 'From above · mic on the upper face',
    points: [
      { title: 'A PICKUP', text: 'On a loud stage some players prefer a pickup; others reinforce the oud with air mics even beside percussion. Both work on some stages — test the level the audience and the player need, in the room.' },
      { title: 'A CLOSE MIC LIVE', text: 'Closer gives more level before feedback, but magnifies the risha’s attack, and the oud’s body can still ring with the monitors. Move only as close as is useful.' },
      { title: 'STUDIO', text: 'Start on the upper face, then try farther back if the room is good. Check the slides, the quiet ornaments and the loudest phrase.' },
      { title: 'MOVEMENT', text: 'A stand mic hears the player turn. Mark the chair and its angle so the session can be repeated.' },
    ],
    body: 'With a wedge in front, a pattern’s rejection is a tool to aim — and patterns reject least at low frequencies.',
    studioId: 'oud.ctx.studio',
    studioPrompt: 'A quiet studio with a pleasing room: what is the room worth to this oud?',
    studioNote: 'In a quiet room a farther mic blends the oud with the room. Repeated trials are practical when the player stops. Switch back to LIVE for the wedge exercise.',
  },
  twoMic: {
    A: 'upper',
    B: 'face',
    learn: [
      'A second oud mic — or a pickup alongside one mic — is a choice for a stated purpose, not a requirement. Get one good mic first; keep the second only if it improves the oud in the music.',
      'When it goes in: solo each, then hear the pair in MONO at matched levels — the attack, the warmth and the low notes. Small moves change the comb. Move or rebalance a mic before reaching for polarity; polarity is a test, not a cure for a delay.',
    ],
  },
  practice: { prefix: 'oud', mixedIntro: 'Three cards from earlier pages, mixed: a reference point, a pattern’s null, and polarity versus delay.' },
  words: familyWords(OUD_N),
});
