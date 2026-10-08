/**
 * F01 FOLEY FOOTSTEPS AND SURFACES — the lesson's pages as DATA (blueprint
 * §7). The words come from the owner's lesson (docs/labs/miking/source_text/
 * Foley-Footsteps-and-Surfaces-Miking-Technique.txt, cited "L<n>" in COMMENTS
 * only) with the corrections of foley_footsteps/SOURCES.md §e applied and
 * logged in CORRECTIONS_LOG.md (Lab 6 · group 1): no institutional wording
 * (F01-C1); the sourced 0.9–1.8 m, "about 15 degrees" start added (F01-C2);
 * "half a metre closer" added (F01-C3); the shock-mount line added (F01-C5);
 * cross-links to unbuilt lessons dropped (F01-C6); the lab's own name (F01-C7).
 *
 * One walker in a pit, the SURFACE as the variant (tile, hollow wood,
 * gravel, carpet over wood) plus a LIVE theatre booth, on the shared Foley
 * stage (lessons/shared/foley, frame F). OWNER RULING 2026-10-04 and the
 * wording rule of 2026-10-07: suggested, possible starting points; no
 * source, brand or model in learner text; no badges; fully silent.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { matchedLevels, nullOnPaper, polarityDelay, removeDelay, superNull, hollowSymptom } from '../shared/bowed/bowedItems.ts';
import { BRAND_REASON, CLEAR_REASON, DOC_REASON, LOUD_REASON, SHOCK_REASON, capsuleRef, clearanceDiag, feedbackFoley, foleyGain, foleyRating, hearingDiag, noProvoke, repeatSymptom, shotgunRoom, thumpSymptom, type FoleyWords } from '../shared/foley/foleyItems.ts';
import { liveBooth } from '../shared/foley/stage.ts';
import type { SpExtra } from '../shared/smallperc/family.ts';
import { F01_MODEL } from './geometry.ts';
import { F01_ZONES } from './model.ts';
import { F01_COPY } from './copy.ts';

const W: FoleyWords = { p: 'f01', what: 'footstep', loudest: 'the hardest heel hit', movement: 'the walker’s whole movement' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the footstep',
    goal: 'Get to know a Foley footstep as a sound source — a shoe, a surface and the floor under it, performed in a room — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A footstep is the shoe, the surface and what lies under it, performed by a walker in a room. Choose the shoe and the surface first; the mic only hears what they make.',
  },
  sound: {
    title: 'Where a footstep comes from',
    goal: 'See how one step becomes sound — the heel, the rolling sole, the surface answering, the floor under it — and where it leaves: at floor level, spread over the whole area the walker works. Shown, never played.',
    credit: { scenarios: ['f01.snd.1', 'f01.snd.2', 'f01.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'Every step starts at the floor, at a slightly different place each time, and a hollow layer under the surface can add a boom no mic move removes. So a footstep mic looks down at the middle of the steps from outside the whole movement.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Know what else reaches a footstep mic — clothing, breath, the room, a hollow floor, and on a live stage the PA — and what to settle before any stand goes up: the shoe, the surface, the movement marked, the exit path clear.',
    credit: { scenarios: ['f01.set.1', 'f01.set.2', 'f01.set.hear'], note: 'Answer the three checks.' },
    takeaway: 'Define the step, walk the cue, mark the movement and the exit path, secure the surface — then put up a stable stand in a shock mount outside all of it. Hearing comes first, and feedback is never provoked.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a footstep mic by its properties — a short shotgun or a small supercardioid, the pattern off its axis, the power it needs, a shock mount — and compare them in the actual room, not by name.',
    credit: { scenarios: ['f01.mic.tube', 'f01.mic.1', 'f01.mic.2', 'f01.rec.1'], note: 'Answer the four checks (one reaches back to where a footstep comes from).' },
    takeaway: 'A short shotgun hears like its supercardioid capsule through the lows and mids and narrows in the highs; it does not remove the room. A small supercardioid without a tube is smoother off its axis. Compare both in the room, at matched level.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — about 0.9–1.8 m from the middle of the steps, in front or a little to one side, aimed down at where the feet land — then move the mic and see what changes.',
    credit: { scenarios: ['f01.place.capsule', 'f01.place.1', 'f01.place.2', 'f01.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the movement, inside two different starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A starting point is a place to begin, read from the middle of the steps to the capsule — not a rule. Distance, aim and height are separate tone controls, and the movement and the exit path come first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the footstep mic so its rejection faces the wedge in a live booth — and know why a quiet Foley stage and a theatre with a PA need different first plans.',
    credit: { scenarios: ['f01.ctx.1', 'f01.ctx.2', 'f01.ctx.ring', 'f01.ctx.studio', 'f01.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the four checks.' },
    takeaway: 'On a quiet stage, one directional mic and the room are a place to begin. Live, one protected mic close enough to keep the PA down in it, the wedge in its rejection, the open mics few — and feedback never provoked.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a close mic and a room mic on the same steps can blur or hollow out together, how the arrival-time difference places comb notches, and why a moving walker makes any one alignment only locally true.',
    credit: { scenarios: ['f01.two.1', 'f01.two.2', 'f01.two.3', 'f01.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two mics hear each step at different times: some pitches cancel in the sum. Bring up the close mic alone, add the second for a reason, check in mono — move or rebalance first; polarity flips the sign and never removes a delay.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — the shoe and the surface, the floor under it, the stand and its shock mount, the distance, the wedge, the gain — before reaching for EQ or a filter.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up a footstep mic in the right order, choose and justify a setup for a quiet Foley stage and a live theatre booth, and say what would justify a second mic.',
    credit: { scenarios: ['f01.prac.order', 'f01.prac.gain', 'f01.prac.setup1', 'f01.prac.setup2', 'f01.prac.3', 'f01.mix.1', 'f01.mix.2', 'f01.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real stage.' },
    takeaway: 'Shoe and surface named, the movement and the exit path clear, a starting point read to the capsule, headroom for the hardest step, and a mono check for a second mic pass. A brand or a louder signal do not — and more than one setup can pass.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only: f01.snd.* L5–L7 · f01.set.* L5–L6, L69 ·
 * f01.mic.* L9–L10 · f01.place.* L12–L23 · f01.ctx.* L55–L65 · f01.two.* L67 ·
 * f01.prac.* / f01.mix.* L70–L78.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'f01.snd.1',
    page: 'sound',
    prompt: 'Where does the sharp contact of a footstep start?',
    options: ['Where the heel meets the surface, at the floor', 'In the walker’s knee, as the leg straightens out', 'At the shoe’s laces, as the upper flexes'],
    correct: 'Where the heel meets the surface, at the floor',
    explain: 'The heel lands on the surface: the contact starts right at floor level, then the sole rolls and the surface answers. That is why a footstep mic looks down at the floor, not at the walker’s body.',
    why: {
      'In the walker’s knee, as the leg straightens out': 'Knees can creak, but the footstep’s contact starts where the shoe meets the floor.',
      'At the shoe’s laces, as the upper flexes': 'The upper can creak a little; the sharp contact is the heel on the surface.',
    },
  },
  {
    id: 'f01.snd.2',
    page: 'sound',
    prompt: 'A hard sole on a hollow wood panel sounds boomier than on concrete. Why?',
    options: ['The boards flex and the gap under them rings', 'The shoe lands with more weight when it is on wood', 'Concrete absorbs the room’s reflections'],
    correct: 'The boards flex and the gap under them rings',
    explain: 'Under a hollow panel there is air between the boards and the floor: the step flexes the boards and sets the gap ringing, a low boom that is part of the floor — not of the mic.',
    why: {
      'The shoe lands with more weight when it is on wood': 'The shoe weighs the same. What changes is what lies under the surface.',
      'Concrete absorbs the room’s reflections': 'The room is the same in both cases; the difference is under the surface.',
    },
  },
  {
    id: 'f01.snd.3',
    page: 'sound',
    prompt: 'A walker crosses the pit. What happens to the steps a fixed mic hears?',
    options: ['Nearer steps louder, farther steps quieter', 'Each step reaches the mic at the same level', 'Only the step under the mic is picked up'],
    correct: 'Nearer steps louder, farther steps quieter',
    explain: 'Each step lands somewhere else in the pit, so its distance to the mic changes: nearer steps are louder, farther ones quieter and with more room. A mic farther back evens that out a little; a closer one makes it larger.',
    why: {
      'Each step reaches the mic at the same level': 'Only if every step were the same distance away. Across a pit the distance changes from step to step.',
      'Only the step under the mic is picked up': 'The mic hears the whole pit — the steps nearer it simply come in louder.',
    },
  },
  {
    id: 'f01.set.1',
    page: 'setting',
    prompt: 'The scene shows carpet. What do you check before choosing a mic position?',
    options: ['What the carpet lies on, and the shoe for the step', 'Only the carpet’s colour, to match the picture', 'Whether a closer mic can hide the floor that lies under it'],
    correct: 'What the carpet lies on, and the shoe for the step',
    explain: 'A carpet always lies on another surface — tile, concrete, hardwood or hollow wood — and the shoe changes the step as much as the floor does. Choose the shoe and the layered surface first; then the mic.',
    why: {
      'Only the carpet’s colour, to match the picture': 'The colour does not reach the mic. What lies under the carpet does.',
      'Whether a closer mic can hide the floor that lies under it': 'No mic position removes the floor under a carpet: choose the surface that makes the wanted step.',
    },
  },
  {
    id: 'f01.set.2',
    page: 'setting',
    prompt: 'Where do the stand and its cable go for a footstep cue?',
    options: ['Outside the movement and clear of the exit path', 'Inside the pit’s rim, as near the steps as it fits', 'Across the exit path, where it is out of the way'],
    correct: 'Outside the movement and clear of the exit path',
    explain: 'Mark the whole movement — feet, arms, body, a pivot or a missed step — and the way out. The stand, the mic housing and the cable stay outside both, on a stable base that cannot swing into the performer.',
    why: {
      'Inside the pit’s rim, as near the steps as it fits': 'Inside the rim it is in the landing area. The stand goes outside the movement.',
      'Across the exit path, where it is out of the way': 'The exit path must stay clear: a stand or cable there is a trip in a hurry.',
    },
  },
  foleyRating(W),
  {
    id: 'f01.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Where does a footstep’s contact sound start?',
    options: ['At the floor, where the heel meets the surface', 'At the walker’s hips, as the weight shifts', 'Halfway between the floor and the walker’s knee'],
    correct: 'At the floor, where the heel meets the surface',
    explain: 'The contact starts at floor level and moves with every step. That is where the mic is aimed — the middle of the steps — not at the walker’s body.',
    why: {
      'At the walker’s hips, as the weight shifts': 'The hips move, but the sound of the step starts at the floor.',
      'Halfway between the floor and the walker’s knee': 'The contact is at the floor itself; the mic is aimed down at it.',
    },
  },
  shotgunRoom(W, 'microphone'),
  {
    id: 'f01.mic.1',
    page: 'microphone',
    prompt: 'You can only offer the shotgun’s channel without phantom power. What happens?',
    options: ['It will not work: this condenser needs phantom', 'It works, a little quieter than with phantom on', 'It works if the gain is turned up to make up'],
    correct: 'It will not work: this condenser needs phantom',
    explain: 'A shotgun is a condenser: it needs phantom power (or its own supply) to work. Mute the outputs and lower the monitors before switching phantom on, and follow the mic’s manual.',
    why: {
      'It works, a little quieter than with phantom on': 'A condenser without its power does not just get quieter — it does not work.',
      'It works if the gain is turned up to make up': 'Gain cannot power a condenser. It needs phantom power from the desk or its own supply.',
    },
  },
  {
    id: 'f01.mic.2',
    page: 'microphone',
    prompt: 'You turn a shotgun a little away from the steps. What tends to change first?',
    options: ['The tone of the steps, not only their level', 'Only the level, by an even amount at each pitch', 'Nothing until it is turned fully away from them'],
    correct: 'The tone of the steps, not only their level',
    explain: 'Off its axis a shotgun’s pickup changes unevenly with pitch, so the steps change colour as well as level. Aim the front at the action and compare small turns by ear.',
    why: {
      'Only the level, by an even amount at each pitch': 'Off a shotgun’s axis the change is uneven across pitches: the tone changes too.',
      'Nothing until it is turned fully away from them': 'A small turn already changes what a shotgun hears — especially in the highs.',
    },
  },
  capsuleRef(W, 'placement'),
  {
    id: 'f01.place.1',
    page: 'placement',
    prompt: 'You move the mic from about 1.8 m to about 1 m from the steps. What tends to change?',
    options: ['More contact and texture; the near steps jump out', 'More of the room, and the steps even out across the whole pit', 'Nothing but the level, which the fader sets'],
    correct: 'More contact and texture; the near steps jump out',
    explain: 'Closer, the mic hears more of the sole and the surface and less room — and the difference between the nearest and the farthest step grows. Farther back, the room joins and the steps even out.',
    why: {
      'More of the room, and the steps even out across the whole pit': 'That is what moving FARTHER tends to do. Closer brings contact and texture, and uneven steps.',
      'Nothing but the level, which the fader sets': 'Distance changes the balance of step, room and noise — a fader cannot do that.',
    },
  },
  {
    id: 'f01.place.2',
    page: 'placement',
    prompt: 'One stage compared two shotguns at about 1.5–2 m. One sounded blurred. A fair next move?',
    options: ['Try it about half a metre closer, then compare', 'Swap the shoes for louder ones, then compare', 'Raise the gain until the steps sound clearer'],
    correct: 'Try it about half a metre closer, then compare',
    explain: 'When the steps need more articulation, moving the mic a little closer — about half a metre, as that stage did — is a fair first change. Keep everything else the same and compare at matched level.',
    why: {
      'Swap the shoes for louder ones, then compare': 'That changes two things at once. Move one variable — the distance — first.',
      'Raise the gain until the steps sound clearer': 'Gain makes everything louder, room included. Distance changes the balance.',
    },
  },
  {
    id: 'f01.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What do you mark on the floor before any stand goes up?',
    options: ['The whole movement, a pivot included, and the way out', 'The best spot for the mic, measured out from the room’s walls', 'Where the performer’s headphone cable should run'],
    correct: 'The whole movement, a pivot included, and the way out',
    explain: 'Walk the cue without recording, mark the whole movement — feet, arms, body, a sudden pivot or a missed step — and the exit path. Everything you place stays outside them.',
    why: {
      'The best spot for the mic, measured out from the room’s walls': 'The mic’s place comes after the movement is marked — and it is measured from the steps, not the walls.',
      'Where the performer’s headphone cable should run': 'Cables matter, but the movement and the exit path are marked first.',
    },
  },
  {
    id: 'f01.ctx.1',
    page: 'context',
    prompt: 'A live theatre booth: footsteps through a PA, a wedge in front of the performer. A fair first plan?',
    options: ['One close, stable mic with the wedge in its rejection', 'A room mic farther back to catch the whole stage', 'Two mics open at once, so there is more to choose from later'],
    correct: 'One close, stable mic with the wedge in its rejection',
    explain: 'Live, one protected pickup close enough to keep the PA down in it, aimed so the wedge sits in its rejection, is a place to begin. A farther mic that works on a quiet stage may have too little gain before feedback.',
    why: {
      'A room mic farther back to catch the whole stage': 'A farther mic hears more PA and wedge: it often runs out of gain before feedback live.',
      'Two mics open at once, so there is more to choose from later': 'Every open mic takes margin away and adds spill. Start with the one you need.',
    },
  },
  noProvoke(W, 'context'),
  {
    id: 'f01.ctx.studio',
    page: 'context',
    prompt: 'A quiet Foley stage, footsteps for a medium shot. A fair first plan?',
    options: ['One directional mic about 1–2 m out, a stable step area', 'A mic inside the pit’s rim, as close as it fits', 'Three mics round the pit, all open and summed together at once'],
    correct: 'One directional mic about 1–2 m out, a stable step area',
    explain: 'On a quiet stage one directional mic outside the movement — about 0.9–1.8 m out, aimed at the steps — with a stable surface and separate monitoring is a place to begin. Add a perspective only if the scene wants it.',
    why: {
      'A mic inside the pit’s rim, as close as it fits': 'Inside the rim is the landing area: the mic stays outside the movement.',
      'Three mics round the pit, all open and summed together at once': 'Each extra mic adds room, noise and timing differences. Start with one and add for a reason.',
    },
  },
  {
    id: 'f01.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Can moving the mic closer take a hollow floor’s boom out of the steps?',
    options: ['No — the boom is made in the floor, under the step', 'Yes — close enough, it hears only the shoe and none of the floor', 'Yes — if it is aimed down at the boards from the side'],
    correct: 'No — the boom is made in the floor, under the step',
    explain: 'The boards and the air gap under them ring with the step: the boom is part of the floor. A mic move may change how prominent it is; choosing and supporting the surface changes the boom itself.',
    why: {
      'Yes — close enough, it hears only the shoe and none of the floor': 'However close, the mic hears the step as the floor makes it — boom included. Change or support the surface instead.',
      'Yes — if it is aimed down at the boards from the side': 'Aiming at the boards hears more of the boom, not less. The floor makes it.',
    },
  },
  {
    id: 'f01.two.1',
    page: 'twoMic',
    prompt: 'A close mic at 1.4 m and a room mic at 3 m sound hollow together. Why?',
    options: ['Each step reaches them at different times', 'The room mic reverses the polarity of the steps', 'The close mic is louder, so the two cancel'],
    correct: 'Each step reaches them at different times',
    explain: 'The room mic hears each step later. Summed, some pitches arrive out of step and cancel — a comb of notches. Change placement or level first; check polarity at matched levels only as a diagnostic.',
    why: {
      'The room mic reverses the polarity of the steps': 'Both mics face the same steps; the difference is when the sound arrives, not its sign.',
      'The close mic is louder, so the two cancel': 'Level alone does not cancel; the arrival-time difference makes the notches.',
    },
  },
  polarityDelay('f01.two.2'),
  matchedLevels('f01.two.3'),
  {
    id: 'f01.two.4',
    page: 'twoMic',
    prompt: 'The walker crosses the pit. Why can no one time alignment fix the pair for the whole cue?',
    options: ['The step moves, so the delay changes each step', 'Alignment only works for very quiet steps', 'The room mic’s delay stays fixed by its stand'],
    correct: 'The step moves, so the delay changes each step',
    explain: 'Each step lands somewhere else, so the two paths — and the delay between the mics — change with every step. An alignment is only true for one place: choose a balance for the whole cue, in mono.',
    why: {
      'Alignment only works for very quiet steps': 'Level has nothing to do with it: the moving source changes the delay.',
      'The room mic’s delay stays fixed by its stand': 'The stand is fixed, but the step moves — so the path to each mic changes.',
    },
  },
  foleyGain(W),
  {
    id: 'f01.prac.3',
    page: 'practice',
    prompt: 'What would justify a second footstep mic?',
    options: ['The first works alone, the second adds, mono holds', 'Two channels give the mix more choices', 'The steps need more level than one mic gives'],
    correct: 'The first works alone, the second adds, mono holds',
    explain: 'A second mic — a room perspective, a wider view — adds a delay and the room. It earns its place when the primary already works, the second helps the scene, and the pair holds up in mono. Otherwise leave it out.',
    why: {
      'Two channels give the mix more choices': 'More choices also mean more room, noise and comb filtering. Add a mic for a reason.',
      'The steps need more level than one mic gives': 'Level comes from gain and distance, not from a second mic.',
    },
  },
  {
    id: 'f01.mix.1',
    page: 'practice',
    prompt: 'Same shoe, same pit: tile on concrete, then boards over an air gap. Why might the steps differ?',
    options: ['The floor under the surface rings or does not', 'The mic hears wood less clearly than tile', 'They cannot: the shoe decides everything'],
    correct: 'The floor under the surface rings or does not',
    explain: 'Same shoe, different floor: tile on concrete stops the step; boards over a gap flex and ring. The surface and what lies under it are half of every footstep.',
    why: {
      'The mic hears wood less clearly than tile': 'The mic hears both; what differs is the sound the floor makes.',
      'They cannot: the shoe decides everything': 'The shoe is half of it; the surface and the floor under it are the other half.',
    },
  },
  nullOnPaper('f01.mix.2', 'wedge'),
  removeDelay('f01.mix.3'),
  superNull('f01.ctx.2', 'context', 'wedge'),
];

const symptoms: Symptom[] = [
  {
    id: 'f01.sym.boom',
    observation: 'Every step has a low boom the scene does not want',
    firstChecks: 'The floor under the surface and the panel’s support, then the shoe — then aim and distance. An EQ cut cannot replace a stable, suitable surface.',
    options: ['The floor, the panel’s support and the shoe first', 'A steep low cut on the channel to remove it', 'Move the mic much closer to the steps'],
    correct: 'The floor, the panel’s support and the shoe first',
    explain: 'A hollow panel or a suspended floor booms with each step. Support or change the surface, try another shoe, then move the mic; a filter also takes away the step’s body.',
    why: {
      'A steep low cut on the channel to remove it': 'A filter also removes the step’s wanted body. Fix the floor first.',
      'Move the mic much closer to the steps': 'A move may change how prominent it is, but the boom is in the floor — and closer brings other problems.',
    },
  },
  {
    id: 'f01.sym.pants',
    observation: 'Trouser rustle and breath are as loud as the steps',
    firstChecks: 'Aim at the floor, not the body; a tighter pickup close to the steps; the costume; then distance.',
    options: ['Aim at the floor, tighten the pickup, check the costume', 'Raise the gain so the steps cover the rustle', 'Move the mic up to the walker’s waist height, aimed level at them'],
    correct: 'Aim at the floor, tighten the pickup, check the costume',
    explain: 'A tight pickup aimed down at the steps keeps clothing and breath off its axis; quieter trousers help too. Back off or widen the pickup only when you want more space.',
    why: {
      'Raise the gain so the steps cover the rustle': 'Gain lifts the rustle as much as the steps.',
      'Move the mic up to the walker’s waist height, aimed level at them': 'At waist height it is aimed at the clothes. Keep it looking down at the floor.',
    },
  },
  thumpSymptom(W),
  feedbackFoley(W),
  repeatSymptom(W),
  hollowSymptom('f01.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'f01.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a footstep setup in the order you would do them.',
    steps: [
      { text: 'Define the cue: the shoe, the surface, the shot and the steps', early: 'Start with what the scene needs.' },
      { text: 'Walk the cue without recording; mark the movement and the exit path', early: 'Know the movement before anything is placed.' },
      { text: 'Secure the surface; choose a mic and a stand with a shock mount', early: 'Choose once the step and the movement are known.' },
      { text: 'Place it outside the movement, aimed at the middle of the steps', early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs; then switch phantom on if the mic needs it', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set input gain on the hardest step, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Record the whole cue; change one variable at a time', early: 'Compare only once the level is set safely.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower the monitoring before switching it, and follow the mic’s manual. Gain: set it on the hardest heel hit and surface change, then check the quiet steps for noise.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'f01.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A quiet Foley stage, a medium shot: one character walking on wood, hard soles. Phantom power available.',
    setups: [
      { id: 'a', label: 'Short shotgun about 1.4 m out, a little to one side, aimed at the steps', ok: true, power: 'phantom', feedback: 'A suggested starting point: shoe and surface with a little room — check the near and far steps.' },
      { id: 'b', label: 'Small supercardioid about 1 m out, aimed down across the steps', ok: true, power: 'phantom', feedback: 'A suggested trial: more contact and texture — check clearance and pants noise.' },
      { id: 'c', label: 'A mic on the floor inside the pit, under the walker', ok: false, power: 'phantom', feedback: 'Inside the landing area: a trip and a thump. Keep it outside the movement.' },
      { id: 'd', label: 'A mic at the walker’s waist, aimed at the knees', ok: false, power: 'phantom', feedback: 'Aimed at the clothes, not the steps. Aim down at where the feet land.' },
      { id: 'e', label: 'A stand across the exit path, the nearest open spot', ok: false, power: 'phantom', feedback: 'The exit path stays clear. Find a place outside the movement and the way out.' },
    ],
    reasons: [DOC_REASON('the middle of the steps'), CLEAR_REASON('the movement and the exit path'), { id: 'r.power', label: 'The channel gives the condenser the phantom power it needs', role: 'required', feedback: 'Say how the mic is powered: these condensers need phantom power.' }, SHOCK_REASON, BRAND_REASON, LOUD_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point read from the middle of the steps, clearance of the movement and the exit path, and the power the mic needs.',
  },
  {
    id: 'f01.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A live theatre: footsteps performed in a booth beside the stage, through the PA, a wedge in front of the performer.',
    setups: [
      { id: 'a', label: 'One shotgun about 0.9 m out on a stable stand, the wedge in its rejection', ok: true, power: 'phantom', feedback: 'A suggested starting point for live: close, protected, aimed — check the whole cue with the operator.' },
      { id: 'b', label: 'A small supercardioid about 1 m out, the wedge off its rear to one side', ok: true, power: 'phantom', feedback: 'A fair live choice if the wedge sits near its rejection — check at show level.' },
      { id: 'c', label: 'A room mic 3 m back, so the PA sounds natural', ok: false, power: 'phantom', feedback: 'A farther mic hears the PA and the wedge: it often runs out of gain before feedback live.' },
      { id: 'd', label: 'Push the gain until it rings, then back it off', ok: false, power: 'phantom', feedback: 'Never provoke feedback. Check the gain with the operator, short of any ring.' },
      { id: 'e', label: 'Three mics round the pit, all open on the PA', ok: false, power: 'phantom', feedback: 'Each open mic takes margin away and adds spill. Start with one.' },
    ],
    reasons: [DOC_REASON('the middle of the steps'), CLEAR_REASON('the movement and the exit path'), { id: 'r.null', label: 'The pattern’s rejection faces the wedge', role: 'required', feedback: 'Say where the wedge sits against the pattern.' }, { id: 'r.op', label: 'The gain is checked with the operator at show level', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, { id: 'r.ring', label: 'Find the edge of feedback, then back off', role: 'wrong', feedback: 'Feedback is never provoked — not even to find the edge.' }],
    explain: 'Two setups pass. What passes is the reasoning: one close, protected pickup, the wedge in its rejection, clearance of the movement, and gain checked with the operator — never by making it ring.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: where does a footstep’s sharp contact start?', options: ['In the walker’s knee', 'Where the heel meets the floor', 'In the room’s walls'], after: 'Now STEP through (or PLAY ONCE) and watch the heel, the sole, the surface and the floor under it.' },
  microphone: { prompt: 'Before you move anything: where will the supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the mic from 1.8 m to 1 m from the steps. What changes?', options: ['More contact, uneven steps', 'More room', 'It depends on this floor'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge is on the floor in front of the performer. Where will a supercardioid aimed at the steps reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What makes up a Foley footstep?',
    options: ['The shoe, the surface and the floor under it', 'Only the shoe’s sole meeting the floor', 'The walker’s body weight and the mic’s distance from them'],
    correct: 'The shoe, the surface and the floor under it',
    explain: 'A footstep is a shoe, a surface and what lies under it, performed by a walker in a room. Choose the shoe and the surface first; the mic only hears what they make.',
    why: {
      'Only the shoe’s sole meeting the floor': 'The sole is part of it; the surface and the floor under it make the rest.',
      'The walker’s body weight and the mic’s distance from them': 'Distance changes what the mic hears, not what the step is.',
    },
  },
  {
    id: 'q.2',
    covers: 'sound',
    prompt: 'Why is a footstep mic aimed down at the middle of the steps?',
    options: ['The contact starts at the floor, all over the pit', 'The walker’s voice must stay out of the mic', 'Sound rises straight up from the floor in a narrow beam'],
    correct: 'The contact starts at the floor, all over the pit',
    explain: 'Every step lands at floor level, somewhere in the pit. Aiming at the middle of the steps covers them and keeps the body and clothing off the mic’s axis.',
    why: {
      'The walker’s voice must stay out of the mic': 'Breath and voice matter, but the aim follows where the steps start: the floor.',
      'Sound rises straight up from the floor in a narrow beam': 'Sound spreads from each step; it does not rise as a beam. The aim follows where the steps land.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'A hollow panel booms. What changes the boom itself?',
    options: ['The panel, its support and the shoe', 'Moving the mic a little to the side', 'A lower mic pointed at the boards'],
    correct: 'The panel, its support and the shoe',
    explain: 'The boom is made in the floor. Supporting or changing the panel and trying another shoe change it; a mic move may only change how prominent it is.',
    why: {
      'Moving the mic a little to the side': 'That may change how prominent it is, not the boom the floor makes.',
      'A lower mic pointed at the boards': 'That hears more of the boom, not less. The floor makes it.',
    },
  },
  {
    id: 'q.4',
    covers: 'setting',
    prompt: 'The picture shows carpet. What do you check first?',
    options: ['What the carpet lies on, and the shoe', 'The carpet’s colour in the picture', 'How close a mic can get to it'],
    correct: 'What the carpet lies on, and the shoe',
    explain: 'A carpet always lies on something — tile, concrete, hardwood or hollow wood — and the shoe changes the step as much as the floor. Choose them first.',
    why: {
      'The carpet’s colour in the picture': 'The colour does not reach the mic; what lies under the carpet does.',
      'How close a mic can get to it': 'Distance comes after the surface and the shoe are chosen.',
    },
  },
  clearanceDiag(W),
  hearingDiag(W),
];

const BOOTH = liveBooth(0);
const wedges: Wedge[] = [
  {
    id: 'wedge',
    label: 'a wedge on the floor in front of the performer, facing back at them',
    short: 'WEDGE',
    p: BOOTH.wedge.p,
    lift: 150,
    faces: BOOTH.wedge.faces,
    note: 'On the floor in front of the performer and off to their right, facing back at them: below and behind a mic aimed down at the steps — the pattern and the tilt both decide how much of it the mic hears.',
    prov: { kind: 'illustrative', reason: 'a typical booth layout; the wedge’s place is a drawing default' },
  },
];

/** The family pages' extra (smallperc/family.ts SpExtra): MEET IT's close-up framing. */
const SP: SpExtra = {
  strikeTitle: 'Step to sound',
  plan: { box: { u0: -1000, u1: 2600, v0: -1350, v1: 1350 }, things: [] },
  close: { side: { u0: -900, u1: 2600, v0: -2050, v1: 500 }, top: { u0: -900, u1: 1100, v0: -1150, v1: 1150 } },
};

