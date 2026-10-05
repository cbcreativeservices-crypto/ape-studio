/**
 * I02 CAJÓN — the lesson's pages as DATA (blueprint §7). Words from the
 * owner's lesson (docs/labs/miking/source_text/Cajon-Miking-Technique-
 * Research.txt, "L<n>" in COMMENTS only) with the fixes in CORRECTIONS_LOG.md
 * (CJ-xx) applied. OWNER RULING 2026-10-04: starting points; no source,
 * brand or model in learner text; no badges; FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, PageContent, PageId, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, cardioidNull, CLEAR_REASON, contactSymptom, feedbackSymptom, firstNotch, gainCheck, hearingCheck, louderIsNotBetter, monoSymptom, moveRemovesDelay, noPhantom, PEAK_REASON, polarityKeepsDelay, POWER_REASON, quickHearing, setupOrder, slowMeter, TECH_REASON, type SpWords } from '../shared/smallperc/commonItems.ts';
import type { SpLesson } from '../shared/smallperc/family.ts';
import { STAGE_THINGS, stageItems, standingWedges } from '../shared/smallperc/stage.ts';
import { CAJ_MODEL } from './geometry.ts';
import { CAJ_ZONES } from './model.ts';
import { CAJ_COPY } from './copy.ts';

const W: SpWords = { p: 'caj', the: 'the cajón', a: 'a cajón', noun: 'cajón', player: 'player', loudest: 'the strongest real bass and slap strokes' };

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the cajón',
    goal: 'Get to know the cajón — what it is, where you meet it, what it does in the music, where its port is and how the player sits on it — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A wooden box the player sits on and strikes: the plate and the box sound, the wires add a buzz, the port lets out the low end. Find THIS cajón’s port first.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a stroke becomes the cajón’s sound — the plate, the wires, the air in the box and the port — and what a centre stroke and a corner slap each move. Shown, never played.',
    credit: { scenarios: ['caj.snd.1', 'caj.snd.2', 'caj.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'Centre strokes pump the box’s air (bass, much of it from the port); corner slaps flex the top against the wires (snare-like). The port also puffs air.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the cajón is played — the player seated beside singers and guitars — and what to do before any mic.',
    credit: { scenarios: ['caj.set.1', 'caj.set.hear', 'caj.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Find the port, map both hands, the knees, heels and the way off the box; leave the snares alone. Protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the cajón by its properties — pattern, power, size, how it handles the strongest bass stroke and the port’s air — not by its brand.',
    credit: { scenarios: ['caj.mic.1', 'caj.mic.peak', 'caj.mic.power', 'caj.mic.clamp', 'caj.rec.1'], note: 'Answer the five checks (one reaches back to how the cajón sounds).' },
    takeaway: 'A cardioid condenser or a low-frequency dynamic both appear in working setups. A port clamp only when it is made for the port and the player agrees.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — in front of the plate (close and dead centre, or about 30–40 cm out just below the top edge, angled down), or at the port — outside both hands, the knees and the way off the box.',
    credit: { scenarios: ['caj.place.1', 'caj.place.2', 'caj.place.3', 'caj.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Front for attack and slap, port for low end and air — two working examples, not an average. Outside the hands, legs, rocking box and exit.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s real rejection faces a loud unwanted source — and decide between one mic and two.',
    credit: { scenarios: ['caj.ctx.1', 'caj.ctx.2', 'caj.ctx.studio', 'caj.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the downstage wedge sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'One practical mic may do live; keep only the channels that help. Check low-end feedback with the whole PA on. Never add gain to beat feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See how a front mic and a port mic interact — they face opposite ways, arrival times differ, comb-filter notches appear — and what polarity does and does not change.',
    credit: { scenarios: ['caj.two.1', 'caj.two.2', 'caj.two.3', 'caj.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Compare BOTH polarities in mono with the full pattern, and move a mic: flipping one channel is an example, not a rule. Polarity does not remove a delay.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'The stroke, the port and the balance first — then position, polarity, the stand, spill and the monitors.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two briefs, and say what would justify a second mic.',
    credit: { scenarios: ['caj.prac.order', 'caj.prac.gain', 'caj.prac.setup1', 'caj.prac.setup2', 'caj.prac.3', 'caj.mix.1', 'caj.mix.2', 'caj.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'A safe first mic, a second only for a defined bass or slap need, both hands’ arcs and the exit mapped, bass and slap tested with the band, mono and feedback checked. More than one setup can pass.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L7-L9 · set L8, L37-L38 · mic L34-L35 ·
 * place L11-L12, L32-L33 · ctx L45-L57 · two L13 · prac L59-L64, L81. */
