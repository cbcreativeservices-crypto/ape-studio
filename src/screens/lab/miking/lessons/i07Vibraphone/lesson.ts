/**
 * I07 VIBRAPHONE — the lesson's pages as DATA (blueprint §7). Words from the
 * owner's lesson (docs/labs/miking/source_text/Vibraphone-Miking-Technique-
 * Research.txt, "L<n>" in COMMENTS only) with the fixes in CORRECTIONS_LOG.md
 * (I2-V*) applied. OWNER RULING 2026-10-04: starting points, never dogma; no
 * source, brand or model in learner text; no badges; FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, LessonPages, PageContent, SourcePageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import type { LessonCopy } from '../../engine/model/copy.ts';
import { BRAND_REASON, CLEAR_REASON, cardioidNull, firstNotch, gainCheck, moveRemovesDelay, polarityKeepsDelay, POWER_REASON, setupOrder } from '../shared/concert/commonItems.ts';
import { BEFORE_STANDS, coincidentCheck, hearingCheckM, malletAxes, malletWedges, monoSymptomM, quickHearingM, shurePairs, spacedMonoCheck, weakEndSymptom, type MW } from '../shared/mallets/content.ts';
import type { MalletLesson, MalletWords } from '../shared/mallets/family.ts';
import { FAMILY_UNKNOWNS } from '../shared/mallets/malletModel.ts';
import { VIBE_GEOM, VIBE_MODEL } from './geometry.ts';
import { VIBE_FAM, VIBE_ZONES } from './model.ts';

const W: MW = { p: 'vb', the: 'the vibraphone', noun: 'vibraphone', player: 'player', loudest: 'the hardest accent' };
const L0 = VIBE_GEOM.layouts.motor;
const SIDE_X = 2400;
const FRONT_Z = 1300;

const pages: LessonPages = {
  instrument: {
    title: 'Meet the vibraphone',
    goal: 'Get to know the vibraphone — what it is, where you meet it, what it does in the music, and its parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Metal bars in two rows over a tube each; a felt damper worked by a pedal; on many, fans in the tube tops turned by a small motor. The player’s pedal and motor choices are part of the sound.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a mallet stroke becomes a ringing note — the bar’s shapes, the tube under it, the fans — and where the sound leaves.',
    credit: { scenarios: ['vb.snd.1', 'vb.snd.2', 'vb.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The bar rings about two still points the cord passes through; the tube under it — a quarter wavelength long — rings with it; the fans open and close the tube for the pulsing; the pedal decides how long notes last.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the vibraphone sits in a band — its neighbours, the player’s space, the monitors — and what to check before any mic.',
    credit: { scenarios: ['vb.set.1', 'vb.set.hear', 'vb.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Hear the player demonstrate first: low, middle and high notes, chords, pedal and motor. The mallets’ arc over both rows, the pedal foot and the motor are the player’s space.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the vibraphone by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['vb.mic.1', 'vb.mic.2', 'vb.mic.3', 'vb.mic.4', 'vb.rec.1'], note: 'Answer the five checks (one reaches back to how the vibraphone sounds).' },
    takeaway: 'A condenser is a common choice for a detailed mallet instrument; a suitable dynamic can work in a difficult live setup. No one mic suits every room.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — one mic above the middle, or one of a spaced pair — clear of the raised mallets, then move the mic and see what changes.',
    credit: { scenarios: ['vb.place.1', 'vb.place.2', 'vb.place.3', 'vb.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different suggested starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'A suggested zone is a place to begin, measured from the bars — not a rule, and not a safety clearance. The raised mallets set the minimum height.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s real rejection faces a loud unwanted source — and know when the studio decision is different.',
    credit: { scenarios: ['vb.ctx.1', 'vb.ctx.2', 'vb.ctx.studio', 'vb.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the side fill sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Aim nulls by the real pattern. Live, place the vibraphone away from loud speakers and drums where you can; in the studio, compare one mic with a pair.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'Compare the two published pairs — spaced about 61 cm apart, or grilles together at 135° — by what a bar at each end does to them.',
    credit: { scenarios: ['vb.two.1', 'vb.two.2', 'vb.two.3', 'vb.two.4'], interactive: 'pairCompared', note: 'Look at the spaced pair and the coincident pair with an end bar as the source, then answer the four checks.' },
    takeaway: 'A spaced pair gives more separate low and high control but can comb in mono; grilles together, every bar arrives at both at once and the picture is made by level. They are alternatives, not one setup.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the source first — the pedal, the damper, the motor, the frame — then coverage and gain staging, before EQ or a gate.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two different briefs, and say when a second mic is justified.',
    credit: { scenarios: ['vb.prac.order', 'vb.prac.gain', 'vb.prac.setup1', 'vb.prac.setup2', 'vb.prac.3', 'vb.mix.1', 'vb.mix.2', 'vb.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'Clear of the mallets and the pedal, the whole range covered, the motor as the player intends, headroom for the hardest accent and an honest mono check — and more than one setup can pass.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L4-L7 · set L7, L9, L47 · mic L13 ·
 * place L9-L11, L15 · ctx L44-L45 · two L15-L17 · prac L77-L82. */
