/**
 * I01e CHINA CYMBAL — the lesson's pages as DATA. Words from the owner's
 * lesson (docs/labs/miking/source_text/China-Cymbal-Miking-Technique-
 * Research.txt, "L<n>" in comments only) with the fixes in
 * docs/labs/miking/CORRECTIONS_LOG.md (CH-…, CY-08, CY-09): the China takes
 * the 18 in crash's stand; turned over, its valley becomes a raised ring and
 * its lip turns down; the whole profile is a drawing; no published distance.
 * Owner ruling 2026-10-04: no sources, brands or badges on screen. FULLY
 * SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, LessonPages, PageContent, SourcePageId, SetupTask } from '../../engine/model/types.ts';
import type { CymbalLesson } from '../shared/cymbals/cymbalLesson.ts';
import { BRAND_REASON, CLEAR_REASON, POWER_REASON, docReason, gainCheck, hearingCheck, hearingDiagnostic, nameReason, orderTask, overheadsFirst, polarityCheck, powerCheck, spillCheck, symptoms, type CymWords } from '../shared/cymbals/cymbalItems.ts';
import { COMMON_UNKNOWNS, THRONE_ITEM, accuracyDetail, practiceSheet, stageItems, stageWedges, stageWords } from '../shared/cymbals/cymbalCommon.ts';
import { CHINA_MODEL } from './geometry.ts';
import { CHINA_ZONES, UP } from './model.ts';
import { CHINA_COPY, CHINA_CYM } from './copy.ts';

const W: CymWords = { pfx: 'ch', one: 'China', the: 'the China', mic: 'China mic' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the China',
    goal: 'Get to know the China cymbal — a squarer cup and an upturned edge, upright or turned over — where you meet it and what it does in the music, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A China has a squarer cup and an upturned lip; turned over, its valley becomes a raised ring. Players crash it turned over, and some ride a large one upright. Its mount is the player’s choice.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a stroke becomes sound in a China — quick, harsh, trashy — and who on the kit hears it.',
    credit: { scenarios: ['ch.snd.1', 'ch.snd.2', 'ch.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'A China speaks fast and harsh, roars, and fades sooner than a crash. It cuts through everything — every mic on the kit hears it.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the China sits here — on the right, over the 12 in tom, beside the ride — the space the stick and the swing need, what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['ch.set.1', 'ch.set.2', 'ch.set.hear'], note: 'Answer the three checks.' },
    takeaway: 'A China hangs high among loud neighbours and swings when crashed. Its lowest point depends on how it is mounted. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a China mic by its properties — pattern, power, size and mount — after deciding whether it needs its own mic at all.',
    credit: { scenarios: ['ch.mic.1', 'ch.mic.power', 'ch.mic.spill', 'ch.rec.1'], note: 'Answer the four checks (one reaches back to how the China sounds).' },
    takeaway: 'The overheads usually carry a China. When it needs its own mic, a small condenser or dynamic above, or a mic underneath (a side-address one can do this too), can serve. Condensers need phantom power.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — above the China on the side away from the player, or under its lowest point — clear of the stick and the swing, then move the mic.',
    credit: { scenarios: ['ch.place.1', 'ch.place.2', 'ch.place.3', 'ch.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different suggested starting points (switch MOUNT for the China turned over), and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'No distance is published for a China: a zone is a place to begin, measured from its rim plane — or, underneath, from its lowest point in its mount. Clearance comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'With a mic under the China aimed up, turn its rejection toward the drummer’s floor monitor — and know when the overheads are enough.',
    credit: { scenarios: ['ch.ctx.1', 'ch.ctx.2', 'ch.ctx.studio', 'ch.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the drummer’s fill sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Aimed up from under the China, a mic’s rear faces the floor. Real nulls are shallow, and no mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See how a mic over the China and one under it start out of step, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: ['ch.two.1', 'ch.two.pol', 'ch.two.oh'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the three checks.' },
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
    goal: 'Set up a China mic in the right order, choose and justify a plan for two briefs (from no China mic to one underneath), and say what would justify one at all.',
    credit: { scenarios: ['ch.prac.order', 'ch.prac.gain', 'ch.prac.setup1', 'ch.prac.setup2', 'ch.prac.3', 'ch.mix.1', 'ch.mix.2', 'ch.mix.3'], note: 'Put the setup in order, answer the gain check, complete both briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real kit.' },
    takeaway: 'Safe clearance, correct power and level checks, a reason for the mic at all, and an accurate account of polarity versus delay pass. More than one plan can pass.',
  },
};

const scenarios: MikingScenario[] = [
  {
    id: 'ch.snd.1',
    page: 'sound',
    prompt: 'What gives a China its trashy, broken-up sound, compared with a crash?',
    options: ['Its odd shape — the squarer cup and the upturned lip', 'A harder stick, which the player keeps for the China', 'Rivets fitted to each China, which buzz as it rings'],
    correct: 'Its odd shape — the squarer cup and the upturned lip',
    explain: 'The China’s shape breaks its ringing up into a trashy roar that fades sooner than a crash. Some Chinas add rivets or jingles — not all.',
    why: {
      'A harder stick, which the player keeps for the China': 'The same stick plays everything. The shape of the plate is the difference.',
      'Rivets fitted to each China, which buzz as it rings': 'Some Chinas have rivets; many do not. The shape is what makes it a China.',
    },
  },
  {
    id: 'ch.snd.2',
    page: 'sound',
    prompt: 'A China is turned over, cup down. What becomes its highest ring?',
    options: ['The valley, now a raised ring above the rim', 'The cup, which now points straight up', 'The lip, which now turns up toward the stick'],
    correct: 'The valley, now a raised ring above the rim',
    explain: 'Turn the profile over and everything flips: the cup hangs down, the valley becomes a raised ring, and the lip turns down from it to the rim.',
    why: {
      'The cup, which now points straight up': 'Turned over, the cup points down.',
      'The lip, which now turns up toward the stick': 'The lip turned up when the China was upright; turned over, it turns down.',
    },
  },
  {
    id: 'ch.snd.3',
    page: 'sound',
    prompt: 'Upright, where does a jazz player ride a large China?',
    options: ['The side of the shoulder, about an inch above the valley', 'The very centre of the cup, with the stick’s shoulder', 'Underneath the lip, reaching up from below the plate'],
    correct: 'The side of the shoulder, about an inch above the valley',
    explain: 'Where the shoulder comes down into the valley, about an inch above it: the side of the shoulder rides with a controlled sound.',
    why: {
      'The very centre of the cup, with the stick’s shoulder': 'The cup gives hard accents. Riding is done on the shoulder.',
      'Underneath the lip, reaching up from below the plate': 'The stick plays the top face. The shoulder, above the valley, is the ride spot.',
    },
  },
  {
    id: 'ch.set.1',
    page: 'setting',
    prompt: 'Here, the China takes the 18 in crash’s stand. What is under it?',
    options: ['The 12 in rack tom', 'The floor tom’s legs', 'The hi-hat pedal'],
    correct: 'The 12 in rack tom',
    explain: 'On the right, over the 12 in tom and beside the ride: a China mic aimed down hears the tom, and the tom mic hears the China.',
    why: {
      'The floor tom’s legs': 'The floor tom is under the ride, farther round.',
      'The hi-hat pedal': 'The hats are on the other side of the kit.',
    },
  },
  {
    id: 'ch.set.2',
    page: 'setting',
    prompt: 'Turned over, what is the China’s lowest point — where an under-mic starts below?',
    options: ['The cup, now hanging down', 'The lip, at the rim of the plate', 'The felt under the wing nut'],
    correct: 'The cup, now hanging down',
    explain: 'Turned over, the cup hangs lowest; upright, the valley is lowest. An under-mic starts below whichever is lowest, clear of its downward swing.',
    why: {
      'The lip, at the rim of the plate': 'Turned over, the cup hangs below the rim.',
      'The felt under the wing nut': 'The felts sit at the centre; the cup hangs below them.',
    },
  },
  hearingCheck(W),
  {
    id: 'ch.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Why might a China need no mic of its own?',
    options: ['It cuts through the overheads on its own', 'It is the quietest cymbal on the kit', 'It sounds the same as a crash in a mic'],
    correct: 'It cuts through the overheads on its own',
    explain: 'A China is one of the most cutting sounds on a kit: the overheads usually carry it. A close mic is a choice for a very direct sound.',
    why: {
      'It is the quietest cymbal on the kit': 'It is one of the loudest and most cutting.',
      'It sounds the same as a crash in a mic': 'Its trashy sound is its own. The point is that it cuts through.',
    },
  },
  {
    id: 'ch.mic.1',
    page: 'microphone',
    prompt: 'A side-address condenser under the China: what must face the cymbal?',
    options: ['The side of the body that is marked as its front', 'The end of the body, the way a pencil mic points', 'Whichever side is nearest — the pattern is round'],
    correct: 'The side of the body that is marked as its front',
    explain: 'A side-address mic hears through its marked front face, not its end. Aim that face up at the China.',
    why: {
      'The end of the body, the way a pencil mic points': 'That is an end-address mic. A side-address one hears through its marked side.',
      'Whichever side is nearest — the pattern is round': 'Its pattern points out of its marked front. Aim that face.',
    },
  },
  powerCheck(W, 'the small dynamic'),
  spillCheck(W, 'the tom below'),
  {
    id: 'ch.place.1',
    page: 'placement',
    prompt: 'No distance is published for a China. How do you use “about 20–30 cm above”?',
    options: ['As a place to begin, then move and listen', 'As an exact rule, measured to the millimetre', 'As a limit: closer than 20 cm is not allowed'],
    correct: 'As a place to begin, then move and listen',
    explain: 'With no fixed number to go by, the band is a sensible start — clear of the stick and the swing — and your ears decide from there.',
    why: {
      'As an exact rule, measured to the millimetre': 'Starting points are places to begin, not exact rules.',
      'As a limit: closer than 20 cm is not allowed': 'It is not a limit. Clearance from the stick and the swing is.',
    },
  },
  {
    id: 'ch.place.2',
    page: 'placement',
    prompt: 'You turn the China over. Where does an under-mic’s starting point move?',
    options: ['Lower: below the cup, now its lowest point', 'Higher: the plate moves up when turned over', 'Nowhere: the lowest point does not change'],
    correct: 'Lower: below the cup, now its lowest point',
    explain: 'Upright, the valley is lowest; turned over, the cup hangs lower still. Start below whichever is lowest, clear of the swing.',
    why: {
      'Higher: the plate moves up when turned over': 'The cup now hangs down: the lowest point is lower.',
      'Nowhere: the lowest point does not change': 'Turning the plate over moves its lowest point — the cup now.',
    },
  },
  {
    id: 'ch.place.3',
    page: 'placement',
    prompt: 'You move the aim from the lip toward the cup. What tends to change?',
    options: ['A harder, more focused tone; less trash', 'Only the level drops; the tone itself stays exactly the same', 'A fixed bass boost you can read off a chart'],
    correct: 'A harder, more focused tone; less trash',
    explain: 'Toward the lip tends to bring more of the trashy edge; toward the cup a harder, more focused tone. Tendencies — every China differs.',
    why: {
      'Only the level drops; the tone itself stays exactly the same': 'Aim changes the balance too.',
      'A fixed bass boost you can read off a chart': 'These are tendencies, not fixed amounts.',
    },
  },
  {
    id: 'ch.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · From which side does the stick come to the China?',
    options: ['The player’s side, reaching out from the throne', 'The audience side, round the front of the kit', 'From below, up through the tom under it'],
    correct: 'The player’s side, reaching out from the throne',
    explain: 'The player plays the near side: mics start on the far side, out of the stick’s way.',
    why: {
      'The audience side, round the front of the kit': 'That is where a mic can go.',
      'From below, up through the tom under it': 'The stick plays the top face from the player’s side.',
    },
  },
  {
    id: 'ch.ctx.1',
    page: 'context',
    prompt: 'A mic under the China aims up. Where does its rear point?',
    options: ['Down, toward the tom, the floor and its monitors', 'Up, toward the China and the overheads hanging above', 'Sideways, toward the ride and the floor tom'],
    correct: 'Down, toward the tom, the floor and its monitors',
    explain: 'Aimed up, its rejection faces down. Tilt it, or change its pattern, to put a floor monitor in the deepest rejection.',
    why: {
      'Up, toward the China and the overheads hanging above': 'That is where it points.',
      'Sideways, toward the ride and the floor tom': 'Its sides face the kit around; its rear points down.',
    },
  },
  {
    id: 'ch.ctx.2',
    page: 'context',
    prompt: 'A cardioid under the China points straight up. Where does it reject the most?',
    options: ['Straight down, toward the floor', 'Out to its sides, level with it', 'Up, toward the China above it'],
    correct: 'Straight down, toward the floor',
    explain: 'A cardioid rejects most directly behind it: aimed up, straight down. Tilt it to put a monitor there.',
    why: {
      'Out to its sides, level with it': 'At 90° it still picks up fairly well.',
      'Up, toward the China above it': 'That is where it points — its best pickup.',
    },
  },
  {
    id: 'ch.ctx.studio',
    page: 'context',
    prompt: 'Studio; the China cuts through the overheads clearly. What could justify no China mic?',
    options: ['The overheads already carry it — fewer open mics', 'A China mic would stop the overheads from working properly', 'Studio cymbals are recorded with a single mic only'],
    correct: 'The overheads already carry it — fewer open mics',
    explain: 'If the China cuts through the overheads, a mic of its own adds a channel and little else.',
    why: {
      'A China mic would stop the overheads from working properly': 'The overheads still work. A close mic is a choice.',
      'Studio cymbals are recorded with a single mic only': 'Studios use one mic or many. The music decides.',
    },
  },
  {
    id: 'ch.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Compared with a crash, a China’s sound…',
    options: ['speaks harsh and fades sooner', 'rings longer and smoother', 'is the same, only louder'],
    correct: 'speaks harsh and fades sooner',
    explain: 'A China speaks fast and harsh, roars, and fades sooner than a crash.',
    why: {
      'rings longer and smoother': 'That is closer to a heavy crash. A China is trashier and shorter.',
      'is the same, only louder': 'Its shape gives it a sound of its own.',
    },
  },
  {
    id: 'ch.two.1',
    page: 'twoMic',
    prompt: 'A mic over the China and one under it hear the same hit. Why might they start out of step?',
    options: ['The plate moves toward one mic as it moves away from the other', 'The bottom mic hears the tom below well before it hears the China', 'Two condensers on one cymbal cancel each other out by themselves'],
    correct: 'The plate moves toward one mic as it moves away from the other',
    explain: 'Over and under face opposite sides of the plate: a push for one is a pull for the other — opposite polarity, before any time difference.',
    why: {
      'The bottom mic hears the tom below well before it hears the China': 'Both hear the China. The opposite faces flip one of them.',
      'Two condensers on one cymbal cancel each other out by themselves': 'Two mics cancel only through timing or opposite polarity.',
    },
  },
  polarityCheck(W),
  overheadsFirst(W),
  gainCheck(W, 'the hardest crash on the China'),
  {
    id: 'ch.prac.3',
    page: 'practice',
    prompt: 'When could a close China mic be worth its channel, with the overheads up?',
    options: ['When the music wants a very direct China sound', 'Whenever a China is mounted on the kit at all', 'To cancel the ride beside it by flipping its polarity'],
    correct: 'When the music wants a very direct China sound',
    explain: 'The overheads usually carry a China; a close mic earns its channel when the music wants it very direct — checked in mono with the overheads.',
    why: {
      'Whenever a China is mounted on the kit at all': 'Being there is no reason on its own. The music decides.',
      'To cancel the ride beside it by flipping its polarity': 'Polarity cannot remove one source from a mic.',
    },
  },
  {
    id: 'ch.mix.1',
    page: 'practice',
    prompt: 'MIXED · Upright, the China’s lowest point is the valley. Turned over?',
    options: ['The cup, hanging below the rim', 'Still the valley, as before', 'The lip, curling down at the rim'],
    correct: 'The cup, hanging below the rim',
    explain: 'Turned over, the cup hangs lowest. An under-mic starts below it.',
    why: {
      'Still the valley, as before': 'Turned over, the valley becomes a raised ring.',
      'The lip, curling down at the rim': 'The lip turns down to the rim; the cup hangs lower still.',
    },
  },
  {
    id: 'ch.mix.2',
    page: 'practice',
    prompt: 'MIXED · “About 20–30 cm above the China.” Measured from what, and how?',
    options: ['From its rim plane, square to the tilted plate', 'From the floor, straight up to the mic, like a stand', 'From the tom below, up through the plate to the mic'],
    correct: 'From its rim plane, square to the tilted plate',
    explain: 'Each starting point is measured from the cymbal it names, square to its plate.',
    why: {
      'From the floor, straight up to the mic, like a stand': 'The floor is not the reference.',
      'From the tom below, up through the plate to the mic': 'The tom is a neighbour, not the reference.',
    },
  },
  {
    id: 'ch.mix.3',
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
    id: 'ch.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A loud stage. The China is turned over and crashed for accents; the band wants it very direct. One spare channel; phantom power is available.',
    setups: [
      { id: 'a', label: 'A small condenser under the turned-over China, below its cup, aimed up', ok: true, power: 'phantom', feedback: 'A suggested starting point: very direct, its rear toward the floor — with the power it needs.' },
      { id: 'b', label: 'A small condenser 20–30 cm above the China on the far side, aimed at the shoulder', ok: true, power: 'phantom', feedback: 'A suggested starting point out of the stick’s way.' },
      { id: 'c', label: 'A small dynamic above the China on the far side', ok: true, power: 'none', feedback: 'A suggested starting point that needs no power.' },
      { id: 'd', label: 'A mic just under the rim of the turned-over China, level with the cup', ok: false, power: 'none', feedback: 'Inside the downward swing, beside the hanging cup. Start below the cup.' },
      { id: 'e', label: 'A mic on the player’s side, over the edge the stick crashes', ok: false, power: 'none', feedback: 'That is the stick’s path. Start on the far side.' },
    ],
    reasons: [docReason(W), CLEAR_REASON, POWER_REASON, { id: 'r.iso', label: 'From below, the mic’s rejection faces the floor monitors', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, nameReason(W)],
    explain: 'More than one plan passes this brief. What passes is the reasoning: a sensible starting point measured from the China (or below its lowest point), clearance from the stick and the swing, and power that matches the mic.',
  },
  {
    id: 'ch.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A studio session. The China cuts through the overheads clearly. ONE spare channel, with NO phantom power.',
    setups: [
      { id: 'a', label: 'No China mic: the overheads already carry it', ok: true, power: 'none', feedback: 'A fair plan — fewer open mics, nothing to power.' },
      { id: 'b', label: 'A small dynamic above the China on the far side, aimed at the shoulder', ok: true, power: 'none', feedback: 'A suggested starting point, powered by what this input can supply.' },
      { id: 'c', label: 'A small condenser under the China, aimed up', ok: false, power: 'phantom', feedback: 'A fair position — but a condenser needs phantom power, and this input has none.' },
      { id: 'd', label: 'A side-address condenser under the China', ok: false, power: 'phantom', feedback: 'A fair idea — but it needs phantom power, and this input has none.' },
      { id: 'e', label: 'Turn the China upright so it is quieter in the overheads', ok: false, power: 'none', feedback: 'How it is mounted is the player’s choice. Mic it as it is.' },
    ],
    reasons: [{ ...docReason(W), label: 'The plan starts from what the overheads give, and any mic from a suggested starting point' }, CLEAR_REASON, POWER_REASON, { id: 'r.room', label: 'In a good room, the overheads are part of the China’s sound', role: 'optional', feedback: 'A fair studio reason.' }, BRAND_REASON, nameReason(W)],
    explain: 'Two plans pass: no China mic, or a dynamic above it. What passes is the reasoning: start from the overheads, keep clear, and power what this input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: compared with a crash, how does a China ring?', options: ['Harsher and shorter', 'Smoother and longer', 'Exactly the same'], after: 'Now STEP through the stroke (or PLAY ONCE), then switch SETUP to turn it over.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the aim from the lip toward the cup. What changes?', options: ['More of the trashy edge', 'A harder, focused tone', 'It depends on this China'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The mic under the China points up. Where will a cardioid reject the floor monitor best?', options: ['Straight below the mic', 'Below, off to one side', 'Level with the mic'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION.' },
  twoMic: { prompt: 'If you flip the under mic’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What makes a cymbal a China?',
    options: ['A squarer cup and an upturned edge', 'A pair of plates worked by a pedal', 'Holes drilled right through the bow'],
    correct: 'A squarer cup and an upturned edge',
    explain: 'Chinas have an upturned edge and a squarer cup.',
    why: {
      'A pair of plates worked by a pedal': 'That describes a hi-hat, not a China.',
      'Holes drilled right through the bow': 'Some effects cymbals have holes; a China is defined by its edge and cup.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'How do many players mount a China to crash it?',
    options: ['Turned over, with its cup down', 'Flat on the floor beside the kick', 'Upright, clamped tight to its stand'],
    correct: 'Turned over, with its cup down',
    explain: 'Turned over to crash it; some jazz players ride a large one upright.',
    why: {
      'Flat on the floor beside the kick': 'A cymbal needs to hang loosely on a stand.',
      'Upright, clamped tight to its stand': 'Clamped tight, any cymbal chokes. Turned over is the crashing mount.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'Compared with a crash, a China…',
    options: ['speaks harsh and fades sooner', 'rings smoother and longer', 'sounds the same, only louder'],
    correct: 'speaks harsh and fades sooner',
    explain: 'Its shape gives it a quick, trashy roar that fades sooner.',
    why: {
      'rings smoother and longer': 'That is closer to a heavy crash.',
      'sounds the same, only louder': 'Its shape gives it a sound of its own.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Turned over, a China’s valley becomes…',
    options: ['a raised ring above the rim', 'the lowest point of the plate', 'a flat cup at the centre'],
    correct: 'a raised ring above the rim',
    explain: 'Turned over, everything flips: the valley is now a raised ring, the cup hangs lowest.',
    why: {
      'the lowest point of the plate': 'Turned over, the cup hangs lowest.',
      'a flat cup at the centre': 'The cup stays the cup — now hanging down.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'An under-mic on a turned-over China starts below…',
    options: ['the cup, its lowest point', 'the lip, out at the very rim', 'the wing nut, right on top'],
    correct: 'the cup, its lowest point',
    explain: 'Start below the lowest point in the mount, clear of the swing.',
    why: {
      'the lip, out at the very rim': 'The cup hangs lower than the rim.',
      'the wing nut, right on top': 'The wing nut is on the top side; the mic is underneath.',
    },
  },
  hearingDiagnostic(W),
];

export const I01E_LESSON: CymbalLesson = {
  id: 'I01e',
  labId: 'percussion',
  title: 'China Cymbal',
  subtitle: 'Upright or turned over — above it, or under its lowest point',
  noun: { one: 'China', many: 'Chinas' },
  model: CHINA_MODEL,
  micTypeIds: ['sdcCard', 'smallDynCard'],
  zones: CHINA_ZONES,
  // Review 2026-10-07 (R12-C04): the same over-and-under pair the lesson's
  // two-mic page draws in its other setup, so both setups show it alike.
  setupPairs: [{ label: 'Above the turned-over China + underneath, below the cup', A: { zone: 'ch.topI', typeId: 'sdcCard', pattern: 'cardioid' }, B: { zone: 'ch.underI', typeId: 'sdcCard', pattern: 'cardioid' }, variants: ['inverted'] }],
  pages,
  scenarios,
  symptoms: symptoms(W, { neighbour: 'the tom below' }),
  orderTasks: [orderTask(W)],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A cymbal with an upturned edge and a squarer cup — an “effect” cymbal with a trashy, cutting sound. Players crash it turned over; some jazz players ride a large one upright.', src: 'SAB-101' },
    { title: 'WHERE YOU MEET IT', text: 'On many rock and metal kits, and some jazz kits — often high or far out. Here it takes the 18 in crash’s stand on the right.', src: 'SAB-JH' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Cutting accents, and sometimes a trashy ride. Ask the player how it is used — crashed or ridden, turned over or upright — and whether the overheads already carry it.', src: 'SAB-101' },
    { title: 'ITS SIZE', text: 'Chinas come in about the same sizes as crashes; 16 and 18 in are popular. An 18 in (45.7 cm) is drawn here — its shape is a drawing, not a measured cymbal.', src: 'SAB-101' },
  ],
  sound: {
    stages: CHINA_CYM.strike.stages,
    attack: 'The start of the sound: quick and harsh. Upright, ridden on the side of the shoulder; turned over, crashed near the edge. A mic above, aimed at the plate, tends to hear more of the attack.',
    body: 'A trashy roar after the hit, fading sooner than a crash. Toward the lip tends to bring more of the trash; toward the cup a harder, more focused tone. Tendencies — every China is different.',
    head: { diameterMm: UP.spec.d.mm, rods: 0, label: 'the China, seen from above', strikeSrc: 'SAB-JH' },
  },
  setting: {
    items: [
      { id: 'china', label: 'the China', short: 'CHINA', note: 'Drawn in the 18 in crash’s place on the right and ringed in amber: the cymbal this lesson mics, over the 12 in tom.', prov: { kind: 'sourced', src: 'SAB-101', quote: '16” and 18” being popular sizes' }, tag: 'THE CYMBAL', scene: 'all', planIds: ['crash2'] },
      { id: 'tom', label: 'the 12 in rack tom', short: '12 IN TOM', note: 'Right under the China: the tom mic hears the China, and a China mic aimed down hears the tom.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'SPILL', scene: 'kit', planIds: ['tom2'] },
      { id: 'ride', label: 'the ride', short: 'RIDE', note: 'Beside the China on the right: another loud cymbal a China mic hears.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'SPILL', scene: 'kit', planIds: ['ride'] },
      THRONE_ITEM('The player sits behind the kit and reaches out to the China; the stick plays its near side.'),
      ...stageItems('China'),
    ],
    ...stageWords('China'),
  },
  diagnostic,
  practice: {
    task: 'Decide whether a China needs its own mic for a given kit and performance — none, above, or under its lowest point — place it safely, and explain the choice. With a real kit and the drummer’s agreement, you can record what you tried below.',
    fields: practiceSheet('China', ['no China mic', 'above the China', 'underneath'], 'Aim (cup, shoulder or lip), and how it is mounted'),
  },
  unknowns: [
    ...COMMON_UNKNOWNS,
    { text: 'The whole China profile — cup (18 % of the radius, 25 mm high), shoulder slope (10°), valley (78 %), lip rise (18 mm) — and its place on the 18 in crash’s stand are drawing defaults; only the size is published.', dims: ['china'] },
    { text: 'Every band here: no source gives a distance for a China. Above (20–30 cm) and underneath (8–15 cm below the lowest point) are the lab’s drawings.', dims: [] },
  ],
  live: { wedges: stageWedges('Below and behind a mic under the China: aimed up, the mic’s rear faces toward it — a null can help.', 'Out on the audience side, low: toward the rear of a mic aimed up from under the China.') },
  accuracyDetail: accuracyDetail('an 18 in China whose cup, shoulder and lip are drawn, not measured'),
  copy: CHINA_COPY,
  cym: CHINA_CYM,
};