const scenarios: MikingScenario[] = [
  {
    id: 'caj.snd.1',
    page: 'sound',
    prompt: 'Why is the cajón an idiophone, not a drum with a head?',
    options: ['Its wooden plate and box vibrate — no stretched head', 'Its front plate is a thin skin stretched tight over the box', 'The snare wires inside are what make it sound'],
    correct: 'Its wooden plate and box vibrate — no stretched head',
    explain: 'The sounding material is the wood itself; the bass and snare names describe the sounds, not a membrane.',
    why: {
      'Its front plate is a thin skin stretched tight over the box': 'The plate is wood, struck — not a stretched skin.',
      'The snare wires inside are what make it sound': 'The wires add a buzz to the plate; the box is the instrument.',
    },
  },
  {
    id: 'caj.snd.2',
    page: 'sound',
    prompt: 'A centre stroke, then a top-corner slap. What changes?',
    options: ['Low bass from the centre, a snare-like slap at the corner', 'Very little — the plate sounds much the same wherever it is struck', 'The corner stroke is lower in pitch than the centre stroke'],
    correct: 'Low bass from the centre, a snare-like slap at the corner',
    explain: 'Centre hits give the low thump; top-corner hits give a snare-like slap with the wires.',
    why: {
      'Very little — the plate sounds much the same wherever it is struck': 'Where the hand lands is the bass or the slap.',
      'The corner stroke is lower in pitch than the centre stroke': 'The centre gives the low end; the corner the slap.',
    },
  },
  {
    id: 'caj.snd.3',
    page: 'sound',
    prompt: 'What else comes out of the port on a bass stroke?',
    options: ['A puff of air', 'Nothing but sound', 'Only the slap'],
    correct: 'A puff of air',
    explain: 'The port can send an air pulse toward a mic — some models fit a port filter for that reason.',
    why: {
      'Nothing but sound': 'Bass strokes push air out of the port too.',
      'Only the slap': 'The port carries much of the low end, not the slap.',
    },
  },
  {
    id: 'caj.set.1',
    page: 'setting',
    prompt: 'What is the first physical decision for a cajón mic?',
    options: ['Where THIS cajón’s port actually is', 'Which brand of mic the player prefers to use', 'How loud the cajón is compared with the drums'],
    correct: 'Where THIS cajón’s port actually is',
    explain: 'Do not assume every cajón has a rear hole: front-facing ports and other designs change the setup.',
    why: {
      'Which brand of mic the player prefers to use': 'The port and the player’s space decide first.',
      'How loud the cajón is compared with the drums': 'Level matters later; the port’s location comes first.',
    },
  },
  hearingCheck(W),
  {
    id: 'caj.set.2',
    page: 'setting',
    prompt: 'Which space must a stand and cable stay out of?',
    options: ['The hands’ arcs, knees, heels, rocking and the way off the box', 'Only the space right in front of the plate, where the hands strike', 'Only the port’s air, behind the player'],
    correct: 'The hands’ arcs, knees, heels, rocking and the way off the box',
    explain: 'Keep the mic, grille, boom and cable outside the hand arcs, knees, ankles, heels, any rocking — and where the player sits, stands and leaves.',
    why: {
      'Only the space right in front of the plate, where the hands strike': 'Knees, heels and the exit path matter too.',
      'Only the port’s air, behind the player': 'The hands and legs are in front.',
    },
  },
  {
    id: 'caj.mic.1',
    page: 'microphone',
    prompt: 'Which mic types appear in working cajón setups?',
    options: ['A cardioid condenser, or a low-frequency dynamic', 'Only one specific model — no other will do', 'Only an omni mic, because the box is a large, spread-out source'],
    correct: 'A cardioid condenser, or a low-frequency dynamic',
    explain: 'A cardioid condenser in one demonstration; a low-frequency dynamic in another maker’s cajón package. No model is mandatory.',
    why: {
      'Only one specific model — no other will do': 'No model is mandatory: choose by properties.',
      'Only an omni mic, because the box is a large, spread-out source': 'Cardioids appear in working setups; the room decides.',
    },
  },
  slowMeter(W),
  noPhantom(W),
  {
    id: 'caj.mic.clamp',
    page: 'microphone',
    prompt: 'A clip-on mic at the port: when is it fair?',
    options: ['Only on a clamp made for the port, with the player’s say', 'Whenever the stage is crowded and short of stands and booms', 'Inside the box, resting loose on the bottom'],
    correct: 'Only on a clamp made for the port, with the player’s say',
    explain: 'Do not fasten a clamp to thin wood or into a port unless that hardware is designed for this model — and never a loose mic inside.',
    why: {
      'Whenever the stage is crowded and short of stands and booms': 'A crowded stage is not a compatible clamp.',
      'Inside the box, resting loose on the bottom': 'Never a loose mic inside the box: it can touch the wires.',
    },
  },
  {
    id: 'caj.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A port mic pops on every bass stroke. What is happening?',
    options: ['The port’s air is reaching the mic', 'The mic is faulty, so replace it with a spare', 'The slaps are too loud on stage'],
    correct: 'The port’s air is reaching the mic',
    explain: 'Offset or move the mic first; check any port filter and windscreen suitability; lower gain only if the input overloads.',
    why: {
      'The mic is faulty, so replace it with a spare': 'Air pops point at the position.',
      'The slaps are too loud on stage': 'The pops come with the bass strokes, from the port.',
    },
  },
  {
    id: 'caj.place.1',
    page: 'placement',
    prompt: 'One example puts the front mic close, another 30–40 cm out. Which is right?',
    options: ['Both are working examples — compare by ear', 'The close one — close is the better choice on a cajón', 'Average them: put the mic at about 25 cm'],
    correct: 'Both are working examples — compare by ear',
    explain: 'Different practitioners’ examples, not two distances to average, and not a guarantee of the same sound.',
    why: {
      'The close one — close is the better choice on a cajón': 'Close favours attack and puts the mic near the hands.',
      'Average them: put the mic at about 25 cm': 'Averaging two examples is not a third example.',
    },
  },
  {
    id: 'caj.place.2',
    page: 'placement',
    prompt: 'The front mic needs more slap. What do you try first?',
    options: ['Aim it higher or toward a corner', 'A big boost on the channel’s top end', 'Ask the player to slap much harder'],
    correct: 'Aim it higher or toward a corner',
    explain: 'Moving the aim upward or toward a corner may reveal slap and snare detail; toward the middle, more bass strokes.',
    why: {
      'A big boost on the channel’s top end': 'Placement first; EQ lifts the spill too.',
      'Ask the player to slap much harder': 'The strokes are the music.',
    },
  },
  {
    id: 'caj.place.3',
    page: 'placement',
    prompt: 'The port is on the FRONT of this model. Where does the port mic go?',
    options: ['At the front, offset from the port’s air', 'Behind the player, where ports usually are', 'Inside the box, through the port hole'],
    correct: 'At the front, offset from the port’s air',
    explain: 'A front-facing port changes the relevant side of the instrument: revise the port position.',
    why: {
      'Behind the player, where ports usually are': 'There is no rear hole on this model.',
      'Inside the box, through the port hole': 'Never a loose mic inside the box.',
    },
  },
  {
    id: 'caj.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · The slaps vanish behind a big, boomy low end. What is likely?',
    options: ['A port-heavy balance hiding the attack', 'The snare wires have come loose inside', 'The room is too dry for a cajón'],
    correct: 'A port-heavy balance hiding the attack',
    explain: 'Check the front aim, the player’s technique, the wires (with consent) and whether a port-heavy balance hides the attack.',
    why: {
      'The snare wires have come loose inside': 'Possible — but check the balance first, and touch the wires only with consent.',
      'The room is too dry for a cajón': 'Boom over slap points at the balance.',
    },
  },
  {
    id: 'caj.ctx.1',
    page: 'context',
    prompt: 'A small live stage: does the cajón need two mics?',
    options: ['Not always — one practical mic may suffice', 'Yes — a cajón needs a front and a port mic on stage', 'Yes — one mic cannot hear a cajón live'],
    correct: 'Not always — one practical mic may suffice',
    explain: 'Each open channel can increase spill and feedback; keep only channels that improve a relevant output.',
    why: {
      'Yes — a cajón needs a front and a port mic on stage': 'A second mic must earn its place.',
      'Yes — one mic cannot hear a cajón live': 'One front or port mic often does.',
    },
  },
  {
    id: 'caj.ctx.2',
    page: 'context',
    prompt: 'The singer and guitar dominate the cajón’s mic. What do you reconsider first?',
    options: ['The distance, the pattern and the layout', 'More gain on the cajón’s channel', 'A gate set tight on the cajón’s channel to keep spill out'],
    correct: 'The distance, the pattern and the layout',
    explain: 'Reconsider the mic distance and pattern, the ensemble layout and whether a second open mic is useful.',
    why: {
      'More gain on the cajón’s channel': 'Gain lifts the singer and guitar with it.',
      'A gate set tight on the cajón’s channel to keep spill out': 'Ghost notes would vanish with the spill.',
    },
  },
  {
    id: 'caj.ctx.studio',
    page: 'context',
    prompt: 'A solo cajón in a good room. One distant mic?',
    options: ['It can carry the whole box and the room', 'Not for a cajón — a mic must be close', 'Only with a second mic inside the box as well, for the bass'],
    correct: 'It can carry the whole box and the room',
    explain: 'In a suitable room a single, more distant mic can represent the whole instrument — with more of the room and anything else in it.',
    why: {
      'Not for a cajón — a mic must be close': 'A wider mic is a working perspective in a good room.',
      'Only with a second mic inside the box as well, for the bass': 'Never a loose mic inside the box.',
    },
  },
  {
    id: 'caj.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Footsteps and chair noise reach the mic. Where do you look first?',
    options: ['The stand, the cable, a clamp and the floor', 'The plate — it needs a firmer stroke from the player', 'The snare wires — they need tightening'],
    correct: 'The stand, the cable, a clamp and the floor',
    explain: 'Check the stand and cable contact, clamp vibration, the floor and the player’s movement.',
    why: {
      'The plate — it needs a firmer stroke from the player': 'Footsteps come through the floor and stand.',
      'The snare wires — they need tightening': 'The wires are the player’s, and not the cause here.',
    },
  },
  polarityKeepsDelay(W),
  firstNotch(W),
  {
    id: 'caj.two.3',
    page: 'twoMic',
    prompt: 'Front plus port, and the blend sounds thin. Should you compare both polarities in mono before deciding?',
    options: ['Yes — both states in mono, then move a mic if needed', 'No — opposite-facing mics need one channel flipped by rule', 'No — set it once and there is no need to check it again'],
    correct: 'Yes — both states in mono, then move a mic if needed',
    explain: 'Flipping one channel is a common first thing to try with a front and a port mic — not an automatic rule for every cajón, pattern and placement. Compare both states in mono with the full pattern, and move a mic if neither works.',
    why: {
      'No — opposite-facing mics need one channel flipped by rule': 'The best combined result is context-dependent: try it, then judge both states by ear.',
      'No — set it once and there is no need to check it again': 'Listen in mono with the full pattern each time.',
    },
  },
  louderIsNotBetter(W),
  gainCheck(W),
  {
    id: 'caj.prac.3',
    page: 'practice',
    prompt: 'What would justify adding the port mic to a front mic?',
    options: ['A defined need to balance low end and attack', 'A rule that a cajón takes two mics, front and port', 'The front mic is not loud enough on its own in the mix'],
    correct: 'A defined need to balance low end and attack',
    explain: 'Use two channels when the front attack and the box’s low end need independent balance.',
    why: {
      'A rule that a cajón takes two mics, front and port': 'No such rule: one mic often does.',
      'The front mic is not loud enough on its own in the mix': 'Level comes from gain, not another mic.',
    },
  },
  {
    id: 'caj.mix.1',
    page: 'practice',
    prompt: 'A starting point says “30–40 cm from the plate”. What else do you need before placing it?',
    options: ['The hands’ arcs, the knees, the port and the exit', 'The cajón’s maker, so the number fits its size', 'Nothing more: the number already says where it goes'],
    correct: 'The hands’ arcs, the knees, the port and the exit',
    explain: 'The player’s motion sets the clearance; the port sets the other side; the exit keeps the player safe.',
    why: {
      'The cajón’s maker, so the number fits its size': 'The maker does not change the player’s arcs.',
      'Nothing more: the number already says where it goes': 'A distance means nothing without the motion and the aim.',
    },
  },
  cardioidNull(W),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  {
    id: 'caj.s.weak',
    observation: 'Hollow or weak bass',
    firstChecks: 'The centre stroke, the front/port balance — and do two mics cancel in mono?',
    options: ['The balance and the mono sum; then position and polarity', 'A big low-end boost on the front channel’s EQ to fill it out', 'Ask the player to hit the centre much harder'],
    correct: 'The balance and the mono sum; then position and polarity',
    explain: 'Listen to the centre stroke and the balance; try relative position and polarity as a conditional test.',
    why: {
      'A big low-end boost on the front channel’s EQ to fill it out': 'A cancellation cannot be boosted back.',
      'Ask the player to hit the centre much harder': 'The strokes are the music.',
    },
  },
  {
    id: 'caj.s.pop',
    observation: 'The port channel booms or pops',
    firstChecks: 'Is the mic in the port’s air? What is this cajón’s port design?',
    options: ['Offset or move the mic; check the filter', 'Tape over the port so the air cannot reach the mic', 'A high-pass filter set as high as it goes on the port channel'],
    correct: 'Offset or move the mic; check the filter',
    explain: 'Offset or move the mic, check port-filter and windscreen suitability, lower gain only if the input overloads.',
    why: {
      'Tape over the port so the air cannot reach the mic': 'Never block or modify the port to solve a mic problem.',
      'A high-pass filter set as high as it goes on the port channel': 'It takes the bass the port mic is for.',
    },
  },
  {
    id: 'caj.s.slap',
    observation: 'Corner slaps or snare disappear',
    firstChecks: 'The front aim, the technique, the wires — or a port-heavy balance?',
    options: ['The front aim and the balance; the wires only with consent', 'Tighten the snare wires inside the box as far as they go', 'A gate on the port channel, opened wide'],
    correct: 'The front aim and the balance; the wires only with consent',
    explain: 'Check the front aim, performer technique, the internal wire setting with consent, and whether a port-heavy balance hides the attack.',
    why: {
      'Tighten the snare wires inside the box as far as they go': 'The wires are the player’s to change.',
      'A gate on the port channel, opened wide': 'The slap lives on the front channel.',
    },
  },
  {
    id: 'caj.s.thump',
    observation: 'Footsteps or chair motion enter the mic',
    firstChecks: 'Stand and cable contact, clamp vibration, the floor?',
    options: ['The stand, cable, clamp and floor', 'A high-pass on the front channel', 'A heavier mic on the stand, so it moves less'],
    correct: 'The stand, cable, clamp and floor',
    explain: 'Check stand and cable contact, clamp vibration, the floor and the player’s movement.',
    why: {
      'A high-pass on the front channel': 'Fix the path first; a filter can thin the bass.',
      'A heavier mic on the stand, so it moves less': 'The vibration comes through the stand and floor.',
    },
  },
  feedbackSymptom(W),
  monoSymptom(W),
  contactSymptom(W),
];

