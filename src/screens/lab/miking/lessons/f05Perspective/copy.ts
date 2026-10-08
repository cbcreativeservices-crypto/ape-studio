/**
 * F05 FOLEY PERSPECTIVE — the shared pages' words (engine/model/copy.ts) on
 * the Foley family's words (shared/foley/foleyCopy.ts) with the lesson's
 * own: the moving key ring, the near-or-far picture, the worked starting
 * points, the live station, the close + room pair. Starting-points voice; no
 * sources, brands or badges.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { foleyCopy } from '../shared/foley/foleyCopy.ts';

export const F05_COPY: Partial<LessonCopy> = foleyCopy({
  what: 'a Foley action',
  variantKey: 'STAGE',
  variantShort: { keys: 'a quiet Foley stage', live: 'a live station' },
  sceneSubject: {
    keys: 'a Foley artist carrying a key ring across a marked 2 m path at hand level',
    live: 'a Foley artist carrying a key ring across a marked path at a live theatre station',
  },
  axesBlurb: 'Up or down (y). The keys at the middle of the path are height 0.',
  instrument: {
    figureBadge: 'A Foley artist carrying keys across a marked path',
    figureLabel: 'Side view of a Foley artist holding a key ring at hand level, mid-way along a marked path on the stage.',
    partsBadge: 'A moving Foley action · tap a part to name it',
    partsLooking: { side: 'Side view · from the artist’s right', top: 'From above · the marked path across the stage' },
    partsIdle: 'One action, carried across a marked path: the keys move, the room stays. Tap the keys, the path, the artist — then think about what each mic would hear.',
    variantNotes: {
      keys: 'STUDIO: a quiet Foley stage — the room you hear is the stage’s own. Switch STAGE for a live theatre station.',
      live: 'LIVE: a station beside a theatre stage — the PA and a wedge share the room; open mics are few.',
    },
  },
  sound: {
    strikes: [{ id: 'c', label: 'ONE ACTION', mm: 0, blurb: 'One handled action.' }],
    strikeDefault: 'c',
    striker: 'ACTION',
    strikerPhrase: 'the action',
    subject: 'The key ring drawn large, one action in four events',
    looking: { keys: 'The key ring, drawn large · one action', live: 'The key ring, drawn large · one action' },
    cells: [
      { k: 'HAND', at: ['MOVES IT', 'HOLDS', 'HOLDS', 'LETS GO'], flex: 1 },
      { k: 'CONTACT', at: ['—', 'KEY ON KEY', 'DONE', 'FINAL CONTACT'], flex: 1.1 },
      { k: 'BODY', at: ['—', '—', 'RING · KEYS', 'THE ROOM'], flex: 1 },
    ],
    reveal: 'One jingle is several small events at one place — and that place MOVES as the keys are carried. Every mic hears the same events from where it stands.',
    after: 'Then the next step along the path: the keys are somewhere else, so every mic’s distance to them has changed.',
    shapesNotes: ['The pictures show the order of events and where they start — never their level.'],
    coupledSubject: 'The stage from above: the keys, a close mic and a room mic',
    coupledNote: 'The same jingle reaches both mics: the close one first and loudest, mostly direct; the room one later, weaker, with the walls’ reflections right behind. That is perspective — two distances, not left and right.',
    silentNote: 'This lab never plays a sound and draws no frequency curve. The pictures show where the sound goes and in what order it arrives.',
    pair: {
      title: 'Near or far',
      badge: 'From above · straight paths and two wall reflections · where the sound goes, not how loud',
      looking: 'The stage from above',
      prompt: 'Switch MIC between NEAR and FAR, then drag SWING to carry the keys along the path.',
      key: 'MIC',
      rest: 'the keys at the middle of the path',
      cells: ['MIC', 'IT HEARS', 'PERSPECTIVE'],
      together: {
        option: 'NEAR · THE CLOSE MIC',
        blurb: 'About 1.4 m from the middle of the path: the keys first and loudest.',
        short: 'NEAR',
        title: 'THE CLOSE MIC',
        card: 'Mostly the direct sound: the detail of the jingle, little of the room. A close shot.',
        v0: 'CLOSE',
        sub0: 'about 1.4 m',
        v1: 'MOSTLY DIRECT',
        air: { plus: 'DETAIL', minus: 'DETAIL', rest: 'DETAIL' },
      },
      opposed: {
        option: 'FAR · THE ROOM MIC',
        blurb: 'About 3 m out and 2 m up: the same keys later, with the room.',
        short: 'FAR',
        title: 'THE ROOM MIC',
        card: 'The direct sound later and weaker, the walls’ reflections close behind: the action in its room. A wider shot — if the room suits the picture.',
        v0: 'ROOM',
        sub0: 'about 3 m',
        v1: 'DIRECT + ROOM',
        air: { plus: 'ROOM', minus: 'ROOM', rest: 'ROOM' },
      },
    },
  },
  before: [
    { title: 'THE PICTURED ACTION FIRST', text: 'The event, where it is on screen and how it moves, the camera’s view, and whether the result must work in mono. A close shot may want a distinct object; a wide interior more of the room — neither camera size nor distance alone guarantees the right sound.' },
    { title: 'NAME EACH MIC’S JOB', text: 'Before mounting a mic, say what it is for: the detail, the whole action, the real room, or the action’s travel across the picture. A second mic earns its place only with a job of its own.' },
    { title: 'LISTEN TO THE ROOM', text: 'Listen to the stage’s own noise and decay. If it cannot match the pictured place, a distant mic records the wrong room; a dry close track keeps an editing option — but processing will not recreate every reflection later.' },
    { title: 'STANDS OUT OF THE PATH', text: 'Floor stands outside the whole path, its swing, water and debris — overhead rigging only with qualified venue staff. Never move a stand into an active cue to follow the artist without rehearsal and clear coordination.' },
  ],
  worked: { keys: 'f05.mono', live: 'f05.live' },
  live: {
    variant: 'live',
    zone: 'f05.live',
    typeId: 'shotgunShort',
    plan: { u0: -1100, u1: 2900, v0: -2700, v1: 1500 },
    side: { u0: -1100, u1: 2900, v0: -1100, v1: 1060 },
    looking: 'The station from above · the wedge on the floor in front of the artist',
    prompt: 'The wedge stays where the artist needs it. Turn or tilt the MIC (AIM), or change its PATTERN, until the wedge sits in the rejection — while the mic still points at the keys.',
    points: [
      { title: 'ONE STABLE PICKUP', text: 'Studio: one mic for the whole action, then a room channel or a pair only for a reason. Live: one stable, source-proximate directional mic at a repeatable station.' },
      { title: 'EVERY OPEN MIC COSTS', text: 'Extra open room mics pick up the loudspeakers, raise the room and the noise, and take away gain before feedback; add a second feed only with a clear purpose for the audience.' },
      { title: 'MOVEMENT FOR THE SEATS', text: 'Keep any stereo movement intelligible at the audience’s seats, in the mono feeds and in the monitors.' },
      { title: 'WITH THE OPERATOR', text: 'The system operator controls the routing and checks it at normal rehearsal level — never by looking for feedback.' },
    ],
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind it. Aimed at the keys, its rear points away from the artist — the wedge, on the floor ahead and to one side, sits off that line, nearer a supercardioid’s deeper rejection.',
    shieldNote: 'The artist and the station reflect the wedge’s sound, which a free-field pattern cannot show. Check at show level with the system operator.',
  },
  studio: {
    id: 'f05.ctx.studio',
    prompt: 'A quiet Foley stage: keys carried across a medium shot. A fair first plan?',
    note: 'On a quiet stage there is no wedge to reject: one mic covering the whole crossing is a place to begin — then a room channel or a pair only if the scene asks. Switch back to LIVE for the wedge exercise.',
  },
  pair: {
    variant: 'keys',
    label: 'Close mic + room mic: two perspectives',
    A: { typeId: 'shotgunShort', zone: 'f05.mono' },
    B: { typeId: 'ldcRoom', zone: 'f05.room' },
    learn: [
      'A close mic and a room mic are two perspectives of one action, each on its own channel — to select or blend by scene. They are not a left/right stereo pair: never hard-pan them just because there are two tracks.',
      'Solo the close mic, solo the room mic, then the sum in MONO over the whole movement: the room mic hears each jingle later, and as the keys travel the delay changes. Change placement or level first; polarity is a diagnostic, not a cure for a time difference.',
    ],
    warn: 'This simplified graph treats the keys as one still point and both mics as hearing the same sound. Carried across the path, the keys change the delay with every step — any one alignment is only locally true — and the room mic hears more reflections. Read the notch POSITIONS; treat their depths as illustrative.',
  },
  practice: { gain: 'f05.prac.gain', second: 'f05.prac.3', mixed: ['f05.mix.1', 'f05.mix.2', 'f05.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: two distances or left and right, a pair in mono, and a moving delay.' },
  startIntro: 'This lesson is about perspective on a Foley stage — one mic, a close mic with a room mic, or a stereo pair — on an action that moves across the picture. First the action and where its sound goes, then real starting setups drawn on the stage, the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  ref: 'the keys at the middle of the path',
  otherRef: 'Every starting point here is measured from the keys at the middle of their path to the mic’s capsule. As the keys travel, every one of those distances changes.',
  reveal: 'Nearer, the action grows large and detailed and the room shrinks; farther, the room joins and the travel evens out. A pair at one place shows the travel across the picture. No one distance suits every shot.',
  tendencies: 'Closer: detail, handling, a large object. Farther: the room, an even level along the path, more room noise. A pair: the travel left to right. Two distances are not left and right. Tendencies to check by ear — your ears and the room decide.',
  typeNotes: {
    arrCard: 'Ideas to try with the cardioid pair: capsules together for X/Y, 17 cm and 110° for ORTF — the whole pair moves, never the geometry.',
    arrFig8: 'Ideas to try with the figure-8: as the Side of an M/S pair, facing left and right over the Mid.',
  },
  performer: 'the artist',
});
