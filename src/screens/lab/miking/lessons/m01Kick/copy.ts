/**
 * M01 KICK DRUM — the pages' kick words (engine/model/copy.ts). Moved here
 * VERBATIM from the shared pages when Lab 1's second lesson arrived
 * (2026-10-04): what the learner sees on M01 is unchanged. Owner ruling
 * 2026-10-04 applies (starting points; no sources, brands or badges).
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { KICK_ANCHORS } from './geometry.ts';

const IN = 25.4;
const PORT = KICK_ANCHORS['bd.port.center'];

export const KICK_COPY: LessonCopy = {
  variantKey: 'FRONT HEAD',
  variantShort: { ported: 'ported front head', intact: 'intact front head' },
  sceneSubject: { ported: 'a 22 × 18 in bass (kick) drum with a ported front head', intact: 'a 22 × 18 in bass (kick) drum with an intact front head' },
  viewTag: { side: 'SIDE · CUTAWAY', top: 'TOP · CUTAWAY' },
  axes: {
    x: { plus: 'past batter', minus: 'before batter', label: 'ALONG the drum', blurb: 'Toward or away from the batter head (x). Distance is read from the head the zone names.' },
    y: { plus: 'below axis', minus: 'above axis', label: 'HEIGHT', blurb: 'Up or down (y). Height above the floor is not shown — the floor line is unknown.' },
    z: { plus: 'to player’s right', minus: 'to player’s left', label: 'ACROSS', blurb: 'Toward the player’s left or right (z).' },
    surfaceY: 'A boundary plate rests on the pillow: its height is set by the cushioning.',
  },
  instrument: {
    figureBadge: 'A 22 × 18 in kick, cut open so you can see inside',
    figureLabel: 'Side view of a 22 × 18 in bass (kick) drum, cut open: the batter head on the player\'s side with the pedal and beater, the shell, and the front head facing the audience.',
    partsBadge: 'A 22 × 18 in kick, cut open · tap a part to name it',
    partsLooking: { side: 'Side view · the drum cut open', top: 'Top view · the drum cut open' },
    partsIdle: 'The beater strikes the batter head. Both heads, the air inside, the shell, the tuning and any damping all shape what you hear — the next page shows how.',
    variantNotes: { intact: 'An INTACT front head has no port. Switch FRONT HEAD to see a ported one. Work with the drum as the player brings it — no need to cut a port to match a diagram.' },
  },
  sound: {
    strikes: [
      { id: 'c', label: 'CENTRE', mm: 0, blurb: 'The exact centre of the head.' },
      { id: '1', label: '1 IN ABOVE', mm: 1 * IN, blurb: '1 in (25 mm) above the centre — a common strike point.' },
      { id: '2', label: '2 IN ABOVE', mm: 2 * IN, blurb: '2 in (51 mm) above the centre — about as high as a beater usually strikes.' },
    ],
    strikeDefault: '1',
    striker: 'BEATER',
    strikerPhrase: 'the beater',
    subject: 'Side view of the kick, cut open',
    looking: { ported: 'Side view · the kick cut open · ported front head', intact: 'Side view · the kick cut open · intact front head' },
    cells: [
      { k: 'BATTER', at: ['AT REST', 'PUSHED IN', 'PUSHED IN', 'PUSHED IN'], flex: 1.2 },
      { k: 'FRONT', at: ['AT REST', 'AT REST', 'PUSHED OUT', 'PUSHED OUT'], flex: 1.2 },
      { k: 'PORT', at: ['—', '—', 'AIR OUT', 'AIR OUT'], byVariant: { intact: ['NONE', 'NONE', 'NONE', 'NONE'] }, flex: 1 },
    ],
    reveal: 'The squeezed air pushes the front head OUTWARD, away from the player — both heads move the same way at that moment. The two heads are coupled through the air inside.',
    after: 'Then both heads spring back and keep ringing for a while — the BODY of the sound. How long depends on the tuning, the damping and the drum (the Drum Tuning Lab covers that).',
    shapesNotes: [
      'A shape is set moving only as much as the head moves at the strike point in that shape. At the exact centre, every shape with a still line across the head stands still — so a centre strike drives only the ring-shaped ones. Beaters usually strike at the centre or 1–2 in above it.',
      'This is a simplified head in empty space. On a real kick, the air inside and the second head pull these numbers around — the next step shows the two heads working together.',
    ],
    coupledSubject: 'Side view of the kick',
    coupledNote: 'One strike sets both going; the sound you hear is the two together. A port lets some of the squeezed air out — the moving air that can pop a mic at the port.',
    silentNote: 'This lab never plays a sound and draws no frequency curve for the drum: how a real kick sounds depends on the drum, the heads, the tuning, the beater and the player. The pictures show where the sound comes from and where it leaves.',
  },
  setting: {
    kitA11y: 'The drum kit from above: the kick in the middle, its pedal and the throne behind it, the hi-hat and snare to the player\'s left, the floor tom to the right, two rack toms over the kick, and the cymbals above.',
    kitLanding: 'Tap anything around the kick — or step through ITEM — to see what it means for a kick mic. There is nothing to answer yet.',
    kitIdle: 'The kick sits in the middle of the kit, on the floor, with the player behind its batter head. Everything around it is either the player’s space or a loud neighbour.',
    leftHanded: 'Many left-handed players set the kit up mirrored — the hi-hat on the right, the floor tom on the left.',
    stageA11y: 'The kit on a stage, from above: the drummer\'s fill monitor beside the throne, a downstage wedge on the audience side of the kick, and the audience and PA to the right.',
    studioA11y: 'The kit in a studio room, from above: no monitors on the floor; the room\'s walls around it.',
    stageIdle: 'Two floor monitors: the drummer’s own fill beside the throne, and another player’s wedge on the audience side. The front head faces the audience and the PA.',
    studioIdle: 'No monitors on the floor. The room itself is part of the picture now.',
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'Is the front head intact or ported, and what should the kick do — a supportive pulse, a defined attack, a resonant note, or a mix? Hear the drum without reinforcement first. If its tuning or damping needs work, agree it with the player (the Drum Tuning Lab covers that): mic placement cannot fix a drum that does not make the wanted sound acoustically.' },
      { title: 'WORK WITH THE DRUM AS IT IS', text: 'The drum is the player’s. Mic the drum they bring — no need to cut a port or change the drum to match a diagram.' },
    ],
  },
  placement: {
    workedZone: { ported: 'in.near', intact: 'reso.level' },
    workedLine: 'This starting point also places the mic relative to {line}: “a little off the line” is drawn as a range you can see.',
    workedAim: 'Face the mic toward {head} — the lab counts anything within ±{tol}°. Distance, height and angle are separate things to try.',
    workedClear: 'Clear of every part — heads, beater, damping, port edge and pedal. Clearance comes first, before any number, and the drummer stops before a real mic moves.',
    blocked: { intact: ' A stand mic cannot pass an intact head: mic it from outside.' },
    reveal: 'Moving toward the front head tends to bring more resonance — and drums vary, so “it depends on this drum” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear, not a promised result.',
    typeNotes: { kickDynCard: 'Ideas to try with this kind of mic: a few centimetres from the batter head (lots of attack, dry), or midway between the heads (less attack). Another experiment on a real drum: turn the mic away from where the beater strikes, and listen for whether the attack eases.' },
    note: 'Clearance comes first: stop the drummer before moving a real mic. Port air can pop a mic — try changing the mic’s angle in the hole rather than pushing it farther in, if that would narrow the clearance.',
    availableLead: 'Starting points for this mic and head',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we suggest you begin with that kind of mic, measured from the head it names. They are starting points, not rules: move from there and listen — there is no single right answer, and every drum is different.',
      separate: 'Height, distance and angle are separate variables: change one at a time. A starting point that names an aim (“facing the beater”) counts only while the mic faces that head. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm — a mic’s acoustic centre is not the visible end of its grille, so no millimetre claim is made.',
      clearance: 'Clearance comes first. Stop the drummer before moving a mic; keep the mic, stand and cable clear of both heads, the beater, the port edge, the damping and the pedal. Keep-clear areas appear as the mic gets close — in red, with the reason, if a move is stopped — and show roughly where to keep clear — leave more room on a real kit.',
      tendencies: 'Moving toward the beater side often increases the emphasis of attack; toward the front head can reveal more resonance — tendencies, and drums vary. With a directional mic, proximity effect also changes the lows as it nears a radiating surface; how much depends on the source’s size and the mic, and close to a large head it is usually less than a point-source chart suggests.',
    },
  },
  context: {
    zone: 'out.edge',
    typeId: 'kickDynSuper',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'kickDynCard' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'kickDynSuper' },
      { id: 'hypercardioid', label: 'hypercardioid', typeId: 'kickDynSuper' },
    ],
    micNoun: 'A kick dynamic',
    shield: ['kick.shell', 'kick.batter', 'kick.reso', 'kick.resoPorted'],
    azMax: 45,
    elMax: 30,
    aimBlurb: 'Swing the front up to 45° either way — it still faces the front head.',
    plan: { u0: -800, u1: 1650, v0: -780, v1: 1060 },
    side: { u0: -750, u1: 1650, v0: -420, v1: 330 },
    target: 'downstage',
    frontIds: ['fill'],
    targetWord: 'monitor',
    looking: 'Top view · mic just outside the front head',
    prompt: 'The monitor stays where the stage needs it. Turn the MIC (AIM) or change its PATTERN until the downstage wedge sits in the rejection.',
    activityDone: 'done — the downstage wedge sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and often least at low frequencies — where kick feedback lives. Use the null to aim, not to promise silence.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). The downstage wedge sits below the mic too, so with a cardioid only a tilt brings it near the null.',
    shieldNote: 'A mic INSIDE the drum is also shielded by the shell and both heads, which a free-field pattern ignores. Check placement before the performance; real patterns change with pitch and the stage reflects sound — this is the reasoning, not a prediction.',
    studioId: 'k.ctx.studio',
    studioPrompt: 'A studio session has no wedge to reject. The decision changes: what is the room worth?',
    studioNote: 'In the studio, repeated trials are practical when the performer stops; a second mic can offer a complementary perspective if it improves the combined sound. Switch back to LIVE for the monitor exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not restrictions: an intact front head may be miked from outside on stage, and an internal close mic may suit a studio session.',
      points: [
        { title: 'HOW MUCH ROOM', text: 'Studio: an outside or more distant perspective may help when the room contributes usefully. Live: stage spill and the available gain before feedback may favour close, directional pickup.' },
        { title: 'HOW MANY MICS', text: 'Studio: a second mic can offer a complementary perspective if it improves the combined sound. Live: start with the open mics actually needed — extra channels add spill and acoustic interactions.' },
        { title: 'WHAT THE KICK NEEDS TO DO', text: 'Studio: judge it against the bass and the kit perspective. Live: first consider the acoustic kick the audience already hears, and what the PA needs to add.' },
        { title: 'MOUNTING', text: 'Studio: repeated trials are practical when the performer stops. Live: stable, repeatable mounting and a protected cable route matter most during a show.' },
      ],
      body: 'On a real stage the monitors stay where the players need them: you turn the mic or choose its pattern so that a null faces a loud unwanted source. A drummer’s own fill usually sits in front of a kick mic aimed at the drum, where no pattern rejects; the drum itself shields an inside mic.',
      warn: 'No kick-mic position alone prevents feedback: the monitors and PA, channel gain and EQ, the room and the open mics all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
    },
  },
  twoMic: {
    A: { typeId: 'boundaryHalf', pattern: 'halfCardioid', zone: 'in.pillow' },
    B: { typeId: 'kickDynSuper', pattern: 'supercardioid', pose: { p: { x: PORT.x + 90, y: PORT.y, z: PORT.z }, az: 0, el: 0 } },
    learn: [
      'A common idea: a boundary mic inside for the attack, and a kick dynamic near the port for low-frequency weight. The point is to blend two different perspectives — two mics are not automatically better. Start with each mic useful on its own.',
      'When the second channel goes in: hear the pair at the intended levels in MONO, compare both polarity states at a controlled, matched level — a louder state almost always sounds “better” at first — and check it with the rest of the kit. If it loses body or turns uneven, adjust position and level, or leave the second mic out.',
    ],
    warn: 'The inside and outside mics hear DIFFERENT surfaces of the drum, so this simplified graph shows only the shared part of the sound — not what the pair will sound like. Judge the pair by ear, in mono, at matched levels. The notch POSITIONS follow from the arrival-time difference; their DEPTH depends on the two levels, which this model takes from distance alone (1/r) — that does not hold a few centimetres from a 56 cm head, so read the depths as illustrative only. 3:1 is a spill guideline for mics on different sources; it says nothing about this pair.',
  },
  practice: {
    gain: 'k.prac.gain',
    second: 'k.prac.3',
    mixed: ['k.mix.1', 'k.mix.2', 'k.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: a reference head, a pattern’s null, and polarity versus delay.',
  },
};
