/**
 * F16 SCIENTIFIC ARRAYS AND SPECIALIZED SENSORS — the lesson as DATA (Miking
 * Lab 6: Foley, Field & Scientific; Lab 6 group 5, branch lab6-g5). Words
 * from the owner's lesson (docs/labs/miking/source_text/F16-Scientific-
 * Arrays-and-Specialized-Sensors-Miking-Technique.txt; "L<n>" in comments
 * only); research in docs/labs/miking/scientific_arrays/ (SOURCES.md,
 * GEOMETRY_PROPOSAL.md); corrections in CORRECTIONS_LOG.md ("Lab 6 · group 5").
 *
 * Owner rulings: suggested starting points, never dogma; no source, brand,
 * model or standard number on screen (D-6B-3); safety exact in plain words
 * — no probe through a guard or into moving, hot or energized machinery;
 * never emit unverified ultrasound; specialist kit with a qualified operator
 * (D-6B-4, F16 L26 corrected to "a qualified operator"); the air/water units
 * never taught as a subtraction (correction G5-09); FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, Prediction, SetupReason, SetupTask, SourcePageId, Symptom } from '../../engine/model/types.ts';
import { ARRAY_SHEET } from '../shared/measure/logSheet.ts';
import { F16_MODEL } from './geometry.ts';
import { F16_ZONES } from './model.ts';
import { F16_COPY } from './copy.ts';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the array room',
    goal: 'Meet the room the array works in — the marked origin, the taped axes, the test source and its side point — before any element goes up.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'An array is its geometry: a marked origin, axes, each element’s coordinate, one clock. Name the medium and the quantity before placing a sensor.',
  },
  sound: {
    title: 'The baseline',
    goal: 'See a click reach two elements on a straight baseline — together from the centre, the right one first from the side, and the same from the side point’s mirror behind.',
    credit: { scenarios: ['ar.snd.1', 'ar.snd.2', 'ar.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'A baseline gives an arrival order and a time difference — not a unique direction: a straight pair cannot tell front from back. A third element off the line can.',
  },
  setting: {
    title: 'Before any element',
    goal: 'Settle the medium and the quantity, the origin and axes, the clock and the matching — and the safety lines — before any element goes up.',
    credit: { scenarios: ['ar.set.1', 'ar.set.2', 'ar.set.3'], note: 'Answer the three checks.' },
    takeaway: 'Origin, axes, one clock, matched channels, raw data kept. No probe into running machinery; no unverified ultrasound; specialist kit with a qualified operator.',
  },
  microphone: {
    title: 'The array and its spacing',
    goal: 'Build an array chain that can answer which element heard a click first, and find a spacing that keeps a uniform line clear of ambiguous lobes up to the top frequency.',
    credit: { scenarios: ['ar.mic.1', 'ar.mic.2', 'ar.mic.3', 'ar.rec.1'], interactive: 'spacing', note: 'In HALF A WAVELENGTH find a spacing that keeps clear and one that aliases, and answer the four checks.' },
    takeaway: 'One clock, matched elements, the geometry logged, the raw channels kept. For a uniform line, spacing at or below half a wavelength of the top frequency — f_max = c ÷ 2d.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and place the elements yourself — the baseline pair, a wider pair, a third element off the line — each at a logged coordinate from the origin.',
    credit: { scenarios: ['ar.place.1', 'ar.place.2', 'ar.place.3', 'ar.rec.2'], interactive: 'twoZones', note: 'Rest an element, clear of everything, in two different suggested starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Every element at a coordinate written from the marked origin, on the axis it belongs to, on the same clock. Change one element at a time and return to the centre run.',
  },
  context: {
    title: 'The intensity probe, on paper',
    goal: 'Lay out an intensity survey on paper: the enclosing surface, its outward normals, a safe scan path — and see a probe read cos θ of the flow along its axis.',
    credit: { scenarios: ['ar.ctx.1', 'ar.ctx.2', 'ar.rec.3'], interactive: 'probe', note: 'In THE INTENSITY PROBE turn it along the normal, across it and against it, and answer the three checks.' },
    takeaway: 'Pressure has no direction; intensity has one: a probe reads the component along its axis, near zero at 90°. The spacer and calibration set its band. A survey is a method, run by a qualified operator.',
  },
  twoMic: {
    title: 'Specialist kit and claims',
    goal: 'Look at the specialist kit as objects — an acoustic camera, an ultrasonic detector, a hydrophone and its units — then judge which claims each setup can support.',
    credit: { scenarios: ['ar.two.1', 'ar.two.2', 'ar.two.3'], interactive: 'kitClaims', note: 'In THE SPECIALIST KIT look at all three; on THE CLAIM LADDER judge every claim right for one setup; and answer the three checks.' },
    takeaway: 'A hot spot is an estimate; a sample-rate label is not a response; water and air levels are not comparable by subtracting. Each claim no bigger than the setup behind it.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the clock, the channel map, the geometry and the band before the physics: most surprises are a drifting recorder, a swapped channel or a spacing too wide.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put an array session in order, choose a setup for two briefs, and name the claim each setup cannot support.',
    credit: { scenarios: ['ar.prac.order', 'ar.prac.gain', 'ar.prac.setup1', 'ar.prac.setup2', 'ar.prac.3', 'ar.mix.1', 'ar.mix.2', 'ar.mix.3'], note: 'Put the session in order, answer the headroom card, complete both briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'Keep the geometry and the timing, report an arrival order without a false location, keep each medium’s units and each safety line explicit.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L5, L12–L13 · set L5–L6, L26–L27, L42 · mic L6, L12, L21 ·
 * place L12, L59–L64 · ctx L24–L27 · two L28–L31, L36, L39–L44 · prac L57–L66. */
