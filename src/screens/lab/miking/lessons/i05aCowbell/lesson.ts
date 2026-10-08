/**
 * I05a COWBELL — the lesson's pages as DATA (blueprint §7). Words from the
 * owner's lesson (docs/labs/miking/source_text/Cowbell-Miking-Technique-
 * Research.txt, "L<n>" in COMMENTS only) with the fixes in CORRECTIONS_LOG.md
 * (CB-xx) applied. OWNER RULING 2026-10-04: starting points; no source,
 * brand or model in learner text; no badges; FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, LessonPages, PageContent, SourcePageId, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, cardioidNull, CLEAR_REASON, contactSymptom, feedbackSymptom, firstNotch, gainCheck, hearingCheck, louderIsNotBetter, monoSymptom, moveRemovesDelay, noPhantom, PEAK_REASON, polarityKeepsDelay, POWER_REASON, quickHearing, setupOrder, slowMeter, TECH_REASON, type SpWords } from '../shared/smallperc/commonItems.ts';
import type { SpLesson } from '../shared/smallperc/family.ts';
import { STAGE_THINGS, stageItems, standingWedges } from '../shared/smallperc/stage.ts';
import { BELL_MODEL } from './geometry.ts';
import { BELL_ZONES } from './model.ts';
import { BELL_COPY } from './copy.ts';

const W: SpWords = { p: 'bell', the: 'the cowbell', a: 'a cowbell', noun: 'cowbell', player: 'player', loudest: 'the hardest hit' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the cowbell',
    goal: 'Get to know the cowbell — what it is, where you meet it, what it does in the music and how it is played — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A struck steel box, open at the mouth: the whole body rings. Mounted it stays put while the stick moves round it; handheld it moves, and the grip damps it.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a stick stroke becomes sound — the attack, the walls flexing, the ring — and what a mute changes.',
    credit: { scenarios: ['bell.snd.1', 'bell.snd.2', 'bell.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The stick’s contact is the attack; the steel walls ring on — the sustain — and the whole body radiates, not just the mouth. A mute shortens the ring and can lower the pitch.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the cowbell sits — on a kit or a percussion rig, under overheads, by loud neighbours — and what to do before any mic.',
    credit: { scenarios: ['bell.set.1', 'bell.set.hear', 'bell.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Mark every stick path, choose the bell and any mute first, and keep hands out of an active striking area. Protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the cowbell by its properties — pattern, power, size and how it handles hard peaks — not by its brand.',
    credit: { scenarios: ['bell.mic.1', 'bell.mic.peak', 'bell.mic.power', 'bell.mic.stage', 'bell.rec.1'], note: 'Answer the five checks (one reaches back to how the bell sounds).' },
    takeaway: 'A cardioid dynamic or condenser can work; a compact directional mic on a secure mount suits a kit. Watch the input’s headroom on the hardest hits.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — about 20–40 cm from a side or top view of the bell — with the stick’s whole path clear, and see what each view changes.',
    credit: { scenarios: ['bell.place.1', 'bell.place.2', 'bell.place.3', 'bell.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'A side or top view, 20–40 cm from the bell, outside every stroke and rebound. Move the mic, not the player’s stroke.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s real rejection faces a loud unwanted source — and decide between the overheads and a spot.',
    credit: { scenarios: ['bell.ctx.1', 'bell.ctx.2', 'bell.ctx.studio', 'bell.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the downstage wedge sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Overheads first; a spot only if its useful level beats its spill. Aim nulls by the real pattern; never solve it with more monitor.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See how a bell spot and the overheads interact — arrival times, comb-filter notches, and what polarity does and does not change.',
    credit: { scenarios: ['bell.two.1', 'bell.two.2', 'bell.two.3', 'bell.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'The spot and the overheads hear the bell at different times. Polarity flips the sign; it does not remove a delay. Check in mono.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Tell the bell’s own ring from mount buzz and from electronic distortion; find the stage that overloads; separate by placement before EQ.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one spot in the right order, choose and justify a setup for two briefs, and say when a spot is worth it at all.',
    credit: { scenarios: ['bell.prac.order', 'bell.prac.gain', 'bell.prac.setup1', 'bell.prac.setup2', 'bell.prac.3', 'bell.mix.1', 'bell.mix.2', 'bell.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'A safe, useful position, overhead versus spot explained, ring told from buzz and from distortion, and a live separation or feedback problem fixed without more gain. More than one setup can pass.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L9-L12 · set L9-L12, L58-L60 · mic L20-L27 ·
 * place L18-L27 · ctx L43-L51 · two L39-L41 · prac L64-L72. */