const setupTasks: SetupTask[] = [
  {
    id: 'caj.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A studio session: a rear-port cajón with snare wires, played seated; bass strokes, slaps and ghost notes. Phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser about 35 cm in front, just below the top edge, angled down at the plate', ok: true, power: 'phantom', feedback: 'Outside the hands and knees, hearing the whole plate; it needs the phantom this channel has.' },
      { id: 'b', label: 'That front mic plus a dynamic about 20 cm behind, offset toward the port', ok: true, power: 'phantom', feedback: 'Front plus port for separate low end — check both polarities in mono.' },
      { id: 'c', label: 'A loose mic laid inside the box through the port', ok: false, power: 'phantom', feedback: 'Never a loose mic inside: it can touch the wires and be trapped.' },
      { id: 'd', label: 'A mic 5 cm from the plate’s top corner', ok: false, power: 'phantom', feedback: 'Inside the hands’ arcs — the player would hit it.' },
      { id: 'e', label: 'Tape the snare wires to stop the buzz first', ok: false, power: 'none', feedback: 'The wires are the player’s; never alter them without agreement.' },
    ],
    reasons: [{ id: 'r.doc', label: 'It starts about 30–40 cm from the middle of the plate, outside both hands and the knees', role: 'required', feedback: 'Say what it is measured from — and how it stays clear.' }, CLEAR_REASON, POWER_REASON, PEAK_REASON, BRAND_REASON, TECH_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a start outside the player’s motion, a second mic only for a defined need, power that matches the mic.',
  },
  {
    id: 'caj.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A small live stage: the player sits on a FRONT-PORT cajón beside a singer and an acoustic guitar. The spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'A low-frequency dynamic in front, offset from the upward port', ok: true, power: 'none', feedback: 'The port is in front on this model; a dynamic needs no phantom.' },
      { id: 'b', label: 'A dynamic in front of the plate, angled down, a null toward the wedge', ok: true, power: 'none', feedback: 'One practical mic; a dynamic needs no phantom.' },
      { id: 'c', label: 'A mic behind the player, aimed at the back', ok: false, power: 'none', feedback: 'This model has no rear port — revise the port position.' },
      { id: 'd', label: 'A small condenser in front of the plate', ok: false, power: 'phantom', feedback: 'This input has no phantom power, and a condenser needs it.' },
      { id: 'e', label: 'A mic straight down the port’s axis, 5 cm away', ok: false, power: 'none', feedback: 'Square in the port’s air: pops and boom.' },
    ],
    reasons: [{ id: 'r.doc', label: 'It is at the side the port really is, offset from its air, outside the player’s motion', role: 'required', feedback: 'Say where the port is — and how the mic stays clear.' }, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'Fewer open mics keep spill and feedback down', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, TECH_REASON],
    explain: 'Two setups pass. What passes is the reasoning: the port where it is, clearance, and power the input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: a centre stroke — where does much of the low end leave?', options: ['The port', 'The top of the box', 'The feet'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch the plate and the port.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: a front mic aimed at the middle, or at a top corner — which hears more slap?', options: ['The middle', 'A top corner', 'It depends on this cajón'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge sits behind the mic and off to one side. Can a cardioid’s null reach it?', options: ['Yes — with a tilt of the mic', 'No — only a tighter pattern’s null can', 'It is already in the null'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'A front and a rear mic face opposite ways. If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'caj.q.1',
    covers: 'instrument',
    prompt: 'What kind of instrument is a box cajón?',
    options: ['A struck idiophone', 'A membranophone with a wooden head', 'A shaken rattle, like a maraca'],
    correct: 'A struck idiophone',
    explain: 'Its wood vibrates when struck — no stretched membrane.',
    why: {
      'A membranophone with a wooden head': 'There is no stretched membrane; the wood itself sounds.',
      'A shaken rattle, like a maraca': 'It is struck by the hands.',
    },
  },
  {
    id: 'caj.q.2',
    covers: 'instrument',
    prompt: 'Can a cajón’s port face front, or sit somewhere other than the back?',
    options: ['Yes — some face front, or sit elsewhere', 'No — it sits behind the player on all of them', 'No — the port has to face the wall'],
    correct: 'Yes — some face front, or sit elsewhere',
    explain: 'Do not assume every cajón has a rear hole: front-facing and other ports exist.',
    why: {
      'No — it sits behind the player on all of them': 'A front-port model has none behind.',
      'No — the port has to face the wall': 'Where the port is depends on the model.',
    },
  },
  {
    id: 'caj.q.3',
    covers: 'sound',
    prompt: 'Where does the snare-like slap come from?',
    options: ['A top-corner stroke, with the wires', 'A centre stroke, deep in the plate', 'The port, on each stroke the hands make'],
    correct: 'A top-corner stroke, with the wires',
    explain: 'Top-corner hits give the snare-like slap; the wires inside add the buzz.',
    why: {
      'A centre stroke, deep in the plate': 'The centre gives the low thump.',
      'The port, on each stroke the hands make': 'The port carries the low end and air.',
    },
  },
  {
    id: 'caj.q.4',
    covers: 'sound',
    prompt: 'A mic pointed straight into the port: is that the whole cajón’s sound?',
    options: ['No — it is one view, with air and boom', 'Yes — the port is where the sound is made', 'Yes — and it hears the slaps best'],
    correct: 'No — it is one view, with air and boom',
    explain: 'A mic pointed into a hole is not automatically the sound of the whole instrument.',
    why: {
      'Yes — the port is where the sound is made': 'The plate makes the attack and slap.',
      'Yes — and it hears the slaps best': 'The slaps come from the plate.',
    },
  },
  {
    id: 'caj.q.5',
    covers: 'setting',
    prompt: 'What sets the gap for a front cajón mic?',
    options: ['Both hands’ arcs, the knees, heels and the exit', 'The box’s width and its height', 'The length of the microphone’s body and its clip'],
    correct: 'Both hands’ arcs, the knees, heels and the exit',
    explain: 'No source gives a universal safe clearance: the seated player’s complete movement decides.',
    why: {
      'The box’s width and its height': 'The box stays put; the hands move.',
      'The length of the microphone’s body and its clip': 'Fitting is not clearing the hands.',
    },
  },
  quickHearing(W),
];

