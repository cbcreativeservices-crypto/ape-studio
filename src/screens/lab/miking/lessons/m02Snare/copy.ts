/**
 * M02 SNARE DRUM — the pages' snare words (engine/model/copy.ts). Starting-
 * points voice (owner ruling 2026-10-04): no sources, brands or badges.
 * Every number here is from snare/SOURCES.md or a named drawing default.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { OPPOSITE_SIDES_POLARITY } from '../../engine/model/sharedItems.ts';

export const SNARE_COPY: LessonCopy = {
  variantKey: 'SNARES',
  variantShort: { on: 'snares on', off: 'snares off' },
  sceneSubject: { on: 'a 14 × 5.5 in snare drum with the snares on', off: 'a 14 × 5.5 in snare drum with the snares off' },
  viewTag: { side: 'SIDE · CUTAWAY', top: 'TOP' },
  axes: {
    x: { plus: 'toward the audience', minus: 'toward the player', label: 'FRONT–BACK', blurb: 'Toward the audience or toward the player (x). Distances are read from the rim or the head the zone names.' },
    y: { plus: 'below the batter head', minus: 'above the batter head', label: 'HEIGHT', blurb: 'Up or down (y), from the batter head’s plane. A bottom mic sits below the whole drum.' },
    z: { plus: 'to player’s right', minus: 'to player’s left', label: 'ACROSS', blurb: 'Toward the player’s left (the hi-hat) or right (the toms) (z).' },
  },
  instrument: {
    figureBadge: 'A 14 × 5.5 in snare, cut open so you can see the wires',
    figureLabel: 'Side view of a 14 × 5.5 in snare drum, cut open: the coated batter head on top, the thin snare-side head below with the snare wires stretched across it, the strainer on the player’s side, the drum on its stand, the hi-hat behind it and a stick at the strike.',
    partsBadge: 'A 14 × 5.5 in snare, cut open · tap a part to name it',
    partsLooking: { side: 'Side view · the snare cut open', top: 'Top view · the snare from above' },
    partsIdle: 'The sticks strike the batter head on top. The air inside drives the snare-side head below, and the wires stretched across it buzz — the next page shows how.',
    variantNotes: { off: 'SNARES OFF: the throw-off is released and the wires hang just clear of the head. Switch SNARES to put them back on. Which a passage needs is the player’s call.' },
  },
  sound: {
    strikes: [
      { id: 'c', label: 'CENTRE', mm: 0, blurb: 'The exact centre of the head.' },
      { id: '2', label: 'OFF CENTRE', mm: 2 * 25.4, blurb: '2 in (51 mm) from the centre.' },
      { id: '5', label: 'NEAR THE EDGE', mm: 5 * 25.4, blurb: '5 in (127 mm) from the centre, about 2 in in from the edge.' },
    ],
    strikeDefault: '2',
    striker: 'STICK',
    strikerPhrase: 'the stick',
    subject: 'Side view of the snare, cut open',
    looking: { on: 'Side view · the snare cut open · snares on', off: 'Side view · the snare cut open · snares off' },
    cells: [
      { k: 'BATTER', at: ['AT REST', 'PUSHED IN', 'PUSHED IN', 'PUSHED IN', 'RINGING'], flex: 1.1 },
      { k: 'SNARE HEAD', at: ['AT REST', 'AT REST', 'PUSHED DOWN', 'SPRINGS BACK', 'RINGING'], flex: 1.25 },
      { k: 'WIRES', at: ['ON HEAD', 'ON HEAD', 'ON HEAD', 'BUZZING', 'BUZZING'], byVariant: { off: ['CLEAR', 'CLEAR', 'CLEAR', 'STILL', 'STILL'] }, flex: 1.15 },
    ],
    reveal: 'The squeezed air pushes the snare-side head DOWN — both heads move the same way at that moment. The two heads are coupled through the air inside, and the snare-side head drives the wires.',
    after: 'Then both heads keep ringing and the wires keep rattling for a while — the BODY of the sound. How long depends on the tuning, the wires’ tension and the drum (the Drum Tuning Lab covers tuning).',
    shapesNotes: [
      'A shape is set moving only as much as the head moves at the strike point in that shape. At the exact centre, every shape with a still line across the head stands still — so a centre strike drives only the ring-shaped ones. Off centre, more shapes join in.',
      'This is a simplified head in empty space. On a real snare, the air inside, the second head and the wires pull these numbers around — the next step shows the two heads working together.',
    ],
    coupledSubject: 'Side view of the snare',
    coupledNote: 'One stroke sets both going; the sound you hear is the two together — plus the wires, which the snare-side head drives.',
    silentNote: 'This lab never plays a sound and draws no frequency curve for the drum: how a real snare sounds depends on the drum, the heads, the wires, the tuning, the stick and the player. The pictures show where the sound comes from and where it leaves.',
  },
  setting: {
    kitA11y: 'The drum kit from above: the snare at the player’s left knee, ringed in amber, the hi-hat behind it, two rack toms over the kick, the floor tom on the right, the cymbals above, and the throne.',
    kitLanding: 'Tap anything around the snare — or step through ITEM — to see what it means for a snare mic. There is nothing to answer yet.',
    kitIdle: 'The snare sits between the player’s knees, its near half under the sticks. Everything around it is either the player’s space or a loud neighbour — the hi-hat most of all.',
    leftHanded: 'Many left-handed players set the kit up mirrored — the hi-hat on the right, the floor tom on the left.',
    stageA11y: 'The kit on a stage, from above: the drummer’s fill beside the throne, a downstage wedge on the audience side, and the audience and PA to the right.',
    studioA11y: 'The kit in a studio room, from above: no monitors on the floor; the room’s walls around it.',
    stageIdle: 'Two floor monitors: the drummer’s own fill beside the throne, and another player’s wedge on the audience side. Monitors, the PA and a loud band all reach a snare mic.',
    studioIdle: 'No monitors on the floor. The room — and the overheads, if they are up — are part of the picture now.',
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'Which strokes do they play — rimshots, cross-stick, brushes, ghost notes — and where do the sticks go? Are the snares on for this passage? Hear the drum without reinforcement first. A buzz or rattle that is there before any mic is the player’s to fix (the Drum Tuning Lab covers tuning): a mic cannot repair a drum or a stand.' },
      { title: 'WORK WITH THE DRUM AS IT IS', text: 'The drum and its hardware are the player’s. No clamp goes on the hoop, and nothing on the drum is changed, without their agreement.' },
    ],
  },
  placement: {
    workedZone: { on: 'top.close', off: 'top.close' },
    workedLine: 'This starting point also places the mic relative to {line}: “over the rim” is drawn as a band from about 4 cm in to 4 cm out from the edge.',
    workedAim: 'Aim it at the head — the lab counts it while the mic’s axis, followed down, meets the batter head. Distance, height and angle are separate things to try.',
    workedClear: 'Clear of every part — the sticks’ path and rimshots, the hi-hat, the hoop and the rack tom. Clearance comes first, before any number, and the drummer stops before a real mic moves.',
    blocked: {},
    reveal: 'Moving away from the rim tends to bring in more of the whole drum — and more of the kit — and drums vary, so “it depends on this drum” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear, not a promised result.',
    typeNotes: {
      smallDynCard: 'Ideas to try: start near the rim and aim toward the centre; then move one thing at a time — the rim position, the height, the angle, and which way its rear faces relative to the hi-hat.',
      clipDynCard: 'Ideas to try with a clip-on: keep the clamp where it does not hinder the rim or the tuning, then change only the angle — near 30° and near 60° from straight down give different balances of fundamental and overtones.',
    },
    note: 'Clearance comes first: stop the drummer before moving a real mic. A mic, clip or cable anywhere a stick, a rimshot or the hi-hat can reach is in the wrong place, whatever the number says.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we suggest you begin with that kind of mic, measured from the rim or the head it names. They are starting points, not rules: move from there and listen — there is no single right answer, and every snare is different.',
      separate: 'Rim position, height and angle are separate variables: change one at a time. “Above the rim” and “above the head” are different numbers — the rim stands above the head. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm — a mic’s acoustic centre is not the visible end of its grille, so no millimetre claim is made.',
      clearance: 'Clearance comes first. Stop the drummer before moving a mic; keep the mic, stand, clamp and cable out of the sticks’ path, rimshots, cross-stick and the hi-hat’s travel, and route the cable away from the pedals. Keep-clear areas appear as the mic gets close — in red, with the reason, if a move is stopped — and show roughly where to keep clear — leave more room on a real kit.',
      tendencies: 'Starting near the rim and aiming toward the centre is a common approach; a more centred aim can change the balance of strike and ring. These are tendencies, and drums vary. With a directional mic, proximity effect also changes the lows at short distances.',
    },
  },
  context: {
    zone: 'top.close',
    typeId: 'tomDynSuper',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'smallDynCard' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'tomDynSuper' },
      { id: 'hypercardioid', label: 'hypercardioid', typeId: 'tomDynSuper' },
    ],
    micNoun: 'A snare dynamic',
    shield: ['snare.shell', 'snare.batter', 'snare.reso', 'snare.hoopTop'],
    azMax: 45,
    elMax: 30,
    aimBlurb: 'Swing the front up to 45° either way — it still points down at the drum.',
    plan: { u0: -650, u1: 850, v0: -700, v1: 1250 },
    side: { u0: -600, u1: 850, v0: -650, v1: 700 },
    target: 'hihat',
    frontIds: ['fill'],
    targetWord: 'hi-hat',
    looking: 'Top view · mic over the rim',
    prompt: 'The hi-hat stays where the player needs it. Turn the MIC (AIM) or change its PATTERN until the hi-hat sits in the rejection — while the mic still points at the drum.',
    activityDone: 'done — the hi-hat sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and often least at low frequencies. Use the null to aim, not to promise silence — and some hi-hat in a snare mic is not automatically a defect.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). Pointing down at the snare, its rear faces up and away — the hi-hat sits beside it, so only a large turn brings it near the null.',
    shieldNote: 'Moving a mic for isolation can change the snare’s tone, too: check both. Real patterns change with pitch and the stage reflects sound — this is the reasoning, not a prediction.',
    studioId: 'sn.ctx.studio',
    studioPrompt: 'A studio session: what do the overheads already give the snare?',
    studioNote: 'In the studio, overheads or a room mic may already carry the snare; a close mic adds control when it helps. Repeated trials are practical when the drummer stops. Switch back to LIVE for the hi-hat exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not restrictions: a close mic can suit a studio session, and one mic shared by the snare and the hi-hat can be an intentional choice on a small stage.',
      points: [
        { title: 'KIT PERSPECTIVE', text: 'Studio: overheads or a room perspective may be the main picture; a snare mic adds control when useful. Live: first consider what the acoustic snare already gives the audience, and what the PA must add.' },
        { title: 'PLACEMENT AND SPILL', text: 'Studio: more distance can include more of the drum and the room. Live: closer placement, the right pattern and the right aim may give more snare relative to the hi-hat, the stage and the monitors.' },
        { title: 'CHANNEL COUNT', text: 'Studio: a bottom mic is justified when its wire sound improves the whole kit. Live: start with the open mics you need — a bottom channel adds spill, a cable and a combining check.' },
        { title: 'MOUNTING', text: 'Studio: paused sessions allow careful comparisons. Live: stable mounts, protected cables and repeatable positions matter during a show and a fast changeover.' },
      ],
      body: 'With the hi-hat this close, a pattern’s rejection is a tool to aim — but hi-hat spill is not automatically a defect, and when channels are few one mic angled between the snare and the hi-hat can be an intentional choice.',
      warn: 'No snare-mic position alone prevents feedback: the pattern, the other open mics, the monitors, the system level and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
    },
  },
  twoMic: {
    A: { typeId: 'smallDynCard', pattern: 'cardioid', zone: 'top.close' },
    B: { typeId: 'smallDynCard', pattern: 'cardioid', zone: 'bottom' },
    opposite: {
      surface: 'batter',
      note: 'Top and bottom face the two heads, which move the same way: as the batter head moves down, away from the top mic, the snare-side head moves down, toward the bottom mic — one mic hears a pull while the other hears a push. So the pair starts in opposite polarity, before any arrival-time difference. A simplified picture: the drum’s lowest motion.',
    },
    learn: [
      'A bottom mic is a choice for more control of the wires’ sound — not a requirement. Start with a useful top mic, bring the bottom one in at a modest level, and keep it only if it improves the snare in the whole kit.',
      `${OPPOSITE_SIDES_POLARITY} A louder state almost always sounds “better” at first. Check it with the overheads and the other open mics, too.`,
    ],
    warn: 'The top and bottom mics hear DIFFERENT surfaces — the batter head’s crack and the wires’ buzz — so this simplified graph shows only the shared part of the sound, not what the pair will sound like. The notch POSITIONS follow from the arrival-time difference; their DEPTH depends on the two levels, which this model takes from distance alone — read the depths as illustrative. Judge the pair by ear, in mono, at matched levels.',
  },
  practice: {
    gain: 'sn.prac.gain',
    second: 'sn.prac.3',
    mixed: ['sn.mix.1', 'sn.mix.2', 'sn.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: a reference surface, a pattern’s null, and polarity versus delay.',
  },
};