const scenarios: MikingScenario[] = [
  {
    id: 'bell.snd.1',
    page: 'sound',
    prompt: 'Where does a cowbell’s sound leave the instrument?',
    options: ['From the whole steel body — walls and mouth', 'Only from the mouth, like the bell of a trumpet', 'Only from the spot where the stick struck it'],
    correct: 'From the whole steel body — walls and mouth',
    explain: 'The whole metal body rings after the strike; the mouth’s shape and any damping matter, but a brass-bell analogy is unsound.',
    why: {
      'Only from the mouth, like the bell of a trumpet': 'A cowbell is struck metal, not a horn: the walls radiate too.',
      'Only from the spot where the stick struck it': 'The strike starts the ring; the whole body then vibrates.',
    },
  },
  {
    id: 'bell.snd.2',
    page: 'sound',
    prompt: 'A large magnetic mute goes on the bell. What tends to change?',
    options: ['A shorter ring — and the pitch goes a little lower', 'Only the attack, with the ring left exactly as it was', 'A longer ring, because the magnet adds steel to it'],
    correct: 'A shorter ring — and the pitch goes a little lower',
    explain: 'A small mute takes the edge off; a large mute muffles the sustain and lowers the pitch. It must stay secure and clear of the stick.',
    why: {
      'Only the attack, with the ring left exactly as it was': 'A mute damps the walls: the ring is what it shortens.',
      'A longer ring, because the magnet adds steel to it': 'The mute damps the walls; the ring gets shorter.',
    },
  },
  {
    id: 'bell.snd.3',
    page: 'sound',
    prompt: 'A bell is sold as “tuned to G”. What does that tell the mic?',
    options: ['Little: it is a model’s description, not a pure tone', 'That the bell sounds a single pure G, like a sine', 'That the mic should be tuned to G as well, to match it'],
    correct: 'Little: it is a model’s description, not a pure tone',
    explain: 'A pitch name describes the model; struck metal makes many frequencies at once. Listen to the actual bell.',
    why: {
      'That the bell sounds a single pure G, like a sine': 'Struck steel rings with many frequencies; the name is a description.',
      'That the mic should be tuned to G as well, to match it': 'Mics are not tuned; the bell’s description does not change the mic.',
    },
  },
  {
    id: 'bell.set.1',
    page: 'setting',
    prompt: 'Before you place a cowbell mic, what do you mark?',
    options: ['Every stick path, rebound and fill near the bell', 'The bell at rest, since a mounted bell stays put', 'Only the main strike point the player uses most'],
    correct: 'Every stick path, rebound and fill near the bell',
    explain: 'The stick, not the bell, sets the minimum clearance: strike points, fills, rebound and crossovers. A mic is never a target in the player’s groove.',
    why: {
      'The bell at rest, since a mounted bell stays put': 'The bell stays put; the stick moves round it — that sets the clearance.',
      'Only the main strike point the player uses most': 'Fills and rebounds reach farther than the main strike.',
    },
  },
  hearingCheck(W),
  {
    id: 'bell.set.2',
    page: 'setting',
    prompt: 'The ring covers the next note. What do you try first?',
    options: ['The bell, the mount and a secure, compatible mute', 'A gate on the channel, set to cut the ring short each time', 'Ask the player to hit it much more softly'],
    correct: 'The bell, the mount and a secure, compatible mute',
    explain: 'Is it the bell’s own sustain or a vibrating mount? Inspect the hardware; audition a compatible, secure mute or a different bell before processing.',
    why: {
      'A gate on the channel, set to cut the ring short each time': 'Processing comes after the instrument and the mount — and the bleed rings on anyway.',
      'Ask the player to hit it much more softly': 'The music sets the touch; change the bell or mute it.',
    },
  },
  {
    id: 'bell.mic.1',
    page: 'microphone',
    prompt: 'Should the mic point straight into the mouth for the fullest sound?',
    options: ['Not necessarily: the whole body radiates — compare views', 'Yes — the mouth is where all of the sound comes out', 'Yes — but only with a condenser mic, not a dynamic'],
    correct: 'Not necessarily: the whole body radiates — compare views',
    explain: 'Do not assume a mic pointed into the mouth is fuller or brighter. Compare a side and a top view at matched level.',
    why: {
      'Yes — the mouth is where all of the sound comes out': 'The walls radiate too; the mouth is one view among several.',
      'Yes — but only with a condenser mic, not a dynamic': 'The mic type does not decide the view; listening does.',
    },
  },
  slowMeter(W, 'microphone', 'bell.mic.peak'),
  noPhantom(W),
  {
    id: 'bell.mic.stage',
    page: 'microphone',
    prompt: 'On a kit live, what kind of spot suits a mounted cowbell?',
    options: ['A compact directional mic, secure, not touching the bell', 'A large omni hung over the whole kit to catch the bell', 'A clip pressed against the bell’s side to catch its ring'],
    correct: 'A compact directional mic, secure, not touching the bell',
    explain: 'A dedicated compact directional mic on a secure stand or clamp that does not interfere with playing or transmit mechanical noise.',
    why: {
      'A large omni hung over the whole kit to catch the bell': 'An omni over a kit hears everything as much as the bell.',
      'A clip pressed against the bell’s side to catch its ring': 'Touching the bell damps it and transmits knocks; keep the mount clear.',
    },
  },
  {
    id: 'bell.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Close to the bell, a mic hears the attack strongly. Why?',
    options: ['The stick’s contact is the attack, right at the bell', 'The mouth focuses the attack toward a close mic in front', 'The ring gets louder the closer the mic comes to the bell'],
    correct: 'The stick’s contact is the attack, right at the bell',
    explain: 'The attack starts where the stick strikes; close, the mic hears it ahead of the ring and the room.',
    why: {
      'The mouth focuses the attack toward a close mic in front': 'It is not a horn; the attack comes from the strike.',
      'The ring gets louder the closer the mic comes to the bell': 'Everything gets louder closer; the attack-to-ring balance is what shifts.',
    },
  },
  {
    id: 'bell.place.1',
    page: 'placement',
    prompt: 'The starting point is 20–40 cm. Why is 20 cm not automatically safe?',
    options: ['The stick’s path and rebound may reach that close', 'Twenty centimetres is too far away for a cowbell spot', 'The bell’s ring overloads a mic placed inside 20 cm of it'],
    correct: 'The stick’s path and rebound may reach that close',
    explain: 'The near end is under the common 30 cm minimum for percussion and may sit in some stick paths: the stick defines the minimum.',
    why: {
      'Twenty centimetres is too far away for a cowbell spot': 'It is a close spot; the question is the stick’s reach.',
      'The bell’s ring overloads a mic placed inside 20 cm of it': 'Overload depends on the mic and the hit; clearance is the issue here.',
    },
  },
  {
    id: 'bell.place.2',
    page: 'placement',
    prompt: 'The spot hears more cymbal than bell. What do you change first?',
    options: ['The mic’s position and aim relative to bell and cymbal', 'An EQ cut on the cymbal’s frequencies in the bell spot', 'The overall gain on the spot, turned up for the bell'],
    correct: 'The mic’s position and aim relative to bell and cymbal',
    explain: 'Improve the bell-to-mic versus cymbal-to-mic relationship by placement and pattern; EQ cannot separate them in one spot.',
    why: {
      'An EQ cut on the cymbal’s frequencies in the bell spot': 'Bell and cymbal overlap; EQ cannot separate them.',
      'The overall gain on the spot, turned up for the bell': 'Gain raises the cymbal spill equally.',
    },
  },
  {
    id: 'bell.place.3',
    page: 'placement',
    prompt: 'The bell is painfully sharp in the spot. What could you try?',
    options: ['More distance, another safe angle, or a mute', 'Move the mic into the mouth to soften it', 'Ask the player to hit with the stick’s shoulder'],
    correct: 'More distance, another safe angle, or a mute',
    explain: 'Try a little more distance, a different safe angle, or a bell, beater or mute that fits the part — move the mic, not the stroke.',
    why: {
      'Move the mic into the mouth to soften it': 'The mouth is not a softening chamber; and the stick works there.',
      'Ask the player to hit with the stick’s shoulder': 'The stroke is the player’s; change the mic or the bell.',
    },
  },
  {
    id: 'bell.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · The handheld bell sounds different from the mounted one. Why?',
    options: ['The grip damps it, and the bell now moves', 'Held bells are made of a different metal', 'The stick strikes softer when the bell is held'],
    correct: 'The grip damps it, and the bell now moves',
    explain: 'Handholding changes the bell’s position and damping: place for its whole travel, like a moving source.',
    why: {
      'Held bells are made of a different metal': 'The same bell can be held or mounted; the grip changes it.',
      'The stick strikes softer when the bell is held': 'The touch may vary; the grip’s damping and the motion are the point.',
    },
  },
  {
    id: 'bell.ctx.1',
    page: 'context',
    prompt: 'Live, the kit overheads already hear the bell. When is a spot worth adding?',
    options: ['When the bell needs its own level and beats its spill', 'As a habit, so the bell has its own fader for the show', 'When the overheads have been turned down for the cymbals'],
    correct: 'When the bell needs its own level and beats its spill',
    explain: 'A spot’s useful bell level must exceed its snare and cymbal spill enough to justify another open mic.',
    why: {
      'As a habit, so the bell has its own fader for the show': 'An unneeded spot adds spill and a second arrival.',
      'When the overheads have been turned down for the cymbals': 'That changes the mix, not whether the spot hears the bell cleanly.',
    },
  },
  {
    id: 'bell.ctx.2',
    page: 'context',
    prompt: 'The bell is buried live. Is turning the wedge up for the player a fix?',
    options: ['No — the bell is already loud beside the player', 'Yes — the player needs more of the bell to play it', 'Yes — a louder wedge pushes the bell into the PA'],
    correct: 'No — the bell is already loud beside the player',
    explain: 'Avoid making the monitor louder just to hear a bell that is already acoustically loud near the performer — it adds spill and feedback risk.',
    why: {
      'Yes — the player needs more of the bell to play it': 'The bell is right at the player’s ear; more wedge adds spill.',
      'Yes — a louder wedge pushes the bell into the PA': 'A louder wedge feeds every open mic — feedback, not the bell.',
    },
  },
  {
    id: 'bell.ctx.studio',
    page: 'context',
    prompt: 'A solo bell overdub in a quiet room. What does a farther mic add?',
    options: ['More of the natural decay and the room', 'More attack, because the mic is out of the way', 'Nothing: distance does not change a cowbell'],
    correct: 'More of the natural decay and the room',
    explain: 'In a quiet room a farther mic includes more decay and room; in a noisy room a closer one helps — with stick clearance.',
    why: {
      'More attack, because the mic is out of the way': 'Farther tends to soften the attack against the room.',
      'Nothing: distance does not change a cowbell': 'Distance changes the direct-to-room balance.',
    },
  },
  {
    id: 'bell.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · A stand clamp buzzes on the hardest hits. Is it the bell’s ring?',
    options: ['No — check the mount; tighten or isolate it', 'Yes — a cowbell rings with a buzz on hard hits', 'Yes — and a gate will remove it cleanly'],
    correct: 'No — check the mount; tighten or isolate it',
    explain: 'A well-secured mount may pass vibration; an unstable clamp may buzz or shift. Distinguish ring from mount buzz before processing.',
    why: {
      'Yes — a cowbell rings with a buzz on hard hits': 'The bell rings; a buzz is usually loose hardware.',
      'Yes — and a gate will remove it cleanly': 'The buzz rides on every hit; fix the mount.',
    },
  },
  polarityKeepsDelay(W),
  firstNotch(W),
  {
    id: 'bell.two.3',
    page: 'twoMic',
    prompt: 'Adding the bell spot makes the kit sound hollow. What do you check?',
    options: ['The spot with the overheads, together, in mono', 'The spot alone, soloed, at a high level', 'The overheads alone, since they hear everything'],
    correct: 'The spot with the overheads, together, in mono',
    explain: 'Combine the spot with the other mics and check in mono; adjust distance, angle or balance.',
    why: {
      'The spot alone, soloed, at a high level': 'Soloed, the spot hides how it combines.',
      'The overheads alone, since they hear everything': 'The combination is the question.',
    },
  },
  louderIsNotBetter(W),
  gainCheck(W),
  {
    id: 'bell.prac.3',
    page: 'practice',
    prompt: 'What justifies a cowbell spot on a full kit?',
    options: ['The overheads cannot lift the bell without the cymbals', 'Each instrument on a kit should have its own close mic', 'The bell is the loudest instrument on the whole stage'],
    correct: 'The overheads cannot lift the bell without the cymbals',
    explain: 'A spot is valuable when the overheads cannot bring the bell forward without raising the cymbals too.',
    why: {
      'Each instrument on a kit should have its own close mic': 'Each mic adds spill; it must earn its place.',
      'The bell is the loudest instrument on the whole stage': 'Loudness is not the test; control is.',
    },
  },
  {
    id: 'bell.mix.1',
    page: 'practice',
    prompt: 'A starting point says “20–40 cm”. What else do you need before placing the mic?',
    options: ['The stick’s whole path, and the view to aim at', 'The bell’s brand, so the number fits its size', 'Nothing more: the number already says where it goes'],
    correct: 'The stick’s whole path, and the view to aim at',
    explain: 'The distance is from the bell; the stick’s path sets the clearance, and the side or top view sets the balance.',
    why: {
      'The bell’s brand, so the number fits its size': 'The brand does not change the clearance or the view.',
      'Nothing more: the number already says where it goes': 'A distance means nothing without the stick’s path and the aim.',
    },
  },
  cardioidNull(W),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  {
    id: 'bell.s.sharp',
    observation: 'The metallic strike is painfully prominent',
    firstChecks: 'The bell and beater, or a very close mic?',
    options: ['The bell, the beater and the mic’s closeness', 'A deep EQ cut at the attack’s frequency', 'Ask the player to play the part much softer'],
    correct: 'The bell, the beater and the mic’s closeness',
    explain: 'Audition the source and touch, a greater safe distance or another angle; check the monitoring level too.',
    why: {
      'A deep EQ cut at the attack’s frequency': 'EQ after the fact dulls the ring too; start at the source.',
      'Ask the player to play the part much softer': 'The touch is the music; change the bell or the mic.',
    },
  },
  {
    id: 'bell.s.ring',
    observation: 'The ring covers the following notes',
    firstChecks: 'Is the bell inherently sustained, or is the mount vibrating?',
    options: ['The bell itself, then the mount, then a mute', 'A gate set to close the channel between the notes', 'Turn the bell spot down in the mix'],
    correct: 'The bell itself, then the mount, then a mute',
    explain: 'Inspect the hardware; audition a compatible secure mute or a different bell.',
    why: {
      'A gate set to close the channel between the notes': 'The ring is in the room and other mics too; fix it at the bell.',
      'Turn the bell spot down in the mix': 'The overheads still carry the ring.',
    },
  },
  {
    id: 'bell.s.spill',
    observation: 'The spot mostly contains snare and cymbals',
    firstChecks: 'Is the bell farther from the mic than the competing source, or off axis?',
    options: ['The bell’s distance and angle against the louder source', 'An EQ cut on the snare’s crack in the bell spot', 'More gain on the spot until the bell comes through'],
    correct: 'The bell’s distance and angle against the louder source',
    explain: 'Move or aim the spot — or the bell — for better separation; maybe the overhead already suffices.',
    why: {
      'An EQ cut on the snare’s crack in the bell spot': 'EQ cannot separate sources in one spot.',
      'More gain on the spot until the bell comes through': 'Gain raises the spill with the bell.',
    },
  },
  {
    id: 'bell.s.dist',
    observation: 'Distortion on the loud hits',
    firstChecks: 'Where is it clipping — the mic, the preamp or later? Or is it hardware buzz?',
    options: ['Find the stage that clips — or a buzzing mount', 'Pull the channel fader down a little on the loud hits', 'Swap the player’s stick for a softer one'],
    correct: 'Find the stage that clips — or a buzzing mount',
    explain: 'Test the stages, restore headroom or engage a pad where the overload occurs; do not treat hardware buzz as clipping.',
    why: {
      'Pull the channel fader down a little on the loud hits': 'The fader comes after an earlier overload.',
      'Swap the player’s stick for a softer one': 'The stick is the player’s; find the overload.',
    },
  },
  feedbackSymptom(W),
  monoSymptom(W),
  contactSymptom(W),
];

