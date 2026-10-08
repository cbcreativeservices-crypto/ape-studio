/**
 * I05c WOODBLOCK — the lesson's pages as DATA (blueprint §7). Words from the
 * owner's lesson (docs/labs/miking/source_text/Woodblock-Miking-Technique-
 * Research.txt, "L<n>" in COMMENTS only) with the fixes in CORRECTIONS_LOG.md
 * (WB-xx) applied. OWNER RULING 2026-10-04: starting points; no source,
 * brand or model in learner text; no badges; FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, LessonPages, PageContent, SourcePageId, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, cardioidNull, CLEAR_REASON, contactSymptom, feedbackSymptom, firstNotch, gainCheck, hearingCheck, louderIsNotBetter, monoSymptom, moveRemovesDelay, noPhantom, PEAK_REASON, polarityKeepsDelay, POWER_REASON, quickHearing, setupOrder, slowMeter, TECH_REASON, type SpWords } from '../shared/smallperc/commonItems.ts';
import type { SpLesson } from '../shared/smallperc/family.ts';
import { STAGE_THINGS, stageItems, standingWedges } from '../shared/smallperc/stage.ts';
import { WB_MODEL } from './geometry.ts';
import { WB_ZONES } from './model.ts';
import { WB_COPY } from './copy.ts';

const W: SpWords = { p: 'wb', the: 'the woodblock', a: 'a woodblock', noun: 'woodblock', player: 'player', loudest: 'the loudest real hit' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the woodblock',
    goal: 'Get to know the woodblock — what it is, where you meet it, what it does in the music and how it is supported and struck — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A slotted hardwood block, struck with a mallet near its opening. Its support — foam, not a towel — matters as much as the mic.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a mallet stroke becomes the woodblock’s hollow knock — the wall over the slot, the air inside, the opening — and what a muffling support does.',
    credit: { scenarios: ['wb.snd.1', 'wb.snd.2', 'wb.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The wall over the slot and the air in it ring together; much of it leaves by the opening. On a towel it is choked before any mic hears it.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the woodblock sits — on the trap table among the small instruments, near cymbals and drums — and what to do before any mic.',
    credit: { scenarios: ['wb.set.1', 'wb.set.hear', 'wb.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Give the block space, mark the mallet’s path, check for cracks and rattles. Protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the woodblock by its properties — pattern, power, size and how it handles hard peaks — not by its brand.',
    credit: { scenarios: ['wb.mic.1', 'wb.mic.peak', 'wb.mic.power', 'wb.mic.hardware', 'wb.rec.1'], note: 'Answer the five checks (one reaches back to how the block sounds).' },
    takeaway: 'A cardioid condenser or dynamic can both work. Watch the input on the loudest hit, and listen for knocks a mount passes on.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — about 25–50 cm from the block, outside the mallet’s path — from above toward the playing surface, or in front toward the opening.',
    credit: { scenarios: ['wb.place.1', 'wb.place.2', 'wb.place.3', 'wb.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Two viewpoints to compare — the playing surface and the opening — both outside the mallet’s path, never into the slot.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s real rejection faces a loud unwanted source — and decide between a shared overhead and a spot.',
    credit: { scenarios: ['wb.ctx.1', 'wb.ctx.2', 'wb.ctx.studio', 'wb.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the downstage wedge sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'A shared overhead may carry it on a quiet stage; a spot on a loud one — if it hears more block than spill. Never add gain to beat feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See how a woodblock spot and an overhead interact — arrival times, comb-filter notches, and what polarity does and does not change.',
    credit: { scenarios: ['wb.two.1', 'wb.two.2', 'wb.two.3', 'wb.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'The same knock arrives at two mics at different times. Polarity flips the sign; it does not remove a delay. Check in mono.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'The support and the block itself first — then mount noise, the stage that overloads, spill and the monitors.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two briefs, and say what would justify a second mic.',
    credit: { scenarios: ['wb.prac.order', 'wb.prac.gain', 'wb.prac.setup1', 'wb.prac.setup2', 'wb.prac.3', 'wb.mix.1', 'wb.mix.2', 'wb.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'A muffling support recognised, a secure unobstructed setup, shared mic or spot justified, and tone, mount noise, overload, spill and feedback told apart. More than one setup can pass.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L8-L11 · set L8-L11, L54-L56 · mic L22-L28 ·
 * place L20-L26 · ctx L45-L48 · two L36 · prac L60-L67. */
