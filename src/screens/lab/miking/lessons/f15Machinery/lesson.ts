/**
 * F15 MACHINERY AND PRODUCT SOUND — the lesson as DATA (Miking Lab 6:
 * Foley, Field & Scientific; Lab 6 group 5, branch lab6-g5). Words from the
 * owner's lesson (docs/labs/miking/source_text/F15-Machinery-and-Product-
 * Sound-Miking-Technique.txt; "L<n>" in comments only); research in
 * docs/labs/miking/machinery_sound/ (SOURCES.md, GEOMETRY_PROPOSAL.md);
 * corrections in CORRECTIONS_LOG.md ("Lab 6 · group 5").
 *
 * Owner rulings: suggested starting points, never dogma; no source, brand,
 * model or standard number on screen (D-6B-3); safety exact in plain words
 * — guards stay on, never reach through a guard, no sensor on an operating
 * machine, lockout is for authorized people (F15 L24, L47–L48); the device
 * drawn is a guarded desk fan, and an industrial machine appears only as a
 * no-go example; FULLY SILENT. The claim ladder (shared with F16) and a
 * made-up cycle strip sit on the two-mic page (D-6B-2).
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, Prediction, SetupReason, SetupTask, SourcePageId, Symptom } from '../../engine/model/types.ts';
import { PRODUCT_SHEET } from '../shared/measure/logSheet.ts';
import { F15_MODEL } from './geometry.ts';
import { F15_ZONES } from './model.ts';
import { F15_COPY } from './copy.ts';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the device',
    goal: 'Meet the lesson’s device — a guarded desk fan on a small table — its guard, its motor, the exclusion zone round it and the airflow ahead of it, before any mic.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A low-risk, guarded device under its own instructions, an exclusion zone round it, and the question first: a creative sound, a comparison, a fault, a work-position level or a sound power.',
  },
  sound: {
    title: 'How the fan reaches A, B and C',
    goal: 'See the fan’s sound reach three positions at the same radius — the same direct path, different bounces — and keep pressure, vibration and sound power apart.',
    credit: { scenarios: ['mp.snd.1', 'mp.snd.2', 'mp.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'A mic reads the airborne pressure where its capsule sits; a contact sensor reads vibration in other units; sound power is a property of the device, estimated under a method.',
  },
  setting: {
    title: 'Before the fan runs',
    goal: 'Settle the permission, the guards, the exclusion zone, the background and the chain before the device is switched on.',
    credit: { scenarios: ['mp.set.1', 'mp.set.2', 'mp.set.3'], note: 'Answer the three checks.' },
    takeaway: 'Guards and interlocks stay on. Never reach through a guard; never put a sensor on, open, service or modify an operating machine; lockout is for authorized people.',
  },
  microphone: {
    title: 'Two channels',
    goal: 'Build a chain for a before-and-after or a rattle hunt — the airborne mic, the vibration channel, the gain, the claim — and see the wrong ones refused, with why.',
    credit: { scenarios: ['mp.mic.1', 'mp.mic.2', 'mp.mic.3', 'mp.rec.1'], interactive: 'chainBuilt', note: 'Build a chain that passes its question in TWO CHANNELS, and answer the four checks.' },
    takeaway: 'Airborne pressure and vibration are two channels in two units; their timing gives clues, not a proven path. Fixed gain with headroom; a dBFS peak is not a sound level.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and move the mic yourself — the user’s position, the same radius to the side and behind, a close detail outside the zone, a listener’s perspective farther out.',
    credit: { scenarios: ['mp.place.1', 'mp.place.2', 'mp.place.3', 'mp.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of everything, in two different suggested starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Positions from outside the zone only, at a logged radius and height, one change at a time — and back to A to check it repeats.',
  },
  context: {
    title: 'Keep out',
    goal: 'Find where a mic may and may not go round a running device — the exclusion zone, the airflow — and see the industrial machine that is a no-go.',
    credit: { scenarios: ['mp.ctx.1', 'mp.ctx.2', 'mp.rec.3'], interactive: 'keepOut', note: 'In KEEP OUT, try a position in the zone, one in the airflow and a clear one, look at the no-go machine, and answer the three checks.' },
    takeaway: 'Nothing enters the exclusion zone; a capsule in the airflow reads wind; an industrial machine is never a place to practise — guards on, lockout by authorized people only.',
  },
  twoMic: {
    title: 'The cycle and the claims',
    goal: 'Take a short sample and the whole cycle of a made-up run and see what each catches — then judge which claims each setup can support.',
    credit: { scenarios: ['mp.two.1', 'mp.two.2', 'mp.two.3'], interactive: 'cycleClaims', note: 'In THE CYCLE LOG take a short sample and the whole cycle; on THE CLAIM LADDER judge every claim right for one setup; and answer the three checks.' },
    takeaway: 'Whole cycles, repeated, with the start, the steady state and the stop marked. Then the claim no bigger than the setup: perspective, comparison, calibrated pressure, or sound power under a method.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the cycle, the position, the airflow and the background before the device: a changed load, a gust on the capsule or a rattle missed by a short take.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a product session in order, choose a setup for two briefs, and say what kind of result each one is.',
    credit: { scenarios: ['mp.prac.order', 'mp.prac.gain', 'mp.prac.setup1', 'mp.prac.setup2', 'mp.prac.3', 'mp.mix.1', 'mp.mix.2', 'mp.mix.3'], note: 'Put the session in order, answer the headroom card, complete both briefs, and answer the four reasoning cards. The field sheet is optional.' },
    takeaway: 'A safe boundary, the same geometry, whole cycles, pressure kept apart from vibration and sound power — and every claim it cannot carry said out loud.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L5, L13–L16, L22, L28 · set L6, L24, L47–L48 · mic L22, L27–L28 ·
 * place L13–L15, L24 · ctx L24, L37–L39, L47 · two L27, L30–L31 · prac L52–L58. */
