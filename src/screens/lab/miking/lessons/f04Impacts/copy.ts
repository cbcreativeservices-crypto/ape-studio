/**
 * F04 IMPACTS, LIQUIDS AND TEXTURES — the shared pages' words, on the Foley
 * family's words (shared/foley/foleyCopy.ts) with the lesson's own. No
 * source gives a distance or a splash radius: every number is a drawing
 * default (CORRECTIONS_LOG.md, Lab 6 group 1). The water and electrical
 * safety lines are kept exact in meaning. Starting-points voice.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { foleyCopy } from '../shared/foley/foleyCopy.ts';

export const F04_COPY: Partial<LessonCopy> = foleyCopy({
  what: 'an impact, a liquid or a texture',
  variantKey: 'SOURCE',
  variantShort: { impact: 'an impact', water: 'water', texture: 'a texture', live: 'a live station' },
  sceneSubject: {
    impact: 'a Foley artist striking a padded block on a wooden table',
    water: 'a Foley artist pouring water into a shallow basin on a low table',
    texture: 'a Foley artist drawing a dry brush across fabric on a board',
    live: 'a Foley artist at a live theatre effects station',
  },
  axesBlurb: 'Up or down (y). The action — the impact point, the water’s entry, the stroke — is height 0.',
  instrument: {
    figureBadge: 'A Foley artist and a small, safe source · the action at the centre',
    figureLabel: 'Side view of a Foley artist at a small, safe source: a padded block on a table, a shallow basin of water, or a brush on a fabric board.',
    partsBadge: 'Impacts, liquids and textures · tap a part to name it',
    partsLooking: { side: 'Side view · from the artist’s right', top: 'From above · the artist and the source' },
    partsIdle: 'An impact is not only its first click; water is an entry, a splash, bubbles and a long drip tail; a texture is a steady friction with a natural end. Tap the source, then switch SOURCE.',
    variantNotes: {
      impact: 'IMPACT: a padded block on a sturdy table — a safe, controllable hit. No heavy drops, glass, blades or staged falls are needed.',
      water: 'WATER: water only, a small amount, in a stable shallow basin on a non-slip mat, a towel at hand. Mark the splash with the mic absent — every stand, cable and power supply stays outside it.',
      texture: 'TEXTURE: a clean, dry brush across coarse fabric on a board — a steady stroke and its natural end.',
      live: 'LIVE: a small, contained impact at a fixed station beside the stage — no wet effect live without approved containment, cleanup and equipment separation.',
    },
  },
  sound: {
    strikes: [{ id: 'c', label: 'ONE ACTION', mm: 0, blurb: 'One hit, pour or stroke.' }],
    strikeDefault: 'c',
    striker: 'ACTION',
    strikerPhrase: 'the action',
    subject: 'The source drawn large: one hit, pour or stroke',
    looking: { impact: 'The block and the table, drawn large · one hit', water: 'The basin, drawn large · one pour', texture: 'The brush and the board, drawn large · one stroke', live: 'The block and the table, drawn large · one hit' },
    cells: [
      { k: 'HAND', at: ['DRIVES IT', 'DONE', '—', '—'], flex: 0.9 },
      { k: 'ATTACK', at: ['—', 'THE PEAK', 'PAST', 'PAST'], flex: 1 },
      { k: 'BODY · TAIL', at: ['—', '—', 'RINGING', 'THE TAIL'], byVariant: { water: ['—', '—', 'BUBBLES · WALL', 'LONG DRIPS'] }, flex: 1.2 },
    ],
    reveal: 'Each source is an attack and a body or a tail: the contact, the entry, the friction first — then the table ringing, the bubbles and the wall, the board — then a decay or a long drip tail into the room.',
    after: 'Let the decay or the drips finish before the next action. A close mic reveals the attack and small drops but may miss the body; a farther one joins the source and the room.',
    shapesNotes: ['The pictures show the order of events and where each starts — never its level or length. The splash envelope is an illustrative mark: find the real one by rehearsing with the mic absent.'],
    coupledSubject: 'A basin of water drawn large',
    coupledNote: 'The same pour has a sharp, loud moment and a long, quiet one: set the gain on the hit, and let the tail finish — a later fader cannot undo an overload at the start.',
    silentNote: 'This lab never plays a sound and draws no frequency curve: how a real impact, liquid or texture sounds depends on the material, the force, the amount and the room. The pictures show where the sound comes from.',
    pair: {
      title: 'The hit or the tail',
      badge: 'A simplified picture: when and where, not how loud or how long · motion drawn larger',
      looking: 'A basin of water, drawn large',
      prompt: 'Drag SWING through the pour, then switch MOMENT. Watch where each part of the sound happens.',
      key: 'MOMENT',
      rest: 'mid-pour',
      cells: ['MOMENT', 'WHERE', 'YOU HEAR'],
      together: {
        option: 'THE HIT (THE ENTRY)',
        blurb: 'The water entering the surface: the splash’s crown, sharp and brief.',
        short: 'THE HIT',
        title: 'THE HIT',
        card: 'The water hits the surface: a crown of splash, the loudest and shortest moment — the one the gain is set on, and the one that can reach a mic too close.',
        v0: 'ENTRY',
        sub0: 'the surface',
        v1: 'SPLASH CROWN',
        air: { plus: 'SHARP · LOUD', minus: 'SHARP · LOUD', rest: '—' },
      },
      opposed: {
        option: 'THE TAIL (THE DRIPS)',
        blurb: 'Long after the pour: drips and ripples, quiet and long.',
        short: 'THE TAIL',
        title: 'THE TAIL',
        card: 'Drips fall and ripples spread long after the pour: a quiet, long tail that is easy to cut off by starting the next take too soon.',
        v0: 'DRIPS',
        sub0: 'after the pour',
        v1: 'RIPPLES',
        air: { plus: 'QUIET · LONG', minus: 'QUIET · LONG', rest: '—' },
      },
    },
  },
  before: [
    { title: 'DEFINE THE EVENT FIRST', text: 'Which part does the scene need — the click, the body, the tail? The striking object, the surface, the resonant body and the room all contribute; water is an entry, a splash, flow, bubbles and drips. Have the performer repeat it with similar energy.' },
    { title: 'MARK THE SPLASH WITH THE MIC ABSENT', text: 'Rehearse the water action with no mic there and mark the splash footprint; then set the stand outside it. Power supplies, the recorder, cables and connectors stay away from the wet area; dry your hands before touching controls; stop if water escapes its containment.' },
    { title: 'A WINDSCREEN IS NOT A WATER BARRIER', text: 'Do not treat a foam windscreen or a basket as waterproof: a splash on one gives a loud thump and can ruin the take. A rain cover is for between takes, not while recording. Keep the mic dry — water inside a mic can cause fire or electric shock; if equipment gets wet, stop and follow the maker’s guidance.' },
    { title: 'SAFE SOURCES ONLY', text: 'No heavy drops, explosive charges, glass breaking, blades, hot liquid, fine powder or chemicals are needed; no staged falls, and never strike a person. Non-slip flooring round any water. Never energise wet equipment or improvise electrical waterproofing.' },
  ],
  worked: { impact: 'f04.contact', water: 'f04.side', texture: 'f04.stroke', live: 'f04.contact' },
  live: {
    variant: 'live',
    zone: 'f04.contact',
    typeId: 'scSupercard',
    patterns: [
      { id: 'supercardioid', label: 'supercardioid', typeId: 'scSupercard' },
      { id: 'cardioid', label: 'cardioid', typeId: 'scSupercard' },
    ],
    micNoun: 'A small supercardioid',
    plan: { u0: -1100, u1: 2900, v0: -2700, v1: 1500 },
    side: { u0: -1100, u1: 2900, v0: -1100, v1: 810 },
    looking: 'The station from above · the wedge on the floor in front of the artist',
    prompt: 'The wedge stays where the artist needs it. Turn or tilt the MIC (AIM), or change its PATTERN, until the wedge sits in the rejection — while the mic still points at the impact.',
    points: [
      { title: 'SMALL, CONTAINED EFFECTS', text: 'Studio: props, surfaces and distance can change between takes. Live: a small contained effect at a fixed station hits its cue once, inside a PA and monitor field.' },
      { title: 'NO WET EFFECT WITHOUT A PLAN', text: 'Avoid a wet effect in a live stage area unless the venue has approved containment, cleanup and equipment separation.' },
      { title: 'THE WEDGE IN THE REJECTION', text: 'An operator-controlled channel, the wedge in the mic’s rejection, the gain before feedback tested at normal rehearsal level.' },
      { title: 'ON LOCATION', text: 'Wind, traffic, wet footing and changing levels: keep stands, crew and electronics outside the action and the spray zone, with permission for the site — never into a road, an unstable bank or active machinery for a closer sound.' },
    ],
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind it. Aimed down at the impact, its rear points up and away — the wedge, on the floor ahead and to one side, sits off that line, nearer a supercardioid’s deeper rejection.',
    shieldNote: 'The artist and the table reflect the wedge’s sound, which a free-field pattern cannot show. Check at show level with the system operator.',
  },
  studio: {
    id: 'f04.ctx.studio',
    prompt: 'A quiet Foley stage: a small pour into a basin for a close shot. A fair first plan?',
    note: 'On a quiet stage there is no wedge to reject: one airborne mic off to the side of the basin, outside the marked splash, aimed at the entry, is a place to begin. Switch back to LIVE for the wedge exercise.',
  },
  pair: {
    variant: 'water',
    label: 'Entry mic + tail and room mic',
    A: { typeId: 'scSupercard', zone: 'f04.side' },
    B: { typeId: 'scSupercard', zone: 'f04.room' },
    learn: [
      'Begin with one mic for each cue. If a second mic is justified, give it a different task: one aimed at the water’s entry, one hearing the body, the room or the drip tail — recorded on its own channel and labelled.',
      'Check each alone, then the sum in mono over the whole action: different arrival times change the attack, and moving water makes any one alignment imperfect. Choosing between mics is as fair as combining them.',
    ],
    warn: 'This simplified graph treats the water as one point and both mics as hearing the same sound. Moving water changes the delay as it flows, and the farther mic hears more of the room. Read the notch POSITIONS and treat their depths as illustrative.',
  },
  practice: { gain: 'f04.prac.gain', second: 'f04.prac.3', mixed: ['f04.mix.1', 'f04.mix.2', 'f04.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: the attack and the tail, a pattern’s null, and the delay between two mics.' },
  startIntro: 'This lesson is about putting a microphone on a safe impact, a small amount of water and a dry texture. First the sources themselves: where their sounds come from, then real starting setups drawn on the stage, the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  ref: 'the action',
  otherRef: 'Every starting point here is measured from the action — the impact point, the water’s entry, the middle of the stroke — to the mic’s capsule. No one distance suits every mass, basin and texture: these are our suggested places to begin.',
  reveal: 'Closer tends to bring the attack and small drops forward — and may miss the body, and invite the splash; farther joins the source and the room and the tail, with more room noise. Every source differs, so “it depends on this source” is fair too.',
  tendencies: 'Closer: transients and small drops, less body, more risk from splash and air. Farther: the body, the room and the tail, more room noise. For a soft texture, enough direct sound above the room before any processing. Tendencies to check by ear.',
  performer: 'the artist',
});