const scenarios: MikingScenario[] = [
  {
    id: 'wb.snd.1',
    page: 'sound',
    prompt: 'Where is a woodblock usually struck — and why there?',
    options: ['Just off the middle, toward the opening: the most resonant spot', 'At the far end, well away from the opening, for a drier, tighter sound', 'On the front face, right across the slot itself'],
    correct: 'Just off the middle, toward the opening: the most resonant spot',
    explain: 'The common beating spot is just off the middle toward the opening — the wall over the slot rings there.',
    why: {
      'At the far end, well away from the opening, for a drier, tighter sound': 'Possible as an effect, but the common spot is toward the opening, for resonance.',
      'On the front face, right across the slot itself': 'The block is struck on top; the slot is its opening.',
    },
  },
  {
    id: 'wb.snd.2',
    page: 'sound',
    prompt: 'The block sits flat on a thick towel. What happens?',
    options: ['It is muffled: a dead, short tap', 'Nothing: the towel only protects the table', 'It rings longer, because the towel isolates it'],
    correct: 'It is muffled: a dead, short tap',
    explain: 'There has to be space underneath so it does not sound muffled — foam, not thick carpet or towels.',
    why: {
      'Nothing: the towel only protects the table': 'The towel damps the block from below; the sound changes.',
      'It rings longer, because the towel isolates it': 'A thick towel damps it; foam with space underneath lets it ring.',
    },
  },
  {
    id: 'wb.snd.3',
    page: 'sound',
    prompt: 'Which way does the opening face, when possible?',
    options: ['Toward the audience', 'Toward the player', 'Down at the table under it'],
    correct: 'Toward the audience',
    explain: 'The opening of the woodblock should face the audience when possible: much of its knock leaves there.',
    why: {
      'Toward the player': 'Toward the audience, where possible.',
      'Down at the table under it': 'Facing the table would muffle it.',
    },
  },
  {
    id: 'wb.set.1',
    page: 'setting',
    prompt: 'Before any mic, what do you check about the block?',
    options: ['Its support, its mallet and its mount — then the mic', 'The mic’s position only; the block and its setup are the player’s', 'Its brand, so the right mic can be chosen'],
    correct: 'Its support, its mallet and its mount — then the mic',
    explain: 'Establish the acoustic sound first: a choked support or a rattling mount cannot be fixed by the mic.',
    why: {
      'The mic’s position only; the block and its setup are the player’s': 'Ask the player — a towel under the block changes everything.',
      'Its brand, so the right mic can be chosen': 'The support and the stroke matter more than a brand.',
    },
  },
  hearingCheck(W),
  {
    id: 'wb.set.2',
    page: 'setting',
    prompt: 'Where must the mic never go?',
    options: ['Into the slot, or where the mallet can reach', 'In front of the block, a little off to the side, toward the opening', 'Above the block, looking at the surface'],
    correct: 'Into the slot, or where the mallet can reach',
    explain: 'Do not put the mic into the slot or its grille where a mallet can reach — including a missed stroke.',
    why: {
      'In front of the block, a little off to the side, toward the opening': 'That is one of the two starting viewpoints.',
      'Above the block, looking at the surface': 'Above and in front, outside the mallet, is the other.',
    },
  },
  {
    id: 'wb.mic.1',
    page: 'microphone',
    prompt: 'Bright click, little woody body: what do you try first?',
    options: ['The mallet and the support, then a safe viewpoint', 'A brighter mic, closer, for a cleaner click', 'A low-mid boost on the channel EQ to add the woody body back'],
    correct: 'The mallet and the support, then a safe viewpoint',
    explain: 'Is it the beater and the strike, or a very close mic? Try an appropriate mallet and support, then viewpoint and distance.',
    why: {
      'A brighter mic, closer, for a cleaner click': 'Closer and brighter makes the click dominate more.',
      'A low-mid boost on the channel EQ to add the woody body back': 'EQ cannot invent a body the support has choked.',
    },
  },
  slowMeter(W),
  noPhantom(W),
  {
    id: 'wb.mic.hardware',
    page: 'microphone',
    prompt: 'A spot clamped to nearby hardware: what do you listen for?',
    options: ['Mechanical knocks carried through the hardware', 'A brighter tone from the clamp’s metal', 'More room, because the mic sits higher'],
    correct: 'Mechanical knocks carried through the hardware',
    explain: 'A mic attached to nearby hardware can transmit mechanical impacts: listen with the block silent while the rest of the kit plays.',
    why: {
      'A brighter tone from the clamp’s metal': 'A clamp does not colour the tone; it carries knocks.',
      'More room, because the mic sits higher': 'Height is not the issue; the hardware path is.',
    },
  },
  {
    id: 'wb.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Aiming straight into the opening: is it the fullest sound?',
    options: ['Not by rule — compare it with the playing surface', 'Yes — the opening is where all of the sound leaves', 'Yes — like a trumpet’s bell, the opening is the source'],
    correct: 'Not by rule — compare it with the playing surface',
    explain: 'Much of the knock leaves by the opening, but there is no universal rule that a capsule pointed into it is best. Compare safe viewpoints.',
    why: {
      'Yes — the opening is where all of the sound leaves': 'The block’s faces radiate too; compare viewpoints.',
      'Yes — like a trumpet’s bell, the opening is the source': 'The opening does not behave like a trumpet bell.',
    },
  },
  {
    id: 'wb.place.1',
    page: 'placement',
    prompt: 'The starting point is 25–50 cm. When is the near end fair?',
    options: ['Only where the mallet’s path and isolation allow', 'Whenever the block sounds a little too quiet', 'Only for a held block, not for one resting on a table'],
    correct: 'Only where the mallet’s path and isolation allow',
    explain: 'A common minimum for percussion is about 30 cm; a closer live spot may work only when clearance and isolation are confirmed.',
    why: {
      'Whenever the block sounds a little too quiet': 'Quiet is a gain or source question; clearance decides the distance.',
      'Only for a held block, not for one resting on a table': 'It depends on the mallet’s path, not the support.',
    },
  },
  {
    id: 'wb.place.2',
    page: 'placement',
    prompt: 'Two or three blocks in a row: where does one mic start?',
    options: ['Aimed at their shared playing area', 'On the loudest block, the others will follow', 'Between two blocks, close to the slots'],
    correct: 'Aimed at their shared playing area',
    explain: 'Begin with one mic aimed at the shared playing area; play the highest and lowest blocks and every transition.',
    why: {
      'On the loudest block, the others will follow': 'The others sit off axis; aim at the shared area.',
      'Between two blocks, close to the slots': 'That is in the mallet’s path — and too close.',
    },
  },
  {
    id: 'wb.place.3',
    page: 'placement',
    prompt: 'One block of a set disappears. What do you check first?',
    options: ['Whether it is off axis, quieter or farther away', 'A second mic for that block straight away, on its own channel', 'An EQ boost at that block’s pitch'],
    correct: 'Whether it is off axis, quieter or farther away',
    explain: 'Re-aim for the whole set or adjust the layout before adding a mic.',
    why: {
      'A second mic for that block straight away, on its own channel': 'A second channel adds bleed; re-aim first.',
      'An EQ boost at that block’s pitch': 'EQ cannot bring back a block the mic does not face.',
    },
  },
  {
    id: 'wb.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · The mic hears a dead tap in every position. What is likely?',
    options: ['The support is muffling the block', 'The mic is broken or badly worn', 'The room is too dry for a woodblock'],
    correct: 'The support is muffling the block',
    explain: 'Give the block space on safe support first — then audition the mic positions.',
    why: {
      'The mic is broken or badly worn': 'A dead tap in every position points at the source.',
      'The room is too dry for a woodblock': 'The room adds air; the support decides the ring.',
    },
  },
  {
    id: 'wb.ctx.1',
    page: 'context',
    prompt: 'On a quiet acoustic stage, does the woodblock need its own spot?',
    options: ['Not always — a shared overhead may carry it well', 'Yes — each small instrument needs its own mic', 'Yes — overheads are too far away to hear a woodblock clearly'],
    correct: 'Not always — a shared overhead may carry it well',
    explain: 'An overhead or area mic may capture the block in balance; on a loud stage it may not deliver enough gain before feedback.',
    why: {
      'Yes — each small instrument needs its own mic': 'Each mic adds spill; it must earn its place.',
      'Yes — overheads are too far away to hear a woodblock clearly': 'A real touring overhead picked up a woodblock, cowbells and cymbals.',
    },
  },
  {
    id: 'wb.ctx.2',
    page: 'context',
    prompt: 'The spot mostly hears cymbals. What do you change?',
    options: ['The block’s and the mic’s positions, and the aim', 'More gain until the block comes through', 'A high-frequency cut on the spot to tame the cymbals in it'],
    correct: 'The block’s and the mic’s positions, and the aim',
    explain: 'Reposition the player or the mic and use the pattern’s rejection — or decide the spot is not useful.',
    why: {
      'More gain until the block comes through': 'Gain raises the cymbals with it.',
      'A high-frequency cut on the spot to tame the cymbals in it': 'It dulls the block’s attack too.',
    },
  },
  {
    id: 'wb.ctx.studio',
    page: 'context',
    prompt: 'A strongly ringing block seems to vanish in the studio mix. First move?',
    options: ['Test its position and level before boosting highs', 'A big high-frequency boost on the spot', 'A second, much closer spot aimed right at the slot'],
    correct: 'Test its position and level before boosting highs',
    explain: 'Test the physical position and the source level before aggressive high-frequency boosting.',
    why: {
      'A big high-frequency boost on the spot': 'A boost after the fact lifts the spill and noise too.',
      'A second, much closer spot aimed right at the slot': 'Never into the slot — and a second spot adds a delay.',
    },
  },
  {
    id: 'wb.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Low buzz or rattle on each hit. Is it the block?',
    options: ['Check the mount, stand and nearby hardware first', 'Yes — woodblocks naturally buzz a little on the hardest hits', 'Yes — and a gate will remove it'],
    correct: 'Check the mount, stand and nearby hardware first',
    explain: 'Tighten or relocate the support, isolate vibration and recheck; also inspect the block for cracks.',
    why: {
      'Yes — woodblocks naturally buzz a little on the hardest hits': 'A buzz is usually hardware — or a crack.',
      'Yes — and a gate will remove it': 'The buzz rides on each hit; fix the cause.',
    },
  },
  polarityKeepsDelay(W),
  firstNotch(W),
  {
    id: 'wb.two.3',
    page: 'twoMic',
    prompt: 'Main mics plus a woodblock spot sound hollow. What do you check?',
    options: ['Both together in mono, at the intended levels', 'The spot soloed, at a high listening level', 'The main mics alone, since they hear the room'],
    correct: 'Both together in mono, at the intended levels',
    explain: 'With two mics hearing the same block, listen together and in mono for colouration from the different arrival times.',
    why: {
      'The spot soloed, at a high listening level': 'Soloed, the spot hides how it combines.',
      'The main mics alone, since they hear the room': 'The combination is the question.',
    },
  },
  louderIsNotBetter(W),
  gainCheck(W),
  {
    id: 'wb.prac.3',
    page: 'practice',
    prompt: 'What would justify a mic per block in a set?',
    options: ['Separate balances the arrangement truly needs', 'The rule of one microphone for each block', 'The blocks need more level than one mic gives'],
    correct: 'Separate balances the arrangement truly needs',
    explain: 'There is no requirement to assign one mic per block; multiple spots cost channels, stands and bleed.',
    why: {
      'The rule of one microphone for each block': 'No such rule: one mic often covers a set.',
      'The blocks need more level than one mic gives': 'Level comes from gain, not more mics.',
    },
  },
  {
    id: 'wb.mix.1',
    page: 'practice',
    prompt: 'A starting point says “25–50 cm”. What else do you need before placing the mic?',
    options: ['The mallet’s path, the support, and the viewpoint', 'The block’s brand, so the number fits its size', 'Nothing more: the number already says where it goes'],
    correct: 'The mallet’s path, the support, and the viewpoint',
    explain: 'The mallet sets the clearance, the support sets the sound, the viewpoint sets the balance.',
    why: {
      'The block’s brand, so the number fits its size': 'The brand does not change the clearance or the view.',
      'Nothing more: the number already says where it goes': 'A distance means nothing without the motion and the aim.',
    },
  },
  cardioidNull(W),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  {
    id: 'wb.s.dead',
    observation: 'A dead, short tap',
    firstChecks: 'Is the block resting on heavy material, or gripped over its opening?',
    options: ['The support and the grip — give it space', 'Move the mic much closer to the block', 'A long reverb to give the tap a tail'],
    correct: 'The support and the grip — give it space',
    explain: 'Give the block space on safe support, then audition the mic placement.',
    why: {
      'Move the mic much closer to the block': 'Closer gives a louder dead tap.',
      'A long reverb to give the tap a tail': 'Processing cannot restore the block’s own ring.',
    },
  },
  {
    id: 'wb.s.click',
    observation: 'A bright click with little wooden body',
    firstChecks: 'The beater and the strike, or a very close mic?',
    options: ['The mallet and the support, then a safe viewpoint', 'A deep treble cut on the channel EQ', 'Ask the player to strike much more softly, with a lighter touch'],
    correct: 'The mallet and the support, then a safe viewpoint',
    explain: 'Try an appropriate mallet and the support, then the viewpoint and the distance.',
    why: {
      'A deep treble cut on the channel EQ': 'EQ dulls the click without adding body.',
      'Ask the player to strike much more softly, with a lighter touch': 'The strokes are the music.',
    },
  },
  {
    id: 'wb.s.buzz',
    observation: 'A low buzz or rattle',
    firstChecks: 'Is the mount, the stand or nearby hardware vibrating?',
    options: ['The mount, the stand and nearby hardware', 'A gate set tight on the channel', 'A low-cut filter on the channel, set as high as it goes'],
    correct: 'The mount, the stand and nearby hardware',
    explain: 'Tighten or relocate the support, isolate vibration, and recheck.',
    why: {
      'A gate set tight on the channel': 'The rattle rides on each hit.',
      'A low-cut filter on the channel, set as high as it goes': 'A filter hides it a little; fix the hardware.',
    },
  },
  {
    id: 'wb.s.clip',
    observation: 'Clipping on the hard strokes',
    firstChecks: 'Which stage distorts — or is the block cracked?',
    options: ['The stage that overloads — or a cracked block', 'Pull the channel fader down a little', 'A softer mallet for the hard strokes'],
    correct: 'The stage that overloads — or a cracked block',
    explain: 'Fix a source defect or restore the relevant headroom; a pad only where the overload occurs.',
    why: {
      'Pull the channel fader down a little': 'The fader comes after the overload.',
      'A softer mallet for the hard strokes': 'The mallet is the player’s; find the overload.',
    },
  },
  feedbackSymptom(W),
  monoSymptom(W),
  contactSymptom(W),
];