const scenarios: MikingScenario[] = [
  {
    id: 'ar.snd.1',
    page: 'sound',
    prompt: 'A click straight in front of the baseline’s centre. What do L and R show?',
    options: ['They hear it at the same time', 'L hears it first, being on the left', 'R hears it first, as it is wired second'],
    correct: 'They hear it at the same time',
    explain: 'Straight in front, the two paths are equal: the arrivals coincide. A difference appears only when the source moves off the centre line.',
    why: {
      'L hears it first, being on the left': 'Neither side is favoured: the paths are equal.',
      'R hears it first, as it is wired second': 'The wiring order does not change when sound arrives — though a swapped channel map would mislabel it.',
    },
  },
  {
    id: 'ar.snd.2',
    page: 'sound',
    prompt: 'The side point and its mirror behind give the same time difference. What does that mean?',
    options: ['One baseline cannot tell front from back', 'The recorder must have dropped a sample', 'The mirror point is really the same place'],
    correct: 'One baseline cannot tell front from back',
    explain: 'A straight baseline is symmetric about its own line: a source in front and its mirror behind give the same difference. A third element off the line breaks it.',
    why: {
      'The recorder must have dropped a sample': 'Nothing failed: the geometry gives the same answer for both.',
      'The mirror point is really the same place': 'They are two places a pair cannot tell apart.',
    },
  },
  {
    id: 'ar.snd.3',
    page: 'sound',
    prompt: 'What can a two-element arrival order tell you on its own?',
    options: ['Which side was earlier', 'The source’s exact angle', 'How far away the source is'],
    correct: 'Which side was earlier',
    explain: 'Arrival order shows which side heard it first. A unique azimuth or range needs more elements, known geometry and checks.',
    why: {
      'The source’s exact angle': 'One baseline has front/back and other ambiguities: not a unique angle.',
      'How far away the source is': 'A single difference does not give the range.',
    },
  },
  {
    id: 'ar.set.1',
    page: 'setting',
    prompt: 'What do you mark before placing any element?',
    options: ['The origin and the array’s axes', 'The loudest spot anywhere in the room', 'The recorder’s highest gain'],
    correct: 'The origin and the array’s axes',
    explain: 'Mark the coordinate origin, the axes, the source region and the obstacles: every position and time difference is read from them.',
    why: {
      'The loudest spot anywhere in the room': 'Loudness does not define a coordinate system.',
      'The recorder’s highest gain': 'Gain is set for headroom, not as the first mark.',
    },
  },
  {
    id: 'ar.set.2',
    page: 'setting',
    prompt: 'You could get a cleaner map by pushing the probe through the guard. What do you do?',
    options: ['Stay outside it; leave it to an operator', 'Push it through quickly while it is running', 'Take the guard off for one quick pass'],
    correct: 'Stay outside it; leave it to an operator',
    explain: 'Never put a probe through a guard or into moving, hot or energized machinery. Specialist work is for a qualified operator, with the machine’s owner.',
    why: {
      'Push it through quickly while it is running': 'Never into moving machinery, however quickly.',
      'Take the guard off for one quick pass': 'Guards stay on; a cleaner map is no reason.',
    },
  },
  {
    id: 'ar.set.3',
    page: 'setting',
    prompt: 'A demo calls for ultrasound from an unverified emitter. What do you do?',
    options: ['Leave it off: inaudible is not harmless', 'Play it: nobody in the room will hear it', 'Play it, but only at the top of the band'],
    correct: 'Leave it off: inaudible is not harmless',
    explain: 'Never emit unverified ultrasound for a demonstration: you cannot judge its level by ear, and inaudible does not mean safe.',
    why: {
      'Play it: nobody in the room will hear it': 'Not hearing it is exactly why you cannot judge it.',
      'Play it, but only at the top of the band': 'Higher does not make an unverified emitter safe.',
    },
  },
  {
    id: 'ar.mic.1',
    page: 'microphone',
    prompt: 'Two recorders, one per mic, started by hand. What do you get?',
    options: ['Two clocks that drift apart', 'A coherent pair, at the same rate', 'A coherent pair, started together'],
    correct: 'Two clocks that drift apart',
    explain: 'Two independent recorders drift and start apart: the time between their tracks is not the sound’s. Use one synchronized clock.',
    why: {
      'A coherent pair, at the same rate': 'The same nominal rate still drifts apart sample by sample.',
      'A coherent pair, started together': 'Started by hand, they are never exactly together — and they drift after.',
    },
  },
  {
    id: 'ar.mic.2',
    page: 'microphone',
    prompt: 'Each element looks fine on its own. Why check them as a pair?',
    options: ['Phase and time offsets matter', 'Their cable colours should match', 'A pair needs twice the gain'],
    correct: 'Phase and time offsets matter',
    explain: 'Array phase and time offsets matter even when each element’s own response looks acceptable: check the matching and the channel map.',
    why: {
      'Their cable colours should match': 'Looks are not the point: the timing and the phase are.',
      'A pair needs twice the gain': 'The gain is set for headroom; matching is about phase and sensitivity.',
    },
  },
  {
    id: 'ar.mic.3',
    page: 'microphone',
    prompt: 'A uniform line, elements 60 mm apart. Up to about what frequency is it clear of aliasing?',
    options: ['About 2.9 kHz', 'About 29 kHz or so', 'About 290 Hz or so'],
    correct: 'About 2.9 kHz',
    explain: 'f_max = c ÷ 2d = 343 m/s ÷ 0.12 m ≈ 2.9 kHz. Above that, ambiguous lobes appear.',
    why: {
      'About 29 kHz or so': 'Ten times too high: half a wavelength at 29 kHz is about 6 mm.',
      'About 290 Hz or so': 'Ten times too low: half a wavelength at 290 Hz is about 59 cm.',
    },
  },
  {
    id: 'ar.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · The side click reaches R before L. What does that support?',
    options: ['An arrival order', 'A unique source angle', 'The source’s power'],
    correct: 'An arrival order',
    explain: 'Which side was earlier, on one clock — not yet a direction, and not a power.',
    why: {
      'A unique source angle': 'A straight baseline has a front/back mirror.',
      'The source’s power': 'Power needs a method, calibrated kit and a surface.',
    },
  },
  {
    id: 'ar.place.1',
    page: 'placement',
    prompt: 'Where do you write each element’s position from?',
    options: ['The marked origin', 'The nearest wall', 'The recorder’s position'],
    correct: 'The marked origin',
    explain: 'Every coordinate from one origin, along the marked axes — so a time difference can be tied to a geometry.',
    why: {
      'The nearest wall': 'A wall is not the array’s reference: the origin is.',
      'The recorder’s position': 'The recorder’s place has nothing to do with the geometry.',
    },
  },
  {
    id: 'ar.place.2',
    page: 'placement',
    prompt: 'You widen the baseline from 50 cm to 1 m. What happens to the time difference for the side point?',
    options: ['It grows larger', 'It stays the same', 'It flips its sign'],
    correct: 'It grows larger',
    explain: 'A wider pair gives larger time differences for the same source angle — and keeps the same front/back mirror.',
    why: {
      'It stays the same': 'The path difference grows with the spacing.',
      'It flips its sign': 'The source is still on the same side: the sign stays.',
    },
  },
  {
    id: 'ar.place.3',
    page: 'placement',
    prompt: 'Where does a third element go to break the front/back mirror?',
    options: ['Off the baseline’s line', 'On the same line, just past R', 'At the origin itself'],
    correct: 'Off the baseline’s line',
    explain: 'An element off the line hears a source in front and one behind at different times: the mirror is broken.',
    why: {
      'On the same line, just past R': 'Still on the same line: the symmetry stays.',
      'At the origin itself': 'At the origin it is on the line too.',
    },
  },
  {
    id: 'ar.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · After moving an element, what do you repeat first?',
    options: ['The centre run', 'The side run only', 'Nothing yet'],
    correct: 'The centre run',
    explain: 'Return to the centre to check that the arrivals still coincide — the setup did not drift.',
    why: {
      'The side run only': 'The centre run is the check that the geometry still holds.',
      'Nothing yet': 'A moved element needs a check before the next run.',
    },
  },
  {
    id: 'ar.ctx.1',
    page: 'context',
    prompt: 'The probe is turned 90° to the flow. What does it read?',
    options: ['Close to zero along its axis', 'The full flow, unchanged', 'Twice the flow, sideways'],
    correct: 'Close to zero along its axis',
    explain: 'A p–p probe reads the component along its axis: cos 90° ≈ 0 — even though the pressure is the same.',
    why: {
      'The full flow, unchanged': 'Only the part along the axis is read.',
      'Twice the flow, sideways': 'Turning it does not add flow: cos θ only shrinks it.',
    },
  },
  {
    id: 'ar.ctx.2',
    page: 'context',
    prompt: 'What sets an intensity probe’s usable frequency range?',
    options: ['Its spacer and its calibration', 'The loudness of the device alone', 'How fast you scan the surface'],
    correct: 'Its spacer and its calibration',
    explain: 'The spacer and the calibration set the band — a wider spacer toward the lows, a narrower one toward the highs; its data gives each range.',
    why: {
      'The loudness of the device alone': 'Loudness does not set the band.',
      'How fast you scan the surface': 'Scan speed matters to the method, not to the probe’s band.',
    },
  },
  {
    id: 'ar.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Two drifting recorders, one per element. What can you still report?',
    options: ['What each heard, not the timing', 'An arrival order, if you align them', 'A direction, with care'],
    correct: 'What each heard, not the timing',
    explain: 'Without one clock, the time between the tracks is not the sound’s: report observations, not an order.',
    why: {
      'An arrival order, if you align them': 'Aligning by hand removes the very difference you came for.',
      'A direction, with care': 'Care does not fix a drifting clock.',
    },
  },
  {
    id: 'ar.two.1',
    page: 'twoMic',
    prompt: 'The acoustic camera shows a bright spot on a panel. What is it?',
    options: ['An estimate to check', 'Proof of the fault', 'A photo of the sound'],
    correct: 'An estimate to check',
    explain: 'A mapped peak can be a source, a reflection, a sidelobe or an artifact. Check with a known source and from another viewpoint.',
    why: {
      'Proof of the fault': 'No map alone proves a fault: check it independently.',
      'A photo of the sound': 'It is a model’s estimate, not a picture of sound.',
    },
  },
  {
    id: 'ar.two.2',
    page: 'twoMic',
    prompt: 'A 48 kHz recorder for bat calls that reach 60 kHz. What happens?',
    options: ['It keeps only what is below 24 kHz', 'It keeps them: 48 is close to 60', 'It keeps them with a good enough mic'],
    correct: 'It keeps only what is below 24 kHz',
    explain: 'A sample rate must exceed twice the highest frequency kept: 48 kHz keeps below 24 kHz. And the mic and the filter must reach the band too.',
    why: {
      'It keeps them: 48 is close to 60': 'The rate must be more than twice the frequency, not close to it.',
      'It keeps them with a good enough mic': 'A good mic cannot beat the sample rate’s limit.',
    },
  },
  {
    id: 'ar.two.3',
    page: 'twoMic',
    prompt: 'An underwater level in dB re 1 µPa and an airborne one in dB re 20 µPa. How do you compare them?',
    options: ['Report each with its medium', 'Subtract 26 dB from the water', 'Add 26 dB to the airborne one'],
    correct: 'Report each with its medium',
    explain: 'The references differ, and water and air carry sound differently: the numbers are not directly comparable, and no fixed subtraction makes them so.',
    why: {
      'Subtract 26 dB from the water': 'The references account for only part of the difference: no fixed amount makes the two comparable.',
      'Add 26 dB to the airborne one': 'The same mistake the other way round: report each with its own medium and reference.',
    },
  },
  {
    id: 'ar.prac.gain',
    page: 'practice',
    prompt: 'Before the runs, how do you set the two channels’ gains?',
    options: ['The same, with headroom, logged', 'Each to fill its own meter', 'High, to catch the very quietest clicks'],
    correct: 'The same, with headroom, logged',
    explain: 'Matched channels: the same gain, headroom for the loudest event, written down — so a level difference belongs to the sound.',
    why: {
      'Each to fill its own meter': 'Different gains add their own level difference.',
      'High, to catch the very quietest clicks': 'A high gain clips the loud events.',
    },
  },
  {
    id: 'ar.prac.3',
    page: 'practice',
    prompt: 'Which claim can one synchronized baseline not support?',
    options: ['A unique direction', 'An arrival order', 'An observation'],
    correct: 'A unique direction',
    explain: 'A single baseline has a front/back mirror: an order and an observation, yes; a unique direction, no.',
    why: {
      'An arrival order': 'That is what a synchronized baseline does support.',
      'An observation': 'An honest observation is always within reach.',
    },
  },
  {
    id: 'ar.mix.1',
    page: 'practice',
    prompt: 'The side run and its mirror run look identical. What next?',
    options: ['Add an element off the line', 'Average the two runs together', 'Call it front, out of habit'],
    correct: 'Add an element off the line',
    explain: 'A third element off the line, or another viewpoint, resolves the front/back ambiguity.',
    why: {
      'Average the two runs together': 'Averaging two identical runs tells you nothing new.',
      'Call it front, out of habit': 'A habit is not evidence.',
    },
  },
  {
    id: 'ar.mix.2',
    page: 'practice',
    prompt: 'A detector set to 192 kHz for calls up to 60 kHz. What else do you check?',
    options: ['The mic and filter reach 60 kHz', 'The calls are louder than speech', 'Nothing: the rate decides it'],
    correct: 'The mic and filter reach 60 kHz',
    explain: '192 kHz keeps everything below 96 kHz — enough for 60 kHz calls on paper. But a high enough rate is not enough on its own: the mic and the anti-alias filter must reach the band too.',
    why: {
      'The calls are louder than speech': 'Loudness is not the question: the band is.',
      'Nothing: the rate decides it': 'A high enough rate is needed, but a sample-rate label alone does not prove usable ultrasonic sensitivity.',
    },
  },
  {
    id: 'ar.mix.3',
    page: 'practice',
    prompt: 'The R channel shows the left click first. What do you check first?',
    options: ['The channel map', 'The speed of sound', 'The room’s size'],
    correct: 'The channel map',
    explain: 'A swapped channel map reverses every order. Check the map with a known source before the physics.',
    why: {
      'The speed of sound': 'It is the same for both elements.',
      'The room’s size': 'The room does not swap left and right.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'ar.sym.1',
    observation: 'The time difference creeps a little more every run',
    firstChecks: 'The clock: one recorder or two',
    options: ['The clock: two recorders drift', 'The source, which is moving away', 'The room, which is warming up'],
    correct: 'The clock: two recorders drift',
    explain: 'Independent recorders drift apart: use one synchronized clock for every element.',
    why: {
      'The source, which is moving away': 'The source is on a fixed stand: check the clock before the geometry.',
      'The room, which is warming up': 'Warming changes both paths alike; drift between clocks is the commoner cause.',
    },
  },
  {
    id: 'ar.sym.2',
    observation: 'Every run shows the right element first, whatever the side',
    firstChecks: 'The channel map, with a known source',
    options: ['The channel map: L and R swapped', 'The right mic, which is louder', 'The baseline, which is too short'],
    correct: 'The channel map: L and R swapped',
    explain: 'A swapped or offset channel always favours one side. Check the map and the timing with a known source.',
    why: {
      'The right mic, which is louder': 'Loudness does not move an arrival in time.',
      'The baseline, which is too short': 'A short baseline shrinks the difference; it does not fix its sign.',
    },
  },
  {
    id: 'ar.sym.3',
    observation: 'The map shows two sources where there is one',
    firstChecks: 'Reflections, sidelobes, spacing against the band',
    options: ['A sidelobe or a reflection', 'A second fault in the device', 'A failed element, surely'],
    correct: 'A sidelobe or a reflection',
    explain: 'A mapped peak can be a reflection, a sidelobe or an artifact — or spatial aliasing above the array’s band. Repeat from another viewpoint.',
    why: {
      'A second fault in the device': 'A second peak is not proof of a second source: check it independently.',
      'A failed element, surely': 'Possible, but the geometry and the band are the commoner causes.',
    },
  },
  {
    id: 'ar.sym.4',
    observation: 'The probe reads almost nothing next to a loud panel',
    firstChecks: 'Its angle to the surface’s normal',
    options: ['Its angle: it is across the flow', 'The panel, which must be quiet', 'The spacer, which must be broken'],
    correct: 'Its angle: it is across the flow',
    explain: 'Across the flow the axial component is near zero, even when the pressure is high. Turn it onto the outward normal.',
    why: {
      'The panel, which must be quiet': 'The pressure is high: the probe’s aim is the issue.',
      'The spacer, which must be broken': 'A near-zero reading across the flow is what a working probe does.',
    },
  },
  {
    id: 'ar.sym.5',
    observation: 'Ultrasonic calls show up folded down into the audible band',
    firstChecks: 'The sample rate and the anti-alias filter',
    options: ['The rate: too low for the band', 'The bats, which are calling lower', 'The detector’s battery, running low'],
    correct: 'The rate: too low for the band',
    explain: 'Content above half the sample rate folds down unless filtered out: raise the rate and check the filter and the mic’s band.',
    why: {
      'The bats, which are calling lower': 'Folded calls are an artifact of sampling, not of the animals.',
      'The detector’s battery, running low': 'A low battery does not fold frequencies.',
    },
  },
  {
    id: 'ar.sym.6',
    observation: 'A hydrophone level looks far higher than the same sound measured in air',
    firstChecks: 'The reference pressure and the medium',
    options: ['The references and the medium', 'The hydrophone, overloading', 'The water, being too loud'],
    correct: 'The references and the medium',
    explain: 'Water levels use 1 µPa, air 20 µPa, and water carries sound differently: the numbers are not directly comparable.',
    why: {
      'The hydrophone, overloading': 'The difference is in the units first, not in the sensor.',
      'The water, being too loud': 'The number is bigger partly because of the reference — not a louder sound.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'ar.prac.order',
    page: 'practice',
    prompt: 'An array session, start to finish: put the steps in order.',
    steps: [
      { text: 'Name the medium and quantity; mark the origin and the axes', early: 'The medium, the quantity and the origin come first.' },
      { text: 'Place the elements at logged coordinates, on one clock', early: 'The elements go up once the origin is marked.' },
      { text: 'Check the channels with a known source at a modest level', early: 'The check comes before the runs.' },
      { text: 'Centre runs and repeats, then side runs and repeats', early: 'The runs follow the check.' },
      { text: 'Return to the centre to check it repeats', early: 'The return closes the runs.' },
      { text: 'Report the order, the limits, and the claim it cannot support', early: 'The report comes last.' },
    ],
    explain: 'Medium and origin, elements on one clock, a known-source check, the runs and the return — then an honest report with its limits.',
  },
];

const R = (id: string, label: string, role: SetupReason['role'], feedback: string): SetupReason => ({ id, label, role, feedback });
const setupTasks: SetupTask[] = [
  {
    id: 'ar.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Show which side of the room a click came from, centre and side. A two-channel recorder and two omni measurement mics.',
    setups: [
      { id: 'b50', label: 'Matched pair, 50 cm baseline, one recorder, origin logged', ok: true, power: 'phantom', feedback: 'One clock, matched elements, the geometry written: an honest arrival order.' },
      { id: 'b100', label: 'Matched pair, 1 m baseline, one recorder, origin logged', ok: true, power: 'phantom', feedback: 'A wider baseline: larger differences, the same honest claim.' },
      { id: 'two', label: 'One mic on each of two phones, started together by hand', ok: false, power: 'none', feedback: 'Two clocks drift: the order cannot be trusted.' },
    ],
    reasons: [
      R('clock', 'Both elements on one synchronized clock', 'required', 'The time difference must be the sound’s.'),
      R('logged', 'The baseline and the origin written down', 'required', 'An order means nothing without the geometry.'),
      R('repeat', 'A return to the centre to check it repeats', 'optional', 'It shows nothing drifted.'),
      R('angle', 'The result is reported as the source’s exact angle', 'wrong', 'One baseline gives an order, not a unique angle.'),
    ],
    explain: 'Either baseline passes: one clock, matched elements, the geometry logged, an honest claim.',
  },
  {
    id: 'ar.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · Plan, on paper, where a small device’s sound energy leaves it. No specialist operator is available today.',
    setups: [
      { id: 'paper', label: 'An enclosing surface drawn with outward normals and a safe scan path', ok: true, power: 'none', feedback: 'A layout a qualified operator can use: honest about what it is.' },
      { id: 'plan', label: 'The surface, its normals, and the probe’s spacer and checks listed', ok: true, power: 'none', feedback: 'The prerequisites written down too: a fuller plan.' },
      { id: 'probe', label: 'Borrow a probe and scan the running device yourself', ok: false, power: 'none', feedback: 'Specialist equipment needs a qualified operator — and never near moving parts.' },
    ],
    reasons: [
      R('normals', 'The outward normals marked on the surface', 'required', 'Intensity is read along the normal.'),
      R('safe', 'The scan path kept clear of guards and moving parts', 'required', 'Nothing goes through a guard.'),
      R('method', 'The method and its validity checks named for the operator', 'optional', 'A survey is a method, not a pass over one panel.'),
      R('power', 'The plan is reported as the device’s sound power', 'wrong', 'A paper layout is not a measurement.'),
    ],
    explain: 'Either paper plan passes: a layout for a qualified operator, not a survey done by hand.',
  },
];

const predictions: Partial<Record<SourcePageId, Prediction>> = {
  microphone: { prompt: 'Two recorders, one per mic, started together by hand. Will the time difference be the sound’s?', options: ['Probably not', 'Yes', 'Only for loud clicks'], after: 'Build the chain and read why one clock matters.' },
  placement: { prompt: 'You widen the baseline. What happens to the time difference for the side point?', options: ['It grows', 'It shrinks', 'It stays the same'], after: 'Place the wider pair and compare.' },
  context: { prompt: 'Turned 90° to the flow, what does an intensity probe read?', options: ['Nearly nothing', 'The full flow', 'The pressure'], after: 'Turn the probe and read the axis.' },
  twoMic: { prompt: 'A bright spot on an acoustic camera’s map: is it the fault?', options: ['Not on its own', 'Yes', 'Only if it is red'], after: 'Look at the camera, then judge the claims.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'ar.q.1',
    covers: 'sound',
    prompt: 'A source in front and its mirror behind a straight baseline give what?',
    options: ['The same time difference', 'Opposite time differences', 'No time difference at all'],
    correct: 'The same time difference',
    explain: 'A straight baseline is symmetric about its line: it cannot tell front from back.',
    why: {
      'Opposite time differences': 'Both are on the same side of the centre line: the sign is the same.',
      'No time difference at all': 'Only a source on the centre line gives none.',
    },
  },
  {
    id: 'ar.q.2',
    covers: 'setting',
    critical: true,
    prompt: 'Where may a probe or mic go near a running machine?',
    options: ['Outside its guards only', 'Through the guard, briefly', 'Into the airflow, if quick'],
    correct: 'Outside its guards only',
    explain: 'Never through a guard or into moving, hot or energized machinery; specialist work with a qualified operator.',
    why: {
      'Through the guard, briefly': 'Never through a guard, however briefly.',
      'Into the airflow, if quick': 'Moving machinery is a hazard, quick or not.',
    },
  },
  {
    id: 'ar.q.3',
    covers: 'setting',
    critical: true,
    prompt: 'An unverified ultrasound emitter for a demo: what do you do?',
    options: ['Leave it off: inaudible is not harmless', 'Play it: nobody nearby will ever notice', 'Play it, but only briefly and very loudly'],
    correct: 'Leave it off: inaudible is not harmless',
    explain: 'Never emit unverified ultrasound; you cannot judge its level by ear.',
    why: {
      'Play it: nobody nearby will ever notice': 'That is why you cannot judge it.',
      'Play it, but only briefly and very loudly': 'Brief does not make an unverified level safe.',
    },
  },
  {
    id: 'ar.q.4',
    covers: 'setting',
    prompt: 'What makes two elements a coherent pair?',
    options: ['One synchronized clock', 'The same colour of cable', 'Two recorders at once'],
    correct: 'One synchronized clock',
    explain: 'Both channels sampled on one clock; independent recorders drift.',
    why: {
      'The same colour of cable': 'Cables do not set the timing.',
      'Two recorders at once': 'Two recorders are two clocks.',
    },
  },
  {
    id: 'ar.q.5',
    covers: 'sound',
    prompt: 'What does a two-element arrival order show?',
    options: ['Which side was first', 'The exact source angle', 'The source’s distance'],
    correct: 'Which side was first',
    explain: 'An order, not a unique direction or a range.',
    why: {
      'The exact source angle': 'One baseline has a front/back mirror.',
      'The source’s distance': 'A single difference does not give range.',
    },
  },
  {
    id: 'ar.q.6',
    covers: 'setting',
    prompt: 'What do you mark before placing an element?',
    options: ['The origin and axes', 'The loudest point', 'The recorder’s spot'],
    correct: 'The origin and axes',
    explain: 'Every coordinate is written from the origin, along the axes.',
    why: {
      'The loudest point': 'Loudness is not a coordinate system.',
      'The recorder’s spot': 'The recorder’s place is not the geometry.',
    },
  },
];

export const F16_LESSON: Lesson = {
  id: 'F16',
  labId: 'field',
  title: 'Scientific Arrays and Specialized Sensors',
  subtitle: 'A marked origin, one clock, the right spacing — an arrival order without a false location, each medium in its own units',
  noun: { one: 'array', many: 'arrays', subject: 'array room' },
  model: F16_MODEL,
  micTypeIds: ['measFF', 'measRI'],
  zones: F16_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  setupPairs: [
    { label: 'The baseline: L and R, 50 cm apart', A: { zone: 'ar.L' }, B: { zone: 'ar.R' }, line: 'Two matched omni elements on one clock, the origin between them: an arrival order, not yet a direction.' },
    { label: 'A wider baseline: 1 m', A: { zone: 'ar.L2' }, B: { zone: 'ar.R2' }, more: true, line: 'Larger time differences for the same source — and the same front/back mirror.' },
  ],
  orient: [
    { title: 'WHAT IT IS', text: 'An array combines pressures measured at known places; an intensity probe estimates the energy flow along its axis; a hydrophone senses pressure under water. Each needs its own geometry, calibration, band and units.', src: 'F16-LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'Finding where a sound comes from, mapping a product’s noise, sound-power surveys, underwater and ultrasonic recording — mostly specialist work, run by a qualified operator.', src: 'F16-LESSON' },
    { title: 'THE EXERCISE', text: 'Two omni measurement mics on a straight baseline, one synchronized recorder, a marked origin and axes, and a stationary source at a modest level — a click at the centre, then at the side.', src: 'F16-LESSON' },
    { title: 'THE DRAWING', text: 'A controlled room, a 50 cm baseline 1.2 m above the floor, a source 2 m in front: sizes are drawings. The arrival times are straight paths at 20 °C.', src: 'MW-ULA' },
  ],
  sound: {
    stages: [
      { title: 'Centre', text: 'Straight in front, both elements hear the click together.' },
      { title: 'Side', text: 'Off to one side, the nearer element hears it first.' },
      { title: 'Mirror', text: 'Behind the array, at the side point’s mirror, the pair hears exactly the same.' },
    ],
    attack: 'The arrival order shows which side was earlier.',
    body: 'A unique direction needs more elements off the line.',
    head: { diameterMm: 12.7, rods: 0, label: '1/2 in capsule', strikeSrc: 'GRAS-FF' },
  },
  setting: {
    items: [
      { id: 'clock', label: 'the recorder and its clock', short: 'ONE CLOCK', note: 'Every element on one synchronized recorder; two recorders drift apart.', prov: { kind: 'sourced', src: 'F16-LESSON', quote: 'An ordinary stereo pair with two independent, drifting recorders is not automatically a coherent measurement array (F16 L6)' }, tag: 'ONE CLOCK', scene: 'all' },
      { id: 'walls', label: 'walls and obstacles', short: 'REFLECTIONS', note: 'A reflection can arrive stronger than the direct sound and fool an arrival order: note the walls and obstacles near the array.', prov: { kind: 'sourced', src: 'F16-LESSON', quote: 'reflections can create a misleading arrival (F16 L13)' }, tag: 'REFLECTIONS', scene: 'all' },
      { id: 'machines', label: 'running machinery nearby', short: 'KEEP CLEAR', note: 'No probe or mic through a guard or into moving, hot or energized machinery; arrays stay outside turbulent airflow.', prov: { kind: 'sourced', src: 'F16-LESSON', quote: 'They do not insert a probe through guards or into moving, hot or energized machinery (F16 L27)' }, tag: 'KEEP CLEAR', scene: 'studio' },
      { id: 'water', label: 'water, permissions and wildlife', short: 'PERMISSIONS', note: 'Under water or in the field, the site’s permissions, the survey protocol and the non-disturbance rules come first.', prov: { kind: 'sourced', src: 'F16-LESSON', quote: 'follow the species survey protocol, site permissions, weather and non-disturbance rules (F16 L39)' }, tag: 'PERMISSIONS', scene: 'stage' },
    ],
    stage: 'IN THE FIELD: the medium and the permissions first; a sensor rated and calibrated for the deployment; its depth, mooring, orientation and the conditions written down.',
    studio: 'IN A CONTROLLED ROOM: a stationary source at a modest, agreed level, a marked origin and axes, one clock, the raw channels kept — and a return to the centre run.',
  },
  diagnostic,
  practice: {
    task: 'Choose a setup for two briefs, and name the claim each one cannot support. With calibrated equipment and a qualified operator, you can log what you did below.',
    fields: ARRAY_SHEET,
  },
  unknowns: [
    { text: 'The room, the baseline (0.5 m, and 1 m wide), the array height (1.2 m), the source distance (2 m) and the side point (1 m across) — drawing defaults.', dims: [] },
    { text: 'The third element (25 cm behind the origin) — a drawing default for the alternative layout.', dims: [] },
    { text: 'The probe’s band per spacer is not shown as numbers (the source gives one maker’s set only); the camera’s map, the hydrophone’s depth and mooring — drawings.', dims: [] },
    { text: 'The claim ladder’s example numbers (25°, 60 dB) — made-up claims to judge, not facts.', dims: [] },
  ],
  live: { wedges: [] },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules: there is no single aperture, spacing, scan density or distance for every site, and the array’s own method sets them. Experiment, and trust your ears and the room as well as the map. The lab is silent and draws a simplified picture: straight paths at 20 °C, a two-element baseline, a probe on paper, and specialist kit drawn as objects. Use specialist equipment only with a qualified operator.',
  copy: F16_COPY,
};
