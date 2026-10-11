/**
 * I01c CRASH CYMBAL — the lesson's pages as DATA. Words from the owner's
 * lesson (docs/labs/miking/source_text/Crash-Cymbal-Miking-Technique-
 * Research.txt, "L<n>" in comments only) with the fixes in
 * docs/labs/miking/CORRECTIONS_LOG.md (CR-…). The research publishes no mic
 * distance for a crash: the lesson says so, in plain words, and every band is
 * a place to begin. Owner ruling 2026-10-04: no sources, brands or badges on
 * screen. FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, LessonPages, PageContent, SourcePageId, SetupTask } from '../../engine/model/types.ts';
import type { CymbalLesson } from '../shared/cymbals/cymbalLesson.ts';
import { BRAND_REASON, CLEAR_REASON, POWER_REASON, docReason, gainCheck, hearingCheck, hearingDiagnostic, nameReason, orderTask, overheadsFirst, polarityCheck, powerCheck, spillCheck, symptoms, type CymWords } from '../shared/cymbals/cymbalItems.ts';
import { COMMON_UNKNOWNS, THRONE_ITEM, accuracyDetail, practiceSheet, stageItems, stageWedges, stageWords } from '../shared/cymbals/cymbalCommon.ts';
import { CRASH_MODEL } from './geometry.ts';
import { C1, CRASH_ZONES } from './model.ts';
import { CRASH_COPY, CRASH_CYM } from './copy.ts';

const W: CymWords = { pfx: 'cr', one: 'crash', the: 'the crash', mic: 'crash mic' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the crash',
    goal: 'Get to know the crash cymbal — struck on its edge with a glancing blow, loose enough to swing on its stand — where you meet it and what it does in the music, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A crash hangs high over the rack toms, loose on its felts, and is struck on its edge with a glancing blow. Crashes run from thin and light to thick and heavy; they are the player’s.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a glancing blow becomes sound in a crash — the edge, the plate’s shapes, the swing — and who on the kit hears it.',
    credit: { scenarios: ['cr.snd.1', 'cr.snd.2', 'cr.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'Struck on the edge, a crash opens up at once and swings hard; its sound leaves both faces and spreads widely — every mic on the kit hears it, each at its own time.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the crashes sit — high over the rack toms, beside the hats or the ride — the space the stick and the swing need, what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['cr.set.1', 'cr.set.2', 'cr.set.hear'], note: 'Answer the three checks.' },
    takeaway: 'A rack tom is under each crash, the stroke follows through past the edge and the plate swings hard. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a crash mic by its properties — pattern, power, size and mount — and decide first whether the crash needs its own mic at all.',
    credit: { scenarios: ['cr.mic.1', 'cr.mic.power', 'cr.mic.spill', 'cr.rec.1'], note: 'Answer the four checks (one reaches back to how the crash sounds).' },
    takeaway: 'The overheads usually carry the crashes first. When a crash needs its own mic, a small condenser is a common choice; a small dynamic works too. The condenser here needs phantom power. Max SPL is not a hearing limit.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — above the plate on the side away from the player, or underneath — clear of the stroke and the swing, then move the mic and see what changes.',
    credit: { scenarios: ['cr.place.1', 'cr.place.2', 'cr.place.3', 'cr.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different suggested starting points (switch CRASH for the other one), and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'No one number is published for a crash: a zone is a place to begin, measured from the plate. Above or underneath, on the far side; clear of the follow-through and the swing — clearance comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'With a mic under the crash aimed up, turn its rejection toward the drummer’s floor monitor — and know when the overheads are enough.',
    credit: { scenarios: ['cr.ctx.1', 'cr.ctx.2', 'cr.ctx.studio', 'cr.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the drummer’s fill sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Under a crash, aimed up, a mic’s rear faces the floor — one reason some engineers mic cymbals from below on loud stages. Real nulls are shallow, and no mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See how a mic over the crash and one under it start out of step, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: ['cr.two.1', 'cr.two.pol', 'cr.two.oh'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the three checks.' },
    takeaway: 'Over and under face opposite sides of the plate, so they start opposite; polarity flips a sign, it does not remove a delay. A crash reaches every mic on the kit: compare in mono.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — clearance, the swing, aim, the pattern, gain and polarity — before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up a crash mic in the right order, choose and justify a plan for two briefs (from no crash mic to one underneath), and say what would justify one at all.',
    credit: { scenarios: ['cr.prac.order', 'cr.prac.gain', 'cr.prac.setup1', 'cr.prac.setup2', 'cr.prac.3', 'cr.mix.1', 'cr.mix.2', 'cr.mix.3'], note: 'Put the setup in order, answer the gain check, complete both briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real kit.' },
    takeaway: 'Safe clearance, correct power and level checks, a reason for the mic at all, and an accurate account of polarity versus delay pass. A brand or a habit does not decide it — and more than one plan can pass.',
  },
};

const scenarios: MikingScenario[] = [
  {
    id: 'cr.snd.1',
    page: 'sound',
    prompt: 'Why is a crash usually struck with a glancing blow on its edge?',
    options: ['The edge responds at once, and a glancing blow lets the plate ring', 'The bell is too hard to strike without breaking the stick in two', 'A straight-on hit makes it ring longer, which a crash should not do'],
    correct: 'The edge responds at once, and a glancing blow lets the plate ring',
    explain: 'The crash area responds immediately; striking it with a glancing blow — drawing the stick away, or a “J” stroke — lets the plate open up rather than choking it.',
    why: {
      'The bell is too hard to strike without breaking the stick in two': 'The bell can be played; a crash is struck on its edge because the edge responds at once.',
      'A straight-on hit makes it ring longer, which a crash should not do': 'A straight hit tends to choke the plate. The glancing blow lets it open up.',
    },
  },
  {
    id: 'cr.snd.2',
    page: 'sound',
    prompt: 'After a big crash, what does the plate do that a mic must allow for?',
    options: ['It swings and rocks hard on its felts', 'It stops dead the moment the stick leaves', 'It slides down the stand toward the toms'],
    correct: 'It swings and rocks hard on its felts',
    explain: 'The crash sits loose between its felts, so a big hit swings and rocks it. A mic keeps clear of that motion — above, or below its downward swing.',
    why: {
      'It stops dead the moment the stick leaves': 'It rings on — and moves. That is why it is mounted loose.',
      'It slides down the stand toward the toms': 'It stays on its sleeve; it rocks and swings about the centre.',
    },
  },
  {
    id: 'cr.snd.3',
    page: 'sound',
    prompt: 'Which mics on the kit hear a crash?',
    options: ['Nearly all of them, each at its own moment', 'Only a close mic aimed straight at the crash', 'Only the overheads, since they hang above it'],
    correct: 'Nearly all of them, each at its own moment',
    explain: 'A crash is loud and spreads widely: the overheads, the tom mic below, a vocal mic nearby — each hears it at a different time. Compare them in mono.',
    why: {
      'Only a close mic aimed straight at the crash': 'Every open mic on the kit hears a crash, aimed at it or not.',
      'Only the overheads, since they hang above it': 'The tom mic below and others hear it too, each at its own time.',
    },
  },
  {
    id: 'cr.set.1',
    page: 'setting',
    prompt: 'On the shared kit, what is under the 16 in crash?',
    options: ['The 10 in rack tom', 'The floor tom on its legs', 'The kick drum’s pedal'],
    correct: 'The 10 in rack tom',
    explain: 'Each crash hangs over a rack tom: a crash mic aimed down hears the tom, and the tom mic hears the crash.',
    why: {
      'The floor tom on its legs': 'The floor tom is under the ride, on the other side.',
      'The kick drum’s pedal': 'The pedal is on the floor in the middle. Under the crash is a rack tom.',
    },
  },
  {
    id: 'cr.set.2',
    page: 'setting',
    prompt: 'Why keep a crash mic clear of the space past the edge on the player’s side?',
    options: ['The glancing stroke follows through there', 'The crash is quietest on that side', 'The overheads need that space for their stands'],
    correct: 'The glancing stroke follows through there',
    explain: 'A glancing blow carries the stick on past the edge. A mic there is in the stick’s path — start on the far side.',
    why: {
      'The crash is quietest on that side': 'The whole plate rings. The point is the stick’s path.',
      'The overheads need that space for their stands': 'Overhead stands stand outside the kit. The stick’s follow-through is the reason.',
    },
  },
  hearingCheck(W),
  {
    id: 'cr.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Before choosing a crash mic, what should you check first?',
    options: ['Whether the overheads already carry the crash', 'Whether the crash is the same brand as the hats', 'Whether the crash is thinner than the ride is'],
    correct: 'Whether the overheads already carry the crash',
    explain: 'The overheads hang right by the crashes and usually carry them first. A close crash mic is a choice for what they are missing.',
    why: {
      'Whether the crash is the same brand as the hats': 'A brand says nothing about whether the crash needs a mic.',
      'Whether the crash is thinner than the ride is': 'Its weight changes its sound, not whether the overheads already carry it.',
    },
  },
  {
    id: 'cr.mic.1',
    page: 'microphone',
    prompt: 'A crash needs its own mic. What decides the mic?',
    options: ['Its pattern, power, size and mount for this place', 'The crash’s brand, matched to the mic’s brand', 'Whatever the snare mic is, so the kit matches'],
    correct: 'Its pattern, power, size and mount for this place',
    explain: 'Choose by properties: the pattern for spill, the power the input can give, a size and mount that fit the place. Nothing about the crash’s name decides it.',
    why: {
      'The crash’s brand, matched to the mic’s brand': 'Brands do not match up. Choose by properties.',
      'Whatever the snare mic is, so the kit matches': 'Matching is tidy but not a reason. The crash’s place and job decide.',
    },
  },
  powerCheck(W, 'the small dynamic'),
  spillCheck(W, 'the tom below'),
  {
    id: 'cr.place.1',
    page: 'placement',
    prompt: 'No distance is published for a crash. How do you use a starting point of “20–35 cm above”?',
    options: ['As a place to begin, then move and listen', 'As an exact rule that must be measured to the mm', 'As a limit: closer than 35 cm is not allowed'],
    correct: 'As a place to begin, then move and listen',
    explain: 'With no fixed number to go by, the band is a sensible place to start — clear of the stroke and the swing — and your ears decide from there.',
    why: {
      'As an exact rule that must be measured to the mm': 'Starting points are places to begin, never exact rules.',
      'As a limit: closer than 35 cm is not allowed': 'It is not a limit. Clearance from the stroke and the swing is the limit.',
    },
  },
  {
    id: 'cr.place.2',
    page: 'placement',
    prompt: 'A mic under the crash: why does its band start well below the plate?',
    options: ['The plate swings and flexes downward after a hit', 'The underside is too quiet to hear up close', 'A mic under a cymbal must be level with the toms'],
    correct: 'The plate swings and flexes downward after a hit',
    explain: 'Struck hard, the crash rocks and flexes down toward an under-mic. Start below that travel, then check after the biggest hit.',
    why: {
      'The underside is too quiet to hear up close': 'The underside radiates strongly. The reason is the downward swing.',
      'A mic under a cymbal must be level with the toms': 'The toms are not the reference. The plate’s swing is.',
    },
  },
  {
    id: 'cr.place.3',
    page: 'placement',
    prompt: 'You move the mic’s aim from the edge toward the bell. What tends to change?',
    options: ['A more focused tone; less of the spread', 'Only the level drops; the tone stays the same', 'A fixed bass boost you can read off a chart'],
    correct: 'A more focused tone; less of the spread',
    explain: 'Toward the edge tends to bring more of the crash’s spread; toward the bell a brighter, more focused tone. Tendencies — every crash differs.',
    why: {
      'Only the level drops; the tone stays the same': 'Aim changes the balance too, not only the level.',
      'A fixed bass boost you can read off a chart': 'These are tendencies, not fixed amounts. Check by ear.',
    },
  },
  {
    id: 'cr.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · When should you check a crash mic’s clearance?',
    options: ['After the biggest crash, while the plate still swings', 'After a soft tap on the bell, when it barely moves', 'Before the cymbal is put on its stand, to be safe'],
    correct: 'After the biggest crash, while the plate still swings',
    explain: 'A crash swings hardest after the biggest hit: check the mic clears that motion, with the player playing the song.',
    why: {
      'After a soft tap on the bell, when it barely moves': 'A soft tap barely moves it. The biggest crash swings it most.',
      'Before the cymbal is put on its stand, to be safe': 'Clearance is checked with the cymbal moving, not before it is mounted.',
    },
  },
  {
    id: 'cr.ctx.1',
    page: 'context',
    prompt: 'Why might an engineer mic a crash from underneath on a loud stage?',
    options: ['Aimed up, its rear faces the floor and its monitors', 'From underneath, the crash is quieter and easier to mix', 'The audience cannot see a mic underneath the cymbals'],
    correct: 'Aimed up, its rear faces the floor and its monitors',
    explain: 'Under the cymbal, aimed up, the mic’s rejection faces down toward the floor wedges — more isolation from the stage. A reason, not a rule.',
    why: {
      'From underneath, the crash is quieter and easier to mix': 'The underside radiates strongly. The point is where the mic’s rear faces.',
      'The audience cannot see a mic underneath the cymbals': 'How it looks is not the reason. The mic’s rejection is.',
    },
  },
  {
    id: 'cr.ctx.2',
    page: 'context',
    prompt: 'A supercardioid under the crash points straight up. Where does it reject the most?',
    options: ['Below, off to the sides of its rear axis', 'Straight down, on its rear axis only', 'Level with the capsule, at its sides'],
    correct: 'Below, off to the sides of its rear axis',
    explain: 'A supercardioid rejects most off the rear axis (near 125°), with a small lobe straight behind. Tilt it so the monitor falls there.',
    why: {
      'Straight down, on its rear axis only': 'That is a cardioid’s deepest rejection. A supercardioid has a small rear lobe there.',
      'Level with the capsule, at its sides': 'At 90° it still picks up fairly well; the rejection deepens toward the rear.',
    },
  },
  {
    id: 'cr.ctx.studio',
    page: 'context',
    prompt: 'Studio, good room; the overheads carry the crashes well. What could justify no crash mic at all?',
    options: ['The overheads already carry them — fewer open mics', 'A crash mic would stop the overheads from working properly', 'Studio cymbals are recorded with a single mic only'],
    correct: 'The overheads already carry them — fewer open mics',
    explain: 'The crashes hang closest to the overheads, which usually carry them well. A close mic adds focus only when they do not.',
    why: {
      'A crash mic would stop the overheads from working properly': 'The overheads still work. A close mic is a choice for what it adds.',
      'Studio cymbals are recorded with a single mic only': 'Studios use one mic or many. The question is what the music needs.',
    },
  },
  {
    id: 'cr.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · A vocal mic sits near the crash. What will it hear?',
    options: ['The crash too, a little after the close mic does', 'Nothing of the crash: it is aimed at the singer', 'The crash first, ahead of the other mics near it'],
    correct: 'The crash too, a little after the close mic does',
    explain: 'A crash reaches every open mic nearby — a vocal mic included — at its own moment. One more reason to keep open mics few and compare in mono.',
    why: {
      'Nothing of the crash: it is aimed at the singer': 'A mic hears what is around it, aimed or not — a crash especially.',
      'The crash first, ahead of the other mics near it': 'Arrival depends on distance: the close mic hears it first.',
    },
  },
  {
    id: 'cr.two.1',
    page: 'twoMic',
    prompt: 'A mic over the crash and one under it hear the same hit. Why might they start out of step?',
    options: ['The plate moves toward one mic as it moves away from the other', 'The bottom mic hears the tom below well before it hears the crash', 'Two condensers on one cymbal cancel each other out by themselves'],
    correct: 'The plate moves toward one mic as it moves away from the other',
    explain: 'Over and under face opposite sides of the plate: a push for one is a pull for the other — opposite polarity, before any time difference.',
    why: {
      'The bottom mic hears the tom below well before it hears the crash': 'Both hear the crash. It is the opposite faces of the plate that flip one of them.',
      'Two condensers on one cymbal cancel each other out by themselves': 'Two mics cancel only through timing or opposite polarity — not by being condensers.',
    },
  },
  polarityCheck(W),
  overheadsFirst(W),
  gainCheck(W, 'the biggest crash in the song'),
  {
    id: 'cr.prac.3',
    page: 'practice',
    prompt: 'When could a close crash mic be worth its channel, with the overheads up?',
    options: ['When the overheads lose the crash’s attack in the mix', 'Whenever the crash is the largest cymbal on the kit', 'To cancel the tom below it by flipping its polarity'],
    correct: 'When the overheads lose the crash’s attack in the mix',
    explain: 'A close mic adds focus when the overheads give the crash’s wash but not its attack, or when the stage needs isolation. Check it in mono with the overheads.',
    why: {
      'Whenever the crash is the largest cymbal on the kit': 'Size is not the reason. What the music is missing is.',
      'To cancel the tom below it by flipping its polarity': 'Polarity cannot remove one source from a mic. Aim and distance do more.',
    },
  },
  {
    id: 'cr.mix.1',
    page: 'practice',
    prompt: 'MIXED · “About 20–35 cm above the crash.” Measured from what, and how?',
    options: ['From the plate, square to it, on the tilt', 'From the floor, straight up to the mic, like a stand', 'From the tom below, up through the cymbal to the mic'],
    correct: 'From the plate, square to it, on the tilt',
    explain: 'Each starting point is measured from the cymbal it names, square to its plate — on a tilted crash, not straight up.',
    why: {
      'From the floor, straight up to the mic, like a stand': 'The floor is not the reference. Measure from the crash.',
      'From the tom below, up through the cymbal to the mic': 'The tom is a neighbour, not the reference.',
    },
  },
  {
    id: 'cr.mix.2',
    page: 'practice',
    prompt: 'MIXED · The crash mic is full of tom. What is a good first move?',
    options: ['Move its front off the tom: far side, or from below', 'Turn the crash channel up until the tom is covered over', 'Ask the drummer to play the tom more softly all night'],
    correct: 'Move its front off the tom: far side, or from below',
    explain: 'Above a crash, the mic’s front faces down toward the tom; from below, aimed up, its rear does. Some tom always belongs in the kit sound.',
    why: {
      'Turn the crash channel up until the tom is covered over': 'More gain raises the tom in that channel too.',
      'Ask the drummer to play the tom more softly all night': 'The player plays the music. Move the mic.',
    },
  },
  {
    id: 'cr.mix.3',
    page: 'practice',
    prompt: 'MIXED · You flip the under mic’s polarity. What changes?',
    options: ['The sign of its signal; the delay stays the same', 'The delay between the two mics drops all the way to zero', 'The mic’s pattern turns round to face down at the floor'],
    correct: 'The sign of its signal; the delay stays the same',
    explain: 'Polarity flips the sign; only distance changes when a sound arrives. Compare both states in mono.',
    why: {
      'The delay between the two mics drops all the way to zero': 'Only distance (or a delay setting) changes the arrival time.',
      'The mic’s pattern turns round to face down at the floor': 'The pattern stays where the mic points. Only the sign flips.',
    },
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'cr.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A loud stage with floor wedges. The crashes get lost in the overheads under the spill. One spare channel; phantom power is available.',
    setups: [
      { id: 'a', label: 'A small condenser 12–20 cm under the 16 in crash, aimed up, its rear toward the floor', ok: true, power: 'phantom', feedback: 'A suggested starting point, its rejection toward the wedges — a good reason on this stage.' },
      { id: 'b', label: 'A small condenser 20–35 cm above the crash on the far side, aimed at the plate', ok: true, power: 'phantom', feedback: 'A suggested starting point out of the stroke — with the power it needs.' },
      { id: 'c', label: 'A small dynamic above the crash on the far side, aimed at the plate', ok: true, power: 'none', feedback: 'A suggested starting point that needs no power.' },
      { id: 'd', label: 'A mic just past the edge on the player’s side, where the stick follows through', ok: false, power: 'none', feedback: 'That is the stick’s follow-through — it would be struck. Start on the far side.' },
      { id: 'e', label: 'A mic a few centimetres under the plate', ok: false, power: 'none', feedback: 'Inside the downward swing: a big hit brings the plate down onto it. Start lower.' },
    ],
    reasons: [docReason(W), CLEAR_REASON, POWER_REASON, { id: 'r.iso', label: 'From below, the mic’s rejection faces the floor wedges', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, nameReason(W)],
    explain: 'More than one plan passes this brief. What passes is the reasoning: a sensible starting point measured from the crash, clearance from the stroke, the swing and the player, and power that matches the mic.',
  },
  {
    id: 'cr.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A studio session in a good room. The overheads carry the crashes well. ONE spare channel, with NO phantom power.',
    setups: [
      { id: 'a', label: 'No crash mic: the overheads already carry the crashes', ok: true, power: 'none', feedback: 'A fair plan — fewer open mics, nothing to power.' },
      { id: 'b', label: 'A small dynamic above the crash on the far side, aimed at the plate', ok: true, power: 'none', feedback: 'A suggested starting point, powered by what this input can supply.' },
      { id: 'c', label: 'A small condenser under the crash, aimed up', ok: false, power: 'phantom', feedback: 'A fair position — but this condenser needs phantom power, and this input has none.' },
      { id: 'd', label: 'A small condenser above the crash on the far side', ok: false, power: 'phantom', feedback: 'A fair position — but this input has no phantom power, and this condenser needs it.' },
      { id: 'e', label: 'Tighten the crash’s wing nut so it cannot swing into a close mic', ok: false, power: 'none', feedback: 'A cymbal must move freely — over-tightening chokes it and can crack it. Move the mic.' },
    ],
    reasons: [{ ...docReason(W), label: 'The plan starts from what the overheads give, and any mic from a suggested starting point' }, CLEAR_REASON, POWER_REASON, { id: 'r.room', label: 'In a good room, the overheads are part of the crash’s sound', role: 'optional', feedback: 'A fair studio reason.' }, BRAND_REASON, nameReason(W)],
    explain: 'Two plans pass: no crash mic, or a dynamic above it. What passes is the reasoning: start from the overheads, keep clear, and power what this input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: the shoulder of the stick strikes the edge with a glancing blow. What does the plate do?', options: ['Opens up and swings', 'Stops dead', 'Only rings at the edge'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch the plate.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the mic’s aim from the edge toward the bell. What changes?', options: ['More of the spread', 'A more focused tone', 'It depends on this crash'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The mic under the crash points up. Where will a cardioid reject the floor monitor best?', options: ['Straight below the mic', 'Below, off to one side', 'Level with the mic'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION.' },
  twoMic: { prompt: 'If you flip the under mic’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'Where do most players strike a crash?',
    options: ['On the edge, with a glancing blow', 'On the bell, with the stick’s tip', 'On the stand, below the felts'],
    correct: 'On the edge, with a glancing blow',
    explain: 'The crash area is the outer edge, where the cymbal responds at once.',
    why: {
      'On the bell, with the stick’s tip': 'That is a bell accent. A crash is struck on its edge.',
      'On the stand, below the felts': 'The stand holds the cymbal; the stick strikes the edge.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'Why is a crash mounted loosely between felts?',
    options: ['So it can move freely and ring', 'So it can be lifted off quickly', 'So it stays perfectly still'],
    correct: 'So it can move freely and ring',
    explain: 'A cymbal needs to move freely; over-tightening chokes it and can crack it. That freedom is why it swings.',
    why: {
      'So it can be lifted off quickly': 'It stays on its stand; it is loose so it can ring and move.',
      'So it stays perfectly still': 'The reverse: it is able to move — and it swings.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'After a big crash, what does the plate do?',
    options: ['Swings and rocks on its felts', 'Stops ringing at once, held still', 'Slides down its stand a little'],
    correct: 'Swings and rocks on its felts',
    explain: 'A big hit swings the crash hard: a mic keeps clear of that motion.',
    why: {
      'Stops ringing at once, held still': 'It rings on — and moves.',
      'Slides down its stand a little': 'It stays on its sleeve, rocking about the centre.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Which mics on a kit hear a crash?',
    options: ['Nearly all of them, each at its own time', 'Only a close mic aimed at it, nothing else', 'Only the two overheads, hanging above it'],
    correct: 'Nearly all of them, each at its own time',
    explain: 'A crash is loud and spreads widely: every open mic hears it.',
    why: {
      'Only a close mic aimed at it, nothing else': 'Every open mic hears a crash.',
      'Only the two overheads, hanging above it': 'The tom mics and others hear it too.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'What usually hangs under a crash on a kit?',
    options: ['A rack tom', 'The kick pedal', 'The throne'],
    correct: 'A rack tom',
    explain: 'Each crash hangs over a rack tom: they hear each other.',
    why: {
      'The kick pedal': 'The pedal is on the floor in the middle.',
      'The throne': 'The throne is behind the kit, the player’s seat.',
    },
  },
  hearingDiagnostic(W),
];

export const I01C_LESSON: CymbalLesson = {
  id: 'I01c',
  labId: 'percussion',
  title: 'Crash Cymbal',
  subtitle: 'Overheads first — then above the plate, or underneath',
  noun: { one: 'crash', many: 'crashes' },
  model: CRASH_MODEL,
  micTypeIds: ['sdcCard', 'smallDynCard'],
  zones: CRASH_ZONES,
  // Review 2026-10-07 (R12-C04): the same over-and-under pair the lesson's
  // two-mic page draws in its other setup, so both setups show it alike.
  setupPairs: [{ label: 'Above the 18 in crash + underneath, aimed up', A: { zone: 'c2.top', typeId: 'sdcCard', pattern: 'cardioid' }, B: { zone: 'c2.under', typeId: 'sdcCard', pattern: 'cardioid' }, variants: ['crash2'] }],
  pages,
  scenarios,
  symptoms: symptoms(W, { neighbour: 'the tom below' }),
  orderTasks: [orderTask(W)],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A cymbal for accents, struck on its edge with a glancing blow that lets it open up at once. It sits loose on its felts, on a boom stand, and swings after each hit.', src: 'ZIL-L11' },
    { title: 'WHERE YOU MEET IT', text: 'On nearly every drum kit — often one on each side, high over the rack toms — on stage and in the studio.', src: 'ZIL-L11' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Accents and peaks: the big moments. Crashes run from thin and light (fast, short) to thick and heavy (louder, longer). Ask the player how they should sit — and whether the overheads already carry them.', src: 'ZIL-L11' },
    { title: 'ITS SIZE', text: 'The most popular crashes run from 16 to 18 in (40.6–45.7 cm); both are drawn here, on the shared kit.', src: 'ZIL-L11' },
  ],
  sound: {
    stages: CRASH_CYM.strike.stages,
    attack: 'The start of the sound: the shoulder of the stick on the edge, a glancing blow. The crash responds at once. A mic above, aimed at the plate, tends to hear more of the attack; underneath, less.',
    body: 'The wash after the hit: the whole plate ringing and swinging. Thin crashes respond fast and fade sooner; heavy ones ring louder and longer. Toward the edge tends to bring more of the spread; toward the bell a more focused tone.',
    head: { diameterMm: C1.spec.d.mm, rods: 0, label: 'the crash, seen from above', strikeSrc: 'ZIL-FAQ' },
  },
  setting: {
    items: [
      { id: 'crash', label: 'the crash', short: 'CRASH', note: 'Ringed in amber: the crash this lesson mics, high over a rack tom. Switch CRASH for the other one.', prov: { kind: 'sourced', src: 'ZIL-K', quote: '16" Dark Crash Thin; 18" Dark Crash Thin' }, tag: 'THE CYMBAL', scene: 'all', planIds: ['crash1', 'crash2'] },
      { id: 'toms', label: 'the rack toms', short: 'TOMS', note: 'Under the crashes: a crash mic aimed down hears the tom below, and the tom mic hears the crash.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'SPILL', scene: 'kit', planIds: ['tom1', 'tom2'] },
      { id: 'hats', label: 'hi-hats and snare', short: 'HATS · SNARE', note: 'Under the 16 in crash’s player side: loud neighbours, and the hats’ stick is right there.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'SPILL', scene: 'kit', planIds: ['hihat', 'snare'] },
      { id: 'ride', label: 'the ride', short: 'RIDE', note: 'Beside the 18 in crash on the right: another loud cymbal a crash mic hears.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'SPILL', scene: 'kit', planIds: ['ride'] },
      THRONE_ITEM('The player sits behind the kit and reaches up to the crashes; the glancing stroke follows through past the edge on this side.'),
      ...stageItems('crashes'),
    ],
    ...stageWords('crashes'),
  },
  diagnostic,
  practice: {
    task: 'Decide whether a crash needs its own mic for a given kit and performance — none, above, or underneath — place it safely, and explain the choice. With a real kit and the drummer’s agreement, you can record what you tried below.',
    fields: practiceSheet('crash', ['no crash mic', 'above the plate', 'underneath'], 'Aim (edge, bow or bell), and where the tom sits off it'),
  },
  unknowns: [
    ...COMMON_UNKNOWNS,
    { text: 'Every band here: no source gives a distance for a crash. Above (20–35 cm) and underneath (12–20 cm, below the swing and an 80 mm downward flex band) are the lab’s drawings; the glancing stroke’s 25 cm follow-through too.', dims: [] },
  ],
  live: { wedges: stageWedges('Below and behind a mic under the crash: aimed up, the mic’s rear faces toward it — a null can help.', 'Out on the audience side, low: toward the rear of a mic aimed up from under the crash.') },
  accuracyDetail: accuracyDetail('16 and 18 in crashes drawn to a common profile'),
  copy: CRASH_COPY,
  cym: CRASH_CYM,
};
