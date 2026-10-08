/**
 * I01b RIDE CYMBAL — the lesson's pages as DATA. Words from the owner's
 * lesson (docs/labs/miking/source_text/Ride-Cymbal-Miking-Technique-
 * Research.txt, "L<n>" in comments only) with the fixes in
 * docs/labs/miking/CORRECTIONS_LOG.md (RD-…). The "a foot or two above"
 * condenser is a mic for the ride AND the other cymbals (a coverage mic, not
 * a spot); the spot and the underside are the lesson's suggestions with
 * drawing-default bands. Owner ruling 2026-10-04: starting points, no
 * sources, brands or badges on screen. FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, LessonPages, PageContent, SourcePageId, SetupTask } from '../../engine/model/types.ts';
import type { CymbalLesson } from '../shared/cymbals/cymbalLesson.ts';
import { BRAND_REASON, CLEAR_REASON, POWER_REASON, docReason, gainCheck, hearingCheck, hearingDiagnostic, nameReason, orderTask, overheadsFirst, polarityCheck, powerCheck, spillCheck, symptoms, type CymWords } from '../shared/cymbals/cymbalItems.ts';
import { COMMON_UNKNOWNS, THRONE_ITEM, accuracyDetail, practiceSheet, stageItems, stageWedges, stageWords } from '../shared/cymbals/cymbalCommon.ts';
import { RIDE_MODEL } from './geometry.ts';
import { RIDE, RIDE_ZONES } from './model.ts';
import { RIDE_COPY, RIDE_CYM } from './copy.ts';

const W: CymWords = { pfx: 'rd', one: 'ride', the: 'the ride', mic: 'ride mic' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the ride',
    goal: 'Get to know the ride cymbal — its bell, bow and edge, its stand over the floor tom — where you meet it and what it does in the music, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A large cymbal over the floor tom, played for time with the stick’s tip on its bow and bell, and crashed on its edge. It sits loose on its felts — that is why it swings.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a stroke becomes sound in a ride — the tip on the bow, the plate’s shapes, the ping over the wash — and who on the kit hears it.',
    credit: { scenarios: ['rd.snd.1', 'rd.snd.2', 'rd.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The ping starts where the tip meets the bow; the wash builds as the whole plate rings, and it leaves both faces — up to the overheads and down onto the floor tom. Where the stick lands changes which shapes ring.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the ride sits — over the floor tom, beside a crash, at the end of the player’s right arm — what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['rd.set.1', 'rd.set.2', 'rd.set.hear'], note: 'Answer the three checks.' },
    takeaway: 'The floor tom is right under the ride, a crash hangs beside it, and the player’s arm reaches out to it all song. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a ride mic by its properties — pattern, power, size and mount — and by its job: a spot on the ride, or a mic for all the cymbals.',
    credit: { scenarios: ['rd.mic.1', 'rd.mic.power', 'rd.mic.spill', 'rd.rec.1'], note: 'Answer the four checks (one reaches back to how the ride sounds).' },
    takeaway: 'A small condenser is a common choice, as a spot or as a mic over all the cymbals; a small dynamic can spot it too. Condensers need phantom power. Max SPL is not a hearing limit.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — over the bow on the side away from the player, clear of the stick and the swing — then try a foot or two above, and underneath.',
    credit: { scenarios: ['rd.place.1', 'rd.place.2', 'rd.place.3', 'rd.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'A recommended zone is a place to begin, measured from the ride — not a rule. A spot over the bow, a mic a foot or two up for all the cymbals, or one underneath: different jobs. Clearance comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'With a mic under the ride aimed up, turn its rejection toward the drummer’s floor monitor — and know when the overheads are enough.',
    credit: { scenarios: ['rd.ctx.1', 'rd.ctx.2', 'rd.ctx.studio', 'rd.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the drummer’s fill sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Aimed up from under the ride, a mic’s rear faces the floor — the monitors fall toward its rejection. Real nulls are shallow, and no mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See how a mic over the ride and one under it start out of step, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: ['rd.two.1', 'rd.two.pol', 'rd.two.oh'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the three checks.' },
    takeaway: 'Over and under face opposite sides of the plate, so they start opposite; polarity flips a sign, it does not remove a delay. The overheads and the floor-tom mic hear the ride too: compare in mono.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — clearance, the swing, aim, the pattern, gain and polarity — before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up a ride mic in the right order, choose and justify a plan for two briefs (from no ride mic to one underneath), and say what would justify a second mic.',
    credit: { scenarios: ['rd.prac.order', 'rd.prac.gain', 'rd.prac.setup1', 'rd.prac.setup2', 'rd.prac.3', 'rd.mix.1', 'rd.mix.2', 'rd.mix.3'], note: 'Put the setup in order, answer the gain check, complete both briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real kit.' },
    takeaway: 'Safe clearance, correct power and level checks, a mic chosen for its job and an accurate account of polarity versus delay pass. A brand or a habit does not decide it — and more than one plan can pass.',
  },
};

const scenarios: MikingScenario[] = [
  {
    id: 'rd.snd.1',
    page: 'sound',
    prompt: 'Played with the tip on its bow, why does a ride give a clear “ping” rather than a crash?',
    options: ['The bow does not open the plate up at once; the wash builds slowly', 'The bow is made of a harder metal than the edge of the plate', 'The felts stop the plate from ringing on whenever the bow is struck'],
    correct: 'The bow does not open the plate up at once; the wash builds slowly',
    explain: 'Struck on the bow with the tip, the ride keeps a defined ping while the wash builds underneath; crashed on the edge, it opens up at once into a big wash.',
    why: {
      'The bow is made of a harder metal than the edge of the plate': 'It is one plate of one alloy. Where and how it is struck changes the response.',
      'The felts stop the plate from ringing on whenever the bow is struck': 'The felts let the ride move freely; it keeps ringing — the wash.',
    },
  },
  {
    id: 'rd.snd.2',
    page: 'sound',
    prompt: 'Where does a ride’s sound leave the plate?',
    options: ['Both faces: up toward the overheads, down onto the floor tom', 'Only the top face, straight up toward a mic hanging above the kit', 'Only the edge, out sideways toward the audience'],
    correct: 'Both faces: up toward the overheads, down onto the floor tom',
    explain: 'The whole plate radiates from both faces. Downward, it falls straight onto the floor tom — and into the floor tom’s mic.',
    why: {
      'Only the top face, straight up toward a mic hanging above the kit': 'The underside radiates as much: a mic underneath, or the floor-tom mic, hears it.',
      'Only the edge, out sideways toward the audience': 'The whole plate rings and radiates from both faces, not just the edge.',
    },
  },
  {
    id: 'rd.snd.3',
    page: 'sound',
    prompt: 'Why does a stroke on the bell drive most of the plate’s ringing shapes only a little?',
    options: ['The felts hold the centre, and most shapes barely move there', 'The bell is hollow, so the stick cannot reach the plate itself', 'The bell is struck with the shoulder, which is too soft'],
    correct: 'The felts hold the centre, and most shapes barely move there',
    explain: 'A shape is driven only as much as the plate moves under the stick. Near the held centre most of the ringing shapes barely move (a few, with a still ring, do) — so the bell’s clear, bright accent sits over less wash.',
    why: {
      'The bell is hollow, so the stick cannot reach the plate itself': 'The bell is part of the plate. It is the held centre that moves so little.',
      'The bell is struck with the shoulder, which is too soft': 'The bell is usually played with the tip. Where it lands is what matters.',
    },
  },
  {
    id: 'rd.set.1',
    page: 'setting',
    prompt: 'On a typical right-handed kit, what is right under the ride?',
    options: ['The floor tom, on its legs beside the player', 'The hi-hats, opened and closed by the left foot', 'The kick’s front head, facing the audience'],
    correct: 'The floor tom, on its legs beside the player',
    explain: 'The ride hangs over the floor tom: a mic under the ride keeps clear of it, and the floor-tom mic hears plenty of ride.',
    why: {
      'The hi-hats, opened and closed by the left foot': 'The hats are on the player’s left. The ride is on the right, over the floor tom.',
      'The kick’s front head, facing the audience': 'The kick is in the middle. Under the ride is the floor tom.',
    },
  },
  {
    id: 'rd.set.2',
    page: 'setting',
    prompt: 'When does a ride swing hardest on its felts?',
    options: ['After a crash on its edge with the stick’s shoulder', 'While the player keeps time with the tip on the bow', 'Only when the wing nut is screwed down tight'],
    correct: 'After a crash on its edge with the stick’s shoulder',
    explain: 'A crash on the edge rocks the ride hard; time on the bow barely moves it. Check a mic’s clearance after the hardest crash, not after a tap on the bow.',
    why: {
      'While the player keeps time with the tip on the bow': 'Time on the bow moves it a little. A crash on the edge rocks it hard.',
      'Only when the wing nut is screwed down tight': 'A tight wing nut chokes the cymbal and can crack it. It is the loose ride that swings.',
    },
  },
  hearingCheck(W),
  {
    id: 'rd.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic under the ride, aimed up, tends to hear what compared with one above?',
    options: ['Less of the stick, more of the plate’s wash', 'Exactly the same as the mic above hears', 'Only the floor tom below, not the ride itself'],
    correct: 'Less of the stick, more of the plate’s wash',
    explain: 'The stick plays the top face; the underside radiates the plate’s ringing. From below, less stick and more wash — a tendency.',
    why: {
      'Exactly the same as the mic above hears': 'The two faces sound different — the stick lands on the top one.',
      'Only the floor tom below, not the ride itself': 'It faces the ride’s underside, which radiates strongly. It hears the floor tom too.',
    },
  },
  {
    id: 'rd.mic.1',
    page: 'microphone',
    prompt: 'A condenser a foot or two above the ride: what job does it do?',
    options: ['It covers the ride and the other cymbals around it', 'It is a spot that hears the ride’s bell and nothing else', 'It replaces the floor-tom mic by reaching down to it'],
    correct: 'It covers the ride and the other cymbals around it',
    explain: 'At a foot or two, a condenser takes in the ride and the cymbals near it — closer to an overhead’s view. A spot over the bow is a different job: the ride’s definition.',
    why: {
      'It is a spot that hears the ride’s bell and nothing else': 'At that height it hears much more than the ride: that is its point.',
      'It replaces the floor-tom mic by reaching down to it': 'It points at the cymbals. The floor tom needs its own close mic or the overheads.',
    },
  },
  powerCheck(W, 'the small dynamic'),
  spillCheck(W, 'the floor tom'),
  {
    id: 'rd.place.1',
    page: 'placement',
    prompt: 'The ride is tilted toward the player. “15–30 cm above the bow” — how do you measure it?',
    options: ['Square to the tilted plate, from its top face', 'Straight up from the floor to the mic, like a stand height', 'From the floor tom’s head up to the mic'],
    correct: 'Square to the tilted plate, from its top face',
    explain: '“Above the ride” means away from the plate, along its straight-on line. On a tilted ride that is not straight up.',
    why: {
      'Straight up from the floor to the mic, like a stand height': 'The floor is not the reference. Measure from the ride, square to it.',
      'From the floor tom’s head up to the mic': 'The floor tom is a neighbour, not the reference.',
    },
  },
  {
    id: 'rd.place.2',
    page: 'placement',
    prompt: 'You swing the spot mic’s aim from the bow toward the bell. What tends to change?',
    options: ['A brighter, more cutting sound; less of the wash', 'Only the level drops; the tone itself stays exactly the same', 'A fixed bass boost you can read off a chart'],
    correct: 'A brighter, more cutting sound; less of the wash',
    explain: 'Toward the bell tends to bring a brighter, cutting sound; toward the edge more of the wash. Tendencies — every ride differs.',
    why: {
      'Only the level drops; the tone itself stays exactly the same': 'Aim changes the balance too, not only the level.',
      'A fixed bass boost you can read off a chart': 'These are tendencies, not fixed amounts. Check by ear.',
    },
  },
  {
    id: 'rd.place.3',
    page: 'placement',
    prompt: 'Why begin on the side of the ride away from the player?',
    options: ['The stick and the player’s arm come from the other side', 'The ride is quieter there, so the gain can go higher', 'The floor tom is on that side, so it helps fill out the mic'],
    correct: 'The stick and the player’s arm come from the other side',
    explain: 'The player reaches out from the throne and plays the near side of the ride. The far side keeps the mic, its stand and boom out of the stick’s way.',
    why: {
      'The ride is quieter there, so the gain can go higher': 'The whole plate rings. The point is the stick’s path, not the level.',
      'The floor tom is on that side, so it helps fill out the mic': 'The floor tom is under the ride; it is spill for a ride mic, not help.',
    },
  },
  {
    id: 'rd.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Why check a ride mic’s clearance after a crash on the edge?',
    options: ['A crash on the edge swings the ride hardest', 'The edge is where the ride is quietest', 'A crash moves the floor tom up toward the mic'],
    correct: 'A crash on the edge swings the ride hardest',
    explain: 'Time on the bow barely moves the ride; a crash on the edge rocks it hard. Keep the mic clear of the biggest swing.',
    why: {
      'The edge is where the ride is quietest': 'The edge opens the ride up loudly. Its swing is the point.',
      'A crash moves the floor tom up toward the mic': 'The floor tom stays on its legs. The ride is what swings.',
    },
  },
  {
    id: 'rd.ctx.1',
    page: 'context',
    prompt: 'Live, a mic over the ride points down. What does its front face beyond the ride?',
    options: ['The floor tom and the floor monitors below', 'The overheads and the ceiling above', 'Nothing: the ride hides everything below it'],
    correct: 'The floor tom and the floor monitors below',
    explain: 'Pointing down, a mic’s front faces the floor — the floor tom and any monitor down there. From underneath, aimed up, its rear faces them instead.',
    why: {
      'The overheads and the ceiling above': 'That is behind it. Pointing down, it faces the floor.',
      'Nothing: the ride hides everything below it': 'A cymbal is not a wall: sound from below reaches the mic around and through it.',
    },
  },
  {
    id: 'rd.ctx.2',
    page: 'context',
    prompt: 'A cardioid under the ride points straight up. Where does it reject the most?',
    options: ['Straight down, toward the floor', 'Out to its sides, level with it', 'Up, toward the ride above it'],
    correct: 'Straight down, toward the floor',
    explain: 'A cardioid rejects most directly behind it: aimed up, that is straight down — toward the floor and its monitors. Tilt it to put a monitor there.',
    why: {
      'Out to its sides, level with it': 'At 90° it still picks up fairly well; it rejects most behind.',
      'Up, toward the ride above it': 'That is where it points — its best pickup.',
    },
  },
  {
    id: 'rd.ctx.studio',
    page: 'context',
    prompt: 'Studio, good room; the overheads carry the ride well. What could justify no ride mic at all?',
    options: ['The overheads already carry it — fewer open mics', 'A ride mic would stop the overheads from working properly', 'Studio cymbals are recorded with one mic only'],
    correct: 'The overheads already carry it — fewer open mics',
    explain: 'An overhead on the ride side often carries the ride well, and the floor-tom mic hears it too. A spot adds definition when the music needs it.',
    why: {
      'A ride mic would stop the overheads from working properly': 'The overheads still work. A spot is a choice for what it adds.',
      'Studio cymbals are recorded with one mic only': 'Studios use one mic or many. The question is what the music needs.',
    },
  },
  {
    id: 'rd.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Which mic on the kit, besides the overheads, often hears a lot of ride?',
    options: ['The floor-tom mic, right under it', 'The kick mic, inside the front head', 'The hi-hat mic, across the kit'],
    correct: 'The floor-tom mic, right under it',
    explain: 'The ride radiates down onto the floor tom — and into its mic. Listen to the floor-tom channel before deciding the ride needs its own.',
    why: {
      'The kick mic, inside the front head': 'The kick mic is inside its drum, low and in the middle. The floor-tom mic is right under the ride.',
      'The hi-hat mic, across the kit': 'The hats are on the other side. The floor-tom mic is right under the ride.',
    },
  },
  {
    id: 'rd.two.1',
    page: 'twoMic',
    prompt: 'A mic over the ride and one under it hear the same stroke. Why might they start out of step?',
    options: ['The plate moves toward one mic as it moves away from the other', 'The bottom mic hears the floor tom well before it hears the ride', 'Two condensers on one cymbal cancel out by themselves'],
    correct: 'The plate moves toward one mic as it moves away from the other',
    explain: 'Over and under face opposite sides of the plate: a push for one is a pull for the other — opposite polarity, before any time difference.',
    why: {
      'The bottom mic hears the floor tom well before it hears the ride': 'Both mics hear the ride’s stroke. It is the opposite faces that flip one of them.',
      'Two condensers on one cymbal cancel out by themselves': 'Two mics cancel only through timing or opposite polarity — not by being condensers.',
    },
  },
  polarityCheck(W),
  overheadsFirst(W),
  gainCheck(W, 'a big crash on the ride’s edge'),
  {
    id: 'rd.prac.3',
    page: 'practice',
    prompt: 'When could a ride spot be worth its channel, with the overheads up?',
    options: ['When the ride’s definition gets lost in the mix', 'Whenever the floor tom has a mic of its own', 'To cancel the crash beside it with its polarity'],
    correct: 'When the ride’s definition gets lost in the mix',
    explain: 'A spot adds the ping — the ride’s time — when the overheads give the wash but lose the detail. Check it in mono with the overheads and the floor-tom mic.',
    why: {
      'Whenever the floor tom has a mic of its own': 'The floor-tom mic hears the ride too. The need is the music’s, not the channel count’s.',
      'To cancel the crash beside it with its polarity': 'Polarity cannot remove one source from a mic. Aim and distance do more.',
    },
  },
  {
    id: 'rd.mix.1',
    page: 'practice',
    prompt: 'MIXED · “About 30–60 cm above the ride.” Above what, and how?',
    options: ['The ride’s top face, square to the tilted plate', 'The floor, measured straight up to the mic like a stand', 'The floor tom’s head, up past the ride'],
    correct: 'The ride’s top face, square to the tilted plate',
    explain: 'Each starting point is measured from the cymbal it names, square to it — on a tilted ride, not straight up.',
    why: {
      'The floor, measured straight up to the mic like a stand': 'The floor is not the reference. Measure from the ride.',
      'The floor tom’s head, up past the ride': 'The floor tom is a neighbour, not the reference.',
    },
  },
  {
    id: 'rd.mix.2',
    page: 'practice',
    prompt: 'MIXED · The ride channel is full of floor tom. What is a good first move?',
    options: ['Aim and distance: move the mic’s front off the floor tom', 'Turn the ride channel up until the floor tom is covered over', 'Remove the floor tom’s bottom head to quieten it'],
    correct: 'Aim and distance: move the mic’s front off the floor tom',
    explain: 'Above the ride, the mic’s front faces down toward the floor tom; from the far side, or from underneath with its rear toward the floor, it hears less of it. Some floor tom always belongs.',
    why: {
      'Turn the ride channel up until the floor tom is covered over': 'More gain raises the floor tom in that channel too.',
      'Remove the floor tom’s bottom head to quieten it': 'The drums are the player’s. Move the mic, not the drum.',
    },
  },
  {
    id: 'rd.mix.3',
    page: 'practice',
    prompt: 'MIXED · You flip the under mic’s polarity. What changes?',
    options: ['The sign of its signal; the delay stays the same', 'The delay between the two mics drops all the way to zero', 'The mic’s pattern turns round to face down'],
    correct: 'The sign of its signal; the delay stays the same',
    explain: 'Polarity flips the sign; only distance changes when a sound arrives. Compare both states in mono.',
    why: {
      'The delay between the two mics drops all the way to zero': 'Only distance (or a delay setting) changes the arrival time.',
      'The mic’s pattern turns round to face down': 'The pattern stays where the mic points. Only the sign flips.',
    },
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'rd.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A loud stage. The ride carries the time; the drummer’s fill sits beside the throne, close to the ride side. One spare channel; phantom power is available.',
    setups: [
      { id: 'a', label: 'A small condenser 15–30 cm over the bow on the far side, aimed at the bow', ok: true, power: 'phantom', feedback: 'A recommended starting point for the ride’s definition — with the power it needs.' },
      { id: 'b', label: 'A small condenser 8–15 cm under the ride, aimed up, its rear toward the floor', ok: true, power: 'phantom', feedback: 'A recommended starting point out of the stick’s way, its rejection toward the monitors.' },
      { id: 'c', label: 'A small dynamic over the bow on the far side, aimed at the bow', ok: true, power: 'none', feedback: 'A recommended starting point that needs no power.' },
      { id: 'd', label: 'A mic a few centimetres from the edge on the player’s side', ok: false, power: 'none', feedback: 'That is the stick’s side, inside the swing. Start on the far side.' },
      { id: 'e', label: 'A mic resting on the ride’s bell, so it cannot move', ok: false, power: 'none', feedback: 'Never on the cymbal: it is a moving part, struck all song.' },
    ],
    reasons: [docReason(W), CLEAR_REASON, POWER_REASON, { id: 'r.iso', label: 'Close, and with the rear toward the floor, helps on a loud stage', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, nameReason(W)],
    explain: 'More than one plan passes this brief. What passes is the reasoning: a sensible starting point measured from the ride, clearance from the stick, the swing and the player, and power that matches the mic.',
  },
  {
    id: 'rd.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A studio session in a good room. The overheads and the floor-tom mic carry the ride well. ONE spare channel, with NO phantom power.',
    setups: [
      { id: 'a', label: 'No ride mic: the overheads and the floor-tom mic already carry it', ok: true, power: 'none', feedback: 'A fair plan — fewer open mics, nothing to power.' },
      { id: 'b', label: 'A small dynamic over the bow on the far side, aimed at the bow', ok: true, power: 'none', feedback: 'A recommended starting point, powered by what this input can supply.' },
      { id: 'c', label: 'A small condenser a foot or two above, for all the cymbals', ok: false, power: 'phantom', feedback: 'A fair position — but this input has no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'A small condenser under the ride, aimed up', ok: false, power: 'phantom', feedback: 'A fair position — but a condenser needs phantom power, and this input has none.' },
      { id: 'e', label: 'A mic hanging from the ride’s wing nut by its cable', ok: false, power: 'none', feedback: 'Never on the cymbal or its mount: it swings and is struck. Use a stand.' },
    ],
    reasons: [{ ...docReason(W), label: 'The plan starts from what the overheads give, and any mic from a recommended starting point' }, CLEAR_REASON, POWER_REASON, { id: 'r.room', label: 'In a good room, the overheads are part of the ride’s sound', role: 'optional', feedback: 'A fair studio reason.' }, BRAND_REASON, nameReason(W)],
    explain: 'Two plans pass: no ride mic, or a dynamic spot. What passes is the reasoning: start from the overheads, keep clear, and power what this input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: the tip strikes the ride’s bow. What do you expect to hear first?', options: ['A clear ping, then the wash', 'A big wash at once', 'A short click and nothing after'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch the plate.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you swing the spot mic’s aim from the bow toward the bell. What changes?', options: ['More of the wash', 'A brighter, cutting sound', 'It depends on this ride'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The mic under the ride points up. Where will a cardioid reject the floor monitor best?', options: ['Straight below the mic', 'Below, off to one side', 'Level with the mic'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION.' },
  twoMic: { prompt: 'If you flip the under mic’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What are a ride’s three playing areas?',
    options: ['The bell, the bow and the edge', 'The cup, the clutch and the rim', 'The top, the seat and the pedal'],
    correct: 'The bell, the bow and the edge',
    explain: 'The bell (cup) at the centre, the bow (the ride area) and the edge (the crash area).',
    why: {
      'The cup, the clutch and the rim': 'The clutch is a hi-hat part. A ride has a bell, a bow and an edge.',
      'The top, the seat and the pedal': 'Those are hi-hat parts. A ride hangs on a stand and has a bell, a bow and an edge.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'Why is a ride’s wing nut left loose?',
    options: ['So the cymbal can move freely on its felts', 'So the player can lift it off between songs', 'So a mic can be clamped under the wing nut'],
    correct: 'So the cymbal can move freely on its felts',
    explain: 'A cymbal needs to move freely; over-tightening chokes it and can crack it. That freedom is also why it swings.',
    why: {
      'So the player can lift it off between songs': 'It stays on its stand. It is loose so the cymbal can ring and move.',
      'So a mic can be clamped under the wing nut': 'Nothing is clamped to the cymbal’s mount. It is loose so the cymbal can move.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'Where does a ride’s sound leave the plate?',
    options: ['Both faces, up and down', 'The top face only, facing up', 'The edge only'],
    correct: 'Both faces, up and down',
    explain: 'Up toward the overheads, and down onto the floor tom — and into its mic.',
    why: {
      'The top face only, facing up': 'The underside radiates too.',
      'The edge only': 'The whole plate radiates from both faces.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'The tip on the bow, or the shoulder on the edge: which opens the ride into a big wash at once?',
    options: ['The shoulder on the edge', 'The tip on the bow', 'Neither: both sound the same'],
    correct: 'The shoulder on the edge',
    explain: 'On the edge the ride opens up at once; on the bow it keeps a clear ping over a slower wash.',
    why: {
      'The tip on the bow': 'The bow gives a defined ping, the wash building slowly.',
      'Neither: both sound the same': 'Where and how the stick lands changes the response a lot.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'What is right under the ride on a typical right-handed kit?',
    options: ['The floor tom', 'The hi-hats, opened by the foot', 'The snare'],
    correct: 'The floor tom',
    explain: 'The ride hangs over the floor tom on the player’s right.',
    why: {
      'The hi-hats, opened by the foot': 'The hats are on the left.',
      'The snare': 'The snare is between the player’s knees, on the left of centre.',
    },
  },
  hearingDiagnostic(W),
];

export const I01B_LESSON: CymbalLesson = {
  id: 'I01b',
  labId: 'percussion',
  title: 'Ride Cymbal',
  subtitle: 'A spot over the bow, a mic a foot or two above, or one underneath',
  noun: { one: 'ride', many: 'rides' },
  model: RIDE_MODEL,
  micTypeIds: ['sdcCard', 'smallDynCard'],
  zones: RIDE_ZONES,
  pages,
  scenarios,
  symptoms: symptoms(W, { neighbour: 'the floor tom' }),
  orderTasks: [orderTask(W)],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A large cymbal on a boom stand, played for time: the stick’s tip on its bow and its bell, the shoulder of the stick crashing its edge. It sits on its sleeve between two felts, able to move.', src: 'ZIL-L11' },
    { title: 'WHERE YOU MEET IT', text: 'On nearly every drum kit, over the floor tom on the player’s right (a right-handed layout), on stage and in the studio.', src: 'ZIL-L11' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'It keeps time — a clear ping over a wash — and gives bright accents on the bell. Ask the player how it should sit: defined, or washy, or left to the overheads.', src: 'ZIL-FAQ' },
    { title: 'ITS SIZE', text: 'A 20 in (50.8 cm) ride is common and is drawn here, its edge plane about a metre above the floor.', src: 'ZIL-K' },
  ],
  sound: {
    stages: RIDE_CYM.strike.stages,
    attack: 'The start of the sound: the stick’s tip on the bow — the ping, the ride’s definition. A mic above the bow and aimed at it tends to hear more of it; underneath, less.',
    body: 'The wash after the stroke: the whole plate ringing, building slowly when the bow is played, opening up at once when the edge is crashed. Toward the bell tends to bring a brighter, cutting sound; toward the edge more of the wash.',
    head: { diameterMm: RIDE.spec.d.mm, rods: 0, label: 'the ride, seen from above', strikeSrc: 'ZIL-L11' },
  },
  setting: {
    items: [
      { id: 'ride', label: 'the ride', short: 'RIDE', note: 'Ringed in amber: the 20 in ride over the floor tom on the player’s right. The cymbal this lesson mics.', prov: { kind: 'sourced', src: 'ZIL-K', quote: '20" Ride' }, tag: 'THE CYMBAL', scene: 'all', planIds: ['ride'] },
      { id: 'floor', label: 'floor tom', short: 'FLOOR TOM', note: 'Right under the ride: the loudest neighbour a ride mic hears — and its mic hears plenty of ride.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'SPILL', scene: 'kit', planIds: ['floor'] },
      { id: 'crash', label: 'crash cymbal (18 in)', short: 'CRASH', note: 'Hangs beside and above the ride’s audience side and swings when struck: keep a ride mic and its boom clear of it.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'KEEP CLEAR', scene: 'kit', planIds: ['crash2'] },
      THRONE_ITEM('The player sits behind the kit; the right arm reaches out to the ride all song — the near side of the ride is the stick’s.'),
      ...stageItems('ride'),
    ],
    ...stageWords('ride'),
  },
  diagnostic,
  practice: {
    task: 'Choose a ride plan — none, a spot over the bow, a mic for all the cymbals, or one underneath — for a given kit and performance, place it safely, and explain what would justify a second mic. With a real kit and the drummer’s agreement, you can record what you tried below.',
    fields: practiceSheet('ride', ['no ride mic', 'spot over the bow', 'a foot or two above', 'underneath'], 'Aim (bell, bow or edge), and where the floor tom sits off it'),
  },
  unknowns: [
    ...COMMON_UNKNOWNS,
    { text: 'The spot band (15–30 cm over the bow) and the underside band (8–15 cm under the edge plane) — no source gives a number; the lab’s drawings.', dims: [] },
  ],
  live: {
    wedges: stageWedges('Below and behind a mic under the ride: aimed up, the mic’s rear faces toward it — a null can help.', 'Out on the audience side, low: toward the rear of a mic aimed up from under the ride, farther away.'),
  },
  accuracyDetail: accuracyDetail('a 20 in ride drawn to a common profile'),
  copy: RIDE_COPY,
  cym: RIDE_CYM,
};
