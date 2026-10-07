/**
 * I06c BAR CHIMES (a mark tree) — the lesson as DATA. Words from the owner's
 * lesson (docs/labs/miking/source_text/Bar-Chimes-Miking-Technique-
 * Research.txt; "L<n>" in comments only), research in docs/labs/miking/
 * bar_chimes/, corrections in CORRECTIONS_LOG.md (BC-01 …). Owner ruling
 * 2026-10-04: suggested starting points, no sources, brands or badges on
 * screen. FULLY SILENT. Whole percussion sections (Lab 5, later) are named in
 * words only.
 *
 * The 40–80 cm range and the end-mic pair are the lesson's own trials; the
 * one published number is a general 30 cm floor for percussion.
 */
import type { DiagnosticItem, Lesson, MikingScenario, LessonPages, PageContent, SourcePageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, cardioidNull, CLEAR_REASON, contactSymptom, firstNotch, gainCheck, hearingCheck, louderIsNotBetter, monoSymptom, moveRemovesDelay, PLAYER_REASON, polarityKeepsDelay, POWER_REASON, quickHearing, setupOrder, tailSymptom, type MetalWords } from '../shared/metal/metalItems.ts';
import { metalWords } from '../shared/metal/metalCopy.ts';
import { BC_MODEL, BC_ZONES } from './geometry.ts';