const scenarios: MikingScenario[] = [
  {
    id: 'mp.snd.1',
    page: 'sound',
    prompt: 'A mic at the user’s position: what does its reading describe?',
    options: ['The pressure at that point, at that load', 'The fan’s sound power in all directions', 'The user’s whole daily noise dose at work'],
    correct: 'The pressure at that point, at that load',
    explain: 'A fixed position describes what is heard at that point under that operating state. Sound power and a personal dose need their own methods.',
    why: {
      'The fan’s sound power in all directions': 'Sound power is estimated over a defined surface under a method — not from one point.',
      'The user’s whole daily noise dose at work': 'A dose needs the exposure method, the duration and the work pattern: a short sample at one point is not one.',
    },
  },
  {
    id: 'mp.snd.2',
    page: 'sound',
    prompt: 'A contact sensor on the housing shows a peak. What has it measured?',
    options: ['The housing’s vibration, in its units', 'The airborne sound level at the fan', 'The fan’s level as heard at the user’s ear'],
    correct: 'The housing’s vibration, in its units',
    explain: 'A contact sensor reads vibration through the structure, in its own units. It is not a calibrated airborne level.',
    why: {
      'The airborne sound level at the fan': 'Vibration and airborne pressure are different quantities on different paths.',
      'The fan’s level as heard at the user’s ear': 'The sensor is on the housing, not at an ear, and it does not read the air.',
    },
  },
  {
    id: 'mp.snd.3',
    page: 'sound',
    prompt: 'A, B and C sit 1 m from the fan. Why can they still differ?',
    options: ['Direction and room paths differ', 'The direct sound is later at C', 'Only the mic’s gain setting can differ'],
    correct: 'Direction and room paths differ',
    explain: 'The direct path is the same length, but the fan sends more of some sounds one way, and the table, the floor and the wall reach each point by different paths.',
    why: {
      'The direct sound is later at C': 'At the same radius the direct sound arrives together; the bounces differ.',
      'Only the mic’s gain setting can differ': 'With the gain fixed, the position itself changes what is heard.',
    },
  },
  {
    id: 'mp.set.1',
    page: 'setting',
    prompt: 'A position you want is inside the exclusion zone. What do you do?',
    options: ['Leave it out of the plan', 'Reach in briefly while it runs', 'Take the guard off for a moment'],
    correct: 'Leave it out of the plan',
    explain: 'If a planned position cannot be reached safely from outside the hazard zone, omit it. Guards stay in place.',
    why: {
      'Reach in briefly while it runs': 'Nothing — a stand, a cable, a hand — enters the zone while the fan runs.',
      'Take the guard off for a moment': 'Guards and interlocks stay in place: a cleaner take is no reason to remove one.',
    },
  },
  {
    id: 'mp.set.2',
    page: 'setting',
    prompt: 'A contact sensor would help on a running industrial machine. What do you do?',
    options: ['Leave it to authorized people', 'Fit it yourself while it runs', 'Hold it on by hand for a take'],
    correct: 'Leave it to authorized people',
    explain: 'You never place a sensor on, open, service or modify an operating machine. Access that counts as servicing falls under the employer’s hazardous-energy procedure, done by authorized people.',
    why: {
      'Fit it yourself while it runs': 'Never on an operating machine: isolation and installation are for authorized people.',
      'Hold it on by hand for a take': 'Never by hand on a running device, guarded or not.',
    },
  },
  {
    id: 'mp.set.3',
    page: 'setting',
    prompt: 'Before the fan runs, what do you record?',
    options: ['The background, with the fan off', 'The peak level the fan can reach', 'Nothing until the fan is warm'],
    correct: 'The background, with the fan off',
    explain: 'Record the background with the device off, where that is safe — other machines, air handling, the room — so a change can be told from the room.',
    why: {
      'The peak level the fan can reach': 'The peak comes later, in the runs; first the background, with the fan off.',
      'Nothing until the fan is warm': 'The background is recorded before the device runs, then the warm-up state is logged.',
    },
  },
  {
    id: 'mp.mic.1',
    page: 'microphone',
    prompt: 'The recorder peaks at −6 dBFS on the start-up. What do you know about the level?',
    options: ['Nothing in dB SPL yet', 'It is 6 dB below the limit', 'It is a safe 94 dB'],
    correct: 'Nothing in dB SPL yet',
    explain: 'A waveform peak in dBFS is relative to the recorder’s own maximum — not a sound-pressure level without a calibrated chain.',
    why: {
      'It is 6 dB below the limit': 'Below the recorder’s maximum, yes — which says nothing about the sound pressure.',
      'It is a safe 94 dB': 'Nothing ties this recorder’s scale to a pressure: the number is made up.',
    },
  },
  {
    id: 'mp.mic.2',
    page: 'microphone',
    prompt: 'The mic and the sensor both peak at one frequency. What can you say?',
    options: ['It is a clue worth following', 'The vibration caused the sound', 'The sound shook the housing'],
    correct: 'It is a clue worth following',
    explain: 'A coincident peak is suggestive, not proof of one path: a panel can radiate vibration into the air, and the air can shake a panel. A transfer study needs more sensors.',
    why: {
      'The vibration caused the sound': 'Possible — but a shared peak alone cannot tell which way it went.',
      'The sound shook the housing': 'Possible too — which is exactly why a shared peak proves neither.',
    },
  },
  {
    id: 'mp.mic.3',
    page: 'microphone',
    prompt: 'Why fix the gain with headroom before the runs?',
    options: ['So the start and stop never clip', 'So the fan sounds louder on the take', 'So the meter can read a peak in dB'],
    correct: 'So the start and stop never clip',
    explain: 'Lock the gain and processing, and leave headroom for the start, the stop, an impact or a fault transient — the same for every run.',
    why: {
      'So the fan sounds louder on the take': 'Headroom is about not clipping and comparing runs, not loudness.',
      'So the meter can read a peak in dB': 'Headroom does not turn a recorder into a meter.',
    },
  },
  {
    id: 'mp.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A and C are at the same radius. Which differs between them?',
    options: ['The bounces each one hears', 'The direct sound’s arrival', 'The fan’s operating speed'],
    correct: 'The bounces each one hears',
    explain: 'The direct sound arrives together at the same radius; the table, the floor and the wall reach each one by different paths.',
    why: {
      'The direct sound’s arrival': 'Same radius, same direct path length: it arrives together.',
      'The fan’s operating speed': 'The speed is the device’s state, held the same for every run.',
    },
  },
  {
    id: 'mp.place.1',
    page: 'placement',
    prompt: 'From A to B, what do you keep the same?',
    options: ['The radius, height, gain and cycle', 'Only the gain, to make them match', 'Only the angle; the rest may move about'],
    correct: 'The radius, height, gain and cycle',
    explain: 'Change one position at a time: at the same radius, height, gain and operating cycle, the difference belongs to the angle.',
    why: {
      'Only the gain, to make them match': 'Matching the gain to the reading hides the very difference you moved to see.',
      'Only the angle; the rest may move about': 'The angle is what changes; everything else stays.',
    },
  },
  {
    id: 'mp.place.2',
    page: 'placement',
    prompt: 'Position C is behind the fan, past its motor. How do you reach it?',
    options: ['Round the outside of the zone', 'Across the top of the guard, quickly', 'Through the gap by the table'],
    correct: 'Round the outside of the zone',
    explain: 'Walk round, outside the exclusion zone: never reach across or through the guard, and keep the cable clear of it.',
    why: {
      'Across the top of the guard, quickly': 'Reaching over a running fan puts hands, sleeves and cables in its zone.',
      'Through the gap by the table': 'Any path inside the zone is out, however short.',
    },
  },
  {
    id: 'mp.place.3',
    page: 'placement',
    prompt: 'A close mic by the motor sounds great. What does it stand for?',
    options: ['One part of the fan, up close', 'The whole fan at the user’s ear', 'The fan’s total sound power'],
    correct: 'One part of the fan, up close',
    explain: 'A close mic emphasizes one panel, motor end or vent — useful for detail or diagnosis, not the whole device at a listening distance.',
    why: {
      'The whole fan at the user’s ear': 'Up close one part dominates; the user hears the whole fan from farther away.',
      'The fan’s total sound power': 'One close point cannot give a property of the whole device.',
    },
  },
  {
    id: 'mp.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Your A reading changed after the break. What do you check first?',
    options: ['The load, the speed and the room', 'The mic, which must have failed', 'The fan’s blades, for chips and damage'],
    correct: 'The load, the speed and the room',
    explain: 'If the operating state or the background changed, a change in sound is not evidence about the device. Check the cycle and the room before the hardware.',
    why: {
      'The mic, which must have failed': 'A failed mic is a late suspect: first the operating state and the background.',
      'The fan’s blades, for chips and damage': 'Possible, but the commoner causes are the load, the speed and the room.',
    },
  },
  {
    id: 'mp.ctx.1',
    page: 'context',
    prompt: 'Why keep the capsule out of the fan’s airflow?',
    options: ['It reads wind, not the fan', 'The air cools the capsule', 'The airflow is too quiet'],
    correct: 'It reads wind, not the fan',
    explain: 'In a moving airstream, turbulence on the capsule can dominate the reading. Move beside the stream.',
    why: {
      'The air cools the capsule': 'Temperature is not the problem: wind noise on the capsule is.',
      'The airflow is too quiet': 'The stream is not quiet at the capsule: the wind on it is the problem.',
    },
  },
  {
    id: 'mp.ctx.2',
    page: 'context',
    prompt: 'A live product demo with a PA in the room. Where does the detail mic go?',
    options: ['Outside the zone, kept out of the PA', 'Inside the guard, for the best clarity', 'Close to the PA, for a clean feed'],
    correct: 'Outside the zone, kept out of the PA',
    explain: 'A perspective that shows the product without getting close, its stand and cable out of moving paths, and no feed into the local PA.',
    why: {
      'Inside the guard, for the best clarity': 'Never inside the guard: clarity comes from the position, not the risk.',
      'Close to the PA, for a clean feed': 'Near the PA is feedback waiting to happen, and far from the product.',
    },
  },
  {
    id: 'mp.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · A peak appears near the rear vent. What might it be?',
    options: ['Motor, vent air or wind on the mic', 'Proof the motor bearing is failing', 'Only the room’s reflection off the wall'],
    correct: 'Motor, vent air or wind on the mic',
    explain: 'A peak near a vent may come from directed air, the motor, or a wind artifact on the capsule. Investigate with repeatable conditions before calling it a fault.',
    why: {
      'Proof the motor bearing is failing': 'A peak is not proof of a fault: a qualified assessment comes before that claim.',
      'Only the room’s reflection off the wall': 'The wall may add to it, but the vent’s air and the motor are likelier first.',
    },
  },
  {
    id: 'mp.two.1',
    page: 'twoMic',
    prompt: 'A 5-second take in the steady run shows no rattle. What do you conclude?',
    options: ['Too short to tell: take whole cycles', 'The fan runs cleanly, with no rattle at all', 'The rattle was the mic, not the fan'],
    correct: 'Too short to tell: take whole cycles',
    explain: 'A brief take at one phase can miss an intermittent rattle or exaggerate a start-up. Capture complete cycles and repeat them.',
    why: {
      'The fan runs cleanly, with no rattle at all': 'Five seconds can fall between two rattles.',
      'The rattle was the mic, not the fan': 'Nothing in a clean short take says that.',
    },
  },
  {
    id: 'mp.two.2',
    page: 'twoMic',
    prompt: 'One mic at A, B and C, gain fixed, no calibration. Which claim fits?',
    options: ['A relative comparison', 'A calibrated level at A', 'The fan’s sound power'],
    correct: 'A relative comparison',
    explain: 'Fixed positions, gain and cycle support a relative comparison. A level needs a calibrated chain; sound power needs a method.',
    why: {
      'A calibrated level at A': 'Without a calibrated chain the reading cannot be reported as a level.',
      'The fan’s sound power': 'Three positions are not the method’s surface, room or corrections.',
    },
  },
  {
    id: 'mp.two.3',
    page: 'twoMic',
    prompt: 'What does a formal sound-power survey need that your walk round does not have?',
    options: ['A defined surface, room and method', 'More mics on the same three spots', 'A louder speed setting on the fan itself'],
    correct: 'A defined surface, room and method',
    explain: 'A defined measurement surface, positions, a qualifying environment, the operating conditions and the corrections of the current method — and a qualified team.',
    why: {
      'More mics on the same three spots': 'More mics at the same spots are still not the method’s surface.',
      'A louder speed setting on the fan itself': 'The operating state is set by the method, not raised for a reading.',
    },
  },
  {
    id: 'mp.prac.gain',
    page: 'practice',
    prompt: 'Before the runs, how do you set the gain?',
    options: ['Fixed, with room for the start-up', 'High, so the steady run is loud', 'Auto, so each run fills the meter'],
    correct: 'Fixed, with room for the start-up',
    explain: 'Lock the gain with headroom for the start, the stop and any transient — the same for every run, so the runs compare.',
    why: {
      'High, so the steady run is loud': 'A high gain clips the start-up and the rattles.',
      'Auto, so each run fills the meter': 'Auto-gain makes each run different: the comparison is lost.',
    },
  },
  {
    id: 'mp.prac.3',
    page: 'practice',
    prompt: 'Which is an honest label for a layered, processed fan effect?',
    options: ['A designed effect', 'A calibrated level', 'An unaltered record'],
    correct: 'A designed effect',
    explain: 'A designed or layered effect is useful — said as designed, never presented as an unaltered measurement.',
    why: {
      'A calibrated level': 'Processing and layering remove any claim to a level.',
      'An unaltered record': 'Layered and processed is the opposite of unaltered.',
    },
  },
  {
    id: 'mp.mix.1',
    page: 'practice',
    prompt: 'A 10-second take from the start-up alone. What does it exaggerate?',
    options: ['The start-up event', 'The steady hum', 'The room’s noise'],
    correct: 'The start-up event',
    explain: 'A short take at one phase can exaggerate a start-up or miss a rattle: capture whole cycles, start to stop.',
    why: {
      'The steady hum': 'The steady run is mostly missing from a take of the start-up.',
      'The room’s noise': 'The background is recorded separately, with the device off.',
    },
  },
  {
    id: 'mp.mix.2',
    page: 'practice',
    prompt: 'The level at B jumped when a door opened. What do you do with that run?',
    options: ['Annotate it and repeat the run', 'Average it in with the others', 'Raise the gain to match the jump'],
    correct: 'Annotate it and repeat the run',
    explain: 'Annotate interruptions, overloads and changes in speed or background; repeat the run rather than averaging a disturbance in.',
    why: {
      'Average it in with the others': 'An average hides the disturbance inside the result.',
      'Raise the gain to match the jump': 'The gain stays fixed; the run is repeated.',
    },
  },
  {
    id: 'mp.mix.3',
    page: 'practice',
    prompt: 'A phone at A, auto-gain on. Which claim may it carry?',
    options: ['A creative perspective', 'A relative comparison', 'A calibrated level at A'],
    correct: 'A creative perspective',
    explain: 'Auto-gain rides the level between and within takes: honest as a perspective, not as a comparison or a level.',
    why: {
      'A relative comparison': 'Auto-gain changes the level by itself: before and after no longer compare.',
      'A calibrated level at A': 'A phone with auto-gain is not a calibrated chain.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'mp.sym.1',
    observation: 'A rumble and a hiss at A come and go with no change in the fan',
    firstChecks: 'The airflow on the capsule; the windscreen; the position',
    options: ['Wind on the capsule: move it', 'The fan’s motor speeding up', 'The calibrator left switched on'],
    correct: 'Wind on the capsule: move it',
    explain: 'A capsule in or near the airstream reads turbulence. Move it beside the stream and check the windscreen.',
    why: {
      'The fan’s motor speeding up': 'The fan did not change: the air on the capsule did.',
      'The calibrator left switched on': 'A calibrator is a steady tone at the capsule, not a coming-and-going rumble.',
    },
  },
  {
    id: 'mp.sym.2',
    observation: 'The before and after runs differ, but the fan’s speed setting was moved between them',
    firstChecks: 'The operating state: speed, load, warm-up',
    options: ['The speed: repeat at the same one', 'The new blade, which must be louder', 'The mic’s aim, by a degree'],
    correct: 'The speed: repeat at the same one',
    explain: 'If the operating state changed, the difference is not evidence about the hardware. Repeat at the state written in the log.',
    why: {
      'The new blade, which must be louder': 'The speed changed too: the blade cannot be judged from these runs.',
      'The mic’s aim, by a degree': 'A degree of aim is small beside a change in speed.',
    },
  },
  {
    id: 'mp.sym.3',
    observation: 'The rattle shows in one take and not in the next',
    firstChecks: 'The length of the takes; the cycle; the load',
    options: ['The takes: capture whole cycles', 'The mic, which is intermittent', 'The room, which keeps changing'],
    correct: 'The takes: capture whole cycles',
    explain: 'An intermittent rattle can fall between short takes. Capture complete cycles with a marker and repeat them.',
    why: {
      'The mic, which is intermittent': 'A faulty mic would show in every sound, not only the rattle.',
      'The room, which keeps changing': 'Check the room too, but a short take is the commoner cause.',
    },
  },
  {
    id: 'mp.sym.4',
    observation: 'The start-up clips; the steady run is fine',
    firstChecks: 'The headroom for the start and stop',
    options: ['Headroom: lower and fix the gain', 'The fan, which starts too loudly', 'The cable, which loses signal'],
    correct: 'Headroom: lower and fix the gain',
    explain: 'Leave headroom for the start, the stop and any transient, and keep that gain for every run.',
    why: {
      'The fan, which starts too loudly': 'The start-up is part of the cycle: the gain must allow for it.',
      'The cable, which loses signal': 'Clipping is too much signal, not too little.',
    },
  },
  {
    id: 'mp.sym.5',
    observation: 'The contact sensor’s channel looks like a level in dB SPL',
    firstChecks: 'Its units and its channel label',
    options: ['Its units: vibration, not air', 'Its gain, which needs a boost', 'Its cable, which is too long'],
    correct: 'Its units: vibration, not air',
    explain: 'A contact sensor’s output is vibration in its own units on its own channel — never a calibrated airborne level.',
    why: {
      'Its gain, which needs a boost': 'Gain does not change what the channel measures.',
      'Its cable, which is too long': 'The cable does not change the quantity either.',
    },
  },
  {
    id: 'mp.sym.6',
    observation: 'You cannot reach position C without leaning over the fan',
    firstChecks: 'A path round the zone, or leaving C out',
    options: ['Walk round, or leave C out', 'Lean over it, quickly', 'Switch it on low and reach'],
    correct: 'Walk round, or leave C out',
    explain: 'If a position cannot be reached safely from outside the zone, omit it — never lean or reach over a running device.',
    why: {
      'Lean over it, quickly': 'Quickly is still inside the zone, over a running fan.',
      'Switch it on low and reach': 'Low speed does not make reaching over a running fan safe.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'mp.prac.order',
    page: 'practice',
    prompt: 'A product session, start to finish: put the steps in order.',
    steps: [
      { text: 'Write the purpose; agree permission and safe access with the owner', early: 'Permission and the purpose come before anything is set up.' },
      { text: 'Sketch the device, its guard and the exclusion zone; mark A, B and C outside it', early: 'The zone is drawn before any position is chosen.' },
      { text: 'With the device off, record the background', early: 'The background comes before the device runs.' },
      { text: 'Run whole cycles at A and repeat, staying outside the zone', early: 'A comes once the background is logged.' },
      { text: 'The same at B and C, gain fixed, then back to A', early: 'B and C follow A, at the same gain.' },
      { text: 'Compare by band and segment; label the result honestly', early: 'The label closes the session.' },
    ],
    explain: 'Permission, the zone, the background, A and its repeat, B and C, back to A — then the honest label: perspective, comparison or calibrated pressure.',
  },
];

const R = (id: string, label: string, role: SetupReason['role'], feedback: string): SetupReason => ({ id, label, role, feedback });
const setupTasks: SetupTask[] = [
  {
    id: 'mp.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Is the fan with its new blade quieter for the user? No calibrated chain today.',
    setups: [
      { id: 'a', label: 'One mic at A, before and after, gain and cycle the same, labelled relative', ok: true, power: 'phantom', feedback: 'One position, everything else fixed: an honest relative comparison.' },
      { id: 'abc', label: 'One mic at A, B and C, before and after, gain fixed, labelled relative', ok: true, power: 'phantom', feedback: 'More positions, still one change at a time: also sound.' },
      { id: 'phone', label: 'A phone with auto-gain, held where it sounds best', ok: false, power: 'none', feedback: 'Auto-gain and a moving position: nothing compares.' },
    ],
    reasons: [
      R('same', 'The same position, gain and cycle before and after', 'required', 'Only the blade may change.'),
      R('label', 'The result is labelled relative', 'required', 'No calibrated chain: relative is the honest word.'),
      R('repeat', 'Each run repeated, with a return to A', 'optional', 'It shows the setup did not drift.'),
      R('power', 'The result is reported as the fan’s sound power', 'wrong', 'Sound power needs a method, a surface and a qualifying room.'),
    ],
    explain: 'Either plan passes: one change at a time and an honest label.',
  },
  {
    id: 'mp.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A rattle comes and goes. Find clues to where it starts, safely.',
    setups: [
      { id: 'two', label: 'Mic at A and a contact sensor fitted while isolated, whole cycles, gain fixed', ok: true, power: 'phantom', feedback: 'Two channels in two units, timing compared as clues.' },
      { id: 'abc', label: 'One mic at A, B and C through whole cycles, gain fixed, the rattles marked', ok: true, power: 'phantom', feedback: 'Where it is loudest is a clue too — from safe positions.' },
      { id: 'hand', label: 'A sensor held on the housing by hand while it runs', ok: false, power: 'none', feedback: 'Never by hand on a running device.' },
    ],
    reasons: [
      R('whole', 'Whole cycles, so the rattle is caught', 'required', 'A short take can miss it.'),
      R('safe', 'Every position and sensor reached safely', 'required', 'Outside the zone; sensors fitted only while isolated, by an authorized person.'),
      R('clues', 'Findings said as clues, not a proven path', 'optional', 'A shared peak suggests; it does not prove.'),
      R('proof', 'A shared peak proves the bracket is loose', 'wrong', 'A coincident peak is a clue, not proof.'),
    ],
    explain: 'Either safe plan passes: whole cycles, positions outside the zone, clues kept as clues.',
  },
];

const predictions: Partial<Record<SourcePageId, Prediction>> = {
  microphone: { prompt: 'A contact sensor on the housing and a mic at A. Do they measure the same thing?', options: ['Two quantities', 'The same sound', 'Only in the lows'], after: 'Build the channels and read what each one is.' },
  placement: { prompt: 'From A to B at the same radius: what changes?', options: ['The direction and the bounces', 'The direct sound’s timing', 'Nothing'], after: 'Move it and read what the zone says.' },
  context: { prompt: 'A mic in the fan’s airflow at 1 m: what does it mostly read?', options: ['Wind on the capsule', 'The blades', 'The motor'], after: 'Move it and see which keep-out stops it.' },
  twoMic: { prompt: 'A 5-second take in the steady run: will it catch the rattle?', options: ['Maybe not', 'Yes', 'Only at the start'], after: 'Slide a short sample along the run.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'mp.q.1',
    covers: 'setting',
    critical: true,
    prompt: 'A good position is behind the guard. What do you do?',
    options: ['Leave it out', 'Reach through briefly', 'Take the guard off'],
    correct: 'Leave it out',
    explain: 'Guards stay on; never reach through a guard. A position you cannot reach from outside is left out.',
    why: {
      'Reach through briefly': 'Never through a guard, however briefly.',
      'Take the guard off': 'Guards and interlocks stay in place.',
    },
  },
  {
    id: 'mp.q.2',
    covers: 'setting',
    critical: true,
    prompt: 'Who fits a sensor to an operating industrial machine?',
    options: ['Authorized people, isolated', 'You, carefully, while it runs', 'Whoever is closest to it'],
    correct: 'Authorized people, isolated',
    explain: 'Never place a sensor on, open, service or modify an operating machine; lockout and installation are for authorized people.',
    why: {
      'You, carefully, while it runs': 'Not on an operating machine, carefully or not.',
      'Whoever is closest to it': 'Being close is not authorization.',
    },
  },
  {
    id: 'mp.q.3',
    covers: 'sound',
    prompt: 'What does a contact sensor on the housing read?',
    options: ['Vibration, in its units', 'Airborne sound level in dB', 'The fan’s sound power'],
    correct: 'Vibration, in its units',
    explain: 'Vibration and acoustic pressure use different units and paths.',
    why: {
      'Airborne sound level in dB': 'The sensor reads the structure, not the air.',
      'The fan’s sound power': 'Sound power is estimated under a method, from the air.',
    },
  },
  {
    id: 'mp.q.4',
    covers: 'sound',
    prompt: 'A mic at the user’s position describes what?',
    options: ['The pressure there', 'The fan’s sound power', 'The user’s daily dose'],
    correct: 'The pressure there',
    explain: 'One point, one operating state: the pressure there, not a property of the fan or a personal dose.',
    why: {
      'The fan’s sound power': 'That needs a defined surface under a method.',
      'The user’s daily dose': 'That needs an exposure method and a work pattern.',
    },
  },
  {
    id: 'mp.q.5',
    covers: 'setting',
    prompt: 'What do you record with the fan off?',
    options: ['The background', 'The fan’s peak', 'The calibrator'],
    correct: 'The background',
    explain: 'The background, with the device off where safe — so a change can be told from the room.',
    why: {
      'The fan’s peak': 'The fan’s peak needs the fan running.',
      'The calibrator': 'A calibrator check is part of a calibrated chain, not the background.',
    },
  },
  {
    id: 'mp.q.6',
    covers: 'setting',
    prompt: 'Why keep a mic out of the fan’s airflow?',
    options: ['It reads wind', 'It cools the mic', 'It is too quiet'],
    correct: 'It reads wind',
    explain: 'Turbulence on the capsule can dominate the reading.',
    why: {
      'It cools the mic': 'The trouble is wind noise, not temperature.',
      'It is too quiet': 'The wind on the capsule is anything but quiet.',
    },
  },
];

export const F15_LESSON: Lesson = {
  id: 'F15',
  labId: 'field',
  title: 'Machinery and Product Sound',
  subtitle: 'A guarded device, a safe boundary, whole cycles from the same positions — and a claim no bigger than the setup',
  noun: { one: 'device', many: 'devices', subject: 'guarded desk fan' },
  model: F15_MODEL,
  micTypeIds: ['measFF', 'measRI', 'sdcCard'],
  zones: F15_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  setupPairs: [{ label: 'A and B: the same radius, two sides', A: { zone: 'mp.A' }, B: { zone: 'mp.B' }, line: 'One radius, one height, two angles: the difference belongs to the angle — if the cycle and the room stayed the same.' }],
  orient: [
    { title: 'WHAT IT IS', text: 'Miking a product while it runs, from repeatable, safe positions: what a user hears at a stated point, a comparison before and after a change, or clues to a fault — each claim no bigger than the setup.', src: 'F15-LESSON' },
    { title: 'THE DEVICE', text: 'A low-risk, intact, guarded device under its own instructions — here a desk fan on a small table. Industrial machines are not a place to practise: they appear here only as a no-go example.', src: 'F15-LESSON' },
    { title: 'TWO KINDS OF SIGNAL', text: 'A mic reads the airborne pressure where its capsule sits; a contact sensor, fixed on by someone qualified while the device is isolated, reads the housing’s vibration in other units.', src: 'F15-LESSON' },
    { title: 'THE KEEP-OUTS', text: 'Round the running fan, an exclusion zone — the guard plus a margin — and its airflow. Nothing goes inside either: the drawing’s 0.3 m margin and 30° cone are drawings; the device and the site set the real ones.', src: 'F15-LESSON' },
  ],
  sound: {
    stages: [
      { title: 'Blades and air', text: 'The blades push the air: a whoosh and a blade tone, strongest along the airflow.' },
      { title: 'Motor and housing', text: 'The motor hums; a loose part rattles; the housing vibrates and radiates.' },
      { title: 'The room', text: 'The table, the floor and the walls send each position its own bounces.' },
    ],
    attack: 'Close to the housing, one part of the fan dominates.',
    body: 'Farther out, the whole fan and the room arrive together.',
    head: { diameterMm: 300, rods: 0, label: 'the fan’s guard', strikeSrc: 'F15-LESSON' },
  },
  setting: {
    items: [
      { id: 'zone', label: 'the exclusion zone and the guard', short: 'THE ZONE', note: 'No mic, stand, cable or hand inside it while the fan runs; never reach through the guard. A position you cannot reach from outside is left out.', prov: { kind: 'sourced', src: 'F15-LESSON', quote: 'If the planned position cannot be reached safely from outside the hazard zone, omit that position (F15 L47)' }, tag: 'KEEP OUT', scene: 'all' },
      { id: 'air', label: 'the airflow', short: 'AIRFLOW', note: 'A capsule in the stream reads wind. Keep the mics beside it.', prov: { kind: 'sourced', src: 'F15-LESSON', quote: 'moving airflow where wind turbulence can dominate (F15 L24)' }, tag: 'BESIDE IT', scene: 'all' },
      { id: 'others', label: 'other machines and air handling', short: 'BACKGROUND', note: 'Record the background with the fan off, where that is safe, and log what you cannot control.', prov: { kind: 'sourced', src: 'F15-LESSON', quote: 'Record background with the test device off when safe and practical (F15 L6)' }, tag: 'BACKGROUND', scene: 'studio' },
      { id: 'pa', label: 'the PA at a demonstration', short: 'THE PA', note: 'A detail mic at a live demo stays out of the PA: no feedback, and no processing on a level you might quote.', prov: { kind: 'sourced', src: 'F15-LESSON', quote: 'without hazardous proximity or feedback into local PA (F15 L38)' }, tag: 'NOT IN THE PA', scene: 'stage' },
    ],
    stage: 'AT A LIVE DEMONSTRATION: stand, cable and mic outside moving paths; a perspective that shows the product without getting close; no feed into the local PA — a broadcast mix is for clarity, not for a noise claim.',
    studio: 'IN A ROOM OR A LAB: the same support, room and operating cycle for every pass; the background recorded with the device off; one position changed at a time.',
  },
  diagnostic,
  practice: {
    task: 'Choose a setup for two briefs, and say whether each result is a creative perspective, a relative comparison or a calibrated pressure. With a real device, the owner’s permission and someone qualified on it, you can log what you did below.',
    fields: PRODUCT_SHEET,
  },
  unknowns: [
    { text: 'The fan (about 30 cm across), the table and the room — drawing defaults; no source gives a size.', dims: [] },
    { text: 'The exclusion zone’s margin (0.3 m beyond the guard) and the airflow cone (30°, 2 m) — drawing defaults from the proposal; the device and the site set the real ones.', dims: [] },
    { text: 'The radius of A, B and C (1 m), the detail mic (about 0.6 m) and the far perspective (about 2 m) — drawing defaults; the seated ear height 1.2 m is sourced.', dims: [] },
    { text: 'The cycle strip and its timings, the claim ladder’s example numbers — made-up examples, labelled as such.', dims: [] },
  ],
  live: { wedges: [] },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules: the product’s own test code and the site set the real positions, distances and limits. Experiment, and trust your ears and the room as well as the meter — but never inside the exclusion zone. The lab is silent and draws a simplified picture: a guarded desk fan on a small table, a zone and an airflow cone as drawings, straight paths at 20 °C, and a made-up cycle strip. Work on real devices only with the owner’s permission and someone qualified on them.',
  copy: F15_COPY,
};
