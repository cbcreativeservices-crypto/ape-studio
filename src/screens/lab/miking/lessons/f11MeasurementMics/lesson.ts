/**
 * F11 MEASUREMENT MICROPHONES AND CALIBRATION — the lesson as DATA (Miking
 * Lab 6: Foley, Field & Scientific; Lab 6 group 4, branch lab6-g4). Words
 * from the owner's lesson (docs/labs/miking/source_text/F11-Measurement-
 * Microphones-and-Calibration-Miking-Technique.txt; "L<n>" in comments
 * only); research in docs/labs/miking/measurement_mics/ (SOURCES.md,
 * GEOMETRY_PROPOSAL.md); corrections in CORRECTIONS_LOG.md ("Lab 6 · group 4").
 *
 * Owner rulings: suggested starting points, never dogma; no source, brand,
 * model or standard number on screen (D-6B-3: "the method you were given");
 * safety exact in plain words (the calibrator never at an ear; no pinout
 * experiments; never feed a measurement mic to the PA; never raise a level
 * to make a meter respond); FULLY SILENT. The measurement lessons' own
 * non-placement page — the CHAIN RACK (D-6B-1) — sits inside MICROPHONES.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, Prediction, SetupReason, SetupTask, SourcePageId, Symptom } from '../../engine/model/types.ts';
import { MEASURE_SHEET } from '../shared/measure/logSheet.ts';
import { F11_MODEL } from './geometry.ts';
import { F11_ZONES } from './model.ts';
import { F11_COPY } from './copy.ts';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the measurement mic',
    goal: 'Meet a measurement microphone and its bench — the capsule under its grid, the preamp, the source under test, and you — before any number.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A measurement mic is a chain, not a capsule: capsule, preamp, power, input and its own record. And the question comes before the hardware.',
  },
  sound: {
    title: 'How sound meets the capsule',
    goal: 'See the three fields a measurement mic can be made for — sound from one direction, the pressure in a sealed coupler, sound from every side — and why the difference matters most in the highs.',
    credit: { scenarios: ['mm.snd.1', 'mm.snd.2', 'mm.snd.3'], note: 'Answer the three checks on the sound field.' },
    takeaway: 'Free field, pressure and random incidence are three different fields. “Omni” is a polar pattern, not a field response — match the mic’s response, and its aim, to the field the method assumes.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Settle the question, the power path and the calibrator’s safety before anything is plugged in.',
    credit: { scenarios: ['mm.set.1', 'mm.set.2', 'mm.set.3'], note: 'Answer the three checks.' },
    takeaway: 'Write the question first. Use the exact power path the maker approves, never an improvised pinout. The calibrator goes on a capsule, never to an ear.',
  },
  microphone: {
    title: 'Build the chain',
    goal: 'Build a measurement chain link by link — capsule, power, input, its own record — see a wrong join refused and why, and match the mic’s field response to the task.',
    credit: { scenarios: ['mm.mic.1', 'mm.mic.2', 'mm.mic.3', 'mm.rec.1'], interactive: 'chainBuilt', note: 'Build a chain that passes its question in BUILD THE CHAIN, and answer the four checks (one reaches back to the sound field).' },
    takeaway: 'The power path follows the capsule: a polarization supply for an externally polarized capsule, a constant-current input for a prepolarized one, phantom only through the approved unit. A dBFS number is not a sound level, and a sensitivity belongs to its own chain.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and move the measurement mic yourself — on the axis, farther back, off the axis, out in the room — and see what each position can and cannot stand for.',
    credit: { scenarios: ['mm.place.1', 'mm.place.2', 'mm.place.3', 'mm.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of everything, in two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Put the mic where the method defines, not where it is convenient — and write down its reference point, height, distance, angle and grid. Change one thing at a time; return to the first spot to check it repeats.',
  },
  context: {
    title: 'Keep back',
    goal: 'See why you keep back from the capsule: your body reflects sound into it — and why a measurement mic never feeds the PA.',
    credit: { scenarios: ['mm.ctx.1', 'mm.ctx.2', 'mm.rec.3'], interactive: 'keepAway', note: 'Move yourself from inside the keep-away ring to outside it, and answer the three checks.' },
    takeaway: 'A person near the capsule is part of the field being measured. Stand back as the method asks, monitor from a safe place, and route the measurement mic to the analyzer only.',
  },
  twoMic: {
    title: 'The field check',
    goal: 'Run the calibrator check before and after: seat it properly, read the level it states, read the after value unadjusted, and decide from the method’s tolerance — then keep two channels’ records apart.',
    credit: { scenarios: ['mm.two.1', 'mm.two.2', 'mm.two.3'], interactive: 'calCheck', note: 'Complete one check, before and after, in THE FIELD CHECK, and answer the three checks.' },
    takeaway: 'A field check before and after, the after value read unadjusted; drift outside the method’s tolerance marks the run for investigation, never a forced display. One frequency checks the chain near that frequency — not the whole response.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the chain before the system: the seat, the adapter, the battery, the field and the incidence — and never claim a calibration pass from a software trace alone.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a measurement setup in order, choose and justify a chain for two briefs, and say when a result may be called calibrated.',
    credit: { scenarios: ['mm.prac.order', 'mm.prac.gain', 'mm.prac.setup1', 'mm.prac.setup2', 'mm.prac.3', 'mm.mix.1', 'mm.mix.2', 'mm.mix.3'], note: 'Put the setup in order, answer the headroom check, complete both briefs, and answer the four reasoning cards. The measurement sheet is optional.' },
    takeaway: 'Match the response and its aim to the field, the power path to the capsule, and the claim to the evidence: a relative comparison is honest and useful; a calibrated level needs every link.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L5, L11–L24 · set L5–L6, L26, L40 · mic L13, L24, L26–L28 ·
 * place L35–L37 · ctx L35–L36, L40 · two L29–L33, L37 · prac L41–L48. */