const W: MetalWords = { p: 'bc', the: 'the bar chimes', player: 'player', loudest: 'the strongest strike', tail: 'the shimmer’s tail' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the bar chimes',
    goal: 'Get to know bar chimes — what they are, where you meet them, what they do in the music and their parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A straight row of graduated metal bars, each hung freely on its own filament from a wooden rail, swept by the hand. Not wind chimes (a circle) and not a bell tree (nested bells).',
  },
  sound: {
    title: 'How they make their sound',
    goal: 'See how a sweep becomes sound — bars struck one after another, each ringing on and swinging — and why the long bars sound lower. Shown, never played.',
    credit: { scenarios: ['bc.snd.1', 'bc.snd.2', 'bc.snd.3'], interactive: 'soundPath', note: 'Step the sweep through to the end (or play it once), and answer the three checks.' },
    takeaway: 'A sweep is a run of brief attacks with overlapping rings: the shimmer. Each bar is a bar held at neither end; a shorter bar of the same thickness rings higher — half the length, four times the pitch.',
  },
  setting: {
    title: 'Where they sit',
    goal: 'Know where bar chimes sit — the stand, the player’s sweep, the neighbours, what a stage and a studio add — and what to do before any mic.',
    credit: { scenarios: ['bc.set.1', 'bc.set.hear', 'bc.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Ask for the whole gesture: direction, start and end bars, speed, accents and any damping. The swinging bars and the hand set the clearance; check the filaments and the stand. Protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for bar chimes by its properties — pattern, power, size, mount and peak handling — not by its brand.',
    credit: { scenarios: ['bc.mic.1', 'bc.mic.2', 'bc.mic.3', 'bc.mic.4', 'bc.rec.1'], note: 'Answer the five checks (one reaches back to how they sound).' },
    takeaway: 'A condenser is a practical detailed-pickup trial, not a requirement; a dynamic can suit a loud stage. The pattern and its off-axis response decide how evenly a wide row is covered.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — about 40–80 cm from the middle of the row, facing its length — then move the mic and see what changes.',
    credit: { scenarios: ['bc.place.1', 'bc.place.2', 'bc.place.3', 'bc.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the swing and the hand, in two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Begin about 40–80 cm from the middle of the row, facing its whole length, at a height that sees the bars. Check both sweep directions. An end mic alone gives an uneven row; a pair at the ends is a deliberate option.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces a loud monitor — and know when the overheads already carry the chimes.',
    credit: { scenarios: ['bc.ctx.1', 'bc.ctx.2', 'bc.ctx.studio', 'bc.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Quiet ensembles: a shared percussion mic or the overheads may carry the sweep. Loud stages: a directional spot outside the swing, with its null toward the loudest wedge — and the chimes away from louder cymbals.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'Put a mic at each end of the row: see how each bar reaches them at different times, what polarity does and does not change, and judge the pair in mono.',
    credit: { scenarios: ['bc.two.1', 'bc.two.2', 'bc.two.3', 'bc.two.4'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Each bar reaches two end mics at different times — a different delay for every bar along the sweep. Polarity flips the sign; it does not remove a delay. Check width and mono; start with one mic.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Separate the source and the mount from the mic: an uneven sweep, a clank, a bar hitting hardware or a cut-off tail usually start at the instrument or a gate — before the mic’s position.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second mic.',
    credit: { scenarios: ['bc.prac.order', 'bc.prac.gain', 'bc.prac.setup1', 'bc.prac.setup2', 'bc.prac.3', 'bc.mix.1', 'bc.mix.2', 'bc.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'Capture the whole gesture and its tail, tell source and mount faults from mic placement, keep clear of the swing, and justify a spot or the main pickup for studio and stage. More than one setup can pass.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L5-L8 · set L8, L42 · mic L12-L15 · place L11-L14 ·
 * ctx L36-L41 · two L33, L38 · prac L60-L65. */
const scenarios: MikingScenario[] = [
  {
    id: 'bc.snd.1',
    page: 'sound',
    prompt: 'Where does the shimmer of a bar-chime sweep come from?',
    options: ['Brief attacks one after another, their rings overlapping', 'One long note that the hand stretches out as it moves along', 'Air rushing between the bars as the hand passes'],
    correct: 'Brief attacks one after another, their rings overlapping',
    explain: 'The hand strikes the bars in turn; each rings on and swings after the hand passes. The succession of attacks and overlapping decays is the shimmer.',
    why: {
      'One long note that the hand stretches out as it moves along': 'There are many short strikes, one per bar, and each bar rings on its own.',
      'Air rushing between the bars as the hand passes': 'The metal bars themselves ring; the air does not make the sound.',
    },
  },
  {
    id: 'bc.snd.2',
    page: 'sound',
    prompt: 'Two bars of the same thickness: one is half as long. How does its pitch compare?',
    options: ['About four times higher — two octaves', 'About twice as high — one octave up', 'The same pitch, only a little quieter'],
    correct: 'About four times higher — two octaves',
    explain: 'For bars of one thickness and metal, pitch rises with 1 ÷ length²: half the length, four times the pitch. That is how a graduated row makes its rising run.',
    why: {
      'About twice as high — one octave up': 'That would be a string or a pipe. A bar’s pitch goes with 1 ÷ length²: half the length gives four times.',
      'The same pitch, only a little quieter': 'Length sets a bar’s pitch: the shorter bars are the higher ones.',
    },
  },
  {
    id: 'bc.snd.3',
    page: 'sound',
    prompt: 'After the hand has passed, what keeps sounding?',
    options: ['Every struck bar, ringing and swinging on', 'Nothing: each bar stops as the hand leaves it', 'Only the very last bar the hand touched'],
    correct: 'Every struck bar, ringing and swinging on',
    explain: 'Each bar keeps ringing after the hand passes — unless the player or a damper stops it. The end of a sweep is part of the music.',
    why: {
      'Nothing: each bar stops as the hand leaves it': 'The bars hang freely: they ring on unless something damps them.',
      'Only the very last bar the hand touched': 'All the struck bars ring on, the earlier ones fading first.',
    },
  },
  {
    id: 'bc.set.1',
    page: 'setting',
    prompt: 'Before you place a bar-chime mic, what do you ask the player to show you?',
    options: ['The sweep: direction, start and end bars, speed and damping', 'Only the loudest strike, so the gain can be set from it first', 'Nothing yet: set the mic first, then fit the sweep round it'],
    correct: 'The sweep: direction, start and end bars, speed and damping',
    explain: 'A mic aimed only at one end of a long row gives an uneven sweep. The direction, the reach, the swinging bars and the damping all decide where a mic can go.',
    why: {
      'Only the loudest strike, so the gain can be set from it first': 'Gain needs the strongest strike AND the quiet tail — and placement needs the whole sweep.',
      'Nothing yet: set the mic first, then fit the sweep round it': 'Never fit the player round a mic; place the mic for the gesture.',
    },
  },
  hearingCheck(W),
  {
    id: 'bc.set.2',
    page: 'setting',
    prompt: 'Before the soundcheck, what do you check on the instrument?',
    options: ['The filaments, the rail, the clamp and the stand', 'That the bars are tied tightly up against the wooden rail', 'That the bars are cleaned and polished'],
    correct: 'The filaments, the rail, the clamp and the stand',
    explain: 'A loose bar or an overloaded clamp can fall. Use hardware rated for the assembly on a stable stand — and leave the bars room to swing.',
    why: {
      'That the bars are tied tightly up against the wooden rail': 'The bars must hang freely on their filaments, or they cannot ring.',
      'That the bars are cleaned and polished': 'Polish is cosmetic; the suspension and the stand are the safety check.',
    },
  },
  {
    id: 'bc.mic.1',
    page: 'microphone',
    prompt: 'A single strike sounds harsh. What do you look at first?',
    options: ['The hand or striker and the force, then the mic’s view', 'A bigger condenser, which will soften the strike of each bar', 'Lower gain until the harshness goes away'],
    correct: 'The hand or striker and the force, then the mic’s view',
    explain: 'A faster or stronger sweep, or a striker, changes the source before the mic does. Then compare a safe mic view at matched level.',
    why: {
      'A bigger condenser, which will soften the strike of each bar': 'Diaphragm size is not a tone control. Start with the source.',
      'Lower gain until the harshness goes away': 'Gain changes the level, not the balance: it stays harsh, only quieter.',
    },
  },
  {
    id: 'bc.mic.2',
    page: 'microphone',
    prompt: 'The meter looks modest, but the densest sweep distorts. Why can that happen?',
    options: ['A slow meter can miss the brief peaks that overload the input', 'The mic distorts when its level is set too low', 'A modest meter reading means the mic cable is faulty somewhere'],
    correct: 'A slow meter can miss the brief peaks that overload the input',
    explain: 'The attacks are very brief while the sound continues. Check the strongest strike and the densest sweep on a peak meter, at the mic, preamp, converter and live output.',
    why: {
      'The mic distorts when its level is set too low': 'Low level does not cause distortion; brief peaks the meter misses do.',
      'A modest meter reading means the mic cable is faulty somewhere': 'Nothing is broken: the meter is too slow for the peaks.',
    },
  },
  {
    id: 'bc.mic.3',
    page: 'microphone',
    prompt: 'The spare channel has no phantom power. Which of this page’s mics can you use?',
    options: ['The small dynamic: it needs no power', 'The small condenser, if it sits farther back', 'Either, as long as the gain is turned up'],
    correct: 'The small dynamic: it needs no power',
    explain: 'A dynamic needs no power. A condenser needs phantom power wherever it is placed.',
    why: {
      'The small condenser, if it sits farther back': 'Distance does not change what a condenser needs.',
      'Either, as long as the gain is turned up': 'Gain cannot power a condenser.',
    },
  },
  {
    id: 'bc.mic.4',
    page: 'microphone',
    prompt: 'Why does the pattern’s off-axis response matter more for bar chimes than for a small shaker?',
    options: ['A wide row puts its ends off the mic’s axis', 'Long bars only radiate from their bottom ends', 'Chimes are louder, so the pattern changes shape'],
    correct: 'A wide row puts its ends off the mic’s axis',
    explain: 'The middle of the row is on axis; the ends are off it. How the pattern and its off-axis response treat them decides how even the sweep sounds.',
    why: {
      'Long bars only radiate from their bottom ends': 'Each bar radiates along its length; the row’s width is the issue.',
      'Chimes are louder, so the pattern changes shape': 'A mic’s pattern does not change with level; the row’s width does the work here.',
    },
  },
  {
    id: 'bc.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic close to one end of the row hears what?',
    options: ['More of that end’s bars: an uneven sweep', 'The whole sweep evenly, from end to end', 'Only the rail, not the bars'],
    correct: 'More of that end’s bars: an uneven sweep',
    explain: 'Nearer bars are louder at the mic. A central view facing the row’s length keeps the first and the last bars in balance.',
    why: {
      'The whole sweep evenly, from end to end': 'The bars nearer the mic come up louder; the far end drops away.',
      'Only the rail, not the bars': 'The bars are the source; the rail only holds them.',
    },
  },
  {
    id: 'bc.place.1',
    page: 'placement',
    prompt: 'A starting point says about 40–80 cm. What is it measured from?',
    options: ['The middle of the row, at the bars’ height', 'The nearer end of the wooden rail it hangs from', 'The floor, so the stand is set first'],
    correct: 'The middle of the row, at the bars’ height',
    explain: 'The distance is from the centre of the row — at a height that sees the bars, not only the rail — and the mic still stays outside the swing and the hand.',
    why: {
      'The nearer end of the wooden rail it hangs from': 'An end is the wrong reference for a central view: measure from the middle of the row.',
      'The floor, so the stand is set first': 'The floor says nothing about the distance to the sound.',
    },
  },
  {
    id: 'bc.place.2',
    page: 'placement',
    prompt: 'The mic is level with the rail. What might it miss?',
    options: ['Much of the bars below it', 'Nothing: the rail carries the sound', 'Only the highest, shortest bars'],
    correct: 'Much of the bars below it',
    explain: 'The bars hang below the rail and ring along their length: aim at a height that sees them, not only the wooden rail.',
    why: {
      'Nothing: the rail carries the sound': 'The rail holds the bars; the bars make the sound.',
      'Only the highest, shortest bars': 'Level with the rail it sees the tops of all the bars and little of their length.',
    },
  },
  {
    id: 'bc.place.3',
    page: 'placement',
    prompt: 'A double row sounds uneven from your spot. What do you try first?',
    options: ['A different safe angle or a little more distance', 'A second mic, aimed only at the far row of bars', 'Ask the player to sweep only one row'],
    correct: 'A different safe angle or a little more distance',
    explain: 'A wider assembly may need more distance for even coverage. Compare a different view or a moderate distance before adding another mic.',
    why: {
      'A second mic, aimed only at the far row of bars': 'Move the one mic first; a second adds spill and timing problems.',
      'Ask the player to sweep only one row': 'The sweep is the player’s; change the mic’s view.',
    },
  },
  {
    id: 'bc.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Your stand clears the bars at rest. Is that enough?',
    options: ['No — the bars swing after each strike, and the hand sweeps', 'Yes — the bars hang still, so that is plenty of room for a mic', 'Yes, as long as the cable is taped down'],
    correct: 'No — the bars swing after each strike, and the hand sweeps',
    explain: 'Struck bars swing on their filaments, and the hand moves through and past them. Leave room for both, plus a margin.',
    why: {
      'Yes — the bars hang still, so that is plenty of room for a mic': 'They hang still only at rest; struck, they swing.',
      'Yes, as long as the cable is taped down': 'Taping helps, but the stand must still clear the swing and the hand.',
    },
  },
  {
    id: 'bc.ctx.1',
    page: 'context',
    prompt: 'A quieter ensemble with overheads up. Do the chimes need their own mic?',
    options: ['Listen first: the overheads may already carry the sweep', 'Yes — each small instrument needs its own spot mic', 'No — chimes are much too quiet for a PA to help with'],
    correct: 'Listen first: the overheads may already carry the sweep',
    explain: 'A shared percussion mic or the overheads may cover it. Add a spot when independent control helps — each open mic adds spill and feedback risk.',
    why: {
      'Yes — each small instrument needs its own spot mic': 'More open mics mean more spill and less gain before feedback. Listen first.',
      'No — chimes are much too quiet for a PA to help with': 'A loud stage may need them reinforced; decide by listening.',
    },
  },
  {
    id: 'bc.ctx.2',
    page: 'context',
    prompt: 'The chimes are masked by the band. First move?',
    options: ['Move the chimes or lower competing levels before gain', 'Turn the chime mic up until it cuts through the whole band', 'Ask the player to sweep much harder each time'],
    correct: 'Move the chimes or lower competing levels before gain',
    explain: 'Change the instrument’s location, competing stage levels or the arrangement before forcing gain — which raises the spill and the feedback risk too.',
    why: {
      'Turn the chime mic up until it cuts through the whole band': 'More gain raises the band in that mic too, and brings feedback closer.',
      'Ask the player to sweep much harder each time': 'A harder sweep changes the source and the music.',
    },
  },
  {
    id: 'bc.ctx.studio',
    page: 'context',
    prompt: 'An ensemble recording. When do the chimes earn their own spot?',
    options: ['When the main or overhead mics do not carry them well', 'As a habit, so they can be turned up later', 'When they are the loudest instrument anywhere in the room'],
    correct: 'When the main or overhead mics do not carry them well',
    explain: 'Listen to the main pickup first; a spot helps for independent control — placed away from louder cymbals and checked with the main, in mono.',
    why: {
      'As a habit, so they can be turned up later': 'A spot that is not needed adds spill and can colour the sum.',
      'When they are the loudest instrument anywhere in the room': 'Loudness is not the test; what the main mics miss is.',
    },
  },
  {
    id: 'bc.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Should a live spot gate the chimes between sweeps?',
    options: ['No — a gate cuts the overlapping tail', 'Yes — gates keep the chimes clean', 'Yes, with a long hold time set'],
    correct: 'No — a gate cuts the overlapping tail',
    explain: 'The shimmer is attacks with long, overlapping rings; a gate truncates the decay. Let the player or a damper end the sound.',
    why: {
      'Yes — gates keep the chimes clean': 'A gate cuts the tail the music needs.',
      'Yes, with a long hold time set': 'Even a long hold cuts a tail that keeps going; fix spill another way.',
    },
  },
  polarityKeepsDelay(W),
  firstNotch(W),
  {
    id: 'bc.two.3',
    page: 'twoMic',
    prompt: 'Two mics, one at each end of the row. Does that give an even, wide image by itself?',
    options: ['Not by itself — check the width and the mono sum', 'Yes — two end mics will give an even, wide image by themselves', 'Yes, as long as both are the same model'],
    correct: 'Not by itself — check the width and the mono sum',
    explain: 'Each bar reaches the two mics at different times — a different delay for every bar. Listen to the stereo width and the mono sum; start with one mic.',
    why: {
      'Yes — two end mics will give an even, wide image by themselves': 'Every bar has its own delay to the two mics; check the result by ear, in mono.',
      'Yes, as long as both are the same model': 'Matched mics do not remove the different arrival times.',
    },
  },
  louderIsNotBetter(W),
  gainCheck(W),
  {
    id: 'bc.prac.3',
    page: 'practice',
    prompt: 'What would justify a second bar-chime mic?',
    options: ['A deliberately wide image, or a row too wide for one', 'Two mics are the usual standard for bar chimes', 'The chimes need more level than one mic can give them'],
    correct: 'A deliberately wide image, or a row too wide for one',
    explain: 'A mic at each end is an option for a deliberately wide or difficult setup — at the cost of open mics, spill and combined-mic complexity. Start with one.',
    why: {
      'Two mics are the usual standard for bar chimes': 'One well-placed mic is the usual start.',
      'The chimes need more level than one mic can give them': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'bc.mix.1',
    page: 'practice',
    prompt: 'This sweep sounds brighter than the last. Mic or player?',
    options: ['Keep the mic still and compare the same sweep', 'Move the mic and change the sweep together', 'Add EQ until both sweeps sound the same'],
    correct: 'Keep the mic still and compare the same sweep',
    explain: 'A faster or stronger sweep changes the source: keep the mic still and repeat the same direction, speed and force before judging the mic.',
    why: {
      'Move the mic and change the sweep together': 'Changing two things at once hides which one made the difference.',
      'Add EQ until both sweeps sound the same': 'EQ hides the cause; find whether the source or the mic changed.',
    },
  },
  cardioidNull(W),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  {
    id: 'bc.s.ends',
    observation: 'The start or end of the sweep disappears',
    firstChecks: 'Is the mic too near one end — or is the player’s sweep inconsistent?',
    options: ['Whether the mic is near one end, or the sweep varies', 'Turn up the high frequencies on the desk', 'Ask the player to start each sweep a lot louder'],
    correct: 'Whether the mic is near one end, or the sweep varies',
    explain: 'Compare the full gesture; re-centre the mic on the row or step back safely.',
    why: {
      'Turn up the high frequencies on the desk': 'EQ does not move the mic toward the missing end.',
      'Ask the player to start each sweep a lot louder': 'The sweep is the music; centre the mic instead.',
    },
  },
  {
    id: 'bc.s.short',
    observation: 'The ring is short or uneven',
    firstChecks: 'Do bars hit hardware or a damper they should not?',
    options: ['Whether bars touch hardware or a damper', 'Move the mic much closer to catch the ring', 'Add reverb to lengthen the ring of each bar'],
    correct: 'Whether bars touch hardware or a damper',
    explain: 'Restore the bars’ intended room to swing and inspect the suspension.',
    why: {
      'Move the mic much closer to catch the ring': 'The ring is lost at the source; distance cannot restore it.',
      'Add reverb to lengthen the ring of each bar': 'Reverb hides the cause; release the bars first.',
    },
  },
  {
    id: 'bc.s.clank',
    observation: 'A clank or buzz under the sweep',
    firstChecks: 'Is a bar, the mount, the clamp or the stand loose?',
    options: ['Stop and secure the loose part first', 'Cut the clank out with a narrow EQ notch', 'Gate the channel so the clank is hidden'],
    correct: 'Stop and secure the loose part first',
    explain: 'A mechanical fault is fixed mechanically: stop and secure it before any EQ.',
    why: {
      'Cut the clank out with a narrow EQ notch': 'The clank is in the source; EQ also changes the bars.',
      'Gate the channel so the clank is hidden': 'A gate would cut the tail too.',
    },
  },
  {
    id: 'bc.s.spill',
    observation: 'The spot mostly hears the cymbals',
    firstChecks: 'Is the chime-to-spill ratio too low?',
    options: ['Move the player and mic, or use the main pickup', 'Turn the chime spot up much louder in the mix', 'Ask the drummer to stop playing the cymbals'],
    correct: 'Move the player and mic, or use the main pickup',
    explain: 'Relocate the chimes and the mic away from louder cymbals, re-aim the pattern — or use the main pickup only.',
    why: {
      'Turn the chime spot up much louder in the mix': 'More gain raises the cymbals in that mic too.',
      'Ask the drummer to stop playing the cymbals': 'The music sets what is played; change the geometry.',
    },
  },
  tailSymptom(W),
  monoSymptom(W),
  contactSymptom(W, 'a swinging bar or the hand'),
];

const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point, measured from the middle of the row', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };

const setupTasks: SetupTask[] = [
  {
    id: 'bc.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A solo overdub: slow sweeps in both directions, a soft and a strong gesture, and the full decay, in a good room. Phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser about 50 cm from the middle of the row, facing its length, at the bars’ height', ok: true, power: 'phantom', feedback: 'A recommended starting point, clear of the swing; it needs the phantom this channel has.' },
      { id: 'b', label: 'Small condenser about 75 cm away, for a more blended row in the good room', ok: true, power: 'phantom', feedback: 'A wider view — check both sweep directions and the tail.' },
      { id: 'c', label: 'A mic level with the rail, close to one end', ok: false, power: 'phantom', feedback: 'It misses the bars below it and favours one end.' },
      { id: 'd', label: 'A gate to keep the room out between sweeps', ok: false, power: 'phantom', feedback: 'A gate would cut the shimmer’s tail.' },
      { id: 'e', label: 'Ask the player to sweep faster so the mic hears it better', ok: false, power: 'none', feedback: 'The sweep is the music; the mic is placed for it.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.both', label: 'Both sweep directions and the tail were checked', role: 'optional', feedback: 'A fair reason — and good practice.' }, BRAND_REASON, PLAYER_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point from the middle of the row, outside the swing and the hand, with the power the mic needs.',
  },
  {
    id: 'bc.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage: a percussionist plays bar chimes at a set station, monitors on stage. The spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'Small dynamic about 45 cm in front of the row, outside the swing, its back to the wedge', ok: true, power: 'none', feedback: 'A directional spot clear of the gesture; a dynamic needs no phantom.' },
      { id: 'b', label: 'Move the chimes away from the cymbals, and rely on the overheads', ok: true, power: 'none', feedback: 'Fair, if the overheads carry the sweep once the layout changes.' },
      { id: 'c', label: 'Small condenser in front of the row', ok: false, power: 'phantom', feedback: 'This input has no phantom, and a condenser needs it.' },
      { id: 'd', label: 'A mic in the swing, as close as the bars allow', ok: false, power: 'none', feedback: 'The bars swing after every strike — clearance comes first.' },
      { id: 'e', label: 'Ask the player to sweep harder so the chimes cut through', ok: false, power: 'none', feedback: 'A harder sweep changes the music; fix the balance instead.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.null', label: 'The pattern’s rejection is aimed at the loudest monitor', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, PLAYER_REASON],
    explain: 'Two setups pass. What passes is the reasoning: coverage of the whole row, outside the swing, powered by what this input can supply — or a better layout with the overheads.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: the hand sweeps from the long bars to the short. Which bars are still ringing at the end?', options: ['All the struck bars', 'Only the last bar', 'None of them'], after: 'Now STEP through the sweep (or PLAY ONCE), then try one bar’s shapes and lengths.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the mic from 40 cm to 80 cm. What changes most?', options: ['A more even row, more room', 'More attack, less room', 'Nothing'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge sits downstage, behind the mic. Can a cardioid’s null reach it?', options: ['Yes — its back can face the wedge', 'No — only an omni can', 'It is already at the side'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'Two mics at the two ends: which bar reaches both mics at the same time?', options: ['A bar in the middle', 'The longest bar', 'Every bar'], after: 'Flip B POLARITY both ways, then move a mic — and try each SOURCE along the row.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'bc.q.1',
    covers: 'instrument',
    prompt: 'What makes bar chimes different from wind chimes?',
    options: ['A straight row on one rail, swept by hand', 'They are made of wood rather than metal', 'They hang in a circle and move in the wind'],
    correct: 'A straight row on one rail, swept by hand',
    explain: 'A mark tree’s graduated bars hang in a straight row from one rail and are swept by the hand; wind chimes hang in a circle. A bell tree is nested bells.',
    why: {
      'They are made of wood rather than metal': 'Bar chimes are metal bars on a wooden rail.',
      'They hang in a circle and move in the wind': 'That describes wind chimes.',
    },
  },
  {
    id: 'bc.q.2',
    covers: 'instrument',
    prompt: 'How are bar chimes usually played?',
    options: ['By moving a hand through the bars in a sweep', 'By striking one bar at a time with a heavy mallet', 'By shaking the whole stand'],
    correct: 'By moving a hand through the bars in a sweep',
    explain: 'A fluid sweep through the bars, in one direction or both — sometimes a single bar with the hand or a striker.',
    why: {
      'By striking one bar at a time with a heavy mallet': 'Single strikes happen, with the hand or a light striker; the sweep is the usual gesture.',
      'By shaking the whole stand': 'Shaking would rattle the stand; the hand sweeps the bars.',
    },
  },
  {
    id: 'bc.q.3',
    covers: 'sound',
    prompt: 'Why do the short bars sound higher?',
    options: ['A bar’s pitch rises with 1 ÷ length²', 'They are made of a lighter metal', 'They are hung on shorter filaments'],
    correct: 'A bar’s pitch rises with 1 ÷ length²',
    explain: 'For bars of one thickness and metal, half the length gives four times the pitch.',
    why: {
      'They are made of a lighter metal': 'The row is usually one metal; the length sets the pitch.',
      'They are hung on shorter filaments': 'The filament only holds the bar; the bar’s length sets its pitch.',
    },
  },
  {
    id: 'bc.q.4',
    covers: 'sound',
    prompt: 'A mic sits near the long end of the row. What does a rising sweep sound like?',
    options: ['Loud at the start, fading toward the end', 'Even from the first bar to the last', 'Silent until the last bars ring'],
    correct: 'Loud at the start, fading toward the end',
    explain: 'Nearer bars are louder at the mic: a mic at one end favours that end.',
    why: {
      'Even from the first bar to the last': 'The far bars are farther from the mic, so they drop away.',
      'Silent until the last bars ring': 'The near bars are the loudest at that mic.',
    },
  },
  {
    id: 'bc.q.5',
    covers: 'setting',
    critical: true,
    prompt: 'Placing a mic near bar chimes, what comes first?',
    options: ['The swing of struck bars and the hand’s path', 'The exact distance the starting point gives', 'The shortest cable run back to the stage box'],
    correct: 'The swing of struck bars and the hand’s path',
    explain: 'Struck bars swing; the hand sweeps through and past them. Keep the mic, stand and cable outside both, with a margin.',
    why: {
      'The exact distance the starting point gives': 'The numbers are starting points; clearance comes first.',
      'The shortest cable run back to the stage box': 'A tidy cable matters, but never before the instrument’s and player’s space.',
    },
  },
  quickHearing(W),
];

export const I06C_LESSON: Lesson = {
  id: 'I06c',
  labId: 'percussion',
  title: 'Bar Chimes',
  subtitle: 'A row of graduated bars swept by hand — the whole sweep and its tail',
  noun: { one: 'bar chime', many: 'bar chimes' },
  model: BC_MODEL,
  micTypeIds: ['sdcCard', 'smallDynCard'],
  zones: BC_ZONES,
  setupPairs: [{ label: 'A mic beyond each end of the row', A: { zone: 'bc.endL', typeId: 'sdcCard' }, B: { zone: 'bc.endR', typeId: 'sdcCard' } }],
  pages,
  scenarios,
  symptoms,
  orderTasks: [setupOrder(W, { text: 'Watch the whole sweep with the player: direction, bars, speed, damping', early: 'Start with the player and the gesture.' })],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT THEY ARE', text: 'Graduated metal bars, each hung on its own filament from a wooden rail, in a straight row — a mark tree. Not wind chimes (hung in a circle) and not a bell tree (nested bells). The metal bars themselves ring.', src: 'PAS-ECV02' },
    { title: 'WHERE YOU MEET THEM', text: 'On percussion stations in bands and orchestras, in the studio and on stage — a shimmering run into a new section, or a single sparkling accent. (Whole percussion sections come later, in Lab 5.)', src: 'LESSON-BC' },
    { title: 'WHAT THEY DO IN THE MUSIC', text: 'A sweep up or down the row — a run of attacks with overlapping rings — single bar accents, repeated sweeps, and stopped flourishes when the player or a damper ends them.', src: 'PAS-ECV02' },
    { title: 'THEIR SIZE', text: 'A rail about 30–40 cm (12–16 in) long. Models differ: one has 27 bars in a single row, another 60 in two rows. This lab draws a 38 cm rail with 27 bars; the bars’ own sizes are a drawing choice.', src: 'MEINL-CH27' },
  ],
  sound: {
    stages: [
      { title: 'The hand enters', text: 'The hand meets the first bar at the long end of the row.' },
      { title: 'One bar after another', text: 'The hand strikes the bars in turn: a run of brief ATTACKS. Each struck bar swings away on its filament — drawn larger than life.' },
      { title: 'They ring on, overlapping', text: 'Every struck bar keeps ringing and swinging after the hand has passed; the rings overlap — the shimmer. Each bar is a bar held at neither end, its pitch set by its length.' },
      { title: 'Sound along the row', text: 'Sound leaves all along the row, until the bars fade or the player or a damper stops them. A mic near one end hears that end louder.' },
    ],
    attack: 'The run of brief strikes as the hand passes each bar. A close mic, or one aimed at part of the row, tends to hear more of the strikes near it; a faster or stronger sweep changes them before the mic does.',
    body: 'The overlapping rings after the sweep: every struck bar ringing on, the long ones lower, the short ones higher, until they fade or are damped. A mic facing the row’s whole length hears the run evenly. Tendencies — rows and players vary.',
    head: { diameterMm: 10, rods: 0, label: 'one chime bar', strikeSrc: 'PAS-ECV02' },
  },
  setting: {
    items: [
      { id: 'row', label: 'the bar chimes on their stand', short: 'CHIMES', note: 'A rail on a stand at about chest height, the bars hanging below it, the player behind. The row runs across the player — the long bars on their left here.', prov: { kind: 'illustrative', reason: 'a typical station: positions are a drawing default' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'player', label: 'the player and the sweeping hand', short: 'PLAYER', note: 'The hand sweeps through and past the bars in both directions; struck bars swing. That whole space is the player’s: no mic, stand or cable in it.', prov: { kind: 'illustrative', reason: 'a standing player: a drawing default' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'wedge', label: 'a floor wedge downstage', short: 'WEDGE', note: 'Live, a floor monitor on the audience side, facing back toward the player — behind a mic that faces the row, where a pattern’s null can help.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'band', label: 'the cymbals and louder players', short: 'CYMBALS · BAND', note: 'Louder cymbals and amplifiers nearby swamp a chime spot: place the chimes away from them where you can.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'stage' },
      { id: 'audience', label: 'the audience and the PA', short: 'AUDIENCE · PA', note: 'Listen from here first, without amplification. The mic usually comes from this side.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'MIC SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a good room a wider view can integrate the sweep and the decay; record each direction and the whole tail.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: a shared percussion mic or the overheads may cover a quiet sweep; on a loud stage, a directional spot outside the swing, its null toward the loudest wedge — and the chimes away from louder cymbals.',
    studio: 'STUDIO: the same stand and hand or striker as the take, sweeps in both directions and the full decay; compare a moderately close mono position with a wider one. A stereo pair is optional.',
  },
  diagnostic,
  practice: {
    task: 'Capture the whole gesture and its tail, tell source and mount faults from mic placement, keep safe clearance, and justify main versus spot coverage for studio and stage. With a player’s agreement, log what you tried below.',
    fields: [
      { id: 'inst', label: 'The instrument (rows, bars, mounting, damper)', kind: 'text' },
      { id: 'played', label: 'The gesture', kind: 'choice', choices: ['sweep up', 'sweep down', 'both', 'single bars'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser', 'small dynamic', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'peak', label: 'Headroom on the strongest strike and the densest sweep', kind: 'text' },
      { id: 'notes', label: 'What you heard: first and last bars, tail, clanks (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'Every bar size — lengths 300 → 60 mm, Ø 10 mm, the 15 mm filaments — and the rail’s section (40 × 30 mm) are drawing defaults: no source gives them.', dims: ['longest', 'shortest', 'barD', 'filament', 'railDepth', 'railH'] },
    { text: 'The rail’s height on its stand (1350 mm) and the bars’ swing (±20°) are drawing defaults; the stand beside the short end is a drawing choice.', dims: ['height', 'swingDeg'] },
    { text: 'The rail’s 38 cm length reads a teaching source’s “12–16 in” as the rail’s length — an interpretation. The 40–80 cm range and the end-mic pair are the lesson’s own trials.', dims: [] },
  ],
  live: {
    wedges: [
      { id: 'wedge', label: 'a floor wedge downstage, facing back toward the player', short: 'WEDGE', p: { x: 1600, y: 0, z: 350 }, lift: 150, faces: { x: -1, y: 0, z: -0.2 }, note: 'On the audience side, behind a mic that faces the row — the case a pattern’s null can help with.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
      { id: 'side', label: 'a side-fill monitor across the stage', short: 'SIDE FILL', p: { x: 300, y: 0, z: 1700 }, lift: 150, faces: { x: 0, y: 0, z: -1 }, note: 'Off to the player’s right, roughly beside the mic’s front: no pattern’s null reaches it. Distance and level do the work.', prov: { kind: 'illustrative', reason: 'a typical stage layout' } },
    ],
  },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. There is no single agreed bar-chime miking standard: these starting points come from how microphones behave and a general 30 cm floor for percussion, and every row, mount, player and room is different. Move the mic, experiment, and trust your ears. The lab is silent and draws a simplified picture: one 27-bar row with drawn bar sizes, a bar held at neither end for its shapes, motion drawn larger, mic patterns as textbook shapes. Distances are rounded to about 5 mm and measured to the mic’s front. Keep clear of the swing and the hand.',
  copy: { words: metalWords('bar chimes', 'player') },
};
