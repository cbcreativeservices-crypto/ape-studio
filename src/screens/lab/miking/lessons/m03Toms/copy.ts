/**
 * M03 RACK AND FLOOR TOMS — the pages' tom words (engine/model/copy.ts).
 * Starting-points voice (owner ruling 2026-10-04): no sources, brands or
 * badges. Numbers are from toms/SOURCES.md or named drawing defaults.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { FLOOR, TOM2 } from './model.ts';

export const TOMS_COPY: LessonCopy = {
  variantKey: 'DRUM',
  variantShort: { rack: 'the rack toms', floor: 'the floor tom', open: 'floor tom, bottom head off' },
  sceneSubject: {
    rack: 'the 10 in and 12 in rack toms on their holder over the kick',
    floor: 'the 16 in floor tom on its legs',
    open: 'the 16 in floor tom with its bottom head removed',
  },
  viewTag: { side: 'SIDE · CUTAWAY', top: 'TOP' },
  axes: {
    x: { plus: 'toward the audience', minus: 'toward the player', label: 'FRONT–BACK', blurb: 'Toward the audience or toward the player (x), from the centre of the drum in view.' },
    y: { plus: 'below the head’s centre', minus: 'above the head’s centre', label: 'HEIGHT', blurb: 'Up or down (y), from the centre of the drum in view. Distances are read from the head the zone names, square to it.' },
    z: { plus: 'to player’s right', minus: 'to player’s left', label: 'ACROSS', blurb: 'Toward the player’s left or right (z), from the centre of the drum in view.' },
    origin: { rack: TOM2.c, floor: FLOOR.c, open: FLOOR.c },
  },
  instrument: {
    figureBadge: 'The rack toms, the 12 in cut open',
    figureLabel: 'Side view of the rack toms: the 12 in tom cut open and tilted toward the player, its batter head on top and resonant head below, the 10 in tom behind it, on a holder standing on the kick, the crashes above and a stick at the strike.',
    partsBadge: 'Switch DRUM for the rack pair or the floor tom · tap a part to name it',
    partsLooking: { side: 'Side view · the tom cut open', top: 'Top view · the toms from above' },
    partsIdle: 'The sticks strike the batter head on top. The air inside drives the resonant head below — no wires, unlike a snare. Switch DRUM to see the floor tom.',
    variantNotes: { open: 'BOTTOM HEAD OFF: some players run a tom this way, and a mic can then go inside. It changes the drum — never take a head off to match a lesson; it is the player’s choice.' },
  },
  sound: {
    strikes: [
      { id: 'c', label: 'CENTRE', mm: 0, blurb: 'The exact centre of the head.' },
      { id: '2', label: 'OFF CENTRE', mm: 2 * 25.4, blurb: '2 in (51 mm) from the centre.' },
      { id: '4', label: 'NEAR THE EDGE', mm: 4 * 25.4, blurb: '4 in (102 mm) from the centre, about 2 in in from the edge of a 12 in head.' },
    ],
    strikeDefault: '2',
    striker: 'STICK',
    strikerPhrase: 'the stick',
    subject: 'Side view of the tom, cut open',
    looking: { rack: 'Side view · the 12 in tom cut open', floor: 'Side view · the floor tom cut open', open: 'Side view · the floor tom, bottom head off' },
    cells: [
      { k: 'BATTER', at: ['AT REST', 'PUSHED IN', 'PUSHED IN', 'RINGING'], flex: 1.1 },
      { k: 'BOTTOM HEAD', at: ['AT REST', 'AT REST', 'PUSHED OUT', 'RINGING'], byVariant: { open: ['NONE', 'NONE', 'NONE', 'NONE'] }, flex: 1.3 },
      { k: 'AIR', at: ['AT REST', 'SQUEEZED', 'PUSHING', 'RINGING'], byVariant: { open: ['AT REST', 'SQUEEZED', 'OUT THE END', 'OUT THE END'] }, flex: 1.2 },
    ],
    reveal: 'The squeezed air pushes the bottom head OUT, away from the batter — both heads move the same way at that moment. The two heads are coupled through the air inside.',
    after: 'Then both heads keep ringing for a while — the BODY of the tom, often a clear pitch. How long it rings depends on the tuning, the damping and the drum (the Drum Tuning Lab covers that).',
    shapesNotes: [
      'A shape is set moving only as much as the head moves at the strike point in that shape. At the exact centre, every shape with a still line across the head stands still — so a centre strike drives only the ring-shaped ones. Off centre, more shapes join in.',
      'This is a simplified head in empty space. On a real tom, the air inside and the second head pull these numbers around — the next step shows the two heads working together.',
    ],
    coupledSubject: 'Side view of the tom',
    coupledNote: 'One stroke sets both going; the sound you hear is the two together. With the bottom head off there is no pair: the air simply leaves through the open end — the drum rings differently.',
    silentNote: 'This lab never plays a sound and draws no frequency curve for the drum: how a real tom sounds depends on its size, the heads, the tuning, the damping, the stick and the player. A bigger tom at a similar tension rings lower. The pictures show where the sound comes from and where it leaves.',
  },
  setting: {
    kitA11y: 'The drum kit from above: the two rack toms over the kick and the floor tom at the player’s right, ringed in amber; the snare and hi-hat on the left, the cymbals above, and the throne.',
    kitLanding: 'Tap anything around the toms — or step through ITEM — to see what it means for a tom mic. There is nothing to answer yet.',
    kitIdle: 'The rack toms sit over the kick on a holder; the floor tom stands on its legs beside the player’s right leg. Cymbals hang above them, and the sticks travel across all three.',
    leftHanded: 'Left-handed players set the kit up mirrored — the floor tom on the left, the rack toms ordered the other way.',
    stageA11y: 'The kit on a stage, from above: the drummer’s fill beside the throne, a downstage wedge on the audience side, and the audience and PA to the right.',
    studioA11y: 'The kit in a studio room, from above: no monitors on the floor; the room’s walls around it.',
    stageIdle: 'Two floor monitors: the drummer’s own fill beside the throne, and another player’s wedge on the audience side. On a loud stage the cymbals are a tom mic’s loudest neighbours.',
    studioIdle: 'No monitors on the floor. The overheads — if they are up — may already carry the toms.',
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'Hear the tom passages at full strength — fills, rim hits, the cymbals near them. Do the toms need their own channels, or do the overheads already carry them? Check the drums, mounts and heads work as intended: tuning and damping are the player’s (the Drum Tuning Lab covers them), and a mic cannot fix a rattle or a pitch that bends.' },
      { title: 'WORK WITH THE DRUMS AS THEY ARE', text: 'The drums are the player’s. No clamp goes on a hoop, and no head comes off, without their agreement.' },
    ],
  },
  placement: {
    workedZone: { rack: 'tom2.top', floor: 'floor.top', open: 'floor.top' },
    workedLine: 'This starting point also places the mic relative to {line}: “over the tom” is drawn as a band from about 4 cm in to 4 cm out from the edge.',
    workedAim: 'Aim it at the head — the lab counts it while the mic’s axis meets the batter head. On a tilted tom, “above the head” is measured square to the head, not straight up. Distance, height and angle are separate things to try.',
    workedClear: 'Clear of every part — the sticks’ path across the toms, the cymbals above, the holder and the hoops. Clearance comes first, before any number, and the drummer stops before a real mic moves.',
    blocked: {},
    reveal: 'Moving toward the centre tends to bring more low end, toward the rim more attack — and drums vary, so “it depends on this drum” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear, not a promised result.',
    typeNotes: {
      tomDynSuper: 'Ideas to try: keep the distance and swing the aim from the rim toward the centre; then, separately, change the height. On a crowded rack, notice where its rear points — toward a crash, or not.',
      clipDynCard: 'Ideas to try with a clip-on: keep the clamp clear of the rim the sticks hit and of the tuning rods, then change only the angle.',
      rimCondenser: 'Ideas to try: keep the head angled at the drumhead — never flat to it — and within the gooseneck’s bend limit; listen for how much cymbal it hears.',
    },
    note: 'Clearance comes first: stop the drummer before moving a real mic. Tom fills sweep across all the drums — and the cymbals swing — so check the whole motion, not one stroke.',
    availableLead: 'Starting points for this mic on this drum',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we recommend you begin with that kind of mic, measured from the head it names. They are starting points, not rules: move from there and listen — there is no single right answer, and every tom is different.',
      separate: 'Distance from the rim, height above the head and the direction of the mic’s axis are separate variables: change one at a time. On a tilted tom, height is measured square to the head. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm — a mic’s acoustic centre is not the visible end of its grille, so no millimetre claim is made.',
      clearance: 'Clearance comes first. Stop the drummer before moving a mic; keep the mic, clamp, gooseneck, stand and cable out of the sticks’ path across every tom, the cymbals’ swing, the holder, the floor tom’s legs and the player’s leg. The grey hatched areas show roughly where to keep clear — leave more room on a real kit.',
      tendencies: 'Toward the rim tends to bring a higher-pitched attack; toward the centre a fuller low end — tendencies, and drums vary. With a directional mic, proximity effect also changes the lows at short distances; “closer to the centre” does not promise more bass every time.',
    },
  },
  context: {
    variant: 'rack',
    zone: 'tom1.top',
    typeId: 'tomDynSuper',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'smallDynCard' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'tomDynSuper' },
      { id: 'hypercardioid', label: 'hypercardioid', typeId: 'tomDynSuper' },
    ],
    micNoun: 'A tom dynamic',
    shield: ['tom1.shell', 'tom1.batter', 'tom1.reso', 'tom1.hoop'],
    azMax: 45,
    elMax: 30,
    aimBlurb: 'Swing the front up to 45° either way — it still points at the tom.',
    plan: { u0: -700, u1: 800, v0: -780, v1: 900 },
    side: { u0: -600, u1: 900, v0: -1050, v1: 330 },
    target: 'crash1',
    frontIds: ['fill'],
    targetWord: 'crash',
    looking: 'Top view · mic over the 10 in tom',
    prompt: 'The crash stays where the player needs it. Turn the MIC (AIM) or change its PATTERN until the crash sits in the rejection — while the mic still points at the tom.',
    activityDone: 'done — the crash sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies. Use the null to aim, not to promise silence — and some cymbal in a tom mic belongs to the kit sound.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). Pointing down at the tom, its rear faces up — toward the cymbals above.',
    shieldNote: 'A mic inside a tom (bottom head off) is shielded by the shell, which a free-field pattern ignores. Real patterns change with pitch, and cymbals are loud: this is the reasoning, not a prediction.',
    studioId: 'tm.ctx.studio',
    studioPrompt: 'A studio session: do the toms need their own mics at all?',
    studioNote: 'In the studio, a good overhead or room perspective can be the main kit sound; tom mics add focus when they help. Repeated trials are practical when the drummer stops. Switch back to LIVE for the cymbal exercise.',
    learn: {
      intro: 'These are conditional design choices, not genre rules: a wide or omni mic between toms can suit a controlled room, and a tight pattern can serve a quiet studio session.',
      points: [
        { title: 'ROLE OF THE OVERHEADS', text: 'Studio: a useful overhead or room perspective can be the main kit sound; tom mics add focus. Live: check what the acoustic kit already gives the room before adding tom channels.' },
        { title: 'HOW MUCH ISOLATION', text: 'Studio: more distant or shared perspectives may be wanted when the room and the spill are part of the sound. Live: close, directional pickup may improve the drum against loud cymbals and stage spill — test the pattern and the position.' },
        { title: 'CHANNEL COUNT', text: 'Studio: one mic per tom allows independent balance; a shared mic keeps one combined perspective. Live: fewer open mics are simpler and help with feedback — individual mics can still be right on a large, loud stage.' },
        { title: 'MOUNTING', text: 'Studio: stopped sessions allow careful moves. Live: secure, repeatable mounts and protected cables matter under vibration and changeovers.' },
      ],
      body: 'Rack toms usually sit under crash or ride cymbals: physical placement can matter more than the mic model. A pattern’s rejection helps with a cymbal above — but it does not remove a loud cymbal.',
      warn: 'No tom-mic position alone prevents feedback: the pattern, the other open mics, the monitors, the PA and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
    },
  },
  twoMic: {
    variant: 'floor',
    A: { typeId: 'tomDynSuper', pattern: 'supercardioid', zone: 'floor.top' },
    B: { typeId: 'rimCondenser', pattern: 'cardioid', zone: 'floor.bottom' },
    opposite: {
      surface: 'floor',
      note: 'Top and bottom face the two heads, which move the same way: as the batter head moves down, away from the top mic, the bottom head moves down, toward the bottom mic — so the pair starts in opposite polarity, before any arrival-time difference. A simplified picture of the drum’s lowest motion; no setting is required for a tom pair: check both states.',
    },
    learn: [
      'A bottom mic on a tom hears the resonant head — its ring and low end — not wires: a different choice from a snare’s bottom mic. Keep it only if it helps the tom in the whole kit.',
      'The same check applies whenever two mics hear one drum — a top and a bottom mic, or a tom mic and the overheads: bring in one channel at a time, compare both polarity states in mono at matched levels, and move or leave out a mic if the tom loses body. The polarity switch flips the sign; it does not remove a delay.',
    ],
    warn: 'The top and bottom mics hear DIFFERENT heads, so this simplified graph shows only the shared part of the sound — not what the pair will sound like. The notch POSITIONS follow from the arrival-time difference; their DEPTH depends on the two levels, which this model takes from distance alone — read the depths as illustrative. Judge the pair by ear, in mono, at matched levels.',
  },
  practice: {
    gain: 'tm.prac.gain',
    second: 'tm.prac.3',
    mixed: ['tm.mix.1', 'tm.mix.2', 'tm.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: a reference head, a pattern’s null, and polarity versus delay.',
  },
};
