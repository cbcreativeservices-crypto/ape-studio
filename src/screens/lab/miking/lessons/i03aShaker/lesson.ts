/**
 * I03a HANDHELD SHAKER — the lesson's pages as DATA (blueprint §7). Words from
 * the owner's lesson (docs/labs/miking/source_text/Shaker-Miking-Technique-
 * Research.txt, "L<n>" in COMMENTS only) with the fixes in CORRECTIONS_LOG.md
 * (SH-xx) applied. The egg shaker (I03b) and maracas (I03c) are their own
 * lessons on the same small-percussion family. OWNER RULING 2026-10-04:
 * starting points; no source, brand or model in learner text; no badges;
 * FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, PageContent, PageId, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, cardioidNull, CLEAR_REASON, contactSymptom, feedbackSymptom, firstNotch, gainCheck, hearingCheck, louderIsNotBetter, moveRemovesDelay, noPhantom, PEAK_REASON, polarityKeepsDelay, POWER_REASON, quickHearing, setupOrder, slowMeter, TECH_REASON, type SpWords } from '../shared/smallperc/commonItems.ts';
import type { SpLesson } from '../shared/smallperc/family.ts';
import { SHK_MODEL } from './geometry.ts';
import { SHK_ZONES } from './model.ts';
import { SHK_COPY } from './copy.ts';

const W: SpWords = { p: 'shk', the: 'the shaker', a: 'a shaker', noun: 'shaker', player: 'player', loudest: 'the biggest accent' };

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the handheld shaker',
    goal: 'Get to know the handheld shaker — what it is, where you meet it, what it does in the music and how it is played — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A closed shell with loose fill inside, moved by the player’s hand. It is a moving source: a mic hears the instrument AND its changing distance on every stroke.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a stroke becomes sound — the fill lagging, landing, sliding — and where the sound leaves. Shown, never played.',
    credit: { scenarios: ['shk.snd.1', 'shk.snd.2', 'shk.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The fill lags the shell, lands on the end when the stroke turns — the accent — and slides along the wall in between — the wash. The whole shell radiates; the player’s stroke sets the balance.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the shaker player stands — the station, the neighbours, what a stage and a studio add — and what to do before any mic.',
    credit: { scenarios: ['shk.set.1', 'shk.set.hear', 'shk.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Watch the whole part and the whole arc; choose the shaker before the mic; place for the player’s comfortable motion. Protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the shaker by its properties — pattern, power, size and how it handles brief peaks — not by its brand.',
    credit: { scenarios: ['shk.mic.1', 'shk.mic.peak', 'shk.mic.power', 'shk.mic.omni', 'shk.rec.1'], note: 'Answer the five checks (one reaches back to how the shaker sounds).' },
    takeaway: 'Small and large condensers and dynamics can all work; the pattern, the position and the real stage matter more than a type’s reputation. Watch peaks, not averages.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — about 30–60 cm from the middle of the playing area, outside the whole motion — then change height and angle, and the direction of the shake, and see what changes.',
    credit: { scenarios: ['shk.place.1', 'shk.place.2', 'shk.place.3', 'shk.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'One mic outside the whole arc, about 30–60 cm from the middle of the playing area, is the place to begin. A shake toward the mic makes each forward stroke jump; side to side tends to stay steadier — if the player chooses it.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s real rejection faces a loud unwanted source — and know when a shared mic already carries the shaker.',
    credit: { scenarios: ['shk.ctx.1', 'shk.ctx.2', 'shk.ctx.studio', 'shk.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the downstage wedge sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Aim nulls by the real pattern. A dedicated directional mic can serve a whole station; a shared overhead also hears the stage. Never solve feedback with more gain.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See how the arrival-time difference between two mics places comb-filter notches — and what polarity does and does not change.',
    credit: { scenarios: ['shk.two.1', 'shk.two.2', 'shk.two.3', 'shk.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Polarity flips the sign; it does not remove a delay — and a moving shaker changes the delay with every stroke. One mono spot is usually enough.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — the stroke’s path toward the mic, the shaker itself, distance, spill and the monitors — before reaching for gain or EQ.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second mic.',
    credit: { scenarios: ['shk.prac.order', 'shk.prac.gain', 'shk.prac.setup1', 'shk.prac.setup2', 'shk.prac.3', 'shk.mix.1', 'shk.mix.2', 'shk.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'A source-first decision, one safe mic for the whole motion, studio and stage priorities told apart, and one problem fixed by the instrument, the player’s spot or the mic — before more gain. More than one setup can pass.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L7-L9 · set L8-L11, L46 · mic L49-L53 ·
 * place L12-L24 · ctx L35-L44 · two L21, L41 · prac L55-L60. */
