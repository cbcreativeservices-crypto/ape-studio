/**
 * F12 SOUND LEVEL AND ENVIRONMENTAL NOISE — the lesson as DATA (Miking Lab 6;
 * Lab 6 group 4, branch lab6-g4). Words from the owner's lesson
 * (docs/labs/miking/source_text/F12-Sound-Level-and-Environmental-Noise-
 * Miking-Technique.txt; "L<n>" in comments only); research in
 * docs/labs/miking/sound_level/; corrections in CORRECTIONS_LOG.md.
 *
 * Owner rulings: suggested starting points; no source, brand or standard
 * number on screen (D-6B-3); safety exact in plain words (3 m (10 ft) from
 * overhead power lines; lightning: inside at once, 30 minutes after the last
 * lightning or thunder; never raise a level to make a meter respond; never
 * feed a measurement mic to the PA); made-up histories labelled as such
 * (D-6B-2); background subtraction refuses inside the method's limit
 * (D-6B-8, default 3 dB). FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, Prediction, SetupReason, SetupTask, SourcePageId, Symptom } from '../../engine/model/types.ts';
import { FIELD_SHEET } from '../shared/measure/logSheet.ts';
import { F12_MODEL } from './geometry.ts';
import { F12_ZONES } from './model.ts';
import { F12_COPY } from './copy.ts';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the survey',
    goal: 'Meet a sound-level survey — the meter on its tripod and the site round it: the source, the receivers, the walls, the ground — before any number.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A meter reads what arrives at its spot, from everything, at that time. The question names the receiver, the descriptor and the window.',
  },
  sound: {
    title: 'How sound reaches the meter',
    goal: 'See what arrives at a meter on a site — the traffic, its reflection off the ground and the facade, a second source — and when.',
    credit: { scenarios: ['sl.snd.1', 'sl.snd.2', 'sl.snd.3'], note: 'Answer the three checks on what reaches the meter.' },
    takeaway: 'The meter receives every path at its position. A spot near a facade includes its reflection; an area reading is not a worker’s exposure.',
  },
  setting: {
    title: 'Before any meter',
    goal: 'Settle the question, the descriptor and the safety of every position before the tripod goes up.',
    credit: { scenarios: ['sl.set.1', 'sl.set.2', 'sl.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The question, the receiver, the descriptor and the window first. Positions you may use and can reach safely; 3 m (10 ft) from power lines; inside at once when thunder is heard.',
  },
  microphone: {
    title: 'The meter’s settings',
    goal: 'Set the instrument for the question — the weighting, the time weighting or average, and what you write down — and see what is refused and why.',
    credit: { scenarios: ['sl.mic.1', 'sl.mic.2', 'sl.mic.3', 'sl.rec.1'], interactive: 'chainBuilt', note: 'Set a meter that passes its question, and answer the four checks (one reaches back to the site).' },
    takeaway: 'LAeq, LAFmax, L90 and a peak answer different questions. Write the meter’s own label and the window, never a bare “dB”; a recorder’s dBFS is not a sound level.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and place the meter yourself — in the open, 2 m from the facade, at the wall — at the method’s height, and see what each position stands for.',
    credit: { scenarios: ['sl.place.1', 'sl.place.2', 'sl.place.3', 'sl.rec.2'], interactive: 'twoZones', note: 'Rest the meter, clear of everything, in two different suggested starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Put the meter where the method says, at the height it names, and say which kind of position it is. A reading at a wall is never called an open-field reading.',
  },
  context: {
    title: 'Background and weather',
    goal: 'Take the background off a total the honest way — by energy, refused when they are too close — and log the wind and the weather instead of “fixing” them.',
    credit: { scenarios: ['sl.ctx.1', 'sl.ctx.2', 'sl.rec.3'], interactive: 'bgSubtract', note: 'Separate a source once and see a refusal once in BACKGROUND, and answer the three checks.' },
    takeaway: 'Background comes off as energy, never as dB minus dB, and only as far apart as the method allows. A windscreen reduces buffeting; it does not make a windy interval valid.',
  },
  twoMic: {
    title: 'Two receivers, one clock',
    goal: 'Read the descriptors from a level history at two receivers — LAeq, LAFmax, L10, L50, L90 — and see why the plain mean of the dB is not an average.',
    credit: { scenarios: ['sl.two.1', 'sl.two.2', 'sl.two.3'], interactive: 'descriptors', note: 'Look at both receivers and a shorter window, and answer the three checks.' },
    takeaway: 'LAeq is the energy average over a stated window. Two meters share one clock and keep two records. Keep every original history and a reason for anything you leave out.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the position, the wind, the background and the settings before the number — and keep the raw records whatever you find.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a survey in order, choose and justify positions for two briefs, and say what one reading can and cannot claim.',
    credit: { scenarios: ['sl.prac.order', 'sl.prac.gain', 'sl.prac.setup1', 'sl.prac.setup2', 'sl.prac.3', 'sl.mix.1', 'sl.mix.2', 'sl.mix.3'], note: 'Put the survey in order, answer the meter check, complete both briefs, and answer the four reasoning cards. The field sheet is optional.' },
    takeaway: 'A named question, a descriptor and a window, safe and logged positions, checks before and after, weather and background recorded — and a conclusion no bigger than the evidence.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L6, L26–L28 · set L5, L24, L41 · mic L10–L24 · place L26–L28 ·
 * ctx L33–L35 · two L24, L28–L31 · prac L36–L50. */