const scenarios: MikingScenario[] = [
  {
    id: 'vb.snd.1',
    page: 'sound',
    prompt: 'Where does the cord pass through a vibraphone bar, and why there?',
    options: ['Where the bar stays still as it rings, so it rings freely', 'Through the exact middle, where the bar is the strongest', 'At the very ends, so the mallet has more room in the middle'],
    correct: 'Where the bar stays still as it rings, so it rings freely',
    explain: 'A struck bar rings in its lowest shape about two still points, a little under a quarter of the way in from each end. Held there, the support takes almost nothing from the ring.',
    why: {
      'Through the exact middle, where the bar is the strongest': 'The middle moves the most in the lowest shape; held there, the bar would be damped.',
      'At the very ends, so the mallet has more room in the middle': 'The ends move too. The still points are a little in from each end.',
    },
  },
  {
    id: 'vb.snd.2',
    page: 'sound',
    prompt: 'The tube under a low note is longer than the tube under a high note. Why?',
    options: ['Each tube is about a quarter wavelength of its bar’s note', 'The longer bars are heavier and need a stronger tube', 'Longer tubes make the low notes louder than the high ones'],
    correct: 'Each tube is about a quarter wavelength of its bar’s note',
    explain: 'Open under the bar and closed at the bottom, a tube rings at the note whose quarter wavelength fits it — so a lower note needs a longer tube. A tube only does its job at its own note.',
    why: {
      'The longer bars are heavier and need a stronger tube': 'The tube holds no weight: it is an air column tuned to the note.',
      'Longer tubes make the low notes louder than the high ones': 'Each tube supports its own bar; the length follows the pitch, not a wanted level.',
    },
  },
  {
    id: 'vb.snd.3',
    page: 'sound',
    prompt: 'The player starts the motor. What do the fans change?',
    options: ['They open and close the tube tops: the sound pulses', 'They blow air across the bars so the notes ring longer', 'They change the pitch of the bars a little up and down'],
    correct: 'They open and close the tube tops: the sound pulses',
    explain: 'Turning on their shafts, the fans repeatedly open and close the tubes; the sound is louder when the tubes are open. Faster motor, faster pulsing. A motor left running when the music wants a still sound changes the source.',
    why: {
      'They blow air across the bars so the notes ring longer': 'The fans sit in the tube tops; they change how open the tubes are, not how long the bars ring.',
      'They change the pitch of the bars a little up and down': 'The bars’ pitch stays put. The fans change the level — open, louder; closed, softer.',
    },
  },
  {
    id: 'vb.set.1',
    page: 'setting',
    prompt: 'Before placing anything, what do you ask the vibraphonist to show you?',
    options: ['Low, middle and high notes, chords, pedal and motor as played', 'The single loudest note they can play, so you can set a safe input gain', 'Nothing yet — let them warm up while you set the stands'],
    correct: 'Low, middle and high notes, chords, pedal and motor as played',
    explain: 'Soft and strong strokes across the range, chords with the pedal up and down, hand damping, and both motor states if used. Then you know what is intended — and what is a mechanical fault.',
    why: {
      'The single loudest note they can play, so you can set a safe input gain': 'Gain comes later; first hear the whole range, the pedal and the motor.',
      'Nothing yet — let them warm up while you set the stands': 'Stands go in after you know the player’s reach and the passage.',
    },
  },
  hearingCheckM(W, 'setting'),
  {
    id: 'vb.set.2',
    page: 'setting',
    prompt: 'Where must stand legs and cable loops stay out of, at a vibraphone?',
    options: ['The player’s pedal foot and its travel', 'The space under the high end of the keyboard', 'The front edge of the stage, near the audience'],
    correct: 'The player’s pedal foot and its travel',
    explain: 'The damper pedal is worked all through the music. Route stands and cables away from the pedal area, the motor lead and the wheels — never through the player’s feet.',
    why: {
      'The space under the high end of the keyboard': 'That space may be clear; the pedal and the player’s feet are what must be kept clear.',
      'The front edge of the stage, near the audience': 'Tidiness there matters less than the player’s pedal foot.',
    },
  },
  {
    id: 'vb.mic.1',
    page: 'microphone',
    prompt: 'Can a suitable dynamic work over a vibraphone?',
    options: ['Yes — especially live; compare it by ear', 'No — a dynamic cannot hear metal bars at all', 'No — only condensers work above the bars'],
    correct: 'Yes — especially live; compare it by ear',
    explain: 'A condenser is a common choice for a detailed mallet instrument; a suitable dynamic can work in a difficult live setup. The source and the setting decide, not the type’s name.',
    why: {
      'No — a dynamic cannot hear metal bars at all': 'Dynamics hear the bars well enough to be used; compare by ear.',
      'No — only condensers work above the bars': 'Height does not decide the type. Pattern, response, power and mount do.',
    },
  },
  {
    id: 'vb.mic.2',
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
    id: 'vb.mic.3',
    page: 'microphone',
    prompt: 'On a loud stage, why choose a directional pattern over the vibraphone?',
    options: ['It rejects part of the drums and speakers off its axis', 'It makes the vibraphone itself louder on the stage for everyone', 'It removes the motor’s noise from the sound'],
    correct: 'It rejects part of the drums and speakers off its axis',
    explain: 'A directional pattern can reduce some spill; it never removes it all, and least in the lows. Where you can, place the vibraphone away from loud speakers and drums too.',
    why: {
      'It makes the vibraphone itself louder on the stage for everyone': 'A mic does not change how loud the instrument is; it changes what the channel hears.',
      'It removes the motor’s noise from the sound': 'The motor is part of the instrument, right under the mic’s view. A pattern cannot remove it.',
    },
  },
  {
    id: 'vb.mic.4',
    page: 'microphone',
    prompt: 'Why is a light, slim mic often easier over a vibraphone?',
    options: ['It fits on a boom above the mallets without sagging', 'A light mic hears the high notes better than a heavy one', 'A slim body is louder than a wide one at the same distance'],
    correct: 'It fits on a boom above the mallets without sagging',
    explain: 'The mic hangs on a boom over the bars, above the raised mallets. A light, slim body is easier to hold steady there and to keep out of the player’s sightline.',
    why: {
      'A light mic hears the high notes better than a heavy one': 'Weight does not decide the response; the capsule does.',
      'A slim body is louder than a wide one at the same distance': 'Body size does not make a mic louder. The point is mounting it safely.',
    },
  },
  {
    id: 'vb.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · The pedal is up (released). What happens to the notes?',
    options: ['The felt damper touches the bars and stops them', 'They ring on as long as the bars keep moving', 'The fans stop turning until the pedal goes down'],
    correct: 'The felt damper touches the bars and stops them',
    explain: 'Pedal up: the damper touches the bars — a muted sound. Pedal down: it is pushed away and the bars ring out. The pedal is a musical choice, not a mic problem.',
    why: {
      'They ring on as long as the bars keep moving': 'That is pedal DOWN. Released, the damper stops the bars.',
      'The fans stop turning until the pedal goes down': 'The motor and the pedal are separate: the pedal only moves the damper.',
    },
  },
  {
    id: 'vb.place.1',
    page: 'placement',
    prompt: 'A starting point says about 45–75 cm above the bars. Your stand reads 60 cm above the floor. Are you in it?',
    options: ['No — the number counts from the bars, not the floor', 'Yes — 60 cm is inside 45–75 cm wherever it is read from', 'Yes, as long as the mic is aimed down at the bars'],
    correct: 'No — the number counts from the bars, not the floor',
    explain: 'A distance only means something with its reference. 60 cm above the floor is under the bars.',
    why: {
      'Yes — 60 cm is inside 45–75 cm wherever it is read from': 'Same number, wrong reference: from the floor, the mic would be under the keyboard.',
      'Yes, as long as the mic is aimed down at the bars': 'The aim is one part; the height counts from the bars.',
    },
  },
  {
    id: 'vb.place.2',
    page: 'placement',
    prompt: 'One mic over the middle makes the low notes weak. What is a sensible first change?',
    options: ['Shift the height or angle in small steps, playing the range', 'Boost the low notes on the desk with EQ until they sound even again', 'Ask the player to play the low notes a little harder'],
    correct: 'Shift the height or angle in small steps, playing the range',
    explain: 'A single close point can make one register over-prominent. Move in small, safe steps with the real phrase — or add a second mic if the range needs it.',
    why: {
      'Boost the low notes on the desk with EQ until they sound even again': 'EQ cannot give back notes the mic does not hear well. Fix the coverage first.',
      'Ask the player to play the low notes a little harder': 'The player plays the music; the mic is moved to cover it.',
    },
  },
  {
    id: 'vb.place.3',
    page: 'placement',
    prompt: 'You want the sound from under the vibraphone, aiming up at the tubes. How should you treat it?',
    options: ['As a deliberate alternative, auditioned against a mic above', 'As the natural sound of the vibraphone, so it comes first', 'As the safest position, because it is out of the way'],
    correct: 'As a deliberate alternative, auditioned against a mic above',
    explain: 'Under the tubes gives a more local, coloured sound and more mechanical noise — not the whole instrument. Audition it as an effect, clear of the motor and the pedal.',
    why: {
      'As the natural sound of the vibraphone, so it comes first': 'It is a narrower, coloured view; the natural picture is heard from above, in the room.',
      'As the safest position, because it is out of the way': 'It is close to the pedal, the motor and the player’s feet — check those first.',
    },
  },
  {
    id: 'vb.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Which part of the vibraphone makes the pulsing you hear with the motor on?',
    options: ['The fans opening and closing the tube tops', 'The bars bending further each time they are struck', 'The pedal moving the damper on and off the bars'],
    correct: 'The fans opening and closing the tube tops',
    explain: 'The fans at the tube tops turn on their shafts and open and close the tubes. A mic close to the tubes hears more of that pulsing — and of the motor.',
    why: {
      'The bars bending further each time they are struck': 'The bars ring the same way; the fans change the tubes, not the bars.',
      'The pedal moving the damper on and off the bars': 'The pedal sets how long notes ring; the fans make the pulsing.',
    },
  },
  {
    id: 'vb.ctx.1',
    page: 'context',
    prompt: 'A loud band. The vibraphone sits next to the drums. What is worth trying before more gain on its channel?',
    options: ['Moving the vibraphone away from the drums and speakers', 'Raising its mic higher to hear more of the room', 'Gating the channel so the drums are cut between notes'],
    correct: 'Moving the vibraphone away from the drums and speakers',
    explain: 'Place the instrument away from competing speakers and drums where you can, then a safe directional mic or pair above the playing range. Higher brings more spill, not less.',
    why: {
      'Raising its mic higher to hear more of the room': 'Higher hears more of the room — and more of the drums.',
      'Gating the channel so the drums are cut between notes': 'A gate chops a sustained instrument and its motor pulsing. Fix the layout first.',
    },
  },
  {
    id: 'vb.ctx.2',
    page: 'context',
    prompt: 'The side fill sits in a hypercardioid’s null on paper. What should you expect?',
    options: ['Less rejection than the picture shows, least in the lows', 'Complete silence from the side fill, low and high alike', 'More rejection in the low notes than in the high ones'],
    correct: 'Less rejection than the picture shows, least in the lows',
    explain: 'A null is infinitely deep only on paper. Real mics reject far less there, and least at low frequencies. Soundcheck the actual pattern and the monitors.',
    why: {
      'Complete silence from the side fill, low and high alike': 'A null is infinitely deep only on paper; real rejection is partial.',
      'More rejection in the low notes than in the high ones': 'The reverse: real patterns usually reject least at low frequencies.',
    },
  },
  {
    id: 'vb.ctx.studio',
    page: 'context',
    prompt: 'A solo overdub in a good room. One mic over the middle sounds fine, but the stereo picture matters. What is a fair next step?',
    options: ['Compare a spaced and a coincident pair with the same phrase', 'Add a third mic under the tubes to make the stereo picture wider', 'Keep the one mic and pan it hard to one side'],
    correct: 'Compare a spaced and a coincident pair with the same phrase',
    explain: 'In the studio, repeated trials are easy: keep the phrase and the monitor level the same, compare one mic, a spaced pair and a coincident pair — and check each in mono.',
    why: {
      'Add a third mic under the tubes to make the stereo picture wider': 'Under the tubes is an effect, not width — and every extra mic adds spill and timing.',
      'Keep the one mic and pan it hard to one side': 'Panning one mic moves it, it does not make a stereo picture.',
    },
  },
  {
    id: 'vb.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · What sets the lowest safe height for a mic over the bars?',
    options: ['The highest mallet stroke in the passage, plus room', 'The length of the tubes under the lowest bars', 'The height of the player’s music stand'],
    correct: 'The highest mallet stroke in the passage, plus room',
    explain: 'The mallets rise above the bars on every stroke and travel across both rows. The chosen position must clear the highest of them.',
    why: {
      'The length of the tubes under the lowest bars': 'The tubes are under the bars; the mallets rise above them.',
      'The height of the player’s music stand': 'The stand matters for the sightline; the mallets set the height.',
    },
  },
  polarityKeepsDelay(W),
  firstNotch(W),
  coincidentCheck(W),
  spacedMonoCheck(W),
  gainCheck(W),
  {
    id: 'vb.prac.3',
    page: 'practice',
    prompt: 'When is a second vibraphone mic justified?',
    options: ['When one mic cannot cover the part’s whole range evenly', 'Whenever there is a spare channel on the desk', 'Only when the motor is switched on and turning for the piece'],
    correct: 'When one mic cannot cover the part’s whole range evenly',
    explain: 'Scale up only as needed: if one safe position cannot balance the low and high notes the part plays — or a stereo picture is wanted — compare a spaced and a coincident pair, in mono too.',
    why: {
      'Whenever there is a spare channel on the desk': 'A spare channel is not a reason: every mic adds spill and timing.',
      'Only when the motor is switched on and turning for the piece': 'The motor does not decide the mic count; the range and the picture do.',
    },
  },
  {
    id: 'vb.mix.1',
    page: 'practice',
    prompt: 'A starting point says “about 46 cm, spaced about 61 cm”. Before you place the pair, what else do you need to know?',
    options: ['What it is measured from, and how high the mallets rise', 'The brand of the vibraphone, so the numbers fit its size', 'Nothing more: the numbers already say where both mics go'],
    correct: 'What it is measured from, and how high the mallets rise',
    explain: 'A distance belongs to its reference (here, the bars), and the mallets’ highest stroke sets the floor. Clearance is a separate check from the number.',
    why: {
      'The brand of the vibraphone, so the numbers fit its size': 'The brand does not change the reference; the bars do.',
      'Nothing more: the numbers already say where both mics go': 'A distance means nothing without its reference, and clearance is separate.',
    },
  },
  cardioidNull(W),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  weakEndSymptom(W),
  {
    id: 'vb.s.ring',
    observation: 'The notes will not stop ringing',
    firstChecks: 'Is the pedal held down, or the hand damping missing? Is the damper adjusted? Ask the player first.',
    options: ['The pedal, the hand damping and the damper, with the player', 'Gate the channel so each note is cut off sooner', 'Move the mic much farther away so that the long ring sounds quieter'],
    correct: 'The pedal, the hand damping and the damper, with the player',
    explain: 'Clean releases come from the player and the damper, not from a gate. Confirm the technique and the damper adjustment before any processing.',
    why: {
      'Gate the channel so each note is cut off sooner': 'A gate chops the notes the player wants to ring. Ask about the pedal first.',
      'Move the mic much farther away so that the long ring sounds quieter': 'Distance does not change how long the bars ring.',
    },
  },
  {
    id: 'vb.s.short',
    observation: 'Notes die too quickly',
    firstChecks: 'Is the pedal up, or is the damper rubbing the bars? Check the intended pedalling and the damper’s action.',
    options: ['The pedalling and whether the damper rubs the bars', 'Add reverb on the channel until the notes sound long enough', 'Raise the input gain so the tails stay above the noise'],
    correct: 'The pedalling and whether the damper rubs the bars',
    explain: 'A short note is often the pedal up — or a damper touching when it should not. Check the mechanism with the player.',
    why: {
      'Add reverb on the channel until the notes sound long enough': 'Reverb disguises it; find out why the bars stop.',
      'Raise the input gain so the tails stay above the noise': 'Gain does not make the bars ring longer.',
    },
  },
  {
    id: 'vb.s.motor',
    observation: 'A buzz, a rattle or a motor hum',
    firstChecks: 'Does it persist in the room without the PA? Then inspect the frame, the motor, the tubes and any stand touching the instrument; stop unsafe operation.',
    options: ['Whether it is in the room, then the frame, motor and tubes', 'Cut the low end with EQ until the hum disappears from the channel', 'Open the motor housing to find what is loose'],
    correct: 'Whether it is in the room, then the frame, motor and tubes',
    explain: 'A noise you hear in the room is mechanical. Find the loose part or the stand that touches; a motor fault belongs with a qualified technician — never open its housing.',
    why: {
      'Cut the low end with EQ until the hum disappears from the channel': 'EQ hides it and thins the instrument. Find the source.',
      'Open the motor housing to find what is loose': 'The motor is mains-powered: a fault belongs with a qualified technician.',
    },
  },
  {
    id: 'vb.s.thump',
    observation: 'A thump each time the pedal moves',
    firstChecks: 'Does the stand or the floor carry the pedal’s action into the mic? Stabilise and separate the paths; filter only unwanted rumble.',
    options: ['The stand and the floor carrying the pedal into the mic', 'Ask the player to stop using the pedal for this song', 'Turn the mic around so it faces away from the pedal'],
    correct: 'The stand and the floor carrying the pedal into the mic',
    explain: 'Separate the mechanical path — a steadier stand, away from the pedal and the frame — then use a high-pass filter only for rumble below the wanted notes.',
    why: {
      'Ask the player to stop using the pedal for this song': 'The pedal is part of the music. Fix the path to the mic.',
      'Turn the mic around so it faces away from the pedal': 'A thump through the stand reaches the mic whatever its aim.',
    },
  },
  monoSymptomM(W),
];

