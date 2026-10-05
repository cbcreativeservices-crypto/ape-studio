/**
 * I08 MARIMBA — the lesson's pages as DATA (blueprint §7). Words from the
 * owner's lesson (docs/labs/miking/source_text/Marimba-Miking-Technique-
 * Research.txt, "L<n>" in COMMENTS only) with the fixes in CORRECTIONS_LOG.md
 * (I2-M*) applied — notably L76's pair is a COINCIDENT pair, and L7's
 * "especially on thin low-register bars" is not on the maker's page.
 * OWNER RULING 2026-10-04: starting points, never dogma; no source, brand or
 * model in learner text; no badges; FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, PageContent, PageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import type { LessonCopy } from '../../engine/model/copy.ts';
import { BRAND_REASON, CLEAR_REASON, cardioidNull, distortionSymptom, firstNotch, gainCheck, moveRemovesDelay, polarityKeepsDelay, POWER_REASON, setupOrder } from '../shared/concert/commonItems.ts';
import { BEFORE_STANDS, coincidentCheck, hearingCheckM, malletAxes, malletWedges, monoSymptomM, quickHearingM, rattleSymptom, shurePairs, weakEndSymptom, type MW } from '../shared/mallets/content.ts';
import type { MalletLesson, MalletWords } from '../shared/mallets/family.ts';
import { FAMILY_UNKNOWNS } from '../shared/mallets/malletModel.ts';
import { MARIMBA_GEOM, MARIMBA_MODEL } from './geometry.ts';
import { MARIMBA_FAM, MARIMBA_ZONES } from './model.ts';

const W: MW = { p: 'mr', the: 'the marimba', noun: 'marimba', player: 'player', loudest: 'the strongest accent' };
const L0 = MARIMBA_GEOM.layouts.oct5;
const SIDE_X = 2800;
const FRONT_Z = 1500;

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the marimba',
    goal: 'Get to know the marimba — what it is, where you meet it, what it does in the music, and its parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Wooden (or synthetic) bars in two rows, longer and wider toward the low end, each over its own pipe; the lowest notes over boxes. A five-octave instrument is about 2.5 m long — the part decides how much of it you must cover.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a mallet stroke becomes a note — the bar’s shapes, the pipe under it, the boxes under the lowest notes — and where the sound leaves. Shown, never played.',
    credit: { scenarios: ['mr.snd.1', 'mr.snd.2', 'mr.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The bar rings about two still points the cord passes through; the pipe under it — a quarter wavelength long — rings with it and helps the note develop. A straight pipe for the lowest notes would be taller than the bars are high: they get boxes.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the marimba sits — a recital, an ensemble, a stage — the player’s space along the whole keyboard, and what to check before any mic.',
    credit: { scenarios: ['mr.set.1', 'mr.set.hear', 'mr.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Watch the whole passage first: the player moves along the keyboard, both hands reach both rows, and the mallets rise. Bars, pipes and cords are never touched; the wheels are locked.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the marimba by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['mr.mic.1', 'mr.mic.2', 'mr.mic.3', 'mr.mic.4', 'mr.rec.1'], note: 'Answer the five checks (one reaches back to how the marimba sounds).' },
    takeaway: 'A directional condenser is a common choice; other mics can suit when their response, pattern, power and mount do. The mallet is a source choice — no mic setting replaces it.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — one mic above the middle of the played span, or one of a spaced pair — clear of every mallet, then move the mic and see what changes.',
    credit: { scenarios: ['mr.place.1', 'mr.place.2', 'mr.place.3', 'mr.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'A recommended zone is a place to begin, measured from the bars — not a rule, and not a safety clearance. Centre it on the notes the part plays, not on the instrument.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s real rejection faces a loud unwanted source — and know how the studio decision differs.',
    credit: { scenarios: ['mr.ctx.1', 'mr.ctx.2', 'mr.ctx.studio', 'mr.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the side fill sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Aim nulls by the real pattern; real nulls are shallowest in the lows, where a marimba’s bass lives. In a quiet hall the main pickup may be enough.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'Compare the published pairs — spaced about 61 cm apart, or grilles together at 135° — and a wider spaced pair, by what a bar at each end does to them.',
    credit: { scenarios: ['mr.two.1', 'mr.two.2', 'mr.two.3', 'mr.two.4'], interactive: 'pairCompared', note: 'Look at the spaced pair and the coincident pair with an end bar as the source, then answer the four checks.' },
    takeaway: 'On a five-octave keyboard a 61 cm spaced pair may be too narrow: test the real range. Grilles together, no bar has a time difference; spaced, the end bars do. Listen to each mic alone, both together, and in mono.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the source and the coverage first — the mallets, the passage, the pipes and frame — then gain staging, before EQ or a gate.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two different briefs, and say when a pair is justified.',
    credit: { scenarios: ['mr.prac.order', 'mr.prac.gain', 'mr.prac.setup1', 'mr.prac.setup2', 'mr.prac.3', 'mr.mix.1', 'mr.mix.2', 'mr.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'The bars protected, full mallet clearance, the part’s whole range covered, mallet changes told apart from mic changes, and a defensible studio and live setup — more than one can pass.',
  },
};

const scenarios: MikingScenario[] = [
  {
    id: 'mr.snd.1',
    page: 'sound',
    prompt: 'Why do the lowest marimba notes have boxes under them instead of long pipes?',
    options: ['A straight pipe would be taller than the bars are high', 'Boxes make the lowest notes much louder than long pipes could', 'Wood bars must not hang over metal pipes'],
    correct: 'A straight pipe would be taller than the bars are high',
    explain: 'A pipe is about a quarter wavelength of its note: for the lowest C, about 1.3 m — more than the bars’ height above the floor. A wide box resonates in less height.',
    why: {
      'Boxes make the lowest notes much louder than long pipes could': 'The reason is height, not level: a quarter wavelength for the lowest notes will not fit under the bars.',
      'Wood bars must not hang over metal pipes': 'Every other bar hangs over a pipe; the lowest ones just need something shorter.',
    },
  },
  {
    id: 'mr.snd.2',
    page: 'sound',
    prompt: 'A pipe on the marimba looks long but sits under a high note. What does its visible length tell you?',
    options: ['Not the pitch: some pipes are closed midway or added for looks', 'The exact note: a long pipe can only mean a low bar', 'How loud that bar will be, compared with the bars on either side of it'],
    correct: 'Not the pitch: some pipes are closed midway or added for looks',
    explain: 'Some instruments add pipes where there are no bars, or close pipes off midway to form an arch. A visible pipe is not a pitch readout.',
    why: {
      'The exact note: a long pipe can only mean a low bar': 'Pipes can be closed midway or decorative; the visible length can mislead.',
      'How loud that bar will be, compared with the bars on either side of it': 'Length follows the note, not a wanted level — and the visible length may not be the working one.',
    },
  },
  {
    id: 'mr.snd.3',
    page: 'sound',
    prompt: 'A mallet strikes the very middle of a plain bar. Which of its first three shapes stays quiet?',
    options: ['The second — it is still in the middle', 'The first — the middle stays put in it', 'None — all of the shapes move at the middle'],
    correct: 'The second — it is still in the middle',
    explain: 'The second shape has a still point at the middle, so a stroke there does not drive it. The first shape moves most at the middle.',
    why: {
      'The first — the middle stays put in it': 'The first shape moves MOST at the middle; it is still near the cords.',
      'None — all of the shapes move at the middle': 'The second shape has a still point exactly there.',
    },
  },
  {
    id: 'mr.set.1',
    page: 'setting',
    prompt: 'Before placing anything over a five-octave marimba, what do you watch?',
    options: ['The whole passage: both hands’ reach, travel along the keyboard', 'One loud note in the middle, to set the input gain', 'Nothing yet: the stands can all go in while the player is still warming up'],
    correct: 'The whole passage: both hands’ reach, travel along the keyboard',
    explain: 'The player moves along the keyboard and reaches both rows; the mallets rise. Boom, capsule and cable go outside the entire stroke arc, the score and the sightline clear.',
    why: {
      'One loud note in the middle, to set the input gain': 'Gain comes later; first the reach and the travel.',
      'Nothing yet: the stands can all go in while the player is still warming up': 'A stand set before you know the reach may sit in the mallets’ way.',
    },
  },
  hearingCheckM(W, 'setting'),
  {
    id: 'mr.set.2',
    page: 'setting',
    prompt: 'A clamp would hold a mic neatly on a marimba pipe. Is that a good idea?',
    options: ['No — nothing clamps to a bar, a pipe or a cord', 'Yes — a pipe is metal and can take the weight', 'Yes, as long as the clamp has a soft rubber lining'],
    correct: 'No — nothing clamps to a bar, a pipe or a cord',
    explain: 'Secure the mic independently of the instrument unless a suitable approved mounting is used. Do not reposition pipes or tuning parts to fit a mic.',
    why: {
      'Yes — a pipe is metal and can take the weight': 'Pipes are tuned and can rattle or shift; they are not mounts.',
      'Yes, as long as the clamp has a soft rubber lining': 'Lining or not, a clamp on a pipe can rattle it or move its tuning.',
    },
  },
  {
    id: 'mr.mic.1',
    page: 'microphone',
    prompt: 'Is a condenser the only sensible mic over a marimba?',
    options: ['No — other mics can suit when their properties do', 'Yes — no other type can hear wooden bars', 'Yes — a dynamic would be damaged by the marimba’s low notes'],
    correct: 'No — other mics can suit when their properties do',
    explain: 'A directional condenser is a common start; response, pattern, maximum level, power, size and mount decide — not the type’s name.',
    why: {
      'Yes — no other type can hear wooden bars': 'Other types hear the bars; compare by ear.',
      'Yes — a dynamic would be damaged by the marimba’s low notes': 'Dynamics handle high levels well. The question is whether the response suits.',
    },
  },
  {
    id: 'mr.mic.2',
    page: 'microphone',
    prompt: 'The channel you are given has no phantom power. Which of this page’s mics can you use?',
    options: ['The compact dynamic: it needs no power to work', 'The condenser, if it sits higher above the bars', 'Either one, as long as the channel gain is turned up'],
    correct: 'The compact dynamic: it needs no power to work',
    explain: 'Dynamic mics need no power. A condenser needs phantom power wherever it is placed.',
    why: {
      'The condenser, if it sits higher above the bars': 'Height does not change what a condenser needs: it still needs phantom power.',
      'Either one, as long as the channel gain is turned up': 'Gain cannot power a condenser. It needs phantom power from the desk.',
    },
  },
  {
    id: 'mr.mic.3',
    page: 'microphone',
    prompt: 'The engineer wants a brighter attack. The player suggests hard mallets. What comes first?',
    options: ['The maker’s and owner’s limits on mallets for this marimba', 'A brighter mic, since mallets are only a matter of taste', 'Hard mallets, since a wooden bar can take whatever is used on it'],
    correct: 'The maker’s and owner’s limits on mallets for this marimba',
    explain: 'A hard head can damage wooden bars. Follow the maker’s guidance and the owner’s judgment; change the mic position and the layout before asking for an unsuitable mallet.',
    why: {
      'A brighter mic, since mallets are only a matter of taste': 'Mallets are also an instrument-care decision — and the source comes first.',
      'Hard mallets, since a wooden bar can take whatever is used on it': 'Hard heads can damage wooden bars. The owner decides.',
    },
  },
  {
    id: 'mr.mic.4',
    page: 'microphone',
    prompt: 'On a loud stage, why a directional pattern over the marimba?',
    options: ['It rejects part of the louder neighbours off its axis', 'It makes the marimba louder for the audience on its own', 'It stops the low notes from reaching the mic at all'],
    correct: 'It rejects part of the louder neighbours off its axis',
    explain: 'A directional pattern can reduce some spill; never all of it, and least in the lows. Placing the instrument well helps as much.',
    why: {
      'It makes the marimba louder for the audience on its own': 'A mic does not change the instrument’s level; it changes what the channel hears.',
      'It stops the low notes from reaching the mic at all': 'The marimba’s low notes are what you want the mic to hear.',
    },
  },
  {
    id: 'mr.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · What does a pipe under a marimba bar do?',
    options: ['Its air rings with the bar and helps the note develop', 'It holds the bar up at the right height', 'It damps the bar slightly so that the note stops much sooner'],
    correct: 'Its air rings with the bar and helps the note develop',
    explain: 'Open under the bar and closed at the far end, the pipe rings at its bar’s note.',
    why: {
      'It holds the bar up at the right height': 'The cords and posts hold the bar; the pipe holds air.',
      'It damps the bar slightly so that the note stops much sooner': 'The pipe supports the note; damping is the player’s.',
    },
  },
  {
    id: 'mr.place.1',
    page: 'placement',
    prompt: 'The part uses only the top two octaves. Where does a one-mic starting point centre?',
    options: ['Over the middle of the notes the part plays', 'Over the middle of the whole instrument', 'Over the lowest bar, to keep the bass end full and warm'],
    correct: 'Over the middle of the notes the part plays',
    explain: 'Start over the centre of the PLAYED span: a part on neighbouring notes needs less coverage than a solo that runs end to end.',
    why: {
      'Over the middle of the whole instrument': 'The instrument’s middle may be far from where this part is played.',
      'Over the lowest bar, to keep the bass end full and warm': 'This part does not use the bass; the mic covers the played notes.',
    },
  },
  {
    id: 'mr.place.2',
    page: 'placement',
    prompt: 'One mic close above the low bars. What do you expect?',
    options: ['The low bars can dominate and the far end can fade', 'The keyboard evenly, because low bars are the loudest', 'More of the room, because the low bars are wide'],
    correct: 'The low bars can dominate and the far end can fade',
    explain: 'A point close to one end over-represents it. Higher or farther tends to integrate the keyboard — and adds room and spill. Verify with the real phrase.',
    why: {
      'The keyboard evenly, because low bars are the loudest': 'Nearness wins: the far end is farther and quieter in that mic.',
      'More of the room, because the low bars are wide': 'Closer means less room, not more.',
    },
  },
  {
    id: 'mr.place.3',
    page: 'placement',
    prompt: 'A mic under the pipes, aimed up. How should you treat it?',
    options: ['As an optional effect, auditioned against a view from above', 'As the natural marimba sound, so it comes first', 'As a safe default, because nothing can possibly strike it down there'],
    correct: 'As an optional effect, auditioned against a view from above',
    explain: 'Under the pipes gives a more localised, coloured sound and more mechanical noise — not the universally natural marimba sound.',
    why: {
      'As the natural marimba sound, so it comes first': 'From above, the mic hears bars and pipes together in the room; underneath is a narrower colour.',
      'As a safe default, because nothing can possibly strike it down there': 'Feet, the frame and the pipes are close by — and the sound is a coloured one.',
    },
  },
  {
    id: 'mr.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · A bar is struck at a still point of one of its shapes. What happens to that shape?',
    options: ['It is barely set moving', 'It rings louder than the others', 'It changes pitch'],
    correct: 'It is barely set moving',
    explain: 'A shape is driven only as much as the bar moves at the strike point in that shape. The player’s stroke location is part of the tone.',
    why: {
      'It rings louder than the others': 'A still point does not move, so it cannot push that shape.',
      'It changes pitch': 'The strike point changes which shapes ring, not their pitches.',
    },
  },
  {
    id: 'mr.ctx.1',
    page: 'context',
    prompt: 'A quiet acoustic hall, a marimba solo. What may be enough?',
    options: ['The main or area pickup, checked through the passage', 'A close mic over each octave of the keyboard, for even coverage', 'A mic under the pipes for the natural sound'],
    correct: 'The main or area pickup, checked through the passage',
    explain: 'In a quiet hall an existing main or area mic may carry the marimba adequately. A louder stage needs direct pickup.',
    why: {
      'A close mic over each octave of the keyboard, for even coverage': 'Every extra mic adds spill and timing problems; begin with the mains.',
      'A mic under the pipes for the natural sound': 'Under the pipes is a coloured effect, not the natural sound.',
    },
  },
  {
    id: 'mr.ctx.2',
    page: 'context',
    prompt: 'The side fill sits in a hypercardioid’s null on paper. What should you expect from the marimba’s low notes?',
    options: ['Less rejection than the picture shows, least in the lows', 'Complete silence from the side fill, low and high alike', 'More rejection in the low notes than in the high ones'],
    correct: 'Less rejection than the picture shows, least in the lows',
    explain: 'A null is infinitely deep only on paper. Real mics reject far less there, and least at low frequencies.',
    why: {
      'Complete silence from the side fill, low and high alike': 'Real rejection is partial.',
      'More rejection in the low notes than in the high ones': 'The reverse: real patterns usually reject least at low frequencies.',
    },
  },
  {
    id: 'mr.ctx.studio',
    page: 'context',
    prompt: 'A solo overdub that runs from bass to treble. One central mic is uneven. What next?',
    options: ['Compare the published pairs and a wider room view', 'Boost the weak end on the desk until it is even', 'Ask the player to keep the solo in the middle octaves'],
    correct: 'Compare the published pairs and a wider room view',
    explain: 'For a wide solo, compare the spaced and the coincident pair — and in a good room a moderately distant stereo pair — at matched level, in mono too.',
    why: {
      'Boost the weak end on the desk until it is even': 'EQ cannot add notes the mic does not hear well.',
      'Ask the player to keep the solo in the middle octaves': 'The music sets the range; the mics cover it.',
    },
  },
  {
    id: 'mr.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Why might a straight pipe be impossible for the lowest marimba note?',
    options: ['Its quarter wavelength is longer than the bars are high', 'Wooden bars cannot drive a pipe that long', 'The frame has no rail at the low end'],
    correct: 'Its quarter wavelength is longer than the bars are high',
    explain: 'About 1.3 m for the lowest C — more than the bar height. The low notes get boxes.',
    why: {
      'Wooden bars cannot drive a pipe that long': 'The problem is room under the bars, not the bar’s strength.',
      'The frame has no rail at the low end': 'The frame carries the low end too; the length is the issue.',
    },
  },
  polarityKeepsDelay(W),
  firstNotch(W),
  coincidentCheck(W),
  {
    id: 'mr.two.4',
    page: 'twoMic',
    prompt: 'A 61 cm spaced pair over a five-octave solo leaves the ends weak. What does the research suggest?',
    options: ['Test the real range, then widen, raise or re-aim the pair', 'Keep 61 cm: it is the required distance for a marimba', 'Add a third mic in the middle of the keyboard to fill the hole there'],
    correct: 'Test the real range, then widen, raise or re-aim the pair',
    explain: 'The published spacing is a starting example; on a wide five-octave keyboard it may be too narrow. Adjust from the passage, then check the middle and the mono sum.',
    why: {
      'Keep 61 cm: it is the required distance for a marimba': 'It is a starting example, not a requirement.',
      'Add a third mic in the middle of the keyboard to fill the hole there': 'The middle is not the problem here — and more mics add more timing differences.',
    },
  },
  gainCheck(W),
  {
    id: 'mr.prac.3',
    page: 'practice',
    prompt: 'When is a pair over the marimba justified rather than one mic?',
    options: ['When one safe position cannot cover the part’s range', 'If the marimba has five octaves, two mics are the rule', 'Only for a recording, not for a stage'],
    correct: 'When one safe position cannot cover the part’s range',
    explain: 'A wide part may need a wider view or two mics; a part confined to a few notes may not. Compare, in mono too.',
    why: {
      'If the marimba has five octaves, two mics are the rule': 'The instrument’s size is not the part’s range.',
      'Only for a recording, not for a stage': 'A pair can serve live too, when the PA and the audience’s seats make it useful.',
    },
  },
  {
    id: 'mr.mix.1',
    page: 'practice',
    prompt: 'A starting point says “about 60–100 cm above the middle of the played span”. What do you still need?',
    options: ['The bars as the reference, and the mallets’ highest stroke', 'The marimba’s brand, so the numbers match its size', 'Nothing more: the band already tells you exactly where it goes'],
    correct: 'The bars as the reference, and the mallets’ highest stroke',
    explain: 'A distance belongs to its reference (the bars), and the mallets set the minimum clearance. The played span sets where along the keyboard.',
    why: {
      'The marimba’s brand, so the numbers match its size': 'The brand does not change the reference; the bars do.',
      'Nothing more: the band already tells you exactly where it goes': 'A band is a place to begin; clearance and the part decide the rest.',
    },
  },
  cardioidNull(W),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  weakEndSymptom(W),
  {
    id: 'mr.s.hole',
    observation: 'The middle has a hole with two mics',
    firstChecks: 'Do the two leave weak overlap, or cancel in mono? Hear each, then both; adjust aims, spacing and balance.',
    options: ['Each mic alone, both together, then aims, spacing, balance', 'Add a third mic over the middle to fill the gap', 'Turn both mics up until the middle comes back'],
    correct: 'Each mic alone, both together, then aims, spacing, balance',
    explain: 'A hole is weak overlap or a mono cancellation; both are fixed by the pair’s geometry.',
    why: {
      'Add a third mic over the middle to fill the gap': 'A third mic adds more timing differences; fix the pair first.',
      'Turn both mics up until the middle comes back': 'Level raises everything; the middle stays weaker relative to the ends.',
    },
  },
  {
    id: 'mr.s.click',
    observation: 'A hard click dominates the sound',
    firstChecks: 'Is the mallet or touch unsuitable, or is the mic too close to the strike? Confirm a safe mallet with the player, then try distance and angle.',
    options: ['The mallet and touch with the player, then distance and angle', 'Cut the treble with EQ until the click goes away', 'Ask the player to switch to the hardest mallets for clarity'],
    correct: 'The mallet and touch with the player, then distance and angle',
    explain: 'The source comes first, safely; then a less direct or higher mic view.',
    why: {
      'Cut the treble with EQ until the click goes away': 'EQ dulls the whole instrument; find the cause first.',
      'Ask the player to switch to the hardest mallets for clarity': 'Harder mallets add click — and can damage wooden bars.',
    },
  },
  rattleSymptom(W, 'the pipes, the frame, the bars and any stand touching it'),
  monoSymptomM(W),
  distortionSymptom(W),
];

const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point, measured from the bars', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };
const COUNT_REASON: SetupReason = { id: 'r.count', label: 'A five-octave marimba always needs exactly two mics', role: 'wrong', feedback: 'The part’s range decides, not the instrument’s size.' };

const setupTasks: SetupTask[] = [
  {
    id: 'mr.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A recital recording in a good hall: a solo that runs from the lowest to the highest notes. Two channels; phantom power is available.',
    setups: [
      { id: 'a', label: 'Two condensers spaced about 61 cm apart, about 46 cm above the bars — then widened after testing the range', ok: true, power: 'phantom', feedback: 'A published start, adjusted for a wide part; check the middle and the mono sum.' },
      { id: 'b', label: 'Two condensers grilles together, 135° apart, about 46 cm above the middle of the span', ok: true, power: 'phantom', feedback: 'The coincident pair: no time difference, a coherent picture; check the far ends.' },
      { id: 'c', label: 'One condenser close over the lowest bars', ok: false, power: 'phantom', feedback: 'The low end would dominate and the treble fade.' },
      { id: 'd', label: 'A mic clamped to a pipe in the middle', ok: false, power: 'phantom', feedback: 'Nothing clamps to a pipe, a bar or a cord.' },
      { id: 'e', label: 'Two mics under the pipes, panned left and right', ok: false, power: 'phantom', feedback: 'Under the pipes is a coloured effect, not the instrument’s natural picture.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.range', label: 'The pair is set from the part’s real range and checked in mono', role: 'optional', feedback: 'A fair recording reason.' }, BRAND_REASON, COUNT_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point from the bars, adjusted to the played range, clear of the mallets, power that matches the mics, and a mono check.',
  },
  {
    id: 'mr.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage: the marimba plays a two-octave part in the middle of the keyboard. One channel, NO phantom power; a mono PA.',
    setups: [
      { id: 'a', label: 'One compact dynamic about 60–100 cm above the middle of the played span, aimed down', ok: true, power: 'none', feedback: 'One directional mic over the played notes; it needs no phantom.' },
      { id: 'b', label: 'The marimba moved away from the loudest neighbour, then one compact dynamic over the played span', ok: true, power: 'none', feedback: 'Layout first, then the mic.' },
      { id: 'c', label: 'One condenser over the middle of the played span', ok: false, power: 'phantom', feedback: 'No phantom power on this input.' },
      { id: 'd', label: 'A spaced pair panned hard left and right', ok: false, power: 'none', feedback: 'One channel and a mono PA.' },
      { id: 'e', label: 'A dynamic 15 cm over the bars for more level', ok: false, power: 'none', feedback: 'Inside the mallets’ travel.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'A directional mic and a better layout help against loud neighbours', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, COUNT_REASON],
    explain: 'Two setups pass: one safe directional mic over the played notes, the layout improved where possible, and power this input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: a mallet strikes the middle of a bar. What do the bar’s ends do?', options: ['They move up while the middle goes down', 'They move down with the middle', 'They stay still — only the middle moves'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch the whole bar.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: one mic over the middle, then one of a spaced pair over the low half. What changes?', options: ['More of the low notes in this mic', 'More of the whole keyboard', 'It depends on the passage and the room'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The side fill sits off to the side of a mic looking down at the bars. Which pattern can turn a null toward it?', options: ['Only a cardioid', 'A supercardioid or hypercardioid', 'None of them'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'Grilles together, angled 135° apart: the lowest bar sounds. Which reaches the two mics differently?', options: ['Its arrival time', 'Its level', 'Neither'], after: 'Now step BAR to an end of the keyboard with each PAIR, and watch DELAY and LEVEL.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'mr.q.1',
    covers: 'instrument',
    prompt: 'Where are a marimba’s longest, widest bars?',
    options: ['At the low end', 'At the high end', 'In the middle'],
    correct: 'At the low end',
    explain: 'The bars get longer and wider toward the low notes — the lowest about 62 cm long on a five-octave instrument.',
    why: { 'At the high end': 'The high bars are the short, narrow ones.', 'In the middle': 'They graduate from end to end, longest at the low end.' },
  },
  {
    id: 'mr.q.2',
    covers: 'instrument',
    prompt: 'What is under each marimba bar?',
    options: ['A pipe (or a box for the lowest notes)', 'A felt damper worked by a foot pedal, as on vibes', 'A small fan on a turning shaft'],
    correct: 'A pipe (or a box for the lowest notes)',
    explain: 'One pipe per bar, open at the top and closed at the bottom; boxes under the lowest notes.',
    why: { 'A felt damper worked by a foot pedal, as on vibes': 'That is a vibraphone’s damper; a marimba is damped by the player.', 'A small fan on a turning shaft': 'Fans belong to a vibraphone with a motor.' },
  },
  {
    id: 'mr.q.3',
    covers: 'sound',
    prompt: 'Why are the pipes under the low notes longer?',
    options: ['Each is about a quarter wavelength of its note', 'Longer bars are heavier and need more support', 'To make the low notes the loudest ones'],
    correct: 'Each is about a quarter wavelength of its note',
    explain: 'A lower note has a longer wavelength, so its pipe is longer — until it no longer fits, and a box takes over.',
    why: { 'Longer bars are heavier and need more support': 'The cords hold the bars; the pipes hold air.', 'To make the low notes the loudest ones': 'The length follows the pitch.' },
  },
  {
    id: 'mr.q.4',
    covers: 'sound',
    prompt: 'Where does the cord pass through a marimba bar?',
    options: ['Where the bar stays still as it rings', 'Through its middle, where it is strongest', 'At the very ends of the bar'],
    correct: 'Where the bar stays still as it rings',
    explain: 'Held at its still points, a little in from each end, the bar rings freely.',
    why: { 'Through its middle, where it is strongest': 'The middle moves most.', 'At the very ends of the bar': 'The ends move too; the still points are in from the ends.' },
  },
  {
    id: 'mr.q.5',
    covers: 'setting',
    prompt: 'Before placing a marimba mic, what sets the minimum clearance?',
    options: ['The player’s mallet arc through the whole passage', 'The length of the lowest pipe on the keyboard', 'The height of the player’s music stand on the stage'],
    correct: 'The player’s mallet arc through the whole passage',
    explain: 'Watch both hands’ reach and the travel along the keyboard; the mallets’ arc sets the minimum.',
    why: { 'The length of the lowest pipe on the keyboard': 'The pipes are under the bars; the mallets rise above.', 'The height of the player’s music stand on the stage': 'The stand matters for the sightline; the mallets set the clearance.' },
  },
  quickHearingM(W),
];

const words: MalletWords = {
  sound: {
    stages: [
      { title: 'The mallet lands', text: 'A yarn-wrapped mallet lands on the middle of a wooden bar. That contact is the ATTACK — the mallet and the touch shape it, from round to articulate.' },
      { title: 'The bar bends and rings', text: 'The bar bends — the middle down, both ends up — and springs back: its lowest shape, drawn far larger than it moves. Two still points a little in from each end carry the cord, so the bar rings freely.' },
      { title: 'The air in the pipe rings with it', text: 'Under the bar hangs its pipe, open at the top and closed at the bottom, a quarter wavelength long for this note. Its air rings with the bar and helps the note develop. Under the lowest notes, boxes do the same job in less height.' },
      { title: 'Sound leaves — up and out', text: 'Sound leaves the bar and the pipe’s mouth, up and out around the keyboard. Rolls — fast repeated strokes — make long notes from short ones.' },
    ],
    cells: [
      { k: 'BAR', at: ['STRUCK', 'BENDING', 'RINGING', 'RINGING'], flex: 1 },
      { k: 'PIPE AIR', at: ['AT REST', 'AT REST', 'RINGING', 'RINGING'], flex: 1.1 },
      { k: 'SOUND', at: ['—', '—', '—', 'UP AND OUT'], flex: 1.1 },
    ],
    looking: 'One bar and its pipe · seen from the low end · the player at the left',
    reveal: 'The middle goes down while the ends come up: a bar bends about two still points.',
    after: 'Then the bar keeps ringing briefly, the pipe with it: a marimba note is short, which is why players roll long notes. The mallet and the stroke place shape it — the player’s choices.',
    shapes: {
      intro: 'This is the lowest shape — the note. The middle and the ends move opposite ways about two still points, a little in from each end, where the cord passes.',
      tuned: 'A plain bar’s upper shapes ring at uneven ratios (about 2.76 and 5.40 times the lowest). Marimba bars are carved underneath to tune them — makers call it octave tuning — so a real bar’s ratios differ from this plain one. The still points and the strike-point idea stay.',
      notes: ['A shape is set moving only as much as the bar moves at the strike point in that shape: the stroke place is part of the tone.'],
    },
    tube: {
      intro: 'Open under the bar, closed at the bottom: the pipe rings at the note whose quarter wavelength fits it — about {len} here. Step BAR toward the low end and watch it grow.',
      helmholtz: 'A straight pipe for this note would be about {len} — taller than the bars are high. A wide box with a narrow opening (a Helmholtz resonator) rings at the note in far less height.',
      visible: 'The air moves most at the open mouth and presses most at the closed end. Some instruments close pipes midway or add decorative ones: what you see is not a pitch readout.',
      noTube: 'No pipe under this bar on this drawing.',
    },
  },
  two: {
    presets: shurePairs('mlSdc', MARIMBA_GEOM.barY, { spacing: 1200, height: 700 }),
    looking: 'Two mics over the marimba · paths from one bar',
    prompt: 'Choose a PAIR, then step BAR to the lowest and the highest bar. Watch DELAY and LEVEL — and the comb below. Try the wider pair, too.',
    learn: [
      'Two layouts to begin from, as alternatives: two mics aimed down about 46 cm (1½ ft) above the bars, either about 61 cm (2 ft) apart, or grilles together angled 135° apart — a coincident pair.',
      'Spaced: one mic toward the lower played region, one toward the higher, overlapping through the middle. On a widely played five-octave keyboard 61 cm may be too narrow: test the range and adjust spacing, height and aims. Coincident: no time difference in mono and a coherent picture, with less separate register control.',
      'Listen to each mic alone, both together, and summed to mono before reaching for automatic time alignment or the polarity switch. In a suitable studio a near-coincident or wider pair can be tried too — judge the mono picture and the whole keyboard.',
    ],
    warn: 'A simplified picture: one point on one bar, straight paths, no room. Judge a real pair by ear — each mic alone, both together, and in mono — at matched levels.',
  },
};

const copy: Partial<LessonCopy> = {
  variantKey: 'SIZE',
  variantShort: { oct5: 'five octaves', oct43: 'four and a third octaves' },
  sceneSubject: { oct5: 'a five-octave marimba', oct43: 'a four-and-a-third-octave marimba' },
  viewTag: { side: 'FRONT · FROM THE AUDIENCE', top: 'FROM ABOVE · AUDIENCE BELOW' },
  axes: malletAxes(MARIMBA_FAM),
  instrument: {
    figureBadge: 'A five-octave marimba, from the audience',
    figureLabel: 'Front view of a five-octave marimba from the audience: two rows of rosewood bars seen end-on, a pipe under every bar — the longest at the low end on the right, wide boxes under the very lowest notes — the frame on casters, and the player behind with two mallets.',
    partsBadge: 'A five-octave marimba · tap a part to name it',
    partsLooking: { side: 'Front view · from the audience · low end on the right', top: 'From above · the player at the top, the audience below' },
    partsIdle: 'The mallet strikes a wooden bar; the pipe under it rings with it. The next page shows how.',
    variantNotes: { oct43: 'FOUR AND A THIRD OCTAVES: A2 to C7 — shorter, and its lowest pipes still fit under the bars.' },
  },
  setting: {
    kitA11y: 'A percussion ensemble from above: the marimba with its player, other percussion behind, a drum kit to one side.',
    kitLanding: 'Tap anything around the marimba — or step through ITEM — to see what it means for a marimba mic. There is nothing to answer yet.',
    kitIdle: 'The marimba in an ensemble: the player moves along its whole length; louder percussion and drums sit close by.',
    leftHanded: 'The low end is on the player’s left. Check which notes the part uses — and where the player stands for them.',
    stageA11y: 'The ensemble on a stage, from above: a floor wedge in front of the marimba, a side fill on stage left, the audience to the right.',
    studioA11y: 'The marimba in a studio room, from above: the walls around it, no monitors.',
    stageIdle: 'Two monitors: a wedge in front of the marimba, facing the player, and a side fill at stage left. The PA faces the audience.',
    studioIdle: 'No monitors. In a good room, a moderately distant pair can show the keyboard’s width and the space.',
    before: [
      { title: 'WATCH THE WHOLE PASSAGE', text: 'Low notes, middle range, the highest notes; soft and strong strokes, rolls and four-mallet chords. Both hands’ reach, the mallets’ height and any travel along the keyboard.' },
      { title: 'PROTECT THE INSTRUMENT', text: 'Do not touch or clamp onto a bar, a pipe or a cord, and do not move pipes or tuning parts to fit a mic. Mallets are the owner’s and the maker’s call: hard heads can damage wooden bars.' },
      BEFORE_STANDS,
    ],
    plan: {
      title: 'In the ensemble',
      badge: 'A percussion ensemble from above · a typical layout · the audience to the right',
      looking: 'Plan · the marimba in an ensemble, the audience to the right',
      stageBadge: 'From above · two monitors where a stage often puts them · audience to the right',
      studioBadge: 'From above · a studio room',
      stageLooking: 'Plan · the ensemble on a stage',
      studioLooking: 'Plan · the marimba in a studio',
      widePrompt: 'Switch STAGE / STUDIO, and tap what is new around the marimba.',
    },
  },
  placement: {
    workedZone: { oct5: 'mr.one', oct43: 'mr.one' },
    workedLine: 'This starting point is also read against {line}.',
    workedAim: 'Aim down at the bars — the starting point counts while the mic looks within 30° of straight down. Height and angle are separate things to try.',
    workedClear: 'Clear of both hands’ whole reach along the keyboard, the raised mallets, the score and the sightline. Clearance comes first, and the player stops before a real stand moves.',
    blocked: { oct5: ' Raise it above the mallets’ travel, or move it out to the side.', oct43: ' Raise it above the mallets’ travel, or move it out to the side.' },
    reveal: 'Over the low half the mic favours the low notes; over the middle it hears the keyboard more evenly — and every passage differs, so “it depends” is fair too.',
    typeNotes: { mlDynCard: 'A dynamic can work too, especially live: choose by response, pattern, power and mount, and compare by ear.' },
    note: 'Clearance comes first: stop the player before moving a real stand. The heights are starting points, not safety clearances — the mallets’ highest stroke decides.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we recommend you begin: one mic about 60–100 cm above the middle of the PLAYED span, aimed down; or one of a spaced pair about 46 cm above the bars and 61 cm apart; and, only as an optional effect, a mic under the pipes. Starting points, not rules.',
      separate: 'Height, the place along the keyboard and the angle are separate variables: change one at a time, with low, middle and high notes, rolls and chords.',
      clearance: 'Clearance comes first. The player’s whole reach along the keyboard sets it, not a still pose. The grey hatch shows roughly where the mallets travel — leave more room on a real stage.',
      tendencies: 'Closer to one end favours it; higher blends the keyboard and adds room and spill. Under the pipes: a coloured, local sound. All tendencies to check by ear.',
    },
  },
  context: {
    zone: 'mr.one',
    typeId: 'mlSdc',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'mlSdc' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'mlSdc' },
      { id: 'hypercardioid', label: 'hypercardioid', typeId: 'mlSdc' },
    ],
    micNoun: 'A small condenser',
    shield: ['mr.nat.oct5', 'mr.acc.oct5', 'mr.nat.oct43', 'mr.acc.oct43'],
    azMax: 40,
    elMax: 40,
    aimBlurb: 'Swing the front up to 40° either way.',
    plan: { u0: L0.xHigh - 300, u1: SIDE_X + 400, v0: L0.zPlayer - 350, v1: FRONT_Z + 500 },
    side: { u0: L0.xHigh - 300, u1: SIDE_X + 400, v0: L0.yNat - 1300, v1: 60 },
    target: 'side',
    frontIds: ['front'],
    targetWord: 'side fill',
    looking: 'One mic above the middle · the side fill at stage left',
    prompt: 'The monitors stay where the stage needs them. Turn the MIC (AIM) or change its PATTERN until the side fill sits in the rejection.',
    activityDone: 'done — the side fill sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies — where a marimba’s bass lives. Use the null to aim, not to promise silence.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°) — straight up, for a mic looking down. The side fill sits almost level with it: try the other patterns.',
    shieldNote: 'Real patterns change with pitch and the stage reflects sound — this is the reasoning, not a prediction. Work out the real positions with the system operator.',
    studioId: 'mr.ctx.studio',
    studioPrompt: 'A studio session has no monitor to reject. The decision changes: one mic, a pair, or a wider room view?',
    studioNote: 'In the studio, record the whole phrase and its decay — not just a note near the mic — and compare one mic, the pairs and a room view at matched level. Switch back to LIVE for the monitor exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not rules: a quiet hall may need only the main pickup; a loud stage, a directional spot or pair placed for direct sound.',
      points: [
        { title: 'THE HALL', text: 'In a quiet acoustic hall, an existing main or area mic may carry the marimba adequately.' },
        { title: 'THE STAGE', text: 'Test the farthest low and high notes, the centre and rolls with the full band. If the PA is mono, sum and listen in mono at several audience positions before a wide pan.' },
        { title: 'THE STUDIO', text: 'A single central mic for a limited span; for a wide solo the pairs, or a moderately distant pair in a good room — not a cartoon-wide picture that weakens the middle.' },
        { title: 'THE ENSEMBLE', text: 'Hear the main array first; add one or two spots when the part needs level or focus — and check them with the mains, in mono.' },
      ],
      body: 'On stage, the monitors stay where the player needs them: turn the mic or choose its pattern so a null faces a loud unwanted source. Never push the player to strike harder to beat a loud stage.',
      warn: 'No mic position alone prevents feedback: the monitors and PA, channel gain and EQ, the room and the open mics all matter. Address nearby levels and monitor placement rather than gain. Never create feedback deliberately.',
    },
  },
  twoMic: {
    A: { typeId: 'mlSdc', pattern: 'cardioid', zone: 'mr.pairHigh' },
    B: { typeId: 'mlSdc', pattern: 'cardioid', zone: 'mr.pairLow' },
    learn: [],
    warn: 'Judge the pair by ear, in mono, at matched levels.',
  },
  practice: {
    gain: 'mr.prac.gain',
    second: 'mr.prac.3',
    mixed: ['mr.mix.1', 'mr.mix.2', 'mr.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: a reference, a pattern’s null, and the delay between two mics.',
  },
  where: { inside: 'under the bars', outside: 'clear of the instrument' },
  viewWords: { side: 'Front view, from the audience,', top: 'From above,' },
  words: {
    instrument: 'marimba',
    player: 'player',
    reference: 'bars',
    inside: 'under the bars',
    outside: 'clear of the instrument',
    axis: 'straight down',
    facing: 'aimed down',
    shield: 'bars in path',
    mountStand: 'Mount: a stand with a boom, reaching over from the audience side, above the mallets — never on a bar, a pipe or a cord',
    mountClip: 'Mount: only an approved mounting system, with the owner’s agreement',
    sheet: 'For a real marimba, with the player’s agreement and the player stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
    viewSide: 'Front view, from the audience,',
    viewTop: 'From above,',
  },
};

export const I08_LESSON: MalletLesson = {
  id: 'I08',
  labId: 'percussion',
  title: 'Marimba',
  subtitle: 'Wooden bars over pipes, five octaves wide: one mic, or a spaced or coincident pair',
  noun: { one: 'marimba', many: 'marimbas' },
  model: MARIMBA_MODEL,
  micTypeIds: ['mlSdc', 'mlDynCard'],
  zones: MARIMBA_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    setupOrder(W, { text: 'Watch the whole passage with the player: range, reach, mallets, travel', early: 'Start with the player and the music.' }, { text: 'Decide what the part needs: the mains, one mic, or a pair', early: 'Know what the music needs before you choose a mic.' }),
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A tuned percussion instrument of wooden (or synthetic) bars laid out like a piano keyboard, each with a pipe under it that helps its note develop. The bars grow longer and wider toward the low notes.', src: 'YMH-MG1' },
    { title: 'WHERE YOU MEET IT', text: 'Solo recitals, percussion ensembles, orchestras and bands, and on recordings — with two, three or four mallets.', src: 'LESSON-MAR' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Warm low notes and clear high ones, rolls that sustain a line, chords across the keyboard. The mallets, the touch and where the bar is struck all shape the tone.', src: 'PAS-TIMBRE' },
    { title: 'ITS SIZE', text: 'A five-octave marimba runs C2 to C7: 61 bars, about 2.5 m long and 56–104 cm deep, its lowest bar about 62 cm long. A four-and-a-third-octave one is about 2.1 m. This lab draws both.', src: 'ADAMS-ALPHA' },
  ],
  sound: {
    stages: words.sound.stages.map((s) => ({ title: s.title, text: s.text })),
    attack: 'The start of each stroke: the mallet’s contact with the wooden bar — round with soft yarn, more articulate with harder mallets the owner allows. A mic close above the struck bars hears more of it, and of the bars nearest it.',
    body: 'The note after it: the bar and its pipe together, short on a marimba, sustained by rolls. A mic higher up hears more of the keyboard and the room. Both are tendencies — instruments and rooms vary.',
    head: { diameterMm: L0.naturals[Math.floor(L0.naturals.length / 2)].L, rods: 0, label: 'one bar of the marimba', strikeSrc: 'YMH-MG1' },
  },
  setting: {
    items: [
      { id: 'marimba', label: 'the marimba (and its player)', short: 'MARIMBA', note: 'The player stands behind it, facing the audience, and moves along its whole length. The drawing every page of this lesson uses.', prov: { kind: 'illustrative', reason: 'a typical ensemble layout; no source gives positions' }, tag: 'THE SOURCE', scene: 'all' },
      { id: 'perc', label: 'other percussion', short: 'PERCUSSION', note: 'Drums and small instruments behind: loud, close, and in every marimba mic.', prov: { kind: 'illustrative', reason: 'a typical ensemble layout' }, tag: 'SPILL', scene: 'all' },
      { id: 'kit', label: 'a drum kit', short: 'DRUMS', note: 'The loudest neighbour. Keep it out of the wanted pickup where you can, while keeping the sightlines.', prov: { kind: 'illustrative', reason: 'a typical ensemble layout' }, tag: 'SPILL', scene: 'all' },
      { id: 'front', label: 'a floor wedge in front of the marimba', short: 'WEDGE', note: 'On the floor in front, facing the player, below a mic’s front: no pattern null reaches it. Keep its level only as high as the player needs.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'side', label: 'a side fill at stage left', short: 'SIDE FILL', note: 'On a stand at about head height beyond the low end, firing across the stage — almost level with a mic above the bars, off its side: a null can face it.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'the audience and the PA', short: 'AUDIENCE', note: 'If the PA is mono, listen to the marimba in mono at several audience positions before a wide pan.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'FEEDBACK PATH', scene: 'stage' },
      { id: 'room', label: 'the studio room', short: 'THE ROOM', note: 'A good room can carry the keyboard’s width and space in a moderately distant pair; moving back adds reflections and outside noise.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: a louder stage generally needs the instrument and a directional spot or pair placed for useful direct sound — tested with the full band, with the farthest notes, the centre and rolls.',
    studio: 'RECORDING: the whole phrase and its decay; one mic for a limited span, the pairs or a room view for a wide solo — checked in mono.',
  },
  diagnostic,
  practice: {
    task: 'Protect the bars, keep full mallet clearance, cover the part’s actual range, tell mallet and touch changes from mic changes, and defend one setup for the studio and one for live sound. With a real marimba and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'range', label: 'Range the part plays, mallets used', kind: 'text' },
      { id: 'mics', label: 'Mics', kind: 'choice', choices: ['main pickup only', 'one mic', 'spaced pair', 'coincident pair', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'height', label: 'Height above the bars, spacing, aim', kind: 'text' },
      { id: 'clear', label: 'Clearances checked (reach, mallets, sightline)', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    ...FAMILY_UNKNOWNS,
    { text: 'The Helmholtz boxes under C2–F2 (where a maker uses them) are drawn 150 mm deep, as wide as the bar pitch allows, down to 150 mm above the floor — a drawing default; real boxes and the arched pipe layouts some makers use are not drawn.', dims: [] },
    { text: 'The lowest bar’s width is the drawn model’s printed 72 mm (another maker prints 80 mm for its own); its length (about 620 mm) is that other maker’s generic figure.', dims: [] },
    { text: 'The bar thickness (25.4 → 19.05 mm) is another maker’s figure drawn on this model.', dims: [] },
    { text: 'The wider spaced pair (about 120 cm apart, 70 cm high) is a drawing default for “widen it on a five-octave part”, not a published figure.', dims: [] },
  ],
  live: { wedges: malletWedges({ frontZ: FRONT_Z, sideX: SIDE_X }) },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every marimba, player, mallet and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a five-octave (or four-and-a-third) marimba with bar and pipe lengths worked out (the pipes as quarter wavelengths at A = 442 Hz, the lowest as boxes), a plain bar’s shapes, mic patterns and the two-mic comb as textbook shapes, and motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.',
  copy,
  mallet: words,
};