const scenarios: MikingScenario[] = [
  {
    id: 'shk.snd.1',
    page: 'sound',
    prompt: 'Where in a stroke does a shaker’s accent mostly start?',
    options: ['When the stroke turns back and the fill lands on the end', 'At the start of a stroke, when the hand first moves the shell', 'In the middle of a stroke, when the shell is moving fastest'],
    correct: 'When the stroke turns back and the fill lands on the end',
    explain: 'The loose fill lags the shell. When the shell stops and turns, the fill keeps going and lands on the end cap: that impact is the accent.',
    why: {
      'At the start of a stroke, when the hand first moves the shell': 'At the start the fill lags behind — it has not hit anything yet.',
      'In the middle of a stroke, when the shell is moving fastest': 'Mid-stroke the fill is in flight or sliding: that is the wash, not the accent.',
    },
  },
  {
    id: 'shk.snd.2',
    page: 'sound',
    prompt: 'The player rounds off each stroke instead of snapping it. What tends to change?',
    options: ['Less slamming on the ends, more sliding along the wall', 'The same accent, only quieter in level at the shell', 'The pitch of the shaker rises because the fill slows down'],
    correct: 'Less slamming on the ends, more sliding along the wall',
    explain: 'A gentle turn lets the fill roll and slide instead of slamming the cap: fewer sharp impacts, a softer, more continuous wash.',
    why: {
      'The same accent, only quieter in level at the shell': 'The balance changes, not just the level: the fill slides more and slams less.',
      'The pitch of the shaker rises because the fill slows down': 'A shaker’s sound is many small impacts and rubs; the stroke changes their balance, not a pitch.',
    },
  },
  {
    id: 'shk.snd.3',
    page: 'sound',
    prompt: 'A shaker sounds too harsh for a quiet song. What is usually worth trying first?',
    options: ['A softer shaker or a gentler touch, before any mic change', 'A brighter mic placed a little closer to the shaker', 'Treble cut on the desk, with the same shaker and stroke'],
    correct: 'A softer shaker or a gentler touch, before any mic change',
    explain: 'The fill, shell and stroke make the sound — shakers come in different sizes and sounds for this. A mic or EQ cannot change how the instrument is played.',
    why: {
      'A brighter mic placed a little closer to the shaker': 'Closer and brighter usually makes harshness stronger, not gentler.',
      'Treble cut on the desk, with the same shaker and stroke': 'EQ can soften it a little, but the instrument and the touch change the sound at its source.',
    },
  },
  {
    id: 'shk.set.1',
    page: 'setting',
    prompt: 'Before you place a shaker mic, what do you ask the player to show you?',
    options: ['The whole part, quietest to loudest, and its whole arc', 'One clean stroke, so the level can be set from it', 'Nothing yet: put the mic up, then adjust the player'],
    correct: 'The whole part, quietest to loudest, and its whole arc',
    explain: 'The biggest accent and the widest stroke decide where a mic can go — and the music, not the mic, sets them.',
    why: {
      'One clean stroke, so the level can be set from it': 'A single stroke hides the biggest accent and the widest arc — and gain needs the loudest moment.',
      'Nothing yet: put the mic up, then adjust the player': 'Never adjust the player to fit a mic; place the mic for the player’s motion.',
    },
  },
  hearingCheck(W),
  {
    id: 'shk.set.2',
    page: 'setting',
    prompt: 'A close mic would work if the player kept their wrist still. Is that a fair request?',
    options: ['No — place the mic for their comfortable motion instead', 'Yes — a still wrist is a fair price for a cleaner pickup', 'Yes, for the soundcheck only, then they can play normally'],
    correct: 'No — place the mic for their comfortable motion instead',
    explain: 'Have the musician play comfortably; never require an unnatural, stationary wrist to make a close mic work. Move the mic, or use a less restrictive pickup.',
    why: {
      'Yes — a still wrist is a fair price for a cleaner pickup': 'The player’s motion is the music. A cleaner pickup that changes the playing is not a better recording.',
      'Yes, for the soundcheck only, then they can play normally': 'A soundcheck that does not match the show sets the wrong position and the wrong gain.',
    },
  },
  {
    id: 'shk.mic.1',
    page: 'microphone',
    prompt: 'Small condenser or robust dynamic for a shaker spot — which is right?',
    options: ['Either can work: choose for the room, the stage and the sound', 'The condenser, because shakers need detail more than anything', 'The dynamic, because condensers break on percussion peaks'],
    correct: 'Either can work: choose for the room, the stage and the sound',
    explain: 'A small condenser tends to show fine detail; a robust dynamic can make sense on a crowded stage. Neither is a rule — compare by ear.',
    why: {
      'The condenser, because shakers need detail more than anything': 'Detail helps in a quiet room; on a loud stage, rejection and robustness may matter more.',
      'The dynamic, because condensers break on percussion peaks': 'Check a condenser’s maximum level, but many handle percussion well. It is a choice, not a rule.',
    },
  },
  slowMeter(W),
  noPhantom(W),
  {
    id: 'shk.mic.omni',
    page: 'microphone',
    prompt: 'When could an omni be a reasonable choice for a shaker spot?',
    options: ['A quiet, good-sounding room where isolation matters little', 'A loud stage, so that the moving shaker is heard from all sides', 'Not on percussion, because an omni has no front to aim'],
    correct: 'A quiet, good-sounding room where isolation matters little',
    explain: 'An omni gives a broad pickup and an even off-axis tone — and hears the room and every loudspeaker equally. On a loud stage that usually means spill and feedback.',
    why: {
      'A loud stage, so that the moving shaker is heard from all sides': 'An omni hears the monitors and the band from all sides too: on a loud stage it usually feeds back sooner.',
      'Not on percussion, because an omni has no front to aim': 'Too strong: in a quiet, good room an omni can sound natural and even.',
    },
  },
  {
    id: 'shk.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic very close to a moving shaker. What becomes more noticeable?',
    options: ['Level jumps and tone changes as the shaker moves', 'The room around the player, because the mic is closer', 'Nothing: very close pickup is the steadiest of all'],
    correct: 'Level jumps and tone changes as the shaker moves',
    explain: 'Very close, every stroke changes the distance and the angle by a large share: level jumps and off-axis changes become more conspicuous.',
    why: {
      'The room around the player, because the mic is closer': 'Closer means less room, not more — the shaker dominates.',
      'Nothing: very close pickup is the steadiest of all': 'Close to a moving source, small movements are a big share of the distance: it gets less steady.',
    },
  },
  {
    id: 'shk.place.1',
    page: 'placement',
    prompt: 'A starting point says about 30–60 cm. What is it measured from?',
    options: ['The middle of the playing area — where most strokes happen', 'The nearest point the shaker reaches on its biggest stroke', 'The player’s chest, wherever the shaker happens to be'],
    correct: 'The middle of the playing area — where most strokes happen',
    explain: 'The distance belongs to the player’s usual centre, not the closest instant. The mic must still stay outside the whole arc — the number is not a safety clearance.',
    why: {
      'The nearest point the shaker reaches on its biggest stroke': 'That point sets the clearance, not the starting distance — the readout shows it separately.',
      'The player’s chest, wherever the shaker happens to be': 'The shaker sits in front of the chest; measure from where it is played.',
    },
  },
  {
    id: 'shk.place.2',
    page: 'placement',
    prompt: 'One stroke in every pair is much louder. What is the likely physical cause?',
    options: ['The shaker travels much closer to the mic on that stroke', 'The fill wears down after a few strokes and goes quiet', 'The mic’s pattern changing from one stroke to the next'],
    correct: 'The shaker travels much closer to the mic on that stroke',
    explain: 'Shaken toward and away, the forward stroke comes closer. Centre or widen the working area, move the mic back a little — or try side to side if the player chooses it.',
    why: {
      'The fill wears down after a few strokes and goes quiet': 'The fill does not wear out in a phrase; the distance to the mic is changing.',
      'The mic’s pattern changing from one stroke to the next': 'A mic’s pattern is fixed; the instrument’s position is what changes.',
    },
  },
  {
    id: 'shk.place.3',
    page: 'placement',
    prompt: 'Too many sharp clicks: what do you try before reaching for EQ?',
    options: ['A slightly farther spot, or a different shaker or fill', 'Closer still, so the clicks are cleaner and more defined', 'A brighter mic, so the clicks blend into the wash'],
    correct: 'A slightly farther spot, or a different shaker or fill',
    explain: 'Is it the instrument or very close pickup? Audition a different output or a slightly more distant position; EQ will not change the playing texture.',
    why: {
      'Closer still, so the clicks are cleaner and more defined': 'Closer usually makes single clicks dominate more.',
      'A brighter mic, so the clicks blend into the wash': 'A brighter mic tends to make the clicks stand out more, not blend.',
    },
  },
  {
    id: 'shk.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Your stand clears the shaker at rest. Is that enough?',
    options: ['No — it must clear the whole arc, the arm and the face', 'Yes — a shaker is small, so a spot clear at rest is enough', 'Yes, provided the cable is taped down to the floor'],
    correct: 'No — it must clear the whole arc, the arm and the face',
    explain: 'The rest position says little: strokes, accents and turns sweep a much bigger space. Check the whole motion with the player.',
    why: {
      'Yes — a shaker is small, so a spot clear at rest is enough': 'Small instrument, big motion: the arm and the stroke sweep far more space.',
      'Yes, provided the cable is taped down to the floor': 'A taped cable is good practice, but the stand must still clear the whole motion.',
    },
  },
  {
    id: 'shk.ctx.1',
    page: 'context',
    prompt: 'A loud stage: the percussionist plays shakers and tambourine at one station. A common approach?',
    options: ['One dedicated directional mic for the station', 'A separate close mic on each small instrument they hold', 'The drum overheads alone, turned up for the shakers'],
    correct: 'One dedicated directional mic for the station',
    explain: 'One directional station mic is a real touring approach — fewer open mics, less spill. Overheads alone also hear the cymbals and the monitors.',
    why: {
      'A separate close mic on each small instrument they hold': 'Each open mic adds spill and feedback risk; one station mic often covers them.',
      'The drum overheads alone, turned up for the shakers': 'Turning overheads up raises the cymbals and the monitors with the shaker.',
    },
  },
  {
    id: 'shk.ctx.2',
    page: 'context',
    prompt: 'Your spot is a supercardioid. Where do you put the wedge to use its rejection?',
    options: ['Off to the side of the rear, where its null points', 'Directly behind it, exactly as you would for a cardioid', 'In front of it, because supercardioids reject the front'],
    correct: 'Off to the side of the rear, where its null points',
    explain: 'A supercardioid has a small rear lobe; its deepest rejection lies off to each side of the rear. Place the wedge by the real pattern — and check by ear.',
    why: {
      'Directly behind it, exactly as you would for a cardioid': 'Straight behind sits in a supercardioid’s rear lobe — it hears some of the wedge there.',
      'In front of it, because supercardioids reject the front': 'The front is where every directional mic hears best.',
    },
  },
  {
    id: 'shk.ctx.studio',
    page: 'context',
    prompt: 'An ensemble recording in one room. When does the shaker earn its own spot?',
    options: ['When its pulse needs independent control the main mics miss', 'As a habit, so that it can be turned up in the mix later on', 'When the shaker is the loudest thing heard in the room'],
    correct: 'When its pulse needs independent control the main mics miss',
    explain: 'Let the main or percussion mic set the balance; add a spot only if the pulse needs its own control — and check the two together in mono.',
    why: {
      'As a habit, so that it can be turned up in the mix later on': 'A spot that is not needed adds spill and a second arrival of the same sound.',
      'When the shaker is the loudest thing heard in the room': 'Loudness is not the test; what the main mics miss is.',
    },
  },
  {
    id: 'shk.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · The player switches from side-to-side to toward-and-away. What does a fixed mic in front hear change?',
    options: ['The forward strokes jump in level as they come closer', 'Nothing: the same shaker makes the same sound at the mic', 'The wash disappears and only the accents are left over'],
    correct: 'The forward strokes jump in level as they come closer',
    explain: 'Toward and away, each forward stroke comes closer to the mic: the accents read louder. Side to side keeps the distance steadier.',
    why: {
      'Nothing: the same shaker makes the same sound at the mic': 'The sound at the source may match, but the distance to the mic changes on every stroke.',
      'The wash disappears and only the accents are left over': 'The fill still slides; what changes is the distance — and so the level.',
    },
  },
  polarityKeepsDelay(W),
  firstNotch(W),
  {
    id: 'shk.two.3',
    page: 'twoMic',
    prompt: 'A spot and the main mic both hear the shaker. What do you check?',
    options: ['Both together in mono, at the intended levels', 'Only the spot, soloed, at a comfortably high level', 'Only the main mic, since it hears the whole band'],
    correct: 'Both together in mono, at the intended levels',
    explain: 'The two hear the shaker at different times. Compare them together in mono; move, re-aim or rebalance before reaching for polarity — or decide the spot is not needed.',
    why: {
      'Only the spot, soloed, at a comfortably high level': 'Soloed, the spot hides how it combines with the main mic.',
      'Only the main mic, since it hears the whole band': 'The combination is the question: check both together.',
    },
  },
  louderIsNotBetter(W),
  gainCheck(W),
  {
    id: 'shk.prac.3',
    page: 'practice',
    prompt: 'What would justify a second mic on one shaker player?',
    options: ['A room or stereo picture the arrangement really asks for', 'Two mics are the usual standard for a single shaker', 'The shaker needs more level than one mic can give it'],
    correct: 'A room or stereo picture the arrangement really asks for',
    explain: 'One mono spot is usually enough. A room mic or a stereo pair earns its place only for an explicit artistic goal — and is checked in mono with the spot.',
    why: {
      'Two mics are the usual standard for a single shaker': 'One mic for one player is the usual start; a second has to earn its place.',
      'The shaker needs more level than one mic can give it': 'Level comes from gain and the fader — or a louder shaker — not from another mic.',
    },
  },
  {
    id: 'shk.mix.1',
    page: 'practice',
    prompt: 'A starting point says “about 30–60 cm”. What else do you need before placing the mic?',
    options: ['Where the shaker actually moves, and where to aim', 'The shaker’s brand, so the number fits its size', 'Nothing more: the number already says where it goes'],
    correct: 'Where the shaker actually moves, and where to aim',
    explain: 'The distance is from the middle of the playing area; the mic must clear the whole motion, and its aim sets the balance.',
    why: {
      'The shaker’s brand, so the number fits its size': 'The brand does not change the reference or the motion.',
      'Nothing more: the number already says where it goes': 'A distance means nothing without the motion and the aim.',
    },
  },
  cardioidNull(W),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  {
    id: 'shk.s.loud',
    observation: 'One stroke is much louder than the others',
    firstChecks: 'Does the shaker travel much closer to the mic on that stroke?',
    options: ['Whether the shaker comes much closer on that stroke', 'The cable, because level jumps are usually electrical', 'A compressor setting, before looking at the player'],
    correct: 'Whether the shaker comes much closer on that stroke',
    explain: 'Centre or widen the working area; move the mic back slightly; rehearse the actual pattern.',
    why: {
      'The cable, because level jumps are usually electrical': 'Watch the player first: a stroke toward the mic is the common cause.',
      'A compressor setting, before looking at the player': 'Processing hides a placement problem; find the physical cause first.',
    },
  },
  {
    id: 'shk.s.clicks',
    observation: 'Too many sharp clicks',
    firstChecks: 'Is it the chosen instrument, or very close pickup?',
    options: ['The instrument itself, or a mic placed very close', 'Turn the treble down until the clicks are gone', 'Ask the player to shake harder so the wash covers them'],
    correct: 'The instrument itself, or a mic placed very close',
    explain: 'Audition a different fill or output, or a slightly more distant position — EQ will not change the playing texture.',
    why: {
      'Turn the treble down until the clicks are gone': 'EQ dulls everything; the instrument or the distance is the cause.',
      'Ask the player to shake harder so the wash covers them': 'Harder strokes usually make the clicks stronger, not covered.',
    },
  },
  {
    id: 'shk.s.offbeat',
    observation: 'The offbeats sound dull or go missing',
    firstChecks: 'Does the shaker leave the mic’s main pickup area on those strokes?',
    options: ['Whether the shaker leaves the mic’s main pickup area', 'Boost the treble on the offbeats with dynamic EQ', 'Ask the player to accent the offbeats harder'],
    correct: 'Whether the shaker leaves the mic’s main pickup area',
    explain: 'Re-aim for the whole arc, use a broader pickup — or change the player’s spot only if it is comfortable for them.',
    why: {
      'Boost the treble on the offbeats with dynamic EQ': 'Processing cannot bring back what the mic did not hear; aim first.',
      'Ask the player to accent the offbeats harder': 'The music sets the accents; place the mic for the motion.',
    },
  },
  {
    id: 'shk.s.spill',
    observation: 'Cymbals or monitors dominate the shaker channel',
    firstChecks: 'Compare solo and full-band bleed; check the mic’s pattern against the loudest neighbour.',
    options: ['The bleed in the full band, and the pattern’s aim', 'Gate the channel so it opens only on the shaker', 'Turn the shaker channel up until it wins'],
    correct: 'The bleed in the full band, and the pattern’s aim',
    explain: 'Move the mic or the player, aim a null at the loudest unwanted source — or use a dedicated spot instead of a broad overhead.',
    why: {
      'Gate the channel so it opens only on the shaker': 'A shaker plays constantly: a gate would chop it — and the bleed comes in with it anyway.',
      'Turn the shaker channel up until it wins': 'Raising the channel raises the cymbals and monitors with it.',
    },
  },
  feedbackSymptom(W),
  {
    id: 'shk.s.thump',
    observation: 'Low thumps or rattles in the shaker channel',
    firstChecks: 'Is the stand or cable being struck, or is vibration travelling up the stand?',
    options: ['Whether the stand or cable is struck, or vibrating', 'A high-pass filter set high, whatever it takes away', 'The fill inside the shaker breaking up'],
    correct: 'Whether the stand or cable is struck, or vibrating',
    explain: 'Clear and secure the path, isolate stand vibration — and use a high-pass filter only if the useful body is kept.',
    why: {
      'A high-pass filter set high, whatever it takes away': 'A filter can help, but only after the physical cause — and never at the cost of the sound.',
      'The fill inside the shaker breaking up': 'A shaker’s fill does not thump; something is touching or shaking the mic.',
    },
  },
  contactSymptom(W),
];

