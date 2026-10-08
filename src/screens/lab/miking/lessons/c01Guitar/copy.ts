/**
 * C01 ACOUSTIC GUITAR — the pages' guitar words (engine/model/copy.ts).
 * Starting-points voice (owner ruling 2026-10-04): no sources, brands or
 * badges. Every number is from acoustic_guitar/SOURCES.md or a named drawing
 * default (guitarSpec.ts).
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { C01_BUILT, C01_SHIELD } from './geometry.ts';

const steel = C01_BUILT.scenes.steel.g;

export const GUITAR_WORDS: NonNullable<LessonCopy['words']> = {
  instrument: 'guitar',
  player: 'guitarist',
  reference: 'point',
  inside: 'inside the body',
  outside: 'in front of the guitar',
  axis: 'the line to the point it is measured from',
  facing: 'facing the guitar',
  shield: 'guitar in path',
  mountStand: 'Mount: a stand and boom, kept out of the strumming arm, the fretting hand and the player’s sight line',
  mountClip: 'Mount: a clip on the body’s edge made for this body depth — only with the owner’s OK',
  sheet: 'For a real guitar, with the player’s agreement and the player stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
  viewSide: 'Front view',
  viewTop: 'View from above',
};

export const C01_COPY: LessonCopy = {
  variantKey: 'BODY',
  variantShort: { steel: 'steel-string', twelve: 'twelve-string', nylon: 'nylon-string' },
  sceneSubject: { steel: 'a seated player with a steel-string dreadnought', twelve: 'a seated player with a twelve-string dreadnought', nylon: 'a seated player with a nylon-string classical guitar' },
  viewTag: { side: 'FRONT', top: 'FROM ABOVE' },
  axes: {
    x: { plus: 'toward the headstock', minus: 'toward the tail', label: 'ALONG', blurb: 'Along the strings, toward the headstock or the tail end (x).' },
    y: { plus: 'down (treble side)', minus: 'up (bass side)', label: 'UP–DOWN', blurb: 'Up toward the bass edge or down toward the treble edge and the floor (y).' },
    z: { plus: 'out in front of the top', minus: 'behind the top', label: 'DISTANCE', blurb: 'Out from the guitar’s top toward the audience, or back toward it (z). Distances are read from the point the zone names.' },
  },
  instrument: {
    figureBadge: 'Drawn to scale from the front, with the player',
    figureLabel: 'Front view of a seated player with an acoustic guitar: the top with its sound hole and rosette, the bridge and saddle, the pickguard, the fingerboard and frets running to the headstock, the strings, the player’s strumming arm over the lower body and the fretting hand on the neck.',
    partsBadge: 'Tap a part to name it · front and from above',
    partsLooking: { side: 'Front view · the guitar and the player', top: 'From above · the guitar edge-on' },
    partsIdle: 'The strings drive the bridge; the bridge drives the top; the top and the air in the body make most of the sound — the next page shows how.',
    variantNotes: {
      twelve: 'TWELVE-STRING: six pairs (courses), so twelve strings over the same kind of body. Its neck still meets the body at the 14th fret.',
      nylon: 'NYLON: on this classical body the neck meets the body at the 12th fret — so here the 12th fret and the neck joint are the same place. On the steel-string bodies they are not.',
    },
  },
  sound: {
    strikes: [
      { id: 'bridge', label: 'NEAR THE BRIDGE', mm: 50, blurb: 'About 5 cm (2 in) from the saddle — the bright end.' },
      { id: 'hole', label: 'OVER THE HOLE', mm: steel.hole.x, blurb: 'Over the sound hole, where most players strum and pick.' },
      { id: 'neck', label: 'NECK END', mm: steel.edge, blurb: 'Where the neck meets the body — a rounder, softer pluck.' },
      { id: 'middle', label: 'THE MIDDLE (12TH)', mm: steel.L / 2, blurb: 'The exact middle of the open string, over the 12th fret.' },
    ],
    strikeDefault: 'hole',
    striker: 'PICK',
    strikerPhrase: 'pick',
    subject: 'Front view of the guitar',
    looking: { steel: 'Front view · steel-string', twelve: 'Front view · twelve-string', nylon: 'Front view · nylon-string' },
    cells: [
      { k: 'STRING', at: ['PULLED', 'SWINGING', 'SWINGING', 'SWINGING'], flex: 1.1 },
      { k: 'TOP', at: ['AT REST', 'BARELY', 'DRIVEN', 'RADIATING'], flex: 1.1 },
      { k: 'AIR IN BODY', at: ['STILL', 'STILL', 'MOVING', 'BREATHING'], flex: 1.25 },
    ],
    reveal: 'The string itself moves very little air: it is the bridge rocking the TOP that makes most of the sound. The thin top is the loudspeaker; the string is the motor.',
    after: 'Then the strings, the top and the air in the body keep ringing together for a while — the BODY of the sound. How long depends on the guitar, the strings and the player.',
    shapesNotes: [
      'A pluck sets a shape moving only as much as the string moves at the pick in that shape. Plucked in the exact middle, every even shape has a still point under the pick, so it is not set moving — a rounder, hollower note. Nearer the bridge, the upper shapes join in: brighter.',
      'This is an ideal string between rigid ends. A real string is a little stiff and its ends move with the bridge and the top — the reason a real guitar never sounds like this picture alone.',
    ],
    coupledSubject: 'Front view of the guitar',
    coupledNote: 'The top bows in and out round the bridge and pumps the air in the body through the sound hole — a simplified picture of the lowest motion. A close mic hears the part of the top, the hole or the strings it faces most.',
    silentNote: 'This lab never plays a sound and draws no frequency curve for the guitar: how a real guitar sounds depends on the guitar, the strings, the room and the player. The pictures show where the sound comes from and where it leaves.',
  },
  setting: {
    kitA11y: 'The player from above, seated with the guitar: the chair behind, a vocal mic on its stand in front of the mouth, a DI box on the floor beside the tail.',
    kitLanding: 'Tap anything round the player — or step through ITEM — to see what it means for a guitar mic. There is nothing to answer yet.',
    kitIdle: 'The space round a seated guitarist is theirs: the strumming arm sweeps over the body, the fretting hand travels the neck, and they look at the neck as they play.',
    leftHanded: 'Left-handed players hold the guitar mirrored: the neck points the other way, and so does everything that keeps clear of it.',
    stageA11y: 'A small stage from above: the guitarist with a floor wedge in front, a bass amp and a drum kit upstage, the PA at the front corners and the audience edge.',
    studioA11y: 'A studio room from above: the guitarist on a rug, no monitors on the floor, the walls round them.',
    stageIdle: 'A floor wedge in front of the player, the band behind, the PA facing the audience: all of it reaches a guitar mic.',
    studioIdle: 'No monitors on the floor. The room itself is part of the picture now.',
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'What will they play — gentle fingerstyle, hard strumming, palm-muted notes, taps on the body, a capo? Do they rock, turn, stand up, or sing as they play? Hear the guitar unamplified, from where the mic will go. Tuning, old strings or a rattle are the player’s to fix: a mic cannot repair a guitar.' },
      { title: 'WORK WITH THE GUITAR AS IT IS', text: 'The guitar and its finish are the owner’s. No clip goes on the body, and nothing on the guitar is changed, without their agreement. Setup and repairs belong to the player or a qualified technician — not to the mic.' },
    ],
  },
  placement: {
    workedZone: { steel: 'fret12.steel', twelve: 'fret12.twelve', nylon: 'fret12.nylon' },
    workedLine: 'This starting point also sits near {line}: within about 8 cm of it, out in front of the guitar.',
    workedAim: 'Aim it between the upper top and the nearby strings — the lab counts it while the mic’s axis, followed in, meets the top near {head}. Distance, position and angle are separate things to try.',
    workedClear: 'Clear of every part — the strumming arm and the pick’s swing, the fretting hand, the neck and the player’s sight line to it. Clearance comes first, before any number, and the player stops before a real mic moves.',
    blocked: { steel: ' A stand mic keeps out of the strumming arm and the fretting hand — come in from the front.', twelve: ' A stand mic keeps out of the strumming arm and the fretting hand — come in from the front.', nylon: ' A stand mic keeps out of the hands — come in from the front.' },
    reveal: 'Toward the sound hole tends to bring more body and low end — and more boom close in; toward the neck, more string detail. Every guitar differs, so “it depends on this guitar” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear, not a promised result.',
    typeNotes: {
      sdcCard: 'Ideas to try: start near the 12th fret, then move one thing at a time — toward the hole, toward the bridge, a little farther back — and listen at matched levels.',
      instDynCard: 'Ideas to try with a dynamic: it is often brought a little closer than a condenser. Watch the bass that proximity adds, and the hands’ clearance.',
      clipCond: 'Ideas to try with a clip-on: keep the capsule over the top between the neck joint and the hole; turning it toward the hole gives more level — and more boom.',
    },
    note: 'Clearance comes first: stop the player before moving a real mic. A mic, stand or cable anywhere the strumming arm, the fretting hand or the neck can reach is in the wrong place, whatever the number says.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we suggest you begin with that kind of mic, measured from the point it names. They are starting points, not rules: move from there and listen — there is no single right answer, and every guitar is different.',
      separate: 'Distance, position along the guitar and angle are separate variables: change one at a time. “From the 12th fret” and “from the sound hole” are different points — and on a steel-string dreadnought the 12th fret is about 3.5 cm out on the neck, not where the neck meets the body. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.',
      clearance: 'Clearance comes first. Stop the player before moving a mic; keep the mic, stand and cable out of the strumming arm, the fretting hand, the neck’s path and the player’s view of it, and never lean a boom toward their face or the guitar. Keep-clear areas appear as the mic gets close — in red, with the reason, if a move is stopped — and show roughly where to keep clear — leave more room for a real player.',
      tendencies: 'Near the 12th fret is often a balanced start; toward the hole tends to add body and low end; toward the bridge, attack and bite; farther back, more of the room. These are tendencies, and guitars vary. With a directional mic, proximity effect also adds bass very close.',
    },
  },
  context: {
    variant: 'steel',
    zone: 'fret12.steel',
    typeId: 'sdcCard',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'sdcCard' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'sdcCard' },
      { id: 'hypercardioid', label: 'hypercardioid', typeId: 'sdcCard' },
    ],
    micNoun: 'A small condenser',
    shield: C01_SHIELD,
    azMax: 45,
    elMax: 30,
    aimBlurb: 'Swing the front up to 45° either way — it still points at the guitar.',
    plan: { u0: -750, u1: 1150, v0: -700, v1: 1560 },
    side: { u0: -750, u1: 1150, v0: -700, v1: 720 },
    target: 'wedge',
    frontIds: ['voice'],
    targetWord: 'wedge',
    looking: 'From above · mic near the 12th fret',
    prompt: 'The wedge stays where the player needs it. Turn the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — while the mic still points at the guitar.',
    activityDone: 'done — the wedge sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies. Use the null to aim, not to promise silence — and the guitar’s top can still reflect the wedge back into the mic.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). Aimed at the guitar, its rear faces out toward the floor in front — near the wedge.',
    shieldNote: 'Moving a mic for isolation changes the guitar’s tone, too: check both. Real patterns change with pitch and the stage reflects sound — this is the reasoning, not a prediction.',
    studioId: 'ag.ctx.studio',
    studioPrompt: 'A studio session in a good room: what is the room worth to this guitar?',
    studioNote: 'In a quiet studio a farther mic can blend the guitar with the room, and an omni can be worth a try. Repeated trials are practical when the player stops. Switch back to LIVE for the wedge exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not restrictions: a close directional mic can suit a studio take, and a room mic can suit a quiet stage.',
      points: [
        { title: 'DISTANCE', text: 'Studio: a little farther back blends the guitar with the room. Live: a stand position that works in a quiet room may pick up too much stage and feed back at PA level — come closer with a directional mic, or use a clip that keeps its distance as the player moves.' },
        { title: 'SPILL AND THE TOP', text: 'The guitar’s top can reflect the PA and other instruments into a mic even when it is aimed away from them. A live trick worth trying: a clip mic under the end of the fingerboard, pointed up and away from the wedge.' },
        { title: 'PICKUP OR MIC', text: 'A pickup is a separate electrical path, not a microphone. On a loud stage it may give more level before feedback; a mic adds the air round the guitar. Compare each alone, then together in mono.' },
        { title: 'MOVEMENT', text: 'A player may shift several centimetres between sitting, standing, singing and the loud passages. Mark a comfortable position, and test the whole performance.' },
      ],
      body: 'With a wedge in front, a pattern’s rejection is a tool to aim. With a singing player, the voice reaches the guitar mic from its front: no null helps there — plan the balance of the two mics instead.',
      warn: 'No guitar-mic position alone prevents feedback: the pattern, the other open mics, the monitors, the system level and the room all matter. If it starts, lower the level first, then change the geometry. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
    },
  },
  twoMic: {
    variant: 'steel',
    A: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'fret12.steel' },
    B: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'bridge.steel' },
    learn: [
      'A second guitar mic is a choice for a defined tone or a wider image — not a requirement. Start with one good mono mic; add the second only for a stated purpose (a neck-side view plus a bridge-side view, or a farther room view), and keep it only if it improves the guitar in the song.',
      'When it goes in: solo each, then hear the pair in MONO at matched levels. Avoid aiming both into the sound hole. If the sum turns hollow or loses low end, move or rebalance a mic before reaching for the polarity switch — it does not guarantee a match, and neither does a spacing rule.',
    ],
    warn: 'Both mics hear the same guitar, but from different spots, so this simplified graph shows only the timing part of the sum. The notch POSITIONS follow from the arrival-time difference; their DEPTH depends on the two levels, which this model takes from distance alone — read the depths as illustrative. Judge the pair by ear, in mono, at matched levels.',
  },
  practice: {
    gain: 'ag.prac.gain',
    second: 'ag.prac.3',
    mixed: ['ag.mix.1', 'ag.mix.2', 'ag.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: a reference point, a pattern’s null, and polarity versus delay.',
  },
  words: GUITAR_WORDS,
};