const scenarios: MikingScenario[] = [
  {
    id: 'mm.snd.1',
    page: 'sound',
    prompt: 'Where does the field a measurement mic is made for matter most?',
    options: ['In the highs, where the capsule is near a wavelength in size', 'In the lows, where the wavelengths run to many metres in length', 'Only at 1 kHz, where the calibrator makes its tone'],
    correct: 'In the highs, where the capsule is near a wavelength in size',
    explain: 'At 10 kHz a wavelength is about 3.4 cm — not much larger than a 1/2 in capsule — so the capsule itself disturbs the field and the direction sound comes from changes the reading. In the lows the capsule is tiny against the wavelength.',
    why: {
      'In the lows, where the wavelengths run to many metres in length': 'Long waves pass a small capsule as if it were not there: the three responses differ little in the lows.',
      'Only at 1 kHz, where the calibrator makes its tone': 'The calibrator’s tone is a check of the chain, not where the fields differ most — that is the highs.',
    },
  },
  {
    id: 'mm.snd.2',
    page: 'sound',
    prompt: 'Your mic is described as omnidirectional. What does that tell you about its field response?',
    options: ['Nothing on its own — omni is a polar pattern, not a field', 'That it is a pressure mic, made for the calibrator’s coupler', 'That it reads the same in a free field and a diffuse one'],
    correct: 'Nothing on its own — omni is a polar pattern, not a field',
    explain: '“Omnidirectional” describes the polar pattern. The field response — free field, pressure or random incidence — is a separate property: read it in the mic’s data.',
    why: {
      'That it is a pressure mic, made for the calibrator’s coupler': 'Free-field and random-incidence mics are omni too. The pattern does not name the field.',
      'That it reads the same in a free field and a diffuse one': 'In the highs it does not: that difference is exactly why the field response is named.',
    },
  },
  {
    id: 'mm.snd.3',
    page: 'sound',
    prompt: 'A small loudspeaker on a bench, the mic on its axis. Which field is this, near enough?',
    options: ['A free field: sound arriving mostly from one direction', 'A pressure field, like the inside of a coupler', 'A diffuse field, with sound arriving from all round the room'],
    correct: 'A free field: sound arriving mostly from one direction',
    explain: 'One source, one direction: near enough a free field — though the room’s reflections make any real field less than ideal.',
    why: {
      'A pressure field, like the inside of a coupler': 'A pressure field is the sealed cavity of a coupler or a flush boundary — not a mic out in front of a loudspeaker.',
      'A diffuse field, with sound arriving from all round the room': 'Close on the axis the direct sound dominates; a diffuse field is a reverberant room, far from the source.',
    },
  },
  {
    id: 'mm.set.1',
    page: 'setting',
    prompt: 'What do you write down before choosing any hardware?',
    options: ['The question: what you are measuring, where, and why', 'The model number of the most accurate capsule you own', 'The highest level the calibrator can make at 1 kHz'],
    correct: 'The question: what you are measuring, where, and why',
    explain: 'A level at a stated position, a room’s decay, or a before-and-after comparison: the question decides the mic, its aim, its power and its calibration — and whether a named method is needed.',
    why: {
      'The model number of the most accurate capsule you own': 'The hardware follows the question. The “best” capsule for one field is the wrong one for another.',
      'The highest level the calibrator can make at 1 kHz': 'The calibrator checks the chain later; it does not tell you what to measure.',
    },
  },
  {
    id: 'mm.set.2',
    page: 'setting',
    prompt: 'The measurement mic’s preamp needs a power path you do not have. What do you do?',
    options: ['Get the exact adapter or unit the maker approves', 'Wire up a cable to feed it from phantom power', 'Try a different mic input and see whether it works'],
    correct: 'Get the exact adapter or unit the maker approves',
    explain: 'Use the exact manufacturer-approved adapter or conditioning unit. Do not experiment with pinouts or apply power to an unverified sensor — a wrong voltage can damage the capsule and the preamp.',
    why: {
      'Wire up a cable to feed it from phantom power': 'An improvised pinout can put the wrong voltage on the capsule or the preamp. Do not experiment with pinouts.',
      'Try a different mic input and see whether it works': 'Applying power to an unverified sensor is exactly the risk: use the path the maker approves.',
    },
  },
  {
    id: 'mm.set.3',
    page: 'setting',
    prompt: 'Where may a running field calibrator go?',
    options: ['Seated on the capsule, as the manuals direct', 'Held up to an ear, to hear that it is working', 'Pointed at the room, as a quick test tone'],
    correct: 'Seated on the capsule, as the manuals direct',
    explain: 'A 94 or 114 dB calibrator makes a high level inside its coupler. It goes on a capsule, never to a person’s ear, and it is not a sound effect.',
    why: {
      'Held up to an ear, to hear that it is working': 'Never: the level inside the coupler is high, right at the eardrum. Its light or display tells you it is running.',
      'Pointed at the room, as a quick test tone': 'It is not a test-tone source or a sound effect: it is made to seal over a capsule.',
    },
  },
  {
    id: 'mm.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A random-incidence mic is set up for a loudspeaker test on its axis. What is the risk?',
    options: ['Its highs read wrong without that field’s correction', 'Its lows vanish, because random incidence rejects the axis', 'Nothing at all: measurement mics read all fields alike'],
    correct: 'Its highs read wrong without that field’s correction',
    explain: 'The fields differ most in the highs. A mic made for one field can serve another only with the correction its data gives for that field.',
    why: {
      'Its lows vanish, because random incidence rejects the axis': 'Nothing is rejected: the difference is a high-frequency one, from the capsule’s size against the wavelength.',
      'Nothing at all: measurement mics read all fields alike': 'They differ in the highs — that is why the field response is part of the mic’s name.',
    },
  },
  {
    id: 'mm.mic.1',
    page: 'microphone',
    prompt: 'A prepolarized capsule on its constant-current preamp. Which power path?',
    options: ['A constant-current input, or the maker’s approved unit', 'A polarization supply, to be sure the capsule is charged', 'Plain 48 V phantom straight from the mixer input'],
    correct: 'A constant-current input, or the maker’s approved unit',
    explain: 'A prepolarized capsule carries its own charge; its preamp runs from a constant-current input — or from phantom only through the exact approved conditioning unit.',
    why: {
      'A polarization supply, to be sure the capsule is charged': 'A prepolarized capsule must not be given a polarization voltage: it is charged already.',
      'Plain 48 V phantom straight from the mixer input': 'Not automatically compatible: use the approved adapter or unit, never an improvised connection.',
    },
  },
  {
    id: 'mm.mic.2',
    page: 'microphone',
    prompt: 'The recorder shows −18 dBFS for a steady tone. What do you know about the sound level?',
    options: ['Nothing yet: dBFS is relative to the recorder’s maximum', 'It is 18 dB below the calibrator’s 94 dB, so it is 76 dB SPL', 'It is a quiet tone, about 18 dB SPL at the mic'],
    correct: 'Nothing yet: dBFS is relative to the recorder’s maximum',
    explain: 'dBFS is relative to the recorder’s own digital maximum. Only a known chain, checked with the calibrator, ties a dBFS number to a sound pressure level.',
    why: {
      'It is 18 dB below the calibrator’s 94 dB, so it is 76 dB SPL': 'Nothing has tied this recorder’s scale to the calibrator: without the check, the subtraction means nothing.',
      'It is a quiet tone, about 18 dB SPL at the mic': 'dBFS and dB SPL are different scales: the number on a recorder is not a pressure.',
    },
  },
  {
    id: 'mm.mic.3',
    page: 'microphone',
    prompt: 'Your second capsule looks just like the first. Can you use the first one’s sensitivity number?',
    options: ['Use its own record: each capsule has one', 'Use the first one’s: same model, same number', 'Use it if the serial numbers are close'],
    correct: 'Use its own record: each capsule has one',
    explain: 'A sensitivity belongs to one capsule, its chain and its calibration record. Copying it from a similar-looking unit makes the reading look calibrated when it is not.',
    why: {
      'Use the first one’s: same model, same number': 'Two capsules of one model differ: that is why each has its own record. Same model is not matched.',
      'Use it if the serial numbers are close': 'Close serial numbers are still two capsules with two records.',
    },
  },
  {
    id: 'mm.place.1',
    page: 'placement',
    prompt: 'You move the mic from 1 m to 2 m on the axis. What do you change next?',
    options: ['Nothing else: log the new distance and compare', 'The gain, so the reading matches the first one', 'The aim, to point at the room for the extra sound'],
    correct: 'Nothing else: log the new distance and compare',
    explain: 'One change at a time: only the distance moved, so the difference is the distance’s. Write it down, then return to the first spot to check it repeats.',
    why: {
      'The gain, so the reading matches the first one': 'Changing the gain hides the very difference you moved the mic to see — keep the settings fixed or log every change.',
      'The aim, to point at the room for the extra sound': 'Two changes at once: you could not tell which one changed the reading.',
    },
  },
  {
    id: 'mm.place.2',
    page: 'placement',
    prompt: 'A mic beside the mixing desk: what does its reading stand for?',
    options: ['Only for that spot, not the audience', 'For the room: the desk is where it is set', 'For the audience, if aimed at the stage'],
    correct: 'Only for that spot, not the audience',
    explain: 'A mixer position alone may not represent the audience, and a mic beside one loudspeaker may not represent the room. Measure at the places the question is about.',
    why: {
      'For the room: the desk is where it is set': 'Where the sound is set is not where everyone listens: one spot stands for one spot.',
      'For the audience, if aimed at the stage': 'Aim does not make one position stand for a whole audience.',
    },
  },
  {
    id: 'mm.place.3',
    page: 'placement',
    prompt: 'What goes on the sheet for every position you measure?',
    options: ['Reference point, height, distance, angle, grid', 'The reading only, since the drawing shows the rest', 'The time of day and the room’s temperature only'],
    correct: 'Reference point, height, distance, angle, grid',
    explain: 'A reproducible reference point, the height, the distance from the source and from boundaries, the orientation, the grid or windscreen — so a second pass can put the mic back exactly.',
    why: {
      'The reading only, since the drawing shows the rest': 'Without the geometry the reading cannot be repeated or compared.',
      'The time of day and the room’s temperature only': 'Conditions help, but the position itself is what lets anyone repeat it.',
    },
  },
  {
    id: 'mm.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · A position beside a reverberant wall, for a free-field reading. Why hesitate?',
    options: ['Its reflections make it far from a free field', 'The wall blocks the calibrator from seating', 'The wall makes the mic’s pattern turn cardioid'],
    correct: 'Its reflections make it far from a free field',
    explain: 'A free-field reading assumes sound mostly from one direction. A nearby wall sends a strong second arrival — the field is no longer what the mic and the method assume.',
    why: {
      'The wall blocks the calibrator from seating': 'The calibrator seats on the capsule wherever the mic is — the wall changes the sound field, not the check.',
      'The wall makes the mic’s pattern turn cardioid': 'The pattern is the mic’s own; the wall changes what arrives at it.',
    },
  },
  {
    id: 'mm.ctx.1',
    page: 'context',
    prompt: 'You stand 40 cm behind the capsule during a reading. What changes?',
    options: ['Your body reflects a late copy of the sound into it', 'Nothing: the capsule faces the loudspeaker, not you', 'Only the lows, which your body absorbs entirely'],
    correct: 'Your body reflects a late copy of the sound into it',
    explain: 'A person near the capsule is a reflecting surface: a copy of the sound arrives a little later and adds to the reading. The closer you stand, the stronger it is.',
    why: {
      'Nothing: the capsule faces the loudspeaker, not you': 'A measurement mic hears round itself: a reflection from behind still reaches it.',
      'Only the lows, which your body absorbs entirely': 'A body reflects and scatters the mids and highs most; the lows pass round it.',
    },
  },
  {
    id: 'mm.ctx.2',
    page: 'context',
    prompt: 'At a live show, the engineer asks to put your measurement mic through the PA to hear it. What do you say?',
    options: ['Keep it on the analyzer, away from the PA', 'Route it low, where the audience barely hears it', 'Route it, then mute it before the next reading'],
    correct: 'Keep it on the analyzer, away from the PA',
    explain: 'A measurement mic is routed to a recording or analyzer input, never returned to the PA — it would feed back, and it would change the very sound being measured.',
    why: {
      'Route it low, where the audience barely hears it': 'At any level it is in the loop it measures, and it can feed back.',
      'Route it, then mute it before the next reading': 'Even briefly, it changes what is being measured and risks feedback.',
    },
  },
  {
    id: 'mm.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Before a session, what do you agree with the venue?',
    options: ['Levels, timing, routes and who handles the rigging', 'Which brand of measurement mic they prefer', 'That the PA will be turned up to make readings clear'],
    correct: 'Levels, timing, routes and who handles the rigging',
    explain: 'Use modest levels, coordinate the timing, keep stands and cables out of routes, and let qualified people handle energized equipment and overhead mounts.',
    why: {
      'Which brand of measurement mic they prefer': 'The method decides the mic, not a brand preference.',
      'That the PA will be turned up to make readings clear': 'Never raise the level only to make a meter respond: use ordinary operation and protect hearing.',
    },
  },
  {
    id: 'mm.two.1',
    page: 'twoMic',
    prompt: 'After the session the check reads 0.8 dB high. The method allows ±0.5 dB. What do you do?',
    options: ['Log the unadjusted value and mark the run for investigation', 'Turn the gain down 0.8 dB, then log the check as passed', 'Repeat the check until one of the readings falls inside ±0.5 dB'],
    correct: 'Log the unadjusted value and mark the run for investigation',
    explain: 'Read the after value before any change, keep the data, and follow the method’s retest, flagging or invalidation rule. Forcing the display back hides the drift.',
    why: {
      'Turn the gain down 0.8 dB, then log the check as passed': 'That forces the display back and reports the data as valid — exactly what the after check is there to stop.',
      'Repeat the check until one of the readings falls inside ±0.5 dB': 'Re-reading until a number passes hides the drift; the first unadjusted value is the record.',
    },
  },
  {
    id: 'mm.two.2',
    page: 'twoMic',
    prompt: 'The calibrator check passed at 1 kHz. What has it shown?',
    options: ['The chain’s sensitivity near 1 kHz, in the coupler', 'The mic’s whole frequency response is in good order', 'The mic’s response off its axis is in order too'],
    correct: 'The chain’s sensitivity near 1 kHz, in the coupler',
    explain: 'One frequency checks the sensitivity chain near that frequency, under the coupler’s conditions — not the full bandwidth, the response off axis, or a damaged grid.',
    why: {
      'The mic’s whole frequency response is in good order': 'A single tone says nothing about the rest of the range — a damaged grid can hurt the highs and still pass at 1 kHz.',
      'The mic’s response off its axis is in order too': 'In the coupler there is no axis at all: off-axis response is untested.',
    },
  },
  {
    id: 'mm.two.3',
    page: 'twoMic',
    prompt: 'Two measurement mics of the same model, on two channels. What does each channel need?',
    options: ['Its own sensitivity, correction data and field check', 'Only the first channel’s check: the model is matched', 'A shared record, averaged across the two capsules'],
    correct: 'Its own sensitivity, correction data and field check',
    explain: 'Identify each channel with its own sensitivity, correction data and check. Do not assume a matched response because the capsules share a model name.',
    why: {
      'Only the first channel’s check: the model is matched': 'Same model is not matched: each capsule has its own record.',
      'A shared record, averaged across the two capsules': 'An average belongs to neither capsule: each channel keeps its own.',
    },
  },
  {
    id: 'mm.prac.gain',
    page: 'practice',
    prompt: 'Before the readings: what do you check about the input’s gain?',
    options: ['The quietest and loudest levels both fit, with headroom', 'That the meter reads exactly 94 dB without the calibrator', 'That the gain is as high as it goes, for the best detail'],
    correct: 'The quietest and loudest levels both fit, with headroom',
    explain: 'The capsule, preamp and input must handle the expected noise floor and peak without self-noise masking the quiet and without overload on the loud — then fix the gain and log it.',
    why: {
      'That the meter reads exactly 94 dB without the calibrator': '94 dB is the calibrator’s level, not a target for the room.',
      'That the gain is as high as it goes, for the best detail': 'Maximum gain risks overload on the peaks: the range has to fit both ends.',
    },
  },
  {
    id: 'mm.prac.3',
    page: 'practice',
    prompt: 'When may you call a reading a calibrated level?',
    options: ['When every link is known and both checks passed', 'When the trace on the screen looks smooth and stable', 'When the mic is a measurement mic from a good maker'],
    correct: 'When every link is known and both checks passed',
    explain: 'The whole chain identified and compatible, its own sensitivity, a field check before and after inside the method’s tolerance, and the method named. Otherwise it is a relative comparison — say so.',
    why: {
      'When the trace on the screen looks smooth and stable': 'A smooth trace is not a calibration: never claim a pass from a software trace alone.',
      'When the mic is a measurement mic from a good maker': 'A good mic is one link; the claim needs the whole chain and the checks.',
    },
  },
  {
    id: 'mm.mix.1',
    page: 'practice',
    prompt: 'Which of these is a relative result, honestly labelled?',
    options: ['“3 dB more at spot A after the panel moved — relative”', '“Spot A measured 87 dB SPL” with no check and no chain', '“Spot A is calibrated” because the mic is new'],
    correct: '“3 dB more at spot A after the panel moved — relative”',
    explain: 'A stable mic and fixed settings can compare a change at one spot. Saying it is relative is what makes it honest.',
    why: {
      '“Spot A measured 87 dB SPL” with no check and no chain': 'An absolute number needs a known chain and the checks; without them it overclaims.',
      '“Spot A is calibrated” because the mic is new': 'New is not calibrated: the chain and the field checks decide the label.',
    },
  },
  {
    id: 'mm.mix.2',
    page: 'practice',
    prompt: 'A trend in the highs changes when you rotate the capsule. What do you suspect first?',
    options: ['The incidence angle and the field’s correction', 'The loudspeaker’s tweeter is failing as you turn', 'The calibrator was seated loosely before the run'],
    correct: 'The incidence angle and the field’s correction',
    explain: 'Before “fixing” the sound system, examine the incidence angle and the free-field or random-incidence correction: the highs depend on how sound meets the capsule.',
    why: {
      'The loudspeaker’s tweeter is failing as you turn': 'The loudspeaker did not change when you turned the mic; the incidence did.',
      'The calibrator was seated loosely before the run': 'A loose seat shifts the whole level, not a trend that follows the capsule’s angle.',
    },
  },
  {
    id: 'mm.mix.3',
    page: 'practice',
    prompt: 'You keep the readings from a session where the post check failed. What happens to them?',
    options: ['Kept, flagged, investigated under the method’s rule', 'Deleted, so nobody uses the bad data by mistake', 'Corrected by the drift, then reported as valid'],
    correct: 'Kept, flagged, investigated under the method’s rule',
    explain: 'Preserve the original data and notes, flag the run and follow the method’s retest or invalidation rule — never overwrite a failed check and present the run as valid.',
    why: {
      'Deleted, so nobody uses the bad data by mistake': 'Deleting hides what happened: keep the originals and flag them.',
      'Corrected by the drift, then reported as valid': 'A guessed correction presented as valid is exactly what the after check prevents.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'mm.sym.1',
    observation: 'The calibrator reading wanders by a decibel or more',
    firstChecks: 'Seat, adapter, battery, background noise, cable, input, overload',
    options: ['The seat, the adapter and the battery first', 'The room’s reverberation and its decay time', 'The loudspeaker’s level and its processing'],
    correct: 'The seat, the adapter and the battery first',
    explain: 'A poor fit, a missing adapter, a low battery, background noise, the cable, the preamp input or an overload can all make an apparent error. The room is not in the coupler.',
    why: {
      'The room’s reverberation and its decay time': 'The coupler is sealed: the room barely reaches the capsule during the check.',
      'The loudspeaker’s level and its processing': 'The calibrator is the source here; the loudspeaker plays no part.',
    },
  },
  {
    id: 'mm.sym.2',
    observation: 'No stable reading at all from a 1/4 in capsule in the calibrator',
    firstChecks: 'The 1/4 in adapter, then the seat',
    options: ['Whether the 1/4 in adapter is fitted', 'Whether the room is quiet enough for the check', 'Whether the gain is high enough to show it'],
    correct: 'Whether the 1/4 in adapter is fitted',
    explain: 'A 1/4 in capsule needs the calibrator’s adapter: without it the coupler cannot seal and the level inside never settles.',
    why: {
      'Whether the room is quiet enough for the check': 'Background noise matters, but with no seal at all the cause is the fit.',
      'Whether the gain is high enough to show it': 'Raising gain cannot fix a coupler that does not seal.',
    },
  },
  {
    id: 'mm.sym.3',
    observation: 'The analyzer shows a smooth response, but the numbers jumped after a cable swap',
    firstChecks: 'The chain: which input, which correction file, which gain',
    options: ['The input, the correction file and the gain', 'The loudspeaker, which must have changed itself', 'The mic’s polar pattern, which varies by cable'],
    correct: 'The input, the correction file and the gain',
    explain: 'A cable swap can move the mic to another input with another gain or correction file. Keep the chain fixed or log every change.',
    why: {
      'The loudspeaker, which must have changed itself': 'Nothing touched the loudspeaker; the chain changed.',
      'The mic’s polar pattern, which varies by cable': 'The cable carries the signal; it does not change the pattern.',
    },
  },
  {
    id: 'mm.sym.4',
    observation: 'Readings change between repeats with nothing moved on purpose',
    firstChecks: 'People near the capsule, a chair moved, doors, HVAC',
    options: ['Who and what moved near the capsule', 'The calibrator’s stated level at 1 kHz', 'The mic’s serial number on the record'],
    correct: 'Who and what moved near the capsule',
    explain: 'A person standing closer, a moved chair, a door, the air handling — each changes the field. Log the room state and keep the operator back.',
    why: {
      'The calibrator’s stated level at 1 kHz': 'The calibrator states the same level each time; the field round the mic is what changed.',
      'The mic’s serial number on the record': 'The record does not drift between repeats; the field does.',
    },
  },
  {
    id: 'mm.sym.5',
    observation: 'The preamp shows no signal on a new mic input',
    firstChecks: 'The power path for this capsule — through the approved unit only',
    options: ['The power path the maker approves for it', 'A homemade cable to try phantom power', 'More gain on the input until it shows'],
    correct: 'The power path the maker approves for it',
    explain: 'The capsule may need a polarization supply or a constant-current input. Use the exact approved path; do not experiment with pinouts or apply power to an unverified sensor.',
    why: {
      'A homemade cable to try phantom power': 'An improvised pinout can damage the capsule and preamp: never experiment with pinouts.',
      'More gain on the input until it shows': 'No gain fixes a preamp with no power.',
    },
  },
  {
    id: 'mm.sym.6',
    observation: 'The highs read lower outdoors than on the bench with the same mic',
    firstChecks: 'The windscreen and its correction, the incidence',
    options: ['The windscreen, its correction and the aim', 'The calibrator, which reads lower in the cold', 'The loudspeaker’s tweeter, which fades outside'],
    correct: 'The windscreen, its correction and the aim',
    explain: 'A windscreen or an outdoor kit may need its own correction, and the incidence may have changed. Check the grid and windscreen state on the sheet.',
    why: {
      'The calibrator, which reads lower in the cold': 'The calibrator checks at one frequency; a highs trend points at the windscreen and the incidence.',
      'The loudspeaker’s tweeter, which fades outside': 'The source did not change; the mic’s outdoor setup did.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'mm.prac.order',
    page: 'practice',
    prompt: 'A measurement session, start to finish: put the steps in order.',
    steps: [
      { text: 'Write the question and the method', early: 'The question decides everything else — it comes first.' },
      { text: 'Build the chain from the approved parts and log it', early: 'Build the chain once you know what it must answer.' },
      { text: 'Field check before: seat the calibrator, log the reading', early: 'The check needs the complete chain, and it comes before any reading.' },
      { text: 'Mount the mic at the logged position; you stand back', early: 'Check the chain first, then put the mic in place.' },
      { text: 'Take the readings, one change at a time', early: 'Readings come once the mic is placed and checked.' },
      { text: 'Field check after, unadjusted, then label the result', early: 'The after check closes the session.' },
    ],
    explain: 'Question, chain, check, position, readings, check again — then the honest label: relative, or calibrated under the named method.',
  },
];

const R = (id: string, label: string, role: SetupReason['role'], feedback: string): SetupReason => ({ id, label, role, feedback });
const setupTasks: SetupTask[] = [
  {
    id: 'mm.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Compare a loudspeaker before and after its grille is replaced, at one spot on its axis. No calibrated chain is on hand today.',
    setups: [
      { id: 'ff', label: 'Free-field mic on the axis at a logged distance, fixed settings, labelled relative', ok: true, power: 'none', feedback: 'A stable mic, fixed settings and one logged spot: an honest relative comparison.' },
      { id: 'ri', label: 'Random-incidence mic at the same logged spot, fixed settings, labelled relative', ok: true, power: 'none', feedback: 'For a before-and-after at one spot the same mic, unchanged, is what counts — labelled relative.' },
      { id: 'spl', label: 'Any mic into the recorder, reported as dB SPL', ok: false, power: 'none', feedback: 'Without a calibrated chain the result cannot be reported as SPL.' },
    ],
    reasons: [
      R('same', 'The same mic, position and settings before and after', 'required', 'The comparison is only fair if nothing else changes.'),
      R('label', 'The result is labelled relative', 'required', 'No calibrated chain: the honest label is relative.'),
      R('log', 'The distance, height and aim are written down', 'optional', 'It lets anyone repeat it.'),
      R('smooth', 'The trace looks smooth, so it can be called SPL', 'wrong', 'A smooth trace is not a calibration.'),
    ],
    explain: 'More than one mic passes: what matters is the unchanged setup and the honest label.',
  },
  {
    id: 'mm.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A client needs the level, in dB SPL, at one stated position by a loudspeaker. A calibrated chain and a field calibrator are available.',
    setups: [
      { id: 'chain', label: 'Calibrated free-field chain, field check before and after, method named', ok: true, power: 'phantom', feedback: 'Every link known, both checks, the method named: a level the client can rely on.' },
      { id: 'chain2', label: 'Calibrated 1/4 in chain with its calibrator adapter, checks before and after', ok: true, power: 'phantom', feedback: 'A 1/4 in chain works too — with the calibrator’s adapter for the checks.' },
      { id: 'phone', label: 'The recorder’s meter, with a note that it looked about right', ok: false, power: 'none', feedback: 'dBFS is not SPL; a claim someone relies on needs a calibrated chain and the checks.' },
    ],
    reasons: [
      R('checks', 'A field check before and after, the after value unadjusted', 'required', 'Both checks bracket the readings.'),
      R('own', 'The chain’s own sensitivity record', 'required', 'A sensitivity belongs to its own chain.'),
      R('method', 'The method is named, with its tolerance', 'optional', 'The method sets the tolerance and the positions.'),
      R('copy', 'A sensitivity copied from a similar mic', 'wrong', 'Never copy a sensitivity from a look-alike.'),
    ],
    explain: 'Either calibrated chain passes when every link is known and both checks are logged.',
  },
];

const predictions: Partial<Record<SourcePageId, Prediction>> = {
  microphone: { prompt: 'A prepolarized measurement mic and an ordinary mixer input with 48 V phantom. Will it simply work?', options: ['Yes — phantom powers any condenser', 'Only through the approved unit', 'Only with a polarization supply'], after: 'Build the chain and see which joins are refused, and why.' },
  placement: { prompt: 'You move the mic from 1 m to 2 m on the axis. What changes most?', options: ['The level drops and the room arrives sooner after the direct sound', 'Nothing much — same axis', 'The highs rise'], after: 'Move it and read what the zone says.' },
  context: { prompt: 'You stand half a metre behind the capsule. Does it change the reading?', options: ['Yes — a reflection off me', 'No — the mic faces away', 'Only at 1 kHz'], after: 'Move yourself and watch the extra path and its delay.' },
  twoMic: { prompt: 'The after check reads 0.8 dB high and the method allows ±0.5 dB. What now?', options: ['Adjust and pass', 'Log it and investigate', 'Check again until it passes'], after: 'Run a check and read what the label says.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'mm.q.1',
    covers: 'sound',
    prompt: 'What does “omnidirectional” tell you about a measurement mic’s field response?',
    options: ['Nothing on its own: it is a polar pattern', 'That it is made only for a free field, on axis', 'That it is made for a diffuse room'],
    correct: 'Nothing on its own: it is a polar pattern',
    explain: 'The pattern and the field response are separate properties: read the field response in the mic’s data.',
    why: {
      'That it is made only for a free field, on axis': 'Pressure and random-incidence mics are omni too.',
      'That it is made for a diffuse room': 'Free-field and pressure mics are omni too.',
    },
  },
  {
    id: 'mm.q.2',
    covers: 'sound',
    prompt: 'Why does the field response matter most in the highs?',
    options: ['The capsule nears a wavelength in size', 'The calibrator only checks the highs', 'The lows bend round the person measuring'],
    correct: 'The capsule nears a wavelength in size',
    explain: 'At 10 kHz a wavelength is about 3.4 cm: the capsule disturbs the field it measures.',
    why: {
      'The calibrator only checks the highs': 'The usual calibrator tone is 1 kHz — a mid frequency.',
      'The lows bend round the person measuring': 'The lows pass a small capsule easily; the highs are where it matters.',
    },
  },
  {
    id: 'mm.q.3',
    covers: 'setting',
    critical: true,
    prompt: 'Where may a running field calibrator go?',
    options: ['Seated on a capsule only', 'At an ear, briefly, to check it', 'Pointed at the room as a test tone'],
    correct: 'Seated on a capsule only',
    explain: 'It makes a high level inside its coupler: on a capsule, never at a person’s ear, never as a sound effect.',
    why: {
      'At an ear, briefly, to check it': 'Never: the level inside the coupler is high, right at the eardrum.',
      'Pointed at the room as a test tone': 'It is made to seal over a capsule, not to play to a room.',
    },
  },
  {
    id: 'mm.q.4',
    covers: 'setting',
    critical: true,
    prompt: 'The preamp needs a power path you do not have. What do you use?',
    options: ['The exact unit the maker approves', 'A cable you wire for phantom power', 'Whichever input makes it light up'],
    correct: 'The exact unit the maker approves',
    explain: 'Use the approved adapter or conditioning unit; do not experiment with pinouts or power an unverified sensor.',
    why: {
      'A cable you wire for phantom power': 'An improvised pinout can damage the capsule and preamp.',
      'Whichever input makes it light up': 'Trying inputs is applying power to an unverified sensor.',
    },
  },
  {
    id: 'mm.q.5',
    covers: 'setting',
    prompt: 'What comes before choosing any hardware?',
    options: ['Writing down the question and method', 'Choosing the most accurate capsule you own', 'Setting the calibrator to 114 dB'],
    correct: 'Writing down the question and method',
    explain: 'The question decides the mic, its field, its aim, its power and whether a named method is needed.',
    why: {
      'Choosing the most accurate capsule you own': 'The best capsule for one field is the wrong one for another.',
      'Setting the calibrator to 114 dB': 'The check comes later, once the chain exists.',
    },
  },
  {
    id: 'mm.q.6',
    covers: 'sound',
    prompt: 'A small loudspeaker on a bench with the mic on its axis is closest to which field?',
    options: ['A free field', 'A pressure field', 'A diffuse field'],
    correct: 'A free field',
    explain: 'One source, one direction: near enough a free field — though real reflections make it less than ideal.',
    why: {
      'A pressure field': 'A pressure field is a sealed coupler or a flush boundary.',
      'A diffuse field': 'A diffuse field is a reverberant room, far from one dominant source.',
    },
  },
];

export const F11_LESSON: Lesson = {
  id: 'F11',
  labId: 'field',
  title: 'Measurement Microphones and Calibration',
  subtitle: 'The question first, the right field and power path, a check before and after — and an honest label',
  noun: { one: 'measurement mic', many: 'measurement mics', subject: 'measurement bench' },
  model: F11_MODEL,
  micTypeIds: ['measFF', 'measRI', 'measQuarter'],
  zones: F11_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  setupPairs: [{ label: 'Two channels: on the axis and 30° off it', A: { zone: 'mm.axis' }, B: { zone: 'mm.off' }, line: 'Two readings at one logged distance — each channel with its own record and its own check.' }],
  orient: [
    { title: 'WHAT IT IS', text: 'A measurement microphone is a small condenser capsule under a removable protection grid, on a preamp of the same slim size. With its power path, its input and its own calibration record, it is one CHAIN — the thing that is calibrated, not the capsule alone.', src: 'GRAS-FF' },
    { title: 'WHERE YOU MEET IT', text: 'Loudspeaker and system tuning, sound-level surveys, room acoustics, product and machinery noise, research. This lesson is the start of all of them: choosing, powering, checking and placing the mic.', src: 'F11-LESSON' },
    { title: 'WHAT IT DOES', text: 'It turns the pressure at its diaphragm into a signal. A reported number also depends on the preamp, the analyzer, the correction data, the check and the method — so the question you are answering comes first.', src: 'F11-LESSON' },
    { title: 'ITS SIZE', text: 'Capsules are named by their diameter: 1/2 in (12.7 mm) is common; 1/4 in (6.35 mm) for higher levels and higher frequencies. This lab draws a 1/2 in mic on its preamp, and a small loudspeaker on a stand as the source under test.', src: 'NTI-CAL' },
  ],
  sound: {
    stages: [
      { title: 'Free field', text: 'Sound arriving mostly from one direction, as from a loudspeaker on a bench.' },
      { title: 'Pressure', text: 'The pressure at the diaphragm itself, as inside a calibrator’s coupler.' },
      { title: 'Random incidence', text: 'Sound arriving from many directions, as in a reverberant room.' },
    ],
    attack: 'Where the capsule is small against the wavelength (the lows), every field reads alike.',
    body: 'Where the capsule nears a wavelength in size (the highs), the field and the angle matter.',
    head: { diameterMm: 12.7, rods: 0, label: '1/2 in capsule', strikeSrc: 'GRAS-FF' },
  },
  setting: {
    items: [
      { id: 'op', label: 'you, the person running it', short: 'YOU', note: 'Your body reflects sound into the capsule. Stand back as the method asks, and monitor from a safe place.', prov: { kind: 'sourced', src: 'F11-LESSON', quote: 'a person standing close changes the field (L35)' }, tag: 'KEEP BACK', scene: 'all' },
      { id: 'walls', label: 'walls, floor and furniture', short: 'BOUNDARIES', note: 'Every surface near the mic sends a second arrival. Log the distance to the nearest ones, and keep the room the same between trials.', prov: { kind: 'sourced', src: 'F11-LESSON', quote: 'Reflections make the actual field less ideal (L13)' }, tag: 'REFLECTIONS', scene: 'all' },
      { id: 'cable', label: 'the mic cable and the stand', short: 'CABLE · STAND', note: 'A sturdy stand, the cable relieved of strain, nothing covering the vents or changing the geometry; stands kept out of paths and away from moving machinery.', prov: { kind: 'sourced', src: 'F11-LESSON', quote: 'Use a sturdy stand … cable strain relief without covering vents (L35)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'pa', label: 'the PA and its operator', short: 'THE PA', note: 'The measurement mic goes to the analyzer only, never back to the PA. Coordinate test levels and timing with the venue.', prov: { kind: 'sourced', src: 'F13-LESSON', quote: 'A measurement microphone must be routed to a recording or analyzer input, not accidentally returned to the PA (F13 L43)' }, tag: 'NEVER ROUTED', scene: 'stage' },
      { id: 'hvac', label: 'air handling and other noise', short: 'BACKGROUND', note: 'Control the source level and state, the air handling and the reflections as the method requires; log what you cannot control.', prov: { kind: 'sourced', src: 'F11-LESSON', quote: 'control source level and state, HVAC and reflections as the method requires (L36)' }, tag: 'BACKGROUND', scene: 'studio' },
    ],
    stage: 'IN A VENUE: measure where the question is — a mixer position alone may not stand for the audience, and a mic beside one loudspeaker may not stand for the room. Modest levels, coordinated timing, stands out of routes.',
    studio: 'ON A BENCH OR IN A LAB: control the source’s level and state, the air handling and the reflections as the method requires; change one thing at a time and repeat the baseline.',
  },
  diagnostic,
  practice: {
    task: 'Choose a chain and a position for two briefs, and say what would make a result calibrated rather than relative. With real equipment and someone qualified on it, you can log what you did below.',
    fields: MEASURE_SHEET,
  },
  unknowns: [
    { text: 'The bench: the axis height above the floor, the loudspeaker’s size and its stand — drawing defaults.', dims: ['yFloor'] },
    { text: 'The logged distance (drawn 1 m and 2 m), the off-axis angle (30°) and the room position (about 2.5 m): drawing defaults — the method gives the real ones.', dims: [] },
    { text: 'The operator keep-away radius (drawn 1 m): the method gives it.', dims: [] },
    { text: 'The mic body lengths and the calibrator’s size: drawing defaults; only the capsule diameters come from their names.', dims: [] },
    { text: 'The calibrator check’s readings and tolerances are made-up examples, labelled as such; the method gives the real tolerance.', dims: [] },
  ],
  live: { wedges: [] },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules: the method you are handed sets the real distances, angles and tolerances. Experiment, and trust your ears and the room as well as the meter. The lab is silent and draws a simplified picture: a small loudspeaker and a 1/2 in measurement mic on a bench, wavefronts at a real wavelength, the mic’s pattern as a textbook omni, and the calibrator’s readings as made-up examples. Run real checks with someone qualified on the equipment.',
  copy: F11_COPY,
};