const setupTasks: SetupTask[] = [
  {
    id: 'shk.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A quiet studio overdub: one player, one shaker, a pleasant room. The producer wants a clear, natural pulse. Phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser about 40 cm in front of the playing area, facing it', ok: true, power: 'phantom', feedback: 'The recommended start: outside the arc, facing where most strokes happen; it needs the phantom this channel has.' },
      { id: 'b', label: 'Small condenser about 50 cm away, a little higher, angled down into the arc', ok: true, power: 'phantom', feedback: 'Also a fair start: a different balance of rattle, hand noise and room — compare by ear.' },
      { id: 'c', label: 'A mic 10 cm from the shaker, where the forward stroke ends', ok: false, power: 'phantom', feedback: 'That is inside the motion: the shaker or the hand would reach it — and every stroke would jump in level.' },
      { id: 'd', label: 'Ask the player to hold the shaker still and roll the fill', ok: false, power: 'none', feedback: 'The player’s motion is never changed to suit a mic.' },
      { id: 'e', label: 'Two close mics, one on each end of the shaker', ok: false, power: 'phantom', feedback: 'One mono spot is usually enough; two close mics on a moving source add a changing delay between them.' },
    ],
    reasons: [{ id: 'r.doc', label: 'It is a recommended starting point, about 30–60 cm from the middle of the playing area', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' }, CLEAR_REASON, POWER_REASON, PEAK_REASON, BRAND_REASON, TECH_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point from the middle of the playing area, outside the whole motion, power that matches the mic.',
  },
  {
    id: 'shk.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud live show: the percussionist plays shakers and a tambourine at one station, with monitors on stage. The spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'One small dynamic for the station, aimed at the playing area, a null toward the wedge', ok: true, power: 'none', feedback: 'One directional station mic; a dynamic needs no phantom. Check spill and feedback with the operator.' },
      { id: 'b', label: 'A small dynamic about 30 cm in front of the shaker’s playing area', ok: true, power: 'none', feedback: 'A fair start for the shaker; a dynamic needs no phantom. Check the tambourine is covered too.' },
      { id: 'c', label: 'A small condenser in front of the station', ok: false, power: 'phantom', feedback: 'This input has no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'An omni in the middle of the station, to catch everything', ok: false, power: 'none', feedback: 'On a loud stage an omni hears every monitor and the band — spill and early feedback.' },
      { id: 'e', label: 'The drum overheads only, turned up for the shakers', ok: false, power: 'none', feedback: 'Turning the overheads up raises the cymbals and monitors with the shaker.' },
    ],
    reasons: [{ id: 'r.doc', label: 'It covers the real station and the player’s motion', role: 'required', feedback: 'Say what it covers — the whole station and the motion, not one instrument at rest.' }, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'One directional mic keeps spill and open channels down', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, TECH_REASON],
    explain: 'Two setups pass. What passes is the reasoning: coverage of the real station and motion, outside every swing, and powered by what this input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: the hand moves the shaker one way. What does the fill inside do at first?', options: ['It lags behind, then catches up', 'It moves exactly with the shell', 'It stays stuck to one end'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch the fill.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: the player switches from side to side to toward and away from the mic. What changes at the mic?', options: ['The forward strokes jump in level', 'Nothing much', 'It depends on this shaker'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge sits behind the mic and off to one side. Can a cardioid’s null reach it?', options: ['Yes — with a tilt of the mic', 'No — only a tighter pattern’s null can', 'It is already in the null'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'shk.q.1',
    covers: 'instrument',
    prompt: 'Why is a handheld shaker called a moving source for a mic?',
    options: ['The mic hears the instrument and its changing distance', 'Its fill keeps moving long after the player has stopped', 'Its sound travels faster than the sound of a fixed drum'],
    correct: 'The mic hears the instrument and its changing distance',
    explain: 'The player moves the shaker on every stroke, so the distance and angle to a fixed mic change with it.',
    why: {
      'Its fill keeps moving long after the player has stopped': 'The fill settles quickly; the point is that the whole instrument moves while it plays.',
      'Its sound travels faster than the sound of a fixed drum': 'Sound travels at the same speed from every source; the source itself is moving.',
    },
  },
  {
    id: 'shk.q.2',
    covers: 'instrument',
    prompt: 'A shaker is an idiophone. What does that mean here?',
    options: ['The fill and shell sound themselves — there is no drumhead', 'It has a small drumhead inside the shell that the fill strikes', 'It needs a pickup or a speaker before it can make a sound'],
    correct: 'The fill and shell sound themselves — there is no drumhead',
    explain: 'The rattling fill and the shell supply the sound directly; nothing is stretched like a drumhead.',
    why: {
      'It has a small drumhead inside the shell that the fill strikes': 'There is no stretched membrane in a shaker: the shell itself sounds.',
      'It needs a pickup or a speaker before it can make a sound': 'It is acoustic: a mic is only needed to send it to a desk or recorder.',
    },
  },
  {
    id: 'shk.q.3',
    covers: 'sound',
    prompt: 'Where does most of a shaker’s accent start?',
    options: ['The fill landing on the end when the stroke turns', 'The hand gripping the shell harder at the start', 'The air rushing out through holes in the shell'],
    correct: 'The fill landing on the end when the stroke turns',
    explain: 'The fill lags the shell and lands on the end cap when the stroke reverses: that impact is the accent.',
    why: {
      'The hand gripping the shell harder at the start': 'The grip can damp the shell, but the accent comes from the fill’s impact.',
      'The air rushing out through holes in the shell': 'A closed shaker has no air path; the impacts on the shell make the sound.',
    },
  },
  {
    id: 'shk.q.4',
    covers: 'sound',
    prompt: 'A shaker swings toward a fixed mic on one stroke and away on the next. What happens?',
    options: ['The level jumps between strokes', 'Nothing — the mic hears the same', 'The pitch of the shaker changes'],
    correct: 'The level jumps between strokes',
    explain: 'Nearer means louder at the mic; a shaker moving toward and away makes alternate strokes jump in level.',
    why: {
      'Nothing — the mic hears the same': 'Distance changes level; a moving shaker changes it every stroke.',
      'The pitch of the shaker changes': 'The distance changes the level, not a pitch.',
    },
  },
  {
    id: 'shk.q.5',
    covers: 'setting',
    prompt: 'The player moves between shakers and other instruments at one station. What does that mean for a mic?',
    options: ['Place for the real station, or choose a wider pickup', 'Ask the player to stay at one spot, just for the mic', 'Clip a mic to the shaker so it follows the player'],
    correct: 'Place for the real station, or choose a wider pickup',
    explain: 'A fixed point cannot capture a roving instrument; cover the actual station or choose wider coverage, at the cost of more spill.',
    why: {
      'Ask the player to stay at one spot, just for the mic': 'Never require the musician to stop moving for one spot.',
      'Clip a mic to the shaker so it follows the player': 'A clip on a small moving instrument adds weight, handling noise and risk — and needs the player’s agreement.',
    },
  },
  quickHearing(W),
];

export const I03A_LESSON: SpLesson = {
  id: 'I03a',
  labId: 'percussion',
  title: 'Handheld Shaker',
  subtitle: 'A moving source: one mic outside the arc — toward the mic or side to side',
  noun: { one: 'shaker', many: 'shakers' },
  model: SHK_MODEL,
  micTypeIds: ['orchSdc', 'smallDynCard'],
  zones: SHK_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    setupOrder(W, { text: 'Watch the whole part with the player: the arc, the biggest accent, any moves', early: 'Start with the player and the music.' }, { text: 'Hear it in the room and decide whether an existing mic already carries it', early: 'Hear what the existing mics give before you add one.' }),
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A closed shell — here a clear tube — with loose fill inside. Moved by the hand, the fill rattles against the shell: an idiophone, with no drumhead. Egg shakers and maracas have their own lessons.', src: 'LESSON-SHAKER' },
    { title: 'WHERE YOU MEET IT', text: 'On studio overdubs and live stages, in bands and percussion sections — often one of several small instruments a percussionist moves between at one station.', src: 'DPA-JONAS' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'A steady pulse, accents, a continuous swish. The player’s timing, stroke length, rotation and grip change the balance of accent and wash — and shakers of different sizes and sounds suit different settings.', src: 'MEINL-SH26S' },
    { title: 'ITS SIZE', text: 'Shakers come in many sizes and fills. This lab draws a small clear tube about 16 cm long and 4.5 cm across, held in the right hand — a drawing, not a measured instrument.', src: 'LESSON-SHAKER' },
  ],
  sound: {
    stages: [
      { title: 'The stroke starts', text: 'The hand moves the shell. The loose fill inside does not move with it at first: it lags behind, at the trailing end.' },
      { title: 'The stroke turns', text: 'The shell stops and turns back. The fill keeps going, across the inside of the tube.' },
      { title: 'The fill lands', text: 'The fill hits the end cap and the walls: a burst of tiny impacts — the ATTACK, or accent. Grains rubbing along the wall add the WASH.' },
      { title: 'Sound leaves all round', text: 'The shell passes the impacts to the air from all round. The hand on the shell damps and shields part of it — so the grip changes the sound too.' },
    ],
    attack: 'The fill landing on the end cap when a stroke turns back: a burst of tiny impacts. A short, sharp turn tends to give a stronger accent.',
    body: 'Between the accents, the fill sliding and rubbing along the wall: a continuous wash. A rounded stroke tends to give more wash and less accent. Tendencies — shakers, fills and players vary.',
    head: { diameterMm: 45, rods: 0, label: 'the shaker’s shell', strikeSrc: 'LESSON-SHAKER' },
  },
  setting: {
    items: [
      { id: 'shaker', label: 'the shaker player at the station', short: 'SHAKER', note: 'Standing at a percussion station, often moving between small instruments. The drawing every page of this lesson uses.', prov: { kind: 'illustrative', reason: 'a typical station layout; no source gives positions' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'perc', label: 'other percussion at the station', short: 'PERCUSSION', note: 'Hand drums and a cymbal beside the player: loud, close, and often played in turn. A mic placed for the shaker may miss the next instrument — or hear this one instead.', prov: { kind: 'illustrative', reason: 'a typical station layout' }, tag: 'SPILL · STATIONS', scene: 'kit' },
      { id: 'kit', label: 'the drum kit', short: 'DRUM KIT', note: 'Cymbals and snare a few metres away: the loudest spill into a quiet shaker mic.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'amp', label: 'a guitar amp', short: 'AMP', note: 'Loud and bright upstage. Aim the shaker mic so its rejection, not its front, faces the backline where you can.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'vocal', label: 'a singer’s microphone', short: 'VOCAL MIC', note: 'Another open mic near the station: it hears the shaker too, and the shaker mic hears the voice.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'ANOTHER MIC', scene: 'kit' },
      { id: 'downstage', label: 'a floor wedge downstage of the station', short: 'WEDGE', note: 'On the audience side, behind a mic facing the player and off to one side — a case a pattern’s null can help with.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'fill', label: 'the player’s own monitor', short: 'OWN MON.', note: 'Behind the player, facing them: in FRONT of a mic facing the shaker, where no pattern rejects it.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'the audience and the PA', short: 'AUDIENCE · PA', note: 'The PA faces the audience; every extra open mic hears it — one reason to keep the mic count down.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'FEEDBACK PATH', scene: 'stage' },
      { id: 'area', label: 'a percussion area mic', short: 'AREA MIC', note: 'An overhead or area mic over the percussion may already carry the shaker. Recording, a spot is added only if its pulse needs its own control.', prov: { kind: 'illustrative', reason: 'a typical recording layout' }, tag: 'MAIN PICKUP', scene: 'studio' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a quiet, pleasant room a mic a little farther back adds air and smooths the motion; fans and reflections come in with it.', prov: { kind: 'illustrative', reason: 'a generic studio room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: a dedicated directional mic within reach of the player, monitors and PA in its low-sensitivity directions, soundchecked with the full band. Never add gain to beat feedback.',
    studio: 'RECORDING: choose the room and the shaker first. One mic for one player is usually enough; a room mic only if the room adds something the part needs.',
  },
  diagnostic,
  practice: {
    task: 'Explain a source-first decision, place one safe mic for the whole motion, tell studio and stage priorities apart, and correct one problem by changing the instrument, the player’s spot or the mic — before more gain. With a real shaker and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'inst', label: 'Shaker (shell, fill, size)', kind: 'text' },
      { id: 'motion', label: 'How it was shaken', kind: 'choice', choices: ['toward and away', 'side to side', 'a mix'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser', 'large condenser', 'dynamic', 'other'] },
      { id: 'zone', label: 'Distances you tried (about 30 and 60 cm)', kind: 'text' },
      { id: 'peak', label: 'Peak headroom on the loudest accent', kind: 'text' },
      { id: 'notes', label: 'What you heard (attack, wash, level movement, room, bleed)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The shell size (Ø 45 × 160 mm): no maker prints one — a drawing default.', dims: ['d', 'len'] },
    { text: 'The motion envelope (±150 mm along the shake, ±60 mm across), the arm’s path and the player’s posture — drawing defaults and ILLUSTRATIVE.', dims: ['sweep', 'across'] },
    { text: 'The playing height (h 1150 mm) and the player’s chest plane (250 mm behind the playing area): ILLUSTRATIVE; no height is shown.', dims: [] },
  ],
  live: {
    wedges: [
      {
        id: 'downstage',
        label: 'a floor wedge downstage of the station, facing back toward it',
        short: 'DOWNSTAGE',
        p: { x: 1400, y: 0, z: -600 },
        lift: 150,
        faces: { x: -1, y: 0, z: 0.3 },
        note: 'It sits on the audience side, behind the mic and off to one side — the case a pattern’s null can help with.',
        prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
      },
      {
        id: 'fill',
        label: 'the player’s own monitor, behind them, facing them',
        short: 'OWN MON.',
        p: { x: -1100, y: 0, z: 0 },
        lift: 150,
        faces: { x: 1, y: 0, z: 0 },
        note: 'It sits behind the player, in FRONT of a mic facing the shaker: no pattern null reaches it.',
        prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
      },
    ],
  },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every shaker, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a small clear shaker in two ways of shaking, a few beads standing for the fill, mic patterns and the two-mic comb as textbook shapes, and motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.',
  copy: SHK_COPY,
  sp: {
    strikeTitle: 'Stroke to sound',
    close: { side: { u0: -330, u1: 270, v0: -1420, v1: -960 }, top: { u0: -330, u1: 270, v0: -260, v1: 260 } },
    plan: {
      box: { u0: -2600, u1: 2700, v0: -2100, v1: 2100 },
      things: [
        { id: 'shaker', kind: 'drums', u: 0, v: 0, scene: 'all' },
        { id: 'perc', kind: 'perc', u: -250, v: 1050, scene: 'all' },
        { id: 'kit', kind: 'kit', u: -1500, v: -1350, scene: 'all' },
        { id: 'amp', kind: 'amp', u: -1900, v: 950, face: 0, scene: 'all' },
        { id: 'vocal', kind: 'micstand', u: 1100, v: -1350, scene: 'all' },
        { id: 'downstage', kind: 'wedge', u: 1400, v: -600, face: Math.PI - 0.3, scene: 'stage' },
        { id: 'fill', kind: 'wedge', u: -1100, v: 0, face: 0, scene: 'stage' },
        { id: 'audience', kind: 'audience', u: 2150, v: 0, scene: 'stage' },
        { id: 'area', kind: 'micstand', u: 500, v: 650, scene: 'studio' },
        { id: 'room', kind: 'room', u: 0, v: 0, scene: 'studio' },
      ],
    },
  },
};
