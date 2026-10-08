/**
 * I01a HI-HAT — the lesson's pages as DATA (blueprint §7). The words come
 * from the owner's lesson (docs/labs/miking/source_text/Hi-Hat-Miking-
 * Technique-Research.txt, "L<n>" in COMMENTS only) with the fixes logged in
 * docs/labs/miking/CORRECTIONS_LOG.md (HH-…): the snare mic's TWO strategies
 * (aim its null at the hats, or angle it toward them) are one maker's both
 * suggestions, not a disagreement between makers; the far edge "away from
 * the snare" and the edge "away from the drummer" are different positions.
 *
 * OWNER RULING 2026-10-04: suggested starting points, never dogma; no source,
 * brand or model in learner text; no badges. FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, LessonPages, PageContent, SourcePageId, SetupTask, Wedge } from '../../engine/model/types.ts';
import { KIT_DRUMS, KIT_FLOOR_Y } from '../shared/kitPlanModel.ts';
import { KICK_GEOM } from '../m01Kick/geometry.ts';
import type { CymbalLesson } from '../shared/cymbals/cymbalLesson.ts';
import { BRAND_REASON, CLEAR_REASON, POWER_REASON, docReason, gainCheck, hearingCheck, hearingDiagnostic, nameReason, orderTask, overheadsFirst, polarityCheck, powerCheck, spillCheck, symptoms, type CymWords } from '../shared/cymbals/cymbalItems.ts';
import { HAT_MODEL } from './geometry.ts';
import { HAT, HAT_ZONES } from './model.ts';
import { HAT_COPY, HAT_CYM } from './copy.ts';

const W: CymWords = { pfx: 'hh', one: 'hi-hat', the: 'the hi-hats', mic: 'hi-hat mic' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the hi-hat',
    goal: 'Get to know the hi-hat — two cymbals on a stand worked by the foot — where you meet it, what it does in the music, and its parts, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Two cymbals face to face, opened and closed by the player’s left foot and played with a stick near the edge. The pair is rarely matched, and it is the player’s: work with it as it is set up.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a stroke becomes sound in a hi-hat — the stick, the plate’s shapes, closed against open — and where that sound goes.',
    credit: { scenarios: ['hh.snd.1', 'hh.snd.2', 'hh.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The attack starts where the stick meets the top cymbal near its edge; closed, the pair holds itself still, open it rings and washes. Much of the sound spreads out sideways, and air rushes out of the edges as the pair closes.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the hats sit on the kit — beside the snare, under a crash, at the player’s left foot — the space the stick and the foot need, what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['hh.set.1', 'hh.set.2', 'hh.set.hear'], note: 'Answer the three checks.' },
    takeaway: 'The snare is the hats’ loudest neighbour, the crash hangs above, the stick crosses over from the player’s side and the air bursts from the edges. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a hi-hat mic by its properties — pattern, power, size and mount — not by its brand, and not by the cymbal’s name.',
    credit: { scenarios: ['hh.mic.1', 'hh.mic.power', 'hh.mic.spill', 'hh.rec.1'], note: 'Answer the four checks (one reaches back to how the hats sound).' },
    takeaway: 'A small condenser is a common first choice over the hats; a small dynamic serves on a loud stage; a tiny clip-on can sit underneath. Condensers need phantom power. Max SPL is not a hearing limit.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — above the top cymbal, on the side away from the snare, clear of the stick and the air at the edges — then move the mic and see what changes.',
    credit: { scenarios: ['hh.place.1', 'hh.place.2', 'hh.place.3', 'hh.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points (change MIC for the others), and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'A recommended zone is a place to begin, measured from the top cymbal — not a rule. Height, the spot over the plate and the angle are separate things to try; the snare stays off the mic’s front, and clearance comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'With a mic under the hats aimed up, turn its rejection toward the drummer’s floor monitor — and know when the overheads are enough.',
    credit: { scenarios: ['hh.ctx.1', 'hh.ctx.2', 'hh.ctx.studio', 'hh.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the drummer’s fill sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Aimed up from under the hats, a mic’s rear faces the floor — the monitors fall toward its rejection. Real nulls are shallow, cymbals are loud, and no mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See how a mic over the hats and one under them start out of step, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: ['hh.two.1', 'hh.two.pol', 'hh.two.oh'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the three checks.' },
    takeaway: 'Above and below face opposite sides of the plates, so they start opposite; polarity flips a sign, it does not remove a delay. The overheads hear the hats too: compare every pair in mono.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — clearance, the air at the edges, aim, the pattern, gain and polarity — before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up a hat mic in the right order, choose and justify a plan for two briefs (from no hat mic to a mic underneath), and say what would justify a second mic.',
    credit: { scenarios: ['hh.prac.order', 'hh.prac.gain', 'hh.prac.setup1', 'hh.prac.setup2', 'hh.prac.3', 'hh.mix.1', 'hh.mix.2', 'hh.mix.3'], note: 'Put the setup in order, answer the gain check, complete both briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real kit.' },
    takeaway: 'Safe clearance, correct power and level checks, the snare kept off the mic’s front and an accurate account of polarity versus delay pass. A brand or a habit does not decide it — and more than one plan can pass.',
  },
};

/*
 * THE CHECKS. Reasoning, not recall; every wrong option a real misconception
 * of about the same length, with its own explanation. Lesson lines in
 * comments only: hh.snd.* L7, L45 (DPA edge/centre), S-REC1 "resonates
 * horizontally" · hh.set.* L9-L13 · hh.mic.* L30 · hh.place.* L36-L49 ·
 * hh.ctx.* L51-L60 · hh.two.* L52 · hh.prac.* L60-L70.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'hh.snd.1',
    page: 'sound',
    prompt: 'Where does much of a hi-hat’s sound spread, compared with a crash hanging above it?',
    options: ['Out sideways, from between the two cymbals’ edges', 'Straight up only, toward a mic hanging above the kit', 'Down through the stand and into the floor'],
    correct: 'Out sideways, from between the two cymbals’ edges',
    explain: 'Cymbals radiate above and below; a hi-hat pair also spreads a lot of its sound out horizontally, from between the edges — one reason an overhead hears it well, and a mic level with the edges hears the air as it closes.',
    why: {
      'Straight up only, toward a mic hanging above the kit': 'Up, yes — but also down, and a lot sideways from between the edges.',
      'Down through the stand and into the floor': 'The stand carries a little vibration; the sound leaves the plates into the air.',
    },
  },
  {
    id: 'hh.snd.2',
    page: 'sound',
    prompt: 'Why does a closed hi-hat ring so briefly after a stroke?',
    options: ['The two cymbals press together and damp each other', 'The stick is softer when the pedal is held down', 'Closed hats are struck on the cup, not near the edge'],
    correct: 'The two cymbals press together and damp each other',
    explain: 'Closed, each plate stops the other ringing: the short, tight sound. Open, they ring freely and can wash into each other.',
    why: {
      'The stick is softer when the pedal is held down': 'The stick is the same either way. The other cymbal touching it is what stops the ring.',
      'Closed hats are struck on the cup, not near the edge': 'Players use every spot either way. The pair pressing together is what shortens the ring.',
    },
  },
  {
    id: 'hh.snd.3',
    page: 'sound',
    prompt: 'On the top cymbal, toward which part do the higher overtones tend to sit?',
    options: ['Toward the cup at the centre', 'Out at the very edge of the plate', 'Under the bottom cymbal, on the stand'],
    correct: 'Toward the cup at the centre',
    explain: 'The lower tones tend to be stronger toward the edge and the high overtones toward the centre — so where a mic points over the plate changes the balance. A tendency, checked by ear.',
    why: {
      'Out at the very edge of the plate': 'The edge tends to carry more of the lower tones; the overtones sit toward the centre.',
      'Under the bottom cymbal, on the stand': 'Underneath, the top cymbal’s warmer tones and the stick are softer — not more overtones.',
    },
  },
  {
    id: 'hh.set.1',
    page: 'setting',
    prompt: 'On a typical right-handed kit, which loud neighbour sits closest to the hi-hat?',
    options: ['The snare, just to its right and a little lower', 'The floor tom, beside the player’s right leg', 'The ride, hanging high on the far side of the whole kit'],
    correct: 'The snare, just to its right and a little lower',
    explain: 'The hats stand on the player’s left, right beside the snare. The snare is the neighbour a hat mic hears most — and the one to keep off its front.',
    why: {
      'The floor tom, beside the player’s right leg': 'That is across the kit, on the player’s right. The snare is beside the hats.',
      'The ride, hanging high on the far side of the whole kit': 'The ride is on the right, over the floor tom. The snare is the hats’ neighbour.',
    },
  },
  {
    id: 'hh.set.2',
    page: 'setting',
    prompt: 'Why should a hat mic stay out of the space just beyond the pair’s edge, level with the gap?',
    options: ['Air rushes out there each time the pedal closes the pair', 'Nothing moves there; the rule is only to keep the kit looking tidy', 'The bottom cymbal turns to face the audience there'],
    correct: 'Air rushes out there each time the pedal closes the pair',
    explain: 'As the pair closes, air is squeezed out from between the edges. A mic in that air hears a thump or wind noise — so a close mic sits above the edge, or round from it.',
    why: {
      'Nothing moves there; the rule is only to keep the kit looking tidy': 'Air moves there, fast, every time the pair closes — a thump or wind noise in the mic.',
      'The bottom cymbal turns to face the audience there': 'The bottom cymbal stays on its seat. It is the air between the edges that matters.',
    },
  },
  hearingCheck(W),
  {
    id: 'hh.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic just past the pair’s edge, level with the gap, hears what as the pedal closes?',
    options: ['A rush of air — a thump or wind noise', 'Nothing at all: closing the pair is silent', 'Only the stick, since the pedal is quiet'],
    correct: 'A rush of air — a thump or wind noise',
    explain: 'The closing pair squeezes air out of the edges. Close mics stay above or round from the edge, out of that air.',
    why: {
      'Nothing at all: closing the pair is silent': 'Closing makes the “chick” — and pushes air out of the edges.',
      'Only the stick, since the pedal is quiet': 'The foot alone makes a sound and a burst of air. A mic there hears both.',
    },
  },
  {
    id: 'hh.mic.1',
    page: 'microphone',
    prompt: 'Why is a small condenser a common first choice over the hats?',
    options: ['It is light and detailed, and easy to place above the pair', 'It is the only type of mic that can be aimed straight down at a cymbal', 'It needs no power, unlike the dynamics on this page'],
    correct: 'It is light and detailed, and easy to place above the pair',
    explain: 'A slim condenser catches the stick’s detail and fits over the pair without crowding the player. A small dynamic works too — especially on a loud stage — and a tiny clip-on can sit underneath.',
    why: {
      'It is the only type of mic that can be aimed straight down at a cymbal': 'Any of these mics can point down. Its detail and size are the reasons.',
      'It needs no power, unlike the dynamics on this page': 'The reverse: a condenser needs phantom power; a dynamic needs none.',
    },
  },
  powerCheck(W, 'the small dynamic'),
  spillCheck(W, 'the snare'),
  {
    id: 'hh.place.1',
    page: 'placement',
    prompt: 'A starting point says “about 5–10 cm from the top cymbal”. What do you measure?',
    options: ['From the top cymbal up to the mic’s front, square to it', 'From the floor straight up to the mic’s front, like a stand height', 'From the snare’s head across to the mic’s front'],
    correct: 'From the top cymbal up to the mic’s front, square to it',
    explain: 'A distance is read from the thing it names: here the top cymbal, square to its plate, to the front of the mic.',
    why: {
      'From the floor straight up to the mic’s front, like a stand height': 'The floor is not the reference. Measure from the top cymbal.',
      'From the snare’s head across to the mic’s front': 'The snare is a neighbour, not the reference. Measure from the cymbal.',
    },
  },
  {
    id: 'hh.place.2',
    page: 'placement',
    prompt: 'Why begin on the side of the pair away from the snare?',
    options: ['The cymbals themselves shade the snare from the mic', 'The stick lands on that side, so the attack is clearer', 'The far side is quieter, so the gain can go higher'],
    correct: 'The cymbals themselves shade the snare from the mic',
    explain: 'From the far side, at an angle where the mic cannot “see” the snare, the pair sits between them. The stick lands on the player’s side — another reason to stay away from it.',
    why: {
      'The stick lands on that side, so the attack is clearer': 'The stick comes from the player’s side. The far side keeps the mic out of its way.',
      'The far side is quieter, so the gain can go higher': 'Gain is set for the loudest strokes wherever the mic is. The point is the snare.',
    },
  },
  {
    id: 'hh.place.3',
    page: 'placement',
    prompt: 'You slide the mic’s aim from the edge toward the cup. What tends to change?',
    options: ['More of the high overtones, less of the lower tones', 'Only the level drops; the tone itself stays exactly the same', 'A fixed treble boost you can read off a chart'],
    correct: 'More of the high overtones, less of the lower tones',
    explain: 'Toward the centre tends to bring the higher overtones, toward the edge the lower tones. Tendencies — every pair differs, so listen.',
    why: {
      'Only the level drops; the tone itself stays exactly the same': 'Aim changes the balance too — overtones toward the cup, lower tones toward the edge.',
      'A fixed treble boost you can read off a chart': 'These are tendencies, not fixed amounts. Check by ear on these hats.',
    },
  },
  {
    id: 'hh.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · From which side does the stick usually come to the hats?',
    options: ['The player’s side, crossing over from the throne', 'The audience side, reaching round the stand', 'From underneath, between the pedal and the pair'],
    correct: 'The player’s side, crossing over from the throne',
    explain: 'The player sits behind the kit and the stick lands near the edge on that side — often the right hand crossing over. Mics start on the far side, out of its way.',
    why: {
      'The audience side, reaching round the stand': 'The player plays from behind the kit. The audience side is where a mic can go.',
      'From underneath, between the pedal and the pair': 'The foot works the pedal below; the stick plays the top cymbal from the player’s side.',
    },
  },
  {
    id: 'hh.ctx.1',
    page: 'context',
    prompt: 'Live, a mic under the hats aims up at the bottom cymbal. Where does its rear point?',
    options: ['Down, toward the floor monitors and the pedal', 'Up, toward the overheads above the kit', 'Sideways, straight into the snare drum’s shell'],
    correct: 'Down, toward the floor monitors and the pedal',
    explain: 'Aimed up, its rejection faces down — the floor and its monitors fall toward it. Tilt it, or change the pattern, to put a monitor in the deepest rejection.',
    why: {
      'Up, toward the overheads above the kit': 'Up is where it points — at the cymbal. Its rear faces the floor.',
      'Sideways, straight into the snare drum’s shell': 'Its sides face the kit around it; the rear points down, toward the floor.',
    },
  },
  {
    id: 'hh.ctx.2',
    page: 'context',
    prompt: 'A supercardioid under the hats points straight up. Where does it reject the most?',
    options: ['Below, off to the sides of its rear axis', 'Straight down, on its rear axis only', 'Level with the capsule, out at its two sides'],
    correct: 'Below, off to the sides of its rear axis',
    explain: 'A supercardioid rejects most off the rear axis (near 125°), with a small rear lobe straight behind. Tilt it so the monitor falls there.',
    why: {
      'Straight down, on its rear axis only': 'That is a cardioid’s deepest rejection. A supercardioid has a small rear lobe there.',
      'Level with the capsule, out at its two sides': 'At 90° it still picks up fairly well; the rejection deepens toward the rear.',
    },
  },
  {
    id: 'hh.ctx.studio',
    page: 'context',
    prompt: 'Studio, good room, and the overheads give a crisp hi-hat. What could justify no hat mic at all?',
    options: ['The overheads already carry it — fewer open mics', 'A close hat mic would stop the overheads working', 'Studio drums are recorded with a single mic only'],
    correct: 'The overheads already carry it — fewer open mics',
    explain: 'A well placed overhead pair often carries the hats clearly. A close mic adds focus when the music needs it — otherwise it is one more channel to manage.',
    why: {
      'A close hat mic would stop the overheads working': 'The overheads still work. A close mic is a choice, made for what it adds.',
      'Studio drums are recorded with a single mic only': 'Studios use one mic or many. The question is what this music needs.',
    },
  },
  {
    id: 'hh.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · A mic straight above the clutch, at the centre, would tend to hear the hats how?',
    options: ['More of the high overtones from the cup, less of the edge', 'Exactly as a mic out over the far edge of the pair hears them', 'Mostly the pedal and the tubes of the stand'],
    correct: 'More of the high overtones from the cup, less of the edge',
    explain: 'Toward the centre, the overtones; toward the edge, the lower tones. And straight over the clutch, the mic sits in the rod’s path — keep it clear.',
    why: {
      'Exactly as a mic out over the far edge of the pair hears them': 'Where a mic looks over the plate changes the balance.',
      'Mostly the pedal and the tubes of the stand': 'It still hears the cymbals first; the cup’s overtones are stronger there.',
    },
  },
  {
    id: 'hh.two.1',
    page: 'twoMic',
    prompt: 'A mic above the hats and one under them hear the same closed stroke. Why might they start out of step?',
    options: ['The plates move toward one mic as they move away from the other', 'The bottom mic hears the pedal well before it hears the stick land', 'Two condensers on one source cancel out by themselves'],
    correct: 'The plates move toward one mic as they move away from the other',
    explain: 'Above and below face opposite sides of the plates: a push for one is a pull for the other — opposite polarity, before any time difference. Check both states in mono.',
    why: {
      'The bottom mic hears the pedal well before it hears the stick land': 'Both hear the same stroke. It is the opposite faces of the plates that flip one of them.',
      'Two condensers on one source cancel out by themselves': 'Two mics cancel only through timing or opposite polarity — not by being condensers.',
    },
  },
  polarityCheck(W),
  overheadsFirst(W),
  gainCheck(W, 'loud open accents with the pedal up'),
  {
    id: 'hh.prac.3',
    page: 'practice',
    prompt: 'When could a second hat mic — under the pair — be worth its channel?',
    options: ['When the music wants the warmer underside beside the stick', 'Whenever the overheads are up, to balance them out across the kit', 'To cancel the snare spill by flipping its polarity'],
    correct: 'When the music wants the warmer underside beside the stick',
    explain: 'Underneath, less stick and a warmer top cymbal: a second perspective worth keeping only if it helps — checked in mono with the top mic and the overheads.',
    why: {
      'Whenever the overheads are up, to balance them out across the kit': 'The overheads are no reason on their own. The sound the music needs is.',
      'To cancel the snare spill by flipping its polarity': 'Polarity cannot remove one source from a mic. Aim and the pair’s shading do more.',
    },
  },
  {
    id: 'hh.mix.1',
    page: 'practice',
    prompt: 'MIXED · The far-edge starting point says “about 10–15 cm away”. Away from what?',
    options: ['The top cymbal, directly above its far edge', 'The snare, measured across to the mic', 'The floor, straight up to the mic'],
    correct: 'The top cymbal, directly above its far edge',
    explain: 'Each starting point is measured from the cymbal it names — here straight down to the edge on the far side from the snare.',
    why: {
      'The snare, measured across to the mic': 'The snare is the neighbour to keep away from, not the reference.',
      'The floor, straight up to the mic': 'The floor is not the reference. Measure from the cymbal.',
    },
  },
  {
    id: 'hh.mix.2',
    page: 'practice',
    prompt: 'MIXED · A cardioid points straight down at the hats. Where does it reject the most?',
    options: ['Straight up, directly behind it', 'Out to its sides, at 90°', 'Straight down, in front of it'],
    correct: 'Straight up, directly behind it',
    explain: 'A cardioid rejects most at 180° — directly behind. Pointing down, its rear faces up, toward the crash above and the overheads.',
    why: {
      'Out to its sides, at 90°': 'At the sides it still picks up fairly well; it rejects most straight behind.',
      'Straight down, in front of it': 'That is where it points — its best pickup.',
    },
  },
  {
    id: 'hh.mix.3',
    page: 'practice',
    prompt: 'MIXED · Short of channels, you angle the snare mic a little toward the hats. What do you trade?',
    options: ['One channel for both, with less control over each', 'Nothing: both drums keep their own separate faders', 'The snare’s sound, which no mic can catch this way'],
    correct: 'One channel for both, with less control over each',
    explain: 'One mic angled toward both covers the snare and the hats on one channel — their balance is set by the aim, not a fader. Aiming the snare mic’s null at the hats is the other way, when you want them apart.',
    why: {
      'Nothing: both drums keep their own separate faders': 'One mic is one fader. The aim sets their balance.',
      'The snare’s sound, which no mic can catch this way': 'The snare mic still hears the snare well — a little more hat comes with it.',
    },
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'hh.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A loud rock stage. The snare is loud, the drummer’s fill sits beside the throne. One spare channel; phantom power is available.',
    setups: [
      { id: 'a', label: 'A small condenser 5–10 cm above the bow on the far side, the pair hiding the snare', ok: true, power: 'phantom', feedback: 'A recommended starting point, with the snare shaded by the pair — and the power it needs.' },
      { id: 'b', label: 'A small dynamic a few centimetres over the outer edge on the far side, aimed down', ok: true, power: 'none', feedback: 'A recommended starting point that suits a loud stage — listen for the air as the pair closes.' },
      { id: 'c', label: 'A clip-on condenser under the bottom cymbal, aimed up, its rear toward the floor', ok: true, power: 'phantom', feedback: 'A recommended starting point out of the stick’s way, its rejection toward the monitors.' },
      { id: 'd', label: 'A mic just past the edge, level with the gap between the cymbals', ok: false, power: 'none', feedback: 'That is where the air rushes out as the pair closes — a thump or wind noise. Start above the edge instead.' },
      { id: 'e', label: 'A mic over the bow on the player’s side, where the stick lands', ok: false, power: 'none', feedback: 'That is the stick’s path. Start on the far side, away from it.' },
    ],
    reasons: [docReason(W), CLEAR_REASON, POWER_REASON, { id: 'r.iso', label: 'Close, and with the snare off the mic’s front, helps on a loud stage', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, nameReason(W)],
    explain: 'More than one plan passes this brief. What passes is the reasoning: a sensible starting point measured from the cymbal, clearance from the stick, the air and the player, and power that matches the mic.',
  },
  {
    id: 'hh.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A studio session in a good room. The overheads give a crisp hi-hat. ONE spare channel, with NO phantom power.',
    setups: [
      { id: 'a', label: 'No hat mic: the overheads already carry the hats clearly', ok: true, power: 'none', feedback: 'A fair plan when the overheads carry the hats — fewer open mics, nothing to power.' },
      { id: 'b', label: 'A small dynamic over the far edge, aimed down, the snare on the far side of the pair', ok: true, power: 'none', feedback: 'A recommended starting point, powered by what this input can supply.' },
      { id: 'c', label: 'A small condenser 5–10 cm above the bow, away from the snare', ok: false, power: 'phantom', feedback: 'A fair position — but this input has no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'A clip-on condenser under the bottom cymbal', ok: false, power: 'phantom', feedback: 'A fair position — but a condenser needs phantom power, and this input has none.' },
      { id: 'e', label: 'A mic straight over the clutch, touching the pull rod to hold it still', ok: false, power: 'none', feedback: 'Never on the rod or the clutch: they move with the pedal. Keep the mic clear.' },
    ],
    reasons: [{ ...docReason(W), label: 'The plan starts from what the overheads give, and any mic from a recommended starting point' }, CLEAR_REASON, POWER_REASON, { id: 'r.room', label: 'In a good room, the overheads are part of the hi-hat’s sound', role: 'optional', feedback: 'A fair studio reason.' }, BRAND_REASON, nameReason(W)],
    explain: 'Two plans pass: no hat mic, or a dynamic over the far edge. What passes is the reasoning: start from the overheads, keep clear, and power what this input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: with the pedal down, the stick strikes the top cymbal. How long does the pair ring?', options: ['Briefly — the cymbals hold each other', 'As long as a crash rings', 'It depends only on the stick'], after: 'Now STEP through the stroke (or PLAY ONCE), then switch SETUP to open the pair.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you slide the mic’s aim from the edge toward the cup. What changes?', options: ['More of the lower tones', 'More of the high overtones', 'It depends on these hats'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The mic under the hats points up. Where will a supercardioid reject the floor monitor best?', options: ['Straight below the mic', 'Below, off to one side', 'Level with the mic'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION.' },
  twoMic: { prompt: 'If you flip the under mic’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

/* THE QUICK CHECK (LESSON_JOURNEY §2.5): two per foundation; q.6 critical. */
const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What is a hi-hat?',
    options: ['Two cymbals face to face on a stand, worked by a pedal', 'One cymbal on a stand, struck only with the foot', 'Two crashes hung side by side from one boom'],
    correct: 'Two cymbals face to face on a stand, worked by a pedal',
    explain: 'A pair of cymbals on a stand: the left foot opens and closes them, a stick plays the top one.',
    why: {
      'One cymbal on a stand, struck only with the foot': 'It is a pair, and the stick plays it as much as the foot.',
      'Two crashes hung side by side from one boom': 'The two cymbals sit face to face on one rod, not side by side.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'Are the two cymbals of a hi-hat usually identical?',
    options: ['Rarely: often a lighter one on top, a heavier below', 'Yes: the pair is cast as one matched cymbal', 'No: the bottom one is the smaller of the two'],
    correct: 'Rarely: often a lighter one on top, a heavier below',
    explain: 'The two usually differ in thickness and weight — commonly the heavier one at the bottom. Same diameter, different cymbals.',
    why: {
      'Yes: the pair is cast as one matched cymbal': 'They are sold as a pair but usually differ — often a lighter top and a heavier bottom.',
      'No: the bottom one is the smaller of the two': 'They share a diameter; they differ in weight and thickness.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'Where does much of a hi-hat’s sound spread?',
    options: ['Out sideways, from between the edges', 'Straight up only, toward the ceiling', 'Down the stand into the floor'],
    correct: 'Out sideways, from between the edges',
    explain: 'Up and down, and a lot sideways from between the edges — and the air rushes out there as the pair closes.',
    why: {
      'Straight up only, toward the ceiling': 'Up, yes, but also down and out of the sides.',
      'Down the stand into the floor': 'The sound leaves the plates into the air, not down the stand.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Why does a closed hi-hat ring so briefly?',
    options: ['The cymbals press together and damp each other', 'Closed hats are only played very softly', 'The stand absorbs the ring down through the pedal'],
    correct: 'The cymbals press together and damp each other',
    explain: 'Closed, each cymbal stops the other ringing. Open, they ring freely.',
    why: {
      'Closed hats are only played very softly': 'Closed hats can be played hard. The other cymbal is what stops the ring.',
      'The stand absorbs the ring down through the pedal': 'The stand barely touches the plates. They damp each other.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'Which neighbour does a hat mic usually hear most?',
    options: ['The snare, right beside the hats', 'The floor tom, across the kit', 'The kick’s front head, facing out'],
    correct: 'The snare, right beside the hats',
    explain: 'The snare is the hats’ closest loud neighbour: keep it off the mic’s front, or let the pair hide it.',
    why: {
      'The floor tom, across the kit': 'That is on the far side, by the player’s right leg.',
      'The kick’s front head, facing out': 'The kick is in the middle and low. The snare is right beside the hats.',
    },
  },
  hearingDiagnostic(W),
];

const wedges: Wedge[] = [
  {
    id: 'fill',
    label: 'the drummer’s own fill, on the floor beside the throne',
    short: 'DRUM FILL',
    p: { x: -450, y: KIT_FLOOR_Y, z: 750 },
    lift: 150,
    faces: { x: -0.2, y: 0, z: -1 },
    note: 'Below and behind a mic under the hats: aimed up, the mic’s rear faces toward it — a null can help.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout (the kick lesson’s same monitor); no source gives the position' },
  },
  {
    id: 'downstage',
    label: 'a floor wedge for another player, downstage of the drums, facing upstage',
    short: 'DOWNSTAGE',
    p: { x: KICK_GEOM.L + 900, y: KIT_FLOOR_Y, z: -450 },
    lift: 150,
    faces: { x: -1, y: 0, z: 0 },
    note: 'Out on the audience side, low: also toward the rear of a mic aimed up from under the hats.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout (the kick lesson’s same monitor); no source gives the position' },
  },
  {
    id: 'snare',
    label: 'the snare, beside and below the hats',
    short: 'SNARE',
    p: { x: KIT_DRUMS.snare.c.x, y: KIT_DRUMS.snare.c.y, z: KIT_DRUMS.snare.c.z },
    lift: 0,
    faces: { x: 0, y: -1, z: 0 },
    note: 'The hats’ loudest neighbour: from under the pair it sits off to the side — a pattern helps a little; the distance helps more.',
    prov: { kind: 'illustrative', reason: 'the shared 5-piece kit (kit/GEOMETRY_PROPOSAL.md §2)' },
    glyph: 'none',
  },
];