export const I02_LESSON: SpLesson = {
  id: 'I02',
  labId: 'percussion',
  title: 'Cajón',
  subtitle: 'A box you sit on: find the port first — front, back, or both — outside the hands, knees and the way off',
  noun: { one: 'cajón', many: 'cajones' },
  model: CAJ_MODEL,
  micTypeIds: ['orchSdc', 'kickDynCard', 'portClip'],
  zones: CAJ_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    setupOrder(W, { text: 'Find the port; map both hands, the knees, heels and the way off the box', early: 'Start with the cajón, the player and the music.' }, { text: 'Hear whether one front mic — or a wider one — already carries it', early: 'Hear what one mic gives before you add a second.' }),
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A wooden box the player sits astride and strikes: a struck idiophone — the plate and the box vibrate, with no stretched head. Wires or strings inside can add a snare buzz.', src: 'GRIN-CAJ' },
    { title: 'WHERE YOU MEET IT', text: 'Acoustic sets, singer-songwriter stages, flamenco and pop — often beside a singer and an acoustic guitar.', src: 'LESSON-CAJON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'A whole kit in a box: centre strokes for the bass, top-corner slaps for the snare, ghost notes in between.', src: 'MEINL-JC50' },
    { title: 'ITS SIZE', text: 'A museum cajón measures about 32 × 32 × 48 cm with an 18 cm port; this lab draws one that size.', src: 'GRIN-CAJ' },
  ],
  sound: {
    stages: [
      { title: 'The hand strikes', text: 'A hand strikes the plate — centre for bass, top corner for slap: the ATTACK.' },
      { title: 'The plate flexes', text: 'The plate flexes (drawn much larger); at the top the wires buzz against it.' },
      { title: 'The box’s air', text: 'The plate pushes and pulls the air in the box: the BODY and the low end.' },
      { title: 'Sound leaves', text: 'From the plate — and from the port: low end, and a puff of air on bass strokes.' },
    ],
    attack: 'The hand on the plate: a sharp attack at a corner slap, a softer thump at the centre.',
    body: 'The air in the box and the plate together: the low end, much of it out of the port. Tendencies — boxes, floors and players vary.',
    head: { diameterMm: 318, rods: 0, label: 'the plate', strikeSrc: 'GRIN-CAJ' },
  },
  setting: {
    items: [
      { id: 'cajon', label: 'the cajón player', short: 'CAJÓN', note: 'Seated on the box, knees either side of the plate; the way off the box is to their left — keep it clear. The drawing every page of this lesson uses.', prov: { kind: 'illustrative', reason: 'a typical small-stage layout; no source gives positions' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'vocal', label: 'the singer and their mic', short: 'VOCAL MIC', note: 'Beside the cajón: their mic hears the box, and the cajón’s mic hears the voice.', prov: { kind: 'illustrative', reason: 'a typical small-stage layout' }, tag: 'ANOTHER MIC', scene: 'kit' },
      { id: 'guitar', label: 'the acoustic guitarist', short: 'GUITAR', note: 'Another open mic or pickup close by: spill both ways.', prov: { kind: 'illustrative', reason: 'a typical small-stage layout' }, tag: 'SPILL', scene: 'kit' },
      ...stageItems('the cajón', 'One front or port mic may be enough; a second only for a defined bass or slap need.'),
    ],
    stage: 'LIVE: one practical front or port mic may suffice; check low-end feedback and the singer’s and guitar’s spill with the whole PA and monitors on.',
    studio: 'RECORDING: a front mic or a wider room mic may represent the whole instrument; a port mic adds optional control — heard together in mono.',
  },
  diagnostic,
  practice: {
    task: 'Choose a safe first mic, justify any front/port pair, map both hands’ arcs and the exit, test bass and slap with the band, and check mono and feedback. With a real cajón and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'inst', label: 'Cajón: model, port location, snares', kind: 'text' },
      { id: 'port', label: 'Port', kind: 'choice', choices: ['rear', 'front', 'other', 'none'] },
      { id: 'mic', label: 'Mic setup', kind: 'choice', choices: ['one front', 'one port', 'front + port', 'one wider'] },
      { id: 'dist', label: 'Positions you tried', kind: 'text' },
      { id: 'pol', label: 'Front + port: which polarity, and why', kind: 'text' },
      { id: 'notes', label: 'What you heard (bass, slap, air, spill)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The port’s height on the back (300 mm), the plate’s thickness (4 mm), the feet (8 mm), and the front-port model’s set-back plate (69 mm), ledge (170 mm) and port (Ø 100) — drawing defaults; the box and port sizes are a museum example’s.', dims: ['portH', 'plateT', 'feet', 'setBack', 'ledgeH', 'portF'] },
    { text: 'The seated player — hips, knees, heels, both hands’ arcs (drawn out to 130 mm from the plate), the box rocking back, the way off — ILLUSTRATIVE.', dims: [] },
    { text: 'The close front spot (about 15–18 cm) and the wider front and rear positions (30–40 cm; about 20 cm) are two practitioners’ working examples, not a standard.', dims: [] },
  ],
  live: { wedges: standingWedges('the cajón') },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every cajón, player, floor and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a box cajón with a seated player, the plate’s flex drawn as a shape, a front-port model with a vertical set-back plate (real ones slant), mic patterns and the two-mic comb as textbook shapes. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.',
  copy: CAJ_COPY,
  sp: {
    strikeTitle: 'Strike to sound',
    close: { side: { u0: -560, u1: 560, v0: -1250, v1: 40 }, top: { u0: -560, u1: 560, v0: -420, v1: 420 } },
    plan: {
      box: { u0: -2600, u1: 2700, v0: -2100, v1: 2100 },
      things: [
        { id: 'cajon', kind: 'drums', u: 0, v: 0, scene: 'all' },
        { id: 'vocal', kind: 'micstand', u: 900, v: -900, scene: 'all' },
        { id: 'guitar', kind: 'player', u: -100, v: 1150, scene: 'all' },
        ...STAGE_THINGS,
      ],
    },
  },
};