const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a suggested starting point, measured from the bars', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };
const COUNT_REASON: SetupReason = { id: 'r.count', label: 'A vibraphone always needs exactly two mics', role: 'wrong', feedback: 'One mic, a pair or the band’s mains can each be right; the part and the setting decide.' };

const setupTasks: SetupTask[] = [
  {
    id: 'vb.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A solo overdub in a good room. The part uses the whole keyboard, with the motor on slowly and long pedalled chords. Two channels; phantom power is available.',
    setups: [
      { id: 'a', label: 'Two condensers, spaced about 61 cm apart, about 46 cm above the bars, aimed down', ok: true, power: 'phantom', feedback: 'A suggested pair for the whole range; check the middle and the mono sum.' },
      { id: 'b', label: 'Two condensers with their grilles together, 135° apart, about 46 cm above the middle', ok: true, power: 'phantom', feedback: 'The coincident pair: no arrival-time difference, a picture made by level.' },
      { id: 'c', label: 'One mic under the tubes, aimed up at the motor', ok: false, power: 'phantom', feedback: 'Under the tubes is a coloured effect, and near the motor it hears its noise — not the whole instrument.' },
      { id: 'd', label: 'Two mics 10 cm above the bars, over the middle', ok: false, power: 'phantom', feedback: 'That is inside the mallets’ travel: the player would strike them.' },
      { id: 'e', label: 'A mic clamped to the frame rail without asking', ok: false, power: 'none', feedback: 'Nothing is mounted on the instrument without compatible hardware and the owner’s agreement.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.mono', label: 'The pair is checked in mono as well as stereo', role: 'optional', feedback: 'A fair studio reason.' }, BRAND_REASON, COUNT_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a sensible starting point measured from the bars, clear of the mallets and the pedal, power that matches the mics, and an honest mono check.',
  },
  {
    id: 'vb.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud club gig with a drummer beside the vibraphone. One channel, NO phantom power; the PA is mono.',
    setups: [
      { id: 'a', label: 'One compact dynamic about 45–75 cm above the middle, aimed down, clear of the mallets', ok: true, power: 'none', feedback: 'One safe directional mic above the range; it needs no phantom. Check the low and high notes at band level.' },
      { id: 'b', label: 'The vibraphone moved away from the drums, then one compact dynamic above its middle', ok: true, power: 'none', feedback: 'Layout first, then the mic — a fair live answer.' },
      { id: 'c', label: 'One condenser above the middle', ok: false, power: 'phantom', feedback: 'This input has no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'A spaced pair panned hard left and right', ok: false, power: 'none', feedback: 'One channel and a mono PA: a pair has nowhere to go, and it would comb in mono.' },
      { id: 'e', label: 'A dynamic close over the bars, inside the mallets’ reach, for more level', ok: false, power: 'none', feedback: 'Inside the mallets’ travel — the player would strike it.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'A directional mic and a better layout help against the drums', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, COUNT_REASON],
    explain: 'Two setups pass. What passes is the reasoning: one safe mic above the range, the layout improved where possible, and power that this input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: a mallet strikes the middle of a bar. What do the bar’s ends do?', options: ['They move up while the middle goes down', 'They move down with the middle', 'They stay still — only the middle moves'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch the whole bar.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move from one mic over the middle to one of a spaced pair over the low half. What changes?', options: ['More of the low notes in this mic', 'More of the whole keyboard', 'It depends on the passage and the room'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The side fill sits off to the side of a mic looking down at the bars. Which pattern can turn a null toward it?', options: ['Only a cardioid', 'A supercardioid or hypercardioid', 'None of them'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'Grilles together, angled 135° apart: the lowest bar sounds. Which reaches the two mics differently?', options: ['Its arrival time', 'Its level', 'Neither'], after: 'Now step BAR to an end of the keyboard with each PAIR, and watch DELAY and LEVEL.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'vb.q.1',
    covers: 'instrument',
    prompt: 'What does the vibraphone’s pedal do?',
    options: ['Moves the felt damper away so the notes ring', 'Starts and stops the motor that turns the fans', 'Raises the keyboard to the player’s height'],
    correct: 'Moves the felt damper away so the notes ring',
    explain: 'Pedal down, the damper moves away and the bars ring out; released, the damper touches them and mutes the sound.',
    why: {
      'Starts and stops the motor that turns the fans': 'The motor has its own switch and speed; the pedal works the damper.',
      'Raises the keyboard to the player’s height': 'The frame’s height is set separately; the pedal works the damper.',
    },
  },
  {
    id: 'vb.q.2',
    covers: 'instrument',
    prompt: 'Which row of bars is the vibraphone’s sharps and flats?',
    options: ['The far row, a little higher than the near one', 'The near row, the one closest to the player’s body', 'The bars at the left-hand end'],
    correct: 'The far row, a little higher than the near one',
    explain: 'Like a piano’s black keys: the naturals in the near row, the sharps and flats in the far row, raised.',
    why: {
      'The near row, the one closest to the player’s body': 'The near row is the naturals.',
      'The bars at the left-hand end': 'The ends are the high and low notes, not the sharps and flats.',
    },
  },
  {
    id: 'vb.q.3',
    covers: 'sound',
    prompt: 'Why is the tube under a low bar longer?',
    options: ['It is about a quarter wavelength of that lower note', 'A low bar is heavier and needs a stronger support', 'It makes the low notes louder than the others'],
    correct: 'It is about a quarter wavelength of that lower note',
    explain: 'Open at the top, closed at the bottom, each tube rings at its bar’s note — a quarter wavelength long.',
    why: {
      'A low bar is heavier and needs a stronger support': 'The tube supports nothing; the cords hold the bars.',
      'It makes the low notes louder than the others': 'The length follows the pitch, not a wanted level.',
    },
  },
  {
    id: 'vb.q.4',
    covers: 'sound',
    prompt: 'The motor is on. What makes the pulsing?',
    options: ['Fans opening and closing the tube tops', 'The bars bending further on each stroke', 'The damper touching the bars on and off'],
    correct: 'Fans opening and closing the tube tops',
    explain: 'The sound is louder when the tubes are open; the fans turning open and close them.',
    why: {
      'The bars bending further on each stroke': 'The bars ring the same way; the fans change the tubes.',
      'The damper touching the bars on and off': 'The damper follows the pedal; the fans make the pulsing.',
    },
  },
  {
    id: 'vb.q.5',
    covers: 'setting',
    prompt: 'Before placing a vibraphone mic, what do you ask the player to demonstrate?',
    options: ['The range, chords, pedal and motor as played', 'One loud note, so that you can set the input gain', 'Nothing — the stands go in first'],
    correct: 'The range, chords, pedal and motor as played',
    explain: 'Low, middle and high notes, soft and strong strokes, chords with the pedal, hand damping and both motor states if used.',
    why: {
      'One loud note, so that you can set the input gain': 'Gain comes later; first hear the whole range and the mechanisms.',
      'Nothing — the stands go in first': 'Stands go in after you know the player’s reach.',
    },
  },
  quickHearingM(W),
];

const words: MalletWords = {
  sound: {
    stages: [
      { title: 'The mallet lands', text: 'A yarn-wrapped mallet lands on the middle of a bar. That brief contact is the ATTACK — softer mallets and touch make it rounder, harder ones brighter.' },
      { title: 'The bar bends and rings', text: 'The bar bends — the middle down, both ends up — and springs back, again and again: its lowest shape, drawn far larger than it moves. Two points a little under a quarter of the way in from each end stay still: the cord passes through them, so the bar rings freely.' },
      { title: 'The air in the tube rings with it', text: 'Under the bar hangs a tube, open at the top and closed at the bottom, a quarter wavelength long for this note. Its air rings with the bar and makes the note fuller and longer. The fan in its top can open and close it.', byVariant: { nomotor: 'Under the bar hangs a tube, open at the top and closed at the bottom, a quarter wavelength long for this note. Its air rings with the bar and makes the note fuller and longer. Without a motor, the tube stays open: no pulsing.' } },
      { title: 'Sound leaves — up and out', text: 'Sound leaves the bar and the tube’s mouth, up and out around the keyboard. Pedal down, the note rings on; the fans, turning, make it pulse; the felt damper, when the pedal is released, stops it.', byVariant: { nomotor: 'Sound leaves the bar and the tube’s mouth, up and out around the keyboard. Pedal down, the note rings on; the felt damper, when the pedal is released, stops it.' } },
    ],
    cells: [
      { k: 'BAR', at: ['STRUCK', 'BENDING', 'RINGING', 'RINGING'], flex: 1 },
      { k: 'TUBE AIR', at: ['AT REST', 'AT REST', 'RINGING', 'RINGING'], flex: 1.1 },
      { k: 'SOUND', at: ['—', '—', '—', 'UP AND OUT'], flex: 1.1 },
    ],
    looking: 'One bar and its tube · seen from the low end · the player at the left',
    reveal: 'The middle goes down while the ends come up: a bar bends about two still points, like a skipping rope held in two places.',
    after: 'Then the bar keeps ringing: how long depends on the pedal, the hand damping, the mallet and the room — all the player’s choices.',
    pedal: { down: 'PEDAL DOWN: the felt damper is pushed away from the bars, and the notes ring on.', up: 'PEDAL UP: the felt damper touches the bars, and the notes stop — a muted sound.', note: 'The pedal is the player’s phrasing, not a mic setting.' },
    shapes: {
      intro: 'This is the lowest shape — the note. The middle and the ends move opposite ways about two still points, a little under a quarter of the way in from each end, where the cord passes.',
      tuned: 'A plain bar’s upper shapes ring at uneven ratios (about 2.76 and 5.40 times the lowest). Makers shape real bars to tune them, so a real vibraphone bar’s ratios differ — the still points and the strike-point idea stay.',
      notes: ['A shape is set moving only as much as the bar moves at the strike point in that shape: a stroke on a still point leaves that shape quiet.'],
    },
    tube: {
      intro: 'Open under the bar, closed at the bottom: the tube rings at the note whose quarter wavelength fits it — about {len} here. Step to the other end of the keyboard: the length follows the pitch.',
      visible: 'The air moves most at the open mouth, under the bar, and presses most at the closed end. The tube adds to its own bar’s note only.',
      noTube: 'No tube under this bar on this drawing.',
    },
    fan: {
      looking: 'A tube’s mouth · seen along the fan shaft',
      intro: 'Fans in the tube tops, on one shaft per row, turned by the motor.',
      card: 'Each fan is a disc on the shaft across the tube’s mouth. Flat, it closes the mouth; edge-on, it opens it — twice every turn. The sound is louder when the tube is open, so the note pulses as the fans turn.',
      note: 'Speed is the player’s choice — or the motor is off for a still sound. Record or reinforce the setting the music wants: a motor left running changes the source, not just the recording.',
    },
  },
  two: {
    presets: shurePairs('mlSdc', VIBE_GEOM.barY),
    looking: 'Two mics over the vibraphone · paths from one bar',
    prompt: 'Choose a PAIR, then step BAR to the lowest and the highest bar. Watch DELAY and LEVEL — and the comb below.',
    learn: [
      'Two layouts to begin from, as alternatives — not both at once: two mics aimed down about 46 cm (1½ ft) above the bars, either about 61 cm (2 ft) apart, or with their grilles together angled 135° apart. A coincident pair, the second: the capsules at one point.',
      'Spaced: one mic toward the low half, one toward the high, overlapping through the middle — more separate control, a wider picture, and a bar both mics hear at different times can sound coloured in mono. Coincident: no time difference for any bar, a steadier mono sum, a narrower picture and less low-versus-high control.',
      'Live, stereo is worth it only when the PA and the audience’s seats make it useful; close placement helps the gain before feedback. If the PA is mono, a single mic or a modest width may serve the audience better.',
    ],
    warn: 'A simplified picture: one point on one bar, straight paths, no room. Judge a real pair by ear — each mic alone, both together, and in mono — at matched levels.',
  },
};

const copy: Partial<LessonCopy> = {
  variantKey: 'SETUP',
  variantShort: { motor: 'with motor', nomotor: 'no motor' },
  sceneSubject: { motor: 'a three-octave vibraphone with its motor and fans', nomotor: 'a three-octave vibraphone without a motor' },
  viewTag: { side: 'FRONT · FROM THE AUDIENCE', top: 'FROM ABOVE · AUDIENCE BELOW' },
  axes: malletAxes(VIBE_FAM),
  instrument: {
    figureBadge: 'A three-octave vibraphone, from the audience',
    figureLabel: 'Front view of a vibraphone from the audience: two rows of metal bars seen end-on, the higher far row nearest you, a tube hanging under every bar — long at the low end on the right, short at the high end on the left — the fan shafts across the tube tops, the motor under the low end, the frame on casters, the pedal at the player’s feet, and the player behind with two mallets.',
    partsBadge: 'A three-octave vibraphone · tap a part to name it',
    partsLooking: { side: 'Front view · from the audience · low end on the right', top: 'From above · the player at the top, the audience below' },
    partsIdle: 'The mallet strikes a bar; the tube under it rings with it; the fans make it pulse; the pedal decides how long it rings. The next page shows how.',
    variantNotes: { nomotor: 'NO MOTOR: some vibraphones come without one, or with one as an option — no fans, no pulsing.' },
  },
  setting: {
    kitA11y: 'A small jazz group from above: the vibraphone with its player, a drum kit, a bass amp and a piano.',
    kitLanding: 'Tap anything around the vibraphone — or step through ITEM — to see what it means for a vibraphone mic. There is nothing to answer yet.',
    kitIdle: 'The vibraphone in a small band: the player behind it, the drums and the bass amp close by — loud neighbours for any mic over the bars.',
    leftHanded: 'Layouts vary: the low end is on the player’s left. Check the real layout and every note the part uses with the player.',
    stageA11y: 'The group on a stage, from above: a floor wedge in front of the vibraphone, a side fill on stage left, the audience to the right.',
    studioA11y: 'The vibraphone in a studio room, from above: the walls around it, no monitors.',
    stageIdle: 'Two monitors: a wedge in front of the vibraphone, facing the player, and a side fill on a stand at stage left. The PA faces the audience.',
    studioIdle: 'No monitors. In a room suited to its decay, the room is part of the sound.',
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'Low, middle and high notes, soft and strong strokes, chords with the pedal up and down, hand damping, and both motor states if used — then which sounds are intended and which are faults.' },
      { title: 'MAP THE PLAYER’S SPACE', text: 'The mallets’ arc over both rows, the extremes of the passage, the pedal foot, the tubes and the motor housing. Stands and cables stay clear of hands, mallets, pedal and adjustments, and out of the player’s view of the bars.' },
      BEFORE_STANDS,
    ],
    plan: {
      title: 'In the band',
      badge: 'A small group from above · a typical layout · the audience to the right',
      looking: 'Plan · the vibraphone in a small group, the audience to the right',
      stageBadge: 'From above · two monitors where a stage often puts them · audience to the right',
      studioBadge: 'From above · a studio room',
      stageLooking: 'Plan · the group on a stage',
      studioLooking: 'Plan · the vibraphone in a studio',
      widePrompt: 'Switch STAGE / STUDIO, and tap what is new around the vibraphone.',
    },
  },
  placement: {
    workedZone: { motor: 'vb.one', nomotor: 'vb.one' },
    workedLine: 'This starting point is also read against {line}.',
    workedAim: 'Aim down at the bars — the starting point counts while the mic looks within 30° of straight down. Height and angle are separate things to try.',
    workedClear: 'Clear of the raised mallets over both rows, the player’s view of the bars, the pedal and the motor. Clearance comes first, and the player stops before a real stand moves.',
    blocked: { motor: ' Raise it above the mallets’ travel, or move it out to the side.', nomotor: ' Raise it above the mallets’ travel, or move it out to the side.' },
    reveal: 'Over the low half, the mic favours the low notes; over the middle, it hears the keyboard more evenly — and every room and passage differs, so “it depends” is fair too.',
    typeNotes: { mlDynCard: 'A dynamic can work too, especially live: choose by response, pattern, power and mount, and compare by ear.' },
    note: 'Clearance comes first: stop the player before moving a real stand. 45 cm is a starting height, not a safety clearance — the highest mallet stroke decides.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we suggest you begin: one mic about 45–75 cm above the middle, aimed down; or one of a spaced pair about 46 cm above the bars and 61 cm apart; and, only as an alternative, a mic under the tubes. They are starting points, not rules: move from there and listen.',
      separate: 'Height, distance along the keyboard and angle are separate variables: change one at a time, with the real phrase — low, middle and high, single notes and chords.',
      clearance: 'Clearance comes first. Have the player show the mallets’ full arc over both rows and the whole passage before anything is placed. The mallets’ keep-clear area appears as the mic gets close — in red, with the reason, if a move is stopped — and shows roughly where they travel — leave more room on a real stage.',
      tendencies: 'Closer tends to bring more attack and one region of the keyboard; higher blends the keyboard and adds the room. Under the tubes: a coloured, local sound. All tendencies to check by ear.',
    },
  },
  context: {
    zone: 'vb.one',
    typeId: 'mlSdc',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'mlSdc' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'mlSdc' },
      { id: 'hypercardioid', label: 'hypercardioid', typeId: 'mlSdc' },
    ],
    micNoun: 'A small condenser',
    shield: ['vb.nat.motor', 'vb.acc.motor', 'vb.nat.nomotor', 'vb.acc.nomotor'],
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
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°) — straight up, for a mic looking down. The side fill sits almost level with it, off to the side: try the other patterns.',
    shieldNote: 'Real patterns change with pitch and the stage reflects sound — this is the reasoning, not a prediction. Work out the real positions with the system operator.',
    studioId: 'vb.ctx.studio',
    studioPrompt: 'A studio session has no monitor to reject. The decision changes: one mic, or a pair?',
    studioNote: 'In the studio, repeated trials are practical: compare one mic with the spaced and coincident pairs at matched level — and in mono. Switch back to LIVE for the monitor exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not rules: a quiet hall may need only the main pickup, a loud band a closer directional mic or pair.',
      points: [
        { title: 'THE LAYOUT', text: 'In a loud band, place the vibraphone away from competing speakers and drums where you can, then a safe directional mic or pair above the playing range.' },
        { title: 'STEREO LIVE', text: 'Will listeners across the venue hear both sides? If not, a mono feed or a modest width serves them more consistently.' },
        { title: 'THE STUDIO', text: 'A room suited to the decay; the same phrase and monitor level for each comparison; the motor on and off if it is used; the pedal release and the decay in the room.' },
        { title: 'THE ENSEMBLE', text: 'The mains may already carry a vibraphone picture. Add a spot or a pair only for a clear musical need — each open mic adds spill.' },
      ],
      body: 'On stage, the monitors stay where the player needs them: turn the mic or choose its pattern so that a null faces a loud unwanted source — and remember that real nulls are shallowest at low frequencies.',
      warn: 'No mic position alone prevents feedback: the monitors and PA, channel gain and EQ, the room and the open mics all matter. If the gain before feedback is not enough, improve the source and speaker layout or lower the stage level before boosting the channel. Never create feedback deliberately.',
    },
  },
  twoMic: {
    label: 'A spaced pair over the keyboard',
    A: { typeId: 'mlSdc', pattern: 'cardioid', zone: 'vb.pairHigh' },
    B: { typeId: 'mlSdc', pattern: 'cardioid', zone: 'vb.pairLow' },
    learn: [],
    warn: 'Judge the pair by ear, in mono, at matched levels.',
  },
  practice: {
    gain: 'vb.prac.gain',
    second: 'vb.prac.3',
    mixed: ['vb.mix.1', 'vb.mix.2', 'vb.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: a reference, a pattern’s null, and the delay between two mics.',
  },
  where: { inside: 'under the bars', outside: 'clear of the instrument' },
  viewWords: { side: 'Front view, from the audience,', top: 'From above,' },
  words: {
    instrument: 'vibraphone',
    player: 'player',
    reference: 'bars',
    inside: 'under the bars',
    outside: 'clear of the instrument',
    axis: 'straight down',
    facing: 'aimed down',
    shield: 'bars in path',
    mountStand: 'Mount: a stand with a boom, reaching over from the audience side, above the mallets — never on the bars, cords or tubes',
    mountClip: 'Mount: only hardware made for it, with the owner’s agreement',
    sheet: 'For a real vibraphone, with the player’s agreement and the player stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
    viewSide: 'Front view, from the audience,',
    viewTop: 'From above,',
  },
};

