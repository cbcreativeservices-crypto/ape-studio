/**
 * F13 ROOM ACOUSTICS AND REVERBERATION — the lesson as DATA (Miking Lab 6;
 * Lab 6 group 4, branch lab6-g4). Words from the owner's lesson
 * (docs/labs/miking/source_text/F13-Room-Acoustics-and-Reverberation-Miking-
 * Technique.txt; "L<n>" in comments only); research in
 * docs/labs/miking/room_acoustics/; corrections in CORRECTIONS_LOG.md.
 *
 * Owner rulings: suggested starting points; no source, brand or standard
 * number on screen (D-6B-3: "the method you use"); a model decay curve
 * labelled "a simplified example, not a measurement" (D-6B-2); safety exact
 * in plain words (no explosive or firearm-like sources; never drive a source
 * louder to force a result; the measurement mic never routed to the PA;
 * flown systems for qualified crew). FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, Prediction, SetupReason, SetupTask, SourcePageId, Symptom } from '../../engine/model/types.ts';
import { ROOM_SHEET } from '../shared/measure/logSheet.ts';
import { F13_MODEL } from './geometry.ts';
import { F13_ZONES } from './model.ts';
import { F13_COPY } from './copy.ts';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the room test',
    goal: 'Meet a room-acoustics test — the room and its state, a test source at a performer position, the seats where the receivers go — before any number.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A room test pairs one source position with one receiver position, in one room state. Move either, or change the state, and the result changes.',
  },
  sound: {
    title: 'How a room answers',
    goal: 'See how a room answers a sound at three seats — the direct sound, the first reflections off each surface, then the decay. Shown, never played.',
    credit: { scenarios: ['ra.snd.1', 'ra.snd.2', 'ra.snd.3'], note: 'Answer the three checks on how the room answers.' },
    takeaway: 'Direct, early, late: every seat hears its own mix of them. The decay is the late part sinking into the room’s noise floor.',
  },
  setting: {
    title: 'Before any test',
    goal: 'Settle the question, the room’s state, the source and the safety of the test before anything plays.',
    credit: { scenarios: ['ra.set.1', 'ra.set.2', 'ra.set.3'], note: 'Answer the three checks.' },
    takeaway: 'Room only or system + room — decide it and label it. Log the room’s state and its noise first. No explosive or firearm-like sources; modest levels; the mic never to the PA.',
  },
  microphone: {
    title: 'The test chain',
    goal: 'Build a room test link by link — the signal, the source, the receiver, the processing — for the room itself or for the installed system, and see what is refused and why.',
    credit: { scenarios: ['ra.mic.1', 'ra.mic.2', 'ra.mic.3', 'ra.rec.1'], interactive: 'chainBuilt', note: 'Build a chain that passes its question, and answer the four checks (one reaches back to how the room answers).' },
    takeaway: 'A controlled sweep or interrupted noise, a well-known source for the room or the actual PA for the system, an omni measurement mic, and every automatic process off.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and place the receiver yourself — a seat mid-audience, near the back, near a side wall — at a seated ear height, and see what each one stands for.',
    credit: { scenarios: ['ra.place.1', 'ra.place.2', 'ra.place.3', 'ra.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of everything, at two different recommended seats, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Seats that differ in distance and in their nearest walls, each marked for a second pass. Move only the receiver between runs.',
  },
  context: {
    title: 'Where the receivers go',
    goal: 'Choose a set of receiver positions that can describe the room — never one centre-of-room reading — and see what a studio, a hall and an installed PA each ask.',
    credit: { scenarios: ['ra.ctx.1', 'ra.ctx.2', 'ra.rec.3'], interactive: 'positions', note: 'Choose a set of positions the room can be described by, and answer the three checks.' },
    takeaway: 'Several positions, differing in distance and boundaries; a corner only when it is the question. The method sets the count.',
  },
  twoMic: {
    title: 'The decay reader',
    goal: 'Read T20, T30 and EDT from a decay, band by band, and see a fit refused when the range above the noise floor is too short.',
    credit: { scenarios: ['ra.two.1', 'ra.two.2', 'ra.two.3'], interactive: 'decayRead', note: 'See one fit refused and one valid in THE DECAY READER, and answer the three checks.' },
    takeaway: 'T20 from −5 to −25 dB ×3, T30 from −5 to −35 dB ×2, EDT the first 10 dB ×6 — each needs its end 10 dB above the floor. Report them separately, band by band.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the noise, the range, the processing and the room’s state before the number — and never drive the source louder to force a result.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a room test in order, choose and justify a set-up for two briefs, and say what a result can be called.',
    credit: { scenarios: ['ra.prac.order', 'ra.prac.gain', 'ra.prac.setup1', 'ra.prac.setup2', 'ra.prac.3', 'ra.mix.1', 'ra.mix.2', 'ra.mix.3'], note: 'Put the test in order, answer the headroom check, complete both briefs, and answer the four reasoning cards. The measurement sheet is optional.' },
    takeaway: 'The target named, the geometry repeatable, an unclipped tail long enough, unsupported fits refused, T20 / T30 / EDT kept apart, and the limits of space and state said plainly.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L5, L23, L26–L28 · set L5–L6, L19, L43 · mic L11–L21 ·
 * place L23–L24 · ctx L23, L33–L41 · two L26–L28 · prac L44–L51. */