const scenarios: MikingScenario[] = [
  {
    id: 'sl.snd.1',
    page: 'sound',
    prompt: 'Receiver B is 2 m from the facade. What does it hear that receiver A, out in the open, does not?',
    options: ['The traffic’s reflection off the facade', 'Less of the traffic, shielded by the house', 'Only the air unit, louder than the road'],
    correct: 'The traffic’s reflection off the facade',
    explain: 'A hard wall facing the road sends the traffic back toward a meter near it: B hears the direct sound and the facade’s reflection. That is why a facade position is named as one.',
    why: {
      'Less of the traffic, shielded by the house': 'B is on the road side of the house, in full view of the traffic — the house shields nothing there.',
      'Only the air unit, louder than the road': 'The air unit is one source among others; the traffic still arrives, with its reflection.',
    },
  },
  {
    id: 'sl.snd.2',
    page: 'sound',
    prompt: 'A meter on the lawn shows a level. What does that level stand for?',
    options: ['That spot, at that time, with everything arriving', 'The listeners all along the street, all day long', 'A worker’s exposure over the whole of their shift'],
    correct: 'That spot, at that time, with everything arriving',
    explain: 'An area reading represents its position and its time. A mobile worker’s daily dose is measured on the person; a whole area needs several representative positions.',
    why: {
      'The listeners all along the street, all day long': 'One spot and one window cannot speak for a whole street or a whole day.',
      'A worker’s exposure over the whole of their shift': 'Exposure follows the person as they move — that is personal sampling, not an area meter.',
    },
  },
  {
    id: 'sl.snd.3',
    page: 'sound',
    prompt: 'Which arrives at receiver A first?',
    options: ['The car’s direct sound', 'The car’s reflection off the ground', 'The air unit’s reflection off the facade'],
    correct: 'The car’s direct sound',
    explain: 'The straight path is the shortest, so it arrives first; the ground reflection travels a little farther and arrives just after.',
    why: {
      'The car’s reflection off the ground': 'A reflection always travels farther than the straight path from the same source.',
      'The air unit’s reflection off the facade': 'Receiver A, out in the open, is not reached by that reflection at all here.',
    },
  },
  {
    id: 'sl.set.1',
    page: 'setting',
    prompt: 'You want to raise the meter on a mast near the road’s power line. How far from the line must the mast stay?',
    options: ['At least 3 m (10 ft), farther if unsure', 'About 1 m, if the mast is made of wood', 'A short way off, if the mast is not touching it'],
    correct: 'At least 3 m (10 ft), farther if unsure',
    explain: 'Keep any pole, mast or stand at least 3 m (10 ft) from overhead power lines — farther if you are unsure. If you cannot be sure, do not raise it.',
    why: {
      'About 1 m, if the mast is made of wood': 'Too close: electricity can arc to a pole without touching it, and wet or dirty wood conducts. Keep 3 m (10 ft) or more.',
      'A short way off, if the mast is not touching it': 'Not touching is not enough: keep at least 3 m (10 ft) away.',
    },
  },
  {
    id: 'sl.set.2',
    page: 'setting',
    prompt: 'Thunder rumbles during an outdoor survey. What now?',
    options: ['Shelter now; return 30 min after the last lightning or thunder', 'Finish the window, then shelter if the storm comes nearer', 'Cover the meter and keep going until the rain actually starts'],
    correct: 'Shelter now; return 30 min after the last lightning or thunder',
    explain: 'When thunder is heard, get inside a safe place immediately, and wait 30 minutes after the last lightning or thunder before going back outside.',
    why: {
      'Finish the window, then shelter if the storm comes nearer': 'If you can hear thunder, you are close enough to be struck: shelter now; the window can be repeated.',
      'Cover the meter and keep going until the rain actually starts': 'Rain is not the signal; thunder is. Get inside a safe place now.',
    },
  },
  {
    id: 'sl.set.3',
    page: 'setting',
    prompt: 'What do you write down before the meter starts?',
    options: ['The descriptor and the window', 'The loudest level that you expect to see', 'The meter’s battery level'],
    correct: 'The descriptor and the window',
    explain: 'The descriptor (LAeq, LAFmax, L90, a peak) and the window it covers answer the question — choose them before the capture, not after seeing the numbers.',
    why: {
      'The loudest level that you expect to see': 'Useful for the range, but it does not say what the result will mean.',
      'The meter’s battery level': 'Worth checking, but it is not the measurement’s question.',
    },
  },
  {
    id: 'sl.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · The meter sits 2 m from the facade. What does its reading include?',
    options: ['The direct traffic and the facade’s reflection', 'The direct traffic only, the wall filtered out', 'The house’s inside, heard through the wall'],
    correct: 'The direct traffic and the facade’s reflection',
    explain: 'A facade position includes the reflection off the wall: the meter cannot filter it out, which is why the position is named.',
    why: {
      'The direct traffic only, the wall filtered out': 'No setting removes a reflection: it arrives as sound like any other.',
      'The house’s inside, heard through the wall': 'Through-the-wall sound is not what a facade position adds; the reflection is.',
    },
  },
  {
    id: 'sl.mic.1',
    page: 'microphone',
    prompt: 'The brief asks for the hour’s average traffic level. Which descriptor?',
    options: ['LAeq over the hour, with its start and stop', 'LAFmax over the hour, the loudest moment', 'The single meter reading taken at the half-hour mark'],
    correct: 'LAeq over the hour, with its start and stop',
    explain: 'The energy average over the stated interval is LAeq; it needs its start, stop, weighting and conditions beside it.',
    why: {
      'LAFmax over the hour, the loudest moment': 'The loudest fast level is one event, not the hour’s energy.',
      'The single meter reading taken at the half-hour mark': 'One moment’s reading is not an average of anything.',
    },
  },
  {
    id: 'sl.mic.2',
    page: 'microphone',
    prompt: 'A colleague writes the loudest fast reading in the “peak” column. What do you say?',
    options: ['A fast maximum is not a true peak', 'A fast maximum is a peak in C-weighting', 'A maximum of either kind may be called a peak'],
    correct: 'A fast maximum is not a true peak',
    explain: 'LAFmax is the largest fast-time-weighted level; a peak is the meter’s peak detector under the weighting the method names. Never relabel one as the other.',
    why: {
      'A fast maximum is a peak in C-weighting': 'Changing the weighting does not change a time-weighted maximum into a peak.',
      'A maximum of either kind may be called a peak': 'Fast, slow and peak are different detectors: each is labelled as what it is.',
    },
  },
  {
    id: 'sl.mic.3',
    page: 'microphone',
    prompt: 'The recorder’s meter shows −12 dBFS. Can that go in the survey as a sound level?',
    options: ['Only once a calibrated chain ties it to SPL', 'It can, as −12 dB SPL, after a quick look at it', 'It can, as 82 dB SPL: 94 minus 12'],
    correct: 'Only once a calibrated chain ties it to SPL',
    explain: 'dBFS is relative to the recorder’s own maximum. Without a calibrated chain and its checks, it is not a sound pressure level.',
    why: {
      'It can, as −12 dB SPL, after a quick look at it': 'dBFS and dB SPL are different scales; a negative dBFS is not a negative SPL.',
      'It can, as 82 dB SPL: 94 minus 12': 'Nothing ties this recorder’s scale to 94 dB unless the chain was checked with a calibrator.',
    },
  },
  {
    id: 'sl.place.1',
    page: 'placement',
    prompt: 'The method names 1.5 m above the ground. Your tripod tops out at 1.3 m. What do you do?',
    options: ['Get a taller support, or log the height', 'Use 1.3 m and leave it off the sheet', 'Hold the meter up at 1.5 m by hand for the run'],
    correct: 'Get a taller support, or log the height',
    explain: 'Put the meter at the height the method specifies; if you cannot, record the actual height and say the result departs from the method.',
    why: {
      'Use 1.3 m and leave it off the sheet': 'An unlogged height cannot be repeated or checked, and it hides a departure from the method.',
      'Hold the meter up at 1.5 m by hand for the run': 'Your body beside the capsule reflects sound into it — use a stand.',
    },
  },
  {
    id: 'sl.place.2',
    page: 'placement',
    prompt: 'For a before-and-after study, where does the meter go the second time?',
    options: ['The same coordinates, height, aim and conditions', 'Wherever is quietest on the day of the second visit', 'A little closer to the road, for a clearer reading'],
    correct: 'The same coordinates, height, aim and conditions',
    explain: 'Return to the same coordinates, height, orientation and source state, and log the weather and any other sources that changed.',
    why: {
      'Wherever is quietest on the day of the second visit': 'A different spot changes the result before anything else does.',
      'A little closer to the road, for a clearer reading': 'Moving the meter changes the comparison you set out to make.',
    },
  },
  {
    id: 'sl.place.3',
    page: 'placement',
    prompt: 'Why does a site survey use more than one position?',
    options: ['One spot stands only for itself', 'Two meters are more accurate than one', 'The method needs a spare meter'],
    correct: 'One spot stands only for itself',
    explain: 'A broad survey samples several representative positions and explains why they stand for the area; a map shows the positions measured, not a continuous field between them.',
    why: {
      'Two meters are more accurate than one': 'Accuracy comes from the chain and the checks; more positions give coverage, not accuracy.',
      'The method needs a spare meter': 'A spare may help, but positions are about representing the area.',
    },
  },
  {
    id: 'sl.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Moving the meter from the open lawn to the wall: what changes in what it receives?',
    options: ['The facade’s reflection joins the direct sound', 'The road’s traffic stops reaching the meter at all', 'The air unit falls silent at the wall'],
    correct: 'The facade’s reflection joins the direct sound',
    explain: 'At the facade the reflection arrives almost with the direct sound: the most the wall can add. Name the position; never call it free field.',
    why: {
      'The road’s traffic stops reaching the meter at all': 'The wall faces the road: the traffic still arrives, now with its reflection.',
      'The air unit falls silent at the wall': 'The air unit runs as before; the meter is simply nearer it.',
    },
  },
  {
    id: 'sl.ctx.1',
    page: 'context',
    prompt: 'Total 62 dB with the source running, 56 dB with it stopped. What is the source alone?',
    options: ['About 60.7 dB, by energy subtraction', 'Exactly 6 dB, the total minus the background', 'About 59 dB: the total minus half the difference'],
    correct: 'About 60.7 dB, by energy subtraction',
    explain: 'The total holds both energies: 10·log10(10^6.2 − 10^5.6) ≈ 60.7 dB. Plain dB subtraction is not a level at all.',
    why: {
      'Exactly 6 dB, the total minus the background': 'dB values are logarithms: 62 − 56 is a difference, not the source’s level.',
      'About 59 dB: the total minus half the difference': 'There is no halving rule: the subtraction is in energy.',
    },
  },
  {
    id: 'sl.ctx.2',
    page: 'context',
    prompt: 'Gusts are buffeting the capsule even with the windscreen on. What do you do with those minutes?',
    options: ['Log them, and handle them by the method’s rule', 'Filter the lows out until the trace looks clean', 'Raise the source level so the wind matters less'],
    correct: 'Log them, and handle them by the method’s rule',
    explain: 'A windscreen reduces buffeting but does not make a windy interval valid. Note the wind, keep the raw record, and exclude by the method’s written rule — no arbitrary “wind correction”.',
    why: {
      'Filter the lows out until the trace looks clean': 'An arbitrary filter changes the measurement to get a cleaner-looking number.',
      'Raise the source level so the wind matters less': 'Never raise a level to make a meter respond: measure ordinary operation.',
    },
  },
  {
    id: 'sl.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · The air unit runs non-stop. Can L90 give you the traffic without it?',
    options: ['L90 cannot remove a source that never stops', 'L90 removes all of the steady sources from it', 'L90 removes the air unit, as it is the quieter one'],
    correct: 'L90 cannot remove a source that never stops',
    explain: 'L90 is a statistical descriptor: a steady source is in every second of it. If it cannot be stopped, report the limitation and use the approved method.',
    why: {
      'L90 removes all of the steady sources from it': 'L90 describes the quieter part of the time; a steady source is in all of it.',
      'L90 removes the air unit, as it is the quieter one': 'Quieter or not, a source that never stops is in every reading.',
    },
  },
  {
    id: 'sl.two.1',
    page: 'twoMic',
    prompt: 'Readings of 50 and 70 dB, each lasting half the time. What is the LAeq?',
    options: ['About 67 dB, averaged in energy', '60 dB, the average of 50 and 70', '120 dB, the two levels added'],
    correct: 'About 67 dB, averaged in energy',
    explain: 'LAeq averages the energy: 10·log10((10^5 + 10^7) / 2) ≈ 67 dB. The loud half dominates; the plain average of the dB under-reads it.',
    why: {
      '60 dB, the average of 50 and 70': 'That is the mean of the dB values, not of the energy.',
      '120 dB, the two levels added': 'Levels never add arithmetically — and an average is not a sum.',
    },
  },
  {
    id: 'sl.two.2',
    page: 'twoMic',
    prompt: 'Two meters, receivers A and B. What must they share?',
    options: ['A synchronized clock, each with its own records', 'One calibration check, done on meter A only, for both', 'One position on the sheet, to keep it short'],
    correct: 'A synchronized clock, each with its own records',
    explain: 'Synchronize time and record each meter’s calibration and position — so the same pass-by can be found in both histories.',
    why: {
      'One calibration check, done on meter A only, for both': 'Each meter is its own chain with its own checks.',
      'One position on the sheet, to keep it short': 'Two meters are two positions: each is logged.',
    },
  },
  {
    id: 'sl.two.3',
    page: 'twoMic',
    prompt: 'A truck’s pass-by makes the hour’s LAeq look high. What may you do?',
    options: ['Keep it, unless your rule set before excludes it', 'Delete it, since it is not typical of the hour', 'Average it down with a quieter hour from another day'],
    correct: 'Keep it, unless your rule set before excludes it',
    explain: 'Decide before collecting which events are part of the question; keep the original history and a written reason for any exclusion. A truck may be the very thing a traffic study measures.',
    why: {
      'Delete it, since it is not typical of the hour': 'Deleting a loud event after seeing the result is exactly what not to do.',
      'Average it down with a quieter hour from another day': 'Mixing windows hides what happened in this one.',
    },
  },
  {
    id: 'sl.prac.gain',
    page: 'practice',
    prompt: 'Before the survey, what do you check on the meter?',
    options: ['Its check before, settings, and its range', 'That it reads 94 dB at the site, unprompted', 'That it shows the loudest number it can'],
    correct: 'Its check before, settings, and its range',
    explain: 'A compatible field check before (and after), the weighting and averaging set before capture, and a range that fits the quietest and loudest levels.',
    why: {
      'That it reads 94 dB at the site, unprompted': '94 dB is the calibrator’s level in its coupler, not a reading for the site.',
      'That it shows the loudest number it can': 'The range must fit the site, not push to the top.',
    },
  },
  {
    id: 'sl.prac.3',
    page: 'practice',
    prompt: 'One afternoon’s LAeq at one spot. What can it support?',
    options: ['A statement about that spot, that afternoon', 'A finding that the whole street breaks the law', 'A health conclusion for everyone nearby'],
    correct: 'A statement about that spot, that afternoon',
    explain: 'A single measurement does not establish a health, nuisance or legal conclusion. Formal decisions need a qualified practitioner and the applicable method.',
    why: {
      'A finding that the whole street breaks the law': 'A legal claim needs the applicable method, its positions and its limits — not one afternoon.',
      'A health conclusion for everyone nearby': 'Health and exposure need far more than one area reading.',
    },
  },
  {
    id: 'sl.mix.1',
    page: 'practice',
    prompt: 'A reading taken at the facade is labelled “free field”. What is wrong?',
    options: ['A facade reading includes the wall’s reflection', 'A facade reading is too low to count at all', 'Nothing is wrong, if the windscreen was on'],
    correct: 'A facade reading includes the wall’s reflection',
    explain: 'Reflections are part of what a meter at a wall receives: name it a facade position and use the method’s correction if it has one.',
    why: {
      'A facade reading is too low to count at all': 'It is usually a little higher, not too low — and it counts, as what it is.',
      'Nothing is wrong, if the windscreen was on': 'A windscreen does nothing about the wall’s reflection.',
    },
  },
  {
    id: 'sl.mix.2',
    page: 'practice',
    prompt: 'Five minutes of readings to describe a whole day. What is the problem?',
    options: ['A short window cannot speak for a day', 'Five minutes is too long for one meter', 'The meter’s battery cannot last the day'],
    correct: 'A short window cannot speak for a day',
    explain: 'A few minutes may scout a site; the window must hold the variation the question is about — traffic cycles, shifts, quiet periods.',
    why: {
      'Five minutes is too long for one meter': 'Meters run for hours; the problem is too little time, not too much.',
      'The meter’s battery cannot last the day': 'Power can be managed; a short window still cannot describe a day.',
    },
  },
  {
    id: 'sl.mix.3',
    page: 'practice',
    prompt: 'Which entry on the sheet is complete?',
    options: ['“LAeq 58.2 dB, 14:00–15:00, receiver A, 1.5 m”', '“58 dB, in the afternoon, somewhere near the road”', '“About 58 dB, which seemed normal for the street”'],
    correct: '“LAeq 58.2 dB, 14:00–15:00, receiver A, 1.5 m”',
    explain: 'The descriptor, the window, the position and the height — the meter’s own label, not a bare “dB”.',
    why: {
      '“58 dB, in the afternoon, somewhere near the road”': 'No descriptor, no window, no position: nobody could repeat it.',
      '“About 58 dB, which seemed normal for the street”': 'An impression is not a result — the descriptor and the conditions make it one.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'sl.sym.1',
    observation: 'Low, rumbling bursts appear in the history on a breezy afternoon',
    firstChecks: 'Wind on the capsule, the windscreen, the wind log',
    options: ['Wind buffeting at the capsule', 'A fault in the meter’s weighting', 'Traffic that only passes in the wind'],
    correct: 'Wind buffeting at the capsule',
    explain: 'Gusts make false low-frequency readings even through a windscreen. Note the wind and handle those intervals by the method’s rule.',
    why: {
      'A fault in the meter’s weighting': 'A weighting fault would not come and go with the gusts.',
      'Traffic that only passes in the wind': 'The bursts follow the wind, not the road.',
    },
  },
  {
    id: 'sl.sym.2',
    observation: 'Receiver B reads a few dB above receiver A for the same pass-by',
    firstChecks: 'The facade’s reflection; the positions’ geometry',
    options: ['The facade’s reflection at B', 'Meter B’s calibration, wrong for sure', 'The air unit, louder at A than B'],
    correct: 'The facade’s reflection at B',
    explain: 'B sits 2 m from a hard facade facing the road: its reflection adds energy. Check each meter’s check log too — but the geometry explains it first.',
    why: {
      'Meter B’s calibration, wrong for sure': 'Check the logs, but a facade position is expected to read higher.',
      'The air unit, louder at A than B': 'The air unit is nearer B, not A.',
    },
  },
  {
    id: 'sl.sym.3',
    observation: 'The level history has an hour that looks too quiet',
    firstChecks: 'The event log, the source state, the meter’s status',
    options: ['The event log and the source’s state', 'Delete the hour from the history as an outlier', 'Average it with the hour before'],
    correct: 'The event log and the source’s state',
    explain: 'Was the road closed, the unit off, the meter paused? Keep the original history; explain it from the log.',
    why: {
      'Delete the hour from the history as an outlier': 'Never delete data after seeing it; explain it, and exclude only by a written rule.',
      'Average it with the hour before': 'Mixing windows hides what happened.',
    },
  },
  {
    id: 'sl.sym.4',
    observation: 'The after-run check reads 1 dB away from the before check',
    firstChecks: 'Log the unadjusted value; apply the method’s rule',
    options: ['Log it unadjusted; follow the method’s rule', 'Adjust the data by 1 dB and call it valid', 'Repeat the check until the two readings agree'],
    correct: 'Log it unadjusted; follow the method’s rule',
    explain: 'Preserve the unadjusted post-check value; if drift exceeds the method’s tolerance, investigate and flag — never overwrite a failed check.',
    why: {
      'Adjust the data by 1 dB and call it valid': 'That forces the result instead of investigating it.',
      'Repeat the check until the two readings agree': 'The first unadjusted value is the record.',
    },
  },
  {
    id: 'sl.sym.5',
    observation: 'The source cannot be switched off, and total and background read 2 dB apart',
    firstChecks: 'The method’s limit; report the limitation',
    options: ['Report it as not separable by the method', 'Subtract 2 dB and report what is left', 'Use L90 as the background level and carry on'],
    correct: 'Report it as not separable by the method',
    explain: 'Inside the method’s limit the subtraction is refused: report that the source could not be separated, and use the approved method if one exists.',
    why: {
      'Subtract 2 dB and report what is left': 'dB do not subtract — and this close, even the energy subtraction is refused.',
      'Use L90 as the background level and carry on': 'L90 does not remove a source that never stops.',
    },
  },
  {
    id: 'sl.sym.6',
    observation: 'A passer-by trips over the tripod’s cable',
    firstChecks: 'Re-route and secure the cable; move the position if needed',
    options: ['Secure and re-route the cable, out of paths', 'Tape it more tightly across the footpath', 'Ask people walking past to step round it'],
    correct: 'Secure and re-route the cable, out of paths',
    explain: 'Secure the cable and the stand without creating a public hazard; choose a position that keeps both out of the public’s way.',
    why: {
      'Tape it more tightly across the footpath': 'A cable across a footpath is still a hazard.',
      'Ask people walking past to step round it': 'The hazard is yours to remove, not theirs to avoid.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'sl.prac.order',
    page: 'practice',
    prompt: 'A survey at one receiver, start to finish: put the steps in order.',
    steps: [
      { text: 'Name the question, the descriptor and the window', early: 'The question comes before any equipment.' },
      { text: 'Choose safe, authorized positions; sketch the site', early: 'Positions follow from the question.' },
      { text: 'Check the meter before; fit the windscreen', early: 'Check the meter once you know where it goes.' },
      { text: 'Set the height and aim; you stand back', early: 'Place the meter once it has been checked.' },
      { text: 'Run the window; log events and weather', early: 'Record once the meter is in place.' },
      { text: 'Check after, unadjusted; label the result', early: 'The after check closes the run.' },
    ],
    explain: 'Question, positions, check, placement, the window with its log, check again — then a conclusion no bigger than the evidence.',
  },
];

const R = (id: string, label: string, role: SetupReason['role'], feedback: string): SetupReason => ({ id, label, role, feedback });
const setupTasks: SetupTask[] = [
  {
    id: 'sl.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · How loud is the road traffic at this house’s front, over the evening peak hour?',
    setups: [
      { id: 'facade', label: 'A meter 2 m from the facade, at the method’s height, for the whole hour', ok: true, power: 'none', feedback: 'A facade position named as such, over the whole hour: it answers the question about this house’s front.' },
      { id: 'pair', label: 'Two synchronized meters: one in the open, one at the facade', ok: true, power: 'none', feedback: 'Two positions, one clock: the open and the facade, each named — more than the brief needs, and honest.' },
      { id: 'spot', label: 'One meter in the road’s verge for five minutes', ok: false, power: 'none', feedback: 'Too close to traffic to be safe, and five minutes cannot stand for the peak hour.' },
    ],
    reasons: [
      R('hour', 'The window covers the whole peak hour', 'required', 'The question names the hour.'),
      R('named', 'The position is named — facade or open', 'required', 'A facade reading is never called free field.'),
      R('height', 'The method’s height, written down', 'optional', 'It lets anyone repeat it.'),
      R('verge', 'Closer to the traffic gives the truest number', 'wrong', 'Closer changes the question — and the verge is not a safe position.'),
    ],
    explain: 'More than one setup passes: the window and the named position are what the brief needs.',
  },
  {
    id: 'sl.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · Does the neighbour’s new air unit add to the night-time level at the bedroom window?',
    setups: [
      { id: 'onoff', label: 'Unit running and stopped, same position at the window, same window length', ok: true, power: 'none', feedback: 'Total and background at the same position: subtract in energy, or report that they could not be separated.' },
      { id: 'onoffpair', label: 'The same, plus a second meter in the open as a reference', ok: true, power: 'none', feedback: 'A reference position helps show what else changed during the night.' },
      { id: 'midday', label: 'One reading at midday with the unit running', ok: false, power: 'none', feedback: 'The question is about the night, and without the unit stopped nothing separates it from the rest.' },
    ],
    reasons: [
      R('bg', 'A background window with the unit stopped', 'required', 'Without it the unit cannot be separated.'),
      R('energy', 'Subtraction in energy, refused if too close', 'required', 'Never dB minus dB.'),
      R('night', 'Windows at night, when the question is', 'optional', 'The question names the night.'),
      R('dbminus', 'Subtract the two dB readings to get the unit', 'wrong', 'dB are logarithms: plain subtraction is not a level.'),
    ],
    explain: 'Either setup passes when the unit is measured running and stopped at the same position and the subtraction is honest.',
  },
];

const predictions: Partial<Record<SourcePageId, Prediction>> = {
  microphone: { prompt: 'The brief asks for the loudest truck pass-by. Which reading answers it?', options: ['The hour’s LAeq', 'LAFmax in the window', 'The peak'], after: 'Set the meter for each question and see what passes.' },
  placement: { prompt: 'You move the meter from the open lawn to 2 m from the facade. Will it read the same traffic?', options: ['Same traffic, plus the reflection', 'Exactly the same', 'Less — the house shields it'], after: 'Move it and read what each zone stands for.' },
  context: { prompt: 'Total 62 dB, background 56 dB. The source alone is…', options: ['6 dB', 'about 60.7 dB', '59 dB'], after: 'Try it with the meters — and then bring the two closer.' },
  twoMic: { prompt: 'Is the plain mean of the dB readings the same as LAeq?', options: ['Yes', 'No — LAeq is higher', 'No — LAeq is lower'], after: 'Look at the two lines on the history.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'sl.q.1',
    covers: 'setting',
    critical: true,
    prompt: 'How far must a raised mast stay from an overhead power line?',
    options: ['At least 3 m (10 ft)', 'About 1 m away from it', 'Just far enough not to touch'],
    correct: 'At least 3 m (10 ft)',
    explain: 'At least 3 m (10 ft), farther if unsure; if you cannot be sure, do not raise it.',
    why: { 'About 1 m away from it': 'Far too close: keep at least 3 m (10 ft).', 'Just far enough not to touch': 'Not touching is not enough: keep at least 3 m (10 ft).' },
  },
  {
    id: 'sl.q.2',
    covers: 'setting',
    critical: true,
    prompt: 'Thunder is heard. When may you go back out?',
    options: ['30 min after the last lightning or thunder', 'Once the rain has stopped falling on the site', 'As soon as the sky looks brighter'],
    correct: '30 min after the last lightning or thunder',
    explain: 'Get inside a safe place immediately; wait 30 minutes after the last lightning or thunder.',
    why: { 'Once the rain has stopped falling on the site': 'Lightning can strike well after the rain: wait 30 minutes.', 'As soon as the sky looks brighter': 'A brighter sky is not the signal: wait 30 minutes after the last lightning or thunder.' },
  },
  {
    id: 'sl.q.3',
    covers: 'sound',
    prompt: 'What does a reading 2 m from a facade include?',
    options: ['The facade’s reflection too', 'The direct traffic only, nothing else', 'Only the sound from inside'],
    correct: 'The facade’s reflection too',
    explain: 'The wall reflects the traffic back toward the meter: name it a facade position.',
    why: { 'The direct traffic only, nothing else': 'No meter filters out a reflection.', 'Only the sound from inside': 'The facade adds a reflection of the outside sound.' },
  },
  {
    id: 'sl.q.4',
    covers: 'sound',
    prompt: 'An area meter on the lawn stands for what?',
    options: ['Its spot, at that time', 'A worker’s daily exposure', 'The whole street, all day'],
    correct: 'Its spot, at that time',
    explain: 'An area reading represents its position and time; exposure is measured on the person.',
    why: { 'A worker’s daily exposure': 'That needs personal sampling.', 'The whole street, all day': 'One spot and one window cannot speak for all of that.' },
  },
  {
    id: 'sl.q.5',
    covers: 'setting',
    prompt: 'What is written down before the meter starts?',
    options: ['The descriptor and window', 'The expected loudest level', 'The battery’s charge level'],
    correct: 'The descriptor and window',
    explain: 'Choose the descriptor and window before capture, not after seeing the numbers.',
    why: { 'The expected loudest level': 'Useful for range, but not the question.', 'The battery’s charge level': 'Worth checking, but not the question.' },
  },
  {
    id: 'sl.q.6',
    covers: 'sound',
    prompt: 'At receiver A, which arrives first?',
    options: ['The car’s direct sound', 'Its reflection off the ground', 'Its reflection off the house'],
    correct: 'The car’s direct sound',
    explain: 'The straight path is the shortest; every reflection travels farther.',
    why: { 'Its reflection off the ground': 'A reflection always travels farther than the straight path.', 'Its reflection off the house': 'A reflection always travels farther — and A is not reached by the facade’s here.' },
  },
];

export const F12_LESSON: Lesson = {
  id: 'F12',
  labId: 'field',
  title: 'Sound Level and Environmental Noise',
  subtitle: 'A named question and window, the method’s height, an open or facade position — and a conclusion no bigger than the evidence',
  noun: { one: 'sound level meter', many: 'sound level meters', subject: 'survey site' },
  model: F12_MODEL,
  micTypeIds: ['slm'],
  zones: F12_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  setupPairs: [{ label: 'Two receivers: A in the open + B at the facade', A: { zone: 'sl.open' }, B: { zone: 'sl.facade' }, line: 'Two meters on one clock: the open spot and the facade, each named — each with its own check and its own record.' }],
  orient: [
    { title: 'WHAT IT IS', text: 'A sound-level survey: a complete sound level meter — capsule, preamp, weighting, averaging and display in one instrument — on a tripod, with a windscreen outdoors, at positions chosen for a named question.', src: 'F12-LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'A neighbourhood baseline, a traffic study, a venue’s boundary check, a machine next door. A worker’s daily exposure is different again: it is measured on the person, not at a spot.', src: 'OSHA-G' },
    { title: 'WHAT IT DOES', text: 'It reports a DESCRIPTOR over a WINDOW — an energy average, the loudest fast level, the levels exceeded part of the time, a peak — at one position. What it stands for is that spot, at that time.', src: 'F12-LESSON' },
    { title: 'ITS SIZE', text: 'This lab draws a handheld meter on a tripod, its capsule 1.5 m (5 ft) above the ground — the height one highway method names — at a house by a road, with a lawn, an air unit and a power line. The site is a drawing; your question names the real receivers.', src: 'FHWA-FG' },
  ],
  sound: {
    stages: [
      { title: 'The direct sound', text: 'The traffic’s straight path to the meter: the first to arrive.' },
      { title: 'The ground', text: 'A reflection off the ground, a little later.' },
      { title: 'The facade', text: 'Near the house, the facade’s reflection too.' },
    ],
    attack: 'The direct sound arrives first: the shortest path.',
    body: 'Reflections follow: off the ground at every position, off the facade near the house.',
    head: { diameterMm: 12.7, rods: 0, label: 'the meter’s capsule', strikeSrc: 'FHWA-FG' },
  },
  setting: {
    items: [
      { id: 'road', label: 'the road and its traffic', short: 'THE ROAD', note: 'The source of this survey — and a hazard. Every position is on the property side, reached safely; nobody stands in the road.', prov: { kind: 'sourced', src: 'F12-LESSON', quote: 'Choose accessible, authorized positions away from roads (L41)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'facade', label: 'the facade', short: 'FACADE', note: 'A hard wall reflects the traffic into a meter near it: name a facade position as one.', prov: { kind: 'sourced', src: 'FHWA-FG', quote: 'building positions: 6.6 ft from the facade midpoint' }, tag: 'REFLECTIONS', scene: 'all' },
      { id: 'power', label: 'the overhead power line', short: 'POWER LINE', note: 'Keep any pole, mast or stand at least 3 m (10 ft) away — farther if unsure.', prov: { kind: 'sourced', src: 'OSHA-ELEC', quote: 'Stay at least 10 feet away from overhead power lines.' }, tag: 'KEEP 3 M', scene: 'all' },
      { id: 'unit', label: 'the air unit', short: 'AIR UNIT', note: 'Background for a traffic survey; the source for a question about the unit.', prov: { kind: 'illustrative', reason: 'a typical second source on a site' }, tag: 'BACKGROUND', scene: 'all' },
      { id: 'venue', label: 'a venue’s audience (a spot check)', short: 'AUDIENCE', note: 'A real-time spot check at audience positions is not a crew member’s exposure assessment. Keep meters clear of audience routes, rigging and sightlines, and never feed a measurement mic to the PA.', prov: { kind: 'sourced', src: 'F12-LESSON', quote: 'distinguish a real-time spot check at audience positions from an occupational exposure assessment (L39)' }, tag: 'SPOT CHECK', scene: 'stage' },
      { id: 'indoor', label: 'a room with the unit inside', short: 'INDOORS', note: 'An indoor position in one method: at least 1.5 m (5 ft) above the floor and 0.9 m (3 ft) from any wall.', prov: { kind: 'sourced', src: 'FHWA-FG', quote: 'interior mics ≥ 5 ft above floor and 3 ft from any wall' }, tag: 'ONE METHOD', scene: 'studio' },
    ],
    stage: 'AT A VENUE: a spot check at audience positions, the venue’s own terms for its limit (location, descriptor, averaging period), meters clear of routes and rigging — and a measurement mic never fed to the PA.',
    studio: 'INDOORS: one method puts an indoor mic at least 1.5 m (5 ft) above the floor and 0.9 m (3 ft) from any wall; hold the source’s operating mode steady and repeat a baseline.',
  },
  diagnostic,
  practice: {
    task: 'Choose positions and windows for two briefs, and say what one reading can and cannot claim. With permission on a real site and every position safe to reach, you can log what you did below.',
    fields: FIELD_SHEET,
  },
  unknowns: [
    { text: 'The site — the house, the lawn, the road, the air unit, the power line’s position and height — is a drawing default; only the 1.5 m height, the 2 m facade position and the 3 m power-line keep-out are sourced.', dims: [] },
    { text: '“Close to but not touching” the facade: drawn 6–30 cm.', dims: [] },
    { text: 'The open position’s distance from the road (3–4.5 m) is a drawing default: the question names the receiver.', dims: [] },
    { text: 'The meter’s size, its class and its orientation rule are not in the lesson; it is drawn as a free-field meter aimed as its data says.', dims: [] },
    { text: 'The level histories are made-up examples; the background limit (3 dB) is this lab’s default, labelled “your method sets this”.', dims: [] },
  ],
  live: { wedges: [] },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules: your question and the method you are handed name the receivers, the height, the descriptor and the limits. Experiment, and trust your ears and the room as well as the meter. The lab is silent and draws a simplified picture: a site that is a drawing, straight sound paths, level histories that are made-up examples, and this lab’s default background limit. Formal exposure, environmental or legal decisions need a qualified practitioner and the applicable method.',
  copy: F12_COPY,
};
