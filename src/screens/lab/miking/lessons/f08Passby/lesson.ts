/**
 * F08 MOVING SOURCES AND PASS-BYS — the lesson as DATA (Miking Lab 6, group
 * 2, branch lab6-g2). Words from the owner's lesson (docs/labs/miking/
 * source_text/F08-Moving-Sources-and-Pass-bys-Miking-Technique.txt, "L<n>"
 * in comments only) with field_moving_passby/SOURCES.md §c applied and
 * logged in CORRECTIONS_LOG.md (Lab 6 · group 2): no institutional wording
 * (F08-C1); a worked Doppler size for walking — about ±7 cents — as a MODEL
 * number, and "never assign a Doppler number to an uncontrolled pass" kept
 * (F08-C2); the dead maker link recorded only (F08-C3); cross-links to
 * unbuilt lessons dropped (F08-C4).
 *
 * Owner rulings: suggested starting points; no source, brand or authority on
 * screen; safety exact in plain words (a stand or a cone is not traffic
 * control; nothing inside the envelope; a vehicle only as a paper plan,
 * O-10); FULLY SILENT — the source moves only under the learner's finger.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom } from '../../engine/model/types.ts';
import { fieldLog, logChoice, logText } from '../shared/field/fieldLog.ts';
import { F08_MODEL } from './geometry.ts';
import { F08_PAIRS, F08_ZONES } from './model.ts';
import { F08_COPY } from './copy.ts';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the pass-by',
    goal: 'Meet a moving source as something to mic: an approach, a closest point and a departure — and the safe place beside its path you listen from.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A pass-by is a whole movement: lead-in, closest point and tail. The path and the safe mic zone are drawn before anything else.',
  },
  sound: {
    title: 'A pass, scrubbed',
    goal: 'Move a walker along the path with your finger and see three separate cues: the level arc, the angle off a mic’s axis, and the small pitch shift of a steady tone.',
    credit: { scenarios: ['pb.snd.1', 'pb.snd.2', 'pb.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'The level rises to the closest point and falls; a directional mic adds its own change off its axis; a steady tone shifts a little up then down. Three different cues — one can happen without the others.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Draw the path, the safe mic zone and the operator’s station before rigging — and keep every person and every stand outside the source’s envelope.',
    credit: { scenarios: ['pb.set.1', 'pb.set.2', 'pb.set.3'], note: 'Answer the three checks.' },
    takeaway: 'Path first, then the mic zone outside its envelope. A walking pass on a closed path for practice; a vehicle only as a paper plan; a stand or a cone is never traffic control.',
  },
  microphone: {
    title: 'Choose the microphones',
    goal: 'Choose by properties — an omni for steady coverage, a cardioid or shotgun aimed at the crossing — and see how a narrow pattern can lose the ends of a pass.',
    credit: { scenarios: ['pb.mic.1', 'pb.mic.2', 'pb.mic.3', 'pb.rec.1'], note: 'Answer the four checks (one reaches back to the pass).' },
    takeaway: 'An omni follows distance alone; a directional mic adds its own off-axis change, and a narrow one can make the pass seem to vanish. Choose by the coverage you need.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — one mic about 1.5 m up, 2–4 m back from the path’s line, outside its envelope — then try the tracked station and a start or end mic.',
    credit: { scenarios: ['pb.place.1', 'pb.place.2', 'pb.place.3', 'pb.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the envelope, in two different starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A setback is a place to begin, measured from the path’s line — not a rule. Closer steepens the arc and needs more headroom; the envelope stays clear whatever the sound.',
  },
  context: {
    title: 'Fixed or tracked, studio or live',
    goal: 'See a fixed pair let the pass cross the image while one mono mic keeps it in place — and why a tracked mic and a fixed array are two viewpoints, not rivals.',
    credit: { scenarios: ['pb.ctx.1', 'pb.ctx.2', 'pb.ctx.3', 'pb.rec.3'], interactive: 'imageSwept', note: 'Drag the source with two different pairs, and answer the four checks.' },
    takeaway: 'A fixed pair shows the crossing; a tracked mono mic holds the subject; two channels are not stereo by themselves. Live, a fixed safe array beats an operator stepping toward the action.',
  },
  twoMic: {
    title: 'Start and end mics',
    goal: 'See two separate mics along the route as two perspectives — loud where the other is far — and why their time difference keeps changing as the source moves.',
    credit: { scenarios: ['pb.two.1', 'pb.two.2', 'pb.two.3', 'pb.two.4'], interactive: 'pairScrubbed', note: 'Drag the source the whole way with the start and end mics, and answer the four checks.' },
    takeaway: 'Separate mics are separate perspectives unless planned as a stereo pair. Their time difference changes all along the pass: summed, they comb, and no single delay fixes the whole pass.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — the position, the headroom, the aim, the wind protection, the routing — before reaching for a limiter or a filter.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a walking-pass session in order, choose and justify setups for a walking pass and a vehicle paper plan, and say what a pitch change can and cannot prove.',
    credit: { scenarios: ['pb.prac.order', 'pb.prac.gain', 'pb.prac.setup1', 'pb.prac.setup2', 'pb.prac.3', 'pb.mix.1', 'pb.mix.2', 'pb.mix.3'], note: 'Put the session in order, answer the headroom check, complete both briefs, and answer the four reasoning cards. The field log is optional — it needs a real, closed route.' },
    takeaway: 'The path drawn and kept clear, the whole pass captured with headroom for its closest moment, the perspective named, mono checked — and a vehicle only ever on paper here. More than one setup can pass.',
  },
};

/* THE CHECKS. Lesson lines in comments only: snd L5, L26 · set L5–L6, L29, L37 · mic L12–L22 ·
 * place L12, L29–L30 · ctx L15–L24, L35 · two L24, L31 · prac L40–L46. */