const scenarios: MikingScenario[] = [
  {
    id: 'ra.snd.1',
    page: 'sound',
    prompt: 'You move the receiver from seat A to seat B and keep everything else. Is it the same impulse response?',
    options: ['A different one: each pair of positions has its own', 'The same, since the room and the source are unchanged', 'The same, as long as both seats are the same height'],
    correct: 'A different one: each pair of positions has its own',
    explain: 'An impulse response describes one source–receiver pair: move either position and the arrivals, their timing and their strength change.',
    why: {
      'The same, since the room and the source are unchanged': 'The paths from the source to the new seat — direct and reflected — are all different.',
      'The same, as long as both seats are the same height': 'Height is one thing; the distance and the nearest walls still differ.',
    },
  },
  {
    id: 'ra.snd.2',
    page: 'sound',
    prompt: 'At a side seat about 1 m from the wall, what arrives soon after the direct sound?',
    options: ['A strong early reflection off that wall', 'Nothing, until the whole room has filled', 'The rear wall’s reflection, ahead of the rest'],
    correct: 'A strong early reflection off that wall',
    explain: 'The nearby wall’s bounce travels only a little farther than the direct sound: it arrives early and strong — part of why that seat differs.',
    why: {
      'Nothing, until the whole room has filled': 'Reflections start arriving within milliseconds; the nearest surfaces come first.',
      'The rear wall’s reflection, ahead of the rest': 'The rear wall is far away from that seat’s path; the side wall’s bounce comes much earlier.',
    },
  },
  {
    id: 'ra.snd.3',
    page: 'sound',
    prompt: 'The curtains are drawn for the second pass. What happens to the comparison?',
    options: ['The room’s state changed: log it, or keep it the same', 'Nothing: curtains are not part of a room test', 'It improves, since curtains make a cleaner, clearer result'],
    correct: 'The room’s state changed: log it, or keep it the same',
    explain: 'Doors, curtains, panels, furniture, people and the air handling are all part of the result. A before-and-after keeps the state the same — or the change is the thing being compared, and it is logged.',
    why: {
      'Nothing: curtains are not part of a room test': 'They absorb sound: they are part of the room the test describes.',
      'It improves, since curtains make a cleaner, clearer result': 'A shorter decay is not automatically better — and the comparison is no longer like for like.',
    },
  },
  {
    id: 'ra.set.1',
    page: 'setting',
    prompt: 'A colleague suggests a starter pistol for a quick, loud impulse. What do you say?',
    options: ['Refuse: explosive or firearm-like sources are out', 'Fine, if everyone in the room wears hearing protection', 'Fine outdoors, if the room’s doors are left wide open'],
    correct: 'Refuse: explosive or firearm-like sources are out',
    explain: 'No explosive or firearm-like sources in this lab. A controlled sweep or interrupted noise from a test system is repeatable and safe at modest levels.',
    why: {
      'Fine, if everyone in the room wears hearing protection': 'Protection does not make an explosive source acceptable here: use a controlled test signal.',
      'Fine outdoors, if the room’s doors are left wide open': 'Open doors change the room and do nothing for the safety rule: no explosive or firearm-like sources.',
    },
  },
  {
    id: 'ra.set.2',
    page: 'setting',
    prompt: 'You will sweep through the installed PA. What must the result be called?',
    options: ['System + room, with the PA and its preset named', 'The room’s reverberation time, plain and simple', 'Room only, once the PA’s processing is set flat'],
    correct: 'System + room, with the PA and its preset named',
    explain: 'Through the PA you measure the system plus the room along that path: its directivity, processing and coverage are in the result. Label it so.',
    why: {
      'The room’s reverberation time, plain and simple': 'The system is in the result; it cannot be attributed to the room alone.',
      'Room only, once the PA’s processing is set flat': 'Flat processing still leaves the loudspeaker’s aim and coverage in it.',
    },
  },
  {
    id: 'ra.set.3',
    page: 'setting',
    prompt: 'What do you log before the first sweep?',
    options: ['The room’s noise by band, and its state', 'The PA’s loudest possible level in the room', 'The colour of the walls and of the floor'],
    correct: 'The room’s noise by band, and its state',
    explain: 'The noise floor sets how much range a decay has; the doors, curtains, people and air handling are part of what you measure.',
    why: {
      'The PA’s loudest possible level in the room': 'Louder is not the aim: never drive the source louder to force a result.',
      'The colour of the walls and of the floor': 'Materials matter; their colour does not.',
    },
  },
  {
    id: 'ra.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Why does the receiver’s chain need its automatic gain off?',
    options: ['It would change the decay as it happens', 'It would only change the colour of the room', 'It slows the sweep down, so the test runs long'],
    correct: 'It would change the decay as it happens',
    explain: 'Automatic gain, noise reduction or gating lift and cut the tail as it falls — the very thing being measured. Turn them off, or note what cannot be.',
    why: {
      'It would only change the colour of the room': 'It changes the level over time — the decay itself, not just the colour.',
      'It slows the sweep down, so the test runs long': 'It does not touch the sweep; it changes the recorded tail.',
    },
  },
  {
    id: 'ra.mic.1',
    page: 'microphone',
    prompt: 'For the room’s own reverberation, which source?',
    options: ['A broadly radiating, known test source', 'The house PA, aimed as it is for shows', 'A loud hand clap, repeated at each seat'],
    correct: 'A broadly radiating, known test source',
    explain: 'A broadly radiating, well-characterized source at a performer position lets the room shape the result, not one loudspeaker’s aim.',
    why: {
      'The house PA, aimed as it is for shows': 'That measures the system plus the room — a different question.',
      'A loud hand clap, repeated at each seat': 'Claps are inconsistent and barely excite the lows: not for a result you will compare.',
    },
  },
  {
    id: 'ra.mic.2',
    page: 'microphone',
    prompt: 'Only a directional vocal mic is in the case. Can it stand in for the receiver?',
    options: ['Only as a chosen perspective, said as such', 'It can: a mic of whatever kind records one', 'It can, if it is aimed at the source'],
    correct: 'Only as a chosen perspective, said as such',
    explain: 'An omni measurement mic is the common receiver. A directional mic can characterize a chosen perspective, but it cannot silently substitute for the usual receiver.',
    why: {
      'It can: a mic of whatever kind records one': 'It records one — of its own perspective, not of the room as the method means it.',
      'It can, if it is aimed at the source': 'Aimed or not, it still favours one direction of a field that arrives from all of them.',
    },
  },
  {
    id: 'ra.mic.3',
    page: 'microphone',
    prompt: 'Which test signal gives a repeatable impulse response?',
    options: ['A controlled sweep, deconvolved in software', 'A clap, as loud as the person can make it', 'Whatever music the band is rehearsing that day'],
    correct: 'A controlled sweep, deconvolved in software',
    explain: 'A stable source playing a controlled sweep, unclipped, with the tail captured and deconvolved: repeatable. Interrupted noise can estimate band decays too.',
    why: {
      'A clap, as loud as the person can make it': 'Loud does not make it consistent, and it barely excites the lows.',
      'Whatever music the band is rehearsing that day': 'Music changes all the time: it is not a controlled test signal.',
    },
  },
  {
    id: 'ra.place.1',
    page: 'placement',
    prompt: 'Between receiver A and receiver B, what changes?',
    options: ['Only the receiver’s position', 'The source’s position and the gain', 'The receiver and the room’s curtains'],
    correct: 'Only the receiver’s position',
    explain: 'Move only the receiver, document the difference, and repeat — the source, the settings and the state stay the same.',
    why: {
      'The source’s position and the gain': 'Two changes at once: you could not tell which one made the difference.',
      'The receiver and the room’s curtains': 'The curtains are the room’s state: keep them as they were.',
    },
  },
  {
    id: 'ra.place.2',
    page: 'placement',
    prompt: 'Why a seated ear height for these receivers?',
    options: ['It is where the listeners’ ears will be', 'It is the height that the method requires', 'It keeps the stand from being seen'],
    correct: 'It is where the listeners’ ears will be',
    explain: 'About 1.2 m (4 ft) is a seated listener’s ear — a sensible height for an audience seat. There is no universal height: the method you use sets it.',
    why: {
      'It is the height that the method requires': 'No universal height exists: the method sets its own.',
      'It keeps the stand from being seen': 'Sightlines matter in a show, but the height follows the listener.',
    },
  },
  {
    id: 'ra.place.3',
    page: 'placement',
    prompt: 'A second pass after new panels go up. How do you find the same spots?',
    options: ['Marked spots and measured distances', 'Roughly where the chairs seemed to be', 'Wherever the mic stand fits on the day'],
    correct: 'Marked spots and measured distances',
    explain: 'Mark the positions and measure the distances so the second pass reproduces them: then the change is the panels’, not the mic’s.',
    why: {
      'Roughly where the chairs seemed to be': '“Roughly” moves the receiver — and the result with it.',
      'Wherever the mic stand fits on the day': 'A different spot is a different impulse response.',
    },
  },
  {
    id: 'ra.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Why does seat B sound more of the room than seat A?',
    options: ['Its direct sound is weaker against the room', 'It is nearer the curtains than seat A is placed', 'The source points its sound at the back'],
    correct: 'Its direct sound is weaker against the room',
    explain: 'Farther from the source the direct sound falls, while the reverberant sound stays much the same through the room — so the room is more of the picture.',
    why: {
      'It is nearer the curtains than seat A is placed': 'Both seats are away from the curtains; distance is what differs.',
      'The source points its sound at the back': 'An omni test source sends sound broadly in every direction.',
    },
  },
  {
    id: 'ra.ctx.1',
    page: 'context',
    prompt: 'One reading in the middle of the room. What can it describe?',
    options: ['That one point, not the room', 'The whole room, being its centre', 'All the seats, once it is averaged'],
    correct: 'That one point, not the room',
    explain: 'A single centre-of-room reading never replaces spatial sampling: choose positions that differ in distance, boundaries and coverage.',
    why: {
      'The whole room, being its centre': 'The centre is one source–receiver pair like any other.',
      'All the seats, once it is averaged': 'One reading has nothing to average.',
    },
  },
  {
    id: 'ra.ctx.2',
    page: 'context',
    prompt: 'A booth’s decay got shorter after treatment. Is it now better for recording?',
    options: ['Too soon to say: reflections and colour matter too', 'It is: a shorter decay makes a better recording', 'It is, as long as the booth is also a little larger'],
    correct: 'Too soon to say: reflections and colour matter too',
    explain: 'A shorter reported decay does not alone mean better recording: early reflections, colouration and the position matter as well.',
    why: {
      'It is: a shorter decay makes a better recording': 'Shorter suits some uses, not all: the early reflections and the colour matter too.',
      'It is, as long as the booth is also a little larger': 'Size changes many things; the decay alone still does not decide quality.',
    },
  },
  {
    id: 'ra.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · A seat in the back corner: when is it a good receiver?',
    options: ['When the corner itself is the question', 'When the room is too large for the stand', 'When the source is in the opposite corner'],
    correct: 'When the corner itself is the question',
    explain: 'A corner, with two walls and the floor close by, is unrepresentative — unless that position itself is the target.',
    why: {
      'When the room is too large for the stand': 'The stand fits anywhere; the corner’s walls are the problem.',
      'When the source is in the opposite corner': 'That does not make the corner’s own reflections go away.',
    },
  },
  {
    id: 'ra.two.1',
    page: 'twoMic',
    prompt: 'The decay has 40 dB of range above its noise floor. Which figure can it support?',
    options: ['T20, but T30 needs 45 dB', 'T30, since it is the longer fit', 'Neither, without 60 dB of range'],
    correct: 'T20, but T30 needs 45 dB',
    explain: 'The end of each fit must sit 10 dB above the floor: T20 (to −25 dB) needs about 35 dB of range, T30 (to −35 dB) about 45. With 40 dB, T20 is valid; T30 is not.',
    why: {
      'T30, since it is the longer fit': 'T30’s end, −35 dB, would sit only 5 dB above this floor: refused.',
      'Neither, without 60 dB of range': 'Neither needs 60 dB: they estimate the 60 dB decay from a shorter fit.',
    },
  },
  {
    id: 'ra.two.2',
    page: 'twoMic',
    prompt: 'T20 reads 1.2 s. What does that number mean?',
    options: ['An estimate of a 60 dB decay time', 'The time for the sound to fall by 20 dB', 'The time for the sound to fall by 25 dB'],
    correct: 'An estimate of a 60 dB decay time',
    explain: 'T20 is fitted from −5 to −25 dB and extrapolated to 60 dB (×3): an estimate of a 60 dB decay, not 20 dB of seconds observed.',
    why: {
      'The time for the sound to fall by 20 dB': 'The 20 is the fitted range; the figure is extrapolated to 60 dB.',
      'The time for the sound to fall by 25 dB': 'The fit runs from −5 to −25 dB, but the figure is the 60 dB time.',
    },
  },
  {
    id: 'ra.two.3',
    page: 'twoMic',
    prompt: 'The 125 Hz band has too little range for T30 or T20. What do you report?',
    options: ['That the band has too little range', 'The T30 anyway, marked as rough', 'A rerun with the source driven louder'],
    correct: 'That the band has too little range',
    explain: 'If neither fit is supported, report insufficient range for that band — or measure at a quieter time. Never drive the source louder only to force a result.',
    why: {
      'The T30 anyway, marked as rough': 'A fit into the noise floor is not rough: it is unsupported.',
      'A rerun with the source driven louder': 'Never drive the source louder only to force a result.',
    },
  },
  {
    id: 'ra.prac.gain',
    page: 'practice',
    prompt: 'Before the sweep: what do you check about the levels?',
    options: ['Clean input, unlimited output, room for the tail', 'The level as high as the PA will go without a fault', 'The input set low, so nothing could possibly clip'],
    correct: 'Clean input, unlimited output, room for the tail',
    explain: 'Watch the input for clipping and the output for limiting, at a safe, modest level, with enough range for the decay above the floor.',
    why: {
      'The level as high as the PA will go without a fault': 'Never drive the source louder only to force a result: modest, safe levels.',
      'The input set low, so nothing could possibly clip': 'Too low buries the tail in the input’s own noise.',
    },
  },
  {
    id: 'ra.prac.3',
    page: 'practice',
    prompt: 'A sweep through the PA at three seats. What may the report call it?',
    options: ['System and room, at those seats', 'The room’s reverberation, room only', 'The whole venue, at all of its seats'],
    correct: 'System and room, at those seats',
    explain: 'Through the PA, at three seats: system + room, at those seats. Coverage and intelligibility are checked separately.',
    why: {
      'The room’s reverberation, room only': 'The PA is in the result: it cannot be attributed to the room alone.',
      'The whole venue, at all of its seats': 'Three seats stand for three seats.',
    },
  },
  {
    id: 'ra.mix.1',
    page: 'practice',
    prompt: 'A report gives one broadband “RT60” from the room’s centre. What is missing?',
    options: ['Bands, positions and the fit used', 'Nothing, if the number looks typical', 'Only the date that it was measured'],
    correct: 'Bands, positions and the fit used',
    explain: 'Report T20 / T30 / EDT separately, by band, at several positions, with the invalid bands marked and the method named.',
    why: {
      'Nothing, if the number looks typical': 'One number from one point hides the bands, the spread and the range.',
      'Only the date that it was measured': 'The date helps; the bands and positions are what the figure lacks.',
    },
  },
  {
    id: 'ra.mix.2',
    page: 'practice',
    prompt: 'The decay bends: steep at first, then slower. What do you do?',
    options: ['Report EDT and T30 separately; note it', 'Average the two slopes into one figure', 'Discard the run as a faulty measurement'],
    correct: 'Report EDT and T30 separately; note it',
    explain: 'Small rooms and non-diffuse spaces may not have one clean slope: report EDT and the later fits separately and say the decay is not a single slope.',
    why: {
      'Average the two slopes into one figure': 'An average describes neither part of the decay.',
      'Discard the run as a faulty measurement': 'A bend is information about the room, not a fault.',
    },
  },
  {
    id: 'ra.mix.3',
    page: 'practice',
    prompt: 'The PA result is labelled “room reverberation”. What is wrong?',
    options: ['It holds the system: say system + room', 'Nothing is wrong, if the PA is a good one', 'It should be labelled with the date only'],
    correct: 'It holds the system: say system + room',
    explain: 'The impulse response through the PA includes the system and the room; it cannot be attributed to the room alone.',
    why: {
      'Nothing is wrong, if the PA is a good one': 'A good PA is still in the result.',
      'It should be labelled with the date only': 'The date helps; the label must say what was measured.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'ra.sym.1',
    observation: 'The late part of the decay flattens into a level line',
    firstChecks: 'The noise floor; the range for the fit',
    options: ['The noise floor: the fit has run into it', 'A long reverberation that keeps going on', 'A fault in the measurement mic'],
    correct: 'The noise floor: the fit has run into it',
    explain: 'A decay that merges with the floor supports no late slope: check the range, use a shorter valid fit, or measure at a quieter time.',
    why: {
      'A long reverberation that keeps going on': 'A level line is the steady floor, not a decay.',
      'A fault in the measurement mic': 'Check the floor first: a flat tail is the usual sign of short range.',
    },
  },
  {
    id: 'ra.sym.2',
    observation: 'One repeat run shows a sudden spike in the tail',
    firstChecks: 'A disturbance during the run: repeat it',
    options: ['A disturbance — a door, a cough: repeat it', 'A real late reflection the room has in it', 'A strength of the room to be reported'],
    correct: 'A disturbance — a door, a cough: repeat it',
    explain: 'Repeat each configuration to catch transient noise and movement; reject disturbed takes before fitting a slope.',
    why: {
      'A real late reflection the room has in it': 'If it is not in the other repeats, it is not the room.',
      'A strength of the room to be reported': 'A one-off spike is a disturbed take, not a property.',
    },
  },
  {
    id: 'ra.sym.3',
    observation: 'The decay looks shortened and jumpy in the quiet parts',
    firstChecks: 'Noise reduction, gating or auto-gain in the chain',
    options: ['Gating or noise reduction left on', 'A room with an unusually short decay', 'The source turned up too far'],
    correct: 'Gating or noise reduction left on',
    explain: 'Processing that gates or reduces noise cuts the tail as it falls: turn it off, or note what cannot be.',
    why: {
      'A room with an unusually short decay': 'A real decay falls smoothly; jumps in the quiet parts point at processing.',
      'The source turned up too far': 'Too loud shows as clipping at the start, not a jumpy tail.',
    },
  },
  {
    id: 'ra.sym.4',
    observation: 'The start of the recorded sweep is flat-topped',
    firstChecks: 'Input clipping or output limiting',
    options: ['Clipping in, or limiting out', 'The room absorbing the sweep’s first part', 'A slow sweep, which tends to look like that'],
    correct: 'Clipping in, or limiting out',
    explain: 'Watch the input for clipping and the output for limiting; reject clipped takes and set a modest level.',
    why: {
      'The room absorbing the sweep’s first part': 'A flat top is the electronics running out of range.',
      'A slow sweep, which tends to look like that': 'A clean sweep is never flat-topped.',
    },
  },
  {
    id: 'ra.sym.5',
    observation: 'Two passes a week apart disagree at the same seats',
    firstChecks: 'The room’s state and the positions on each sheet',
    options: ['The room’s state and the marked positions', 'The calendar date, which is part of the result', 'The software, which must have changed itself'],
    correct: 'The room’s state and the marked positions',
    explain: 'Doors, curtains, furniture, people, air handling — and whether the marks were found exactly: compare the sheets first.',
    why: {
      'The calendar date, which is part of the result': 'The date matters only through what changed in the room.',
      'The software, which must have changed itself': 'Check the room and the positions before blaming the software.',
    },
  },
  {
    id: 'ra.sym.6',
    observation: 'The PA engineer wants your mic in the house mix to hear the sweep',
    firstChecks: 'Keep it on the analyzer; coordinate the test',
    options: ['The analyzer only', 'Route it in at a low level', 'Route it, then mute the PA'],
    correct: 'The analyzer only',
    explain: 'A measurement mic is routed to the recording or analyzer input, never returned to the PA: coordinate the test with the operator instead.',
    why: {
      'Route it in at a low level': 'At any level it joins the loop it measures, and can feed back.',
      'Route it, then mute the PA': 'Then the test cannot run through the PA at all — and the routing risk stays.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'ra.prac.order',
    page: 'practice',
    prompt: 'A room test at two seats, start to finish: put the steps in order.',
    steps: [
      { text: 'Write the question and log the room’s state', early: 'The question and the state come first.' },
      { text: 'Log the background noise, band by band', early: 'The noise is logged before any test signal.' },
      { text: 'Set the receiver at seat A; check the chain', early: 'Place the receiver once the room is logged.' },
      { text: 'Sweep at a safe level; capture the tail; repeat', early: 'Sweep once the chain is checked.' },
      { text: 'Move only the receiver to seat B and repeat', early: 'Seat B comes after seat A is done.' },
      { text: 'Fit band by band; refuse what lacks range', early: 'Fit once the runs are captured.' },
    ],
    explain: 'Question and state, the noise, the receiver, the runs, the second seat — then the fits, refused where the range is short.',
  },
];

const R = (id: string, label: string, role: SetupReason['role'], feedback: string): SetupReason => ({ id, label, role, feedback });
const setupTasks: SetupTask[] = [
  {
    id: 'ra.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A rehearsal room is getting new panels. Show what changed in the room’s decay.',
    setups: [
      { id: 'twoSeats', label: 'Omni source, three marked seats, sweeps before and after, same state', ok: true, power: 'none', feedback: 'Same source, same seats, same state: the panels are the only change.' },
      { id: 'noise', label: 'Interrupted noise at the same marked seats, before and after', ok: true, power: 'none', feedback: 'Interrupted noise can compare band decays too, repeated at the same seats.' },
      { id: 'centre', label: 'One clap at the centre of the room, before and after', ok: false, power: 'none', feedback: 'One centre reading and an inconsistent source cannot show the change reliably.' },
    ],
    reasons: [
      R('same', 'The same positions and room state both times', 'required', 'Only the panels may change.'),
      R('bands', 'Band-by-band decays, invalid bands marked', 'required', 'The change is in the bands.'),
      R('repeat', 'Each run repeated to catch disturbances', 'optional', 'It shows a cough or a door.'),
      R('louder', 'The source driven louder after, for a cleaner tail', 'wrong', 'Never drive the source louder to force a result.'),
    ],
    explain: 'More than one set-up passes: the same seats and the same state make the comparison fair.',
  },
  {
    id: 'ra.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · The venue asks what its audience hears from the installed PA.',
    setups: [
      { id: 'pa', label: 'Sweeps through the PA at seats front to back, labelled system + room', ok: true, power: 'none', feedback: 'The actual system at listener seats, labelled for what it is.' },
      { id: 'paStanding', label: 'The same at standing-audience height for a standing show', ok: true, power: 'none', feedback: 'A standing audience’s ears are higher: the height follows the listener.' },
      { id: 'omni', label: 'The omni source on stage, reported as the PA’s sound', ok: false, power: 'none', feedback: 'The omni source tests the room, not the installed system.' },
    ],
    reasons: [
      R('label', 'The result labelled system + room, the preset named', 'required', 'It is not a room-only figure.'),
      R('route', 'The measurement mic to the analyzer only', 'required', 'Never back to the PA.'),
      R('coord', 'The test coordinated with the operator and the venue', 'optional', 'No unannounced sweeps.'),
      R('roomonly', 'Report it as the room’s reverberation', 'wrong', 'The system is in the result.'),
    ],
    explain: 'Either seat height passes when it follows the audience and the result is labelled system + room.',
  },
];

const predictions: Partial<Record<SourcePageId, Prediction>> = {
  microphone: { prompt: 'You sweep through the house PA. What will the result describe?', options: ['The room alone', 'The system and the room', 'The PA alone'], after: 'Build the chain for each question and read its label.' },
  placement: { prompt: 'Seat B is farther from the source than seat A. What changes most?', options: ['More of the room against the direct sound', 'Nothing much', 'Only the level'], after: 'Move the receiver and read what each seat stands for.' },
  context: { prompt: 'How many positions can describe a room?', options: ['One, in the middle', 'Several that differ', 'Every seat'], after: 'Choose a set and read why it works or not.' },
  twoMic: { prompt: 'Raise the noise floor. Which fit is refused first?', options: ['EDT', 'T20', 'T30'], after: 'Raise the NOISE and watch.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'ra.q.1',
    covers: 'setting',
    critical: true,
    prompt: 'Which impulsive source may this lab use?',
    options: ['None explosive or firearm-like', 'A starter pistol with protection', 'A firework, if it is outdoors'],
    correct: 'None explosive or firearm-like',
    explain: 'No explosive or firearm-like sources in this lab: use a controlled sweep or interrupted noise.',
    why: { 'A starter pistol with protection': 'Protection does not make it acceptable here.', 'A firework, if it is outdoors': 'Outdoors or not: no explosive sources.' },
  },
  {
    id: 'ra.q.2',
    covers: 'setting',
    prompt: 'A sweep through the house PA measures what?',
    options: ['The system and the room', 'The room alone, as it is', 'The loudspeakers alone'],
    correct: 'The system and the room',
    explain: 'The PA’s directivity, processing and coverage are in the result with the room: label it so.',
    why: { 'The room alone, as it is': 'The system is in it.', 'The loudspeakers alone': 'The room is in it too.' },
  },
  {
    id: 'ra.q.3',
    covers: 'sound',
    prompt: 'Move the receiver to another seat. The impulse response…',
    options: ['changes: one per pair', 'stays the same throughout', 'only changes its level'],
    correct: 'changes: one per pair',
    explain: 'An impulse response belongs to one source–receiver pair.',
    why: { 'stays the same throughout': 'Every path to the new seat differs.', 'only changes its level': 'The timing and the reflections change too.' },
  },
  {
    id: 'ra.q.4',
    covers: 'sound',
    prompt: 'Which arrives first at any seat?',
    options: ['The direct sound', 'The floor’s bounce', 'The nearest wall’s bounce'],
    correct: 'The direct sound',
    explain: 'The straight path is the shortest: every reflection travels farther.',
    why: { 'The floor’s bounce': 'A bounce always travels farther than the straight path.', 'The nearest wall’s bounce': 'Even the nearest bounce travels farther than the straight path.' },
  },
  {
    id: 'ra.q.5',
    covers: 'setting',
    critical: true,
    prompt: 'Where does the measurement mic’s signal go?',
    options: ['The analyzer only', 'The PA, at a level kept low', 'The monitors on stage'],
    correct: 'The analyzer only',
    explain: 'Routed to a recording or analyzer input — never returned to the PA.',
    why: { 'The PA, at a level kept low': 'Never into the PA: it would join the loop it measures.', 'The monitors on stage': 'Not to any loudspeaker: the analyzer only.' },
  },
  {
    id: 'ra.q.6',
    covers: 'sound',
    prompt: 'The curtains are drawn between passes. The comparison…',
    options: ['has a changed room state', 'is unaffected by the curtains', 'becomes more accurate than before'],
    correct: 'has a changed room state',
    explain: 'Curtains are part of the room’s state: keep it the same, or log the change as the thing compared.',
    why: { 'is unaffected by the curtains': 'Curtains absorb sound: they change the room.', 'becomes more accurate than before': 'It becomes a different comparison, not a more accurate one.' },
  },
];

export const F13_LESSON: Lesson = {
  id: 'F13',
  labId: 'field',
  title: 'Room Acoustics and Reverberation',
  subtitle: 'Room only or system + room, seats that differ, a tail above the floor — T20, T30 and EDT kept apart',
  noun: { one: 'room measurement', many: 'room measurements', subject: 'room' },
  model: F13_MODEL,
  micTypeIds: ['measRI', 'measFF'],
  zones: F13_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  setupPairs: [
    { label: 'Receivers A and B: only the receiver moves', A: { zone: 'ra.A' }, B: { zone: 'ra.B' }, variants: ['room'], line: 'The same source and room state, two seats: each pair of positions has its own impulse response.' },
    { label: 'Two seats in the PA’s coverage, front to back', A: { zone: 'ra.paA' }, B: { zone: 'ra.paB' }, variants: ['pa'], line: 'The installed system at two listener seats, measured front to back — system + room at each.' },
  ],
  orient: [
    { title: 'WHAT IT IS', text: 'A room test: a test signal from a source at a performer position, an omni measurement mic at a listener seat, and the room’s answer — the impulse response — captured for that one pair of positions, in that one room state.', src: 'F13-LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'A studio or a booth before and after treatment, a rehearsal or concert space, a venue with an installed PA. The purpose decides the source: a test source for the room itself, the actual PA for what the audience hears.', src: 'F13-LESSON' },
    { title: 'WHAT IT DOES', text: 'From the impulse response come the decay figures — T20, T30, EDT — band by band, each an estimate of the time for a 60 dB decay, and each needing enough range above the room’s noise.', src: 'RA-T' },
    { title: 'ITS SIZE', text: 'This lab draws a rehearsal room about 10 by 7 m with a 4 m ceiling, six rows of seats, an omni test source on a stand, and the receivers at a seated ear height of about 1.2 m. The room is a drawing; the method you use sets the real positions.', src: 'MEYER-MAPP' },
  ],
  sound: {
    stages: [
      { title: 'Direct', text: 'The straight path, first to arrive.' },
      { title: 'Early', text: 'The first bounces off the floor, the ceiling and the nearest walls.' },
      { title: 'Late', text: 'Reflections of reflections: the decay, down into the noise floor.' },
    ],
    attack: 'The direct sound arrives first, weaker the farther the seat.',
    body: 'The early reflections and the decay follow; how fast the decay falls is what the figures describe.',
    head: { diameterMm: 380, rods: 0, label: 'the omni test source', strikeSrc: 'F13-LESSON' },
  },
  setting: {
    items: [
      { id: 'state', label: 'the room’s state', short: 'ROOM STATE', note: 'Doors, curtains, panels, furniture, people and the air handling: log them for every run; empty and occupied differ.', prov: { kind: 'sourced', src: 'F13-LESSON', quote: 'Record whether doors, curtains, movable panels, furniture, audience, HVAC … are in their intended operating states (L5)' }, tag: 'LOG IT', scene: 'all' },
      { id: 'people', label: 'people near the receiver', short: 'PEOPLE', note: 'A person near the mic or a moved chair changes the reflections: keep people and stands out of the direct path and monitor from a safe place.', prov: { kind: 'sourced', src: 'F13-LESSON', quote: 'a person near the mic or a moved chair changes reflection conditions (L24)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'noise', label: 'the room’s noise', short: 'NOISE FLOOR', note: 'The floor every decay has to clear by 10 dB: log it band by band with the air handling as it will be.', prov: { kind: 'sourced', src: 'RA-T', quote: 'endpoint "at least 10dB above the noise floor"' }, tag: 'LOG IT', scene: 'all' },
      { id: 'pa', label: 'the installed PA', short: 'THE PA', note: 'Through it you measure the system and the room; your mic never goes back into it. Flown systems are for qualified crew.', prov: { kind: 'sourced', src: 'F13-LESSON', quote: 'The measured IR includes system and room (L41); leave flown-system work to qualified personnel (L43)' }, tag: 'SYSTEM + ROOM', scene: 'stage' },
      { id: 'booth', label: 'a studio booth', short: 'BOOTH', note: 'Compare representative source and mic positions; repeat after moving panels or curtains, the geometry and the state logged.', prov: { kind: 'sourced', src: 'F13-LESSON', quote: 'Studio room or booth … repeat after moving panels or curtains (L33–L34)' }, tag: 'BEFORE / AFTER', scene: 'studio' },
    ],
    stage: 'IN A VENUE: coordinate with the operator and the venue, mute unrelated program, keep stands and cables out of public routes, no unannounced sweeps — and a result through the PA is labelled system + room.',
    studio: 'IN A STUDIO OR BOOTH: the same marked positions before and after a change, the room’s state logged; a shorter decay alone does not mean better recordings.',
  },
  diagnostic,
  practice: {
    task: 'Choose a set-up and positions for two briefs, and say what each result may be called. With the venue’s agreement and the room’s state logged, you can record what you did below.',
    fields: ROOM_SHEET,
  },
  unknowns: [
    { text: 'The room — its size, its seats, its curtains, door and vent — and the source’s height are drawing defaults.', dims: ['yFloor'] },
    { text: 'The receivers’ seats and distance bands are drawing defaults round the drawn seats; only the seated ear height (1.2 m) is sourced, as a sensible listener height.', dims: [] },
    { text: 'The side seat’s distance from the wall (about 1 m) is the proposal’s drawing default for the wall-proximity flag.', dims: [] },
    { text: 'The decay curves and their bands are made-up examples; the fit ranges, factors and the 10 dB margin are sourced.', dims: [] },
  ],
  live: { wedges: [] },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules: the method you use sets the real source and receiver positions, their count and the reporting. Experiment, and trust your ears and the room as well as the figures. The lab is silent and draws a simplified picture: a room that is a drawing, straight sound paths with one bounce each, and decay curves that are made-up examples.',
  copy: F13_COPY,
};
