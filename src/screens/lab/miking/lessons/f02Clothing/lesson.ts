/**
 * F02 CLOTHING AND BODY MOVEMENT — the lesson's pages as DATA. The words come
 * from the owner's lesson (docs/labs/miking/source_text/F02-Clothing-and-Body-
 * Movement-Miking-Technique.txt, "L<n>" in COMMENTS only) with the
 * corrections of foley_clothing/SOURCES.md §c applied and logged
 * (CORRECTIONS_LOG.md, Lab 6 · group 1): no institutional wording (F02-C1);
 * "up to about 3 m for a rain cover" (F02-C2); cross-links to unbuilt
 * lessons dropped (F02-C3).
 *
 * One Foley artist and a leather jacket — HELD, WORN, or at a LIVE station —
 * on the shared Foley stage (frame F). Suggested, possible starting points;
 * no source, brand or model in learner text; fully silent.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { matchedLevels, nullOnPaper, polarityDelay, removeDelay, superNull } from '../shared/bowed/bowedItems.ts';
import { BRAND_REASON, CLEAR_REASON, DOC_REASON, LOUD_REASON, SHOCK_REASON, clearanceDiag, feedbackFoley, foleyGain, foleyRating, hearingDiag, noProvoke, repeatSymptom, shotgunRoom, thumpSymptom, type FoleyWords } from '../shared/foley/foleyItems.ts';
import { liveBooth } from '../shared/foley/stage.ts';
import type { SpExtra } from '../shared/smallperc/family.ts';
import { F02_MODEL, FLOOR } from './geometry.ts';
import { F02_ZONES } from './model.ts';
import { F02_COPY } from './copy.ts';

const W: FoleyWords = { p: 'f02', what: 'cloth', loudest: 'the biggest coat flap', movement: 'the artist’s whole gesture' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the cloth pass',
    goal: 'Get to know a Foley cloth pass as a sound source — a real garment, moved precisely in time with the picture, in a quiet room — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A cloth pass is a performance with a real garment: the fold flexing and rubbing, and the whole garment’s weight. It is quiet, so the room is close under it.',
  },
  sound: {
    title: 'Where a cloth sound comes from',
    goal: 'See how a move becomes sound — the fold flexing and rubbing, the whole garment swinging and settling — and where it goes: all round the garment, quietly, the room close under it.',
    credit: { scenarios: ['f02.snd.1', 'f02.snd.2', 'f02.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'The detail comes from the fold; the body from the whole garment. A precise move gives a shaped sound; a crumpled ball gives noise — and because cloth is quiet, the distance decides how much room comes with it.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Know what else reaches a cloth mic — breath, jewellery, steps, the room’s hum and air — what the garment must never touch, and the difference between a cloth pass and lav rustle under dialogue.',
    credit: { scenarios: ['f02.set.1', 'f02.set.2', 'f02.set.hear'], note: 'Answer the three checks.' },
    takeaway: 'Define the action, listen to the room, rehearse the largest gesture, keep the garment off the mic, mount, cable and stand — and keep cloth away from hot lights and connectors. Hearing comes first.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a cloth mic by its properties — a short shotgun or a small supercardioid, low self-noise for quiet cloth, a shock mount — and compare them in the actual room.',
    credit: { scenarios: ['f02.mic.tube', 'f02.mic.1', 'f02.mic.2', 'f02.rec.1'], note: 'Answer the four checks (one reaches back to where a cloth sound comes from).' },
    takeaway: 'A short shotgun narrows only in the highs and colours what it hears off its axis indoors; a small supercardioid is smoother and can sit closer. Quiet cloth asks for a quiet mic and gain chain. Compare in the room, at matched level.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — about 1–1.5 m from the active fabric, in front and a little above — then try the close detail start just outside the gesture, and see what changes.',
    credit: { scenarios: ['f02.place.1', 'f02.place.2', 'f02.place.3', 'f02.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the gesture, inside two different starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A starting point is a place to begin, read from the active fabric to the capsule — not a rule. Closer brings detail and risk; farther brings the garment and the room. The whole gesture stays clear.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the cloth mic so its rejection faces the wedge at a live station — and know why a quiet Foley stage and a theatre with a PA need different first plans for a quiet sound.',
    credit: { scenarios: ['f02.ctx.1', 'f02.ctx.2', 'f02.ctx.ring', 'f02.ctx.studio', 'f02.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the four checks.' },
    takeaway: 'On a quiet stage, about 1–1.5 m out and the room part of the sound. Live, a close directional mic at a fixed station, the wedge in its rejection, one open channel if that is what works — and feedback never provoked.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a garment mic and a room mic can sound hollow together, how the arrival-time difference places comb notches, and why a moving garment makes any one alignment only locally true.',
    credit: { scenarios: ['f02.two.1', 'f02.two.2', 'f02.two.3', 'f02.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two mics hear the cloth at different times. Add the room mic for an interior only if it helps, check the pair in mono over the whole action, move or rebalance first — and keep separate performances apart from simultaneous mics.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the performance and the garment first, then the room, the stand and its shock mount, the distance and the gain — before reaching for a filter, noise reduction or a gate.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up a cloth mic in the right order, choose and justify a setup for a quiet stage and a live station, and say what would justify a second mic.',
    credit: { scenarios: ['f02.prac.order', 'f02.prac.gain', 'f02.prac.setup1', 'f02.prac.setup2', 'f02.prac.3', 'f02.mix.1', 'f02.mix.2', 'f02.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real stage.' },
    takeaway: 'A defined action, the whole gesture clear, a starting point read to the capsule, a quiet room and gain chain, and a mono check for a second mic pass. A brand or a louder signal do not — and more than one setup can pass.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only: f02.snd.* L5–L6 · f02.set.* L6, L8, L27 ·
 * f02.mic.* L25 · f02.place.* L13–L23 · f02.ctx.* L33–L34 · f02.two.* L30–L31 ·
 * f02.prac.* / f02.mix.* L46–L57.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'f02.snd.1',
    page: 'sound',
    prompt: 'Where does the sharp detail of a cloth pass start?',
    options: ['Where the fabric flexes and rubs over itself', 'In the artist’s hands as they close on the jacket', 'In the air the garment pushes as it swings'],
    correct: 'Where the fabric flexes and rubs over itself',
    explain: 'The detail starts at the fold — leather flexing, a sleeve rubbing the body. The whole garment’s swing adds the body and weight. Aim at the part that actually moves.',
    why: {
      'In the artist’s hands as they close on the jacket': 'Hands can rub and clasp, but the cloth’s own detail is the fabric flexing and rubbing.',
      'In the air the garment pushes as it swings': 'Moving air is not much of the sound; the fabric rubbing and flexing is.',
    },
  },
  {
    id: 'f02.snd.2',
    page: 'sound',
    prompt: 'The artist crumples the jacket into a ball. What tends to happen to the sound?',
    options: ['Noise without shape, whatever the mic', 'A cleaner sound, as the fabric is quieter', 'The same sound, only a little louder overall'],
    correct: 'Noise without shape, whatever the mic',
    explain: 'Bunched up, the fabric rubs everywhere at once: undifferentiated noise instead of a movement. Use the whole item, moved precisely and strategically — the mic can only hear what the performance makes.',
    why: {
      'A cleaner sound, as the fabric is quieter': 'Crumpling makes more rubbing, not less — and none of it follows the action.',
      'The same sound, only a little louder overall': 'The character changes: a shaped movement becomes noise.',
    },
  },
  {
    id: 'f02.snd.3',
    page: 'sound',
    prompt: 'Why does the room matter more for cloth than for a loud prop?',
    options: ['Cloth is quiet, so room noise sits close under it', 'Fabric reflects more of its sound off the room’s walls', 'A room only adds noise to quiet mics'],
    correct: 'Cloth is quiet, so room noise sits close under it',
    explain: 'A quiet source needs more gain, and the room’s hum, air and traffic come up with it. That is why the room is checked first, and why distance matters so much for cloth.',
    why: {
      'Fabric reflects more of its sound off the room’s walls': 'The fabric does not change the walls; its quietness brings the room’s noise up with the gain.',
      'A room only adds noise to quiet mics': 'Every mic hears the room; quiet sources simply leave less margin above it.',
    },
  },
  {
    id: 'f02.set.1',
    page: 'setting',
    prompt: 'Before recording the cloth pass, what do you rehearse?',
    options: ['The largest gesture, against the mic, mount and cable', 'Only the quietest move, so the gain can be set from it', 'A still pose, so the stand can go up close to it'],
    correct: 'The largest gesture, against the mic, mount and cable',
    explain: 'Rehearse the biggest move first and check the garment cannot brush the mic, mount, cable or stand. Clearance of the whole gesture comes before any distance.',
    why: {
      'Only the quietest move, so the gain can be set from it': 'The quiet moves matter for noise, but the largest gesture decides the clearance.',
      'A still pose, so the stand can go up close to it': 'A still pose hides the swing. The whole gesture sets the clearance.',
    },
  },
  {
    id: 'f02.set.2',
    page: 'setting',
    prompt: 'Will a lav clipped under the costume record a faithful cloth pass?',
    options: ['No — that is unwanted rustle, a different problem', 'Yes — that close to the fabric it sounds truest', 'Yes — if it is taped tightly so it cannot move'],
    correct: 'No — that is unwanted rustle, a different problem',
    explain: 'A Foley cloth pass is a performance miked from outside. Fabric rubbing on a dialogue lav is unwanted noise under speech — a different problem, which is why bed scenes are often boomed instead.',
    why: {
      'Yes — that close to the fabric it sounds truest': 'Contact with the capsule is not the garment’s sound; it is rubbing noise at the mic.',
      'Yes — if it is taped tightly so it cannot move': 'Taping helps a dialogue lav; it does not make a lav under fabric a faithful cloth pass.',
    },
  },
  foleyRating(W),
  {
    id: 'f02.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · What gives a cloth pass its detail?',
    options: ['The fold flexing and rubbing in a precise move', 'The artist’s breath, close to the garment', 'The stand’s vibration, carried into the mic'],
    correct: 'The fold flexing and rubbing in a precise move',
    explain: 'The detail is the fabric’s own flexing and rubbing, performed precisely. Breath and stand thumps are what the setup keeps out.',
    why: {
      'The artist’s breath, close to the garment': 'Breath is one of the noises a cloth mic keeps off its axis.',
      'The stand’s vibration, carried into the mic': 'Stand thumps are unwanted: a shock mount keeps them out.',
    },
  },
  shotgunRoom(W, 'microphone'),
  {
    id: 'f02.mic.1',
    page: 'microphone',
    prompt: 'Quiet cloth sounds hissy under a low-output mic and high gain. A fair thing to compare?',
    options: ['A lower-noise mic and a quiet gain chain', 'More treble, to lift the cloth over the hiss', 'A louder, faster crumple of the garment'],
    correct: 'A lower-noise mic and a quiet gain chain',
    explain: 'For subtle fabric, a mic with low self-noise and a quiet gain chain can matter — check the real specifications and the noise in the room. A louder crumple changes the sound into noise.',
    why: {
      'More treble, to lift the cloth over the hiss': 'Treble lifts the hiss too. The noise has to be lower at the source.',
      'A louder, faster crumple of the garment': 'That turns a shaped move into noise. Lower the noise instead.',
    },
  },
  {
    id: 'f02.mic.2',
    page: 'microphone',
    prompt: 'Why does the close detail start use the small supercardioid, not the shotgun?',
    options: ['Its body sits behind its capsule', 'It is more sensitive than a shotgun is', 'A shotgun cannot be used for cloth at all'],
    correct: 'Its body sits behind its capsule',
    explain: 'A shotgun’s tube reaches about 20 cm ahead of its capsule, toward the fabric. Close up, a small supercardioid keeps its body behind its capsule — and is smoother off its axis. Both are fair choices farther back.',
    why: {
      'It is more sensitive than a shotgun is': 'Sensitivity varies by model; the reason here is the tube’s reach.',
      'A shotgun cannot be used for cloth at all': 'Many cloth passes use a shotgun — the garment start is drawn with one.',
    },
  },
  {
    id: 'f02.place.1',
    page: 'placement',
    prompt: 'You move from about 1.25 m to the close start at about 60 cm. What tends to change?',
    options: ['More detail and finger rub, less room', 'More room and more of the whole garment', 'Only the level, not the balance of sounds'],
    correct: 'More detail and finger rub, less room',
    explain: 'Closer, the friction point and the hands come forward and the room drops — and a narrow detail may not suit a wide shot. Farther, the whole garment and the room join.',
    why: {
      'More room and more of the whole garment': 'That is what moving FARTHER tends to do.',
      'Only the level, not the balance of sounds': 'Distance changes the balance of detail, garment and room — not only the level.',
    },
  },
  {
    id: 'f02.place.2',
    page: 'placement',
    prompt: 'The picture cuts from a wide shot to a close-up of the sleeve. A fair idea?',
    options: ['Bring the mic closer for the close-up', 'Keep the same distance for each shot', 'Use a louder garment for the close-up'],
    correct: 'Bring the mic closer for the close-up',
    explain: 'One working method: far away for a long shot, closer for a close-up — matching the picture’s perspective. It is an idea to try, not a fixed mapping from shot to distance.',
    why: {
      'Keep the same distance for each shot': 'That can work, but the perspective then stays the same while the picture changes.',
      'Use a louder garment for the close-up': 'A different garment changes the character, not the perspective.',
    },
  },
  {
    id: 'f02.place.3',
    page: 'placement',
    prompt: 'A rain cover’s texture sounds thin at 1.25 m. Another idea to try?',
    options: ['Farther back, up to about 3 m', 'A closer mic, right on the fabric', 'A filter to add body later'],
    correct: 'Farther back, up to about 3 m',
    explain: 'For some textures — a rain cover — one team moves the mic farther, up to about 3 m: the texture blends with the space. Check the room’s noise first.',
    why: {
      'A closer mic, right on the fabric': 'Closer narrows to a friction point; a broad texture often wants more distance.',
      'A filter to add body later': 'A filter cannot add the space a farther mic hears.',
    },
  },
  {
    id: 'f02.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What must the garment never touch?',
    options: ['The mic, its mount, cable or stand', 'The artist’s own body as it moves', 'The floor, when it hangs down low'],
    correct: 'The mic, its mount, cable or stand',
    explain: 'Rehearse the largest gesture: the garment never brushes the mic, mount, cable or stand. A brush is noise and a collision risk.',
    why: {
      'The artist’s own body as it moves': 'Sleeve against body is part of the sound — what must stay clear is the rig.',
      'The floor, when it hangs down low': 'The floor is not the risk here; the mic and its stand are.',
    },
  },
  {
    id: 'f02.ctx.1',
    page: 'context',
    prompt: 'A live theatre: a cloth effect through the PA, a wedge in front. A fair first plan?',
    options: ['A close mic at a fixed station, the wedge in its rejection', 'A room mic farther back so the cloth sounds natural to the hall', 'Two mics open at once, so there is more to choose from'],
    correct: 'A close mic at a fixed station, the wedge in its rejection',
    explain: 'A quiet sound needs gain: a close directional mic at a fixed, repeatable station raises the cloth against the PA, with the wedge in its rejection and the whole body still clear.',
    why: {
      'A room mic farther back so the cloth sounds natural to the hall': 'Farther away a quiet sound runs out of gain before feedback live.',
      'Two mics open at once, so there is more to choose from': 'Each open mic takes margin away. One open channel may be the practical priority.',
    },
  },
  superNull('f02.ctx.2', 'context', 'wedge'),
  noProvoke(W, 'context'),
  {
    id: 'f02.ctx.studio',
    page: 'context',
    prompt: 'A quiet Foley stage, a cloth pass for a medium shot. A fair first plan?',
    options: ['One mic about 1–1.5 m from the fabric, a quiet room', 'A lav sewn into the jacket’s collar for the detail', 'Two mics either side of the artist, summed for a wider sound'],
    correct: 'One mic about 1–1.5 m from the fabric, a quiet room',
    explain: 'On a quiet stage one mic about 1–1.5 m from the active fabric, in front and a little above, with a quiet room and gain chain, is a place to begin.',
    why: {
      'A lav sewn into the jacket’s collar for the detail': 'A lav under fabric hears rustle at the capsule, not the garment’s performance.',
      'Two mics either side of the artist, summed for a wider sound': 'Two summed mics add a delay and a comb. Start with one.',
    },
  },
  {
    id: 'f02.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Why is a cloth sound so close to the room’s noise?',
    options: ['Cloth is quiet, so it needs a lot of gain', 'Cloth makes most of its sound in the lows', 'The room’s walls absorb the cloth sound'],
    correct: 'Cloth is quiet, so it needs a lot of gain',
    explain: 'A quiet source needs gain, and the room’s noise comes up with it — on a quiet stage and, with the PA, even more so live.',
    why: {
      'Cloth makes most of its sound in the lows': 'Cloth has plenty of high detail; the issue is how quiet it is.',
      'The room’s walls absorb the cloth sound': 'The walls reflect it; the problem is the noise floor under a quiet sound.',
    },
  },
  {
    id: 'f02.two.1',
    page: 'twoMic',
    prompt: 'A garment mic at 1.25 m and a room mic at 3 m sound hollow together. Why?',
    options: ['They hear each move at different times', 'The room mic reverses the cloth’s polarity', 'The garment mic is louder, so the two cancel'],
    correct: 'They hear each move at different times',
    explain: 'The room mic hears each move later. Summed, some pitches arrive out of step and cancel. Move or rebalance first; check polarity at matched levels as a diagnostic.',
    why: {
      'The room mic reverses the cloth’s polarity': 'Both face the same garment; the difference is when the sound arrives.',
      'The garment mic is louder, so the two cancel': 'Level alone does not cancel; the arrival-time difference makes the notches.',
    },
  },
  polarityDelay('f02.two.2'),
  matchedLevels('f02.two.3'),
  {
    id: 'f02.two.4',
    page: 'twoMic',
    prompt: 'Two characters each need a jacket pass. Is that a two-mic setup?',
    options: ['Two passes, one after the other, can each use one mic', 'Yes: each character needs its own mic at once', 'Yes: two garments need two microphones at once'],
    correct: 'Two passes, one after the other, can each use one mic',
    explain: 'Separate performances or layers are not simultaneous multi-mic capture. Record each character’s pass on its own when it helps, and keep notes of which tracks belong together.',
    why: {
      'Yes: each character needs its own mic at once': 'Two passes recorded one after the other each need only one mic.',
      'Yes: two garments need two microphones at once': 'Extra channels add room and editing; add them for a reason.',
    },
  },
  foleyGain(W),
  {
    id: 'f02.prac.3',
    page: 'practice',
    prompt: 'What would justify a second mic for a cloth pass?',
    options: ['An interior whose space it adds, mono holding', 'More channels give the mix more of a choice', 'The garment needs more level than one mic gives'],
    correct: 'An interior whose space it adds, mono holding',
    explain: 'For a spacious interior, a farther mic can add the room — if it helps the scene and the pair holds up in mono over the whole action. An exterior often wants one mic.',
    why: {
      'More channels give the mix more of a choice': 'More channels also mean more room and noise. Add a mic for a reason.',
      'The garment needs more level than one mic gives': 'Level comes from gain and distance, not a second mic.',
    },
  },
  {
    id: 'f02.mix.1',
    page: 'practice',
    prompt: 'Same jacket, same mic at 1.25 m: a precise fold, then a crumple. Why might they differ?',
    options: ['The performance makes the shape, not the mic', 'The mic hears leather less well when it moves fast', 'They cannot: the mic and distance are the same'],
    correct: 'The performance makes the shape, not the mic',
    explain: 'Same mic, same place, different performance: one shaped movement, one noise. The mic only hears what the move makes.',
    why: {
      'The mic hears leather less well when it moves fast': 'The mic hears both; what differs is the sound the fabric makes.',
      'They cannot: the mic and distance are the same': 'The performance changes the sound before any mic hears it.',
    },
  },
  nullOnPaper('f02.mix.2', 'wedge'),
  removeDelay('f02.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'f02.sym.thin',
    observation: 'A thin swish with no garment body',
    firstChecks: 'Use the whole item and change the performance; then a position that covers more of the moving garment — and check the room’s noise before moving far back.',
    options: ['The whole garment and the move, then a wider position', 'Boost the low end on the channel until the swish has a body', 'Move the mic right onto the fold'],
    correct: 'The whole garment and the move, then a wider position',
    explain: 'A swatch or a small move gives a thin sound. Use the whole jacket, perform the move fully, then try a position that hears more of the garment.',
    why: {
      'Boost the low end on the channel until the swish has a body': 'EQ cannot add the weight of a garment that was not performed.',
      'Move the mic right onto the fold': 'Closer narrows to the friction point — even less body.',
    },
  },
  {
    id: 'f02.sym.breath',
    observation: 'Too much breath, steps or speech in the cloth',
    firstChecks: 'Aim at the active cloth, change the artist’s orientation, or separate the cloth pass from the rest.',
    options: ['Aim at the cloth, turn the artist, separate the pass', 'Turn the gain up so the cloth covers the breath', 'Ask the artist to hold their breath for the take'],
    correct: 'Aim at the cloth, turn the artist, separate the pass',
    explain: 'Keep the face and feet off the mic’s axis: aim at the active fabric, turn the artist a little, or perform the cloth separately.',
    why: {
      'Turn the gain up so the cloth covers the breath': 'Gain lifts the breath as much as the cloth.',
      'Ask the artist to hold their breath for the take': 'Breathing is part of performing; change the geometry instead.',
    },
  },
  {
    id: 'f02.sym.colour',
    observation: 'The shotgun sounds harsh and coloured in the room',
    firstChecks: 'The position and the axis; then a small supercardioid without a tube in the same place.',
    options: ['The axis and position, then a small supercardioid', 'Add a second shotgun beside it to smooth the sound out', 'Turn the mic away to hear less of the cloth'],
    correct: 'The axis and position, then a small supercardioid',
    explain: 'Indoors, a shotgun’s off-axis sound can be coloured by reflections. Check its aim and place, then compare a small supercardioid at the same spot.',
    why: {
      'Add a second shotgun beside it to smooth the sound out': 'A second mic adds a comb, not smoothness.',
      'Turn the mic away to hear less of the cloth': 'That hears more of the coloured off-axis sound.',
    },
  },
  thumpSymptom(W),
  feedbackFoley(W),
  repeatSymptom(W),
];

const orderTasks: OrderTask[] = [
  {
    id: 'f02.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a cloth-pass setup in the order you would do them.',
    steps: [
      { text: 'Define the action: the garment, the move, the shot', early: 'Start with what the scene needs.' },
      { text: 'Inspect the room and record a quiet baseline', early: 'Know the noise floor before the mic goes up.' },
      { text: 'Rehearse the largest gesture; choose a mic with a shock mount', early: 'The gesture and the room come first.' },
      { text: 'Place it outside the gesture, aimed at the active fabric', early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs; then switch phantom on if the mic needs it', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set gain on the soft and the loud moves, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Record the whole action; change one variable at a time', early: 'Compare only once the level is set safely.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower the monitoring before switching it, and follow the mic’s manual. Gain: use the real soft and loud passages, watch the peaks and the noise floor.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'f02.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A quiet Foley stage, a medium shot: a character in a leather jacket. The artist holds the jacket. Phantom power available.',
    setups: [
      { id: 'a', label: 'Short shotgun about 1.25 m out, a little above, aimed at the fold', ok: true, power: 'phantom', feedback: 'A suggested starting point: the whole garment with some room — check the room noise.' },
      { id: 'b', label: 'Small supercardioid about 60 cm out, just outside the gesture', ok: true, power: 'phantom', feedback: 'A suggested trial: more detail — check finger rub and the largest gesture.' },
      { id: 'c', label: 'A lav clipped inside the jacket', ok: false, power: 'phantom', feedback: 'That records rustle at the capsule, not the performance.' },
      { id: 'd', label: 'A mic 20 cm from the fold, inside the swing', ok: false, power: 'phantom', feedback: 'Inside the gesture: the jacket will hit it. Keep the whole gesture clear.' },
      { id: 'e', label: 'The jacket crumpled close to the mic for more level', ok: false, power: 'phantom', feedback: 'A crumple is noise without shape. Perform the move precisely.' },
    ],
    reasons: [DOC_REASON('the active fabric'), CLEAR_REASON('the whole gesture'), { id: 'r.power', label: 'The channel gives the condenser the phantom power it needs', role: 'required', feedback: 'Say how the mic is powered: these condensers need phantom power.' }, SHOCK_REASON, BRAND_REASON, LOUD_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point read from the active fabric, clearance of the whole gesture, and the power the mic needs.',
  },
  {
    id: 'f02.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A live theatre: a coat’s movement performed at a station beside the stage, through the PA, a wedge in front.',
    setups: [
      { id: 'a', label: 'Small supercardioid close at a fixed station, the wedge in its rejection', ok: true, power: 'phantom', feedback: 'A suggested starting point for live: close, repeatable, aimed — check at show level with the operator.' },
      { id: 'b', label: 'Short shotgun about 1 m out, the wedge off its rear to one side', ok: true, power: 'phantom', feedback: 'A fair live choice if the gain before feedback holds — check with the operator.' },
      { id: 'c', label: 'A room mic 3 m back for a natural sound', ok: false, power: 'phantom', feedback: 'A quiet sound from 3 m runs out of gain before feedback live.' },
      { id: 'd', label: 'Push the gain until it rings, then back it off', ok: false, power: 'phantom', feedback: 'Never provoke feedback. Check with the operator, short of any ring.' },
      { id: 'e', label: 'A lav on the artist’s chest under the coat', ok: false, power: 'phantom', feedback: 'That records rustle at the capsule, not the coat’s movement.' },
    ],
    reasons: [DOC_REASON('the active fabric'), CLEAR_REASON('the whole gesture'), { id: 'r.null', label: 'The pattern’s rejection faces the wedge', role: 'required', feedback: 'Say where the wedge sits against the pattern.' }, { id: 'r.op', label: 'The gain is checked with the operator at show level', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, { id: 'r.ring', label: 'Find the edge of feedback, then back off', role: 'wrong', feedback: 'Feedback is never provoked — not even to find the edge.' }],
    explain: 'Two setups pass. What passes is the reasoning: a close, repeatable pickup, the wedge in its rejection, clearance of the whole gesture, and gain checked with the operator — never by making it ring.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: where does a cloth pass get its sharp detail?', options: ['From the hands', 'From the fold flexing and rubbing', 'From the room'], after: 'Now STEP through (or PLAY ONCE) and watch the hands, the fold, the swing and the room.' },
  microphone: { prompt: 'Before you move anything: where will the supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move from about 1.25 m to about 60 cm from the fabric. What changes?', options: ['More detail and finger rub', 'More room', 'It depends on this garment'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge is on the floor in front of the artist. Where will a supercardioid aimed at the fabric reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What is a Foley cloth pass?',
    options: ['A garment performed in time with the picture', 'Dialogue rustle cleaned up later, after the shoot', 'Room tone recorded under a scene’s movement'],
    correct: 'A garment performed in time with the picture',
    explain: 'The artist moves a real garment — held or worn — in sync with the character. Rustle on a dialogue lav is a different, unwanted sound.',
    why: {
      'Dialogue rustle cleaned up later, after the shoot': 'That is unwanted noise under speech; a cloth pass is performed.',
      'Room tone recorded under a scene’s movement': 'Room tone is the quiet of a space; a cloth pass is the garment’s movement.',
    },
  },
  {
    id: 'q.2',
    covers: 'sound',
    prompt: 'Why does a cloth mic’s distance matter so much?',
    options: ['Cloth is quiet: farther, the room comes up', 'Cloth only makes its sound very near the mic', 'Fabric blocks sound going to farther mics'],
    correct: 'Cloth is quiet: farther, the room comes up',
    explain: 'A quiet source needs gain; the farther the mic, the more of the room’s noise comes up with it — and the closer, the narrower the detail.',
    why: {
      'Cloth only makes its sound very near the mic': 'Cloth sound spreads all round; it is simply quiet.',
      'Fabric blocks sound going to farther mics': 'The garment does not block the mic; the room’s noise is the issue.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'The jacket is crumpled into a ball for more sound. What happens?',
    options: ['Noise without shape, wherever the mic is', 'A clearer texture, as the fabric is denser', 'A cleaner, louder version of the same sound'],
    correct: 'Noise without shape, wherever the mic is',
    explain: 'Crumpling rubs the fabric everywhere at once: undifferentiated noise. Use the whole item, moved precisely.',
    why: {
      'A clearer texture, as the fabric is denser': 'More rubbing at once blurs the texture.',
      'A cleaner, louder version of the same sound': 'The character changes; the shaped movement is lost.',
    },
  },
  {
    id: 'q.4',
    covers: 'setting',
    prompt: 'What does the garment never touch during the pass?',
    options: ['The mic, its mount, the cable or the stand', 'The artist’s other hand or their sleeve', 'The floor when the coat swings low'],
    correct: 'The mic, its mount, the cable or the stand',
    explain: 'Rehearse the largest gesture and keep the garment off the whole rig — a brush is noise and a collision.',
    why: {
      'The artist’s other hand or their sleeve': 'Fabric against the body is part of the sound.',
      'The floor when the coat swings low': 'The floor is not the risk; the rig is.',
    },
  },
  clearanceDiag(W),
  hearingDiag(W),
];

const BOOTH = liveBooth(FLOOR);
const wedges: Wedge[] = [
  {
    id: 'wedge',
    label: 'a wedge on the floor in front of the artist, facing back at them',
    short: 'WEDGE',
    p: BOOTH.wedge.p,
    lift: 150,
    faces: BOOTH.wedge.faces,
    note: 'On the floor in front of the artist and off to their right, facing back at them: far below and behind a mic aimed at the fabric — the pattern and the tilt both decide how much of it the mic hears.',
    prov: { kind: 'illustrative', reason: 'a typical station layout; the wedge’s place is a drawing default' },
  },
];

const SP: SpExtra = {
  strikeTitle: 'Move to sound',
  plan: { box: F02_MODEL.views.top!, things: [] },
  close: { side: { u0: -800, u1: 2700, v0: -900, v1: FLOOR + 60 }, top: { u0: -800, u1: 900, v0: -950, v1: 950 } },
};

export const F02_LESSON: Lesson & { sp: SpExtra } = {
  id: 'F02',
  labId: 'field',
  title: 'Clothing and Body Movement',
  subtitle: 'A cloth pass: about 1–1.5 m from the moving fabric, a close detail outside the whole gesture, the room close under it',
  noun: { one: 'cloth pass', many: 'cloth passes' },
  model: F02_MODEL,
  micTypeIds: ['shotgunShort', 'scSupercard', 'ldcRoom', 'shotgunPole'],
  zones: F02_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A cloth pass reproduces a character’s clothes and body movement in sync with the picture: the Foley artist holds a garment — most of the time — or wears it, and performs.', src: 'FF-CLOTH' },
    { title: 'THE WHOLE GARMENT', text: 'Leather and full jackets often need the whole item, not a swatch — moved precisely, never just crumpled into a ball.', src: 'HECKER' },
    { title: 'A QUIET SOUND', text: 'Cloth is quiet. Ventilation, hum, traffic, breath, jewellery and other clothes sit close under it, so the room is part of every decision.', src: 'LESSON-F02' },
    { title: 'THE WHOLE GESTURE', text: 'The hands’ and the garment’s whole movement is a keep-out: the garment never brushes the mic, its mount, cable or stand.', src: 'LESSON-F02' },
  ],
  sound: {
    stages: [
      { title: 'The hands move it', text: 'The artist’s hands start the move, in time with the character on screen.' },
      { title: 'The fold flexes and rubs', text: 'Where the fabric bends and rubs over itself — leather creasing, a sleeve on the body — the sharp detail starts.', byVariant: { worn: 'The sleeve brushes the jacket’s body with each swing of the arm: the detail of a walking character’s clothes.' } },
      { title: 'The garment swings', text: 'The whole garment swings and settles: its weight and body join the detail.' },
      { title: 'All round, quietly', text: 'The sound spreads round the garment into the room — quietly, so the room’s own noise is close under it.' },
    ],
    attack: 'The start of a move is soft compared with an impact: the fold’s creak and the first rub. A close mic tends to hear more of this, and more of the hands.',
    body: 'Then the garment’s swing and settle, and the pause after it. A farther mic tends to hear more of the whole garment — and of the room.',
    head: { diameterMm: 0, rods: 0, label: 'the garment', strikeSrc: 'LESSON-F02' },
  },
  setting: {
    items: [
      { id: 'gesture', label: 'the hands’ and the garment’s whole gesture', short: 'THE GESTURE', note: 'Rehearse the largest move: the garment never brushes the mic, mount, cable or stand.', prov: { kind: 'illustrative', reason: 'F02 L8' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'breath', label: 'breath, jewellery, steps and other clothes', short: 'THE PERFORMER', note: 'All close to a quiet sound: aim at the active cloth, keep the face and feet off the axis.', prov: { kind: 'illustrative', reason: 'F02 L6, L45' }, tag: 'SPILL', scene: 'all' },
      { id: 'room', label: 'the room: ventilation, hum, traffic', short: 'THE ROOM', note: 'Cloth is quiet: the room’s noise comes up with the gain. Inspect it before setting the mic, and record a quiet baseline.', prov: { kind: 'illustrative', reason: 'F02 L6' }, tag: 'NOISE', scene: 'studio' },
      { id: 'lav', label: 'a dialogue lav under the costume', short: 'A DIALOGUE LAV', note: 'A different problem: rustle on a lav is unwanted noise under speech, not a cloth pass. Coordinate the boom and body mics with the speech team and the costume department.', prov: { kind: 'illustrative', reason: 'F02 L27, HAYES' }, tag: 'NOT THIS', scene: 'all' },
      { id: 'pa', label: 'the PA and the wedge', short: 'PA · WEDGE', note: 'Live, a quiet sound has little margin before feedback: a close mic, the wedge in its rejection, one open channel if needed.', prov: { kind: 'illustrative', reason: 'S-3REASONS, S-LIVE' }, tag: 'FEEDBACK PATH', scene: 'stage' },
    ],
    stage: 'LIVE: a close directional mic at a fixed station, the wedge in its rejection, the gain checked with the operator — never by making it ring.',
    studio: 'STUDIO: about 1–1.5 m from the active fabric, a quiet room and gain chain, another perspective only for a reason.',
  },
  diagnostic,
  practice: {
    task: 'Choose a cloth setup for a quiet Foley stage and for a live station, compare a close detail with the whole garment, and explain what would justify a second mic. With a real performer and their agreement, you can record what you tried below.',
    fields: [
      { id: 'cue', label: 'Scene or cue, and the wanted fabric texture', kind: 'text' },
      { id: 'garment', label: 'Garment: held or worn; the active area', kind: 'text' },
      { id: 'mic', label: 'Mic type and pattern', kind: 'choice', choices: ['short shotgun', 'small supercardioid', 'large condenser (room)', 'other'] },
      { id: 'pos', label: 'Capsule to the active fabric, nearest and farthest; height and aim', kind: 'text' },
      { id: 'clear', label: 'Largest gesture, stand and cable clearance checked', kind: 'text' },
      { id: 'notes', label: 'What you heard: detail, body, room, noise (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The garment at chest height (the floor 1200 mm below the active fabric), the jacket’s drawn size and the artist’s figure — drawing defaults.', dims: [] },
    { text: 'The gesture envelope: an arm’s reach of 750 mm swept from the shoulders — a drawing default (no source gives a clearance).', dims: [] },
    { text: 'The close detail start (40–60 cm): no close distance is published — a drawing default outside the drawn gesture.', dims: [] },
    { text: 'Every mic height, the room mic’s place (3 m), the boom pole (2 m, its tip at least 150 mm clear of the gesture) and the operator — drawing defaults.', dims: [] },
    { text: 'The live station, the PA and the wedge — drawing defaults.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — possible starting points and ideas to consider, not rules. Every garment, performer and room is different: move the mic, experiment, and trust your ears and the room. Experimentation is encouraged. The lab is silent and draws a simplified picture: one artist in a typical pose, the gesture’s reach as a keep-out, a shotgun’s narrowing as a simplified shape, mic patterns and the two-mic comb as textbook shapes. Distances are rounded to about 5 mm and measured from the active fabric to the mic’s capsule. Place real mics with the performer stopped, and only with their agreement.',
  copy: F02_COPY,
  sp: SP,
};