export const I07_LESSON: MalletLesson = {
  id: 'I07',
  labId: 'percussion',
  title: 'Vibraphone',
  subtitle: 'Metal bars, tubes and fans: one mic above, or a spaced or coincident pair',
  noun: { one: 'vibraphone', many: 'vibraphones' },
  model: VIBE_MODEL,
  micTypeIds: ['mlSdc', 'mlDynCard'],
  zones: VIBE_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    setupOrder(W, { text: 'Hear the player: the range, chords, pedal and motor; map the mallets’ arc', early: 'Start with the player and the music.' }, { text: 'Decide what the part needs: one mic, a pair, or the band’s mains', early: 'Know what the music needs before you choose a mic.' }),
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A tuned percussion instrument of metal bars, laid out like a piano keyboard, each over a tube. A pedal works a felt damper; on many, fans in the tube tops, turned by a small motor, make the notes pulse. The motor needs electricity — the sound is still the struck bars.', src: 'YMH-HUB-VIBE' },
    { title: 'WHERE YOU MEET IT', text: 'In jazz groups, orchestras and concert bands, percussion ensembles and on recordings — played with two or four mallets.', src: 'LESSON-VIBE' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Melody and chords that can ring on with the pedal down or stop short, with or without the pulsing. Pedalling, hand damping, the mallets and the motor speed are the player’s choices.', src: 'PAS-VIBE' },
    { title: 'ITS SIZE', text: `A common size covers three octaves, F3 to F6: 37 bars, about 1.5 m long and 56–75 cm deep, the bars about 87–101 cm high. This lab draws one, with its motor and without.`, src: 'ADAMS-VIBC' },
  ],
  sound: {
    stages: words.sound.stages.map((s) => ({ title: s.title, text: s.text })),
    attack: 'The start of each stroke: the mallet’s brief contact with the bar. Softer mallets and a lighter touch make it rounder; a mic close above the struck bars hears more of it — and of the bars nearest it.',
    body: 'The ring that follows: the bar in its shapes, the tube’s air with it, and the pulsing when the fans turn. A mic farther up hears more of the whole keyboard and the room. The pedal decides how long it lasts. All tendencies — instruments and rooms vary.',
    head: { diameterMm: L0.naturals[Math.floor(L0.naturals.length / 2)].L, rods: 0, label: 'one bar of the vibraphone', strikeSrc: 'YMH-HUB-VIBE' },
  },
  setting: {
    items: [
      { id: 'vibe', label: 'the vibraphone (and its player)', short: 'VIBRAPHONE', note: 'The player stands behind it, facing the audience, with the pedal at their feet. The drawing every page of this lesson uses.', prov: { kind: 'illustrative', reason: 'a typical small-group layout; no source gives positions' }, tag: 'THE SOURCE', scene: 'all' },
      { id: 'kit', label: 'the drum kit', short: 'DRUMS', note: 'Loud and close: every mic over the bars hears it. Where you can, keep the vibraphone away from the drums.', prov: { kind: 'illustrative', reason: 'a typical small-group layout' }, tag: 'SPILL', scene: 'all' },
      { id: 'bass', label: 'the bass amp', short: 'BASS AMP', note: 'Low and loud. A directional mic rejects only part of it — least at low frequencies.', prov: { kind: 'illustrative', reason: 'a typical small-group layout' }, tag: 'SPILL', scene: 'all' },
      { id: 'piano', label: 'the piano', short: 'PIANO', note: 'Another pitched instrument in the same range: it blends into the vibraphone mics.', prov: { kind: 'illustrative', reason: 'a typical small-group layout' }, tag: 'SPILL', scene: 'all' },
      { id: 'front', label: 'a floor wedge in front of the vibraphone', short: 'WEDGE', note: 'On the floor in front, facing the player — and facing a mic above the bars from below its front. No pattern null reaches it: keep its level only as high as the player needs.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'side', label: 'a side fill at stage left', short: 'SIDE FILL', note: 'On a stand at about head height beyond the low end, firing across the stage. Almost level with a mic above the bars and off to its side — a pattern’s null can face it.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'the audience and the PA', short: 'AUDIENCE', note: 'The PA faces the audience; every open mic also hears it. If the PA is mono, a wide stereo pair will not reach them as stereo.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'FEEDBACK PATH', scene: 'stage' },
      { id: 'room', label: 'the studio room', short: 'THE ROOM', note: 'A room suited to the vibraphone’s decay is part of the sound; a wider position blends the keyboard and the room but adds reflections.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: a band on stage — monitors, a PA facing the audience, drums nearby. Spill and the gain before feedback push toward a safe directional mic or pair above the range, and a better layout.',
    studio: 'RECORDING: no monitors on the floor; the room and its decay are part of the picture. One mic, a spaced pair and a coincident pair can be compared with the same phrase.',
  },
  diagnostic,
  practice: {
    task: 'Justify one mic or a pair for a complete passage, keep every stand clear of the mallets and the pedal, cover the whole range, and explain a defensible mono or stereo choice for the studio and for live sound. With a real vibraphone and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'range', label: 'Range played, motor and pedal use', kind: 'text' },
      { id: 'mics', label: 'Mics', kind: 'choice', choices: ['one mic', 'spaced pair', 'coincident pair', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'height', label: 'Height above the bars, aim', kind: 'text' },
      { id: 'clear', label: 'Clearances checked (mallets, pedal, motor)', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    ...FAMILY_UNKNOWNS,
    { text: 'Fan size and shape (a disc per tube, about 0.9 × the tube, on one shaft per row), the motor box (160 × 120 × 140 mm under the low end) and the belt — drawing defaults; the speed range is the maker’s.', dims: [] },
    { text: 'The damper bar’s place (a felt bar along the centre line under the bars) and the pedal (300 × 120 × 100 mm at the middle of the player’s side) — drawing defaults; their action is sourced.', dims: [] },
    { text: 'Whether a no-motor model keeps its fan shafts is not in the research: it is drawn without fans.', dims: [] },
    { text: 'The bar thickness (12.7 mm) is another maker’s figure drawn on this model.', dims: [] },
  ],
  live: { wedges: malletWedges({ frontZ: FRONT_Z, sideX: SIDE_X }) },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. Every vibraphone, player, mallet and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a three-octave vibraphone with bar lengths and tube lengths worked out (the tubes as quarter wavelengths at A = 442 Hz), a plain bar’s shapes, mic patterns and the two-mic comb as textbook shapes, and motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.',
  copy,
  mallet: words,
};
