/**
 * I01d SPLASH CYMBAL — the lesson's pages as DATA. Words from the owner's
 * lesson (docs/labs/miking/source_text/Splash-Cymbal-Miking-Technique-
 * Research.txt, "L<n>" in comments only) with the fixes in
 * docs/labs/miking/CORRECTIONS_LOG.md (SP-…): the arm's place moved clear of
 * the 16 in crash; the stack said in words; no published distance, so every
 * band is a place to begin. Owner ruling 2026-10-04: no sources, brands or
 * badges on screen. FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, LessonPages, PageContent, SourcePageId, SetupTask } from '../../engine/model/types.ts';
import type { CymbalLesson } from '../shared/cymbals/cymbalLesson.ts';
import { BRAND_REASON, CLEAR_REASON, POWER_REASON, docReason, gainCheck, hearingCheck, hearingDiagnostic, nameReason, orderTask, overheadsFirst, polarityCheck, powerCheck, spillCheck, symptoms, type CymWords } from '../shared/cymbals/cymbalItems.ts';
import { COMMON_UNKNOWNS, THRONE_ITEM, accuracyDetail, practiceSheet, stageItems, stageWedges, stageWords } from '../shared/cymbals/cymbalCommon.ts';
import { SPLASH_MODEL } from './geometry.ts';
import { ARM, SPLASH_ZONES } from './model.ts';
import { SPLASH_COPY, SPLASH_CYM } from './copy.ts';

const W: CymWords = { pfx: 'sp', one: 'splash', the: 'the splash', mic: 'splash mic' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the splash',
    goal: 'Get to know the splash cymbal — small, thin, for short accents — on its arm or stacked on a crash, where you meet it and what it does, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A small “effect” cymbal for quick accents, mounted wherever the player can reach it — on an arm, upside down on a crash, or in a stack. Its mount is the player’s.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a stroke becomes sound in a splash — fast, high and short — and who on the kit hears it.',
    credit: { scenarios: ['sp.snd.1', 'sp.snd.2', 'sp.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'A splash speaks at once and fades soon; small and thin, it rings higher than a crash and swings a lot. On top of a crash, the two sound and move together.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where a splash sits — between the toms and the crashes, or on a crash — the space the stick and the swing need, what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['sp.set.1', 'sp.set.2', 'sp.set.hear'], note: 'Answer the three checks.' },
    takeaway: 'A splash sits among loud neighbours: a crash above or under it, a tom below. Ask the player which cues it plays, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a splash mic by its properties — pattern, power, size and mount — after deciding whether the cue needs its own mic at all.',
    credit: { scenarios: ['sp.mic.1', 'sp.mic.power', 'sp.mic.spill', 'sp.rec.1'], note: 'Answer the four checks (one reaches back to how the splash sounds).' },
    takeaway: 'The overheads usually carry a splash. When a cue needs its own mic, a small condenser, a small dynamic or a tiny clip-on under it can serve. Condensers need phantom power.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — above the splash on the side away from the player, or under it on the arm — clear of the stick and the swing, then move the mic.',
    credit: { scenarios: ['sp.place.1', 'sp.place.2', 'sp.place.3', 'sp.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points (switch MOUNT for the splash on the crash), and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'No distance is published for a splash: a zone is a place to begin, measured from the plate. Above, or underneath on the arm; on a crash, above both. Clearance comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'With a small mic under the splash aimed up, turn its rejection toward the drummer’s floor monitor — and know when the overheads are enough.',
    credit: { scenarios: ['sp.ctx.1', 'sp.ctx.2', 'sp.ctx.studio', 'sp.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the drummer’s fill sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Aimed up from under the splash, a mic’s rear faces the floor. Real nulls are shallow, and no mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See how a mic over the splash and one under it start out of step, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: ['sp.two.1', 'sp.two.pol', 'sp.two.oh'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the three checks.' },
    takeaway: 'Over and under face opposite sides of the plate, so they start opposite; polarity flips a sign, it does not remove a delay. Compare every pair in mono.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — clearance, the swing, aim, the pattern, gain and polarity — before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up a splash mic in the right order, choose and justify a plan for two briefs (from no splash mic to one under it), and say what would justify one at all.',
    credit: { scenarios: ['sp.prac.order', 'sp.prac.gain', 'sp.prac.setup1', 'sp.prac.setup2', 'sp.prac.3', 'sp.mix.1', 'sp.mix.2', 'sp.mix.3'], note: 'Put the setup in order, answer the gain check, complete both briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real kit.' },
    takeaway: 'Safe clearance, correct power and level checks, a reason for the mic at all, and an accurate account of polarity versus delay pass. More than one plan can pass.',
  },
};

const scenarios: MikingScenario[] = [
  {
    id: 'sp.snd.1',
    page: 'sound',
    prompt: 'Compared with a crash, why does a splash speak fast and fade so soon?',
    options: ['It is smaller and thinner, so it rings higher and shorter', 'It is struck much harder, so it uses up all its energy at once', 'It is held tightly on its stand, so it cannot ring on'],
    correct: 'It is smaller and thinner, so it rings higher and shorter',
    explain: 'A small, thin plate rings in the same kinds of shapes as a crash, but higher, and gives its energy away quickly — a short accent.',
    why: {
      'It is struck much harder, so it uses up all its energy at once': 'Splashes are often struck lightly. Their size and thinness make them short.',
      'It is held tightly on its stand, so it cannot ring on': 'It sits loose on its felts like any cymbal. Its size and weight decide.',
    },
  },
  {
    id: 'sp.snd.2',
    page: 'sound',
    prompt: 'An 8 in splash sits upside down on top of a crash. What happens when the crash is struck?',
    options: ['The two plates ring and swing together', 'The splash stays still; only the crash moves', 'The splash stops the crash from ringing at all'],
    correct: 'The two plates ring and swing together',
    explain: 'Stacked on one rod with a felt between, the two move and sound together — a different sound the player chose.',
    why: {
      'The splash stays still; only the crash moves': 'They share a rod: the crash carries the splash.',
      'The splash stops the crash from ringing at all': 'The felt keeps them apart; both ring — together.',
    },
  },
  {
    id: 'sp.snd.3',
    page: 'sound',
    prompt: 'A smaller plate, the same kind of shapes: how do its pitches compare with a larger one’s?',
    options: ['Each one higher, with the same ratios between them', 'Each one lower, because it is so much lighter to move', 'The same pitches, only quieter, as it is smaller'],
    correct: 'Each one higher, with the same ratios between them',
    explain: 'On the simplified flat disc, shrinking the plate raises every shape’s pitch together: the ratios between the shapes stay the same.',
    why: {
      'Each one lower, because it is so much lighter to move': 'A smaller, lighter plate rings higher, not lower.',
      'The same pitches, only quieter, as it is smaller': 'Size changes the pitches, not only the level.',
    },
  },
  {
    id: 'sp.set.1',
    page: 'setting',
    prompt: 'On its arm here, what is right under the splash?',
    options: ['The 10 in rack tom', 'The floor tom on its legs', 'The hi-hat pedal'],
    correct: 'The 10 in rack tom',
    explain: 'The arm holds the splash over the 10 in tom: the tom mic hears the splash, and a splash mic aimed down hears the tom.',
    why: {
      'The floor tom on its legs': 'The floor tom is on the far side, under the ride.',
      'The hi-hat pedal': 'The pedal is on the floor at the left. Under the splash is a rack tom.',
    },
  },
  {
    id: 'sp.set.2',
    page: 'setting',
    prompt: 'The player has tightened a stack of cymbals on purpose. What do you do before miking it?',
    options: ['Leave it as it is: the tension is part of its sound', 'Loosen it so that each plate rings out on its own', 'Take it apart and mic each of the plates one by one'],
    correct: 'Leave it as it is: the tension is part of its sound',
    explain: 'A stack’s tension sets its sound — tight and short, or looser and trashier. It is the player’s choice: mic it as it is.',
    why: {
      'Loosen it so that each plate rings out on its own': 'That changes the instrument the player chose. Mic it as set.',
      'Take it apart and mic each of the plates one by one': 'A stack is one instrument. Mic it as the player set it.',
    },
  },
  hearingCheck(W),
  {
    id: 'sp.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A splash plays one short cue in a song. What do you check before giving it a mic?',
    options: ['Whether the overheads already carry that cue', 'Whether the splash is newer than the crash', 'Whether the splash matches the ride’s brand'],
    correct: 'Whether the overheads already carry that cue',
    explain: 'A splash is often one short accent; the overheads usually carry it. A close mic earns its channel when that cue needs more focus.',
    why: {
      'Whether the splash is newer than the crash': 'Its age says nothing about whether the overheads carry it.',
      'Whether the splash matches the ride’s brand': 'A brand says nothing about whether it needs a mic.',
    },
  },
  {
    id: 'sp.mic.1',
    page: 'microphone',
    prompt: 'Why can a tiny clip-on condenser suit a splash on an arm?',
    options: ['It holds on the arm, under the plate, out of the stick’s way', 'It is the only type that can hear such a small cymbal at all', 'It needs no power, so whichever input is spare will do'],
    correct: 'It holds on the arm, under the plate, out of the stick’s way',
    explain: 'Small and light, it can hold on the arm under the splash, out of the way. It needs phantom power, like any condenser.',
    why: {
      'It is the only type that can hear such a small cymbal at all': 'Any of these mics hears a splash. Its size and mount are the reasons.',
      'It needs no power, so whichever input is spare will do': 'A condenser needs phantom power, however small.',
    },
  },
  powerCheck(W, 'the small dynamic'),
  spillCheck(W, 'the crash above'),
  {
    id: 'sp.place.1',
    page: 'placement',
    prompt: 'No distance is published for a splash. How do you use “about 15–25 cm above”?',
    options: ['As a place to begin, then move and listen', 'As an exact rule, measured to the millimetre', 'As a limit: closer than 15 cm is not allowed'],
    correct: 'As a place to begin, then move and listen',
    explain: 'With no fixed number to go by, the band is a sensible start — clear of the stick and the swing — and your ears decide from there.',
    why: {
      'As an exact rule, measured to the millimetre': 'Starting points are places to begin, not exact rules.',
      'As a limit: closer than 15 cm is not allowed': 'It is not a limit. Clearance from the stick and the swing is.',
    },
  },
  {
    id: 'sp.place.2',
    page: 'placement',
    prompt: 'The splash sits on top of a crash. Where is the clear side for a mic?',
    options: ['Above, on the side away from the player', 'Underneath, squeezed in between the two plates', 'Level with the edges, in the swing'],
    correct: 'Above, on the side away from the player',
    explain: 'On a crash, the splash is the top plate: above it, on the far side, is clear of the stick. Between the plates there is no room — they move as one.',
    why: {
      'Underneath, squeezed in between the two plates': 'The plates are stacked on a felt: there is no room between them.',
      'Level with the edges, in the swing': 'That is where both plates swing. Start above.',
    },
  },
  {
    id: 'sp.place.3',
    page: 'placement',
    prompt: 'You move the mic closer to the splash. What tends to change?',
    options: ['More of its quick attack, less of the kit around it', 'Only the level rises; the tone itself stays exactly the same', 'A fixed bass boost you can read off a chart'],
    correct: 'More of its quick attack, less of the kit around it',
    explain: 'Closer tends to catch more of the splash’s attack and less of its neighbours — and very close, a narrower part of the plate. Tendencies.',
    why: {
      'Only the level rises; the tone itself stays exactly the same': 'Distance changes the balance too, not only the level.',
      'A fixed bass boost you can read off a chart': 'These are tendencies, not fixed amounts.',
    },
  },
  {
    id: 'sp.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · A splash on top of a crash: what moves when the crash is struck?',
    options: ['Both plates, together', 'Only the crash under it', 'Only the splash on top'],
    correct: 'Both plates, together',
    explain: 'The crash carries the splash: both swing together, so a mic clears both.',
    why: {
      'Only the crash under it': 'The splash sits on it and moves with it.',
      'Only the splash on top': 'The crash under it swings too — and carries the splash.',
    },
  },
  {
    id: 'sp.ctx.1',
    page: 'context',
    prompt: 'A small mic under the splash aims up. Where does its rear point?',
    options: ['Down, toward the tom, the floor and its monitors', 'Up, toward the crash and the overheads hanging above', 'Sideways, toward the snare drum and the hats'],
    correct: 'Down, toward the tom, the floor and its monitors',
    explain: 'Aimed up, its rejection faces down. Tilt it, or change its pattern, to put a floor monitor in the deepest rejection.',
    why: {
      'Up, toward the crash and the overheads hanging above': 'That is where it points.',
      'Sideways, toward the snare drum and the hats': 'Its sides face the kit around; its rear points down.',
    },
  },
  {
    id: 'sp.ctx.2',
    page: 'context',
    prompt: 'A supercardioid under the splash points straight up. Where does it reject the most?',
    options: ['Below, off to the sides of its rear axis', 'Straight down, on its rear axis only', 'Level with the capsule, out at its sides'],
    correct: 'Below, off to the sides of its rear axis',
    explain: 'A supercardioid rejects most off the rear axis (near 125°), with a small lobe straight behind.',
    why: {
      'Straight down, on its rear axis only': 'That is a cardioid’s deepest rejection.',
      'Level with the capsule, out at its sides': 'At 90° it still picks up fairly well.',
    },
  },
  {
    id: 'sp.ctx.studio',
    page: 'context',
    prompt: 'Studio; the overheads carry the splash’s cue clearly. What could justify no splash mic?',
    options: ['The overheads already carry it — fewer open mics', 'A splash mic would stop the overheads from working properly', 'Studio cymbals are recorded with a single mic only'],
    correct: 'The overheads already carry it — fewer open mics',
    explain: 'If the cue is clear in the overheads, a splash mic adds a channel and little else.',
    why: {
      'A splash mic would stop the overheads from working properly': 'The overheads still work. A close mic is a choice for what it adds.',
      'Studio cymbals are recorded with a single mic only': 'Studios use one mic or many. The music decides.',
    },
  },
  {
    id: 'sp.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · What hangs above the splash on its arm, here?',
    options: ['The 16 in crash, which swings too', 'The ride, which the player keeps time on', 'Nothing: a splash hangs highest of all'],
    correct: 'The 16 in crash, which swings too',
    explain: 'The splash sits below and in front of the 16 in crash: two plates that swing, close together — a mic keeps clear of both.',
    why: {
      'The ride, which the player keeps time on': 'The ride is on the other side, over the floor tom.',
      'Nothing: a splash hangs highest of all': 'Here the crash hangs above it. Splashes go wherever the player reaches them.',
    },
  },
  {
    id: 'sp.two.1',
    page: 'twoMic',
    prompt: 'A mic over the splash and one under it hear the same accent. Why might they start out of step?',
    options: ['The plate moves toward one mic as it moves away from the other', 'The bottom mic hears the tom below well before it hears the splash', 'Two condensers on one cymbal cancel each other out by themselves'],
    correct: 'The plate moves toward one mic as it moves away from the other',
    explain: 'Over and under face opposite sides of the plate: a push for one is a pull for the other — opposite polarity, before any time difference.',
    why: {
      'The bottom mic hears the tom below well before it hears the splash': 'Both hear the splash. The opposite faces flip one of them.',
      'Two condensers on one cymbal cancel each other out by themselves': 'Two mics cancel only through timing or opposite polarity.',
    },
  },
  polarityCheck(W),
  overheadsFirst(W),
  gainCheck(W, 'the hardest accent in the song'),
  {
    id: 'sp.prac.3',
    page: 'practice',
    prompt: 'When could a close splash mic be worth its channel, with the overheads up?',
    options: ['When one important cue gets lost in the overheads', 'Whenever a splash is mounted on an arm of its own', 'To cancel the crash above it by flipping its polarity'],
    correct: 'When one important cue gets lost in the overheads',
    explain: 'A splash often plays one cue; a close mic earns its channel when that cue needs focus the overheads do not give.',
    why: {
      'Whenever a splash is mounted on an arm of its own': 'The mount is no reason on its own. The music decides.',
      'To cancel the crash above it by flipping its polarity': 'Polarity cannot remove one source from a mic.',
    },
  },
  {
    id: 'sp.mix.1',
    page: 'practice',
    prompt: 'MIXED · “About 15–25 cm above the splash.” Measured from what, and how?',
    options: ['From the plate, square to it, on the tilt', 'From the floor, straight up to the mic, like a stand', 'From the tom below, up through the plate to the mic'],
    correct: 'From the plate, square to it, on the tilt',
    explain: 'Each starting point is measured from the cymbal it names, square to its plate.',
    why: {
      'From the floor, straight up to the mic, like a stand': 'The floor is not the reference.',
      'From the tom below, up through the plate to the mic': 'The tom is a neighbour, not the reference.',
    },
  },
  {
    id: 'sp.mix.2',
    page: 'practice',
    prompt: 'MIXED · A splash on top of a crash sounds trashy. The player likes it. What do you do?',
    options: ['Mic it as it is: the stacked sound is the choice', 'Take the splash off so that the crash sounds cleaner', 'Tighten the wing nut down hard to quieten it'],
    correct: 'Mic it as it is: the stacked sound is the choice',
    explain: 'The stack is the instrument the player chose. Mic what is there, from a clear place.',
    why: {
      'Take the splash off so that the crash sounds cleaner': 'The cymbals are the player’s. Mic them as set.',
      'Tighten the wing nut down hard to quieten it': 'A cymbal must move freely; over-tightening chokes it and can crack it.',
    },
  },
  {
    id: 'sp.mix.3',
    page: 'practice',
    prompt: 'MIXED · You flip the under mic’s polarity. What changes?',
    options: ['The sign of its signal; the delay stays the same', 'The delay between the two mics drops all the way to zero', 'The mic’s pattern turns round to face the floor'],
    correct: 'The sign of its signal; the delay stays the same',
    explain: 'Polarity flips the sign; only distance changes when a sound arrives.',
    why: {
      'The delay between the two mics drops all the way to zero': 'Only distance (or a delay setting) changes the arrival time.',
      'The mic’s pattern turns round to face the floor': 'The pattern stays where the mic points.',
    },
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'sp.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A loud stage. One splash cue keeps getting lost. The splash is on its arm over the 10 in tom. One spare channel; phantom power is available.',
    setups: [
      { id: 'a', label: 'A small condenser 15–25 cm above the splash on the far side, aimed at its bow', ok: true, power: 'phantom', feedback: 'A recommended starting point — with the power it needs.' },
      { id: 'b', label: 'A tiny clip-on condenser held on the arm, 8–13 cm under the splash, aimed up', ok: true, power: 'phantom', feedback: 'A recommended starting point, out of the stick’s way, its rear toward the floor.' },
      { id: 'c', label: 'A small dynamic above the splash on the far side', ok: true, power: 'none', feedback: 'A recommended starting point that needs no power.' },
      { id: 'd', label: 'A mic between the splash and the crash above it, level with both edges', ok: false, power: 'none', feedback: 'That is where both plates swing. Start above or under the splash.' },
      { id: 'e', label: 'A mic taped to the splash’s arm right under the plate, touching it', ok: false, power: 'none', feedback: 'Never touching the cymbal: it moves and rings. Keep clear of it.' },
    ],
    reasons: [docReason(W), CLEAR_REASON, POWER_REASON, { id: 'r.iso', label: 'Close, and aimed at the splash, helps one cue on a loud stage', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, nameReason(W)],
    explain: 'More than one plan passes this brief. What passes is the reasoning: a sensible starting point measured from the splash, clearance from the stick, the swing and the crash, and power that matches the mic.',
  },
  {
    id: 'sp.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A studio session. The splash sits on top of the 18 in crash; the overheads carry it well. ONE spare channel, with NO phantom power.',
    setups: [
      { id: 'a', label: 'No splash mic: the overheads already carry the stacked cymbals', ok: true, power: 'none', feedback: 'A fair plan — fewer open mics, nothing to power.' },
      { id: 'b', label: 'A small dynamic above the splash on the far side, hearing both plates', ok: true, power: 'none', feedback: 'A recommended starting point, powered by what this input can supply.' },
      { id: 'c', label: 'A small condenser above the splash on the far side', ok: false, power: 'phantom', feedback: 'A fair position — but this input has no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'A clip-on condenser between the splash and the crash', ok: false, power: 'phantom', feedback: 'No room there, and no phantom power on this input.' },
      { id: 'e', label: 'Take the splash off the crash so a mic can go between them', ok: false, power: 'none', feedback: 'The stack is the player’s choice. Mic it as it is.' },
    ],
    reasons: [{ ...docReason(W), label: 'The plan starts from what the overheads give, and any mic from a recommended starting point' }, CLEAR_REASON, POWER_REASON, { id: 'r.room', label: 'In a good room, the overheads are part of the splash’s sound', role: 'optional', feedback: 'A fair studio reason.' }, BRAND_REASON, nameReason(W)],
    explain: 'Two plans pass: no splash mic, or a dynamic above the stack. What passes is the reasoning: start from the overheads, keep clear, and power what this input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: a splash is struck near its edge. Compared with a crash, how long does it ring?', options: ['Shorter', 'About the same', 'Longer'], after: 'Now STEP through the stroke (or PLAY ONCE), then switch SETUP to the splash on the crash.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the mic closer to the splash. What changes?', options: ['More of the kit around it', 'More of its quick attack', 'It depends on this splash'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The mic under the splash points up. Where will a supercardioid reject the floor monitor best?', options: ['Straight below the mic', 'Below, off to one side', 'Level with the mic'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION.' },
  twoMic: { prompt: 'If you flip the under mic’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What is a splash cymbal for?',
    options: ['Short, quick accents', 'Keeping steady time', 'The foot’s “chick”'],
    correct: 'Short, quick accents',
    explain: 'A splash is a small effect cymbal for short accents.',
    why: {
      'Keeping steady time': 'That is the ride or the hi-hats.',
      'The foot’s “chick”': 'That is the hi-hat pedal.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'Which is one common way to mount a splash?',
    options: ['Upside down on top of a crash', 'Inside the kick drum’s shell', 'Clamped flat to the snare’s rim'],
    correct: 'Upside down on top of a crash',
    explain: 'On an arm, upside down on top of a larger cymbal, or in a stack: wherever the player reaches it quickly.',
    why: {
      'Inside the kick drum’s shell': 'A cymbal needs to swing loose in the air.',
      'Clamped flat to the snare’s rim': 'A cymbal is held loosely on a rod, not clamped to a drum.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'Compared with a crash, a splash rings…',
    options: ['Higher and shorter', 'Lower and much longer', 'Exactly the same'],
    correct: 'Higher and shorter',
    explain: 'Smaller and thinner: higher, and it fades soon.',
    why: {
      'Lower and much longer': 'A smaller plate rings higher and shorter.',
      'Exactly the same': 'Size and weight change its sound a lot.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'A splash on top of a crash: when the crash is struck, the splash…',
    options: ['rings and swings with it', 'stays perfectly still', 'stops the crash ringing'],
    correct: 'rings and swings with it',
    explain: 'Stacked on one rod, they sound and move together.',
    why: {
      'stays perfectly still': 'The crash carries it.',
      'stops the crash ringing': 'A felt keeps them apart: both ring.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'What should you do with a stack the player has tensioned on purpose?',
    options: ['Leave it as it is', 'Loosen it to ring', 'Take it apart'],
    correct: 'Leave it as it is',
    explain: 'The tension is part of its sound — the player’s choice.',
    why: {
      'Loosen it to ring': 'That changes the instrument the player chose.',
      'Take it apart': 'It is one instrument. Mic it as set.',
    },
  },
  hearingDiagnostic(W),
];

export const I01D_LESSON: CymbalLesson = {
  id: 'I01d',
  labId: 'percussion',
  title: 'Splash Cymbal',
  subtitle: 'On an arm or on top of a crash — a short cue among loud neighbours',
  noun: { one: 'splash', many: 'splashes' },
  model: SPLASH_MODEL,
  micTypeIds: ['sdcCard', 'smallDynCard', 'standClip'],
  zones: SPLASH_ZONES,
  pages,
  scenarios,
  symptoms: symptoms(W, { neighbour: 'the crash above' }),
  orderTasks: [orderTask(W)],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A small, thin cymbal for short accents — an “effect” cymbal. It speaks fast and fades soon.', src: 'SAB-101' },
    { title: 'WHERE YOU MEET IT', text: 'On many drum kits, mounted wherever the player can reach it quickly: on an arm between the larger cymbals, upside down on top of a crash, or in a stack of two or three plates bolted together.', src: 'ZIL-BARATA' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Quick accents and cues — often a few in a song. Ask the player which cues matter, and whether the overheads already carry them.', src: 'SAB-101' },
    { title: 'ITS SIZE', text: 'Splashes run from about 6 to 12 in (15–30 cm). A 10 in (25.4 cm) on an arm and an 8 in (20.3 cm) on top of a crash are drawn here.', src: 'SAB-101' },
  ],
  sound: {
    stages: SPLASH_CYM.strike.stages,
    attack: 'The start of the sound: the stick near the edge, and the small plate responding at once. A mic above, aimed at it, tends to hear more of that quick attack.',
    body: 'A short ring: small and thin, the splash fades soon. On top of a crash, the two plates ring together. Tendencies — every splash is different.',
    head: { diameterMm: ARM.spec.d.mm, rods: 0, label: 'the splash, seen from above', strikeSrc: 'SAB-101' },
  },
  setting: {
    items: [
      { id: 'splash', label: 'the splash', short: 'SPLASH', note: 'Drawn in its place and ringed in amber: on its arm over the 10 in tom, or (switch MOUNT) upside down on top of the 18 in crash.', prov: { kind: 'sourced', src: 'ZIL-ASPL', quote: 'variants "8" (A0210), "10" (A0211)' }, tag: 'THE CYMBAL', scene: 'all', planIds: ['cymbal.own'] },
      { id: 'tom', label: 'the 10 in rack tom', short: '10 IN TOM', note: 'Right under the splash on its arm: the tom mic hears the splash, and a splash mic aimed down hears the tom.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'SPILL', scene: 'kit', planIds: ['tom1'] },
      { id: 'crash1', label: 'the 16 in crash', short: 'CRASH', note: 'Above and beside the splash on its arm: two plates that swing, close together.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'KEEP CLEAR', scene: 'kit', planIds: ['crash1'] },
      { id: 'crash2', label: 'the 18 in crash', short: '18 IN CRASH', note: 'In the other mount, it carries an 8 in splash upside down on top: the two move and sound together.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'THE HOST', scene: 'kit', planIds: ['crash2'] },
      THRONE_ITEM('The player sits behind the kit; the splash is struck from this side, quickly, between other strokes.'),
      ...stageItems('splash'),
    ],
    ...stageWords('splash'),
  },
  diagnostic,
  practice: {
    task: 'Decide whether a splash cue needs its own mic for a given kit and performance — none, above, or under it on the arm — place it safely, and explain the choice. With a real kit and the drummer’s agreement, you can record what you tried below.',
    fields: practiceSheet('splash', ['no splash mic', 'above the splash', 'under it, on the arm'], 'Aim, and where the crash and the tom sit off it'),
  },
  unknowns: [
    ...COMMON_UNKNOWNS,
    { text: 'The splash’s place on its arm (moved clear of the 16 in crash), the arm’s clamp height and bends, and the piggyback spacing — drawing defaults; only the rod’s 3/8 in is published.', dims: ['splash', 'piggy'] },
    { text: 'Every band here: no source gives a distance for a splash. Above (15–25 cm) and underneath (8–13 cm) are the lab’s drawings.', dims: [] },
    { text: 'The stack (two or three plates on one bolt) is said in words, not drawn.', dims: [] },
  ],
  live: { wedges: stageWedges('Below and behind a mic under the splash: aimed up, the mic’s rear faces toward it — a null can help.', 'Out on the audience side, low: toward the rear of a mic aimed up from under the splash.') },
  accuracyDetail: accuracyDetail('a 10 in splash on an arm and an 8 in on a crash, drawn to a common profile'),
  copy: SPLASH_COPY,
  cym: SPLASH_CYM,
};
