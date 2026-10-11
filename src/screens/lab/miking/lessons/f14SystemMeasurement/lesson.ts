/**
 * F14 LOUDSPEAKER AND SOUND SYSTEM MEASUREMENT — the lesson as DATA (Miking
 * Lab 6: Foley, Field & Scientific; Lab 6 group 5, branch lab6-g5). Words
 * from the owner's lesson (docs/labs/miking/source_text/F14-Loudspeaker-
 * and-Sound-System-Measurement-Miking-Technique.txt; "L<n>" in comments
 * only); research in docs/labs/miking/loudspeaker_measurement/ (SOURCES.md,
 * GEOMETRY_PROPOSAL.md); corrections in CORRECTIONS_LOG.md ("Lab 6 · group 5").
 *
 * Owner rulings: suggested starting points, never dogma; no source, brand,
 * model or standard number on screen (D-6B-3); safety exact in plain words
 * (the measurement mic never back to the PA; safe, agreed levels; nothing
 * flown or energized moved for practice); FULLY SILENT. The chain rack sits
 * inside MICROPHONES with the reference tap and the delay (D-6B-1); example
 * traces are labelled "a made-up example" (D-6B-2).
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, Prediction, SetupReason, SetupTask, SourcePageId, Symptom } from '../../engine/model/types.ts';
import { SYSTEM_SHEET } from '../shared/measure/logSheet.ts';
import { F14_MODEL } from './geometry.ts';
import { F14_ZONES } from './model.ts';
import { F14_COPY } from './copy.ts';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the system under test',
    goal: 'Meet the loudspeakers you will measure — one on a bench, an installed system in a venue, a pair of studio monitors — and what a mic at one point can and cannot tell you about them.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A mic measures the pressure at its own position. Name the test first: one loudspeaker’s direct sound, its coverage, an overlap, or what a seat actually hears.',
  },
  sound: {
    title: 'What a seat hears',
    goal: 'See the main, the fill and the sub reach a front, a mid and a rear seat at different times, with the room’s bounces behind them.',
    credit: { scenarios: ['sy.snd.1', 'sy.snd.2', 'sy.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'At a seat the trace holds the loudspeaker’s directional output, the nearby boundaries, the other sources and the room. One trace cannot give a free-field specification or even coverage.',
  },
  setting: {
    title: 'Before any trace',
    goal: 'Settle the question, the chain and the route, and the safe level, before any test signal.',
    credit: { scenarios: ['sy.set.1', 'sy.set.2', 'sy.set.3'], note: 'Answer the three checks.' },
    takeaway: 'Write the question first. The measurement mic goes to the analyzer only. Agree a safe level with the operator — and stop if the measurement cannot be done safely.',
  },
  microphone: {
    title: 'The chain, the tap and the delay',
    goal: 'Build a dual-channel chain — the reference tap, the measurement mic, its route, the capture — then set the delay on the right arrival and see a delay finder choose the wrong one.',
    credit: { scenarios: ['sy.mic.1', 'sy.mic.2', 'sy.mic.3', 'sy.rec.1'], interactive: 'delaySet', note: 'In THE TAP AND THE DELAY, with the left main left on, put the delay on the fill’s own first arrival; and answer the four checks.' },
    takeaway: 'A tap before the processor includes it; after it, leaves it out — name the tap. Set the delay on the first arrival of the source you are measuring, and check what a finder chose by eye.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and move the measurement mic yourself — on the axis and off it, close to the woofer, at seats across the venue, at the studio’s listening position and beside it.',
    credit: { scenarios: ['sy.place.1', 'sy.place.2', 'sy.place.3', 'sy.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of everything, in two different suggested starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Keep the radius when you change the angle; sample every region whose sound matters, at an ear height; one chair is not the room. Write the source, the position and the aim for every trace.',
  },
  context: {
    title: 'Direct sound or the room',
    goal: 'Choose a time window: short enough to keep the room out, long enough to resolve the lows — and see that it cannot be both.',
    credit: { scenarios: ['sy.ctx.1', 'sy.ctx.2', 'sy.rec.3'], interactive: 'window', note: 'In THE WINDOW, look at a window with the direct sound alone and one with every reflection, and answer the three checks.' },
    takeaway: 'A window of T resolves steps of about 1 ÷ T: a short one is a direct-sound estimate above that; a long one is the loudspeaker in this room. State the window and the range it supports.',
  },
  twoMic: {
    title: 'The overlap seat',
    goal: 'Measure the main and the fill alone and together at a seat where both arrive, line them up there — and see the gap come back at the next seat.',
    credit: { scenarios: ['sy.two.1', 'sy.two.2', 'sy.two.3'], interactive: 'overlap', note: 'In THE OVERLAP SEAT, line the fill up at one seat and then look at another, and answer the three checks.' },
    takeaway: 'Each subsystem alone, then together, with nothing changed silently. An alignment chosen at one mic can change at another seat: compare before you settle.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the geometry, the route and the timing before the loudspeaker: the active sources, the tap, the delay, the window, the room’s paths.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a system check in order, choose a setup for two briefs, and say which findings are direct-sound estimates, installed-system traces or limited checks.',
    credit: { scenarios: ['sy.prac.order', 'sy.prac.gain', 'sy.prac.setup1', 'sy.prac.setup2', 'sy.prac.3', 'sy.mix.1', 'sy.mix.2', 'sy.mix.3'], note: 'Put the check in order, answer the headroom card, complete both briefs, and answer the four reasoning cards. The measurement sheet is optional.' },
    takeaway: 'Keep the source and the reference explicit, the geometry the same, the seats sampled, the timing checked — and every conclusion no bigger than the conditions it came from.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L5, L15–L18, L30 · set L5–L6, L26, L47 · mic L26–L28 ·
 * place L12, L15, L24, L39 · ctx L30–L32 · two L41–L42 · prac L55–L62, L85. */