export const F01_LESSON: Lesson & { sp: SpExtra } = {
  id: 'F01',
  labId: 'field',
  title: 'Foley Footsteps and Surfaces',
  subtitle: 'A shoe, a surface and a room: about 0.9–1.8 m out, aimed down at the steps, outside the whole movement',
  noun: { one: 'footstep', many: 'footsteps', subject: 'footsteps' },
  model: F01_MODEL,
  micTypeIds: ['shotgunShort', 'scSupercard', 'ldcRoom'],
  zones: F01_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A Foley footstep is performed, not recorded on set: a Foley artist walks in place in a pit of the right surface, in the right shoes, in time with the picture — or live, beside a theatre stage.', src: 'NF-FOLEY' },
    { title: 'THE PIT', text: 'A pit about 1.2 × 1 m set into the stage floor, framed in concrete about 10 cm wide, on a heavy slab: one surface per pit — tile, wood, gravel, carpet and more.', src: 'FF-PIT' },
    { title: 'THE SHOE AND THE SURFACE', text: 'The shoe and the surface choose most of the sound — and what lies under the surface joins in: a carpet always lies on something, and a hollow panel can boom.', src: 'FF-CUE' },
    { title: 'THE MOVEMENT', text: 'The walker’s whole movement — feet, arms, body, a pivot or a missed step — and the way out are keep-outs. Every mic, stand and cable stays outside them.', src: 'LESSON-F01' },
  ],
  sound: {
    stages: [
      { title: 'The heel lands', text: 'The heel meets the surface: the sharp contact of the step starts here, right at floor level.' },
      { title: 'The sole rolls', text: 'The sole rolls to the toe and pushes off: the shoe’s own creak, and a scuff if it drags.' },
      { title: 'The surface answers', text: 'The surface rings or hushes under the shoe — its texture is part of the step.', byVariant: { tile: 'The tiles click under the hard heel: a sharp, short contact with the glaze’s ring.', wood: 'The boards knock under the heel and flex a little — the start of the panel’s boom.', gravel: 'The stones crunch, grind and scatter round the shoe: grains and uneven strikes over the whole area.', carpet: 'The carpet hushes the contact: a soft, quiet step, the boards under it barely heard yet.', live: 'The concrete slab gives a hard, clear slap — a step that reads through a PA.' } },
      { title: 'The floor and the room', text: 'What lies under the surface and the room carry it on: the floor, then the walls.', byVariant: { wood: 'The air gap under the boards rings: a low boom joins the step, then the room’s reflections.', carpet: 'The boards under the carpet carry the step on, then the room’s reflections.' } },
    ],
    attack: 'The heel’s contact on a hard surface is short and sharp; on carpet it is soft and quiet; in gravel it is many small crunches. A close mic tends to hear more of it.',
    body: 'After the contact: the sole’s roll, the surface’s ring, any boom from a hollow layer, and the room’s reflections. A farther mic tends to hear more of this and of the room.',
    head: { diameterMm: 0, rods: 0, label: 'the step', strikeSrc: 'LESSON-F01' },
  },
  setting: {
    items: [
      { id: 'walker', label: 'the walker and their whole movement', short: 'THE MOVEMENT', note: 'Feet, arms and body, a pivot or a missed step: mark it on the floor before any stand goes up; the mic, stand and cable stay outside it.', prov: { kind: 'illustrative', reason: 'F01 L69' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'exit', label: 'the exit path', short: 'EXIT PATH', note: 'The way out of the pit to the stage door: no stand or cable across it.', prov: { kind: 'illustrative', reason: 'F01 L69' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'clothes', label: 'the walker’s clothes and breath', short: 'CLOTHES · BREATH', note: 'Trousers, jacket and breath are close to the mic too: a tight pickup aimed down at the steps keeps them off its axis.', prov: { kind: 'illustrative', reason: 'S-FOLEY' }, tag: 'SPILL', scene: 'all' },
      { id: 'floor', label: 'the floor under the surface', short: 'THE FLOOR', note: 'A hollow layer or a suspended floor can boom with every step — a mic move cannot change it; the surface and its support can.', prov: { kind: 'illustrative', reason: 'FF-PIT' }, tag: 'THE SOURCE', scene: 'all' },
      { id: 'room', label: 'the room, the ventilation and the other props', short: 'THE ROOM', note: 'A farther mic hears more of the room: wanted for a wide shot, unwanted when the scene is somewhere else.', prov: { kind: 'illustrative', reason: 'FF-HP' }, tag: 'ROOM SOUND', scene: 'studio' },
      { id: 'pa', label: 'the PA and the wedge', short: 'PA · WEDGE', note: 'In a live booth every open mic hears the PA and the wedge: one close mic, the wedge in its rejection, the open mics few.', prov: { kind: 'illustrative', reason: 'S-LIVE, S-AUTOMIX' }, tag: 'FEEDBACK PATH', scene: 'stage' },
    ],
    stage: 'LIVE: one protected mic close enough to keep the PA down in it, the wedge in its rejection, the gain checked with the operator at show level — never by making it ring.',
    studio: 'STUDIO: a quiet stage, one directional mic about 0.9–1.8 m out aimed at the steps, the room part of the sound, separate monitoring for the performer.',
  },
  diagnostic,
  practice: {
    task: 'Choose a footstep setup for a quiet Foley stage and for a live booth, compare one variable, and explain what would justify a second mic. With a real performer and their agreement, you can record what you tried below.',
    fields: [
      { id: 'cue', label: 'Cue or scene, and the intended listener', kind: 'text' },
      { id: 'shoe', label: 'Shoe and sole; the surface and what lies under it', kind: 'text' },
      { id: 'mic', label: 'Mic type and pattern', kind: 'choice', choices: ['short shotgun', 'small supercardioid', 'large condenser (room)', 'other'] },
      { id: 'pos', label: 'Capsule to the middle of the steps; height, angle and aim', kind: 'text' },
      { id: 'clear', label: 'Movement, exit path and stand clearance checked', kind: 'text' },
      { id: 'notes', label: 'What you heard: contact, texture, room, noise (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The pit’s depth (100 mm), how its 1.2 × 1 m sits (1.2 m across the walker), the layers’ thicknesses (tile 10 mm, boards 22 mm over a 55 mm air gap, carpet 12 mm …) and the back wall — drawing defaults; the pit’s size, its rim and the slab are sourced.', dims: [] },
    { text: 'The motion envelope: 450 mm beyond the pit on the walking sides and a 2000 mm column; the exit path 600 mm wide — drawing defaults (no source gives a clearance).', dims: [] },
    { text: 'Every mic height (a drawing default), and the reading of “only about 15 degrees” as 15° off the walker’s front line in plan.', dims: [] },
    { text: 'The short shotgun’s body (Ø 19 × 250 mm, the capsule 200 mm behind the grille) and its tube length; the narrowing of its lobe above roughly the upper mids is drawn as a simplified picture, no number.', dims: [] },
    { text: 'The room mic’s place (3 m out, 2 m up), the live booth, the PA and the wedge — drawing defaults; the close + room method is sourced.', dims: [] },
    { text: 'The walker’s figure and stride — the shared adult figure, a drawing default.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — possible starting points and ideas to consider, not rules. Every shoe, surface, performer and room is different: move the mic, experiment, and trust your ears and the room. Experimentation is encouraged. The lab is silent and draws a simplified picture: one walker mid-stride, the floor cut open, a shotgun’s narrowing as a simplified shape, mic patterns and the two-mic comb as textbook shapes. Distances are rounded to about 5 mm and measured from the middle of the steps to the mic’s capsule. Place real mics with the performer stopped, and only with their agreement.',
  copy: F01_COPY,
  sp: SP,
};
