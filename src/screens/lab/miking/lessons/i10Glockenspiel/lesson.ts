/**
 * I10 GLOCKENSPIEL — the lesson's pages as DATA (blueprint §7). Words from
 * the owner's lesson (docs/labs/miking/source_text/Glockenspiel-Miking-
 * Technique-Research.txt, "L<n>" in COMMENTS only) with the fixes in
 * CORRECTIONS_LOG.md (I2-G*) applied — notably the close 10–15 cm example is
 * shown as a CONFLICT with the mallets' travel (L9), the bars are steel, and
 * no published two-mic dimension exists for the glockenspiel (L16).
 * OWNER RULING 2026-10-04: starting points, never dogma; no source, brand or
 * model in learner text; no badges; FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, PageContent, PageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import type { LessonCopy } from '../../engine/model/copy.ts';
import { BRAND_REASON, CLEAR_REASON, cardioidNull, distortionSymptom, firstNotch, gainCheck, moveRemovesDelay, polarityKeepsDelay, POWER_REASON, setupOrder } from '../shared/concert/commonItems.ts';
import { BEFORE_STANDS, glockPairs, hearingCheckM, malletAxes, malletWedges, monoSymptomM, quickHearingM, rattleSymptom, spacedMonoCheck, weakEndSymptom, type MW } from '../shared/mallets/content.ts';
import type { MalletLesson, MalletWords } from '../shared/mallets/family.ts';
import { FAMILY_UNKNOWNS } from '../shared/mallets/malletModel.ts';
import { GLOCK_GEOM, GLOCK_MODEL } from './geometry.ts';
import { GLOCK_FAM, GLOCK_ZONES } from './model.ts';

const W: MW = { p: 'gl', the: 'the glockenspiel', noun: 'glockenspiel', player: 'player', loudest: 'the hardest permitted accent' };
const L0 = GLOCK_GEOM.layouts.pedal;
const SIDE_X = 1900;
const FRONT_Z = 1100;

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the glockenspiel',
    goal: 'Get to know the glockenspiel — what it is, where you meet it, what it does in the music, and its parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Small steel bars in two rows that ring bright and long. Models differ: on a frame with tubes and a damper pedal, or in a case on a table, damped by hand. Never assume all bells are the same.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a mallet stroke becomes a bright, ringing note — the bar’s shapes, the short tube under it, the damper — and where the sound leaves. Shown, never played.',
    credit: { scenarios: ['gl.snd.1', 'gl.snd.2', 'gl.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'A steel bar rings long about its still points; its short tube (or the case’s box) supports it; the damper — a pedal or the player’s hand — decides when it stops.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the glockenspiel sits — the percussion section — the player’s damping hand and mallet path, and what to check before any mic.',
    credit: { scenarios: ['gl.set.1', 'gl.set.hear', 'gl.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Identify the model and its damping first. Map the mallet path, the damping hand, the score and any pedal; a case or support is not a mic mount.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the glockenspiel by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['gl.mic.1', 'gl.mic.2', 'gl.mic.3', 'gl.mic.4', 'gl.rec.1'], note: 'Answer the five checks (one reaches back to how the glockenspiel sounds).' },
    takeaway: 'A directional mic when spill and feedback matter — its real pattern auditioned. The mallet is a musical and care decision: rubber gives less attack than metal, plastic a medium attack.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — above the bars and a little toward the audience, higher or closer, or a safe lateral angle — and see why a published close position conflicts with the mallets.',
    credit: { scenarios: ['gl.place.1', 'gl.place.2', 'gl.place.3', 'gl.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'A recommended zone is a place to begin, not a rule. The close 10–15 cm example sits inside a real player’s mallet path: never set it unless the player proves every stroke clears it.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s real rejection faces a loud unwanted source — and know what the studio and an ensemble change.',
    credit: { scenarios: ['gl.ctx.1', 'gl.ctx.2', 'gl.ctx.studio', 'gl.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the side fill sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Start with as few open mics as the part needs; the glockenspiel often projects brightly already. Aim the real pattern’s rejection at wedges and loud neighbours.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'Compare a near-coincident pair with a spaced pair over the glockenspiel — no agreed two-mic dimension exists for it — by what an end bar does to each.',
    credit: { scenarios: ['gl.two.1', 'gl.two.2', 'gl.two.3', 'gl.two.4'], interactive: 'pairCompared', note: 'Look at both pairs with an end bar as the source, then answer the four checks.' },
    takeaway: 'One mic often suffices. For a wide solo, a near-coincident pair gives a stable picture and a reliable mono sum; a spaced pair more separate low and high control, with colour in mono. Mount both outside the mallet arc.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the mallet, the damping and the instrument first, then the coverage and gain staging — before EQ, a gate or heavy compression.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two different briefs, and say when two mics are justified.',
    credit: { scenarios: ['gl.prac.order', 'gl.prac.gain', 'gl.prac.setup1', 'gl.prac.setup2', 'gl.prac.3', 'gl.mix.1', 'gl.mix.2', 'gl.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'The model and its damping identified, approved mallets respected, clearance proven and supports stable, the whole phrase captured without clipping or chopped decay — and one mic or a pair defended.',
  },
};

const scenarios: MikingScenario[] = [
  {
    id: 'gl.snd.1',
    page: 'sound',
    prompt: 'On a case glockenspiel with no pedal, how do the notes stop?',
    options: ['The player damps them with a hand', 'They stop by themselves almost at once', 'A gate on the channel stops them'],
    correct: 'The player damps them with a hand',
    explain: 'Some concert models are made without a damper pedal; the player damps by hand, as is customary on case glockenspiels.',
    why: {
      'They stop by themselves almost at once': 'Steel bars ring long; something has to stop them.',
      'A gate on the channel stops them': 'A gate cuts the signal, not the instrument — and can chop a wanted ring.',
    },
  },
  {
    id: 'gl.snd.2',
    page: 'sound',
    prompt: 'The tubes under a glockenspiel’s highest bars are only a few centimetres long. Why?',
    options: ['Each tube is about a quarter wavelength of a very high note', 'They are short so the mallets can reach the bars', 'Steel bars need far shorter tubes than wooden bars of the same note'],
    correct: 'Each tube is about a quarter wavelength of a very high note',
    explain: 'The higher the note, the shorter its quarter wavelength: under the top notes, about 2 cm.',
    why: {
      'They are short so the mallets can reach the bars': 'The tubes are under the bars; the mallets are above.',
      'Steel bars need far shorter tubes than wooden bars of the same note': 'The note sets the length, not the bar’s material.',
    },
  },
  {
    id: 'gl.snd.3',
    page: 'sound',
    prompt: 'Glockenspiel mallets on a vibraphone: is that fine?',
    options: ['No — they can dent the other instrument’s bars', 'Yes — a hard mallet suits whatever metal bar it meets', 'Yes, if the player plays very softly'],
    correct: 'No — they can dent the other instrument’s bars',
    explain: 'A glockenspiel maker warns that its mallets can dent a vibraphone’s or metallophone’s bars.',
    why: {
      'Yes — a hard mallet suits whatever metal bar it meets': 'Hard glockenspiel mallets can dent softer bars.',
      'Yes, if the player plays very softly': 'The mallet is the problem; mallets are matched to instruments.',
    },
  },
  {
    id: 'gl.set.1',
    page: 'setting',
    prompt: 'Before placing a mic over the glockenspiel, what do you identify first?',
    options: ['The model, its damping, the approved mallets and the played span', 'The mic’s maximum SPL rating, since the bells can be very loud', 'Nothing yet: the stands and the cables go in first, then the rest'],
    correct: 'The model, its damping, the approved mallets and the played span',
    explain: 'Glockenspiels vary — tubes or a box, a pedal or hand damping. Ask the player to demonstrate the passage, accents, rolls and the intended damping.',
    why: {
      'The mic’s maximum SPL rating, since the bells can be very loud': 'Headroom comes later; first know the instrument and the passage.',
      'Nothing yet: the stands and the cables go in first, then the rest': 'Stands go in after you know the mallet path and the damping hand.',
    },
  },
  hearingCheckM(W, 'setting'),
  {
    id: 'gl.set.2',
    page: 'setting',
    prompt: 'The glockenspiel is in its case on a table. Can the case hold a mic clamp?',
    options: ['No — a case or support is not a mic mount', 'Yes — the case is wood and can take a clamp', 'Yes, if the lid is propped open to clear it'],
    correct: 'No — a case or support is not a mic mount',
    explain: 'Stands and cables stay outside the movements; do not prop a lid or modify the instrument without the owner’s approval.',
    why: {
      'Yes — the case is wood and can take a clamp': 'The case is part of the instrument; it is not a mount.',
      'Yes, if the lid is propped open to clear it': 'Nobody props the lid without the owner’s approval.',
    },
  },
  {
    id: 'gl.mic.1',
    page: 'microphone',
    prompt: 'A brighter glockenspiel is wanted live. Is a harder mallet the answer?',
    options: ['Not without the owner — choose mic and balance first', 'Yes — metal mallets cannot hurt steel bars, so they are fine here', 'Yes — the bars are steel, so nothing can harm them'],
    correct: 'Not without the owner — choose mic and balance first',
    explain: 'A bright mix should not be solved by asking a player to strike with an unapproved mallet. The score, the maker and the owner decide.',
    why: {
      'Yes — metal mallets cannot hurt steel bars, so they are fine here': 'Mallets are model-specific; check the maker and the owner.',
      'Yes — the bars are steel, so nothing can harm them': 'Steel can still be marked; and the mallet is a musical choice.',
    },
  },
  {
    id: 'gl.mic.2',
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
    id: 'gl.mic.3',
    page: 'microphone',
    prompt: 'Rubber, plastic and metal mallets on the glockenspiel: which gives the least attack?',
    options: ['Rubber', 'Metal', 'Plastic'],
    correct: 'Rubber',
    explain: 'Rubber gives less attack than metal; plastic a medium attack — comparative starting observations, not permission to use any beater.',
    why: { Metal: 'Metal gives the most attack.', Plastic: 'Plastic sits in the middle.' },
  },
  {
    id: 'gl.mic.4',
    page: 'microphone',
    prompt: 'Does the tip of a mic alone tell you its pickup axis?',
    options: ['No — audition the actual polar pattern', 'Yes — a mic hears straight out of its tip, whatever its type', 'Yes — and that axis stays the same at all pitches'],
    correct: 'No — audition the actual polar pattern',
    explain: 'Use a directional mic when spill and feedback matter, and audition the actual pattern rather than assuming the tip alone defines its axis.',
    why: {
      'Yes — a mic hears straight out of its tip, whatever its type': 'Side-address mics hear from the side, and patterns vary.',
      'Yes — and that axis stays the same at all pitches': 'Real patterns change with frequency.',
    },
  },
  {
    id: 'gl.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · What stops a note on the frame model with a pedal?',
    options: ['The damper, when the pedal is released', 'The tube under the bar closing up over its mouth', 'The case lid falling onto the bars'],
    correct: 'The damper, when the pedal is released',
    explain: 'A damper under the bars, worked by the pedal: released, it stops the notes; pressed, they ring.',
    why: {
      'The tube under the bar closing up over its mouth': 'The tubes stay open; the damper stops the bar.',
      'The case lid falling onto the bars': 'That is the case model, and its lid is not a damper.',
    },
  },
  {
    id: 'gl.place.1',
    page: 'placement',
    prompt: 'A published close position puts one mic 10–15 cm above the glockenspiel’s bars. Is it safe?',
    options: ['Only if the player proves every stroke clears it', 'Yes — it is published, so it is safe', 'Yes — the mic sits between the bars when the music pauses'],
    correct: 'Only if the player proves every stroke clears it',
    explain: 'At that height the capsule or boom can be inside a real player’s mallet arc. Never let a number override a collision or stability concern.',
    why: {
      'Yes — it is published, so it is safe': 'A starting distance is not a clearance check.',
      'Yes — the mic sits between the bars when the music pauses': 'A mic that looks clear in a pause is not clear during the passage.',
    },
  },
  {
    id: 'gl.place.2',
    page: 'placement',
    prompt: 'Closer to the bars, or higher? What tends to differ?',
    options: ['Closer: more immediate, may favour one area', 'Closer: more even across the whole keyboard', 'Higher: less of the room and less of the spill'],
    correct: 'Closer: more immediate, may favour one area',
    explain: 'Moving closer may improve direct-to-spill ratio but exaggerate one area of the keyboard; higher integrates more of it, with more room.',
    why: {
      'Closer: more even across the whole keyboard': 'Closer favours the bars nearest it.',
      'Higher: less of the room and less of the spill': 'Higher hears more of the room and the stage.',
    },
  },
  {
    id: 'gl.place.3',
    page: 'placement',
    prompt: 'The case model’s lid stands open on the audience side. A mic out on that side, low, aimed back at the bars: what happens?',
    options: ['The lid stands between them: move above it', 'Nothing: a lid does not block sound', 'The lid makes the mic hear more of the bars'],
    correct: 'The lid stands between them: move above it',
    explain: 'With the lid up behind the bars, a low mic on the audience side looks at the lid. Go above it, or to the player’s side of it, clear of the hands.',
    why: {
      'Nothing: a lid does not block sound': 'A solid lid between the bars and the mic shades it.',
      'The lid makes the mic hear more of the bars': 'The lid sits in the path; the mic hears less of the bars directly.',
    },
  },
  {
    id: 'gl.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · How long do glockenspiel notes ring when nothing damps them?',
    options: ['Long — steel bars ring on', 'They stop at once, like wood', 'Only while the mallet touches'],
    correct: 'Long — steel bars ring on',
    explain: 'Steel bars ring bright and long; the pedal or the hand decides when they stop — check the full decay, not cut off.',
    why: { 'They stop at once, like wood': 'Steel rings far longer than wood.', 'Only while the mallet touches': 'The bar rings after the mallet leaves it.' },
  },
  {
    id: 'gl.ctx.1',
    page: 'context',
    prompt: 'An ensemble recording. Does the glockenspiel need its own spot?',
    options: ['Only if the mains miss a quiet passage or its balance', 'Yes — each instrument needs its own spot in a recording', 'No — a glockenspiel should not have a spot of its own'],
    correct: 'Only if the mains miss a quiet passage or its balance',
    explain: 'The glockenspiel may already project brightly; a spot may be needed only for a quiet passage or independent balance — brought in at a musical level, checked in mono.',
    why: {
      'Yes — each instrument needs its own spot in a recording': 'A spot adds spill and timing; it has to earn its place.',
      'No — a glockenspiel should not have a spot of its own': 'A quiet passage can justify one.',
    },
  },
  {
    id: 'gl.ctx.2',
    page: 'context',
    prompt: 'Cardioid, supercardioid, hypercardioid: do they share the same rear and side rejection?',
    options: ['No — confirm the particular mic and the stage', 'Yes — all directional mics reject sound alike from behind', 'Yes, as long as they are aimed at the bars'],
    correct: 'No — confirm the particular mic and the stage',
    explain: 'Their nulls sit in different places, and the tighter patterns pick up a little behind. Aim the real pattern’s rejection at wedges and loud neighbours.',
    why: {
      'Yes — all directional mics reject sound alike from behind': 'The nulls differ between patterns.',
      'Yes, as long as they are aimed at the bars': 'The aim at the bars is the same; the rejection elsewhere is not.',
    },
  },
  {
    id: 'gl.ctx.studio',
    page: 'context',
    prompt: 'A solo overdub in a controlled room. A wide stereo pair makes the small glockenspiel very wide. What do you do?',
    options: ['Narrow it: the picture should not be exaggerated', 'Keep it: a wider picture is more impressive for a solo', 'Add a third mic to fill the middle'],
    correct: 'Narrow it: the picture should not be exaggerated',
    explain: 'Verify that a stereo perspective does not turn a small glockenspiel into an exaggerated left-right image; record the full phrase and its decay.',
    why: {
      'Keep it: a wider picture is more impressive for a solo': 'An exaggerated width misrepresents a small instrument.',
      'Add a third mic to fill the middle': 'A third mic adds timing differences; narrow the pair first.',
    },
  },
  {
    id: 'gl.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Why is the published close position drawn red, not blue?',
    options: ['It sits inside the mallets’ travel on a real passage', 'It is a louder position than the others', 'It is meant only for players using metal mallets on steel'],
    correct: 'It sits inside the mallets’ travel on a real passage',
    explain: 'The capsule or boom can be within the player’s arc — usable only if the player proves full clearance.',
    why: {
      'It is a louder position than the others': 'The colour is about clearance, not level.',
      'It is meant only for players using metal mallets on steel': 'The mallet type does not change where the mallets travel.',
    },
  },
  polarityKeepsDelay(W),
  firstNotch(W),
  {
    id: 'gl.two.3',
    page: 'twoMic',
    prompt: 'Is there a published two-mic dimension for the glockenspiel?',
    options: ['No — mount any pair outside the mallet arc and judge it', 'Yes — the same 61 cm spacing as for the marimba and xylophone', 'Yes — a pair must sit 10–15 cm above the bars'],
    correct: 'No — mount any pair outside the mallet arc and judge it',
    explain: 'The published two-mic geometry is for xylophone, marimba and vibraphone; do not transfer it automatically. Try a near-coincident or a spaced pair, outside the mallet arc.',
    why: {
      'Yes — the same 61 cm spacing as for the marimba and xylophone': 'That geometry is not given for the glockenspiel.',
      'Yes — a pair must sit 10–15 cm above the bars': 'That is a one-mic close example — and inside the mallets’ path.',
    },
  },
  spacedMonoCheck(W),
  gainCheck(W),
  {
    id: 'gl.prac.3',
    page: 'practice',
    prompt: 'When are two glockenspiel mics justified?',
    options: ['A wide range or a solo where a stable picture matters', 'Whenever there is a spare channel', 'Only for the case model, when it is set up on a small table'],
    correct: 'A wide range or a solo where a stable picture matters',
    explain: 'One mic often suffices for a short or focused phrase. A wider range or a solo may benefit from two viewpoints — checked alone, in stereo and in mono.',
    why: {
      'Whenever there is a spare channel': 'A channel is not a reason.',
      'Only for the case model, when it is set up on a small table': 'The model does not decide; the part and the picture do.',
    },
  },
  {
    id: 'gl.mix.1',
    page: 'practice',
    prompt: 'A starting point says “30–60 cm from the bars, a little toward the audience”. What else do you need?',
    options: ['The mallet arc and damping hand, proven clear with the player', 'The glockenspiel’s brand, so the numbers fit its size', 'Nothing more: the band says exactly where to go'],
    correct: 'The mallet arc and damping hand, proven clear with the player',
    explain: 'The band starts “where the full mallet arc clears it”. Clearance is proven through the whole passage, not assumed.',
    why: {
      'The glockenspiel’s brand, so the numbers fit its size': 'The brand changes nothing about clearance.',
      'Nothing more: the band says exactly where to go': 'Clearance decides whether the band is usable at all.',
    },
  },
  cardioidNull(W),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  {
    id: 'gl.s.click',
    observation: 'Too much click',
    firstChecks: 'Is the mallet approved, and the mic too near the striking point? Discuss the source; compare a safe oblique or higher position.',
    options: ['The mallet with the player, then an oblique or higher view', 'Cut the treble with EQ until the click is gone entirely', 'Ask for metal mallets so the pitch is clearer to hear'],
    correct: 'The mallet with the player, then an oblique or higher view',
    explain: 'Source first, then the view. EQ cannot make a too-close position right.',
    why: {
      'Cut the treble with EQ until the click is gone entirely': 'EQ dulls the bell; find the cause.',
      'Ask for metal mallets so the pitch is clearer to hear': 'Metal adds attack — the opposite.',
    },
  },
  {
    id: 'gl.s.tails',
    observation: 'Note tails cut short',
    firstChecks: 'Is the player damping, or is a gate acting? Hear the hand or pedal behaviour; bypass the gate and compare.',
    options: ['The player’s damping, then bypass any gate', 'Add reverb until the tails sound long again', 'Raise the gain so the tails stay audible'],
    correct: 'The player’s damping, then bypass any gate',
    explain: 'A gate can cut a legitimate ring; the damping is the player’s.',
    why: {
      'Add reverb until the tails sound long again': 'Reverb disguises it; find what cuts the tail.',
      'Raise the gain so the tails stay audible': 'Gain does not stop a gate closing or a hand damping.',
    },
  },
  weakEndSymptom(W),
  rattleSymptom(W, 'the case, the frame, the damper and the supports'),
  monoSymptomM(W),
  distortionSymptom(W),
];

const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point, measured from the bars', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };
const CLOSE_REASON: SetupReason = { id: 'r.close', label: 'The close 10–15 cm position is published, so it needs no clearance check', role: 'wrong', feedback: 'A starting distance never overrides a collision check: it sits inside the mallet path.' };

const setupTasks: SetupTask[] = [
  {
    id: 'gl.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A delicate solo overdub on the frame model with a pedal. Two channels; phantom power is available.',
    setups: [
      { id: 'a', label: 'One condenser about 45–60 cm from the bars, above and a little toward the audience', ok: true, power: 'phantom', feedback: 'One safe, higher view: often enough for a delicate solo.' },
      { id: 'b', label: 'A near-coincident pair over the played span, outside the mallet arc', ok: true, power: 'phantom', feedback: 'A stable picture and a reliable mono sum; keep the width honest.' },
      { id: 'c', label: 'One condenser 10 cm above the middle bars', ok: false, power: 'phantom', feedback: 'Inside the mallets’ path.' },
      { id: 'd', label: 'A clamp on the frame’s gas spring', ok: false, power: 'none', feedback: 'Never touch the gas spring; nothing mounts on the instrument.' },
      { id: 'e', label: 'A spaced pair 2 m apart for a huge image', ok: false, power: 'phantom', feedback: 'An exaggerated width for a small instrument — and a hollow mono sum.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.decay', label: 'The full decay is kept: no gate, the damping is the player’s', role: 'optional', feedback: 'A fair studio reason.' }, BRAND_REASON, CLOSE_REASON],
    explain: 'More than one setup passes: a safe starting point, clearance proven, power that matches the mics, and the decay kept.',
  },
  {
    id: 'gl.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage; the case model on a table, its lid open. One channel, NO phantom power.',
    setups: [
      { id: 'a', label: 'One compact dynamic above the bars, higher than the lid, aimed down across the played bars', ok: true, power: 'none', feedback: 'Above the lid, clear of the hands; it needs no phantom.' },
      { id: 'b', label: 'One compact dynamic closer, on the player’s side of the lid, after the player proves clearance', ok: true, power: 'none', feedback: 'Fair — once every stroke and the damping hand clear it.' },
      { id: 'c', label: 'One condenser above the bars', ok: false, power: 'phantom', feedback: 'No phantom power on this input.' },
      { id: 'd', label: 'A dynamic low on the audience side, behind the open lid', ok: false, power: 'none', feedback: 'The lid stands between it and the bars.' },
      { id: 'e', label: 'A dynamic clamped to the case', ok: false, power: 'none', feedback: 'The case is not a mount.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'A directional mic, its rejection toward the wedges and loud neighbours', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, CLOSE_REASON],
    explain: 'Two setups pass: one directional mic with a clear view of the bars, clear of the hands, powered by what this input supplies.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: a mallet strikes the middle of a steel bar. What do the bar’s ends do?', options: ['They move up while the middle goes down', 'They move down with the middle', 'They stay still — only the middle moves'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch the whole bar.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: a mic 10–15 cm above the bars, as one close example has it. What will the drawing show?', options: ['It sits inside the mallets’ travel', 'It is the safest position', 'It is too far to hear the bars'], after: 'Look for the red band, then rest the mic in two blue zones.' },
  context: { prompt: 'The side fill sits off to the side of a mic above the bars. Which pattern can turn a null toward it?', options: ['Only a cardioid', 'A supercardioid or hypercardioid', 'None of them'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'Two mics close together, angled apart, over the middle: the lowest bar sounds. How big is their arrival-time difference?', options: ['Small', 'Large', 'Exactly zero'], after: 'Now step BAR to an end of the keyboard with each PAIR, and watch DELAY and LEVEL.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'gl.q.1',
    covers: 'instrument',
    prompt: 'What are a concert glockenspiel’s bars made of?',
    options: ['Steel', 'Rosewood', 'A synthetic resin'],
    correct: 'Steel',
    explain: 'Concert glockenspiels — orchestral bells — have steel bars that ring bright and long.',
    why: { Rosewood: 'Rosewood is the marimba’s and the xylophone’s.', 'A synthetic resin': 'Synthetic bars belong to some marimbas and xylophones.' },
  },
  {
    id: 'gl.q.2',
    covers: 'instrument',
    prompt: 'Can a glockenspiel be made with no damper pedal?',
    options: ['Yes — some are damped by hand', 'No — each model has one', 'Only the large concert models lack one'],
    correct: 'Yes — some are damped by hand',
    explain: 'Some concert and case models have no pedal; the player damps with the hand.',
    why: { 'No — each model has one': 'Some are made without a pedal.', 'Only the large concert models lack one': 'Case models are usually damped by hand too.' },
  },
  {
    id: 'gl.q.3',
    covers: 'sound',
    prompt: 'Why are the tubes under the top notes so short?',
    options: ['A quarter wavelength of a very high note is short', 'To keep them well out of the way of the mallets’ swing', 'Steel bars need shorter tubes'],
    correct: 'A quarter wavelength of a very high note is short',
    explain: 'The note sets the tube’s length: higher note, shorter tube.',
    why: { 'To keep them well out of the way of the mallets’ swing': 'The tubes are under the bars.', 'Steel bars need shorter tubes': 'The pitch decides, not the material.' },
  },
  {
    id: 'gl.q.4',
    covers: 'sound',
    prompt: 'Glockenspiel mallets on a vibraphone?',
    options: ['No — they can dent its bars', 'Yes — mallets suit all metal bars', 'Yes, if played softly'],
    correct: 'No — they can dent its bars',
    explain: 'A maker warns the glockenspiel’s mallets can dent other mallet instruments.',
    why: { 'Yes — mallets suit all metal bars': 'Hard mallets can dent softer bars.', 'Yes, if played softly': 'The mallet itself is the problem.' },
  },
  {
    id: 'gl.q.5',
    covers: 'setting',
    prompt: 'A mic 10–15 cm above the bars: when may you use it?',
    options: ['Only when the player proves every stroke clears it', 'At all times — it is a published position', 'Only when the player is using soft rubber mallets on it'],
    correct: 'Only when the player proves every stroke clears it',
    explain: 'It can sit inside the mallet arc; a number never overrides clearance.',
    why: { 'At all times — it is a published position': 'Published is not proven clear.', 'Only when the player is using soft rubber mallets on it': 'The mallet’s material does not change its path.' },
  },
  quickHearingM(W),
];

const words: MalletWords = {
  sound: {
    stages: [
      { title: 'The mallet lands', text: 'A hard mallet lands on a small steel bar. The ATTACK is bright: rubber gives less of it than metal, plastic a medium attack.' },
      { title: 'The bar bends and rings', text: 'The bar bends — the middle down, both ends up — and springs back: its lowest shape, drawn far larger than it moves. It hangs on strings through holes at its still points.' },
      { title: 'The air in the tube rings with it', text: 'Under the bar, a short tube — open at the top, closed at the bottom, a quarter wavelength long — rings with it. Only the sharps and flats that need one have a tube.', byVariant: { case: 'No tubes here: the bars rest over the case’s box, whose air and wood support them.' } },
      { title: 'Sound leaves — up and out', text: 'Sound leaves the bar, up and out — bright, with a long ring. Pedal down, the notes ring on; released, the damper stops them.', byVariant: { case: 'Sound leaves the bar, up and out — bright, with a long ring, until the player’s hand damps it. The open lid stands on the audience side.' } },
    ],
    cells: [
      { k: 'BAR', at: ['STRUCK', 'BENDING', 'RINGING', 'RINGING'], flex: 1 },
      { k: 'TUBE AIR', at: ['AT REST', 'AT REST', 'RINGING', 'RINGING'], byVariant: { case: ['AT REST', 'AT REST', 'NO TUBE', 'NO TUBE'] }, flex: 1.1 },
      { k: 'SOUND', at: ['—', '—', '—', 'UP AND OUT'], flex: 1.1 },
    ],
    looking: 'One bar and what is under it · seen from the low end · the player at the left',
    reveal: 'The middle goes down while the ends come up: a bar bends about two still points.',
    after: 'Then the steel bar rings on: how long depends on the damping — the pedal, or the player’s hand — and on the mallet. All the player’s choices; listen through the end of the decay.',
    pedal: { down: 'PEDAL DOWN: the damper is clear of the bars, and the notes ring on.', up: 'PEDAL UP: the damper touches the bars, and the notes stop.', note: 'The damping is the player’s phrasing, not a mic setting.' },
    shapes: {
      intro: 'This is the lowest shape — the note. The middle and the ends move opposite ways about two still points, where the strings pass.',
      tuned: 'A plain bar’s upper shapes ring at uneven ratios (about 2.76 and 5.40 times the lowest) — part of a bell’s shimmer. Makers shape and tune real bars, so their ratios differ a little; the still points and the strike-point idea stay.',
      notes: ['A shape is set moving only as much as the bar moves at the strike point in that shape.'],
    },
    tube: {
      intro: 'Open under the bar, closed at the bottom: the tube rings at the note whose quarter wavelength fits it — about {len} here. At the top of the range, barely longer than a fingertip.',
      visible: 'The air moves most at the open mouth and presses most at the closed end.',
      noTube: 'No tube under this bar: on this model only the sharps and flats that need one have a tube — or, in a case, the box does the job.',
    },
  },
  two: {
    presets: glockPairs('mlSdc', GLOCK_GEOM.barY),
    looking: 'Two mics over the glockenspiel · paths from one bar',
    prompt: 'Choose a PAIR, then step BAR to the lowest and the highest bar. Watch DELAY and LEVEL — and the comb below.',
    learn: [
      'One mic often suffices for a short or focused phrase. A wider range or a solo may benefit from two viewpoints. There is no agreed two-mic dimension for the glockenspiel: do not transfer the xylophone, marimba and vibraphone geometry automatically.',
      'A near-coincident pair over the useful span when a stable picture and a reliable mono sum matter; a spaced pair for more separate low and high coverage — which can colour shared notes in mono. Mount both outside the mallet arc.',
      'Listen to each mic alone, both in stereo, and both summed to mono. If shared notes thin or change colour in mono, change placement and balance before polarity reversal or time alignment. In a mono PA, prioritise a stable mono balance.',
    ],
    warn: 'A simplified picture: one point on one bar, straight paths, no room. The pairs’ sizes are drawing defaults, not published figures. Judge a real pair by ear — each mic alone, both together, and in mono.',
  },
};

const copy: Partial<LessonCopy> = {
  variantKey: 'MODEL',
  variantShort: { pedal: 'on a frame', case: 'in a case' },
  sceneSubject: { pedal: 'a concert glockenspiel on its frame, with a damper pedal', case: 'a case glockenspiel on a table, its lid open' },
  viewTag: { side: 'FRONT · FROM THE AUDIENCE', top: 'FROM ABOVE · AUDIENCE BELOW' },
  axes: malletAxes(GLOCK_FAM),
  instrument: {
    figureBadge: 'A concert glockenspiel, from the audience',
    figureLabel: 'Front view of a concert glockenspiel from the audience: two rows of small steel bars seen end-on, short tubes under them, the frame with its gas-spring legs and casters, the damper pedal, and the player behind with two mallets; a red band marks a close position inside the mallets’ travel.',
    partsBadge: 'A glockenspiel · tap a part to name it',
    partsLooking: { side: 'Front view · from the audience · low end on the right', top: 'From above · the player at the top, the audience below' },
    partsIdle: 'The mallet strikes a steel bar; it rings long until the damper — or the hand — stops it. The next page shows how.',
    variantNotes: { case: 'IN A CASE: a smaller range in a wooden case on a table, damped by hand; the lid stands open on the audience side.' },
  },
  setting: {
    kitA11y: 'The percussion section from above: the glockenspiel with its player, other percussion behind, a drum kit to one side.',
    kitLanding: 'Tap anything around the glockenspiel — or step through ITEM — to see what it means for a glockenspiel mic. There is nothing to answer yet.',
    kitIdle: 'The glockenspiel in the percussion section: small and bright, with louder neighbours all around.',
    leftHanded: 'The low end is on the player’s left. The damping hand moves too — map it with the mallets.',
    stageA11y: 'The section on a stage, from above: a floor wedge in front of the glockenspiel, a side fill on stage left, the audience to the right.',
    studioA11y: 'The glockenspiel in a studio room, from above: the walls around it, no monitors.',
    stageIdle: 'Two monitors: a wedge in front, facing the player, and a side fill at stage left. The PA faces the audience.',
    studioIdle: 'No monitors. A controlled room can carry a more distant or stereo perspective — kept to the instrument’s real size.',
    before: [
      { title: 'IDENTIFY THE INSTRUMENT', text: 'Tubes or a box? A damper pedal or hand damping? Which mallets are approved? Ask for the passage: low and high notes, accents, rolls or repeated notes, and the intended damping.' },
      { title: 'MAP THE PATH', text: 'The lowest and highest played notes, both hands’ reach, the mallet swing, the damping hand, the score and any pedal. Stands and cables outside them all; a case or support is not a mic mount.' },
      { title: 'STABLE AND UNTOUCHED', text: 'Stabilise the instrument by its own instructions; never adjust a gas spring, the damper or a resonator to fit a mic, never prop a lid without the owner — and lock it before any stand goes near.' },
      BEFORE_STANDS,
    ],
    plan: {
      title: 'In the section',
      badge: 'A percussion section from above · a typical layout · the audience to the right',
      looking: 'Plan · the glockenspiel in the percussion section, the audience to the right',
      stageBadge: 'From above · two monitors where a stage often puts them · audience to the right',
      studioBadge: 'From above · a studio room',
      stageLooking: 'Plan · the section on a stage',
      studioLooking: 'Plan · the glockenspiel in a studio',
      widePrompt: 'Switch STAGE / STUDIO, and tap what is new around the glockenspiel.',
    },
  },
  placement: {
    workedZone: { pedal: 'gl.high', case: 'gl.high' },
    workedLine: 'This starting point is also read against {line}.',
    workedAim: 'Aim down across the played bars, toward the middle of the keyboard — the starting point counts while the mic looks within {tol}° of it.',
    workedClear: 'Where the full mallet arc and the damping hand clear it, through the whole passage and the strongest stroke. The red band — a published close position — sits inside the mallets’ travel: it is shown, never a place to rest.',
    blocked: { pedal: ' Move it higher, or out toward the audience.', case: ' Move it higher — above the open lid — or out of the hands’ way.' },
    reveal: 'Yes — the close position sits inside the mallets’ travel on a real passage. The blue zones start higher, a little toward the audience.',
    typeNotes: { mlDynCard: 'A dynamic can work too, especially live: choose by response, pattern, power and mount, and compare by ear.' },
    note: 'Clearance comes first: stop the player before moving a real stand. No number overrides a collision or stability concern.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we recommend you begin: one mic above the bars and a little toward the audience, about 30–60 cm from them — higher for a more integrated view, closer for a more immediate one — or a safe lateral angle to compare. Starting points, not rules.',
      separate: 'Height, distance and angle are separate variables: change one at a time, with the whole phrase and its decay.',
      clearance: 'Clearance comes first. A published close position — about 10–15 cm above the bars — puts the capsule or the boom inside a real player’s mallet arc: drawn red here. Use it only if the player proves full clearance for the whole passage and the strongest stroke.',
      tendencies: 'Closer tends to be more immediate, with more attack, and can favour one area; higher integrates the keyboard and the room. All tendencies to check by ear.',
    },
  },
  context: {
    zone: 'gl.high',
    typeId: 'mlSdc',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'mlSdc' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'mlSdc' },
      { id: 'hypercardioid', label: 'hypercardioid', typeId: 'mlSdc' },
    ],
    micNoun: 'A small condenser',
    shield: ['gl.nat.pedal', 'gl.acc.pedal', 'gl.nat.case', 'gl.acc.case', 'gl.lid.case'],
    azMax: 40,
    elMax: 40,
    aimBlurb: 'Swing the front up to 40° either way.',
    plan: { u0: L0.xHigh - 300, u1: SIDE_X + 400, v0: L0.zPlayer - 350, v1: FRONT_Z + 500 },
    side: { u0: L0.xHigh - 300, u1: SIDE_X + 400, v0: L0.yNat - 1100, v1: 60 },
    target: 'side',
    frontIds: ['front'],
    targetWord: 'side fill',
    looking: 'One mic above the bars · the side fill at stage left',
    prompt: 'The monitors stay where the stage needs them. Turn the MIC (AIM) or change its PATTERN until the side fill sits in the rejection.',
    activityDone: 'done — the side fill sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there. Use the null to aim, not to promise silence.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). The side fill sits almost level with a mic above the bars: try the other patterns.',
    shieldNote: 'Real patterns change with pitch and the stage reflects sound — this is the reasoning, not a prediction. Work out the real positions with the system operator.',
    studioId: 'gl.ctx.studio',
    studioPrompt: 'A studio session has no monitor to reject. The decision changes: one view, or a modest stereo picture?',
    studioNote: 'In the studio, hear the instrument where a listener would stand, record the full phrase and its natural decay, and test both pedal states if there is a pedal. Switch back to LIVE for the monitor exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not rules: an ensemble’s mains may carry a bright glockenspiel already; a loud stage needs a directional spot with its rejection aimed.',
      points: [
        { title: 'FEW OPEN MICS', text: 'Start with as few open mics as the part needs; a directional spot can improve isolation when its axis faces the bars and its rejection faces wedges or loud neighbours.' },
        { title: 'THE CLOSE EXAMPLE', text: 'About 10–15 cm above the bars can help attack and separation — only if every stroke and the damping actions clear it. Otherwise a safe oblique angle, raised.' },
        { title: 'THE AUDIENCE', text: 'A mic aimed at one bar makes a run uneven; a high or distant mic adds spill. Check both ends of the range after every move, and in mono before panning.' },
        { title: 'THE ENSEMBLE', text: 'Hear the mains first; a spot may be needed only for a quiet passage or independent balance — checked in mono with the mains.' },
      ],
      body: 'On stage, the monitors stay where the player needs them: aim the real pattern’s rejection at wedges and loud neighbours, and keep cases closed or out of paths.',
      warn: 'No mic position alone prevents feedback: the monitors and PA, channel gain and EQ, the room and the open mics all matter. Never create feedback deliberately.',
    },
  },
  twoMic: {
    A: { typeId: 'mlSdc', pattern: 'cardioid', zone: 'gl.high' },
    B: { typeId: 'mlSdc', pattern: 'cardioid', zone: 'gl.near' },
    learn: [],
    warn: 'Judge the pair by ear, in mono, at matched levels.',
  },
  practice: {
    gain: 'gl.prac.gain',
    second: 'gl.prac.3',
    mixed: ['gl.mix.1', 'gl.mix.2', 'gl.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: a reference, a pattern’s null, and the delay between two mics.',
  },
  where: { inside: 'under the bars', outside: 'clear of the instrument' },
  viewWords: { side: 'Front view, from the audience,', top: 'From above,' },
  words: {
    instrument: 'glockenspiel',
    player: 'player',
    reference: 'bars',
    inside: 'under the bars',
    outside: 'clear of the instrument',
    axis: 'the middle of the keyboard',
    facing: 'aimed at the bars',
    shield: 'lid or bars in path',
    mountStand: 'Mount: a stable stand with a boom, outside the mallet arc and the damping hand — never on a bar, the case, the damper or the gas spring',
    mountClip: 'Mount: nothing is attached to the instrument or its case',
    sheet: 'For a real glockenspiel, with the player’s agreement and the player stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
    viewSide: 'Front view, from the audience,',
    viewTop: 'From above,',
  },
};

export const I10_LESSON: MalletLesson = {
  id: 'I10',
  labId: 'percussion',
  title: 'Glockenspiel',
  subtitle: 'Steel bars that ring long: a safe view above, the close example that conflicts, one mic or two',
  noun: { one: 'glockenspiel', many: 'glockenspiels' },
  model: GLOCK_MODEL,
  micTypeIds: ['mlSdc', 'mlDynCard'],
  zones: GLOCK_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    setupOrder(W, { text: 'Identify the model, its damping and approved mallets; map the mallet and hand path', early: 'Start with the instrument, the player and the music.' }, { text: 'Hear the mains (in an ensemble) and decide whether a spot is needed', early: 'Know what the music needs before you choose a mic.' }),
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Orchestral bells: small tuned steel bars laid out like a piano keyboard, ringing bright and long. Some stand on a frame with tubes under the bars and a damper pedal; others sit in a case, damped by the player’s hand.', src: 'YMH-YG2500-OM' },
    { title: 'WHERE YOU MEET IT', text: 'In the percussion section of orchestras, concert bands and marching bands, in pit bands and on recordings.', src: 'LESSON-GLK' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Sparkling melodies and accents above the ensemble; long ringing notes or crisp damped ones. Mallets — rubber, plastic or metal — and damping are the player’s choices.', src: 'YMH-CHOOSE' },
    { title: 'ITS SIZE', text: 'A concert model covers about three and a third octaves (C5 to E8): 41 steel bars, each 32.5 mm wide, about 106 × 56 cm. A case model covers two and a half octaves in a 79 × 48 cm case. This lab draws both.', src: 'YMH-YG2500-OM' },
  ],
  sound: {
    stages: words.sound.stages.map((s) => ({ title: s.title, text: s.text })),
    attack: 'The bright start of each stroke — the mallet on steel. A close mic hears more of it and of the bars nearest it; too much reads as click.',
    body: 'The long ring that follows, until the damper or the hand stops it. A higher view blends more of the keyboard and the room. Both are tendencies — instruments and rooms vary.',
    head: { diameterMm: L0.naturals[Math.floor(L0.naturals.length / 2)].L, rods: 0, label: 'one bar of the glockenspiel', strikeSrc: 'YMH-YG2500-OM' },
  },
  setting: {
    items: [
      { id: 'glock', label: 'the glockenspiel (and its player)', short: 'GLOCKENSPIEL', note: 'The player stands behind it, facing the audience, mallets in hand and a hand or a foot ready to damp. The drawing every page of this lesson uses.', prov: { kind: 'illustrative', reason: 'a typical section layout; no source gives positions' }, tag: 'THE SOURCE', scene: 'all' },
      { id: 'perc', label: 'other percussion', short: 'PERCUSSION', note: 'Louder neighbours: a spot over the bells hears them too.', prov: { kind: 'illustrative', reason: 'a typical section layout' }, tag: 'SPILL', scene: 'all' },
      { id: 'kit', label: 'a drum kit', short: 'DRUMS', note: 'Loud and close: aim the pattern’s rejection toward it where you can.', prov: { kind: 'illustrative', reason: 'a typical section layout' }, tag: 'SPILL', scene: 'all' },
      { id: 'front', label: 'a floor wedge in front of the glockenspiel', short: 'WEDGE', note: 'On the floor in front, facing the player, below the mic’s front: no pattern null reaches it.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'side', label: 'a side fill at stage left', short: 'SIDE FILL', note: 'On a stand at about head height beyond the low end — almost level with a mic above the bars: a null can face it.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'the audience and the PA', short: 'AUDIENCE', note: 'If the PA is mono, or listeners sit outside a central stereo zone, keep a stable mono balance.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'FEEDBACK PATH', scene: 'stage' },
      { id: 'room', label: 'the studio room', short: 'THE ROOM', note: 'A controlled, musical room can carry a more distant or stereo view — never an exaggerated left-right image of a small instrument.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: test with the full band at its real level, with as few open mics as the part needs; aim the rejection at wedges and loud neighbours.',
    studio: 'RECORDING: hear it where a listener would stand; the full phrase and its decay; a modest stereo view if the room is good.',
  },
  diagnostic,
  practice: {
    task: 'Identify the model and its damping, respect the approved mallets, prove clearance and stable support, capture the whole phrase without clipping or a chopped decay, and explain when one mic or a pair serves the music. With a real glockenspiel and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'model', label: 'Model: tubes or box, pedal or hand damping', kind: 'text' },
      { id: 'mics', label: 'Mics', kind: 'choice', choices: ['main pickup only', 'one mic', 'near-coincident pair', 'spaced pair', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'height', label: 'Distance from the bars, angle', kind: 'text' },
      { id: 'clear', label: 'Clearances checked (mallets, damping hand, lid)', kind: 'text' },
      { id: 'notes', label: 'What you heard (attack, ring, decay — in words)', kind: 'text' },
    ],
  },
  unknowns: [
    ...FAMILY_UNKNOWNS,
    { text: 'The bars hang on strings through drilled holes (sourced); their posts and the damper’s and pedal’s geometry are drawing defaults; the gas-spring legs are drawn as cylinders on the frame’s legs.', dims: [] },
    { text: 'Which sharps and flats have a tube (“only essential accidental resonators”) — drawn under every second one, a drawing default.', dims: [] },
    { text: 'The case model: the table (760 mm), the split of its 108 mm into a 78 mm base and a 30 mm lid, and the lid open 90° on a far-side hinge — drawing defaults.', dims: [] },
    { text: 'The pairs (near-coincident about 17 cm and 110°, spaced about 40 cm, both about 45 cm above the bars) — drawing defaults: no agreed two-mic dimension exists for the glockenspiel.', dims: [] },
    { text: 'The trial band split into closer (30–45 cm) and higher (45–60 cm) views, and the lateral angle (40–70 cm, 45–65° from straight up) — drawing defaults for the lesson’s words.', dims: [] },
  ],
  live: { wedges: malletWedges({ frontZ: FRONT_Z, sideX: SIDE_X }) },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every glockenspiel, player, mallet and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a concert glockenspiel (or a case model) with bar and tube lengths worked out (the tubes as quarter wavelengths at A = 442 Hz), a plain bar’s shapes, mic patterns and the two-mic comb as textbook shapes, and motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.',
  copy,
  mallet: words,
};