const scenarios: MikingScenario[] = [
  {
    id: 'pb.snd.1',
    page: 'sound',
    prompt: 'A walker passes a fixed omni. What does the level do?',
    options: ['Rises to the closest point, then falls', 'Stays steady from start to finish', 'Falls first, then rises after it passes'],
    correct: 'Rises to the closest point, then falls',
    explain: 'The distance shrinks to its minimum at the closest point and grows again: the level rises, peaks and falls. The surface, reflections and wind shape the curve too.',
    why: {
      'Stays steady from start to finish': 'The distance changes along the pass, so the level does too.',
      'Falls first, then rises after it passes': 'That is backwards: nearest is loudest, in the middle of the pass.',
    },
  },
  {
    id: 'pb.snd.2',
    page: 'sound',
    prompt: 'A steady tone moves past at walking pace. What happens to its pitch?',
    options: ['A little higher, then a little lower', 'Much higher, then very much lower', 'Much higher first, then much lower later'],
    correct: 'A little higher, then a little lower',
    explain: 'Approaching it arrives a little higher, receding a little lower — at walking pace only about 7 cents either way in the ideal model: hard to hear.',
    why: {
      'Much higher, then very much lower': 'At walking pace the shift is tiny — a few cents.',
      'Much higher first, then much lower later': 'Approach raises the pitch; recession lowers it.',
    },
  },
  {
    id: 'pb.snd.3',
    page: 'sound',
    prompt: 'Panning a mono pass-by from left to right in the mix creates…',
    options: ['Movement in the image, no pitch shift', 'A Doppler shift as the pan sweeps across', 'Both a pitch shift and a level arc'],
    correct: 'Movement in the image, no pitch shift',
    explain: 'Panning moves the sound across the speakers; it does not change its pitch. Doppler happens only when the source and listener really move relative to each other.',
    why: {
      'A Doppler shift as the pan sweeps across': 'Panning changes only the balance between speakers, never the pitch.',
      'Both a pitch shift and a level arc': 'A pan moves the image; any pitch shift or level arc must be in the recording.',
    },
  },
  {
    id: 'pb.set.1',
    page: 'setting',
    prompt: 'You need a vehicle pass for a scene. In this lesson, what do you do?',
    options: ['Write a plan for a supervised session', 'Ask a friend to drive past the stand', 'Use a quiet public road early in the day'],
    correct: 'Write a plan for a supervised session',
    explain: 'A vehicle pass needs a permitted, closed route, a driver, a safety lead and a plan that keeps everyone outside the envelope. Here it is a paper plan only.',
    why: {
      'Ask a friend to drive past the stand': 'Never stage a vehicle pass yourself: it needs a closed route and professional control.',
      'Use a quiet public road early in the day': 'A public road is never the site: a stand or a cone is not traffic control.',
    },
  },
  {
    id: 'pb.set.2',
    page: 'setting',
    prompt: 'Where do the stand and cable go for a walking pass?',
    options: ['Outside the path and its envelope', 'At the path’s edge, cable across it', 'In the path, the walker steps round'],
    correct: 'Outside the path and its envelope',
    explain: 'Keep mics, stands, cables and crew outside the travel path, including the walker’s possible deviation and stopping room.',
    why: {
      'At the path’s edge, cable across it': 'A cable across the path is a trip hazard; route it away from the path.',
      'In the path, the walker steps round': 'Nothing goes in the path: the walker watches the route, not the mic.',
    },
  },
  {
    id: 'pb.set.3',
    page: 'setting',
    prompt: 'Can a stand with a cone beside it make a roadside position safe?',
    options: ['No — a cone is not traffic control', 'Yes — if the cone is bright orange', 'Yes — for a few minutes at a time'],
    correct: 'No — a cone is not traffic control',
    explain: 'Passing traffic is a serious hazard and a practice session cannot create its own traffic control with a stand or a cone. Never set up on an active roadway.',
    why: {
      'Yes — if the cone is bright orange': 'Its colour does not make a cone traffic control.',
      'Yes — for a few minutes at a time': 'A short time on an active road is still on an active road.',
    },
  },
  {
    id: 'pb.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Which of these is NOT created by panning?',
    options: ['A Doppler pitch shift', 'Left–right movement of it', 'A change of side'],
    correct: 'A Doppler pitch shift',
    explain: 'Panning moves the image; the pitch shift comes only from real relative motion during the recording.',
    why: {
      'Left–right movement of it': 'That is exactly what panning creates.',
      'A change of side': 'Panning does move a sound from one side to the other.',
    },
  },
  {
    id: 'pb.mic.1',
    page: 'microphone',
    prompt: 'You want the whole pass at a steady, even pickup. A fair first choice?',
    options: ['A fixed omni beside the path', 'A narrow shotgun aimed at one spot', 'A figure-8 with its side to the path'],
    correct: 'A fixed omni beside the path',
    explain: 'An omni hears about equally all round: the level follows distance alone, with no off-axis change. A directional mic aimed at the crossing is the other fair choice.',
    why: {
      'A narrow shotgun aimed at one spot': 'A narrow mic can lose the ends of the pass off its axis.',
      'A figure-8 with its side to the path': 'Its sides are its nulls: the pass would sit in the rejection.',
    },
  },
  {
    id: 'pb.mic.2',
    page: 'microphone',
    prompt: 'A fixed shotgun makes the pass seem to vanish before it ends. Why?',
    options: ['The walker leaves its narrow axis', 'The walker slows down at the end', 'Shotguns cut off after a few seconds'],
    correct: 'The walker leaves its narrow axis',
    explain: 'Off its axis a narrow mic hears much less, and its tone changes. Use a broader pattern when coverage matters, or document a tracked perspective.',
    why: {
      'The walker slows down at the end': 'Slowing barely changes the level; leaving the axis does.',
      'Shotguns cut off after a few seconds': 'A mic has no timer: the angle changed.',
    },
  },
  {
    id: 'pb.mic.3',
    page: 'microphone',
    prompt: 'A tracked shotgun follows the walker. What tends to change?',
    options: ['It holds the walker, but flattens the arc', 'It adds a Doppler shift of its very own', 'It turns the pass into a real stereo image'],
    correct: 'It holds the walker, but flattens the arc',
    explain: 'Kept on its axis, the walker stays present; the stationary listener’s level arc is flattened, and handling or off-axis colour can creep in.',
    why: {
      'It adds a Doppler shift of its very own': 'The operator turns but does not travel: no added pitch shift.',
      'It turns the pass into a real stereo image': 'One tracked mic is still mono: the mix decides where it sits.',
    },
  },
  {
    id: 'pb.place.1',
    page: 'placement',
    prompt: 'You move the fixed mic closer to the path. What tends to change?',
    options: ['A steeper arc, a louder closest moment', 'A gentler arc and more of the place', 'Nothing but the level of the whole pass'],
    correct: 'A steeper arc, a louder closest moment',
    explain: 'Closer, the distance changes more along the pass: the arc steepens and the closest moment jumps out — leave more headroom.',
    why: {
      'A gentler arc and more of the place': 'That is what moving FARTHER tends to do.',
      'Nothing but the level of the whole pass': 'The shape of the arc changes, not just its level.',
    },
  },
  {
    id: 'pb.place.2',
    page: 'placement',
    prompt: 'Where does the tracking operator stand?',
    options: ['At a fixed, safe station, feet planted', 'On the path, walking with the source', 'Wherever the sound is best at the time'],
    correct: 'At a fixed, safe station, feet planted',
    explain: 'The operator swings the mic from a fixed station outside the route and never steps toward the action to rescue a missed sound.',
    why: {
      'On the path, walking with the source': 'Nobody goes inside the path or its envelope.',
      'Wherever the sound is best at the time': 'Moving toward the action is the hazard: stay at the station.',
    },
  },
  {
    id: 'pb.place.3',
    page: 'placement',
    prompt: 'Mid-pass, the sound is louder than planned. What do you do?',
    options: ['Finish the pass, then add headroom', 'Move the stand closer during the pass', 'Rely on the limiter to rescue it'],
    correct: 'Finish the pass, then add headroom',
    explain: 'Change position, pattern or gain only between passes; never chase the source with a stand during a pass. A limiter cannot rebuild a clipped input.',
    why: {
      'Move the stand closer during the pass': 'Never move a stand during a live pass.',
      'Rely on the limiter to rescue it': 'A limiter cannot reconstruct a clipped input: add headroom and repeat.',
    },
  },
  {
    id: 'pb.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What do you draw before you rig?',
    options: ['The path, the mic zone, the station', 'Only the single best mic spot on its own', 'The mixer’s channel layout only'],
    correct: 'The path, the mic zone, the station',
    explain: 'Approach, closest point, departure, the safe mic zone outside the envelope and the operator’s station come first.',
    why: {
      'Only the single best mic spot on its own': 'The path and its envelope decide where a mic may go at all.',
      'The mixer’s channel layout only': 'Routing matters, but the path and the safe zone come first.',
    },
  },
  {
    id: 'pb.ctx.1',
    page: 'context',
    prompt: 'A fixed X/Y pair records a walker crossing. What does the image do?',
    options: ['It travels from one side to the other', 'It stays in the middle the whole time', 'It jumps between left and right'],
    correct: 'It travels from one side to the other',
    explain: 'The level difference between the two cardioids follows the walker: the image crosses smoothly, and the pair holds up in mono.',
    why: {
      'It stays in the middle the whole time': 'That is a mono mic. A pair places the source by its direction.',
      'It jumps between left and right': 'A coincident pair moves the image smoothly, without a hole.',
    },
  },
  {
    id: 'pb.ctx.2',
    page: 'context',
    prompt: 'Two mics, two channels. Is that a stereo recording?',
    options: ['Only if planned and routed as a pair', 'Two channels make stereo by default', 'It is, if the two mics match exactly'],
    correct: 'Only if planned and routed as a pair',
    explain: 'Two channels are stereo only when their spacing, orientation, routing and blend are planned as an array. Otherwise they are two perspectives.',
    why: {
      'Two channels make stereo by default': 'Two separate mics are two perspectives unless planned as a pair.',
      'It is, if the two mics match exactly': 'Matching helps, but the geometry and routing make a pair.',
    },
  },
  {
    id: 'pb.ctx.3',
    page: 'context',
    prompt: 'Live: the subject wanders off the planned path. What is a fair response?',
    options: ['Track from the safe station, on cues', 'Step toward them to catch the sound', 'Move the stand into their new path'],
    correct: 'Track from the safe station, on cues',
    explain: 'An operator may track from a safe station with intercom or visual cues — never by stepping toward the action.',
    why: {
      'Step toward them to catch the sound': 'Stepping toward the action is the hazard.',
      'Move the stand into their new path': 'Never move hardware into a moving subject’s path.',
    },
  },
  {
    id: 'pb.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · At walking pace, how big is the pitch shift of a steady tone?',
    options: ['About 7 cents either way', 'About a whole tone either way', 'About an octave either way'],
    correct: 'About 7 cents either way',
    explain: 'In the ideal model a walker at 1.4 m/s shifts a steady tone by about +7 cents approaching and −7 receding — barely audible.',
    why: {
      'About a whole tone either way': 'That would need a far faster source.',
      'About an octave either way': 'An octave would need the source near the speed of sound.',
    },
  },
  {
    id: 'pb.two.1',
    page: 'twoMic',
    prompt: 'A start mic and an end mic hear the walker. What are they?',
    options: ['Two separate perspectives', 'A stereo pair by default', 'One mic and its spare'],
    correct: 'Two separate perspectives',
    explain: 'Each is loud where the other is far: two perspectives, each its own labelled channel — unless planned as a stereo pair.',
    why: {
      'A stereo pair by default': 'Two channels are not stereo by themselves.',
      'One mic and its spare': 'Each hears a different part of the pass.',
    },
  },
  {
    id: 'pb.two.2',
    page: 'twoMic',
    prompt: 'Summed, the start and end mics sound hollow, and it changes along the pass. Why?',
    options: ['Their time difference keeps changing', 'One mic has its polarity reversed', 'The walker’s steps get louder'],
    correct: 'Their time difference keeps changing',
    explain: 'The source reaches the two mics at different times, and that difference changes as it moves: the comb’s notches move along the pass.',
    why: {
      'One mic has its polarity reversed': 'A polarity flip changes the sign, not the moving time difference.',
      'The walker’s steps get louder': 'Level alone does not make a comb: the time difference does.',
    },
  },
  {
    id: 'pb.two.3',
    page: 'twoMic',
    prompt: 'Can one fixed delay align the start and end mics for the whole pass?',
    options: ['Only for one point along the pass', 'Set at the closest point, it holds', 'With a polarity flip for the rest'],
    correct: 'Only for one point along the pass',
    explain: 'Any one alignment is true for one place on the path. Choose a blend by listening, or keep the two perspectives separate.',
    why: {
      'Set at the closest point, it holds': 'It would be right only there; elsewhere the difference has changed.',
      'With a polarity flip for the rest': 'Polarity flips the sign; it never removes a delay.',
    },
  },
  {
    id: 'pb.two.4',
    page: 'twoMic',
    prompt: 'Two recorders capture one pass. What makes them line up later?',
    options: ['A synced clock and a common event', 'Pressing record at the same moment', 'The same make of recorder in both'],
    correct: 'A synced clock and a common event',
    explain: 'Synchronise and log the clocks or timecode, and a common event both recorders hear.',
    why: {
      'Pressing record at the same moment': 'Hands are never that exact; log a clock and a common event.',
      'The same make of recorder in both': 'Matching recorders does not sync their clocks.',
    },
  },
  {
    id: 'pb.prac.gain',
    page: 'practice',
    prompt: 'Where do you set the gain for a pass-by?',
    options: ['On the closest, loudest moment', 'On the quiet approach at the start', 'On the tail as it fades out'],
    correct: 'On the closest, loudest moment',
    explain: 'Set headroom for the loudest plausible moment — the closest point — not the quiet approach.',
    why: {
      'On the quiet approach at the start': 'The closest moment would clip.',
      'On the tail as it fades out': 'The tail is the quietest part; the peak would clip.',
    },
  },
  {
    id: 'pb.prac.3',
    page: 'practice',
    prompt: 'Is a tracked mono take a fair choice for a scene that follows the subject?',
    options: ['Yes — labelled as a tracked view', 'No — a pass needs a stereo pair', 'No — tracking is unsafe outdoors'],
    correct: 'Yes — labelled as a tracked view',
    explain: 'A tracked mic matches a camera that follows the subject. Label it as a focused, tracked perspective — a fixed pair is a different viewpoint, not a rule.',
    why: {
      'No — a pass needs a stereo pair': 'A fixed pair is one viewpoint; tracking is another.',
      'No — tracking is unsafe outdoors': 'Tracking from a fixed, safe station is fine; stepping toward the action is not.',
    },
  },
  {
    id: 'pb.mix.1',
    page: 'practice',
    prompt: 'The pitch seemed to drop as a car passed. What can you claim?',
    options: ['Maybe Doppler, maybe the engine', 'A measured Doppler of 98 cents', 'Proof of the car’s exact speed'],
    correct: 'Maybe Doppler, maybe the engine',
    explain: 'An uncontrolled pass never proves a Doppler number: the engine’s own speed changes pitch too. Describe it, do not measure it.',
    why: {
      'A measured Doppler of 98 cents': 'A model number is not a measurement of an uncontrolled pass.',
      'Proof of the car’s exact speed': 'The pitch cannot prove the speed: the engine changes pitch on its own.',
    },
  },
  {
    id: 'pb.mix.2',
    page: 'practice',
    prompt: 'A walker passes a fixed omni and a fixed X/Y pair. Which shows the crossing?',
    options: ['The X/Y pair', 'The fixed omni', 'Neither of them'],
    correct: 'The X/Y pair',
    explain: 'The pair places the walker by its direction, so the image travels; the omni gives the level arc in one place.',
    why: {
      'The fixed omni': 'One mic is mono: it shows the level arc, not the crossing.',
      'Neither of them': 'A fixed pair does show the crossing.',
    },
  },
  {
    id: 'pb.mix.3',
    page: 'practice',
    prompt: 'A high-pass filter cleans the wind from a truck pass. What else can it take?',
    options: ['The truck’s real low-end body', 'Only the wind and nothing else', 'The Doppler shift of the pass'],
    correct: 'The truck’s real low-end body',
    explain: 'A filter can clean wind but remove the vehicle’s real low frequencies. Record a clean, protected raw channel and log any filter.',
    why: {
      'Only the wind and nothing else': 'A filter cannot tell wind from the vehicle’s own low end.',
      'The Doppler shift of the pass': 'A filter does not change pitch.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'pb.sym.clip',
    observation: 'The closest moment of the pass distorts',
    firstChecks: 'The headroom for the closest moment; then the distance — repeat the pass rather than trusting a limiter.',
    options: ['Headroom for the closest point', 'A limiter on the channel', 'A louder walker for the next pass'],
    correct: 'Headroom for the closest point',
    explain: 'Set the gain for the loudest plausible moment and repeat; a limiter cannot rebuild a clipped input.',
    why: { 'A limiter on the channel': 'It cannot reconstruct what already clipped.', 'A louder walker for the next pass': 'That would clip harder.' },
  },
  {
    id: 'pb.sym.vanish',
    observation: 'The pass seems to vanish before it ends',
    firstChecks: 'The pattern and the aim — a narrow mic loses the ends; a broader pattern or a tracked perspective.',
    options: ['The pattern and its aim', 'The recorder’s format', 'The time of the take'],
    correct: 'The pattern and its aim',
    explain: 'A narrow pattern drops the ends of the pass off its axis. Use a broader pattern when coverage matters.',
    why: { 'The recorder’s format': 'The format does not lose the ends; the angle does.', 'The time of the take': 'The time is not the cause; the pattern is.' },
  },
  {
    id: 'pb.sym.hole',
    observation: 'A spaced pair sounds thin in mono as the source crosses',
    firstChecks: 'The spacing and the mono fold-down; compare an X/Y or M/S pair for a mono delivery.',
    options: ['The spacing and the mono fold', 'The walker’s shoes and route', 'The stand’s colour and height'],
    correct: 'The spacing and the mono fold',
    explain: 'Time differences between spaced capsules comb in mono and change through the pass.',
    why: { 'The walker’s shoes and route': 'They change the sound, not the mono comb.', 'The stand’s colour and height': 'Neither causes a comb.' },
  },
  {
    id: 'pb.sym.handling',
    observation: 'Thumps and rubbing on the tracked take',
    firstChecks: 'The grip, the suspension and the cable; a smooth swing with feet planted.',
    options: ['The grip, suspension and cable', 'More gain on the tracked channel', 'A narrower interference tube'],
    correct: 'The grip, suspension and cable',
    explain: 'Handling travels through the pole: use the suspension, secure the cable and swing smoothly.',
    why: { 'More gain on the tracked channel': 'Gain raises the thumps too.', 'A narrower interference tube': 'The tube does not stop handling noise.' },
  },
  {
    id: 'pb.sym.wind',
    observation: 'Gusts thump through the lead-in',
    firstChecks: 'The wind protection and the stands’ stability; then a sheltered position.',
    options: ['The wind protection first', 'A filter on all of the channels', 'A closer, louder walker'],
    correct: 'The wind protection first',
    explain: 'Wind can overwhelm the quiet lead-in. Protect the mic and secure the stand; a filter takes real low end too.',
    why: { 'A filter on all of the channels': 'It removes real low end and cannot undo buffeting.', 'A closer, louder walker': 'It does not stop wind on the capsule.' },
  },
  {
    id: 'pb.sym.swap',
    observation: 'The walker crosses from right to left on playback, but walked left to right',
    firstChecks: 'The channel labels and the pair’s orientation — check with a known source.',
    options: ['The labels and orientation', 'The speed of the walk past it', 'The height of the stand used'],
    correct: 'The labels and orientation',
    explain: 'Label the channels and check left and right with a known source before the passes.',
    why: { 'The speed of the walk past it': 'Speed does not swap sides.', 'The height of the stand used': 'Height does not swap sides.' },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'pb.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a walking-pass session in the order you would do them.',
    steps: [
      { text: 'Scout a closed route with no traffic; agree it with the walker', early: 'Start with a safe, permitted route.' },
      { text: 'Draw the path, its envelope, the mic zone and the station', early: 'Draw before you rig.' },
      { text: 'Rig a protected mic outside the envelope', early: 'Rig once the zone is known.' },
      { text: 'Rehearse once; set headroom for the closest moment', early: 'Set levels on a rehearsal, once the mic is up.' },
      { text: 'Record the whole pass, lead-in to tail', early: 'Record once the headroom is safe.' },
      { text: 'Change one thing between passes; check mono; log it', early: 'Compare only after a full pass is recorded.' },
    ],
    explain: 'A sensible order: a safe route, the path drawn, the mic outside the envelope, a rehearsal for headroom, the whole pass, then one change at a time.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'pb.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A walking pass for a film: a stationary viewer by a park path closed to traffic. Stereo, must fold to mono.',
    setups: [
      { id: 'a', label: 'An X/Y pair 3 m from the path’s line, outside the envelope', ok: true, power: 'phantom', feedback: 'A suggested starting point: the walker crosses the image and the pair holds in mono.' },
      { id: 'b', label: 'An M/S pair at the same spot, Mid and Side labelled', ok: true, power: 'phantom', feedback: 'A fair choice: decoded, it crosses the image; in mono the Mid remains.' },
      { id: 'c', label: 'A stand at the path’s edge, its cable across the path', ok: false, power: 'phantom', feedback: 'The cable across the path is a trip hazard; route it away.' },
      { id: 'd', label: 'Spaced omnis 4 m apart either side of the path', ok: false, power: 'phantom', feedback: 'One would be across the path — and wide spacing combs in mono.' },
      { id: 'e', label: 'A tracked shotgun, the operator walking alongside', ok: false, power: 'phantom', feedback: 'The operator stays at a fixed station — and the brief asked for a stationary viewer.' },
    ],
    reasons: [
      { id: 'r.env', label: 'Everything stays outside the envelope', role: 'required', feedback: 'Clearance is part of every passing setup.' },
      { id: 'r.mono', label: 'The pair holds up in mono', role: 'required', feedback: 'The brief needs mono: say how.' },
      { id: 'r.whole', label: 'The whole pass is captured, lead-in to tail', role: 'optional', feedback: 'A fair reason for any pass-by.' },
      { id: 'r.brand', label: 'It is the brand sound recordists use', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' },
    ],
    explain: 'More than one setup passes. What passes is the reasoning: everything outside the envelope, a pair that crosses the image and holds in mono, and the whole pass captured.',
  },
  {
    id: 'pb.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A paper plan for a professional vehicle session: a closed, permitted route, a driver and a safety lead.',
    setups: [
      { id: 'a', label: 'A fixed pair behind the crew line, outside the envelope', ok: true, power: 'phantom', feedback: 'A suggested plan: the pass from a stationary listener’s place, everyone behind the line.' },
      { id: 'b', label: 'A fixed omni behind the line, headroom for the peak', ok: true, power: 'phantom', feedback: 'A fair plan: steady coverage, with headroom for the loudest moment.' },
      { id: 'c', label: 'A stand at the route’s edge for a closer sound', ok: false, power: 'phantom', feedback: 'Inside the envelope and the stopping room: never.' },
      { id: 'd', label: 'A boom held over the route as the car passes', ok: false, power: 'phantom', feedback: 'No boom over a route with a moving vehicle without qualified production control.' },
      { id: 'e', label: 'Ask the driver to speed up for a bigger shift', ok: false, power: 'phantom', feedback: 'Never ask a driver to change speed for a mic.' },
    ],
    reasons: [
      { id: 'r.line', label: 'All crew and mics stay behind the setback line', role: 'required', feedback: 'Say where the people and the mics stand.' },
      { id: 'r.lead', label: 'The safety lead approves the plan and the stop signal', role: 'required', feedback: 'A vehicle session has a safety lead and a stop signal.' },
      { id: 'r.ears', label: 'Hearing protection that keeps awareness', role: 'optional', feedback: 'A fair reason near a loud vehicle.' },
      { id: 'r.speed', label: 'A faster pass gives a better shift', role: 'wrong', feedback: 'Never ask a driver to change speed for a mic.' },
    ],
    explain: 'Two plans pass. What passes is the reasoning: everyone behind the line, a safety lead and a stop signal, headroom for the loudest moment — and the pass left to the professionals.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you drag: where along the path is the level highest?', options: ['At the closest point', 'At the start', 'At the end'], after: 'Now drag SOURCE the whole way and watch LEVEL and PITCH.' },
  microphone: { prompt: 'Before you move anything: where does a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'In front of it'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the mic closer to the path. What changes?', options: ['A steeper arc', 'A gentler arc', 'Nothing'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'Which shows the walker crossing from left to right?', options: ['A fixed pair', 'One tracked mic', 'Both the same'], after: 'Now drag SOURCE with each PAIR, then with ONE MIC.' },
  twoMic: { prompt: 'As the walker moves, the time between the start and end mics…', options: ['Keeps changing', 'Stays fixed', 'Is always zero'], after: 'Now drag SOURCE and watch Δt.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'pb.q.1',
    covers: 'setting',
    critical: true,
    prompt: 'Can a stand and a cone make a roadside spot safe?',
    options: ['They are not traffic control', 'They are, if bright enough', 'They are, for a quick take only'],
    correct: 'They are not traffic control',
    explain: 'A stand or a cone is not traffic control. Never set up on an active roadway.',
    why: { 'They are, if bright enough': 'Brightness does not make a cone traffic control.', 'They are, for a quick take only': 'A quick take on an active road is still on an active road.' },
  },
  {
    id: 'pb.q.2',
    covers: 'setting',
    critical: true,
    prompt: 'What may be inside a moving source’s envelope?',
    options: ['Nothing and nobody', 'A stand, if it is short', 'The operator, if careful'],
    correct: 'Nothing and nobody',
    explain: 'Mics, stands, cables and crew stay outside the path, its possible deviation and its stopping room.',
    why: { 'A stand, if it is short': 'Nothing goes inside the envelope.', 'The operator, if careful': 'Nobody goes inside it.' },
  },
  {
    id: 'pb.q.3',
    covers: 'sound',
    prompt: 'Where is a fixed mic’s level highest in a pass?',
    options: ['At the closest point', 'At the start of it', 'At the very end'],
    correct: 'At the closest point',
    explain: 'The distance is smallest there: the level peaks, then falls.',
    why: { 'At the start of it': 'The start is far away.', 'At the very end': 'The end is far away too.' },
  },
  {
    id: 'pb.q.4',
    covers: 'sound',
    prompt: 'A steady tone approaching sounds…',
    options: ['A little higher', 'A little lower', 'Exactly the same'],
    correct: 'A little higher',
    explain: 'Approaching raises the pitch a little; receding lowers it.',
    why: { 'A little lower': 'That is the receding half.', 'Exactly the same': 'A moving source shifts the pitch — a little at walking pace.' },
  },
  {
    id: 'pb.q.5',
    covers: 'setting',
    prompt: 'In this lesson, a vehicle pass is…',
    options: ['A paper plan only', 'A quick road test', 'A friend driving by'],
    correct: 'A paper plan only',
    explain: 'A vehicle session needs a closed, permitted route and professional control: here it is planned on paper only.',
    why: { 'A quick road test': 'Never on a public road, however quick.', 'A friend driving by': 'Never staged by you, on any road.' },
  },
  {
    id: 'pb.q.6',
    covers: 'sound',
    prompt: 'Does panning a mono track create a pitch shift?',
    options: ['Only real motion does that', 'A wide enough pan will do it', 'A fast enough pan does'],
    correct: 'Only real motion does that',
    explain: 'Panning moves the image; a Doppler shift needs real relative motion.',
    why: { 'A wide enough pan will do it': 'Width does not change pitch.', 'A fast enough pan does': 'A fast pan moves faster across the speakers — no pitch shift.' },
  },
];

export const F08_LESSON: Lesson = {
  id: 'F08',
  labId: 'field',
  title: 'Moving Sounds and Pass-bys',
  subtitle: 'The path drawn first: a mic 2–4 m back and outside the envelope, fixed or tracked, the whole pass with headroom — a vehicle only on paper',
  noun: { one: 'pass-by', many: 'pass-bys', subject: 'pass-by' },
  model: F08_MODEL,
  micTypeIds: ['arrOmni', 'arrCard', 'arrFig8', 'shotgunShort', 'shotgunPole'],
  zones: F08_ZONES,
  setupPairs: F08_PAIRS,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A source that approaches, crosses and recedes: a walker, a bicycle, a vehicle. The lead-in and the tail matter as much as the loud moment at the closest point.', src: 'LESSON-F08' },
    { title: 'THREE CUES', text: 'A level that rises and falls, a movement across a stereo image, and a small pitch shift of a steady tone: three separate things. One can happen without the others.', src: 'OSX-DOPPLER' },
    { title: 'THE VIEWPOINT', text: 'A stationary listener, a camera that follows the subject, or separate positions you choose between later — decide which before any mic goes up.', src: 'LESSON-F08' },
    { title: 'WHAT THIS LAB DRAWS', text: 'A walker on a park path closed to traffic, 3 m from the listening point — and a vehicle route as a paper plan only. Speeds and distances are drawing defaults; the mics are drawn larger than life.', src: 'LESSON-F08' },
  ],
  sound: {
    stages: [
      { title: 'The approach', text: 'Far away, getting nearer: the level rises.' },
      { title: 'The closest point', text: 'The loudest moment, and where a steady tone is at its own pitch.' },
      { title: 'The departure', text: 'Farther again: the level falls, the pitch a little lower.' },
    ],
    attack: 'The closest moment is the loudest.',
    body: 'The lead-in and the tail tell the listener how far and how fast.',
    head: { diameterMm: 0, rods: 0, label: 'the moving source', strikeSrc: 'LESSON-F08' },
  },
  setting: {
    items: [
      { id: 'env', label: 'the path’s envelope', short: 'ENVELOPE', note: 'Nothing and nobody inside the path, its deviation or its stopping room.', prov: { kind: 'sourced', src: 'LESSON-F08', quote: 'Keep microphones, stands, crew and cables outside active traffic and travel paths, including the subject’s possible deviation and stopping area (L37)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'traffic', label: 'traffic', short: 'TRAFFIC', note: 'Never on an active roadway; a stand or a cone is not traffic control.', prov: { kind: 'sourced', src: 'OSHA-WZ', quote: 'workers are exposed to hazards from passing motor vehicle traffic' }, tag: 'SAFETY', scene: 'all' },
    ],
    stage: 'LIVE: a fixed, safe array on a predictable route, only the needed channels routed, gain checked before feedback.',
    studio: 'FILM: the whole pass, its perspective named — fixed, tracked or separate positions.',
  },
  diagnostic,
  practice: {
    task: 'Choose setups for a walking pass and a vehicle paper plan, and say what a pitch change can and cannot prove. With a consenting walker on a closed route, you can keep a field log below.',
    fields: fieldLog([logText('path', 'The path: approach, closest point, departure, and its envelope'), logChoice('view', 'Perspective', ['Fixed mono', 'Fixed pair', 'Tracked mono', 'Start + end mics'])], { compare: true }),
  },
  unknowns: [
    { text: 'The route, the 3 m line, the 1.5 m envelope, the 1.5 m mic height, the 2–4 m setback, the tracked station and the vehicle plan’s 9 m line, 3 m envelope and crew line — drawing defaults (no source gives a setback, speed or angle: L74).', dims: [] },
    { text: 'Walking 1.4 m/s and the vehicle 20 m/s (paper example) — drawing defaults (O-10); the Doppler shift is the ideal textbook formula for a steady tone.', dims: [] },
    { text: 'The fixed shotgun’s readout uses its supercardioid base; a real shotgun is narrower in the highs.', dims: [] },
    { text: 'The image from level and time differences (full side at 15 dB or 1.1 ms) is a simplified picture.', dims: [] },
  ],
  live: { wedges: [] },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — possible starting points and ideas to consider, not rules. Every route, source and day is different: move the mic between passes, experiment, and trust your ears and the room around you. Experimentation is encouraged. The lab is silent and draws a simplified picture: a straight path, each source as a point in open air, textbook patterns, and the ideal pitch shift of a steady tone — a real pass never proves a Doppler number. Mics are drawn larger than life on the plans. A vehicle appears only as a paper plan.',
  copy: F08_COPY,
};
