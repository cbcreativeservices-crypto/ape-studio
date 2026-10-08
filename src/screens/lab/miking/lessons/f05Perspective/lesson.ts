/**
 * F05 FOLEY PERSPECTIVE AND MULTIPLE MICROPHONES — the lesson's pages as DATA
 * (Miking Lab 6, group 2, branch lab6-g2). Words from the owner's lesson
 * (docs/labs/miking/source_text/F05-Foley-Perspective-and-Multiple-
 * Microphones-Miking-Technique.txt, "L<n>" in comments only) with
 * foley_perspective/SOURCES.md §c applied and logged in CORRECTIONS_LOG.md
 * (Lab 6 · group 2): no institutional wording (F05-C1); the X/Y starting
 * angle 90° (F05-C2); ORTF's geometry, 170 mm and 110° included (F05-C3);
 * "in front and/or to the side, about 15°" added to the 3–6 ft example
 * (F05-C4); the fragile reference recorded only (F05-C5); the cross-link to
 * an unbuilt lesson dropped (F05-C6).
 *
 * On group 1's Foley stage (lessons/shared/foley) with the field family's
 * path tool and image readout (lessons/shared/field) at Foley-stage scale.
 * OWNER RULING 2026-10-04: suggested starting points; no source, brand or
 * model in learner text; no badges; FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { matchedLevels, polarityDelay, removeDelay, superNull, hollowSymptom } from '../shared/bowed/bowedItems.ts';
import { BRAND_REASON, CLEAR_REASON, DOC_REASON, LOUD_REASON, capsuleRef, clearanceDiag, feedbackFoley, foleyGain, foleyRating, hearingDiag, noProvoke, repeatSymptom, shotgunRoom, thumpSymptom, type FoleyWords } from '../shared/foley/foleyItems.ts';
import { liveBooth } from '../shared/foley/stage.ts';
import type { SpExtra } from '../shared/smallperc/family.ts';
import { F05_FLOOR, F05_MODEL } from './geometry.ts';
import { F05_PAIRS, F05_ZONES } from './model.ts';
import { F05_COPY } from './copy.ts';

const W: FoleyWords = { p: 'f05', what: 'a moving Foley action', loudest: 'the strongest jingle', movement: 'the artist’s whole path and movement' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the moving action',
    goal: 'Meet a Foley action that moves — keys carried across a marked path — and what perspective means on a stage, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Perspective is distance, room and movement together: where the mic is decides how near the action sounds and how much of the room comes with it.',
  },
  sound: {
    title: 'Near or far',
    goal: 'See one jingle reach a close mic and a room mic — first and loudest, then later with the room — and how every distance changes as the keys are carried.',
    credit: { scenarios: ['f05.snd.1', 'f05.snd.2', 'f05.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'A close mic hears mostly the direct sound; a room mic hears it later and weaker with the room behind it. Two distances are two perspectives — not left and right.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Settle the pictured action, each mic’s job and the room before anything goes up — and keep every stand outside the artist’s path.',
    credit: { scenarios: ['f05.set.1', 'f05.set.2', 'f05.set.hear'], note: 'Answer the three checks.' },
    takeaway: 'The shot, the mono destination, a job for each mic, the room checked against the picture, the path marked and clear. Hearing comes first, and feedback is never provoked.',
  },
  microphone: {
    title: 'Choose the microphones',
    goal: 'Choose by properties — a short shotgun or a small supercardioid close, a large condenser as the room mic, matched cardioids or a figure-8 for a pair.',
    credit: { scenarios: ['f05.mic.tube', 'f05.mic.1', 'f05.mic.2', 'f05.rec.1'], note: 'Answer the four checks (one reaches back to near and far).' },
    takeaway: 'A close directional mic for detail, a room condenser for the space, a matched pair for travel across the picture. Choose each for its job, then compare in the room.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — one mic about 0.9–1.8 m from the middle of the path, in front and a little to one side — then try the room mic and the pairs.',
    credit: { scenarios: ['f05.place.capsule', 'f05.place.1', 'f05.place.2', 'f05.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the path, inside two different starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A starting point is a place to begin, measured to the capsule from the middle of the path — not a rule. Move nearer or farther to fit the shot; the path stays clear.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the live station’s mic so the wedge sits in its rejection — and know why a quiet stage can keep a room channel while a live stage keeps its open mics few.',
    credit: { scenarios: ['f05.ctx.1', 'f05.ctx.2', 'f05.ctx.ring', 'f05.ctx.studio', 'f05.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'On a quiet stage, close and room channels give the mix a choice. Live, one stable pickup at a known station, the wedge in its rejection, the open mics few — and feedback never provoked.',
  },
  twoMic: {
    title: 'Two mics on a moving action',
    goal: 'Carry the keys across and see the close–room delay change with every step, then watch a stereo pair map the travel — and why near/far is not left/right.',
    credit: { scenarios: ['f05.two.1', 'f05.two.2', 'f05.two.3', 'f05.two.4'], interactive: 'imageSwept', note: 'Carry the keys across with two different pairs, and answer the four checks.' },
    takeaway: 'Close + room: two perspectives whose delay changes as the action moves — no one alignment fixes the whole cue. A pair at one place maps travel. Solo each, sum in mono, keep the labels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check timing, movement, labels and geometry before EQ: solo each mic, relocate the room channel, verify the pair — and keep the open mics few.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a perspective session in order, choose and justify setups for a studio cue and a live station, and say what would justify each extra mic.',
    credit: { scenarios: ['f05.prac.order', 'f05.prac.gain', 'f05.prac.setup1', 'f05.prac.setup2', 'f05.prac.3', 'f05.mix.1', 'f05.mix.2', 'f05.mix.3'], note: 'Put the session in order, answer the gain check, complete both briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real stage.' },
    takeaway: 'Each channel named for its job, near/far kept apart from left/right, mono checked over the whole movement, any stereo geometry exact — and more than one setup can pass.',
  },
};

/* THE CHECKS. Lesson lines in comments only: snd L5–L6, L26 · set L5–L6, L51 · mic L11–L22 · place L24 ·
 * ctx L33–L35 · two L26–L32 · prac L52–L59. */