const scenarios: MikingScenario[] = [
  {
    id: 'sy.snd.1',
    page: 'sound',
    prompt: 'One trace at a mid seat looks smooth. What does it tell you?',
    options: ['How the system and room sound at that seat', 'That the coverage is even across the room', 'The loudspeaker’s free-field specification'],
    correct: 'How the system and room sound at that seat',
    explain: 'A mic measures the pressure at its own position: the loudspeaker, the boundaries, the other sources and the room, as that seat gets them. Coverage needs the other seats.',
    why: {
      'That the coverage is even across the room': 'One seat says nothing about the others: coverage is a spatial question, sampled seat by seat.',
      'The loudspeaker’s free-field specification': 'A room trace includes the room. A free-field claim needs suitable conditions and a method.',
    },
  },
  {
    id: 'sy.snd.2',
    page: 'sound',
    prompt: 'At a front seat, which usually arrives first?',
    options: ['The sound from the nearest source', 'The sound from the loudest source', 'The bounce off the rear wall'],
    correct: 'The sound from the nearest source',
    explain: 'Arrival time is the path ÷ the speed of sound, plus any processing delay: with no delay set, the nearest loudspeaker — here the front fill — arrives first, whatever its level.',
    why: {
      'The sound from the loudest source': 'Level does not move an arrival: the main may be louder and still arrive later than the nearer fill.',
      'The bounce off the rear wall': 'A bounce off the far wall travels much farther: at the front it arrives long after the direct sound.',
    },
  },
  {
    id: 'sy.snd.3',
    page: 'sound',
    prompt: 'Why sample the front, the middle and the back of a main’s coverage?',
    options: ['Each region can sound different', 'One middle seat stands for the rest', 'The method needs exactly three mics'],
    correct: 'Each region can sound different',
    explain: 'Distance, angle and boundaries change from region to region. Sample every region whose sound matters, and name the regions you did not sample.',
    why: {
      'One middle seat stands for the rest': 'The middle is one place; the front and the back can differ in level and in tone.',
      'The method needs exactly three mics': 'Three is a sensible start, not a standard count: deep or wide rooms need more.',
    },
  },
  {
    id: 'sy.set.1',
    page: 'setting',
    prompt: 'Where does the measurement mic’s signal go?',
    options: ['To the analyzer’s input only', 'To a console channel on the PA', 'To the monitors, to hear it'],
    correct: 'To the analyzer’s input only',
    explain: 'The mic path must never return to the live PA: a measurement mic in the PA is feedback waiting to happen and changes the very thing it measures.',
    why: {
      'To a console channel on the PA': 'Never into the PA: route it to the analyzer input, with the route to the amplifiers unambiguous.',
      'To the monitors, to hear it': 'The mic is not a listening feed: it goes to the measurement input only.',
    },
  },
  {
    id: 'sy.set.2',
    page: 'setting',
    prompt: 'The trace is noisy at the agreed test level. What do you do first?',
    options: ['Check the timing, noise and reflections', 'Turn the playback up until it is smooth', 'Average more until the noise is gone'],
    correct: 'Check the timing, noise and reflections',
    explain: 'Poor quality can come from a timing mismatch, noise, reflections or a changing system. Raising the level is not the default cure — and the agreed level is set for safety.',
    why: {
      'Turn the playback up until it is smooth': 'Raising the playback is not the default cure, and it may break the agreed safe level.',
      'Average more until the noise is gone': 'Averaging can hide a timing or path problem: find the cause first.',
    },
  },
  {
    id: 'sy.set.3',
    page: 'setting',
    prompt: 'The flown main is aimed oddly. What do you do for a practice run?',
    options: ['Measure it as it is; tell the crew', 'Re-aim it once it is switched off', 'Nudge it from a ladder while it plays'],
    correct: 'Measure it as it is; tell the crew',
    explain: 'Do not move flown or energized equipment for a practice run. Measure what is there, and raise the aim with the people responsible for it.',
    why: {
      'Re-aim it once it is switched off': 'Off is not the point: flown equipment is rigged by qualified crew, and practice is no reason to touch it.',
      'Nudge it from a ladder while it plays': 'Flown and energized: leave it to the qualified crew.',
    },
  },
  {
    id: 'sy.mic.1',
    page: 'microphone',
    prompt: 'The reference is tapped after the processor. What is in the measured path?',
    options: ['The amp, the loudspeaker and the room', 'The processor, the amp and the room', 'Only the room’s reverberation and noise'],
    correct: 'The amp, the loudspeaker and the room',
    explain: 'A post-processor reference leaves the processor out: the trace shows what the processing has to work with. A pre-processor tap would include it.',
    why: {
      'The processor, the amp and the room': 'The tap is after the processor: its settings are on both channels and cancel out of the comparison.',
      'Only the room’s reverberation and noise': 'The loudspeaker and the amplifier are still in the path between the tap and the mic.',
    },
  },
  {
    id: 'sy.mic.2',
    page: 'microphone',
    prompt: 'A delay finder locks onto an arrival. What do you do before trusting it?',
    options: ['Check by eye that it is the right source', 'Nothing: the finder takes the true arrival', 'Raise the level so the finder is surer'],
    correct: 'Check by eye that it is the right source',
    explain: 'A finder takes the strongest arrival. In a reverberant or overlapping system that can be another source or a reflection: inspect the arrivals and verify the source.',
    why: {
      'Nothing: the finder takes the true arrival': 'It takes the strongest, which is not always the intended source’s first arrival.',
      'Raise the level so the finder is surer': 'A louder test changes nothing about which arrival is strongest — and the level is set for safety.',
    },
  },
  {
    id: 'sy.mic.3',
    page: 'microphone',
    prompt: 'You move the mic to the next seat. What about the delay?',
    options: ['Find it again for the new seat', 'Keep it: the system has not changed', 'Halve it, as the seat is nearer'],
    correct: 'Find it again for the new seat',
    explain: 'The acoustic path changed, so the arrival changed: set the time reference again after every move or path change.',
    why: {
      'Keep it: the system has not changed': 'The system is the same; the path to the mic is not — and the delay follows the path.',
      'Halve it, as the seat is nearer': 'The delay follows the actual path, not a guess: find it again.',
    },
  },
  {
    id: 'sy.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A front seat hears the fill before the louder main. Which arrival is the fill’s?',
    options: ['The first one', 'The strongest one', 'The last one'],
    correct: 'The first one',
    explain: 'The fill is nearer, so its sound arrives first, even though the main is louder. The strongest arrival here is the main.',
    why: {
      'The strongest one': 'The strongest is the main: louder, but farther away.',
      'The last one': 'The last arrivals are the room’s bounces, long after both direct sounds.',
    },
  },
  {
    id: 'sy.place.1',
    page: 'placement',
    prompt: 'From the axis to 30° off it: what stays the same?',
    options: ['The radius, the height and the drive', 'Only the drive level, so they compare', 'Nothing: each angle has its radius'],
    correct: 'The radius, the height and the drive',
    explain: 'Hold the radius and the source state fixed while the angle changes, so the difference belongs to the angle.',
    why: {
      'Only the drive level, so they compare': 'A new radius as well as a new angle makes two changes at once.',
      'Nothing: each angle has its radius': 'Change one thing at a time: the angle, at the same radius.',
    },
  },
  {
    id: 'sy.place.2',
    page: 'placement',
    prompt: 'A trace at the listening position looks flat. What next?',
    options: ['Check the nearby head positions', 'Call it done: flat is the goal', 'Compare left with right, then stop'],
    correct: 'Check the nearby head positions',
    explain: 'One exact chair can hide a severe null or peak a head’s width away. Measure the nearby positions too.',
    why: {
      'Call it done: flat is the goal': 'Flat at one point does not prove broad listening quality.',
      'Compare left with right, then stop': 'Both can be flat at the chair and both dip a head’s width away.',
    },
  },
  {
    id: 'sy.place.3',
    page: 'placement',
    prompt: 'The standing area at the back: at what height does the mic go?',
    options: ['A standing ear height, about 1.7 m', 'The seated height of about 1.2 m, as before', 'As high as the stand will reach'],
    correct: 'A standing ear height, about 1.7 m',
    explain: 'Put the receiver where the listeners’ ears are: about 1.7 m (5.6 ft) for a standing audience, about 1.2 m (4 ft) seated.',
    why: {
      'The seated height of about 1.2 m, as before': 'That is a seated listener’s height; standing ears are higher.',
      'As high as the stand will reach': 'Higher than the ears is not where the audience hears it.',
    },
  },
  {
    id: 'sy.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · A close mic at the woofer gives a clean trace. What is it?',
    options: ['A check of one radiator', 'The cabinet’s far-field response', 'The room’s response at a seat'],
    correct: 'A check of one radiator',
    explain: 'Close to one cone the room drops away — and so do the tweeter and the port. It is not automatically the far-field response of the whole cabinet.',
    why: {
      'The cabinet’s far-field response': 'Joining a close trace to the far field needs corrections under a defined method.',
      'The room’s response at a seat': 'Close to the cone, the room is what it leaves out.',
    },
  },
  {
    id: 'sy.ctx.1',
    page: 'context',
    prompt: 'A 5 ms window keeps the later bounces out. What does it lose?',
    options: ['Detail below about 200 Hz', 'Detail above about 5 kHz', 'Nothing: shorter is cleaner'],
    correct: 'Detail below about 200 Hz',
    explain: 'A window of T resolves frequency steps of about 1 ÷ T: 5 ms gives about 200 Hz — nothing finer, and nothing below it is described.',
    why: {
      'Detail above about 5 kHz': 'A short window costs the lows, not the highs.',
      'Nothing: shorter is cleaner': 'Shorter keeps the room out and loses the lows: state the window and its range.',
    },
  },
  {
    id: 'sy.ctx.2',
    page: 'context',
    prompt: 'A deep, narrow dip at the desk chair only. What first?',
    options: ['Move the mic and look for the path', 'Boost the EQ there to fill the dip in', 'Replace the monitor’s woofer'],
    correct: 'Move the mic and look for the path',
    explain: 'A narrow cancellation that moves with position is usually a reflection — the desk, the floor, a wall. Compare positions and find the cause before changing processing.',
    why: {
      'Boost the EQ there to fill the dip in': 'Equalizing a spatial cancellation pushes more energy into a dip that will not fill, and changes every other seat.',
      'Replace the monitor’s woofer': 'A dip at one spot is rarely a faulty driver: check the geometry first.',
    },
  },
  {
    id: 'sy.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · You keep a mid seat, a rear seat and a seat near the aisle. What do you look at first?',
    options: ['Each seat’s trace on its own', 'Their average, as one curve', 'The quietest seat, as the worst'],
    correct: 'Each seat’s trace on its own',
    explain: 'Compare the individual traces before any spatial summary: an average can hide the edge seat that matters.',
    why: {
      'Their average, as one curve': 'An average first can hide a seat that differs — look at each one.',
      'The quietest seat, as the worst': 'Quieter is not worse by itself: compare the traces band by band.',
    },
  },
  {
    id: 'sy.two.1',
    page: 'twoMic',
    prompt: 'At an overlap seat, in which order do you measure?',
    options: ['Each source alone, then both', 'Both together, then each alone', 'Both together only, as heard'],
    correct: 'Each source alone, then both',
    explain: 'Check each subsystem alone at its seats, then the overlap with the intended sources active — and record the arrivals before any change.',
    why: {
      'Both together, then each alone': 'Together first gives you a sum you cannot take apart: each alone first.',
      'Both together only, as heard': 'Without each alone, you cannot tell which source caused what.',
    },
  },
  {
    id: 'sy.two.2',
    page: 'twoMic',
    prompt: 'You line the fill up at seat A. What happens at seat B?',
    options: ['The gap may come back', 'They stay lined up there too', 'The fill goes silent'],
    correct: 'The gap may come back',
    explain: 'The paths to B are different lengths: an alignment chosen at one mic can change at another seat. Compare another seat before you settle.',
    why: {
      'They stay lined up there too': 'Alignment holds where the path difference is the same — rarely at the next seat.',
      'The fill goes silent': 'Its level is unchanged: what changes is the time between the two arrivals.',
    },
  },
  {
    id: 'sy.two.3',
    page: 'twoMic',
    prompt: 'Mains and subs sum well at one seat. What can you claim?',
    options: ['That seat sums well; check others', 'They sum well across the room', 'The crossover suits the whole room'],
    correct: 'That seat sums well; check others',
    explain: 'Summation at the chosen seat does not promise summation everywhere: the room and the array geometry still matter.',
    why: {
      'They sum well across the room': 'It depends on the paths to each seat, not on one seat’s result.',
      'The crossover suits the whole room': 'A right crossover is necessary, not sufficient: the geometry changes the timing seat by seat.',
    },
  },
  {
    id: 'sy.prac.gain',
    page: 'practice',
    prompt: 'Before the test signal: what do you check about the mic input?',
    options: ['Its level and headroom, with no clipping', 'That the gain is turned as high as it goes', 'That the trace reads 0 dB at 1 kHz'],
    correct: 'Its level and headroom, with no clipping',
    explain: 'Confirm the channels, the polarity, the phantom power, the input level and the headroom before excitation — then fix the gain and log it.',
    why: {
      'That the gain is turned as high as it goes': 'Maximum gain risks clipping on the loudest parts of the test.',
      'That the trace reads 0 dB at 1 kHz': 'A trace’s level at one frequency is not a gain check: look at the headroom.',
    },
  },
  {
    id: 'sy.prac.3',
    page: 'practice',
    prompt: 'Which finding does one close mic at the woofer support?',
    options: ['A limited check of that driver', 'The cabinet’s far-field response', 'The coverage of the room'],
    correct: 'A limited check of that driver',
    explain: 'Say what each finding is: a direct-sound estimate, an installed-system trace, or a limited near or boundary check.',
    why: {
      'The cabinet’s far-field response': 'One close mic misses the other outputs and the far-field geometry.',
      'The coverage of the room': 'Coverage needs listener seats, not a point at the cone.',
    },
  },
  {
    id: 'sy.mix.1',
    page: 'practice',
    prompt: 'With the left main still on, the finder lands on its arrival. The fill is what you measure. Now?',
    options: ['Mute the main, then reset the delay', 'Keep it: the main is the louder one', 'Average the two arrivals together'],
    correct: 'Mute the main, then reset the delay',
    explain: 'Mute what you are not measuring and put the delay on the fill’s own first arrival, checked by eye.',
    why: {
      'Keep it: the main is the louder one': 'Louder is not the source under test: the trace would compare the fill with the main’s timing.',
      'Average the two arrivals together': 'A delay halfway between two sources aligns with neither.',
    },
  },
  {
    id: 'sy.mix.2',
    page: 'practice',
    prompt: 'A dip at the chair moves when you lean forward. What is it most likely?',
    options: ['A reflection’s cancellation', 'A fault inside the monitor itself', 'The analyzer’s smoothing'],
    correct: 'A reflection’s cancellation',
    explain: 'A dip that moves with a small change in position is a path difference — the desk, the floor, a wall — not the loudspeaker.',
    why: {
      'A fault inside the monitor itself': 'A monitor fault does not move with your head.',
      'The analyzer’s smoothing': 'Smoothing changes how the trace looks everywhere, not at one position.',
    },
  },
  {
    id: 'sy.mix.3',
    page: 'practice',
    prompt: 'Your report covers one mid seat. What can it honestly say?',
    options: ['What that seat heard, with gaps named', 'The room’s coverage, from that seat', 'The system’s free-field response'],
    correct: 'What that seat heard, with gaps named',
    explain: 'Limit the conclusion to the conditions: the source, the seat, the window — and name the regions you did not sample.',
    why: {
      'The room’s coverage, from that seat': 'One point cannot show a room-wide result.',
      'The system’s free-field response': 'An in-room trace includes the room: it cannot stand for free-field performance.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'sy.sym.1',
    observation: 'The off-axis trace differs from the on-axis one far more than expected',
    firstChecks: 'The radius, the drive, the processor state, the room’s paths',
    options: ['The geometry and the drive first', 'The tweeter, which must be failing', 'The analyzer’s colour settings'],
    correct: 'The geometry and the drive first',
    explain: 'Verify that the source and mic geometry — not an accidental level or processor change — caused it, and check the room’s paths before calling it directivity.',
    why: {
      'The tweeter, which must be failing': 'A failing driver is a late suspect: an accidental change in radius or drive is far commoner.',
      'The analyzer’s colour settings': 'Display colours do not change a measurement.',
    },
  },
  {
    id: 'sy.sym.2',
    observation: 'The coherence collapses after the mic moves to the next seat',
    firstChecks: 'The delay for the new seat; noise; reflections',
    options: ['The delay, re-found for this seat', 'The playback level, turned up higher', 'The mic’s calibration file, reloaded'],
    correct: 'The delay, re-found for this seat',
    explain: 'The path changed: re-find the time reference. Poor coherence can also be noise, reflections or a changing system — it is not one diagnosis.',
    why: {
      'The playback level, turned up higher': 'Raising the playback is not the default cure — find the cause.',
      'The mic’s calibration file, reloaded': 'The file did not change when the mic moved; the timing did.',
    },
  },
  {
    id: 'sy.sym.3',
    observation: 'The trace changed between two runs, but nobody touched the system',
    firstChecks: 'Which sources were live; the processing mode; the tap',
    options: ['The live sources and the processing', 'The weather outside the venue that night', 'The colour of the stage lighting'],
    correct: 'The live sources and the processing',
    explain: 'An unmuted source, a dynamic process or a changed tap can change the trace. Log the active channels, the mute state and the processing mode for every run.',
    why: {
      'The weather outside the venue that night': 'Indoors, check the system and its sources first.',
      'The colour of the stage lighting': 'Lighting does not change the sound path.',
    },
  },
  {
    id: 'sy.sym.4',
    observation: 'A narrow, deep dip at the mix position only',
    firstChecks: 'Nearby positions; the desk, floor or wall path',
    options: ['Nearby positions and the reflections', 'A boost at the dip’s own frequency', 'The power amplifier’s gain setting'],
    correct: 'Nearby positions and the reflections',
    explain: 'A narrow cancellation at one spot is usually a path difference. Compare positions and find the cause before any EQ.',
    why: {
      'A boost at the dip’s own frequency': 'A boost cannot fill a cancellation, and changes every other seat.',
      'The power amplifier’s gain setting': 'Gain moves the whole trace, not a narrow dip at one spot.',
    },
  },
  {
    id: 'sy.sym.5',
    observation: 'The low end looks smooth with a short window but bumpy with a long one',
    firstChecks: 'The window’s resolution; the room’s lows',
    options: ['The window: short ones blur the lows', 'The sub, which runs only with long ones', 'The mic, which changes with the window'],
    correct: 'The window: short ones blur the lows',
    explain: 'A short window resolves only steps of about 1 ÷ T: it cannot show the room’s low-frequency detail. State the window and the range it supports.',
    why: {
      'The sub, which runs only with long ones': 'The window is the analyzer’s choice; the sub plays the same either way.',
      'The mic, which changes with the window': 'The mic is the same: the analysis changed.',
    },
  },
  {
    id: 'sy.sym.6',
    observation: 'Feedback howls as soon as the measurement mic is plugged in',
    firstChecks: 'Its route: analyzer only, not the PA',
    options: ['The route: it reached the PA', 'The calibration file is missing', 'The test level is too low'],
    correct: 'The route: it reached the PA',
    explain: 'The measurement mic must never return to the live PA. Mute, and re-route it to the analyzer input only.',
    why: {
      'The calibration file is missing': 'A missing file changes the trace, not the route: feedback means the mic reaches the loudspeakers.',
      'The test level is too low': 'Feedback is the mic in the PA, not the test level.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'sy.prac.order',
    page: 'practice',
    prompt: 'A system check, start to finish: put the steps in order.',
    steps: [
      { text: 'Write the questions and sketch the source, axis and seats', early: 'The question and the sketch come first.' },
      { text: 'Check the chain: tap, mic file, route, level — the mic cannot feed the PA', early: 'The chain is checked before anything plays.' },
      { text: 'Reference-axis trace at a logged radius, then off axis at the same radius', early: 'The bench traces come once the chain is checked.' },
      { text: 'Listener seats with one source at a time, each trace stored', early: 'Seats come after the reference traces.' },
      { text: 'Overlap seats: each alone, then both, nothing changed silently', early: 'Overlaps come after each source is known alone.' },
      { text: 'Return to the first position, repeat, and state each finding’s limits', early: 'The repeat and the limits close the session.' },
    ],
    explain: 'Question, chain, reference traces, seats one source at a time, overlaps, then the repeat and an honest label for every finding.',
  },
];

const R = (id: string, label: string, role: SetupReason['role'], feedback: string): SetupReason => ({ id, label, role, feedback });
const setupTasks: SetupTask[] = [
  {
    id: 'sy.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Does a new grille change the loudspeaker’s sound off its axis? One cabinet on the bench, a measurement mic.',
    setups: [
      { id: 'grid', label: 'The same radius, 0° then 30°, before and after, the drive fixed', ok: true, power: 'phantom', feedback: 'One change at a time, at a fixed radius: an honest angle comparison.' },
      { id: 'grid2', label: 'The same radius, 0°, 15° and 30°, before and after, the drive fixed', ok: true, power: 'phantom', feedback: 'More angles, still one radius and a fixed drive: also sound.' },
      { id: 'walk', label: 'Hand-held mic, walked round the cabinet, level adjusted to taste', ok: false, power: 'phantom', feedback: 'The radius and the drive both change: the angle cannot be separated out.' },
    ],
    reasons: [
      R('radius', 'The radius and the drive stay the same', 'required', 'Only the angle may change.'),
      R('room', 'The room’s reflections are checked before calling it directivity', 'required', 'In a room, paths can dominate an off-axis trace.'),
      R('repeat', 'A return to the axis to check it repeats', 'optional', 'It shows the setup did not drift.'),
      R('claim', 'The result is reported as free-field directivity', 'wrong', 'A room trace needs suitable conditions and a method for that claim.'),
    ],
    explain: 'Either fixed-radius plan passes: what matters is one change at a time and an honest label.',
  },
  {
    id: 'sy.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · How even is the left main’s coverage across its half of the venue? The operator has agreed a level and a time.',
    setups: [
      { id: 'seats', label: 'Front, middle and rear seats at a seated ear height, the main alone', ok: true, power: 'phantom', feedback: 'Its coverage sampled where people sit, one source at a time.' },
      { id: 'seats2', label: 'Front, middle, rear and an edge seat, the main alone, each trace kept', ok: true, power: 'phantom', feedback: 'An edge seat as well: a fuller picture, still one source.' },
      { id: 'desk', label: 'One mic at the mixing desk, all sources on', ok: false, power: 'phantom', feedback: 'One point with every source on cannot show one main’s coverage.' },
    ],
    reasons: [
      R('alone', 'Only the main under test plays', 'required', 'Other sources would mix into every trace.'),
      R('ear', 'The mics sit at an ear height', 'required', 'Measure where the audience hears.'),
      R('each', 'Each trace is compared before any average', 'optional', 'An average can hide the seat that matters.'),
      R('one', 'One mid seat stands for the whole half', 'wrong', 'One point cannot show coverage.'),
    ],
    explain: 'Either seat plan passes, with the main alone and the traces kept apart.',
  },
];

const predictions: Partial<Record<SourcePageId, Prediction>> = {
  microphone: { prompt: 'You tap the reference before the processor. Is the processor in the measured path?', options: ['Yes — and its delay too', 'No — it is on both channels', 'Only its EQ'], after: 'Build the chain and read what each tap answers.' },
  placement: { prompt: 'You swing the mic from the axis to 30° off it at the same radius. What changes most?', options: ['The highs fall away', 'The lows rise', 'Nothing much'], after: 'Move it and read what the zone says.' },
  context: { prompt: 'A shorter window keeps the room out. What does it cost?', options: ['Detail in the lows', 'Detail in the highs', 'Nothing'], after: 'Drag the window and read what it resolves.' },
  twoMic: { prompt: 'You line the fill up with the main at one seat. Will the next seat be lined up too?', options: ['Probably not', 'Yes', 'Only in the lows'], after: 'Align it, then change the seat.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'sy.q.1',
    covers: 'sound',
    prompt: 'What does a mic at one seat measure?',
    options: ['The pressure at that seat', 'The whole room’s coverage', 'The loudspeaker alone'],
    correct: 'The pressure at that seat',
    explain: 'A mic measures the pressure at its own position: the system, the boundaries and the room, as that seat gets them.',
    why: {
      'The whole room’s coverage': 'Coverage needs many seats.',
      'The loudspeaker alone': 'At a seat the room and the other sources are in it too.',
    },
  },
  {
    id: 'sy.q.2',
    covers: 'setting',
    critical: true,
    prompt: 'Where may the measurement mic’s signal go?',
    options: ['The analyzer input only', 'A console channel on the PA', 'Wherever is easiest to patch'],
    correct: 'The analyzer input only',
    explain: 'The measurement mic must never return to the live PA.',
    why: {
      'A console channel on the PA': 'Never into the PA: it feeds back and changes what it measures.',
      'Wherever is easiest to patch': 'The route is chosen and checked: analyzer only.',
    },
  },
  {
    id: 'sy.q.3',
    covers: 'setting',
    critical: true,
    prompt: 'The trace is poor at the agreed safe level. What now?',
    options: ['Find the cause; stop if unsafe', 'Turn the playback up', 'Ask the venue for a louder slot'],
    correct: 'Find the cause; stop if unsafe',
    explain: 'Raising the level is not the default cure. Stop if the measurement cannot be done safely.',
    why: {
      'Turn the playback up': 'The level is set for hearing safety and is rarely the cause.',
      'Ask the venue for a louder slot': 'Louder does not fix a timing or path problem.',
    },
  },
  {
    id: 'sy.q.4',
    covers: 'sound',
    prompt: 'At a front seat, which usually arrives first?',
    options: ['The nearest source', 'The loudest source', 'The rear wall’s bounce'],
    correct: 'The nearest source',
    explain: 'Arrival time is the path ÷ the speed of sound, plus any processing delay — whatever the level.',
    why: {
      'The loudest source': 'Level does not move an arrival in time.',
      'The rear wall’s bounce': 'It travels much farther and arrives later.',
    },
  },
  {
    id: 'sy.q.5',
    covers: 'setting',
    prompt: 'What do you write down before setting a stand?',
    options: ['The question you are answering', 'The analyzer’s screen colour scheme', 'The loudest seat in the room'],
    correct: 'The question you are answering',
    explain: 'Direct sound, coverage, an overlap or the audience’s experience: each needs different positions.',
    why: {
      'The analyzer’s screen colour scheme': 'Display settings do not decide a position.',
      'The loudest seat in the room': 'The question decides the seats, not the loudest one.',
    },
  },
  {
    id: 'sy.q.6',
    covers: 'sound',
    prompt: 'Why sample the front, middle and back of a main’s coverage?',
    options: ['Each region can differ', 'The method needs three', 'One seat is too quiet'],
    correct: 'Each region can differ',
    explain: 'Distance, angle and boundaries change from region to region: sample every region that matters.',
    why: {
      'The method needs three': 'Three is a start, not a standard count.',
      'One seat is too quiet': 'It is about difference between regions, not level.',
    },
  },
];

export const F14_LESSON: Lesson = {
  id: 'F14',
  labId: 'field',
  title: 'Loudspeaker and Sound System Measurement',
  subtitle: 'The question first, the tap and the delay named, the radius kept — seats sampled one source at a time',
  noun: { one: 'loudspeaker', many: 'loudspeakers', subject: 'system under test' },
  model: F14_MODEL,
  micTypeIds: ['measFF', 'measRI', 'measQuarter'],
  zones: F14_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  setupPairs: [
    { label: 'On the axis and 30° off it, the same radius', A: { zone: 'ls.axis' }, B: { zone: 'ls.off' }, variants: ['bench'], line: 'One radius, two angles: the difference belongs to the angle — check the room’s paths before calling it directivity.' },
    { label: 'Start and end of the left main’s coverage', A: { zone: 'vn.front' }, B: { zone: 'vn.rear' }, variants: ['venue'], line: 'Front and rear seats at a seated ear height, the main alone — each trace kept on its own.' },
    { label: 'The listening position and 30 cm to the side', A: { zone: 'st.listen' }, B: { zone: 'st.near' }, variants: ['studio'], line: 'Where your head is and where it also goes: flat at one point proves little.' },
  ],
  orient: [
    { title: 'WHAT IT IS', text: 'Measuring a loudspeaker or a sound system: a measurement mic at a chosen point, a copy of the signal that drives the path as the reference, and an analyzer that compares the two. The mic measures the pressure at its own position — nothing more.', src: 'F14-LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'Tuning a venue’s mains, subs and fills; checking studio monitors at the listening position; looking at one loudspeaker on a bench. Each asks a different question, and each question asks for different positions.', src: 'F14-LESSON' },
    { title: 'WHAT CHANGES THE TRACE', text: 'The angle, the distance, the boundaries and the drive — and in an installed system, the processing, the other sources and the room. Name the source, the geometry, the reference and the room before reading a trace.', src: 'F14-LESSON' },
    { title: 'THE THREE SCENES', text: 'This lab draws a small two-way loudspeaker on a bench, a small venue with two mains, a subwoofer and a front fill, and a pair of studio monitors with a desk and a chair. Every size is a drawing, not a rule.', src: 'MEYER-MAPP' },
  ],
  sound: {
    stages: [
      { title: 'Direct', text: 'The sound straight from each loudspeaker: the nearest arrives first, the loudest is not always the first.' },
      { title: 'Boundaries', text: 'The floor’s bounce close behind the direct sound, the walls’ later: different at every seat.' },
      { title: 'Overlap', text: 'Where two loudspeakers reach one seat, their arrivals a few milliseconds apart.' },
    ],
    attack: 'Close to one loudspeaker and early in time, its own direct sound dominates.',
    body: 'Farther away and later in time, the room and the other sources join it.',
    head: { diameterMm: 165, rods: 0, label: 'the test loudspeaker’s woofer', strikeSrc: 'F14-LESSON' },
  },
  setting: {
    items: [
      { id: 'pa', label: 'the PA and its operator', short: 'THE PA', note: 'The measurement mic goes to the analyzer only — never back to the live PA. Coordinate muting, levels and timing with the operator.', prov: { kind: 'sourced', src: 'F14-LESSON', quote: 'The mic path must never return to the live PA (F14 L26)' }, tag: 'NEVER ROUTED', scene: 'stage' },
      { id: 'others', label: 'the other sources', short: 'OTHER SOURCES', note: 'Mute what you are not measuring: a second source in the trace turns a delay finder and a reading toward it.', prov: { kind: 'sourced', src: 'F14-LESSON', quote: 'Name every position and active source (F14 L15)' }, tag: 'MUTED', scene: 'all' },
      { id: 'walls', label: 'the floor, the walls and the desk', short: 'BOUNDARIES', note: 'Every surface near the mic sends a second arrival; a desk or a floor bounce can carve a narrow dip at one spot. Log the nearest ones.', prov: { kind: 'sourced', src: 'F14-LESSON', quote: 'low-frequency modes and early floor, desk or wall reflections often dominate (F14 L30)' }, tag: 'REFLECTIONS', scene: 'all' },
      { id: 'routes', label: 'the walkways and the cables', short: 'ROUTES', note: 'Stands out of access routes, cables secured, loudspeakers on rated supports; nothing flown or energized moved for a practice run.', prov: { kind: 'sourced', src: 'F14-LESSON', quote: 'Keep stands out of access routes, secure cables and use rated speaker support (F14 L47)' }, tag: 'KEEP CLEAR', scene: 'stage' },
      { id: 'level', label: 'the monitors’ level', short: 'LEVEL', note: 'Studio monitors can reach hazardous levels in a small room too. Agree a safe test level and keep it.', prov: { kind: 'sourced', src: 'F14-LESSON', quote: 'Studio monitors can also produce hazardous levels in a small room (F14 L47)' }, tag: 'SAFE LEVEL', scene: 'studio' },
    ],
    stage: 'IN A VENUE: check each subsystem alone across its intended seats, then the overlaps with the intended sources on; record the arrivals and phase before and after any change. Coordinate muting with the operator and keep the mic out of the PA.',
    studio: 'IN A STUDIO: measure left and right separately at the working listening position, then the nearby head positions; compare the height, the desk and floor reflections and the bass. Keep the monitor level and settings written down.',
  },
  diagnostic,
  practice: {
    task: 'Choose a setup for two briefs, and say which findings are direct-sound estimates, installed-system traces or limited checks. With a real system, the operator’s agreement and someone qualified on it, you can log what you did below.',
    fields: SYSTEM_SHEET,
  },
  unknowns: [
    { text: 'The bench: the test loudspeaker’s size, its reference height (1.2 m) and the arc radius (2 m) — drawing defaults; the method gives the real radius and angle grid.', dims: [] },
    { text: 'The venue: its size, the mains’ and fill’s positions, the sub, the rows and the standing area — drawing defaults (shared/measure/venue.ts). The seat mic heights 1.2 m / 1.7 m are sourced.', dims: [] },
    { text: 'The studio: the monitors’ spacing (1.6 m), the triangle, the desk and the nearby positions (30 cm, 50 cm) — drawing defaults.', dims: [] },
    { text: 'The near-field gap at the woofer (about 1–3 cm from the cap) — a drawing default (proposal: 10 mm).', dims: [] },
    { text: 'The processor latency (2 ms), the arrival heights and the bench room’s walls on the pages — made-up examples, labelled as such; the arrival times are geometry ÷ the calculator’s speed of sound.', dims: [] },
  ],
  live: { wedges: [] },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules: there is no single mic count, radius, angle grid, level or target that suits every loudspeaker and venue, and the method you are handed sets them. Experiment, and trust your ears and the room as well as the trace. The lab is silent and draws a simplified picture: a small loudspeaker, a small venue and a studio, straight paths at 20 °C, arrival heights and a processor latency as made-up examples, and an ideal comb for the overlap. Measure real systems with the operator’s agreement and someone qualified on the equipment.',
  copy: F14_COPY,
};