export const I01A_LESSON: CymbalLesson = {
  id: 'I01a',
  labId: 'percussion',
  title: 'Hi-Hat',
  subtitle: 'Above the pair, away from the snare — or underneath on a clip',
  noun: { one: 'hi-hat', many: 'hi-hats' },
  model: HAT_MODEL,
  micTypeIds: ['sdcCard', 'smallDynCard', 'standClip'],
  zones: HAT_ZONES,
  // Review 2026-10-07 (R12-C04): the same over-and-under pair the lesson's
  // two-mic page draws in its other setup, so both setups show it alike.
  setupPairs: [{ label: 'Over the far edge + under the bottom cymbal, on a clip', A: { zone: 'hh.farEdge', typeId: 'sdcCard', pattern: 'cardioid' }, B: { zone: 'hh.underOpen', typeId: 'standClip', pattern: 'supercardioid' }, variants: ['open'] }],
  pages,
  scenarios,
  symptoms: symptoms(W, { neighbour: 'the snare', air: true }),
  orderTasks: [orderTask(W)],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Two cymbals face to face on a stand — the hi-hats. The player’s left foot opens and closes them with a pedal; a stick plays the top one. The two are rarely identical: usually a lighter cymbal on top and a heavier one below.', src: 'DPA-HH' },
    { title: 'WHERE YOU MEET IT', text: 'On nearly every drum kit, on the player’s left beside the snare (a right-handed layout), on stage and in the studio. This lesson covers both.', src: 'S-REC1' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'It keeps time: a tight closed sound, a washier open one, and the foot’s “chick”. Ask the player what the hats should do here — and whether the overheads already carry them.', src: 'S-RECBK' },
    { title: 'ITS SIZE', text: 'A 14 in (35.6 cm) pair is common and is drawn here, about 85 cm above the floor — inside a typical stand’s 80–92 cm range.', src: 'ZIL-K' },
  ],
  sound: {
    stages: HAT_CYM.strike.stages,
    attack: 'The start of the sound: the stick’s brief contact with the top cymbal, about 2–3 cm in from the edge. A mic above the plate and aimed at it tends to hear more of the stick; underneath, less.',
    body: 'The ring after the stroke: short when the pair is closed (the cymbals hold each other), long and washy when open. Toward the edge tends to carry more of the lower tones, toward the cup more of the high overtones. Tendencies — every pair is different.',
    head: { diameterMm: HAT.spec.d.mm, rods: 0, label: 'the top cymbal, seen from above', strikeSrc: 'DPA-HH' },
  },
  setting: {
    items: [
      { id: 'hats', label: 'the hi-hats', short: 'HI-HATS', note: 'Ringed in amber: the pair on the player’s left, about 85 cm up, worked by the left foot. The cymbals this lesson mics.', prov: { kind: 'sourced', src: 'ZIL-K', quote: '14" HiHats' }, tag: 'THE CYMBALS', scene: 'all', planIds: ['hihat'] },
      { id: 'snare', label: 'snare drum', short: 'SNARE', note: 'Right beside the hats and a little lower: the loudest neighbour a hat mic hears. Keep it off the mic’s front — or let the pair hide it.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'SPILL', scene: 'kit', planIds: ['snare'] },
      { id: 'crash', label: 'crash cymbal (16 in)', short: 'CRASH', note: 'Hangs above the hats’ audience side and swings when struck: a stand mic over that side of the pair runs into it.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'KEEP CLEAR', scene: 'kit', planIds: ['crash1'] },
      { id: 'throne', label: 'drum throne (the player’s seat)', short: 'THRONE', note: 'The player sits behind the kit: the left foot on the hat pedal, the stick crossing over to the hats from this side.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'kick', label: 'kick drum', short: 'KICK', note: 'Low in the middle of the kit: farther from the hats than the snare, but loud.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'SPILL', scene: 'kit', planIds: ['kick', 'pedal'] },
      { id: 'fill', label: 'the drummer’s fill (monitor)', short: 'DRUM FILL', note: 'A floor monitor beside the throne so the drummer can hear the band — loud, and low on the floor.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'downstage', label: 'a downstage wedge (another player’s monitor)', short: 'WEDGE', note: 'Out on the audience side, facing back toward the stage.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Live, the audience already hears the acoustic hats; the PA adds what the room needs.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a studio there are no wedges on the floor, and the overheads and the room often carry the hats.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors feed the players, the PA faces the audience, and the snare is right beside the hats. Spill and the gain available before feedback push toward close, aimed pickup — with as few open mics as the music needs.',
    studio: 'STUDIO: no wedges on the floor, repeated trials are practical when the drummer stops, and the overheads may already carry the hats.',
  },
  diagnostic,
  practice: {
    task: 'Choose a hi-hat plan — none, one mic above, or one underneath — for a given kit and performance, place it safely, and explain what would justify a second mic. With a real kit and the drummer’s agreement, you can record what you tried below.',
    fields: [
      { id: 'cym', label: 'Hi-hats (size, top and bottom weights)', kind: 'text' },
      { id: 'plan', label: 'Plan', kind: 'choice', choices: ['no hat mic', 'one above', 'one underneath', 'above and underneath'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser', 'small dynamic', 'clip-on condenser', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, from which cymbal', kind: 'text' },
      { id: 'aim', label: 'Aim (edge, bow or cup), and where the snare sits off it', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'Every kit position and height (the hats at h 850, the snare, the crash, the throne) is a drawing default of the shared kit — so no HEIGHT-above-floor readout is shown.', dims: ['yFloor'] },
    { text: 'The cymbals’ swing and the hats’ opening travel (12.7 mm, a trial reading of a leakage tip), drawn as keep-outs — values for the owner to approve.', dims: ['cym'] },
    { text: 'The cymbal profile (8 % rise, 20 % bell), the clutch, rod, seat, stand tubes and tripod — the shared cymbal family’s drawing defaults.', dims: [] },
    { text: 'The stick’s side of the pair (± 80° about the throne, a stick’s 406.4 mm up), the air-burst ring (60 mm wide, 30 mm above) and the clamp on the stand — drawn illustratively.', dims: [] },
    { text: 'The bands with no published number: “a few centimetres” over the outer edge (4.5–6.5 cm) and the underside (5–8.5 cm under the bottom cymbal, 10–15 cm out) are the lab’s drawings.', dims: [] },
    { text: 'The family draws the open pair with the bottom cymbal lowered; on a real stand the top cymbal rises. The gap between them is what the lesson uses.', dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front, square to the top cymbal’s edge plane, rounded to ≈ 5 mm.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every pair of hats, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a typical 5-piece kit, a 14 in pair drawn to a common profile, the stick’s side, the swing and the air at the edges as drawn keep-outs, mic patterns as textbook shapes, and motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the drummer stopped.',
  copy: HAT_COPY,
  cym: HAT_CYM,
};