const scenarios: MikingScenario[] = [
  {
    id: 'f05.snd.1',
    page: 'sound',
    prompt: 'One jingle reaches a close mic and a room mic. How does the room mic hear it?',
    options: ['Later and weaker, with the room', 'At the same moment, only louder', 'Earlier, before the close mic does'],
    correct: 'Later and weaker, with the room',
    explain: 'The room mic is farther: the direct sound arrives later and weaker, and the walls’ reflections follow close behind — that is its perspective.',
    why: {
      'At the same moment, only louder': 'Farther means later and weaker, not louder.',
      'Earlier, before the close mic does': 'Sound reaches the nearer mic first.',
    },
  },
  {
    id: 'f05.snd.2',
    page: 'sound',
    prompt: 'A close mic and a room mic on the same keys. What are they?',
    options: ['Two distances: two perspectives', 'A left channel and a right channel', 'A Mid mic and its matching Side'],
    correct: 'Two distances: two perspectives',
    explain: 'Two mics at different distances are two selectable perspectives, or a blended mono result — not a left/right image, and not M/S.',
    why: {
      'A left channel and a right channel': 'They differ in distance, not in left and right: hard-panning them pulls the picture apart.',
      'A Mid mic and its matching Side': 'M/S is a forward mic and a sideways figure-8 at one place — not close + room.',
    },
  },
  {
    id: 'f05.snd.3',
    page: 'sound',
    prompt: 'The keys are carried across the path. What happens to each mic’s distance?',
    options: ['It changes with every step', 'It stays fixed for the cue', 'Only the room mic’s changes'],
    correct: 'It changes with every step',
    explain: 'As the keys travel, their distance to every mic changes — so the level, the room and the delay between two mics change too.',
    why: {
      'It stays fixed for the cue': 'The mics are fixed; the keys are not.',
      'Only the room mic’s changes': 'Both distances change as the keys move.',
    },
  },
  {
    id: 'f05.set.1',
    page: 'setting',
    prompt: 'Before mounting a second mic for a Foley cue, what do you name?',
    options: ['Its job: detail, room or travel', 'Its brand name and its model number', 'The loudest spot it can reach'],
    correct: 'Its job: detail, room or travel',
    explain: 'Name each mic’s goal — the detail, the whole action, the real room, or the action’s travel — before it goes up. A second mic earns its place with a job of its own.',
    why: {
      'Its brand name and its model number': 'Choose by properties and the job, not by name.',
      'The loudest spot it can reach': 'Level is not a job: perspective is.',
    },
  },
  {
    id: 'f05.set.2',
    page: 'setting',
    prompt: 'The stage’s room sounds nothing like the pictured place. What follows?',
    options: ['A distant mic records the wrong room', 'The room will vanish once it is mixed', 'A louder room mic will fix the match'],
    correct: 'A distant mic records the wrong room',
    explain: 'A farther mic prints the stage’s own room. If it cannot match the picture, favour a closer, drier track — knowing processing will not recreate every reflection.',
    why: {
      'The room will vanish once it is mixed': 'A recorded room stays in the track.',
      'A louder room mic will fix the match': 'More of the wrong room makes the mismatch worse.',
    },
  },
  foleyRating(W),
  {
    id: 'f05.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Which mic hears a jingle first?',
    options: ['The nearer one', 'The farther one', 'Both at once'],
    correct: 'The nearer one',
    explain: 'Sound reaches the nearer mic first; the farther mic hears it later, with more room.',
    why: {
      'The farther one': 'Farther means later: sound takes time to travel.',
      'Both at once': 'Different distances mean different arrival times.',
    },
  },
  shotgunRoom(W, 'microphone'),
  {
    id: 'f05.mic.1',
    page: 'microphone',
    prompt: 'For an X/Y pair, what do the two mics need?',
    options: ['A matched pair, capsules together', 'Two unmatched mics, a metre apart', 'One shotgun and one room mic'],
    correct: 'A matched pair, capsules together',
    explain: 'Two matched directional capsules close together without touching, angled 90° to start: a level-based image.',
    why: {
      'Two unmatched mics, a metre apart': 'That is neither coincident nor matched: arbitrary spacing is not X/Y.',
      'One shotgun and one room mic': 'That is close + room: two distances, not a stereo pair.',
    },
  },
  {
    id: 'f05.mic.2',
    page: 'microphone',
    prompt: 'What is a large condenser best used for in this lesson?',
    options: ['The room mic, farther back', 'The close mic, inches away', 'The Side of an X/Y pair'],
    correct: 'The room mic, farther back',
    explain: 'As the farther mic it hears the action with the room — a perspective to blend under the close mic.',
    why: {
      'The close mic, inches away': 'Close detail is the short shotgun’s or the small supercardioid’s job here.',
      'The Side of an X/Y pair': 'X/Y has no Side; the Side belongs to M/S, and it is a figure-8.',
    },
  },
  capsuleRef(W, 'placement'),
  {
    id: 'f05.place.1',
    page: 'placement',
    prompt: 'The shot is close; the keys sound small and roomy. A fair move?',
    options: ['Move the mic nearer, then compare', 'Add a room mic for more of it', 'Raise the gain until it sounds near'],
    correct: 'Move the mic nearer, then compare',
    explain: 'Nearer brings detail and less room — repeat the action with the mic nearer and compare. A too-close view can sound oversized, so listen against the picture.',
    why: {
      'Add a room mic for more of it': 'More room makes it sound farther, not nearer.',
      'Raise the gain until it sounds near': 'Gain raises the room too: distance changes the balance.',
    },
  },
  {
    id: 'f05.place.2',
    page: 'placement',
    prompt: 'One stage often worked 3–6 ft from footsteps. For your cue, that is…',
    options: ['An example for their stage, not a rule', 'The one distance all Foley cues need', 'Too far for a Foley action at all'],
    correct: 'An example for their stage, not a rule',
    explain: 'There is no universal number of feet from a Foley prop. Log the real distance, angle and room, and compare repeated actions.',
    why: {
      'The one distance all Foley cues need': 'It describes one team’s surfaces and stage, not a prescription.',
      'Too far for a Foley action at all': 'For many cues it is a fair place to begin; the shot decides.',
    },
  },
  {
    id: 'f05.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Two tracks, close and room. How do you pan them?',
    options: ['Kept together: they are distances', 'Hard left and hard right, kept apart', 'Wide apart, to widen the room'],
    correct: 'Kept together: they are distances',
    explain: 'Hard-panning close and room sends different views to opposite sides and can pull a centred picture cue apart. Blend them where the picture needs the action.',
    why: {
      'Hard left and hard right, kept apart': 'Two channels are not stereo by themselves: they are two distances.',
      'Wide apart, to widen the room': 'It splits two perspectives across the speakers instead.',
    },
  },
  {
    id: 'f05.ctx.1',
    page: 'context',
    prompt: 'A live Foley station through a PA. A fair first plan?',
    options: ['One stable close mic at a station', 'Close, room and a pair, all open', 'A room mic only, for a natural PA'],
    correct: 'One stable close mic at a station',
    explain: 'Live, begin with one stable, source-proximate directional mic at a repeatable station, and add a feed only with a clear purpose for the audience.',
    why: {
      'Close, room and a pair, all open': 'Each open mic adds room, noise and spill, and takes away margin.',
      'A room mic only, for a natural PA': 'A farther mic hears the PA and wedge: little margin before feedback.',
    },
  },
  noProvoke(W, 'context'),
  {
    id: 'f05.ctx.studio',
    page: 'context',
    prompt: 'A quiet Foley stage: keys carried across a medium shot. A fair first plan?',
    options: ['One mic for the crossing, more by need', 'All the mics you own, open at once', 'A pair hard-panned for the room'],
    correct: 'One mic for the crossing, more by need',
    explain: 'One mic covering the whole crossing is a place to begin; a room channel or a pair only if the scene asks for it.',
    why: {
      'All the mics you own, open at once': 'Each extra mic adds room, noise and timing differences.',
      'A pair hard-panned for the room': 'Room is a distance choice; panning a pair does not add it.',
    },
  },
  {
    id: 'f05.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Close and room mics: what do they differ in?',
    options: ['Distance and room', 'Left and right sides', 'Their polarity'],
    correct: 'Distance and room',
    explain: 'Close and room are two distances — the room mic later and with more of the room. Not left and right; not a polarity difference.',
    why: {
      'Left and right sides': 'They are not a stereo pair.',
      'Their polarity': 'Both have the same polarity; the difference is the arrival time.',
    },
  },
  superNull('f05.ctx.2', 'context', 'wedge'),
  {
    id: 'f05.two.1',
    page: 'twoMic',
    prompt: 'Close and room sound hollow in mono, and it changes along the cue. Why?',
    options: ['The delay between them keeps changing', 'The room mic flips the polarity', 'The close mic is louder than the room'],
    correct: 'The delay between them keeps changing',
    explain: 'The keys reach the two mics at different times, and the difference changes as they travel: the comb’s notches move with them.',
    why: {
      'The room mic flips the polarity': 'Both face the same action; the difference is when the sound arrives.',
      'The close mic is louder than the room': 'Level alone does not cancel: the arrival difference does.',
    },
  },
  {
    id: 'f05.two.2',
    page: 'twoMic',
    prompt: 'A fixed delay lines up close and room at the middle of the path. At the ends?',
    options: ['It is wrong again: the delay has changed', 'It holds: a delay suits the whole path', 'It holds if the polarity is flipped too'],
    correct: 'It is wrong again: the delay has changed',
    explain: 'Any one alignment is only locally true for a moving action. Choose the blend by listening over the whole movement, in mono.',
    why: {
      'It holds: a delay suits the whole path': 'The keys moved, so both distances changed.',
      'It holds if the polarity is flipped too': 'Polarity flips the sign; it never removes a delay.',
    },
  },
  {
    id: 'f05.two.3',
    page: 'twoMic',
    prompt: 'An X/Y pair at one place. What does it record about the keys?',
    options: ['Their travel left to right', 'Their distance near and far', 'Nothing a mono mic misses'],
    correct: 'Their travel left to right',
    explain: 'A coincident pair maps movement across its angle by level — without offering two distances.',
    why: {
      'Their distance near and far': 'That is close + room. A pair at one place has one distance.',
      'Nothing a mono mic misses': 'A mono mic has no left or right: the pair records the travel.',
    },
  },
  {
    id: 'f05.two.4',
    page: 'twoMic',
    prompt: 'An M/S take of the keys is summed to mono. What remains?',
    options: ['The Mid alone', 'The Side alone', 'The room mic'],
    correct: 'The Mid alone',
    explain: 'Left = Mid + Side and Right = Mid − Side: summed, the Side cancels and the Mid remains.',
    why: {
      'The Side alone': 'It is the Side that cancels.',
      'The room mic': 'M/S has no room mic: it is a Mid and a Side at one place.',
    },
  },
  polarityDelay('f05.two.5'),
  matchedLevels('f05.two.6'),
  foleyGain(W),
  {
    id: 'f05.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a room mic to the close mic?',
    options: ['The scene wants the room, and mono holds', 'Two channels give the mix more choice', 'The close mic is not loud enough alone'],
    correct: 'The scene wants the room, and mono holds',
    explain: 'A room channel earns its place when the close mic works alone, the room helps the scene’s perspective, and the pair holds up in mono.',
    why: {
      'Two channels give the mix more choice': 'More choice is also more room, noise and comb. Add it for a reason.',
      'The close mic is not loud enough alone': 'Level comes from gain and distance, not another mic.',
    },
  },
  {
    id: 'f05.mix.1',
    page: 'practice',
    prompt: 'A close mic and a farther room mic are labelled “L” and “R”. What is wrong?',
    options: ['They are distances, not sides', 'Nothing: two mics make stereo', 'Only the order: R should be first'],
    correct: 'They are distances, not sides',
    explain: 'Label close + room as two perspectives. A stereo pair is a planned geometry at one place.',
    why: {
      'Nothing: two mics make stereo': 'Two channels are not stereo by themselves.',
      'Only the order: R should be first': 'The order is not the problem: they are not sides at all.',
    },
  },
  {
    id: 'f05.mix.2',
    page: 'practice',
    prompt: 'Which pair is most dependable when the cue must play in mono?',
    options: ['An X/Y or an M/S pair', 'A wide spaced pair', 'All pairs act the same'],
    correct: 'An X/Y or an M/S pair',
    explain: 'Coincident pairs have no time difference to comb in mono; in M/S the Side cancels and the Mid remains.',
    why: {
      'A wide spaced pair': 'Its time differences comb in a mono sum.',
      'All pairs act the same': 'Spacing makes the difference in mono.',
    },
  },
  removeDelay('f05.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'f05.sym.hollow',
    observation: 'Close and room together sound hollow, and it changes along the cue',
    firstChecks: 'Solo each mic, compare their timing over the movement, lower or move the room channel, then retest the whole cue in mono.',
    options: ['Solo each, then move the room mic', 'A steep EQ notch on the summed mix', 'Hard-pan them left and right'],
    correct: 'Solo each, then move the room mic',
    explain: 'The delay between the mics changes as the action moves: relocate or lower the room channel and listen over the whole cue.',
    why: {
      'A steep EQ notch on the summed mix': 'The notches move with the action; one EQ cannot follow them.',
      'Hard-pan them left and right': 'That splits two distances across the speakers.',
    },
  },
  {
    id: 'f05.sym.jump',
    observation: 'The stereo movement jumps or narrows',
    firstChecks: 'The path, the left/right labels, the capsule angle and the pair’s geometry — then listen in mono.',
    options: ['The path, labels and geometry', 'More gain on the left-hand side', 'A longer, thicker cable run'],
    correct: 'The path, labels and geometry',
    explain: 'Check the source path, the labels, the capsule angle and the pair’s geometry before committing.',
    why: { 'More gain on the left-hand side': 'Level cannot fix a wrong angle or label.', 'A longer, thicker cable run': 'A cable does not change the image.' },
  },
  {
    id: 'f05.sym.mask',
    observation: 'The room track masks the fine detail',
    firstChecks: 'Compare the room’s noise and decay to the pictured space; a nearer or quieter position rather than more gain.',
    options: ['A nearer or quieter room position', 'More gain on the room mic’s channel', 'A wider stereo pair instead'],
    correct: 'A nearer or quieter room position',
    explain: 'Choose a nearer or quieter position for the room channel — or less of it — rather than adding gain.',
    why: { 'More gain on the room mic’s channel': 'More room masks more detail.', 'A wider stereo pair instead': 'Width does not bring detail back.' },
  },
  feedbackFoley(W),
  thumpSymptom(W),
  hollowSymptom('f05.sym.mono'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'f05.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a perspective session in the order you would do them.',
    steps: [
      { text: 'Define the shot, the action and the mono destination', early: 'Start with what the picture needs.' },
      { text: 'Mark the path; rehearse the whole movement', early: 'Know the movement before anything is placed.' },
      { text: 'One mono mic for the whole cue; then nearer and farther', early: 'One mic first, before any second.' },
      { text: 'Add a room mic only if the scene asks; record separately', early: 'A second mic comes after the first works alone.' },
      { text: 'Solo each, sum in mono over the whole movement', early: 'Compare once both are recorded.' },
      { text: 'Label every channel: perspective or left/right', early: 'Label once the choice is made.' },
    ],
    explain: 'A sensible order: the picture first, the path clear, one mic working alone, a second mic for a reason, mono over the whole movement, and honest labels.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'f05.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A quiet Foley stage: keys carried across a wide interior shot. The mix may need the room. Mono delivery too.',
    setups: [
      { id: 'a', label: 'A close shotgun about 1.4 m out, plus a room mic about 3 m back, separate channels', ok: true, power: 'phantom', feedback: 'A suggested starting point: two perspectives to blend — check the sum in mono over the whole crossing.' },
      { id: 'b', label: 'One mic about 1.8 m out that already holds some of the room', ok: true, power: 'phantom', feedback: 'A fair choice: one mono track with its room — if the stage’s room suits the picture.' },
      { id: 'c', label: 'Close and room mics hard-panned left and right', ok: false, power: 'phantom', feedback: 'Two distances are not sides: hard-panning pulls the picture apart.' },
      { id: 'd', label: 'A stand in the middle of the marked path', ok: false, power: 'phantom', feedback: 'The path stays clear — the artist walks there.' },
      { id: 'e', label: 'Two mics spaced by eye and called ORTF', ok: false, power: 'phantom', feedback: 'ORTF is a fixed geometry: 17 cm and 110°, never eyeballed.' },
    ],
    reasons: [DOC_REASON('the middle of the path'), CLEAR_REASON('the artist’s path and movement'), { id: 'r.mono', label: 'The pair is checked in mono over the whole crossing', role: 'required', feedback: 'Say how mono is checked.' }, BRAND_REASON, LOUD_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point read from the middle of the path, the path clear, and mono checked over the whole movement.',
  },
  {
    id: 'f05.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A live theatre: keys carried across a Foley station beside the stage, through the PA, a wedge in front.',
    setups: [
      { id: 'a', label: 'One close mic at the station, the wedge in its rejection', ok: true, power: 'phantom', feedback: 'A suggested starting point for live: one stable pickup — rehearse the whole crossing with the operator.' },
      { id: 'b', label: 'A small supercardioid at the station, the wedge off its rear side', ok: true, power: 'phantom', feedback: 'A fair live choice — check the margin at show level.' },
      { id: 'c', label: 'A room mic 3 m back for a natural sound', ok: false, power: 'phantom', feedback: 'A farther mic hears the PA and the wedge: little margin before feedback.' },
      { id: 'd', label: 'An X/Y pair and a room mic, all open on the PA', ok: false, power: 'phantom', feedback: 'Each open mic takes margin away. Start with one.' },
      { id: 'e', label: 'Raise the gain until it rings, then back off', ok: false, power: 'phantom', feedback: 'Never provoke feedback.' },
    ],
    reasons: [CLEAR_REASON('the artist’s path and movement'), { id: 'r.null', label: 'The pattern’s rejection faces the wedge', role: 'required', feedback: 'Say where the wedge sits against the pattern.' }, { id: 'r.op', label: 'Checked with the operator at show level', role: 'optional', feedback: 'A fair live reason.' }, { id: 'r.ring', label: 'Find the edge of feedback, then back off', role: 'wrong', feedback: 'Feedback is never provoked.' }],
    explain: 'Two setups pass. What passes is the reasoning: one stable pickup at the station, the wedge in its rejection, the path clear, and the gain checked with the operator.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you look: which mic hears the jingle later?', options: ['The room mic', 'The close mic', 'Neither'], after: 'Now switch MIC between NEAR and FAR and drag SWING.' },
  microphone: { prompt: 'Before you move anything: where will the supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the mic from 1.8 m to 1 m from the path. What changes?', options: ['More detail, less room', 'More room', 'Nothing'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge is on the floor in front of the artist. Where will a supercardioid aimed at the keys reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'As the keys move, the delay between the close and the room mic…', options: ['Keeps changing', 'Stays the same', 'Is always zero'], after: 'Now drag SOURCE and watch Δt CLOSE–ROOM.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'f05.q.1',
    covers: 'sound',
    prompt: 'Close + room are two…',
    options: ['Perspectives', 'Stereo sides', 'Polarities'],
    correct: 'Perspectives',
    explain: 'Two distances: two perspectives, selected or blended — not left and right.',
    why: { 'Stereo sides': 'They are not a left/right pair.', 'Polarities': 'They differ in distance and timing, not polarity.' },
  },
  {
    id: 'f05.q.2',
    covers: 'sound',
    prompt: 'The farther mic hears the action…',
    options: ['Later, with room', 'Sooner, drier', 'Exactly the same'],
    correct: 'Later, with room',
    explain: 'Farther is later and weaker, with more of the room.',
    why: { 'Sooner, drier': 'That is the closer mic.', 'Exactly the same': 'Distance changes both timing and room.' },
  },
  {
    id: 'f05.q.3',
    covers: 'setting',
    prompt: 'Before a second mic goes up, you name…',
    options: ['Its job in the scene', 'Its make and model', 'Its loudest position'],
    correct: 'Its job in the scene',
    explain: 'Detail, whole action, room or travel: each mic has a job.',
    why: { 'Its make and model': 'Choose by properties and the job, not by name.', 'Its loudest position': 'Level is not a job: perspective is.' },
  },
  {
    id: 'f05.q.4',
    covers: 'setting',
    prompt: 'The stage’s room cannot match the picture. A distant mic will…',
    options: ['Record the wrong room', 'Hide the room’s sound', 'Fix the picture’s match'],
    correct: 'Record the wrong room',
    explain: 'A farther mic prints the stage’s own room: favour a closer, drier track.',
    why: { 'Hide the room’s sound': 'It records more of it.', 'Fix the picture’s match': 'It records the mismatch.' },
  },
  clearanceDiag(W),
  hearingDiag(W),
];

const BOOTH = liveBooth(F05_FLOOR);
const wedges: Wedge[] = [
  {
    id: 'wedge',
    label: 'a wedge on the floor in front of the artist, facing back at them',
    short: 'WEDGE',
    p: BOOTH.wedge.p,
    lift: 150,
    faces: BOOTH.wedge.faces,
    note: 'On the floor in front of the artist and off to their right, facing back at them: below and behind a mic aimed at the keys.',
    prov: { kind: 'illustrative', reason: 'a typical station layout; the wedge’s place is a drawing default' },
  },
];

/** The family pages' extra (smallperc/family.ts SpExtra): MEET IT's close-up framing. */
const SP: SpExtra = {
  strikeTitle: 'Handle to sound',
  plan: { box: F05_MODEL.views.top!, things: [] },
  close: { side: { u0: -900, u1: 2700, v0: -1900, v1: 1060 }, top: { u0: -900, u1: 900, v0: -1300, v1: 1300 } },
};

export const F05_LESSON: Lesson & { sp: SpExtra } = {
  id: 'F05',
  labId: 'field',
  title: 'Foley Perspective and Multiple Microphones',
  subtitle: 'One mic for the whole action, a room mic for a reason, a pair for travel — near and far are not left and right',
  noun: { one: 'Foley action', many: 'Foley actions', subject: 'moving action' },
  model: F05_MODEL,
  micTypeIds: ['shotgunShort', 'scSupercard', 'ldcRoom', 'arrCard', 'arrFig8'],
  zones: F05_ZONES,
  setupPairs: F05_PAIRS,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Perspective on a Foley stage: how near the action sounds, how much of the room comes with it, and whether its movement travels across the picture — chosen by where the mics are.', src: 'HECKER' },
    { title: 'THE ACTION', text: 'Keys carried across a marked 2 m path at hand height: a small source that moves, like steps crossing a stage or an object sliding from side to side.', src: 'LESSON-F05' },
    { title: 'THREE TOOLS', text: 'One mono mic; a close mic with a room mic — two perspectives; a stereo pair at one place — the travel left to right. Different jobs, not rivals.', src: 'MIX-2005' },
    { title: 'THE PICTURE DECIDES', text: 'Compare against the dialogue and the ambience of the scene, not an isolated Foley track — and check what the destination does in mono.', src: 'LESSON-F05' },
  ],
  sound: {
    stages: [
      { title: 'The hand moves it', text: 'The artist carries the keys along the path.' },
      { title: 'Key strikes key', text: 'Small, bright metal contacts below the ring.' },
      { title: 'The ring and the keys ring on', text: 'The jingle’s body, at the hand.' },
      { title: 'The room', text: 'The walls send it back — a farther mic hears more of this.' },
    ],
    attack: 'The jingle’s contacts are short and bright: a close mic hears them most clearly.',
    body: 'After them, the keys ringing on and the room: a farther mic hears more of this.',
    head: { diameterMm: 0, rods: 0, label: 'the jingle', strikeSrc: 'LESSON-F05' },
  },
  setting: {
    items: [
      { id: 'path', label: 'the marked path and the artist’s movement', short: 'THE PATH', note: 'Mark the whole path before any stand goes up; every mic, stand and cable stays outside it.', prov: { kind: 'illustrative', reason: 'F05 L51' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'room', label: 'the stage room', short: 'THE ROOM', note: 'A farther mic hears more of it — the right room, or the wrong one for the picture.', prov: { kind: 'illustrative', reason: 'F05 L6' }, tag: 'ROOM SOUND', scene: 'studio' },
      { id: 'pa', label: 'the PA and the wedge', short: 'PA · WEDGE', note: 'Live, every open mic hears them: one close pickup, the wedge in its rejection, the open mics few.', prov: { kind: 'illustrative', reason: 'S-AUTOMIX, S-LIVE' }, tag: 'FEEDBACK PATH', scene: 'stage' },
    ],
    stage: 'LIVE: one stable close mic at a known station, the wedge in its rejection, a second feed only with a purpose — never a ring to find the limit.',
    studio: 'STUDIO: one mic for the whole action, then a room channel or a pair only when the scene asks — each on its own labelled channel.',
  },
  diagnostic,
  practice: {
    task: 'Choose setups for a studio cue and a live station, and say what would justify each extra mic. With a real performer and their agreement, you can record what you tried below.',
    fields: [
      { id: 'cue', label: 'Scene or cue, the shot, the destination (mono?)', kind: 'text' },
      { id: 'path', label: 'The action’s path and the capsule clearance', kind: 'text' },
      { id: 'mono', label: 'One mono mic: near and far, what changed', kind: 'text' },
      { id: 'closeRoom', label: 'Close + room: each alone, the sum in mono', kind: 'text' },
      { id: 'pair', label: 'Pair used', kind: 'choice', choices: ['none', 'X/Y', 'ORTF', 'M/S'] },
      { id: 'geometry', label: 'Its geometry or matrix, and the mono check', kind: 'text' },
      { id: 'live', label: 'Live: open channels, PA and monitor routing', kind: 'text' },
      { id: 'labels', label: 'Final track labels, the chosen perspective and what remains', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The 2 m path, its 1 m hand height, the lane round it (the body and hand plus a margin) — drawing defaults; the practice action is the lesson’s own.', dims: [] },
    { text: 'The room mic’s place (3 m out, 2 m up), the X/Y pair at 1.5 m and the ORTF pair at 2 m, the live station at 0.8–1.1 m — drawing defaults; the close + room method and the pairs’ geometry are sourced.', dims: [] },
    { text: '“About 15 degrees” read as 15° off the artist’s front line in plan (O-4).', dims: [] },
    { text: 'The image position from level and time (full side at 15 dB or 1.1 ms) is a simplified picture; the keys are drawn 3 × life size on the plans.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — possible starting points and ideas to consider, not rules. Every stage, scene and performer is different: move the mics, experiment, and trust your ears and the room. Experimentation is encouraged. The lab is silent and draws a simplified picture: the keys as one point on a straight path, textbook patterns, the two-mic delay and the image from straight-line distances. Distances are rounded and measured from the keys at the middle of the path to the mic’s capsule. Place real mics with the performer stopped, and only with their agreement.',
  copy: F05_COPY,
  sp: SP,
};
