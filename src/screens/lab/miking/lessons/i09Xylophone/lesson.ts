/**
 * I09 XYLOPHONE — the lesson's pages as DATA (blueprint §7). Words from the
 * owner's lesson (docs/labs/miking/source_text/Xylophone-Miking-Technique-
 * Research.txt, "L<n>" in COMMENTS only) with the fixes in CORRECTIONS_LOG.md
 * (I2-X*) applied — notably L74's pair is a COINCIDENT pair, and the
 * advice on plastic mallets genuinely disagrees between two documents from
 * one maker (said as "advice differs; follow this instrument's maker").
 * OWNER RULING 2026-10-04: starting points, never dogma; no source, brand or
 * model in learner text; no badges; FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, LessonPages, PageContent, SourcePageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import type { LessonCopy } from '../../engine/model/copy.ts';
import { BRAND_REASON, CLEAR_REASON, cardioidNull, distortionSymptom, firstNotch, gainCheck, moveRemovesDelay, polarityKeepsDelay, POWER_REASON, setupOrder } from '../shared/concert/commonItems.ts';
import { BEFORE_STANDS, coincidentCheck, hearingCheckM, malletAxes, malletWedges, monoSymptomM, quickHearingM, rattleSymptom, shurePairs, spacedMonoCheck, weakEndSymptom, type MW } from '../shared/mallets/content.ts';
import type { MalletLesson, MalletWords } from '../shared/mallets/family.ts';
import { FAMILY_UNKNOWNS } from '../shared/mallets/malletModel.ts';
import { XYLO_GEOM, XYLO_MODEL } from './geometry.ts';
import { XYLO_FAM, XYLO_ZONES } from './model.ts';

const W: MW = { p: 'xy', the: 'the xylophone', noun: 'xylophone', player: 'player', loudest: 'the hardest accent' };
const L0 = XYLO_GEOM.layouts.yx;
const SIDE_X = 2200;
const FRONT_Z = 1300;

const pages: LessonPages = {
  instrument: {
    title: 'Meet the xylophone',
    goal: 'Get to know the xylophone — what it is, where you meet it, what it does in the music, and its parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Hard wooden (or synthetic) bars in two rows, higher and brighter than a marimba, over tubes. It sounds an octave higher than written. Compact — but a part that runs the whole keyboard still needs covering.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a mallet stroke becomes a bright, short note — the bar’s shapes, the tube under it — and where the sound leaves.',
    credit: { scenarios: ['xy.snd.1', 'xy.snd.2', 'xy.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'A hard bar, struck, rings briefly about its still points; the tube under it — a quarter wavelength long — rings with it. The mallet decides much of the brightness and the click.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the xylophone sits — the percussion section of an orchestra or band — its neighbours, the player’s space, and what to check before any mic.',
    credit: { scenarios: ['xy.set.1', 'xy.set.hear', 'xy.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Hear the passage from the room first: low, middle and high notes, fast repeated notes and the loudest accent. Mallets are the owner’s and the maker’s call, never a mic fix.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the xylophone by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['xy.mic.1', 'xy.mic.2', 'xy.mic.3', 'xy.mic.4', 'xy.rec.1'], note: 'Answer the five checks (one reaches back to how the xylophone sounds).' },
    takeaway: 'A directional mic over the bars is a common start; a brighter mic or closer placement cannot make an unsuitable mallet right, and a darker mic does not make a harmful mallet safe.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — one mic above the middle of the played notes, one of a spaced pair, or a safe off-axis position — then move the mic and see what changes.',
    credit: { scenarios: ['xy.place.1', 'xy.place.2', 'xy.place.3', 'xy.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different suggested starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'A suggested zone is a place to begin, measured from the bars — not a rule. Only where it clears both hands and every stroke; move higher or off-axis when it does not.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s real rejection faces a loud unwanted source — and know how an orchestra or a studio changes the decision.',
    credit: { scenarios: ['xy.ctx.1', 'xy.ctx.2', 'xy.ctx.studio', 'xy.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the side fill sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Aim the real pattern’s rejection at loud neighbours and speakers. In an orchestra the mains may already carry the xylophone’s bright articulation.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'Compare the two published pairs — spaced about 61 cm apart, or grilles together at 135° — by what a bar at each end does to them.',
    credit: { scenarios: ['xy.two.1', 'xy.two.2', 'xy.two.3', 'xy.two.4'], interactive: 'pairCompared', note: 'Look at the spaced pair and the coincident pair with an end bar as the source, then answer the four checks.' },
    takeaway: 'Grilles together, the capsules see no time difference and the mono sum holds together; spaced, an end bar arrives twice. If stereo is unnecessary on stage, one well-placed mic may be clearer.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the mallet and the coverage first, then the instrument for rattles, then gain staging — before EQ or a gate.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two different briefs, and say when one mic is enough.',
    credit: { scenarios: ['xy.prac.order', 'xy.prac.gain', 'xy.prac.setup1', 'xy.prac.setup2', 'xy.prac.3', 'xy.mix.1', 'xy.mix.2', 'xy.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'The maker’s mallet guidance followed, the bars and the player’s space protected, the played range covered, attack judged against pitch, and a setup defended after mono and ensemble checks.',
  },
};

const scenarios: MikingScenario[] = [
  {
    id: 'xy.snd.1',
    page: 'sound',
    prompt: 'A xylophone part is written on the staff. Where does it sound?',
    options: ['An octave higher than written', 'Exactly as written on the staff', 'An octave lower than written'],
    correct: 'An octave higher than written',
    explain: 'Concert xylophones sound an octave above the written notes — part of why they cut through an orchestra.',
    why: {
      'Exactly as written on the staff': 'The xylophone is a transposing instrument by an octave.',
      'An octave lower than written': 'The other way: it sounds higher than written.',
    },
  },
  {
    id: 'xy.snd.2',
    page: 'sound',
    prompt: 'A harder mallet on the same xylophone bar. What tends to change?',
    options: ['More upper-frequency articulation, and maybe a click or wear', 'Only the level: the tone of a bar stays exactly the same', 'A lower pitch, because the bar bends further under a harder blow'],
    correct: 'More upper-frequency articulation, and maybe a click or wear',
    explain: 'Mallet hardness shapes brightness and attack; harder often brings more articulation — and can bring an unwanted click or wear the bars.',
    why: {
      'Only the level: the tone of a bar stays exactly the same': 'The mallet changes which shapes and how much of the bar’s attack you hear.',
      'A lower pitch, because the bar bends further under a harder blow': 'The pitch belongs to the bar; the mallet shapes the attack.',
    },
  },
  {
    id: 'xy.snd.3',
    page: 'sound',
    prompt: 'Why is the tube under the xylophone’s lowest bar longer than the one under its highest?',
    options: ['Each tube is about a quarter wavelength of its note', 'The low bars are heavier, so they need much more support underneath', 'To make the low notes louder than the high ones'],
    correct: 'Each tube is about a quarter wavelength of its note',
    explain: 'Open under the bar and closed at the bottom, a tube rings at its bar’s note: lower note, longer tube.',
    why: {
      'The low bars are heavier, so they need much more support underneath': 'The cords hold the bars; the tubes hold air.',
      'To make the low notes louder than the high ones': 'The length follows the pitch, not a wanted level.',
    },
  },
  {
    id: 'xy.set.1',
    page: 'setting',
    prompt: 'The engineer wants a brighter xylophone. Someone suggests metal mallets. What is the answer?',
    options: ['No — metal mallets can damage or break the bars', 'Yes — metal is the brightest and the bars can take it', 'Yes, as long as the player strikes a little softer'],
    correct: 'No — metal mallets can damage or break the bars',
    explain: 'The maker’s care advice says never metal on xylophone bars. Change placement and balance instead — and check any mallet change with the owner.',
    why: {
      'Yes — metal is the brightest and the bars can take it': 'Metal can damage or break xylophone bars.',
      'Yes, as long as the player strikes a little softer': 'The material is the problem, not only the force.',
    },
  },
  hearingCheckM(W, 'setting'),
  {
    id: 'xy.set.2',
    page: 'setting',
    prompt: 'One document says plastic mallets suit a xylophone; another, from the same maker, says to avoid them. What do you do?',
    options: ['Follow this instrument’s maker and the owner’s judgment', 'Use plastic mallets, because the first of the documents allows it', 'Use plastic only for the loud passages'],
    correct: 'Follow this instrument’s maker and the owner’s judgment',
    explain: 'The advice differs in context and specificity; it cannot be made into one rule. The make, model, bar material and the owner decide — never the sound engineer.',
    why: {
      'Use plastic mallets, because the first of the documents allows it': 'Another document warns against it: this instrument’s maker and owner decide.',
      'Use plastic only for the loud passages': 'Damage does not depend on the passage. Ask the owner.',
    },
  },
  {
    id: 'xy.mic.1',
    page: 'microphone',
    prompt: 'The xylophone sounds harsh in the full arrangement. What comes first?',
    options: ['Talk about safe mallets and touch, and the mic’s view', 'Heavy EQ on the xylophone channel', 'A darker microphone, so that the harder mallet can stay in use'],
    correct: 'Talk about safe mallets and touch, and the mic’s view',
    explain: 'Discuss safe mallet and touch choices and the mic’s perspective with the player before heavy equalisation.',
    why: {
      'Heavy EQ on the xylophone channel': 'EQ last: the source and the placement come first.',
      'A darker microphone, so that the harder mallet can stay in use': 'A darker mic does not make a harmful mallet safe.',
    },
  },
  {
    id: 'xy.mic.2',
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
    id: 'xy.mic.3',
    page: 'microphone',
    prompt: 'Cardioid and supercardioid patterns aimed at a loud neighbour: do they reject it the same way?',
    options: ['No — their nulls and rear pickup differ', 'Yes — all directional mics reject the rear the same way', 'Yes — the rejection depends only on the distance'],
    correct: 'No — their nulls and rear pickup differ',
    explain: 'A cardioid rejects most straight behind; a supercardioid has its nulls off the rear and a small rear lobe. Aim the actual pattern.',
    why: {
      'Yes — all directional mics reject the rear the same way': 'A supercardioid picks up a little directly behind.',
      'Yes — the rejection depends only on the distance': 'Distance changes level; the pattern sets where the nulls are.',
    },
  },
  {
    id: 'xy.mic.4',
    page: 'microphone',
    prompt: 'Is a bright, close mic the way to more pitch from the xylophone?',
    options: ['Not by itself — closer can bring more click than pitch', 'Yes — the closer the mic, the more pitch it hears from the bars', 'Yes — brightness is the same thing as pitch'],
    correct: 'Not by itself — closer can bring more click than pitch',
    explain: 'A close mic over a struck bar can emphasise mallet impact; a higher or less direct view can balance click and pitch. Judge in the full phrase.',
    why: {
      'Yes — the closer the mic, the more pitch it hears from the bars': 'Closer often means more impact and one region — not more pitch.',
      'Yes — brightness is the same thing as pitch': 'Brightness is the upper detail; pitch is the note. A click can be bright and pitchless.',
    },
  },
  {
    id: 'xy.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Which part of the xylophone holds each bar so it rings freely?',
    options: ['The cord through its still points, on posts', 'The tube under it, pressed against it', 'The frame rail, clamped tight at both of its ends'],
    correct: 'The cord through its still points, on posts',
    explain: 'The cord passes through the bar where it stays still as it rings.',
    why: {
      'The tube under it, pressed against it': 'The tube hangs under the bar with a gap; it holds air.',
      'The frame rail, clamped tight at both of its ends': 'A clamped bar would be damped; it hangs on its cord.',
    },
  },
  {
    id: 'xy.place.1',
    page: 'placement',
    prompt: 'The one-mic starting point is 45–75 cm above the bars. The player’s hardest stroke reaches that height. What now?',
    options: ['Move higher or to a safe off-axis position', 'Keep it there: the band is the recommendation', 'Ask the player to play that passage more softly'],
    correct: 'Move higher or to a safe off-axis position',
    explain: 'The starting point applies only where it clears both hands and every stroke. Move higher, or off-axis on the audience side.',
    why: {
      'Keep it there: the band is the recommendation': 'Clearance comes before any number.',
      'Ask the player to play that passage more softly': 'The music sets the strokes; the mic moves.',
    },
  },
  {
    id: 'xy.place.2',
    page: 'placement',
    prompt: 'A passage on a few neighbouring bars, then one that runs the whole keyboard. What changes for the mics?',
    options: ['One mic may suit the first; the second needs a wider view or a pair', 'Nothing: a single mic over the middle covers the whole keyboard alike', 'The first needs a pair; the second needs only one mic'],
    correct: 'One mic may suit the first; the second needs a wider view or a pair',
    explain: 'The part decides: a few neighbouring bars suit one mic; a part that traverses the keyboard needs a wider view or a pair.',
    why: {
      'Nothing: a single mic over the middle covers the whole keyboard alike': 'A close single mic favours the bars nearest it.',
      'The first needs a pair; the second needs only one mic': 'The other way round: the wide part is the harder one to cover.',
    },
  },
  {
    id: 'xy.place.3',
    page: 'placement',
    prompt: 'A mic below the tubes for a deliberate local colour. What must it never do?',
    options: ['Go into a tube or touch a bar', 'Face upward toward the bars', 'Sit lower than the frame’s stretcher'],
    correct: 'Go into a tube or touch a bar',
    explain: 'Never insert a mic into a tube, attach it to a bar or put equipment on the bars; and do not assume an under-tube signal is the whole instrument.',
    why: {
      'Face upward toward the bars': 'Facing up is how that position works; touching is the problem.',
      'Sit lower than the frame’s stretcher': 'Height is not the rule; contact with the instrument is.',
    },
  },
  {
    id: 'xy.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · A harder mallet and a closer mic together. What risk grows?',
    options: ['More click than pitch — and wear on the bars', 'Less brightness and less attack from all of the bars', 'A lower pitch from the bars'],
    correct: 'More click than pitch — and wear on the bars',
    explain: 'Both push toward impact; the harder mallet also risks the bars. Move the mic first.',
    why: {
      'Less brightness and less attack from all of the bars': 'Both push brightness up, not down.',
      'A lower pitch from the bars': 'Neither changes the bar’s pitch.',
    },
  },
  {
    id: 'xy.ctx.1',
    page: 'context',
    prompt: 'An orchestra recording. The xylophone’s articulation already shows in the main array. What about a spot?',
    options: ['Add one only if needed, brought in at a musical level', 'Add one anyway, so that the xylophone has its own channel', 'Mute the mains while the xylophone plays'],
    correct: 'Add one only if needed, brought in at a musical level',
    explain: 'A close spot can disproportionately add mallet contact and bleed from drums or brass. Listen to the mains first; check the spot in mono with them.',
    why: {
      'Add one anyway, so that the xylophone has its own channel': 'A channel is not a reason: a spot adds spill and timing.',
      'Mute the mains while the xylophone plays': 'The mains carry the orchestra; a spot is blended under them.',
    },
  },
  {
    id: 'xy.ctx.2',
    page: 'context',
    prompt: 'Raising the xylophone mic gives a fuller keyboard. What else tends to happen on a loud stage?',
    options: ['More spill and less gain before feedback', 'Less spill, because the mic is farther from the stage', 'Nothing else changes when only the height does'],
    correct: 'More spill and less gain before feedback',
    explain: 'Higher hears more of the keyboard — and more of the neighbours and the speakers. Move in small steps.',
    why: {
      'Less spill, because the mic is farther from the stage': 'Farther from the bars means the neighbours are relatively louder.',
      'Nothing else changes when only the height does': 'Height changes the balance of everything the mic hears.',
    },
  },
  {
    id: 'xy.ctx.studio',
    page: 'context',
    prompt: 'A solo overdub in a good room. Is a separate room mic needed?',
    options: ['It is an artistic option after a usable main pickup', 'Yes — a xylophone is not complete without one', 'No — a room mic does not suit a bright, hard xylophone at all'],
    correct: 'It is an artistic option after a usable main pickup',
    explain: 'A room mic is an option once the main pickup works, at no universal distance — checked in mono with the close mics.',
    why: {
      'Yes — a xylophone is not complete without one': 'It is a choice, not a requirement.',
      'No — a room mic does not suit a bright, hard xylophone at all': 'In a good room it can add natural space; try it.',
    },
  },
  {
    id: 'xy.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Which way is the xylophone’s off-axis starting point?',
    options: ['Toward the audience, up at about 45°, aimed back at the bars', 'Directly over the player’s hands at the middle of the keyboard, aimed down', 'Under the tubes, aimed up at the bars'],
    correct: 'Toward the audience, up at about 45°, aimed back at the bars',
    explain: 'A safe off-axis view on the audience side, out of the mallets’ way.',
    why: {
      'Directly over the player’s hands at the middle of the keyboard, aimed down': 'That is in the mallets’ way.',
      'Under the tubes, aimed up at the bars': 'That is the deliberate local colour, not the off-axis view.',
    },
  },
  polarityKeepsDelay(W),
  firstNotch(W),
  coincidentCheck(W),
  spacedMonoCheck(W),
  gainCheck(W),
  {
    id: 'xy.prac.3',
    page: 'practice',
    prompt: 'When is ONE mic over the xylophone enough?',
    options: ['When the part is focused and the stage does not need stereo', 'When the xylophone is the loudest instrument on stage', 'Only for a recording session, not for a live show on a stage'],
    correct: 'When the part is focused and the stage does not need stereo',
    explain: 'If stereo is unnecessary on stage, a single well-placed mic can give clearer control with less spill.',
    why: {
      'When the xylophone is the loudest instrument on stage': 'Its level does not decide coverage; the part’s range does.',
      'Only for a recording session, not for a live show on a stage': 'One mic often serves a live show best.',
    },
  },
  {
    id: 'xy.mix.1',
    page: 'practice',
    prompt: 'A starting point says “about 45–75 cm above the middle of the played notes”. What else do you need?',
    options: ['The bars as reference, and the player’s full striking arc', 'The xylophone’s brand, so the numbers match its size', 'Nothing more: the band says exactly where it goes'],
    correct: 'The bars as reference, and the player’s full striking arc',
    explain: 'A distance belongs to its reference; the arc decides whether the band is usable at all.',
    why: {
      'The xylophone’s brand, so the numbers match its size': 'The brand does not change the reference; the bars do.',
      'Nothing more: the band says exactly where it goes': 'A band is a place to begin; clearance comes first.',
    },
  },
  cardioidNull(W),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  {
    id: 'xy.s.click',
    observation: 'Too much click, too little pitch',
    firstChecks: 'Is the mallet appropriate? Is the mic too near a struck bar? Confirm a permitted mallet, then compare a safe higher or off-axis position.',
    options: ['The mallet with the player, then a higher or off-axis view', 'Cut the treble with EQ until the click is gone', 'Ask for a harder mallet so the pitch cuts through'],
    correct: 'The mallet with the player, then a higher or off-axis view',
    explain: 'Source first (safely), then the view. EQ cannot add the pitch a too-close mic misses.',
    why: {
      'Cut the treble with EQ until the click is gone': 'EQ dulls the whole instrument. Find the cause first.',
      'Ask for a harder mallet so the pitch cuts through': 'Harder adds click — and can harm the bars.',
    },
  },
  weakEndSymptom(W),
  rattleSymptom(W, 'the frame, the cords and the tubes'),
  monoSymptomM(W),
  {
    id: 'xy.s.spill',
    observation: 'Feedback or heavy spill',
    firstChecks: 'Where are the monitors and the neighbours relative to the mic’s pattern? Improve the stage layout and the aim; use fewer open mics.',
    options: ['The layout, the aim of the real pattern, the open mics', 'Turn the xylophone channel up until it wins over the spill', 'Add a second xylophone mic to drown out the rest'],
    correct: 'The layout, the aim of the real pattern, the open mics',
    explain: 'Fix the geometry and the channel count before gain or aggressive EQ.',
    why: {
      'Turn the xylophone channel up until it wins over the spill': 'More gain brings the spill — and feedback — up too.',
      'Add a second xylophone mic to drown out the rest': 'Every open mic adds spill and lowers the gain before feedback.',
    },
  },
  distortionSymptom(W),
];

const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a suggested starting point, measured from the bars', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };
const MALLET_REASON: SetupReason = { id: 'r.mallet', label: 'A brighter mic lets the player use metal mallets safely', role: 'wrong', feedback: 'No mic makes an unsuitable mallet safe: metal can damage or break the bars.' };

const setupTasks: SetupTask[] = [
  {
    id: 'xy.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · An overdub: a fast passage that runs the whole keyboard. Two channels; phantom power is available.',
    setups: [
      { id: 'a', label: 'Two condensers grilles together, 135° apart, about 46 cm above the middle', ok: true, power: 'phantom', feedback: 'The coincident pair: a steady mono sum for a fast, wide part.' },
      { id: 'b', label: 'Two condensers spaced about 61 cm apart, about 46 cm above the bars, aimed down', ok: true, power: 'phantom', feedback: 'The spaced pair: check the middle and the mono sum.' },
      { id: 'c', label: 'One mic 10 cm over the middle bars', ok: false, power: 'phantom', feedback: 'Inside the mallets’ travel, and it would favour a few bars.' },
      { id: 'd', label: 'One mic inside a tube', ok: false, power: 'phantom', feedback: 'Never into a tube or onto a bar.' },
      { id: 'e', label: 'A mic taped to a bar post', ok: false, power: 'none', feedback: 'Nothing is attached to the instrument.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.mono', label: 'The pair is checked in mono as well as stereo', role: 'optional', feedback: 'A fair studio reason.' }, BRAND_REASON, MALLET_REASON],
    explain: 'More than one setup passes: a starting point from the bars, clear of the strokes, power that matches the mics, and a mono check.',
  },
  {
    id: 'xy.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A pit band on a loud stage, a short xylophone part on a few bars. One channel, NO phantom power; a mono PA.',
    setups: [
      { id: 'a', label: 'One compact dynamic about 45–75 cm above the played bars, clear of every stroke', ok: true, power: 'none', feedback: 'One safe directional mic over the played notes; no phantom needed.' },
      { id: 'b', label: 'One compact dynamic at the safe off-axis position on the audience side', ok: true, power: 'none', feedback: 'A safe off-axis view; check the spill from neighbours.' },
      { id: 'c', label: 'One condenser over the played bars', ok: false, power: 'phantom', feedback: 'No phantom power on this input.' },
      { id: 'd', label: 'A spaced pair panned hard left and right', ok: false, power: 'none', feedback: 'One channel and a mono PA.' },
      { id: 'e', label: 'Metal mallets, so the part cuts through without a mic', ok: false, power: 'none', feedback: 'Metal can damage or break the bars.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'A directional mic aimed with its rejection toward loud neighbours', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, MALLET_REASON],
    explain: 'Two setups pass: one safe directional mic for a focused part, power this input can supply, and the bars protected.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: a mallet strikes the middle of a bar. What do the bar’s ends do?', options: ['They move up while the middle goes down', 'They move down with the middle', 'They stay still — only the middle moves'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch the whole bar.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: from one mic above the middle to the off-axis position on the audience side. What changes?', options: ['Less click, more of the keyboard and room', 'More click from one bar', 'It depends on the passage and the room'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The side fill sits off to the side of a mic looking down at the bars. Which pattern can turn a null toward it?', options: ['Only a cardioid', 'A supercardioid or hypercardioid', 'None of them'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'Grilles together, angled 135° apart: the lowest bar sounds. Which reaches the two mics differently?', options: ['Its arrival time', 'Its level', 'Neither'], after: 'Now step BAR to an end of the keyboard with each PAIR, and watch DELAY and LEVEL.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'xy.q.1',
    covers: 'instrument',
    prompt: 'How does a concert xylophone sound compared with its written notes?',
    options: ['An octave higher', 'Exactly as it is written', 'An octave lower'],
    correct: 'An octave higher',
    explain: 'It sounds an octave above the written notes.',
    why: { 'Exactly as it is written': 'It transposes: it sounds an octave above the page.', 'An octave lower': 'Higher, not lower: an octave above.' },
  },
  {
    id: 'xy.q.2',
    covers: 'instrument',
    prompt: 'Which mallets must never touch a xylophone’s bars?',
    options: ['Metal mallets', 'Rubber mallets', 'Yarn mallets'],
    correct: 'Metal mallets',
    explain: 'Metallic mallets can damage or break the bars. Other choices follow the maker and the owner.',
    why: { 'Rubber mallets': 'Hard rubber is among the mallets suited to a xylophone.', 'Yarn mallets': 'Yarn is soft; the warning is about metal.' },
  },
  {
    id: 'xy.q.3',
    covers: 'sound',
    prompt: 'What does the tube under a xylophone bar do?',
    options: ['Its air rings with the bar at its note', 'It holds the bar up at the right playing height', 'It damps the bar so notes stay short'],
    correct: 'Its air rings with the bar at its note',
    explain: 'A quarter wavelength long, open at the top, closed at the bottom.',
    why: { 'It holds the bar up at the right playing height': 'The cords and posts hold the bar.', 'It damps the bar so notes stay short': 'The tube supports the note.' },
  },
  {
    id: 'xy.q.4',
    covers: 'sound',
    prompt: 'A harder mallet, the same bar: what tends to change?',
    options: ['More bright articulation, maybe a click', 'Only the level, not the tone at all', 'A lower pitch from the bar under the mic'],
    correct: 'More bright articulation, maybe a click',
    explain: 'Hardness shapes brightness and attack — and can wear the bars.',
    why: { 'Only the level, not the tone at all': 'The mallet shapes the tone too.', 'A lower pitch from the bar under the mic': 'The pitch is the bar’s.' },
  },
  {
    id: 'xy.q.5',
    covers: 'setting',
    prompt: 'Two documents from one maker disagree about plastic mallets. Who decides for this xylophone?',
    options: ['This instrument’s maker and its owner', 'The sound engineer, by ear at the session', 'Whichever of the two documents is newer'],
    correct: 'This instrument’s maker and its owner',
    explain: 'The advice differs by context; the make, model, bar material and the owner decide.',
    why: { 'The sound engineer, by ear at the session': 'Instrument care is not a mix decision.', 'Whichever of the two documents is newer': 'Newer is not more specific to this instrument.' },
  },
  quickHearingM(W),
];

const words: MalletWords = {
  sound: {
    stages: [
      { title: 'The mallet lands', text: 'A hard rubber or synthetic mallet lands on the middle of a rosewood bar. The ATTACK is short and bright — the mallet decides much of it.' },
      { title: 'The bar bends and rings', text: 'The bar bends — the middle down, both ends up — and springs back: its lowest shape, drawn far larger than it moves. The cord passes through its two still points.' },
      { title: 'The air in the tube rings with it', text: 'Under the bar, its tube — open at the top, closed at the bottom, a quarter wavelength long — rings with it. On this model only some sharps and flats have a tube.', byVariant: { concert: 'Under the bar, its tube — open at the top, closed at the bottom, a quarter wavelength long — rings with it. On this model every bar has one.' } },
      { title: 'Sound leaves — up and out', text: 'Sound leaves the bar and the tube’s mouth, up and out. A xylophone note is short and bright, and sounds an octave above the written note.' },
    ],
    cells: [
      { k: 'BAR', at: ['STRUCK', 'BENDING', 'RINGING', 'RINGING'], flex: 1 },
      { k: 'TUBE AIR', at: ['AT REST', 'AT REST', 'RINGING', 'RINGING'], flex: 1.1 },
      { k: 'SOUND', at: ['—', '—', '—', 'UP AND OUT'], flex: 1.1 },
    ],
    looking: 'One bar and its tube · seen from the low end · the player at the left',
    reveal: 'The middle goes down while the ends come up: a bar bends about two still points.',
    after: 'Then the note dies away quickly — a xylophone is bright and short. The mallet and the touch are the player’s; the mic’s height and angle are yours.',
    shapes: {
      intro: 'This is the lowest shape — the note. The middle and the ends move opposite ways about two still points, where the cord passes.',
      tuned: 'A plain bar’s upper shapes ring at uneven ratios (about 2.76 and 5.40 times the lowest). Xylophone bars are shaped to tune an upper shape — makers call it quint tuning — so a real bar’s ratios differ from this plain one; a marimba’s are tuned differently, which is part of why they sound different.',
      notes: ['A shape is set moving only as much as the bar moves at the strike point in that shape: where the mallet lands is part of the tone.'],
    },
    tube: {
      intro: 'Open under the bar, closed at the bottom: the tube rings at the note whose quarter wavelength fits it — about {len} here. The highest notes need tubes only a few centimetres long.',
      visible: 'The air moves most at the open mouth and presses most at the closed end.',
      noTube: 'No tube under this bar: on this model only the sharps and flats that need one have a tube.',
    },
  },
  two: {
    presets: shurePairs('mlSdc', XYLO_GEOM.barY),
    looking: 'Two mics over the xylophone · paths from one bar',
    prompt: 'Choose a PAIR, then step BAR to the lowest and the highest bar. Watch DELAY and LEVEL — and the comb below.',
    learn: [
      'Two layouts to begin from, as alternatives: two mics aimed down about 46 cm (1½ ft) above the bars, either about 61 cm (2 ft) apart, or grilles together angled about 135° apart — a coincident pair. Check clearance and adapt the aim to the played range.',
      'Spaced: one toward the lower region, one toward the higher, overlapping in the middle — notes reaching both at different times can change colour when summed. Coincident: the capsules as close as the mount permits; the time differences vanish and the mono sum holds together more predictably; width depends on the patterns and the aim.',
      'A width that balances in headphones can be awkward for an audience across a mono or partly stereo PA. If stereo is unnecessary on stage, a single well-placed mic may give clearer control with less spill.',
    ],
    warn: 'A simplified picture: one point on one bar, straight paths, no room. Judge a real pair by ear — each mic alone, both together, and in mono — at matched levels.',
  },
};

const copy: Partial<LessonCopy> = {
  variantKey: 'SIZE',
  variantShort: { yx: 'three and a half octaves', concert: 'four octaves' },
  sceneSubject: { yx: 'a three-and-a-half-octave xylophone', concert: 'a four-octave xylophone' },
  viewTag: { side: 'FRONT · FROM THE AUDIENCE', top: 'FROM ABOVE · AUDIENCE BELOW' },
  axes: malletAxes(XYLO_FAM),
  instrument: {
    figureBadge: 'A three-and-a-half-octave xylophone, from the audience',
    figureLabel: 'Front view of a xylophone from the audience: two rows of rosewood bars seen end-on, tubes under the naturals and some of the sharps and flats — long at the low end on the right, short at the high end — the tan frame on casters, and the player behind with two mallets.',
    partsBadge: 'A three-and-a-half-octave xylophone · tap a part to name it',
    partsLooking: { side: 'Front view · from the audience · low end on the right', top: 'From above · the player at the top, the audience below' },
    partsIdle: 'The mallet strikes a hard bar; the tube under it rings with it. The next page shows how.',
    variantNotes: { concert: 'FOUR OCTAVES: C4 to C8 — slightly graduated bars, a tube under every one, a deeper frame.' },
  },
  setting: {
    kitA11y: 'The percussion section from above: the xylophone with its player, other percussion behind, a drum kit to one side.',
    kitLanding: 'Tap anything around the xylophone — or step through ITEM — to see what it means for a xylophone mic. There is nothing to answer yet.',
    kitIdle: 'The xylophone in the percussion section: loud neighbours on every side, and the brass often in front.',
    leftHanded: 'The low end is on the player’s left. Check the passage’s lowest and highest notes with the player.',
    stageA11y: 'The section on a stage, from above: a floor wedge in front of the xylophone, a side fill on stage left, the audience to the right.',
    studioA11y: 'The xylophone in a studio room, from above: the walls around it, no monitors.',
    stageIdle: 'Two monitors: a wedge in front, facing the player, and a side fill at stage left. The PA faces the audience.',
    studioIdle: 'No monitors. A room pair farther away can add natural space — and room noise.',
    before: [
      { title: 'LISTEN FROM THE ROOM FIRST', text: 'Low, middle and high notes, single strokes, fast repeated notes and the loudest accent — from where the audience will hear them. The player may change mallets for a colour.' },
      { title: 'MALLETS ARE THE OWNER’S', text: 'Never metal on xylophone bars. Advice on other materials differs between documents: this instrument’s maker and its owner decide. If a brighter sound needs an unsuitable mallet, change the placement instead.' },
      BEFORE_STANDS,
    ],
    plan: {
      title: 'In the section',
      badge: 'A percussion section from above · a typical layout · the audience to the right',
      looking: 'Plan · the xylophone in the percussion section, the audience to the right',
      stageBadge: 'From above · two monitors where a stage often puts them · audience to the right',
      studioBadge: 'From above · a studio room',
      stageLooking: 'Plan · the section on a stage',
      studioLooking: 'Plan · the xylophone in a studio',
      widePrompt: 'Switch STAGE / STUDIO, and tap what is new around the xylophone.',
    },
  },
  placement: {
    workedZone: { yx: 'xy.one', concert: 'xy.one' },
    workedLine: 'This starting point is also read against {line}.',
    workedAim: 'Aim down at the bars — the starting point counts while the mic looks within 30° of straight down.',
    workedClear: 'Only where it clears both hands and every stroke, the strongest included, and out of the player’s sightline. Clearance comes first, and the player stops before a real stand moves.',
    blocked: { yx: ' Move it higher, or to the off-axis position on the audience side.', concert: ' Move it higher, or to the off-axis position on the audience side.' },
    reveal: 'Off-axis on the audience side tends to soften the click and blend the keyboard, with more room and neighbours; above the middle is more direct — and passages differ, so “it depends” is fair too.',
    typeNotes: { mlDynCard: 'A dynamic can work too, especially live: choose by response, pattern, power and mount, and compare by ear.' },
    note: 'Clearance comes first: stop the player before moving a real stand. The bands are starting points, not safety clearances.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we suggest you begin: one mic about 45–75 cm above the middle of the played notes, aimed down; one of a spaced pair; a safe off-axis position on the audience side; and, only for a deliberate colour, a mic under the tubes. Starting points, not rules.',
      separate: 'Height, place and angle are separate variables: change one at a time, with low, middle and high notes, fast figures and the loudest accent.',
      clearance: 'Clearance comes first: walk the full phrase with the player before locking anything. The mallets’ keep-clear area appears as the mic gets close — in red, with the reason, if a move is stopped — and shows roughly where they travel.',
      tendencies: 'Closer tends to bring more mallet impact and one region; farther or off-axis blends more bars and more room. All tendencies to check by ear.',
    },
  },
  context: {
    zone: 'xy.one',
    typeId: 'mlSdc',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'mlSdc' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'mlSdc' },
      { id: 'hypercardioid', label: 'hypercardioid', typeId: 'mlSdc' },
    ],
    micNoun: 'A small condenser',
    shield: ['xy.nat.yx', 'xy.acc.yx', 'xy.nat.concert', 'xy.acc.concert'],
    azMax: 40,
    elMax: 40,
    aimBlurb: 'Swing the front up to 40° either way.',
    plan: { u0: L0.xHigh - 300, u1: SIDE_X + 400, v0: L0.zPlayer - 350, v1: FRONT_Z + 500 },
    side: { u0: L0.xHigh - 300, u1: SIDE_X + 400, v0: L0.yNat - 1250, v1: 60 },
    target: 'side',
    frontIds: ['front'],
    targetWord: 'side fill',
    looking: 'One mic above the middle · the side fill at stage left',
    prompt: 'The monitors stay where the stage needs them. Turn the MIC (AIM) or change its PATTERN until the side fill sits in the rejection.',
    activityDone: 'done — the side fill sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies. Use the null to aim, not to promise silence.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°) — straight up, for a mic looking down. The side fill sits almost level with it: try the other patterns.',
    shieldNote: 'Real patterns change with pitch and the stage reflects sound — this is the reasoning, not a prediction. Work out the real positions with the system operator.',
    studioId: 'xy.ctx.studio',
    studioPrompt: 'A studio session has no monitor to reject. The decision changes: one view, a pair, or a room mic too?',
    studioNote: 'In the studio, compare at matched level with the loudest attack and the quietest tail — and check close and distant mics together in mono. Switch back to LIVE for the monitor exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not rules: an orchestra’s mains may carry the xylophone; a loud band may need a closer directional spot.',
      points: [
        { title: 'THE ORCHESTRA', text: 'Listen to the mains before a spot: a close spot can add mallet contact and bleed from drums or brass. Bring it in at a musical level and check it in mono with the mains.' },
        { title: 'THE LOUD STAGE', text: 'Choose an overhead directional mic or a safe pair by the stage level and the coverage needed; relocate the instrument where possible.' },
        { title: 'THE STUDIO', text: 'One overhead view for a restricted range; the pairs if the whole keyboard is active; a room mic as an artistic option once the main pickup works.' },
        { title: 'THE PA', text: 'In a mono PA, a hard left/right recording pan does not translate to the room. Keep monitor sends only as high as the player needs.' },
      ],
      body: 'On stage, the monitors stay where the player needs them: aim the real pattern’s rejection at loud neighbours and speakers — cardioid and supercardioid patterns put their nulls in different places.',
      warn: 'No mic position alone prevents feedback: solve it with mic, speaker and source geometry and the channel count before adding gain or aggressive EQ. Never create feedback deliberately.',
    },
  },
  twoMic: {
    label: 'A spaced pair over the keyboard',
    A: { typeId: 'mlSdc', pattern: 'cardioid', zone: 'xy.pairHigh' },
    B: { typeId: 'mlSdc', pattern: 'cardioid', zone: 'xy.pairLow' },
    learn: [],
    warn: 'Judge the pair by ear, in mono, at matched levels.',
  },
  practice: {
    gain: 'xy.prac.gain',
    second: 'xy.prac.3',
    mixed: ['xy.mix.1', 'xy.mix.2', 'xy.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: a reference, a pattern’s null, and the delay between two mics.',
  },
  where: { inside: 'under the bars', outside: 'clear of the instrument' },
  viewWords: { side: 'Front view, from the audience,', top: 'From above,' },
  words: {
    instrument: 'xylophone',
    player: 'player',
    reference: 'bars',
    inside: 'under the bars',
    outside: 'clear of the instrument',
    axis: 'straight down',
    facing: 'aimed down',
    shield: 'bars in path',
    mountStand: 'Mount: a weighted stand with a boom, reaching over from the audience side, above every stroke — never on a bar, a tube or a cord',
    mountClip: 'Mount: nothing is attached to the instrument',
    sheet: 'For a real xylophone, with the player’s agreement and the player stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
    viewSide: 'Front view, from the audience,',
    viewTop: 'From above,',
  },
};

export const I09_LESSON: MalletLesson = {
  id: 'I09',
  labId: 'percussion',
  title: 'Xylophone',
  subtitle: 'Hard, bright bars: one mic above, off-axis, or a spaced or coincident pair',
  noun: { one: 'xylophone', many: 'xylophones' },
  model: XYLO_MODEL,
  micTypeIds: ['mlSdc', 'mlDynCard'],
  zones: XYLO_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    setupOrder(W, { text: 'Hear the passage and mark its lowest and highest notes and the striking arc', early: 'Start with the player and the music.' }, { text: 'Hear the mains (in an ensemble) and decide what is missing', early: 'Know what the music needs before you choose a mic.' }),
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A tuned percussion instrument of hard wooden (or synthetic) bars over tubes, laid out like a piano keyboard — higher and brighter than a marimba. Concert xylophones sound an octave above the written notes.', src: 'YMH-HUB-MX' },
    { title: 'WHERE YOU MEET IT', text: 'In the percussion section of orchestras, concert bands and pit bands, in percussion ensembles and on recordings.', src: 'LESSON-XYL' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Crisp, articulate lines and fast repeated notes that cut through an ensemble. The player chooses the mallets — within what the maker and the owner allow.', src: 'YMH-DECON' },
    { title: 'ITS SIZE', text: 'A common concert size covers three and a half octaves (sounding F4 to C8): 44 bars, all the same width, about 1.4 m long and 75 cm deep. A four-octave model is about 1.65 m. This lab draws both.', src: 'YMH-YX500' },
  ],
  sound: {
    stages: words.sound.stages.map((s) => ({ title: s.title, text: s.text })),
    attack: 'The bright start of each stroke — the hard mallet on the hard bar. A close mic hears more of it, and of the bars nearest it; too much reads as click rather than pitch.',
    body: 'The short ring that follows: the bar and its tube. A higher or less direct view blends more bars and more of the room. Both are tendencies — instruments and rooms vary.',
    head: { diameterMm: L0.naturals[Math.floor(L0.naturals.length / 2)].L, rods: 0, label: 'one bar of the xylophone', strikeSrc: 'YMH-HUB-MX' },
  },
  setting: {
    items: [
      { id: 'xylo', label: 'the xylophone (and its player)', short: 'XYLOPHONE', note: 'The player stands behind it, facing the audience. The drawing every page of this lesson uses.', prov: { kind: 'illustrative', reason: 'a typical section layout; no source gives positions' }, tag: 'THE SOURCE', scene: 'all' },
      { id: 'perc', label: 'other percussion', short: 'PERCUSSION', note: 'Drums and small instruments: a close spot hears them too.', prov: { kind: 'illustrative', reason: 'a typical section layout' }, tag: 'SPILL', scene: 'all' },
      { id: 'kit', label: 'a drum kit', short: 'DRUMS', note: 'A close spot can add as much drum bleed as xylophone. Aim the pattern’s rejection toward it where you can.', prov: { kind: 'illustrative', reason: 'a typical section layout' }, tag: 'SPILL', scene: 'all' },
      { id: 'front', label: 'a floor wedge in front of the xylophone', short: 'WEDGE', note: 'On the floor in front, facing the player, below the mic’s front: no pattern null reaches it. Keep its send only as high as needed.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'side', label: 'a side fill at stage left', short: 'SIDE FILL', note: 'On a stand at about head height beyond the low end — almost level with a mic above the bars: a null can face it.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'the audience and the PA', short: 'AUDIENCE', note: 'Listen to the xylophone’s sum in mono at audience positions: a mono PA does not reproduce a hard pan.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'FEEDBACK PATH', scene: 'stage' },
      { id: 'room', label: 'the studio room', short: 'THE ROOM', note: 'A room pair farther away can add natural space if the room sounds good — and room and outside noise.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: test at performance level with neighbours and monitors on; aim the real pattern’s rejection at loud neighbours; move in small steps.',
    studio: 'RECORDING: one overhead view for a restricted range, the pairs for the whole keyboard, a room mic as an option — checked in mono.',
  },
  diagnostic,
  practice: {
    task: 'Follow the maker’s mallet guidance, protect the bars and the player’s space, cover the played range, judge attack against pitch, and defend a studio and a live setup after mono and ensemble checks. With a real xylophone and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'range', label: 'Lowest and highest notes played, mallets used', kind: 'text' },
      { id: 'mics', label: 'Mics', kind: 'choice', choices: ['main pickup only', 'one mic', 'spaced pair', 'coincident pair', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'height', label: 'Height above the bars, pattern, aim', kind: 'text' },
      { id: 'clear', label: 'Clearances checked (strokes, sightline)', kind: 'text' },
      { id: 'notes', label: 'What you heard (attack, pitch, spill — in words)', kind: 'text' },
    ],
  },
  unknowns: [
    ...FAMILY_UNKNOWNS,
    { text: 'Bar thickness (22 mm) — a drawing default; which sharps and flats have a tube on the three-and-a-half-octave model (drawn under every second one) — a drawing default for “only essential accidental resonators”.', dims: [] },
    { text: 'The off-axis band (60–90 cm from the middle of the keyboard, 35–55° from straight up, on the audience side) — a drawing default for the lesson’s “safe off-axis position”.', dims: [] },
    { text: 'The four-octave option’s low-end depth: two figures are printed for its two tables (90 and 68 cm); the 90 cm one is drawn.', dims: [] },
  ],
  live: { wedges: malletWedges({ frontZ: FRONT_Z, sideX: SIDE_X }) },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. Every xylophone, player, mallet and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a xylophone with bar and tube lengths worked out (the tubes as quarter wavelengths of the sounding notes at A = 442 Hz), a plain bar’s shapes, mic patterns and the two-mic comb as textbook shapes, and motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.',
  copy,
  mallet: words,
};
