/**
 * F02 CLOTHING AND BODY MOVEMENT — the shared pages' words, on the Foley
 * family's words (shared/foley/foleyCopy.ts) with the lesson's own. Every
 * number is from foley_clothing/SOURCES.md or a named drawing default
 * (CORRECTIONS_LOG.md, Lab 6 group 1). Starting-points voice.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { foleyCopy } from '../shared/foley/foleyCopy.ts';

export const F02_COPY: Partial<LessonCopy> = foleyCopy({
  what: 'a cloth pass',
  variantKey: 'GARMENT',
  variantShort: { held: 'held', worn: 'worn', live: 'a live station' },
  sceneSubject: {
    held: 'a Foley artist holding a leather jacket at chest height',
    worn: 'a Foley artist walking in place in a leather jacket',
    live: 'a Foley artist at a live theatre station, the PA beside the stage',
  },
  axesBlurb: 'Up or down (y). The active fabric is height 0: a little above it, the mic looks down onto the movement.',
  instrument: {
    figureBadge: 'A Foley artist with a leather jacket · the cloth pass',
    figureLabel: 'Side view of a Foley artist standing, holding a leather jacket gathered between the hands at chest height, its body and a sleeve hanging below.',
    partsBadge: 'A cloth pass · tap a part to name it',
    partsLooking: { side: 'Side view · from the artist’s right', top: 'From above · the artist and the jacket' },
    partsIdle: 'A cloth pass is a performance: the artist moves a real garment in time with the picture. The sound starts where the fabric flexes and rubs, and the whole garment adds its weight. Tap the jacket, the hands or the artist.',
    variantNotes: {
      held: 'HELD: most cloth passes are performed with the garment in the hands — a whole jacket for leather, never a crumpled ball. Switch GARMENT to see it worn.',
      worn: 'WORN: the artist wears it and walks — for a whole garment, a heavy coat or winter synthetics. The sleeves brush the body with each swing.',
      live: 'LIVE: a fixed station beside a theatre stage — the PA and a wedge share the room with a quiet sound. Switch GARMENT to go back to the studio.',
    },
  },
  sound: {
    strikes: [{ id: 'c', label: 'ONE MOVE', mm: 0, blurb: 'One movement of the garment.' }],
    strikeDefault: 'c',
    striker: 'MOVE',
    strikerPhrase: 'the move',
    subject: 'A leather jacket held between two hands, drawn large',
    looking: { held: 'The held jacket, drawn large · one move', worn: 'The jacket, drawn large · one move', live: 'The held jacket, drawn large · one move' },
    cells: [
      { k: 'HANDS', at: ['MOVE', 'HOLDING', 'LET IT SWING', 'STILL'], flex: 1 },
      { k: 'FABRIC', at: ['—', 'FLEXES · RUBS', 'SWINGS', 'SETTLED'], flex: 1.1 },
      { k: 'SOUND', at: ['—', 'DETAIL', 'BODY', 'ALL ROUND'], flex: 1 },
    ],
    reveal: 'A cloth sound is mostly two things: the fold flexing and rubbing over itself, and the whole garment’s weight swinging and settling — both quiet, both spread round the garment, the room close under them.',
    after: 'Then a pause — and the pause is part of the cue: the sound has to start and stop with the action. Record the quiet between moves as well as the moves.',
    shapesNotes: ['The pictures show the order of events and where the sound starts — never its level. A cloth sound is quiet: the room’s own noise sits close under it, which is why distance matters so much here.'],
    coupledSubject: 'A leather jacket held between two hands, drawn large',
    coupledNote: 'The performance makes the sound: a precise move gives the mic something shaped to hear; a crumpled ball gives it noise, wherever the mic is.',
    silentNote: 'This lab never plays a sound and draws no frequency curve: how a real cloth pass sounds depends on the garment, the performer and the room. The pictures show where the sound comes from and where it goes.',
    pair: {
      title: 'A precise move or a ball of cloth',
      badge: 'A simplified picture: where the fabric moves, not how loud · motion drawn larger',
      looking: 'The held jacket, drawn large',
      prompt: 'Drag SWING through one move, then switch MOVE. Watch where the fabric makes its sound.',
      key: 'MOVE',
      rest: 'at rest',
      cells: ['MOVE', 'THE FABRIC', 'YOU HEAR'],
      together: {
        option: 'PRECISE (ONE FOLD)',
        blurb: 'One fold flexes in time with the character’s movement.',
        short: 'PRECISE',
        title: 'A PRECISE MOVE',
        card: 'One fold flexes and rubs, in time with the action: a shaped texture with a start and a stop. The mic hears a movement it can follow.',
        v0: 'PRECISE',
        sub0: 'one fold',
        v1: 'FLEXES · RUBS',
        air: { plus: 'A SHAPED TEXTURE', minus: 'A SHAPED TEXTURE', rest: 'QUIET' },
      },
      opposed: {
        option: 'BUNCHED (A BALL)',
        blurb: 'The garment crumpled into a ball: many rubs at once, everywhere.',
        short: 'BUNCHED',
        title: 'A BALL OF CLOTH',
        card: 'Crumpled into a ball, the fabric rubs everywhere at once: noise without a shape, which no mic position can turn back into a movement.',
        v0: 'BUNCHED',
        sub0: 'a ball',
        v1: 'RUBS EVERYWHERE',
        air: { plus: 'NOISE', minus: 'NOISE', rest: 'QUIET' },
      },
    },
  },
  before: [
    { title: 'DEFINE THE ACTION FIRST', text: 'Watch the picture or rehearse the cue: a sleeve against the torso, leather flexing, a coat flap, bedclothes — or a whole worn garment? Note the start and stop, the energy and the shot. Use the whole item for leather and full jackets, and move it precisely — never just crumple it.' },
    { title: 'LISTEN TO THE ROOM', text: 'Cloth is quiet, so inspect the room before turning up gain: ventilation, hum, traffic, floor and stand vibration, breath, jewellery and other clothes. Record a short quiet baseline.' },
    { title: 'CLEAR OF THE WHOLE GESTURE', text: 'Rehearse the largest gesture before recording. The garment never brushes the mic, mount, cable or stand; the stand is secure, its cable clear of walking paths; a shock mount and strain relief keep thumps out.' },
    { title: 'CARE WITH CLOTH AND PEOPLE', text: 'Never drape cloth over a hot light, an electrical fixture or a mic connector; fasten nothing to a person without their agreement; overhead rigging beyond an ordinary stand is for qualified people with an approved mount; never strike, pull or snag the mic for a louder effect.' },
  ],
  worked: { held: 'f02.garment', worn: 'f02.garment', live: 'f02.close' },
  live: {
    variant: 'live',
    zone: 'f02.close',
    typeId: 'scSupercard',
    patterns: [
      { id: 'supercardioid', label: 'supercardioid', typeId: 'scSupercard' },
      { id: 'cardioid', label: 'cardioid', typeId: 'scSupercard' },
    ],
    micNoun: 'A small supercardioid',
    plan: { u0: -1100, u1: 2900, v0: -2700, v1: 1500 },
    side: { u0: -1100, u1: 2900, v0: -1100, v1: 1260 },
    looking: 'The station from above · the wedge on the floor in front of the artist',
    prompt: 'The wedge stays where the artist needs it. Turn or tilt the MIC (AIM), or change its PATTERN, until the wedge sits in the rejection — while the mic still points at the fabric.',
    points: [
      { title: 'CLOSE, BUT CLEAR', text: 'Studio: about 1–1.5 m out, the whole garment and some room. Live: a close directional mic at a fixed, repeatable station raises the cloth against the PA and the room — but the whole body still has to clear it.' },
      { title: 'LITTLE MARGIN', text: 'A quiet sound needs a lot of gain: a farther mic that works on a quiet stage may run out of gain before feedback live. One open channel may be the practical priority.' },
      { title: 'THE WEDGE IN THE REJECTION', text: 'Place the wedge where the mic’s pattern rejects most, and check it with the system operator at the intended level — never by making it ring.' },
      { title: 'ON LOCATION IT IS THE OTHER WAY ROUND', text: 'For dialogue on location, cloth is the unwanted noise under the speech: a boom or a costume mic chosen for the voice, its fabric contact managed with the costume team.' },
    ],
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind it. Aimed down at the fabric, its rear points up and back — the wedge, on the floor ahead and to the side, sits off that line, nearer a supercardioid’s deeper rejection.',
    shieldNote: 'The artist’s body and the station reflect the wedge’s sound, which a free-field pattern cannot show. Listen with the wedge at its show level — with the system operator.',
  },
  studio: {
    id: 'f02.ctx.studio',
    prompt: 'A quiet Foley stage, a cloth pass for a medium shot. A fair first plan?',
    note: 'On a quiet stage there is no wedge to reject: one mic about 1–1.5 m from the active fabric, a quiet room and a quiet gain chain are a place to begin. Switch back to LIVE for the wedge exercise.',
  },
  pair: {
    variant: 'held',
    label: 'Garment mic + room mic',
    A: { typeId: 'shotgunShort', zone: 'f02.garment' },
    B: { typeId: 'ldcRoom', zone: 'f02.room' },
    learn: [
      'For a spacious interior, one idea is a close mic and another farther back for the room — each recorded on its own channel, compared alone, then together over the whole action. For an exterior scene, one mic often avoids printing the studio room.',
      'The two hear every move at different times, so some pitches cancel in a mono sum — and a moving garment makes any one time alignment true only for one moment. Choose a balance for the whole action; move or rebalance before trying polarity.',
    ],
    warn: 'This simplified graph treats the fabric as one point and both mics as hearing the same sound. The garment moves, so the delay changes as it moves, and the room mic hears more reflections. Read the notch POSITIONS and treat their depths as illustrative.',
  },
  practice: { gain: 'f02.prac.gain', second: 'f02.prac.3', mixed: ['f02.mix.1', 'f02.mix.2', 'f02.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: what a cloth pass is made of, a pattern’s null, and the delay between two mics.' },
  startIntro: 'This lesson is about putting a microphone on a Foley cloth pass — a garment moved in time with the picture. First the sound itself: where it comes from, then real starting setups drawn on the stage, the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  ref: 'the active fabric',
  otherRef: 'Every starting point here is measured from the active fabric — where the garment flexes or moves — to the mic’s capsule. The same number from the artist’s face or hands would put the mic somewhere else.',
  reveal: 'Closer tends to bring a narrow friction point, finger rub and breath; farther, the whole garment and more room — and quiet cloth sinking under the room’s noise. Garments and rooms vary, so “it depends on this garment” is fair too.',
  tendencies: 'Closer: detail, finger rub, breath, and a collision risk. Farther: the whole garment, the body’s movement, the room. Off a shotgun’s axis indoors, the tone changes — compare a small supercardioid in the same place. Tendencies to check by ear.',
  performer: 'the artist',
});

