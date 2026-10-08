/**
 * F01 FOLEY FOOTSTEPS — the shared pages' words (engine/model/copy.ts), on
 * the Foley family's words (shared/foley/foleyCopy.ts) with the lesson's own:
 * the shoe-and-surface sound words, the worked starting points, the live
 * booth card, the close + room pair, the "before any mic" points. Every
 * number is from foley_footsteps/SOURCES.md or a named drawing default
 * (CORRECTIONS_LOG.md, Lab 6 group 1). Starting-points voice; no sources,
 * brands or badges.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { foleyCopy } from '../shared/foley/foleyCopy.ts';

export const F01_COPY: Partial<LessonCopy> = foleyCopy({
  what: 'footsteps',
  variantKey: 'SURFACE',
  variantShort: { tile: 'tile', wood: 'hollow wood', gravel: 'gravel', carpet: 'carpet over wood', live: 'a live booth' },
  sceneSubject: {
    tile: 'a Foley artist walking in a pit of tile on concrete',
    wood: 'a Foley artist walking on a hollow wood panel',
    gravel: 'a Foley artist walking in a pit of loose gravel',
    carpet: 'a Foley artist walking on carpet laid over a wood floor',
    live: 'a Foley artist walking in a live theatre booth, the PA beside the stage',
  },
  axesBlurb: 'Up or down (y). The walking surface is height 0: the mic looks down onto the steps from above it.',
  instrument: {
    figureBadge: 'A Foley artist walking in a pit · the floor cut open under the steps',
    figureLabel: 'Side view of a Foley artist mid-stride in a pit set into the stage floor, the floor cut open: the surface on top, what lies under it, and the concrete slab below.',
    partsBadge: 'A footstep pit · tap a part to name it',
    partsLooking: { side: 'Side view · the pit cut open', top: 'From above · the pit and the walker' },
    partsIdle: 'A footstep is a shoe, a surface and a performance in a room. The shoe lands, the surface answers, the floor under it can join in — and the mic hears the room too. Tap the shoe, the surface, what is under it, or the slab.',
    variantNotes: {
      tile: 'TILE on a concrete bed: hard and solid. Switch SURFACE to hear — in pictures — what changes with hollow wood, gravel or carpet.',
      wood: 'HOLLOW WOOD: boards over an air gap. The panel and the gap can add a low boom to every step — a mic move cannot take it out.',
      gravel: 'GRAVEL: loose stones that scatter. The walker needs room to work the whole pit, so the movement area is bigger in practice.',
      carpet: 'CARPET over wood: a carpet always lies on something. The step is quiet; the boards under it are still part of the sound.',
      live: 'LIVE: a Foley booth at the side of a theatre stage — the PA and a wedge share the room with the mic. Switch SURFACE to go back to the studio pit.',
    },
  },
  sound: {
    strikes: [{ id: 'c', label: 'ONE STEP', mm: 0, blurb: 'One footstep.' }],
    strikeDefault: 'c',
    striker: 'STEP',
    strikerPhrase: 'the step',
    subject: 'A shoe on the pit’s surface, the floor cut open under it, drawn large',
    looking: { tile: 'A shoe on tile, drawn large · one step', wood: 'A shoe on a hollow panel, drawn large · one step', gravel: 'A shoe in gravel, drawn large · one step', carpet: 'A shoe on carpet over wood, drawn large · one step', live: 'A shoe on a concrete slab, drawn large · one step' },
    cells: [
      { k: 'SHOE', at: ['HEEL LANDS', 'SOLE ROLLS', 'TOE PUSHES', 'LIFTING'], flex: 1.1 },
      { k: 'SURFACE', at: ['CONTACT', 'CONTACT', 'ANSWERS', 'SETTLING'], flex: 1.1 },
      { k: 'UNDER', at: ['—', '—', 'TAKES THE PUSH', 'THE FLOOR · ROOM'], byVariant: { wood: ['—', '—', 'FLEXES', 'GAP BOOMS'], carpet: ['—', '—', 'BOARDS FLEX', 'BOARDS · ROOM'] }, flex: 1.2 },
    ],
    reveal: 'A footstep is not one sound: the heel’s contact, the sole rolling, the surface answering, and whatever is under the surface — all at floor level, all close together. The shoe and the surface choose most of it before any mic does.',
    after: 'Then the next step starts it again — at another place in the pit. A walker crossing the pit moves the sound nearer the mic and farther away with every step.',
    shapesNotes: ['The pictures show the order of events and where the sound starts — never its level or length. A hollow floor’s boom is drawn as rings in the gap; how loud it is depends on the panel and how it is supported.'],
    coupledSubject: 'A shoe on the surface, the floor cut open, drawn large',
    coupledNote: 'The surface on top is only half of the floor: what lies under it decides whether the step stops there or rings on. Choose and support the surface first — then move the mic.',
    silentNote: 'This lab never plays a sound and draws no frequency curve: how a real footstep sounds depends on the shoe, the surface, the performer and the room. The pictures show where the sound comes from and where it goes.',
    pair: {
      title: 'Solid or hollow underneath',
      badge: 'A simplified picture: where the push of the step goes, not how loud · motion drawn larger',
      looking: 'A shoe on the surface, the floor cut open',
      prompt: 'Drag SWING through one step, then switch UNDERNEATH. Watch where the push of the step goes.',
      key: 'UNDERNEATH',
      rest: 'the moment the heel lands',
      cells: ['UNDERNEATH', 'THE PUSH', 'YOU HEAR'],
      together: {
        option: 'SOLID (A CONCRETE BED)',
        blurb: 'Tile on mortar and concrete: the step pushes into a heavy, solid bed.',
        short: 'SOLID',
        title: 'A SOLID BED',
        card: 'The step pushes into mortar and concrete: almost nothing gives, so the contact stays short and sharp. What you hear is the shoe and the surface.',
        v0: 'SOLID',
        sub0: 'tile on concrete',
        v1: 'STOPS IN THE BED',
        air: { plus: 'A SHORT CONTACT', minus: 'LIFTING', rest: 'CONTACT' },
      },
      opposed: {
        option: 'HOLLOW (BOARDS OVER A GAP)',
        blurb: 'Boards on sleepers over an air gap: the step flexes the boards and sets the gap ringing.',
        short: 'HOLLOW',
        title: 'A HOLLOW PANEL',
        card: 'The boards flex under the step and the air gap under them rings: a low boom joins every footstep. It may be wanted — a wooden porch — or not; a mic move cannot take it out of the floor.',
        v0: 'HOLLOW',
        sub0: 'boards over a gap',
        v1: 'RINGS IN THE GAP',
        air: { plus: 'A LOW BOOM', minus: 'LIFTING', rest: 'CONTACT' },
      },
    },
  },
  before: [
    { title: 'DEFINE THE STEP FIRST', text: 'Who is walking, in what shoe, on what floor, in a close or a wide shot — and where the surface changes. A carpet in the picture may lie over wood or tile; a hard sole on a hollow panel is a different step from the same shoe on concrete. Choose the shoe and a stable surface that make the wanted sound; then move the mic.' },
    { title: 'WALK THE CUE WITHOUT RECORDING', text: 'Have the performer walk the whole cue at its real speed and force. Mark the landing area, the step-to-step movement, scuffs, pivots — and a sudden pivot or a missed step — on the floor before any stand goes up.' },
    { title: 'STANDS OUT OF THE LANDING AND EXIT PATHS', text: 'Secure the surface so it cannot slide or tip. Keep stands, mic housings and cables out of the landing area and the exit path; use a stable stand with a shock mount that cannot swing into the performer. Stop the action before moving any hardware, and never ask for risky jumps or stomps to make a louder step.' },
    { title: 'LISTEN TO THE FLOOR', text: 'Before any gain goes up, listen to the actual floor. A boom from a hollow layer or a suspended floor travels into the step; a mic move may make it less prominent but cannot change the floor under it.' },
  ],
  worked: { tile: 'f01.roesch', wood: 'f01.roesch', gravel: 'f01.roesch', carpet: 'f01.roesch', live: 'f01.close' },
  live: {
    variant: 'live',
    zone: 'f01.close',
    typeId: 'shotgunShort',
    plan: { u0: -1100, u1: 2900, v0: -2700, v1: 1500 },
    side: { u0: -1100, u1: 2900, v0: -2300, v1: 450 },
    looking: 'The booth from above · the wedge on the floor in front of the performer',
    prompt: 'The wedge stays where the performer needs it. Turn or tilt the MIC (AIM), or change its PATTERN, until the wedge sits in the rejection — while the mic still points at the steps.',
    points: [
      { title: 'ONE PROTECTED PICKUP', text: 'Studio: a mic about 0.9–1.8 m out, the room part of the sound, and another perspective if the scene wants one. Live: one stable, protected mic for the footstep area, close enough to keep the PA down in it.' },
      { title: 'FEEDBACK AND OPEN MICS', text: 'Live: every open mic hears the PA and the wedge, and each one opened takes margin away. Aim the rejection at the wedge; keep a quiet-room or ambience mic off the PA.' },
      { title: 'THE WHOLE CUE', text: 'Recheck the entire cue at the intended PA level with the system operator — especially a step where the performer moves away from the mic.' },
      { title: 'RECORDING AND PA AT ONCE', text: 'Decide which mic feeds the PA and which is for the recorded perspective. A distant channel can help a recording and be unstable through a PA.' },
    ],
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind it. Aimed down at the steps, its rear points up and back — the wedge, on the floor ahead and to the side, sits off that line, nearer a supercardioid’s deeper rejection. Turning and tilting both matter.',
    shieldNote: 'The performer’s body and the booth also reflect the wedge’s sound, which a free-field pattern cannot show. Listen with the wedge at its show level — with the system operator.',
  },
  studio: {
    id: 'f01.ctx.studio',
    prompt: 'A quiet Foley stage, footsteps for a medium shot. What is a fair first plan?',
    note: 'On a quiet stage there is no wedge to reject: one directional mic, a stable step area and separate monitoring are a place to begin — and another perspective only if the scene wants it. Switch back to LIVE for the wedge exercise.',
  },
  pair: {
    variant: 'tile',
    label: 'Close mic + room mic',
    A: { typeId: 'shotgunShort', zone: 'f01.roesch' },
    B: { typeId: 'ldcRoom', zone: 'f01.room' },
    learn: [
      'A common idea on a Foley stage: keep the focused close mic and add a second, farther mic that hears the steps with the room — each on its own channel. The room layer earns its place only if it helps the scene’s perspective.',
      'The two hear every heel at different times. Bring up the close mic alone, add the second at a useful level, and listen to heel, toe and scuff in MONO. If the impact blurs or hollows out, change placement, level or routing first; a polarity switch is a diagnostic, not a cure for a time difference. Keep the separate tracks.',
    ],
    warn: 'This simplified graph treats the steps as one point and both mics as hearing the same sound. A walker moves, so any one time alignment is only true for one step; and the room mic hears more reflections. Read the notch POSITIONS (they follow from the arrival-time difference) and treat their depths as illustrative.',
  },
  practice: { gain: 'f01.prac.gain', second: 'f01.prac.3', mixed: ['f01.mix.1', 'f01.mix.2', 'f01.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: where a footstep comes from, a pattern’s null, and polarity versus delay.' },
  startIntro: 'This lesson is about putting a microphone on Foley footsteps — a shoe, a surface and a performance in a room. First the step itself: where its sound comes from, then real starting setups drawn on the stage, the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  ref: 'the middle of the steps',
  otherRef: 'Every starting point here is measured from the middle of the footfall area — where the steps land — to the mic’s capsule. The same number from the nearest step or from the walker’s face would put the mic somewhere else.',
  reveal: 'Closer tends to bring more sole contact and texture, and the nearest step jumps out; farther brings the room and a steadier level across the steps — and more room noise under quiet steps. Shoes, surfaces and rooms vary, so “it depends on this step” is fair too.',
  tendencies: 'Closer: more contact, texture and pants or breath noise, uneven near and far steps. Farther: the room, an even level, quiet steps sinking under room noise. Off a shotgun’s axis the tone changes. Tendencies to check by ear — your ears and the room decide.',
  performer: 'the walker',
});
