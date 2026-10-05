/**
 * C14 SITAR — the pages' words, built by the strings copy (starting-points
 * voice; no sources, brands or badges), with the sitar's own fifth event
 * (the sympathetic strings answering).
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { stringsCopy } from '../shared/guitars/stringsCopy.ts';
import { familyWords, type Noun } from '../shared/guitars/stringsContent.ts';
import { C14_BUILT, C14_SHIELD } from './geometry.ts';

export const SITAR_N: Noun = { one: 'sitar', the: 'the sitar', player: 'sitar player' };
const g = C14_BUILT.scene.sitar!;

const base = stringsCopy({
  n: SITAR_N,
  subject: { sitar: 'a player seated on the floor with a sitar' },
  variantKey: 'INSTRUMENT',
  variantShort: { sitar: 'sitar' },
  figureLabel: 'Front view of a player seated on the floor with a sitar: the large gourd resting on the left foot, its pale soundboard with a broad bone bridge and a small bridge below it, the long neck rising to the player’s left with nineteen arched frets, seven main strings over the frets and thirteen fine sympathetic strings running under them to a row of small pegs, an upper gourd behind the top of the neck. The plucking hand is over the board by the neck; the left hand is on the neck.',
  partsIdle: 'The mizrab plucks a main string; the string swings, grazing the broad bridge; the bridge drives the board; and the sympathetic strings answer the notes that match them — the next page shows how.',
  radiator: 'board',
  strikes: [
    { id: 'near', label: 'CLOSE TO THE BRIDGE', mm: 60, blurb: 'About 6 cm from the bridge — the brightest place.' },
    { id: 'usual', label: 'OVER THE BOARD, BY THE NECK', mm: 150, blurb: 'Over the board near where the neck begins — the mizrab’s usual place, drawn as a typical one.' },
    { id: 'middle', label: 'THE MIDDLE', mm: g.nut / 2, blurb: 'The exact middle of the open string.' },
  ],
  strikeDefault: 'usual',
  striker: 'MIZRAB',
  strikerPhrase: 'mizrab',
  soundReveal: 'The strings move very little air on their own: the bridge rocking the BOARD makes most of the sound — and on a sitar with sympathetic strings, they keep a shimmer ringing after the note.',
  soundAfter: 'Then the strings, the board and the gourd’s air keep ringing together — the BODY of the note — and the sympathetic strings that match it ring on.',
  shapesNote2: 'This is an ideal string between rigid ends. A real sitar string grazes the broad, curved top of its bridge as it swings, which adds brightness and buzz the ideal string does not have — the jawari sound, set by the player, never by a mic.',
  coupledNote: 'The board bows in and out round the bridge over the gourd’s air — a simplified picture of the lowest motion. A close mic hears the part of the board, the bridge or the neck it faces most.',
  setting: {
    kitA11y: 'The sitar player from above, seated on a rug: the gourd at the right foot, the neck rising to the left past the shoulder; the tabla player beside, a tanpura player behind.',
    kitIdle: 'The space round a seated sitar player is theirs: the mizrab hand over the board, the left hand travelling a long neck and pulling strings sideways for bends, the gourd on the foot, the crossed legs, and their view.',
    leftHanded: 'A left-handed player holds the sitar mirrored: the neck rises the other way, and so does everything that keeps clear of it.',
    stageA11y: 'A concert stage from above: the sitar player on a rug with a floor wedge in front, the tabla beside, a tanpura behind, the PA at the front corners and the audience edge.',
    studioA11y: 'A studio room from above: the sitar player on a rug, no monitors on the floor, the walls round them.',
    stageIdle: 'A wedge in front, the tabla beside, the PA facing out. Keep the number of open mics low.',
    studioIdle: 'No monitors on the floor. A quiet, good room lets the sitar’s bloom and decay be part of the picture.',
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'Which sitar — does it have sympathetic strings, a second gourd? Ask for the slow opening, the bends pulled across the frets, the strongest strokes, the drone strokes and a full decay. Hear it unamplified from a normal listening place, and ask which part of the bridge’s buzz is intended. Do not promise a shimmer the instrument does not have.' },
      { title: 'NAME EVERY PATH', text: 'A microphone in the room hears the air round the sitar. A pickup, if it has one, is a separate electrical path — its fitting and its input are checked for that device. Label each one for what it is.' },
    ],
  },
  workedZone: { sitar: 'low' },
  workedLine: 'This starting point sits near {line}, out in front of the board.',
  workedAim: 'Angle it in at the bridge and the body — the lab counts it while the mic’s axis, followed in, meets the board within about 11 cm of {head} — not into one strike point.',
  clearWhat: 'the mizrab hand, the left hand’s travel along the neck, the gourd and the player’s view',
  placementReveal: 'Toward the bridge tends to bring more attack and buzz; toward the neck, more string character and shimmer — and fret noise; farther back, more of the whole instrument and the room. Every sitar and room differs, so “it depends on this sitar” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear, not a promised result.',
  typeNotes: {
    sdcCard: 'Ideas to try: begin low, toward the bridge and the body; then change one thing — a little farther back, or a second mic high toward the neck — and listen to a slow opening and a strong stroke each time. Its omni capsule suits the close spot below the bridge in a quiet room.',
    instDynCard: 'Ideas to try with a dynamic: low toward the bridge on a stage, angled in; watch the proximity bass and the buzz.',
  },
  learnSeparate: 'Distance, position along the sitar and angle are separate variables: change one at a time and compare at matched levels. Distances are measured to the mic’s FRONT and rounded to about 5 mm.',
  learnTendencies: 'Low toward the bridge gives most of the sitar in one mic; high toward the neck adds string character and shimmer; a close omni below the bridge, attack and buzz with the room around it; farther back, the whole instrument and its decay — and the room.',
  context: {
    zone: 'low',
    shield: C14_SHIELD,
    plan: { u0: -800, u1: 1400, v0: -750, v1: 1400 },
    side: { u0: -800, u1: 1400, v0: -900, v1: 340 },
    frontIds: ['tabla'],
    looking: 'From above · mic low, toward the bridge',
    points: [
      { title: 'ONE MIC FIRST', text: 'Live, begin with one directional mic toward the bridge and the board, at the safest useful distance. Close helps the sitar stand out from the stage — but the monitors and the sitar’s own body still limit the level before feedback.' },
      { title: 'THE TABLA', text: 'The tabla beside the sitar reaches its mic from the side. Turning the mic changes the sitar’s tone too: distance, balance and the tabla’s own mics do more than a null.' },
      { title: 'STUDIO', text: 'Build the sound with one mic, then compare a farther view or a pair if the room supports the music. Judge the quiet opening and the decay, not only the strong strokes.' },
      { title: 'A PICKUP', text: 'If one air mic cannot give the level the stage needs, a pickup can be a separately labelled path or blend — checked for its own fitting and input.' },
    ],
    body: 'With a wedge in front, a pattern’s rejection is a tool to aim — and patterns reject least at low frequencies.',
    studioId: 'st.ctx.studio',
    studioPrompt: 'A quiet studio with a good room and tabla in the same session: what do you weigh first?',
    studioNote: 'In a good room a farther mic, or a pair, can carry the sitar’s bloom and decay. Repeated trials are practical when the player stops. Switch back to LIVE for the wedge exercise.',
  },
  twoMic: {
    A: 'low',
    B: 'high',
    learn: [
      'The low mic toward the bridge and body, the high mic toward the neck: begin with the low one alone, and add the high one only when what it brings is clear — more string character, more shimmer.',
      'When it goes in: solo each, then hear the pair in MONO at matched levels, through slow and fast phrases. Listen for a hollow body or a disappearing decay. Move or rebalance a mic before reaching for polarity; polarity cannot remove a timing difference.',
    ],
  },
  practice: { prefix: 'st', mixedIntro: 'Three cards from earlier pages, mixed: a reference point, a pattern’s null, and polarity versus delay.' },
  words: familyWords(SITAR_N),
});

export const C14_COPY: LessonCopy = {
  ...base,
  sound: {
    ...base.sound,
    cells: [
      { k: 'STRING', at: ['PULLED', 'SWINGING', 'SWINGING', 'SWINGING', 'SWINGING'], flex: 1.1 },
      { k: 'BOARD', at: ['AT REST', 'BARELY', 'DRIVEN', 'RADIATING', 'RADIATING'], flex: 1.1 },
      { k: 'SYMPATHETIC', at: ['STILL', 'STILL', 'STILL', 'STILL', 'ANSWERING'], flex: 1.3 },
    ],
  },
};