const DOC = { id: 'r.doc', label: 'It starts about 20–40 cm from a side or top view of the bell, outside the stick’s path', role: 'required' as const, feedback: 'Say what it is measured from — and that the stick sets the clearance.' };

const setupTasks: SetupTask[] = [
  {
    id: 'bell.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A studio overdub: one mounted cowbell, struck with a stick, a quiet room. Phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser about 30 cm from the side, level with the bell', ok: true, power: 'phantom', feedback: 'A side view outside the stick’s path; it needs the phantom this channel has.' },
      { id: 'b', label: 'Small dynamic about 30 cm above and in front, looking down', ok: true, power: 'none', feedback: 'A top view, clear of the stick’s rise; a dynamic needs no power.' },
      { id: 'c', label: 'A mic 8 cm in front of the mouth, where the stick works', ok: false, power: 'phantom', feedback: 'Inside the stick’s path: a target in the groove.' },
      { id: 'd', label: 'A clip pressed against the bell’s side', ok: false, power: 'phantom', feedback: 'Touching the bell damps it and transmits knocks.' },
      { id: 'e', label: 'Ask the player to strike only the bell’s far edge', ok: false, power: 'none', feedback: 'The strokes are the music; place the mic for them.' },
    ],
    reasons: [DOC, CLEAR_REASON, POWER_REASON, PEAK_REASON, BRAND_REASON, TECH_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a side or top view from the bell, outside the stick’s path, power that matches the mic.',
  },
  {
    id: 'bell.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud live show: a cowbell clamped on a drum kit, overheads up. The spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'Overheads only — check the bell sits well in them', ok: true, power: 'none', feedback: 'Fair if the overheads carry it in balance: no extra open mic.' },
      { id: 'b', label: 'A compact dynamic on a secure stand, outside the stick’s path, a null toward the wedge', ok: true, power: 'none', feedback: 'A dedicated spot; a dynamic needs no phantom. Check its spill with the full kit.' },
      { id: 'c', label: 'A condenser spot on the bell', ok: false, power: 'phantom', feedback: 'This input has no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'A spot clamped to the bell’s own mount, touching it', ok: false, power: 'none', feedback: 'It would pass every knock and may turn into the stick’s path.' },
      { id: 'e', label: 'Turn the wedge up so the drummer hears the bell', ok: false, power: 'none', feedback: 'The bell is already loud beside the drummer; more wedge means more spill.' },
    ],
    reasons: [{ id: 'r.doc', label: 'It accounts for the overheads and the stick’s path', role: 'required', feedback: 'Say whether the overheads already carry it — and how the spot stays clear.' }, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'Fewer open mics keep spill and feedback down', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, TECH_REASON],
    explain: 'Two setups pass. What passes is the reasoning: the overheads considered first, the stick’s path clear, power the input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: the stick strikes the bell’s top. Where will the sound leave?', options: ['From the whole body', 'Only from the mouth', 'Only where it was struck'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch where it leaves.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: side view or top view — which hears more of the stick’s attack?', options: ['The top view', 'The side view', 'It depends on the bell'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge sits behind the mic and off to one side. Can a cardioid’s null reach it?', options: ['Yes — with a tilt of the mic', 'No — only a tighter pattern’s null can', 'It is already in the null'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'bell.q.1',
    covers: 'instrument',
    prompt: 'What is a cowbell, as an instrument?',
    options: ['A struck metal idiophone: its whole body vibrates', 'A small brass horn whose sound leaves only from its bell', 'A drum with a metal head stretched over a box'],
    correct: 'A struck metal idiophone: its whole body vibrates',
    explain: 'The metal body vibrates after the beater strikes it. “Bell” names the percussion instrument, not a trumpet’s bell.',
    why: {
      'A small brass horn whose sound leaves only from its bell': 'It is struck metal; brass-wind thinking does not transfer.',
      'A drum with a metal head stretched over a box': 'There is no head: the steel body itself sounds.',
    },
  },
  {
    id: 'bell.q.2',
    covers: 'instrument',
    prompt: 'Mounted or handheld — what changes for a mic?',
    options: ['Held, the bell moves and the grip damps it', 'Nothing: the same bell sounds the same anywhere', 'Mounted, the bell is quieter because it is clamped'],
    correct: 'Held, the bell moves and the grip damps it',
    explain: 'A mounted bell stays put while the stick moves round it; held, its position and damping change.',
    why: {
      'Nothing: the same bell sounds the same anywhere': 'Grip, mount and motion all change what a mic hears.',
      'Mounted, the bell is quieter because it is clamped': 'A secure clamp holds it; the stick’s path matters more.',
    },
  },
  {
    id: 'bell.q.3',
    covers: 'sound',
    prompt: 'What does a mute in the bell’s mouth do?',
    options: ['Shortens the ring — a large mute lowers the pitch too', 'Makes the attack sharper and brighter at a close mic', 'Blocks the sound, which leaves only from the mouth'],
    correct: 'Shortens the ring — a large mute lowers the pitch too',
    explain: 'A cushion or magnet damps the walls: shorter sustain; a large mute also lowers the pitch.',
    why: {
      'Makes the attack sharper and brighter at a close mic': 'It damps the ring; the attack is the stick.',
      'Blocks the sound, which leaves only from the mouth': 'The walls radiate too; a mute damps them.',
    },
  },
  {
    id: 'bell.q.4',
    covers: 'sound',
    prompt: 'Where does the cowbell’s attack begin?',
    options: ['At the stick’s contact on the bell', 'Deep inside the mouth of the bell', 'At the clamp that holds it on the stand'],
    correct: 'At the stick’s contact on the bell',
    explain: 'The stick’s brief contact is the attack; the ring follows from the whole body.',
    why: {
      'Deep inside the mouth of the bell': 'The attack starts where the stick strikes.',
      'At the clamp that holds it on the stand': 'The clamp holds it; it can rattle, but it is not the attack.',
    },
  },
  {
    id: 'bell.q.5',
    covers: 'setting',
    prompt: 'What sets the minimum gap for a mounted cowbell spot?',
    options: ['The stick’s full path, rebound and fills', 'The bell’s own size and its mouth width', 'The mic’s length, so it fits beside the bell'],
    correct: 'The stick’s full path, rebound and fills',
    explain: 'The stick, not the bell, defines the minimum safe clearance — a mic is never a target in the groove.',
    why: {
      'The bell’s own size and its mouth width': 'The bell stays put; the stick moves round it.',
      'The mic’s length, so it fits beside the bell': 'Fitting is not clearing the stick.',
    },
  },
  quickHearing(W),
];

export const I05A_LESSON: SpLesson = {
  id: 'I05a',
  labId: 'percussion',
  title: 'Cowbell',
  subtitle: 'Struck steel: overheads first, a spot outside the stick’s path, open or muted',
  noun: { one: 'cowbell', many: 'cowbells' },
  model: BELL_MODEL,
  micTypeIds: ['orchSdc', 'smallDynCard'],
  zones: BELL_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    setupOrder(W, { text: 'Watch every strike point, fill and rebound; mark the stick’s path', early: 'Start with the player and the music.' }, { text: 'Hear the overheads or area mic first: do they already carry the bell?', early: 'Hear what the existing mics give before you add one.' }),
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A struck idiophone: a tapered steel box, closed at one end and open at the mouth. After the stick strikes it, the whole metal body rings. (“Bell” here is the percussion instrument, not a trumpet’s bell.)', src: 'LESSON-COWBELL' },
    { title: 'WHERE YOU MEET IT', text: 'Clamped on drum kits and timbales rigs, held in percussion sections, in Latin, rock and funk — often under the kit’s overheads.', src: 'DPA-VET' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'A cutting pulse or accent with a ring after it. Bells come in sizes and pitch descriptions; a mute shortens the ring for a tighter part.', src: 'MEINL-SCL70B' },
    { title: 'ITS SIZE', text: 'Common mountable bells are about 7 in long. This lab draws a 7 in bell; its mouth and closed-end sizes are drawn, not measured.', src: 'MEINL-SCL70B' },
  ],
  sound: {
    stages: [
      { title: 'The stick strikes', text: 'The stick strikes the top near the mouth. Its brief contact is the ATTACK.' },
      { title: 'The walls flex', text: 'The steel walls flex — drawn here much larger than they really move — and spring back.' },
      { title: 'The body rings on', text: 'The whole body keeps ringing: the SUSTAIN. A loose clamp can buzz with it; a mute damps it.' },
      { title: 'Sound leaves the whole body', text: 'From the walls and the mouth together — not only the mouth. The mouth’s shape and any damping matter, but it is not a horn.' },
    ],
    attack: 'The stick’s brief contact with the steel — sharper with a harder beater or a closer mic.',
    body: 'The walls ringing on after the strike: the sustain, shortened by a mute or a damping grip. Tendencies — bells, mounts and players vary.',
    head: { diameterMm: 100, rods: 0, label: 'the bell', strikeSrc: 'LESSON-COWBELL' },
  },
  setting: {
    items: [
      { id: 'cowbell', label: 'the cowbell and its player', short: 'COWBELL', note: 'On a stand at the kit or the percussion rig — or held. The drawing every page of this lesson uses.', prov: { kind: 'illustrative', reason: 'a typical layout; no source gives positions' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'kit', label: 'the drum kit and its overheads', short: 'KIT · OHs', note: 'Snare and cymbals a hand’s width from a kit bell; the overheads above may already carry it in balance.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL · MAIN PICKUP', scene: 'kit' },
      { id: 'perc', label: 'the timbales and percussion rig', short: 'PERCUSSION', note: 'Several bells may share a rig: a shared directional mic, or spots — and document which bell a shared mic favours.', prov: { kind: 'illustrative', reason: 'a typical station layout' }, tag: 'STATIONS', scene: 'kit' },
      { id: 'amp', label: 'a guitar amp', short: 'AMP', note: 'Loud upstage: aim the bell spot’s rejection toward it where you can.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'vocal', label: 'a singer’s microphone', short: 'VOCAL MIC', note: 'Another open mic: it hears the bell, bright and loud.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'ANOTHER MIC', scene: 'kit' },
      ...stageItems('the cowbell', 'Kit or percussion overheads may already carry the bell, with cymbals and a woodblock; a spot is added only for the bell’s own level.'),
    ],
    stage: 'LIVE: overheads first; a compact directional spot on a secure mount if needed, its useful level above its spill, its null toward the wedge — tested with the full kit.',
    studio: 'RECORDING: a spot from two safe positions; a farther mic for decay and room in a quiet space; mono usually serves one bell.',
  },
  diagnostic,
  practice: {
    task: 'Choose a safe, musically useful bell and mic position, explain overhead versus spot, tell the bell’s ring from mount buzz and from electronic distortion, and fix a live separation or feedback problem without more gain. With a real bell and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'bell', label: 'Bell, mount and any mute', kind: 'text' },
      { id: 'held', label: 'How it was played', kind: 'choice', choices: ['mounted', 'handheld'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser', 'dynamic', 'overheads only', 'other'] },
      { id: 'dist', label: 'Distances you tried (about 20 and 40 cm)', kind: 'text' },
      { id: 'stick', label: 'The stick’s closest approach', kind: 'text' },
      { id: 'notes', label: 'What you heard (attack, decay, room, bleed)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The mouth (100 × 60 mm) and closed end (70 × 40 mm) sections of the 177.8 mm bell — drawing defaults.', dims: ['mouthW', 'mouthH', 'endW', 'endH'] },
    { text: 'The mounted height (h 1000), the stick’s rise (300 mm) and sector, the left hand’s grip and the player’s posture — drawing defaults and ILLUSTRATIVE.', dims: ['rise', 'mountH'] },
    { text: 'The 20–40 cm band is the lesson’s own audition range, measured from the bell’s centre; its near end is under the common 30 cm minimum.', dims: [] },
  ],
  live: { wedges: standingWedges('the bell') },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every bell, mount, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a 7 in cowbell mounted or held, the walls’ flex drawn as a shape, mic patterns and the two-mic comb as textbook shapes, and motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.',
  copy: BELL_COPY,
  sp: {
    strikeTitle: 'Strike to sound',
    close: { side: { u0: -380, u1: 300, v0: -1300, v1: -760 }, top: { u0: -380, u1: 300, v0: -360, v1: 360 } },
    plan: {
      box: { u0: -2600, u1: 2700, v0: -2100, v1: 2100 },
      things: [
        { id: 'cowbell', kind: 'drums', u: 0, v: 0, scene: 'all' },
        { id: 'kit', kind: 'kit', u: -1450, v: 1200, scene: 'all' },
        { id: 'perc', kind: 'perc', u: -300, v: -1150, scene: 'all' },
        { id: 'amp', kind: 'amp', u: -2000, v: -1100, face: 0, scene: 'all' },
        { id: 'vocal', kind: 'micstand', u: 1150, v: 1350, scene: 'all' },
        ...STAGE_THINGS,
      ],
    },
  },
};