const DOC = { id: 'r.doc', label: 'It starts about 25–50 cm from the block, outside the mallet’s path, never into the slot', role: 'required' as const, feedback: 'Say what it is measured from — and how it stays clear.' };

const setupTasks: SetupTask[] = [
  {
    id: 'wb.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A studio overdub: one woodblock on a trap table, struck with a rubber mallet. Phantom power is available.',
    setups: [
      { id: 'a', label: 'Block on foam; small condenser about 35 cm in front, toward the opening', ok: true, power: 'phantom', feedback: 'A block with space under it and a viewpoint toward the opening, outside the mallet; it needs the phantom this channel has.' },
      { id: 'b', label: 'Block on foam; small dynamic about 35 cm above and in front, at the surface', ok: true, power: 'none', feedback: 'The other viewpoint; a dynamic needs no power.' },
      { id: 'c', label: 'Block flat on a folded towel; condenser close to the slot', ok: false, power: 'phantom', feedback: 'The towel chokes it, and close to the slot sits in the mallet’s reach.' },
      { id: 'd', label: 'A small mic pushed into the slot', ok: false, power: 'phantom', feedback: 'Never into the slot.' },
      { id: 'e', label: 'Ask the player to strike the far end, away from the opening', ok: false, power: 'none', feedback: 'The strike is the player’s; place the mic for it.' },
    ],
    reasons: [DOC, CLEAR_REASON, POWER_REASON, PEAK_REASON, BRAND_REASON, TECH_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a block with space under it, a start outside the mallet’s path, power that matches the mic.',
  },
  {
    id: 'wb.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud live show: a woodblock at a percussion station next to the drum kit. The spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'A small dynamic on its own stand near the block, a null toward the wedge', ok: true, power: 'none', feedback: 'A dedicated spot nearer the block than the cymbals; a dynamic needs no phantom.' },
      { id: 'b', label: 'The station’s shared overhead, if it carries the block in balance', ok: true, power: 'none', feedback: 'Fair if it serves: fewer open mics.' },
      { id: 'c', label: 'A condenser spot on the block', ok: false, power: 'phantom', feedback: 'This input has no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'A mic clamped to the kit’s hardware, aimed at the block', ok: false, power: 'none', feedback: 'It would carry every knock from the kit’s hardware.' },
      { id: 'e', label: 'Turn the block’s channel up until it beats the cymbals', ok: false, power: 'none', feedback: 'More gain raises the cymbals and the feedback risk too.' },
    ],
    reasons: [{ id: 'r.doc', label: 'It hears more block than spill, outside the mallet’s path', role: 'required', feedback: 'Say what it hears — and how it stays clear.' }, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'Fewer open mics keep spill and feedback down', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, TECH_REASON],
    explain: 'Two setups pass. What passes is the reasoning: a useful block-to-spill ratio, clearance, and power the input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: the mallet strikes near the opening. What rings?', options: ['The wall over the slot, and the air in it', 'Only the spot the mallet touched', 'The table under the block'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch the wall over the slot.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: toward the opening, or toward the playing surface — which sounds fuller?', options: ['The opening', 'The surface', 'It depends on this block'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge sits behind the mic and off to one side. Can a cardioid’s null reach it?', options: ['Yes — with a tilt of the mic', 'No — only a tighter pattern’s null can', 'It is already in the null'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'wb.q.1',
    covers: 'instrument',
    prompt: 'What makes a woodblock an idiophone?',
    options: ['Its solid body vibrates when struck — no head', 'A thin skin is stretched over its slot', 'Air blown across the long slot makes its sound'],
    correct: 'Its solid body vibrates when struck — no head',
    explain: 'A solid-body instrument whose vibrating body is struck by a beater: an idiophone.',
    why: {
      'A thin skin is stretched over its slot': 'There is no skin; the wood itself vibrates.',
      'Air blown across the long slot makes its sound': 'It is struck with a mallet, not blown.',
    },
  },
  {
    id: 'wb.q.2',
    covers: 'instrument',
    prompt: 'What should a woodblock rest on?',
    options: ['Foam, with space underneath', 'Thick carpet, to stop it sliding', 'A folded towel, to protect it'],
    correct: 'Foam, with space underneath',
    explain: 'Space underneath so it does not sound muffled — foam, not thick carpet or towels.',
    why: {
      'Thick carpet, to stop it sliding': 'Thick carpet muffles it.',
      'A folded towel, to protect it': 'A towel muffles it from below.',
    },
  },
  {
    id: 'wb.q.3',
    covers: 'sound',
    prompt: 'What rings when the block is struck near the opening?',
    options: ['The wall over the slot and the air inside', 'Only the surface where the mallet lands', 'The mallet head, more than the block'],
    correct: 'The wall over the slot and the air inside',
    explain: 'The thin wall over the slot and the air in it ring together — the hollow knock.',
    why: {
      'Only the surface where the mallet lands': 'The whole thin wall and the slot’s air ring.',
      'The mallet head, more than the block': 'The mallet strikes; the block rings.',
    },
  },
  {
    id: 'wb.q.4',
    covers: 'sound',
    prompt: 'Laid on a thick towel, the block gives a dead tap. Will a better mic fix it?',
    options: ['No — give the block space first', 'Yes — a condenser will catch the ring', 'Yes — a closer mic restores the body'],
    correct: 'No — give the block space first',
    explain: 'The towel choked the block at the source; no mic restores it.',
    why: {
      'Yes — a condenser will catch the ring': 'There is no ring left to catch.',
      'Yes — a closer mic restores the body': 'Closer gives a louder dead tap.',
    },
  },
  {
    id: 'wb.q.5',
    covers: 'setting',
    prompt: 'What sets the minimum gap for a woodblock mic?',
    options: ['The mallet’s path, rebound and a missed stroke', 'The block’s length and the width of its slot', 'The length of the microphone’s body alone'],
    correct: 'The mallet’s path, rebound and a missed stroke',
    explain: 'Keep mics, booms, clamps and cables outside the entire mallet path, including rebound and a missed stroke.',
    why: {
      'The block’s length and the width of its slot': 'The block stays put; the mallet moves.',
      'The length of the microphone’s body alone': 'Fitting is not clearing the mallet.',
    },
  },
  quickHearing(W),
];

export const I05C_LESSON: SpLesson = {
  id: 'I05c',
  labId: 'percussion',
  title: 'Woodblock',
  subtitle: 'Space under the block first: the playing surface or the opening — never into the slot',
  noun: { one: 'woodblock', many: 'woodblocks' },
  model: WB_MODEL,
  micTypeIds: ['orchSdc', 'smallDynCard'],
  zones: WB_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    setupOrder(W, { text: 'Check the support, the mallet and the mount; mark the mallet’s path', early: 'Start with the block, the player and the music.' }, { text: 'Hear whether an overhead or main mic already carries the block', early: 'Hear what the existing mics give before you add one.' }),
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A solid hardwood block with a slot cut into it, struck with a mallet: its vibrating body makes the sound — an idiophone. Sets of two or three blocks are common; synthetic blocks are a different instrument.', src: 'LESSON-WOODBLOCK' },
    { title: 'WHERE YOU MEET IT', text: 'On trap tables in orchestras and bands, at percussion stations, beside drum kits — often under a percussion overhead.', src: 'DPA-VET' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'A hollow, woody knock — a clock-tick, a gallop, an accent. Struck just off the middle toward the opening with a rubber, plastic or hard-cord mallet.', src: 'PAS-ECV02' },
    { title: 'ITS SIZE', text: 'Blocks come small to large. This lab draws one about 19 cm long — a drawing; no maker prints a size.', src: 'LESSON-WOODBLOCK' },
  ],
  sound: {
    stages: [
      { title: 'The mallet strikes', text: 'The mallet strikes the top, just off the middle toward the opening: the ATTACK.' },
      { title: 'The wall flexes', text: 'The thin wall over the slot flexes — drawn much larger than it moves.' },
      { title: 'Wall and air ring', text: 'The wall and the air in the slot ring together: the hollow, woody BODY. On a towel, this is where it dies.' },
      { title: 'Sound leaves', text: 'From the block, and strongly from the opening — which faces the audience when possible.' },
    ],
    attack: 'The mallet meeting the top: a sharp knock — harder with a plastic mallet, softer with cord.',
    body: 'The wall over the slot and the air in it ringing together: the hollow knock — present only when the block has space underneath. Tendencies — blocks and mallets vary.',
    head: { diameterMm: 65, rods: 0, label: 'the block', strikeSrc: 'PAS-ECV02' },
  },
  setting: {
    items: [
      { id: 'woodblock', label: 'the woodblock at the trap table', short: 'WOODBLOCK', note: 'On foam on the trap table, the opening toward the audience, the player behind it. The drawing every page of this lesson uses.', prov: { kind: 'illustrative', reason: 'a typical station layout; no source gives positions' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'perc', label: 'other percussion at the station', short: 'PERCUSSION', note: 'Cowbell, tambourine, shakers on the same table: the player moves between them; the block must stay reachable and the mic clear.', prov: { kind: 'illustrative', reason: 'a typical station layout' }, tag: 'STATIONS', scene: 'kit' },
      { id: 'kit', label: 'the drum kit', short: 'DRUM KIT', note: 'Cymbals near the block: a spot must be nearer the block than the cymbals to be worth it.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'amp', label: 'a guitar amp', short: 'AMP', note: 'Loud upstage: aim the block mic’s rejection toward it where you can.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'vocal', label: 'a singer’s microphone', short: 'VOCAL MIC', note: 'Another open mic: it hears the knock too.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'ANOTHER MIC', scene: 'kit' },
      ...stageItems('the woodblock', 'An overhead over the percussion may already carry the block with cymbals and cowbells; a spot only for its own level.'),
    ],
    stage: 'LIVE: an overhead may do on a quiet stage; on a loud one, a secure directional spot nearer the block than the cymbals, its null toward the wedge — tested with every instrument change.',
    studio: 'RECORDING: one spot often suffices — foam under the block, a safe viewpoint, a farther mic for room; mono for one block.',
  },
  diagnostic,
  practice: {
    task: 'Recognise a muffling support, set up a secure, unobstructed mic, justify a shared mic or a spot, and tell source tone, mount noise, electronic overload, spill and feedback apart. With a real block and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'block', label: 'Block, mallet and support', kind: 'text' },
      { id: 'support', label: 'Support', kind: 'choice', choices: ['foam on a table', 'held', 'mounted'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser', 'dynamic', 'overhead only', 'other'] },
      { id: 'dist', label: 'Distances you tried (about 30 and 50 cm)', kind: 'text' },
      { id: 'view', label: 'Viewpoint: surface or opening — what changed', kind: 'text' },
      { id: 'notes', label: 'What you heard (attack, body, room, bleed)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The block (190 × 65 × 70 mm), its slot (140 × 8 mm, 45 mm deep), the foam (25 mm) and the trap table (h 900) — drawing defaults.', dims: ['len', 'depth', 'h', 'slotLen', 'slotT', 'slotDepth', 'foamT', 'tableH'] },
    { text: 'The mallet (350 mm), its stroke (±30° from the wrist) with a 60 mm rebound margin, and the player’s posture — drawing defaults and ILLUSTRATIVE.', dims: ['mallet'] },
    { text: 'The 25–50 cm band is the lesson’s own audition range; its near end is under the common 30 cm minimum and only fair where clearance allows.', dims: [] },
  ],
  live: { wedges: standingWedges('the woodblock') },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every block, mallet, support and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a woodblock on foam or in the hand, the wall’s flex drawn as a shape, mic patterns and the two-mic comb as textbook shapes, and motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.',
  copy: WB_COPY,
  sp: {
    strikeTitle: 'Strike to sound',
    close: { side: { u0: -380, u1: 260, v0: -1260, v1: -760 }, top: { u0: -380, u1: 260, v0: -360, v1: 360 } },
    plan: {
      box: { u0: -2600, u1: 2700, v0: -2100, v1: 2100 },
      things: [
        { id: 'woodblock', kind: 'drums', u: 0, v: 0, scene: 'all' },
        { id: 'perc', kind: 'perc', u: -250, v: 1050, scene: 'all' },
        { id: 'kit', kind: 'kit', u: -1500, v: -1350, scene: 'all' },
        { id: 'amp', kind: 'amp', u: -1900, v: 950, face: 0, scene: 'all' },
        { id: 'vocal', kind: 'micstand', u: 1100, v: -1350, scene: 'all' },
        ...STAGE_THINGS,
      ],
    },
  },
};
